import express from "express";
import path from "path";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { addBookingToFirestore, getBookingsFromFirestore, updateBookingInFirestore } from "./src/lib/firebase";
import type { BookingConfirmation } from "./src/types";

// Load environment variables from .env and .env.local
dotenv.config({ path: ".env" });
dotenv.config({ path: ".env.local" });

type ProcessedReferenceRecord = {
  reference: string;
  status: string;
  amount: number;
  currency: string;
  timestamp: string;
  bookingId?: string;
};

const processedReferences = new Map<string, ProcessedReferenceRecord>();
const PACKAGE_PRICES: Record<string, number> = {
  Single: 100,
  Double: 180,
  'Table of 4': 350,
};
const INSTALLMENT_AMOUNTS = [25, 50, 60, 100, 180, 200, 250, 350];

function buildReference() {
  return `DN-${crypto.randomBytes(6).toString("hex").toUpperCase()}`;
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function sanitizeMetadata(metadata: Record<string, unknown> = {}) {
  const safeMetadata: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(metadata)) {
    if (typeof value === "string") {
      safeMetadata[key] = value.trim();
    } else {
      safeMetadata[key] = value;
    }
  }
  return safeMetadata;
}

function validateAmount(ticketType: string, amount: number, paymentPlan: string) {
  const fullPrice = PACKAGE_PRICES[ticketType];
  if (!fullPrice) return false;

  if (paymentPlan === "full") {
    return amount === fullPrice;
  }

  if (paymentPlan === "installment") {
    return INSTALLMENT_AMOUNTS.includes(Math.round(amount)) && Math.round(amount) < fullPrice;
  }

  return false;
}

async function persistProcessedReference(record: ProcessedReferenceRecord) {
  processedReferences.set(record.reference, record);
  try {
    const existing = await getBookingsFromFirestore();
    const bookingToPersist = existing.find((booking) => booking.paymentRef === record.reference);
    if (bookingToPersist) {
      return;
    }
  } catch (error) {
    console.warn("Unable to check existing bookings before persisting processed reference:", error);
  }
}

async function reconcileBookingFromPayment(reference: string, amount: number, status: string, metadata: Record<string, unknown> = {}) {
  const existingBookings = await getBookingsFromFirestore();
  const existingBooking = existingBookings.find((booking) => {
    if (booking.paymentRef && booking.paymentRef === reference) return true;
    if (booking.id === reference) return true;
    const metadataEmail = typeof metadata.email === "string" ? metadata.email.trim().toLowerCase() : "";
    return Boolean(metadataEmail && booking.registration.email.trim().toLowerCase() === metadataEmail);
  });

  if (existingBooking) {
    const bookingType = existingBooking.registration.ticketType || "Single";
    const fullPrice = PACKAGE_PRICES[bookingType] ?? PACKAGE_PRICES.Single;
    const nextAmountPaid = Math.max(existingBooking.amountPaid ?? 0, amount);
    const nextStatus: BookingConfirmation["status"] = status === "success" && nextAmountPaid >= fullPrice ? "Confirmed" : "Pending";

    await updateBookingInFirestore(existingBooking.id, {
      amountPaid: nextAmountPaid,
      status: nextStatus,
      paymentRef: reference,
      paymentMethod: "Paystack",
    });
    return;
  }

  const fullName = typeof metadata.fullName === "string" ? metadata.fullName.trim() : "";
  const email = typeof metadata.email === "string" ? metadata.email.trim().toLowerCase() : "";
  const phone = typeof metadata.phone === "string" ? metadata.phone.trim() : "";
  const ticketType = typeof metadata.ticketType === "string" ? metadata.ticketType : "Single";
  const quantity = Number(metadata.quantity ?? 1);
  const guestName = typeof metadata.guestName === "string" ? metadata.guestName.trim() : "";
  const price = PACKAGE_PRICES[ticketType] ?? PACKAGE_PRICES.Single;
  const bookingStatus: BookingConfirmation["status"] = status === "success" && amount >= price ? "Confirmed" : "Pending";

  if (!email) {
    return;
  }

  const bookingToCreate: BookingConfirmation = {
    id: `WCF-${reference.slice(0, 8).toUpperCase()}`,
    registration: {
      fullName,
      email,
      phone,
      ticketType: ticketType as BookingConfirmation["registration"]["ticketType"],
      quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : 1,
      guestName: guestName || undefined,
    },
    amountPaid: amount,
    date: new Date().toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" }),
    status: bookingStatus,
    paymentRef: reference,
    paymentMethod: "Paystack",
  };

  await addBookingToFirestore(bookingToCreate);
}

function timingSafeEqual(a: string, b: string) {
  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);
  if (aBuffer.length !== bBuffer.length) {
    return false;
  }
  return crypto.timingSafeEqual(aBuffer, bBuffer);
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT || 3000);

  // Body parser middleware
  app.use(express.json({ verify: (req, _res, buf) => {
    (req as express.Request & { rawBody?: Buffer }).rawBody = buf;
  } }));

  app.post("/api/paystack/initialize", async (req, res) => {
    const { email, amount, reference, metadata = {}, expectedAmount, expectedCurrency, ticketType, paymentPlan } = req.body ?? {};
    const secretKey = process.env.PAYSTACK_SECRET_KEY;

    if (!email || !amount || !reference) {
      return res.status(400).json({ error: "Email, amount, and reference are required." });
    }

    if (!secretKey) {
      return res.status(500).json({ error: "Paystack secret key is not configured." });
    }

    const normalizedEmail = normalizeEmail(String(email));
    const numericAmount = Number(amount);
    const numericExpectedAmount = expectedAmount != null ? Number(expectedAmount) : numericAmount;
    const requestedCurrency = String(expectedCurrency || process.env.PAYSTACK_CURRENCY || "GHS");

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return res.status(400).json({ error: "A valid email address is required." });
    }

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({ error: "Amount must be a valid positive number." });
    }

    if (!validateAmount(String(ticketType || ""), numericExpectedAmount, String(paymentPlan || "full"))) {
      return res.status(400).json({ error: "The supplied payment amount is not allowed for this ticket package." });
    }

    const safeMetadata = sanitizeMetadata(metadata as Record<string, unknown>);

    try {
      const response = await fetch("https://api.paystack.co/transaction/initialize", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${secretKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: normalizedEmail,
          amount: Math.round(numericAmount * 100),
          currency: requestedCurrency,
          reference,
          callback_url: (safeMetadata.callbackUrl as string | undefined) || process.env.PAYSTACK_CALLBACK_URL || process.env.APP_URL || "",
          metadata: {
            ...safeMetadata,
            source: "wcf-dinner-night-26",
          },
          channels: ["card", "bank", "mobile_money", "ussd"],
        }),
      });

      const payload = await response.json();

      if (!response.ok || !payload.status) {
        return res.status(400).json({
          error: payload.message || "Unable to initiate Paystack payment.",
        });
      }

      return res.json({
        authorizationUrl: payload.data?.authorization_url,
        reference: payload.data?.reference,
        accessCode: payload.data?.access_code,
      });
    } catch (error) {
      console.error("Paystack initialization failed:", error);
      return res.status(500).json({ error: "Unable to reach Paystack at the moment." });
    }
  });

  app.post("/api/paystack/verify", async (req, res) => {
    const { reference, expectedAmount, expectedCurrency, ticketType, paymentPlan } = req.body ?? {};
    const secretKey = process.env.PAYSTACK_SECRET_KEY;

    if (!reference) {
      return res.status(400).json({ error: "A payment reference is required." });
    }

    if (!secretKey) {
      return res.status(500).json({ error: "Paystack secret key is not configured." });
    }

    const numericExpectedAmount = expectedAmount != null ? Number(expectedAmount) : null;
    const requestedCurrency = String(expectedCurrency || process.env.PAYSTACK_CURRENCY || "GHS");

    try {
      const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
        headers: {
          Authorization: `Bearer ${secretKey}`,
        },
      });

      const payload = await response.json();

      if (!response.ok || !payload.status) {
        return res.status(400).json({
          error: payload.message || "Unable to verify the Paystack transaction.",
        });
      }

      const transaction = payload.data ?? {};
      const success = transaction.status === "success";
      const amountInGhs = Number(transaction.amount || 0) / 100;

      if (!success) {
        return res.json({ success: false, transaction, status: transaction.status || "failed" });
      }

      if (requestedCurrency && String(transaction.currency || "").toUpperCase() !== requestedCurrency.toUpperCase()) {
        return res.status(400).json({ error: "The verified transaction currency does not match the configured currency." });
      }

      if (numericExpectedAmount != null && !Number.isNaN(numericExpectedAmount) && Math.abs(amountInGhs - numericExpectedAmount) > 0.01) {
        return res.status(400).json({ error: "The verified payment amount does not match the expected registration amount." });
      }

      if (ticketType && paymentPlan && !validateAmount(String(ticketType), numericExpectedAmount ?? Number(amountInGhs), String(paymentPlan))) {
        return res.status(400).json({ error: "The payment plan or amount is invalid." });
      }

      if (processedReferences.has(reference)) {
        return res.json({ success: true, transaction, duplicate: true });
      }

      const record: ProcessedReferenceRecord = {
        reference,
        status: transaction.status,
        amount: amountInGhs,
        currency: String(transaction.currency || requestedCurrency),
        timestamp: new Date().toISOString(),
      };
      await persistProcessedReference(record);
      await reconcileBookingFromPayment(reference, amountInGhs, transaction.status || "success", {});

      return res.json({ success: true, transaction });
    } catch (error) {
      console.error("Paystack verification failed:", error);
      return res.status(500).json({ error: "Unable to verify the transaction right now." });
    }
  });

  app.post("/api/paystack/webhook", async (req, res) => {
    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    const webhookSecret = process.env.PAYSTACK_WEBHOOK_SECRET;
    const rawBody = (req as express.Request & { rawBody?: Buffer }).rawBody;
    const signature = req.headers["x-paystack-signature"];

    if (!secretKey) {
      return res.status(500).json({ error: "Paystack secret key is not configured." });
    }

    if (!webhookSecret) {
      return res.status(500).json({ error: "Paystack webhook secret is not configured." });
    }

    if (!rawBody || typeof signature !== "string") {
      return res.status(401).json({ error: "Missing webhook signature or request body." });
    }

    const expectedSignature = crypto.createHmac("sha512", webhookSecret).update(rawBody).digest("hex");
    if (!timingSafeEqual(expectedSignature, signature)) {
      return res.status(401).json({ error: "Invalid webhook signature." });
    }

    const event = req.body as {
      event?: string;
      data?: {
        reference?: string;
        status?: string;
        amount?: number;
        currency?: string;
        metadata?: Record<string, unknown>;
      };
    };
    const eventType = event?.event;
    const reference = event?.data?.reference;

    if (eventType === "charge.success" && reference) {
      const record: ProcessedReferenceRecord = {
        reference,
        status: event.data?.status || "success",
        amount: Number(event.data?.amount || 0) / 100,
        currency: String(event.data?.currency || process.env.PAYSTACK_CURRENCY || "GHS"),
        timestamp: new Date().toISOString(),
      };
      await persistProcessedReference(record);
      await reconcileBookingFromPayment(reference, Number(event.data?.amount || 0) / 100, event.data?.status || "success", event.data?.metadata || {});
      console.log(`[Paystack] Webhook success for ${reference}`);
      return res.sendStatus(200);
    }

    if (reference) {
      const record: ProcessedReferenceRecord = {
        reference,
        status: event?.data?.status || eventType || "failed",
        amount: Number(event?.data?.amount || 0) / 100,
        currency: String(event?.data?.currency || process.env.PAYSTACK_CURRENCY || "GHS"),
        timestamp: new Date().toISOString(),
      };
      await persistProcessedReference(record);
      await reconcileBookingFromPayment(reference, Number(event?.data?.amount || 0) / 100, event?.data?.status || eventType || "failed", event?.data?.metadata || {});
      console.log(`[Paystack] Webhook event ${eventType} for ${reference}`);
    }

    return res.sendStatus(200);
  });

  // Vite middleware for development or serve built files in production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT} under NODE_ENV=${process.env.NODE_ENV || "development"}`);
  });
}

startServer();
