/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { ArrowRight, User, Mail, Phone, Ticket, CheckCircle, Printer, Copy, Loader2, ArrowLeft, Flame, Sparkles, Download, Calendar, ExternalLink, Lock, AlertTriangle, Key, Info } from 'lucide-react';
import { motion } from 'motion/react';
import { ViewPath, RegistrationData, BookingConfirmation, TicketType } from '../types';
import { TICKET_PACKAGES } from './TicketSection';
import { addBookingToFirestore, getBookingsFromFirestore } from '../lib/firebase';
import WcfLogo from './WcfLogo';
import WinnersLogo from './WinnersLogo';
// @ts-ignore
import heroBg from '../assets/images/dark_skinned_toast_1779788617328.png';

const SEED_ATTENDEES_FALLBACK = (): BookingConfirmation[] => [
  {
    id: 'WCF-882910',
    registration: {
      fullName: 'Prof. Ebenezer Osei',
      email: 'e.osei@knust.edu.gh',
      phone: '+233 24 551 0021',
      ticketType: 'Single',
      quantity: 1,
    },
    amountPaid: 0,
    date: 'May 22, 2026',
    status: 'Confirmed'
  },
  {
    id: 'WCF-392014',
    registration: {
      fullName: 'Dr. Seraphina Lawson',
      email: 's.lawson@knust.edu.gh',
      phone: '+233 20 188 3491',
      ticketType: 'Double',
      quantity: 2,
      guestName: 'Andrews Lawson'
    },
    amountPaid: 0,
    date: 'May 23, 2026',
    status: 'Confirmed'
  },
  {
    id: 'WCF-739210',
    registration: {
      fullName: 'Gloria Mensah',
      email: 'g.mensah@wcf.org',
      phone: '+233 55 921 8210',
      ticketType: 'Single',
      quantity: 1,
    },
    amountPaid: 0,
    date: 'May 24, 2026',
    status: 'Confirmed'
  }
];

interface RegistrationFormProps {
  selectedTicketType: TicketType;
  setSelectedTicketType: (type: TicketType) => void;
  setView: (view: ViewPath) => void;
}

export default function RegistrationForm({ selectedTicketType, setSelectedTicketType, setView }: RegistrationFormProps) {
  const [formData, setFormData] = useState<RegistrationData>({
    fullName: '',
    email: '',
    phone: '',
    ticketType: selectedTicketType,
    quantity: 1,
    guestName: '',
  });

  const selectedPkg = TICKET_PACKAGES.find(p => p.type === formData.ticketType) || TICKET_PACKAGES[0];
  const [selectedPayment, setSelectedPayment] = useState<number>(selectedPkg.price);
  const [paymentPlan, setPaymentPlan] = useState<'full' | 'installment'>('full');

  const [formErrors, setFormErrors] = useState<Partial<Record<keyof RegistrationData, string>>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialLoading(false);
    }, 850);
    return () => clearTimeout(timer);
  }, []);
  
  // Custom multi-step flow state
  const [step, setStep] = useState<'form' | 'ticket' | 'thanks'>('form');
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
  
  // Generate random confetti config once when payment succeeds
  const [confetti, setConfetti] = useState<Array<{
    id: number;
    color: string;
    left: string;
    delay: number;
    duration: number;
    size: number;
    shape: 'circle' | 'square' | 'triangle' | 'star';
    xOffset: number;
  }>>([]);

  useEffect(() => {
    if (showSuccessOverlay) {
      const colors = ['#B38F6F', '#dc2626', '#facc15', '#ffffff', '#10b981', '#3b82f6'];
      const shapes: Array<'circle' | 'square' | 'triangle' | 'star'> = ['circle', 'square', 'triangle', 'star'];
      const newConfetti = Array.from({ length: 65 }).map((_, i) => ({
        id: i,
        color: colors[Math.floor(Math.random() * colors.length)],
        left: `${Math.random() * 100}%`,
        delay: Math.random() * 2,
        duration: 2.5 + Math.random() * 3,
        size: 6 + Math.random() * 10,
        shape: shapes[Math.floor(Math.random() * shapes.length)],
        xOffset: -80 + Math.random() * 160,
      }));
      setConfetti(newConfetti);
    } else {
      setConfetti([]);
    }
  }, [showSuccessOverlay]);
  
  // Confirmed booking / ticket data
  const [confirmedBooking, setConfirmedBooking] = useState<BookingConfirmation | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [countdown, setCountdown] = useState(15);
  const [tallyNotice, setTallyNotice] = useState<{
    isNew: boolean;
    addedPayment: number;
    previousPaid: number;
    totalPaid: number;
    fullPrice: number;
  } | null>(null);

  const [existingBooking, setExistingBooking] = useState<BookingConfirmation | undefined>(undefined);

  const getInstallmentOptions = (packagePrice: number) => {
    const list = [5, 25, 50, 60, 100, 180, 200, 250, 350];
    return list.filter(amt => amt <= packagePrice);
  };

  // Sync initial state selection and update default payment amount
  useEffect(() => {
    setFormData(prev => ({ ...prev, ticketType: selectedTicketType }));
    const pkg = TICKET_PACKAGES.find(p => p.type === selectedTicketType) || TICKET_PACKAGES[0];
    setSelectedPayment(pkg.price);
    setPaymentPlan('full');
  }, [selectedTicketType]);

  // Handle countdown redirection on 'thanks' step
  useEffect(() => {
    if (step !== 'thanks') return;
    const timer = setInterval(() => {
      setCountdown(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [step]);

  // Handle redirect when countdown reaches zero
  useEffect(() => {
    if (step === 'thanks' && countdown <= 0) {
      setView('home');
    }
  }, [countdown, step, setView]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'ticketType') {
      const type = value as TicketType;
      setSelectedTicketType(type);
      const pkg = TICKET_PACKAGES.find(p => p.type === type) || TICKET_PACKAGES[0];
      setSelectedPayment(pkg.price); // Default to full payment on change
      setPaymentPlan('full');
      setFormData(prev => ({
        ...prev,
        ticketType: type,
        quantity: type === 'Table of 4' ? 4 : (type === 'Double' ? 2 : 1),
        guestName: ''
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }

    // Clear field-specific error
    if (formErrors[name as keyof RegistrationData]) {
      setFormErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = () => {
    const errors: Partial<Record<keyof RegistrationData, string>> = {};
    if (!formData.fullName.trim()) errors.fullName = 'Full Name is required';
    if (!formData.email.trim()) {
      errors.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Please provide a valid email';
    }
    if (!formData.phone.trim()) {
      errors.phone = 'Phone number is required';
    } else if (formData.phone.replace(/\D/g, '').length < 9) {
      errors.phone = 'Please enter a valid phone number';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const completeBooking = async (
    bookingReference: string,
    paymentType: string,
    bookingContext?: {
      formData?: RegistrationData;
      selectedPayment?: number;
      existingBooking?: BookingConfirmation;
      selectedTicketType?: TicketType;
    }
  ) => {
    const currentFormData = bookingContext?.formData ?? formData;
    const currentSelectedPayment = bookingContext?.selectedPayment ?? selectedPayment;
    const currentExistingBooking = bookingContext?.existingBooking ?? existingBooking;
    const currentTicketType = bookingContext?.selectedTicketType ?? (currentExistingBooking ? currentExistingBooking.registration.ticketType : currentFormData.ticketType);
    const currentSelectedPkg = TICKET_PACKAGES.find(p => p.type === currentTicketType) || TICKET_PACKAGES[0];
    const pkgPrice = currentSelectedPkg.price;

    let bookingToSave: BookingConfirmation;

    if (currentExistingBooking) {
      const oldPaid = currentExistingBooking.amountPaid !== undefined ? currentExistingBooking.amountPaid : pkgPrice;
      const newTotalPaid = oldPaid + currentSelectedPayment;
      const finalPaid = Math.min(newTotalPaid, pkgPrice);

      bookingToSave = {
        ...currentExistingBooking,
        amountPaid: finalPaid,
        status: finalPaid >= pkgPrice ? 'Confirmed' : 'Pending',
        paymentRef: bookingReference,
        paymentMethod: paymentType,
        registration: {
          ...currentExistingBooking.registration,
          fullName: currentFormData.fullName || currentExistingBooking.registration.fullName,
          phone: currentFormData.phone || currentExistingBooking.registration.phone,
        }
      };

      setTallyNotice({
        isNew: false,
        addedPayment: currentSelectedPayment,
        previousPaid: oldPaid,
        totalPaid: finalPaid,
        fullPrice: pkgPrice
      });
    } else {
      const mockId = 'WCF-' + Math.floor(100000 + Math.random() * 900000);
      bookingToSave = {
        id: mockId,
        registration: { ...currentFormData },
        amountPaid: currentSelectedPayment,
        date: new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }),
        status: currentSelectedPayment >= currentSelectedPkg.price ? 'Confirmed' : 'Pending',
        paymentRef: bookingReference,
        paymentMethod: paymentType
      };

      setTallyNotice({
        isNew: true,
        addedPayment: currentSelectedPayment,
        previousPaid: 0,
        totalPaid: currentSelectedPayment,
        fullPrice: currentSelectedPkg.price
      });
    }

    try {
      // Save/persist into Firebase
      await addBookingToFirestore(bookingToSave);
      
      // Sync into local state/cache fallback
      const stored = localStorage.getItem('wcf_registrations');
      let registrationsList = SEED_ATTENDEES_FALLBACK();
      if (stored && stored !== "undefined") {
        try {
          registrationsList = JSON.parse(stored);
        } catch (e) {
          console.error("Failed to parse registrations list from local storage:", e);
        }
      }
      const existingIdx = registrationsList.findIndex((r: BookingConfirmation) => r.id === bookingToSave.id);
      
      let updatedList;
      if (existingIdx !== -1) {
        updatedList = [...registrationsList];
        updatedList[existingIdx] = bookingToSave;
      } else {
        updatedList = [bookingToSave, ...registrationsList];
      }
      localStorage.setItem('wcf_registrations', JSON.stringify(updatedList));
    } catch (err) {
      console.error('Saving registration to database failed:', err);
    }

    setConfirmedBooking(bookingToSave);
    setIsGenerating(false);
    setShowSuccessOverlay(true);
    setStep('ticket');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const verifyPendingPayment = async () => {
      const params = new URLSearchParams(window.location.search);
      const reference = params.get('reference') || params.get('trxref');
      if (!reference) return;

      const pendingStorage = sessionStorage.getItem('wcf_pending_payment');
      if (!pendingStorage) return;

      try {
        setIsGenerating(true);
        const pendingContext = JSON.parse(pendingStorage) as {
          formData: RegistrationData;
          selectedPayment: number;
          selectedTicketType: TicketType;
          paymentPlan?: 'full' | 'installment';
          existingBooking?: BookingConfirmation;
        };

        const verifyResponse = await fetch('/api/paystack/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reference,
            expectedAmount: pendingContext.selectedPayment,
            expectedCurrency: 'GHS',
            ticketType: pendingContext.selectedTicketType,
            paymentPlan: pendingContext.paymentPlan || 'full',
          }),
        });

        const verifyData = await verifyResponse.json();
        if (!verifyResponse.ok || !verifyData.success) {
          throw new Error(verifyData.error || 'Payment verification failed.');
        }

        await completeBooking(reference, 'Paystack', {
          formData: pendingContext.formData,
          selectedPayment: pendingContext.selectedPayment,
          existingBooking: pendingContext.existingBooking,
          selectedTicketType: pendingContext.selectedTicketType,
        });

        sessionStorage.removeItem('wcf_pending_payment');
        const nextUrl = new URL(window.location.href);
        nextUrl.searchParams.delete('reference');
        nextUrl.searchParams.delete('trxref');
        window.history.replaceState({}, '', `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`);
      } catch (error) {
        console.error('Paystack verification failed:', error);
        setIsGenerating(false);
        window.alert(error instanceof Error ? error.message : 'Payment verification failed.');
      }
    };

    void verifyPendingPayment();
  }, []);

  const handleFormSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsGenerating(true);
    
    let foundBooking: BookingConfirmation | undefined = undefined;
    
    try {
      // Query deep Firestore db for any existing reservation under the same email address
      const dbBookings = await getBookingsFromFirestore();
      foundBooking = dbBookings.find(b => 
        b.registration.email.trim().toLowerCase() === formData.email.trim().toLowerCase()
      );
    } catch (err) {
      console.error("Error fetching bookings for automatic payment tallying:", err);
      // Fallback local persistence lookup
      const stored = localStorage.getItem('wcf_registrations');
      let localList: BookingConfirmation[] = [];
      if (stored && stored !== "undefined") {
        try {
          localList = JSON.parse(stored);
        } catch (e) {
          console.error("Failed to parse local list from local storage:", e);
        }
      }
      foundBooking = localList.find(b => 
        b.registration.email.trim().toLowerCase() === formData.email.trim().toLowerCase()
      );
    }

    setExistingBooking(foundBooking);
    
    const ref = `DN-${window.crypto.randomUUID().replace(/-/g, '').slice(0, 12).toUpperCase()}`;
    const paystackPublicKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY as string | undefined;

    if (!paystackPublicKey) {
      await completeBooking(ref, "Direct Registration");
      return;
    }

    const sanitizedFormData = {
      fullName: formData.fullName.trim(),
      email: formData.email.trim().toLowerCase(),
      phone: formData.phone.trim(),
      ticketType: formData.ticketType,
      quantity: formData.quantity,
      guestName: (formData.guestName || '').trim(),
    };

    try {
      const initResponse = await fetch('/api/paystack/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: sanitizedFormData.email,
          amount: selectedPayment,
          reference: ref,
          expectedAmount: selectedPayment,
          expectedCurrency: 'GHS',
          ticketType: sanitizedFormData.ticketType,
          paymentPlan,
          callbackUrl: `${window.location.origin}${window.location.pathname}`,
          metadata: {
            fullName: sanitizedFormData.fullName,
            ticketType: sanitizedFormData.ticketType,
            quantity: sanitizedFormData.quantity,
            guestName: sanitizedFormData.guestName || '',
          },
        }),
      });

      const initData = await initResponse.json();
      if (!initResponse.ok || !initData.authorizationUrl) {
        throw new Error(initData.error || 'Unable to start Paystack checkout.');
      }

      sessionStorage.setItem('wcf_pending_payment', JSON.stringify({
        formData: sanitizedFormData,
        selectedPayment,
        selectedTicketType: sanitizedFormData.ticketType,
        existingBooking: foundBooking,
      }));

      window.location.assign(initData.authorizationUrl);
    } catch (error) {
      console.error('Paystack checkout failed:', error);
      setIsGenerating(false);
      window.alert(error instanceof Error ? error.message : 'Payment checkout could not be started.');
    }
  };

  const copyRefCode = () => {
    if (confirmedBooking) {
      navigator.clipboard.writeText(confirmedBooking.id);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleDownloadTicket = () => {
    if (!confirmedBooking) return;
    
    // Construct real scannable QR ticket data info
    const qrData = `WCF-KNUST Dinner Night '26\nTicket: ${confirmedBooking.id}\nName: ${confirmedBooking.registration.fullName}\nType: ${confirmedBooking.registration.ticketType} Pass\nStatus: CONFIRMED ADMISSION\nDate: September 4, 2026\nVenue: TBD`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrData)}`;

    const drawAndSave = (loadedQrImg: HTMLImageElement | null, loadedBgImg: HTMLImageElement | null) => {
      // Create an offscreen canvas with high DPI density
      const canvas = document.createElement('canvas');
      canvas.width = 1200;
      canvas.height = 460;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Premium gradients for luxurious crimson/gold textured ticket
      const cardGradient = ctx.createLinearGradient(0, 0, 1200, 460);
      cardGradient.addColorStop(0, '#100003');
      cardGradient.addColorStop(0.3, '#210006');
      cardGradient.addColorStop(0.7, '#140003');
      cardGradient.addColorStop(1, '#0c0001');
      ctx.fillStyle = cardGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw beautiful luxury hands / wine glasses cinematic backdrop from hero Bg
      if (loadedBgImg) {
        ctx.save();
        ctx.globalAlpha = 0.08; // 8% opacity, beautifully dim and integrated
        const imgRatio = loadedBgImg.width / loadedBgImg.height;
        const canvasRatio = canvas.width / canvas.height;
        let sx = 0, sy = 0, sw = loadedBgImg.width, sh = loadedBgImg.height;
        if (imgRatio > canvasRatio) {
          sw = loadedBgImg.height * canvasRatio;
          sx = (loadedBgImg.width - sw) / 2;
        } else {
          sh = loadedBgImg.width / canvasRatio;
          sy = (loadedBgImg.height - sh) / 2;
        }
        ctx.drawImage(loadedBgImg, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
        ctx.restore();
      }

      // Draw artistic logarithmic spiral mathematical overlay designs on canvas
      const drawCanvasSpiral = (cx: number, cy: number, startR: number, endR: number, turns: number, color: string, lineWidth: number) => {
        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
        ctx.beginPath();
        const maxTh = turns * Math.PI * 2;
        for (let th = 0; th < maxTh; th += 0.05) {
          const factor = th / maxTh;
          const r = startR + (endR - startR) * factor;
          const x = cx + r * Math.cos(th);
          const y = cy + r * Math.sin(th);
          if (th === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
        ctx.restore();
      };

      // Draw three elegant, low-opacity geometric spiral layers
      drawCanvasSpiral(200, 230, 20, 220, 10, 'rgba(179, 143, 111, 0.04)', 1);
      drawCanvasSpiral(700, 230, 10, 180, 8, 'rgba(179, 143, 111, 0.03)', 1);
      drawCanvasSpiral(1032, 230, 10, 130, 6, 'rgba(179, 143, 111, 0.035)', 0.75);

      // Draw elegant wine glass outline in the background of main ticket body
      const drawCanvasWineGlass = (cx: number, cy: number, scale: number) => {
        ctx.save();
        
        // Faint red wine beverage filling the glass bowl (with very low opacity)
        ctx.fillStyle = 'rgba(139, 0, 22, 0.04)';
        const liquidTopY = cy - 25 * scale;
        const bowlBottomY = cy + 10 * scale;
        ctx.beginPath();
        ctx.moveTo(cx - 36 * scale, liquidTopY);
        ctx.lineTo(cx + 36 * scale, liquidTopY);
        ctx.bezierCurveTo(cx + 38 * scale, cy - 10 * scale, cx + 30 * scale, bowlBottomY, cx, bowlBottomY + 2 * scale);
        ctx.bezierCurveTo(cx - 30 * scale, bowlBottomY, cx - 38 * scale, cy - 10 * scale, cx - 36 * scale, liquidTopY);
        ctx.fill();

        // Faint liquid surface ellipse
        ctx.fillStyle = 'rgba(139, 0, 22, 0.06)';
        ctx.beginPath();
        ctx.ellipse(cx, liquidTopY, 36 * scale, 4 * scale, 0, 0, Math.PI * 2);
        ctx.fill();

        // Outer glass wireframe details
        ctx.strokeStyle = 'rgba(179, 143, 111, 0.06)';
        ctx.lineWidth = 1;

        // Bowl silhouette
        const rimHalfW = 40 * scale;
        const topY = cy - 80 * scale;
        ctx.beginPath();
        ctx.moveTo(cx - rimHalfW, topY);
        ctx.bezierCurveTo(cx - rimHalfW - 5 * scale, cy - 10 * scale, cx - 15 * scale, bowlBottomY, cx, bowlBottomY);
        ctx.bezierCurveTo(cx + 15 * scale, bowlBottomY, cx + rimHalfW + 5 * scale, cy - 10 * scale, cx + rimHalfW, topY);
        ctx.stroke();

        // Glass lip rim
        ctx.beginPath();
        ctx.ellipse(cx, topY, rimHalfW, 6 * scale, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Elegant long stem
        ctx.beginPath();
        ctx.moveTo(cx, bowlBottomY);
        ctx.lineTo(cx, cy + 96 * scale);
        ctx.stroke();

        // Sturdy foot base
        ctx.beginPath();
        ctx.ellipse(cx, cy + 97 * scale, 45 * scale, 7 * scale, 0, 0, Math.PI * 2);
        ctx.stroke();

        ctx.restore();
      };

      // Draw the beautiful wine glass at (550, 220) with scale 1.45
      drawCanvasWineGlass(550, 220, 1.45);

      // Gold frame line margin
      ctx.strokeStyle = '#B38F6F';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(20, 20, 1160, 420);

      // Semicircular ticket punch cutout notches at divider (X = 864)
      const notchX = 864;
      
      // Top Punch (shading out border and drawing gold circle stroke)
      ctx.fillStyle = '#0a0a0c'; // main background underlay
      ctx.beginPath();
      ctx.arc(notchX, 20, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#B38F6F';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(notchX, 20, 18, 0, Math.PI, false);
      ctx.stroke();

      // Bottom Punch
      ctx.fillStyle = '#0a0a0c';
      ctx.beginPath();
      ctx.arc(notchX, 440, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#B38F6F';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(notchX, 440, 18, Math.PI, 0, false);
      ctx.stroke();

      // Perforation line split (between main portion and stub)
      ctx.strokeStyle = 'rgba(179, 143, 111, 0.3)';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 7]);
      ctx.beginPath();
      ctx.moveTo(notchX, 42);
      ctx.lineTo(notchX, 418);
      ctx.stroke();
      ctx.setLineDash([]); // Reset line dash

      // Side end notches to complete classic cinema/ticket ticket shape
      ctx.fillStyle = '#0a0a0c';
      ctx.beginPath();
      ctx.arc(20, 230, 15, 0, Math.PI * 2);
      ctx.arc(1180, 230, 15, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#B38F6F';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(20, 230, 15, -Math.PI/2, Math.PI/2, false);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(1180, 230, 15, Math.PI/2, -Math.PI/2, false);
      ctx.stroke();

      // MAIN CONTENT (Left of notchX)
      // Header WCF Logo placeholder labels
      ctx.fillStyle = '#B38F6F';
      ctx.font = 'bold 11px "Courier New", Courier, monospace';
      ctx.fillText('DN26 // ADMISSION PASS', 50, 60);

      // Group presenter presentation Line
      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.font = 'italic 12px Georgia, serif';
      ctx.fillText("Winners' Chapel Int. & WCF Present", 50, 85);

      // Title header
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 26px Georgia, serif';
      ctx.fillText('ANNUAL GOLDEN BANQUET', 50, 122);

      // Horizontal subtle gold bar line
      ctx.strokeStyle = 'rgba(179, 143, 111, 0.2)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(50, 145);
      ctx.lineTo(820, 145);
      ctx.stroke();

      // Guest info
      ctx.fillStyle = 'rgba(179, 143, 111, 0.75)';
      ctx.font = 'bold 10px "Courier New", Courier, monospace';
      ctx.fillText('PRIMARY ADMISSION GUEST:', 50, 180);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 36px Georgia, serif';
      ctx.fillText(confirmedBooking.registration.fullName, 50, 222);

      // Details Columns: Tier, ID, Date, Venue
      ctx.fillStyle = 'rgba(179, 143, 111, 0.75)';
      ctx.font = 'bold 10px "Courier New", Courier, monospace';
      ctx.fillText('TICKET SEATING', 50, 265);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px "Helvetica Neue", Arial';
      ctx.fillText(`${confirmedBooking.registration.ticketType || 'Single'} PASS`, 50, 286);

      ctx.fillStyle = 'rgba(179, 143, 111, 0.75)';
      ctx.font = 'bold 10px "Courier New", Courier, monospace';
      ctx.fillText('ADMISSION REF CODE', 240, 265);
      ctx.fillStyle = '#B38F6F';
      ctx.font = 'bold 14px "Courier New"';
      ctx.fillText(confirmedBooking.id, 240, 286);

      ctx.fillStyle = 'rgba(179, 143, 111, 0.75)';
      ctx.font = 'bold 10px "Courier New", Courier, monospace';
      ctx.fillText('BANQUET DATE', 450, 265);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 13px "Courier New"';
      ctx.fillText('Friday, September 4, 2026', 450, 286);

      // Location bar row
      ctx.fillStyle = 'rgba(179, 143, 111, 0.04)';
      ctx.fillRect(50, 312, 770, 48);
      ctx.strokeStyle = 'rgba(179, 143, 111, 0.15)';
      ctx.strokeRect(50, 312, 770, 48);

      ctx.fillStyle = 'rgba(179, 143, 111, 0.8)';
      ctx.font = 'bold 9.5px "Courier New", Courier, monospace';
      ctx.fillText('VENUE:', 65, 340);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px "Helvetica Neue"';
      ctx.fillText('TBD', 128, 340);

      // Realistic Barcode graphics render
      const barcodeX = 50;
      const barcodeY = 380;
      const barcodeH = 34;
      ctx.fillStyle = '#ffffff';
      let currentBarX = barcodeX;
      for (let i = 0; i < 75; i++) {
        const barW = [1, 2.5, 1, 4.5, 1, 1, 6, 1, 2.5][i % 9];
        const spacing = [1, 2.5, 1, 1, 4.5, 1, 2.5][i % 7];
        ctx.fillRect(currentBarX, barcodeY, barW, barcodeH);
        currentBarX += barW + spacing;
      }
      // barcode numeric identification string
      ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.font = '9px "Courier New", Courier, monospace';
      ctx.fillText(`*DN-2026-${confirmedBooking.id}*`, 50, 428);


      // STUB CONTENT (Right of notchX)
      const stubCenter = notchX + (1200 - notchX) / 2;
      
      ctx.fillStyle = '#B38F6F';
      ctx.font = 'bold 10px "Courier New", Courier, monospace';
      ctx.textAlign = 'center';
      ctx.fillText('ADMIT ONE STUB', stubCenter, 60);

      ctx.strokeStyle = 'rgba(179, 143, 111, 0.15)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(notchX + 30, 75);
      ctx.lineTo(1200 - 30, 75);
      ctx.stroke();

      // Draw QR image or simulation fallback
      const stubQrX = stubCenter - 75;
      const stubQrY = 100;
      const stubQrSize = 150;

      if (loadedQrImg) {
        ctx.fillStyle = '#ffffff';
         ctx.fillRect(stubQrX, stubQrY, stubQrSize, stubQrSize);
        ctx.drawImage(loadedQrImg, stubQrX + 6, stubQrY + 6, stubQrSize - 12, stubQrSize - 12);
      } else {
        // Render stylized backup elements
        ctx.fillStyle = '#B38F6F';
        ctx.fillRect(stubQrX, stubQrY, stubQrSize, stubQrSize);
      }

      // Draw overlay tiny badge on stub QR
      ctx.fillStyle = '#0c0001';
      ctx.beginPath();
      ctx.arc(stubCenter, stubQrY + stubQrSize / 2, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#B38F6F';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = '#B38F6F';
      ctx.font = 'bold 8px "Courier New"';
      ctx.fillText('WCF', stubCenter, stubQrY + stubQrSize / 2 + 2);

      // Bottom Stub identifiers
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 13px "Courier New", Courier, monospace';
      ctx.fillText(confirmedBooking.id, stubCenter, 290);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.font = '9px "Courier New", Courier, monospace';
      ctx.fillText('ANNUAL BANQUET', stubCenter, 320);

      ctx.fillStyle = '#B38F6F';
      ctx.font = 'bold 8.5px "Courier New", Courier, monospace';
      ctx.fillText('SCAN TO VALIDATE', stubCenter, 350);

      // Vertical mini ticket barcode on stub
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.fillRect(stubCenter - 80, 375, 160, 20);
      ctx.fillStyle = '#B38F6F';
      let sbX = stubCenter - 75;
      for (let i = 0; i < 35; i++) {
        const barW = [1, 2, 1, 3, 1][i % 5];
        const spacing = [1, 2, 1][i % 3];
        ctx.fillRect(sbX, 375, barW, 20);
        sbX += barW + spacing;
      }
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.font = '7.5px "Courier New"';
      ctx.fillText(`SEQ-${confirmedBooking.id}`, stubCenter, 412);

      // Restore baseline state
      ctx.textAlign = 'left';

      // Save/Download link trigger
      try {
        const dataUrl = canvas.toDataURL('image/png', 1.0);
        const link = document.createElement('a');
        link.download = `WCF_Banquet_Ticket_${confirmedBooking.id}.png`;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (err) {
        console.warn('Canvas export failed, running window print default:', err);
        window.print();
      }
    };

    // Load QR from server and local background image asynchronously to render them perfectly!
    const qrImg = new Image();
    qrImg.crossOrigin = 'anonymous';

    const bgImg = new Image();
    bgImg.crossOrigin = 'anonymous';

    let qrLoaded = false;
    let bgLoaded = false;
    let loadedQr: HTMLImageElement | null = null;
    let loadedBg: HTMLImageElement | null = null;

    const checkAndDraw = () => {
      if (qrLoaded && bgLoaded) {
        drawAndSave(loadedQr, loadedBg);
      }
    };

    qrImg.onload = () => {
      qrLoaded = true;
      loadedQr = qrImg;
      checkAndDraw();
    };
    qrImg.onerror = () => {
      qrLoaded = true;
      checkAndDraw();
    };

    bgImg.onload = () => {
      bgLoaded = true;
      loadedBg = bgImg;
      checkAndDraw();
    };
    bgImg.onerror = () => {
      bgLoaded = true;
      checkAndDraw();
    };

    qrImg.src = qrUrl;
    bgImg.src = heroBg;
  };

  const downloadICSFile = (ticketId: string) => {
    const title = "WCF KNUST Annual Golden Banquet";
    const desc = `Congratulations! Your Admission Seat is secured. Ticket Code: ${ticketId}. Please bring your downloaded ticket pass to the entrance.`;
    const loc = "TBD";
    const startDate = "20260904T190000"; // September 4, 2026, 7:00 PM GMT
    const endDate = "20260904T230000";   // September 4, 2026, 11:00 PM GMT

    const icsStr = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//WCF KNUST//Annual Golden Banquet//EN",
      "BEGIN:VEVENT",
      `UID:${ticketId}@wcfknust.org`,
      `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
      `DTSTART:${startDate}`,
      `DTEND:${endDate}`,
      `SUMMARY:${title}`,
      `DESCRIPTION:${desc}`,
      `LOCATION:${loc}`,
      "END:VEVENT",
      "END:VCALENDAR"
    ].join("\r\n");

    const blob = new Blob([icsStr], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `WCF_Golden_Banquet_2026.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  // 3. STEP: THANK YOU PAGE
  if (step === 'thanks' && confirmedBooking) {
    const pkgPrice = TICKET_PACKAGES.find(p => p.type === confirmedBooking.registration.ticketType)?.price || 100;
    const isFullyPaid = confirmedBooking.amountPaid >= pkgPrice;

    return (
      <section className="min-h-screen pt-32 pb-24 px-6 md:px-12 bg-obsidian flex flex-col justify-center items-center relative overflow-hidden">
        <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[60vw] h-[60vw] rounded-full crimson-gradient opacity-40 blur-[120px] pointer-events-none" />
        
        <div className="w-full max-w-xl text-center relative z-10 animate-fade-in-up">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-crimson/15 border border-sand/40 text-sand mb-8">
            <Sparkles className="w-10 h-10 animate-pulse" />
          </div>

          <h2 className="text-4xl md:text-5xl font-serif text-pearl leading-tight mb-4">
            Thank You, {confirmedBooking.registration.fullName}!
          </h2>
          
          <div className="w-12 h-[1px] bg-sand mx-auto my-6" />

          <p className="text-base text-pearl/80 font-light leading-relaxed mb-8">
            {isFullyPaid
              ? `Your reservation for the WCF-KNUST Dinner Night '26 is successfully cataloged. We look forward to hosting you for this unforgettable evening of elegance, refined fellowship, and divine connection.`
              : `Your reservation has been recorded and your ticket remains locked until the outstanding balance is paid in full.`}
          </p>

          <div className="p-6 bg-pearl/[0.02] border border-sand/10 rounded-sm mb-10 max-w-md mx-auto">
            <p className="text-[10px] font-mono uppercase tracking-widest text-[#B38F6F]">Admission Code</p>
            {isFullyPaid ? (
              <p className="text-xl font-mono text-pearl font-bold tracking-widest mt-1">{confirmedBooking.id}</p>
            ) : (
              <p className="text-[11px] font-mono text-amber-500 font-bold uppercase tracking-wider mt-2 select-none">
                [ LOCKED - BALANCE OUTSTANDING ]
              </p>
            )}
            
            {isFullyPaid ? (
              <p className="text-xs text-pearl/40 mt-3">
                A digital confirmation letter and schedule updates have been dispatched to <span className="text-pearl/70 font-medium">{confirmedBooking.registration.email}</span>.
              </p>
            ) : (
              <p className="text-xs text-pearl/45 mt-3 leading-relaxed">
                Your pre-registration has been logged under an installment plan. Scannable ticket data and entry credentials remain <strong>locked</strong> until the remaining balance is paid.
              </p>
            )}
          </div>

          {/* Countdown & Actions */}
          <div className="flex flex-col items-center gap-4">
            <p className="text-xs font-mono tracking-widest text-sand/60">
              Returning to Home Screen automatically in <span className="text-sand font-bold font-mono text-sm">{countdown}s</span>
            </p>
            
            <button
              onClick={() => {
                setView('home');
              }}
              className="px-8 py-3.5 bg-sand hover:bg-sand/85 text-obsidian text-xs font-bold uppercase tracking-widest transition-all duration-300 shadow-xl cursor-pointer"
            >
              Return Home Now
            </button>
          </div>
        </div>
      </section>
    );
  }

  // 2. STEP: TICKET PORTRAIT VIEW
  if (step === 'ticket' && confirmedBooking) {
    const pkgPrice = TICKET_PACKAGES.find(p => p.type === confirmedBooking.registration.ticketType)?.price || 100;
    const isFullyPaid = confirmedBooking.amountPaid >= pkgPrice;

    if (!isFullyPaid) {
      const remainingBalance = pkgPrice - confirmedBooking.amountPaid;
      return (
        <section className="min-h-screen pt-32 pb-24 px-6 md:px-12 bg-obsidian flex flex-col justify-center items-center relative overflow-hidden">
          {/* Ambient background glow */}
          <div className="absolute top-[10%] left-1/2 -translate-x-1/2 w-[75vw] h-[75vw] rounded-full crimson-gradient opacity-45 blur-[120px] pointer-events-none" />
          
          <div className="w-full max-w-xl relative z-10 animate-fade-in-up">
            {tallyNotice && !tallyNotice.isNew && (
              <div className="mb-6 p-5 bg-[#1a1410] border border-[#B38F6F]/40 text-pearl/95 rounded-sm flex items-start gap-4 shadow-xl select-none">
                <div className="mt-0.5 p-1 bg-[#B38F6F]/20 text-[#B38F6F] rounded-full">
                  <CheckCircle className="w-4 h-4" />
                </div>
                <div className="text-xs space-y-1 z-10">
                  <p className="font-bold font-serif text-[#B38F6F] text-sm tracking-wide">
                    Subsequent Payment Detected & Consolidated!
                  </p>
                  <p className="leading-relaxed text-pearl/80">
                    We automatically detected an existing reservation linked to <strong className="text-pearl">{formData.email}</strong>. 
                    Your new payment of <strong className="text-sand">GH₵ {tallyNotice.addedPayment}</strong> has been successfully aggregated.
                  </p>
                  <div className="grid grid-cols-2 gap-4 pt-1.5 text-[10px] font-mono text-pearl/50 uppercase tracking-wider">
                    <div>PREVIOUS PAID: <span className="text-[#B38F6F] font-bold">GH₵ {tallyNotice.previousPaid}</span></div>
                    <div>NEW TOTAL: <span className="text-amber-500 font-bold">GH₵ {tallyNotice.totalPaid} / {tallyNotice.fullPrice}</span></div>
                  </div>
                  <p className="text-amber-500 font-semibold pt-1 font-sans text-[11px] flex items-center gap-1">
                    ⏳ Part-payment recorded. Remaining balance of GH₵ {tallyNotice.fullPrice - tallyNotice.totalPaid} outstanding.
                  </p>
                </div>
              </div>
            )}

            {/* Header Lock */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-500 mb-4 shadow-[0_0_15px_rgba(245,158,11,0.15)]">
                <Lock className="w-7 h-7" />
              </div>
              <h2 className="text-3xl md:text-4xl font-serif text-pearl tracking-tight leading-tight">
                Admission Portal Locked
              </h2>
              <p className="text-[10px] font-mono text-sand uppercase tracking-[0.25em] mt-2 block font-medium">
                Outstanding Balance Pending
              </p>
            </div>

            {/* Lock Details Dialog */}
            <div className="bg-[#120002] border border-[#B38F6F]/40 p-8 shadow-2xl relative rounded-md text-left overflow-hidden">
              {/* Corner markings inside */}
              <div className="absolute top-2.5 left-2.5 text-[7px] font-mono text-sand/40 uppercase tracking-widest font-light">WCF // SYSTEM LOCK</div>
              <div className="absolute bottom-2.5 right-2.5 text-[7px] font-mono text-sand/40 uppercase tracking-widest font-light">REG. ID: [LOCKED - COMPLETE BALANCE]</div>
              
              <div className="border-b border-sand/15 pb-5 mb-6 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-serif text-[#B38F6F] font-bold tracking-wide">DN'26 // SEMI-REGISTERED</h3>
                  <p className="text-[9px] font-mono text-pearl/50 tracking-wider uppercase mt-1">INSTALLMENT CONFIRMATION RECEIPT</p>
                </div>
                <span className="px-2.5 py-1 text-[9px] font-mono font-bold bg-amber-500/15 text-amber-400 border border-amber-500/25 uppercase tracking-widest">
                  PARTIAL PAID
                </span>
              </div>

              <div className="space-y-4 font-sans text-xs text-pearl/90 leading-relaxed">
                <div className="grid grid-cols-2 gap-4 pb-4 border-b border-sand/10">
                  <div>
                    <p className="text-[9.5px] font-mono text-sand/50 uppercase tracking-widest">Registrant Name</p>
                    <p className="text-base font-serif font-semibold text-pearl mt-0.5">{confirmedBooking.registration.fullName}</p>
                  </div>
                  <div>
                    <p className="text-[9.5px] font-mono text-sand/50 uppercase tracking-widest">Registration Code</p>
                    <p className="text-xs font-mono font-bold text-amber-500 select-none mt-1.5 uppercase tracking-wider">[ LOCKED - COMPLETE BALANCE ]</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 py-2">
                  <div className="bg-pearl/[0.02] border border-sand/10 p-3 text-center">
                    <p className="text-[8px] font-mono text-sand/50 uppercase tracking-widest leading-none">Total Package Price</p>
                    <p className="text-sm font-mono text-pearl font-bold mt-1">GH₵ {pkgPrice}</p>
                  </div>
                  <div className="bg-pearl/[0.02] border border-emerald-500/10 p-3 text-center">
                    <p className="text-[8px] font-mono text-emerald-400/50 uppercase tracking-widest leading-none">Amount Paid</p>
                    <p className="text-sm font-mono text-emerald-400 font-bold mt-1">GH₵ {confirmedBooking.amountPaid}</p>
                  </div>
                  <div className="bg-pearl/[0.02] border border-amber-500/10 p-3 text-center">
                    <p className="text-[8px] font-mono text-amber-400/50 uppercase tracking-widest leading-none">Balance Remaining</p>
                    <p className="text-sm font-mono text-amber-400 font-bold mt-1">GH₵ {remainingBalance}</p>
                  </div>
                </div>

                <div className="p-4 bg-amber-500/[0.03] border border-amber-500/20 text-[11.5px] text-pearl/70 leading-relaxed mt-4">
                  <p className="font-semibold text-amber-400 mb-1">How can I view my admission ticket code?</p>
                  Your official scannable QR ticket and registration code are <strong>safely locked</strong>. To view or download your ticket, your balance must be paid in full (GH₵ {remainingBalance} required). Please capture a screenshot of this page to verify your name and installment status at the coordinator desk.
                </div>
              </div>
            </div>

            {/* Core Interactive Actions */}
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center relative z-10">
              <button
                onClick={() => {
                  setStep('thanks');
                }}
                className="flex items-center justify-center gap-2 px-8 py-3.5 bg-sand text-obsidian text-xs font-bold uppercase tracking-widest transition-colors hover:bg-sand/85 cursor-pointer shadow-lg w-full"
              >
                Finish Registration <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>
      );
    }

    return (
      <section className="min-h-screen pt-32 pb-24 px-6 md:px-12 bg-obsidian flex flex-col justify-center items-center relative overflow-hidden">
        {/* Ambient background light */}
        <div className="absolute top-[10%] left-1/2 -translate-x-1/2 w-[70vw] h-[70vw] rounded-full crimson-gradient opacity-45 blur-[100px] pointer-events-none" />
        
        <div className="w-full max-w-2xl relative z-10 animate-fade-in-up">
          {tallyNotice && !tallyNotice.isNew && (
            <div className="mb-6 p-5 bg-emerald-950/40 border border-emerald-500/35 text-pearl/95 rounded-sm flex items-start gap-4 shadow-xl select-none text-left">
              <div className="mt-0.5 p-1 bg-emerald-500/20 text-emerald-400 rounded-full">
                <CheckCircle className="w-4 h-4" />
              </div>
              <div className="text-xs space-y-1 z-10">
                <p className="font-bold font-serif text-emerald-400 text-sm tracking-wide">
                  🎉 Balance Fully Paid & Ticket Unlocked!
                </p>
                <p className="leading-relaxed text-pearl/80">
                  We detected your existing reservation linked to <strong className="text-pearl">{formData.email}</strong>. 
                  Your payment of <strong className="text-sand font-mono font-semibold">GH₵ {tallyNotice.addedPayment}</strong> has fully satisfied the remaining balance of your pass!
                </p>
                <div className="grid grid-cols-2 gap-4 pt-1.5 text-[10px] font-mono text-pearl/50 uppercase tracking-wider font-light">
                  <div>PREVIOUS PAID: <span className="text-[#B38F6F] font-bold">GH₵ {tallyNotice.previousPaid}</span></div>
                  <div>TOTAL PAID: <span className="text-emerald-400 font-bold">GH₵ {tallyNotice.totalPaid} / {tallyNotice.fullPrice}</span></div>
                </div>
              </div>
            </div>
          )}

          {/* Main heading */}
          <div className="text-center mb-8 no-print">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-crimson/10 border border-sand/40 text-sand mb-4">
              <CheckCircle className="w-6 h-6" />
            </div>
            <h2 className="text-3xl md:text-5xl font-serif text-pearl tracking-tight leading-tight">
              Registration Complete
            </h2>
            <p className="text-[10px] font-mono text-sand uppercase tracking-[0.25em] mt-2 block">
              Admission Ticket Compiled Successfully
            </p>
          </div>

          {/* VINTAGE GRAPHIC LUXURY ADMISSION TICKET */}
          <div className="bg-gradient-to-br from-[#120002] via-[#210006] to-[#040001] border-2 border-[#B38F6F] shadow-2xl overflow-hidden relative rounded-2xl flex flex-col md:flex-row transition-all duration-300" id="ticket-print-area">
            
            {/* Very dim background graphic layer: decorative wine glass & spiral designs */}
            <div className="absolute inset-0 pointer-events-none select-none overflow-hidden rounded-2xl z-0">
              {/* Actual image of the wine glasses from the hero page */}
              <img 
                src={heroBg} 
                alt="" 
                className="absolute inset-0 w-full h-full object-cover opacity-[0.08] filter brightness-[1.1] contrast-[1.05]" 
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-[#120002]/20" />
              
              {/* Spinning / math spiral design 1 */}
              <svg className="absolute -left-10 -top-10 w-[70%] h-[70%] text-[#B38F6F]/15" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="0.4">
                <path d="M50,50 C40,40 30,55 35,65 C40,75 60,70 65,55 C70,40 50,25 40,35 C30,45 35,70 55,75 C75,80 80,45 65,30 C50,15 25,25 20,50 C15,75 40,90 70,85 C100,80 100,30 75,15" />
              </svg>
              {/* Spinning / math spiral design 2 */}
              <svg className="absolute -right-16 -bottom-16 w-[75%] h-[75%] text-[#B38F6F]/15" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="0.4">
                <path d="M50,50 C45,45 35,60 40,70 C45,80 65,75 70,60 C75,45 55,30 45,40 C35,50 40,75 60,80 C80,85 85,50 70,35 C55,20 30,30 25,55 C20,80 45,95 75,90 C105,85 105,35 80,20 C55,5" />
              </svg>
            </div>

            {/* TICKET PERFORATION & PHYSICALLY DETAILED HOLES (NOTCHES) */}
            {/* Top Cutout Notch */}
            <div className="absolute top-[-12px] left-1/2 md:left-[72%] w-6 h-6 bg-obsidian border border-[#B38F6F] rounded-full -translate-x-1/2 z-20 pointer-events-none" />
            {/* Bottom Cutout Notch */}
            <div className="absolute bottom-[-12px] left-1/2 md:left-[72%] w-6 h-6 bg-obsidian border border-[#B38F6F] rounded-full -translate-x-1/2 z-20 pointer-events-none" />
            
            {/* Left side notch */}
            <div className="absolute left-[-12px] top-1/2 -translate-y-1/2 w-6 h-6 bg-obsidian border border-[#B38F6F] rounded-full z-20 pointer-events-none hidden md:block" />
            {/* Right side notch */}
            <div className="absolute right-[-12px] top-1/2 -translate-y-1/2 w-6 h-6 bg-obsidian border border-[#B38F6F] rounded-full z-20 pointer-events-none hidden md:block" />

            {/* Perforated Dot Divider (Dashed styling) */}
            <div className="absolute left-1/2 md:left-[72%] top-3 bottom-3 -translate-x-1/2 border-l-2 border-dashed border-[#B38F6F]/25 z-10 hidden md:block" />
            <div className="absolute left-3 right-3 top-[51%] -translate-y-1/2 border-t-2 border-dashed border-[#B38F6F]/25 z-10 md:hidden" />

            {/* MAIN PORTION (Left side 72% width on desktop) */}
            <div className="w-full md:w-[72%] p-8 md:p-10 flex flex-col justify-between relative z-10">
              {/* Corner markings inside */}
              <div className="absolute top-2.5 left-2.5 text-[7px] font-mono text-sand/40 uppercase tracking-widest font-light">DN26//ADMISSION</div>
              <div className="absolute bottom-2.5 left-2.5 text-[7px] font-mono text-sand/45 uppercase tracking-widest font-light">LFCWW x WCF</div>

              {/* Header Info */}
              <div className="border-b border-sand/15 pb-5 mb-5">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 shrink-0 bg-[#3a0009]/60 p-1.5 border border-sand/20 rounded-md">
                      <WcfLogo className="w-10 h-10 object-contain" size={40} />
                      <WinnersLogo className="w-10 h-10 object-contain" size={40} />
                    </div>
                    <div>
                      <h3 className="text-xl font-serif text-[#B38F6F] font-bold tracking-wider leading-none">DN'26 // GOLDEN BANQUET</h3>
                      <p className="text-[8.5px] font-mono text-pearl/50 tracking-widest mt-1.5 uppercase leading-none">Winners' Chapel Int. & WCF Present</p>
                    </div>
                  </div>
                  <div className="text-left sm:text-right">
                    <span className="text-[8.5px] font-mono text-sand/50 uppercase tracking-widest leading-none">TICKET STATUS</span>
                    <p className="text-sm font-bold text-emerald-400 font-mono tracking-widest uppercase mt-1">★ ADMISSION CONFIRMED</p>
                  </div>
                </div>
              </div>

              {/* Passenger/Guest Details grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6">
                <div>
                  <p className="text-[9px] font-mono uppercase tracking-widest text-sand/50">ADMIT GUEST</p>
                  <p className="text-xl font-serif text-pearl leading-none mt-1 font-semibold">{confirmedBooking.registration.fullName}</p>
                </div>
                <div>
                  <p className="text-[9px] font-mono uppercase tracking-widest text-sand/50">REGISTRATION CODE</p>
                  <p className="text-sm font-mono text-pearl font-extrabold mt-1 tracking-widest">{confirmedBooking.id}</p>
                </div>
                
                <div className="pt-3 border-t border-sand/10 col-span-2 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[8.5px] font-mono uppercase tracking-widest text-sand/50">EVENT NIGHT DATE</p>
                    <p className="text-xs font-semibold text-pearl font-serif">Friday, September 4, 2026</p>
                  </div>
                  <div>
                    <p className="text-[8.5px] font-mono uppercase tracking-widest text-sand/50">BANQUET HALL ACCREDITATION</p>
                    <p className="text-xs font-semibold text-pearl">TBD</p>
                    <p className="text-[9px] font-mono text-[#B38F6F]/65 mt-1 font-medium">KUMASI, GHANA</p>
                  </div>
                </div>
              </div>

              {/* Realistic Barcode Generator */}
              <div className="mt-6 pt-5 border-t border-sand/10 flex items-center justify-between gap-4">
                <div className="flex-1 flex flex-col justify-end">
                  <div className="flex h-11 w-full bg-pearl/[0.03] p-1 items-end overflow-hidden rounded-sm select-none pointer-events-none opacity-85">
                    {Array.from({ length: 65 }).map((_, i) => (
                      <div
                        key={i}
                        style={{
                          width: `${[1, 2, 1, 3, 1, 1, 4, 1, 2][i % 9]}px`,
                          marginLeft: `${[1, 2, 1, 1, 3, 1, 2][i % 7]}px`
                        }}
                        className="h-full bg-pearl"
                      />
                    ))}
                  </div>
                  <p className="text-[8px] font-mono tracking-[0.3em] text-pearl/40 mt-1 uppercase text-left">
                    *DN-2026-{confirmedBooking.id}*
                  </p>
                </div>
                
                <div className="hidden sm:block text-right">
                  <p className="text-[8.5px] font-mono text-sand/50 uppercase tracking-widest leading-none">TICKET TYPE</p>
                  <p className="text-lg font-serif text-sand font-bold mt-1 tracking-wider leading-none uppercase">{confirmedBooking.registration.ticketType || 'Single'} Pass</p>
                </div>
              </div>
            </div>

            {/* STUB PORTION (Right side 28% width on desktop) */}
            <div className="w-full md:w-[28%] p-8 md:p-10 flex flex-col justify-between items-center bg-[#c5a880]/[0.02] border-t md:border-t-0 border-[#B38F6F]/15 relative z-10 text-center">
              {/* Corner markings for Stub */}
              <div className="absolute top-2.5 right-2.5 text-[7px] font-mono text-sand/45 uppercase tracking-widest font-light">STUB</div>
              <div className="absolute bottom-2.5 right-2.5 text-[7px] font-mono text-sand/40 uppercase tracking-widest font-light">SEQ.{confirmedBooking.id}</div>

              <div className="w-full flex flex-col items-center">
                <h4 className="text-[10px] font-mono tracking-[0.25em] text-sand uppercase font-bold text-center">ADMIT ONE STUB</h4>
                <div className="w-10 h-[1px] bg-sand/30 my-2.5" />
                
                {/* Secure QR Circle */}
                <div className="relative p-2 bg-white border-2 border-sand/30 rounded-lg shadow-xl md:hover:scale-105 transition-all duration-300 my-2 inline-block">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
                      `WCF-KNUST Dinner Night '26\nTicket: ${confirmedBooking.id}\nGuest: ${confirmedBooking.registration.fullName}\nPass: ${confirmedBooking.registration.ticketType} Pass\nStatus: VERIFIED ADMISSION`
                    )}`}
                    alt="Admission Ticket QR Code"
                    className="w-24 h-24 block object-contain"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="bg-obsidian w-12 h-7 rounded-sm border border-sand flex items-center justify-center gap-0.5 shadow-xl px-1">
                      <WcfLogo className="w-4 h-4" size={16} />
                      <WinnersLogo className="w-4 h-4" size={16} />
                    </div>
                  </div>
                </div>
              </div>              {/* Stub Details */}
              <div className="w-full mt-3">
                <p className="text-[10px] font-serif text-pearl font-bold uppercase tracking-wider">{confirmedBooking.id}</p>
                <p className="text-[8.5px] font-mono text-sand/60 uppercase tracking-widest mt-1">SCAN AT MAIN ENTRANCE</p>
              </div>
            </div>
          </div>
 
          {/* Calendar Integration section */}
          <div className="mt-6 bg-pearl/[0.02] border border-sand/20 p-5 md:p-6 text-center rounded-none relative overflow-hidden backdrop-blur-sm no-print">
            <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-sand/40" />
            <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-sand/40" />
            <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-sand/40" />
            <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-sand/40" />
            
            <div className="flex flex-col md:flex-row items-center justify-between gap-5">
              <div className="text-left">
                <h4 className="font-serif text-base text-sand flex items-center gap-2">
                  <Calendar className="w-4 h-4" /> Add to Your Calendar
                </h4>
                <p className="text-[11px] text-pearl/60 mt-1 max-w-md leading-relaxed">
                  Make sure you don't miss the Golden Banquet. Sync the event schedule with your personal calendar instantly.
                </p>
              </div>
              <div className="flex flex-wrap gap-2.5 w-full md:w-auto justify-start md:justify-end">
                <a
                  href={`https://calendar.google.com/calendar/render?action=TEMPLATE&text=WCF+KNUST+Annual+Golden+Banquet&dates=20260904T190000Z/20260904T230000Z&details=Congratulations!+Your+Admission+Seat+is+secured.+Ticket+Code:+${confirmedBooking.id}.+Please+bring+your+downloaded+pass+to+the+entrance.&location=TBD`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-pearl/10 hover:bg-pearl/20 border border-sand/30 text-[10px] font-mono font-bold uppercase tracking-widest text-pearl transition-colors duration-200 cursor-pointer"
                >
                  Google Calendar <ExternalLink className="w-3.5 h-3.5 text-sand" />
                </a>
                <button
                  type="button"
                  onClick={() => downloadICSFile(confirmedBooking.id)}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-sand hover:bg-sand/85 text-[10px] font-mono font-bold uppercase tracking-widest text-obsidian transition-colors duration-200 cursor-pointer"
                >
                  iCal / Outlook (.ics) <Download className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Core Interactive Actions */}
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center relative z-10 no-print">
            <button
              onClick={handleDownloadTicket}
              className="flex items-center justify-center gap-2 px-6 py-3.5 bg-sand text-obsidian text-xs font-bold uppercase tracking-widest transition-colors hover:bg-sand/85 cursor-pointer shadow-lg"
            >
              <Download className="w-4 h-4" /> Download Ticket (PNG)
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center justify-center gap-2 px-6 py-3.5 bg-pearl/5 hover:bg-pearl/10 border border-sand/30 text-pearl text-xs font-semibold uppercase tracking-widest transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4 text-sand" /> Save PDF / Print
            </button>
            <button
              onClick={copyRefCode}
              className="flex items-center justify-center gap-2 px-6 py-3.5 bg-pearl/5 hover:bg-pearl/10 border border-sand/30 text-pearl text-xs font-semibold uppercase tracking-widest transition-colors cursor-pointer"
            >
              <Copy className="w-4 h-4 text-sand" /> {copiedLink ? 'Copied Code!' : 'Copy Ticket Code'}
            </button>
            <button
              onClick={() => {
                setStep('thanks');
              }}
              className="flex items-center justify-center gap-2 px-6 py-3.5 bg-crimson hover:bg-crimson/90 text-pearl text-xs font-bold uppercase tracking-widest transition-colors cursor-pointer"
            >
              Finish <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="text-center mt-6 select-none font-sans text-xs text-pearl/40 no-print">
            Download your luxury invitation card above, or save it to your local system files.
          </div>
        </div>
      </section>
    );
  }

  // SKELETON LOADER FOR REGISTRATION FORM INITIAL DATA FETCH
  if (isInitialLoading) {
    return (
      <section className="min-h-screen pt-32 pb-24 px-6 md:px-12 bg-obsidian flex flex-col justify-center items-center relative overflow-hidden">
        {/* Background glow radial */}
        <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[80vw] h-[80vw] rounded-full crimson-gradient opacity-60 pointer-events-none select-none z-0" />
        
        <div className="w-full max-w-3xl relative z-10">
          {/* Header Skeleton */}
          <div className="text-center mb-12 flex flex-col items-center">
            <div className="h-3.5 w-32 skeleton-shimmer mb-3 rounded" />
            <div className="h-10 w-72 skeleton-shimmer mb-4 rounded" />
            <div className="w-12 h-[1px] bg-sand/30 my-4" />
            <div className="h-4 w-96 max-w-full skeleton-shimmer rounded mb-2" />
            <div className="h-4 w-72 max-w-full skeleton-shimmer rounded" />
          </div>

          {/* Form Panel Skeleton */}
          <div className="luxury-blur-panel max-w-2xl mx-auto p-8 md:p-12 border border-sand/20 shadow-2xl relative space-y-8">
            {/* Corner highlights */}
            <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-sand/40" />
            <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-sand/40" />
            <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-sand/40" />
            <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-sand/40" />

            <div className="space-y-6">
              {/* Field 1: Category Header */}
              <div className="border-b border-sand/10 pb-2">
                <div className="h-3 w-40 skeleton-shimmer rounded" />
              </div>

              {/* Field 2: Name Input */}
              <div className="space-y-2">
                <div className="h-3 w-20 skeleton-shimmer rounded" />
                <div className="h-11 w-full skeleton-shimmer rounded" />
              </div>

              {/* Field 3: Email Input */}
              <div className="space-y-2">
                <div className="h-3 w-24 skeleton-shimmer rounded" />
                <div className="h-11 w-full skeleton-shimmer rounded" />
              </div>

              {/* Field 4: Phone Input */}
              <div className="space-y-2">
                <div className="h-3 w-28 skeleton-shimmer rounded" />
                <div className="h-11 w-full skeleton-shimmer rounded" />
              </div>

              {/* Field 5: Dropdown selection */}
              <div className="border-b border-sand/10 pb-2 pt-4">
                <div className="h-3 w-36 skeleton-shimmer rounded" />
              </div>
              <div className="space-y-2">
                <div className="h-3 w-20 skeleton-shimmer rounded" />
                <div className="h-11 w-full skeleton-shimmer rounded" />
              </div>
            </div>

            {/* Action button skeleton */}
            <div className="h-14 w-full skeleton-shimmer rounded mt-8" />
          </div>
        </div>
      </section>
    );
  }

  // SKELETON LOADER FOR TICKET GENERATING / PROCESSING SCREEN
  if (isGenerating) {
    return (
      <section className="min-h-screen pt-32 pb-24 px-6 md:px-12 bg-obsidian flex flex-col justify-center items-center relative overflow-hidden">
        {/* Background glow radial */}
        <div className="absolute top-[10%] left-1/2 -translate-x-1/2 w-[70vw] h-[70vw] rounded-full crimson-gradient opacity-45 blur-[100px] pointer-events-none" />
        
        <div className="w-full max-w-2xl relative z-10">
          {/* Main heading */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-crimson/10 border border-sand/30 text-sand mb-4">
              <Loader2 className="w-6 h-6 animate-spin text-sand" />
            </div>
            <h2 className="text-3xl md:text-5xl font-serif text-pearl tracking-tight leading-tight">
              Compiling Ticket
            </h2>
            <p className="text-[10px] font-mono text-sand/85 uppercase tracking-[0.25em] mt-2 block animate-pulse">
              Generating Scannable Secure Admission Pass...
            </p>
          </div>

          {/* Ticket Card Skeleton */}
          <div className="bg-gradient-to-br from-[#120002] via-[#210006] to-[#040001] border-2 border-[#B38F6F]/30 shadow-2xl overflow-hidden relative rounded-2xl flex flex-col md:flex-row transition-all duration-300">
            {/* Left Column Skeleton */}
            <div className="flex-grow p-8 flex flex-col justify-between border-b md:border-b-0 md:border-r border-[#B38F6F]/10 space-y-6">
              <div className="space-y-3">
                <div className="h-4 w-32 skeleton-shimmer rounded" />
                <div className="h-8 w-64 skeleton-shimmer rounded" />
              </div>
              <div className="space-y-2 pt-4">
                <div className="h-3 w-28 skeleton-shimmer rounded" />
                <div className="h-6 w-48 skeleton-shimmer rounded" />
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-sand/5">
                <div>
                  <div className="h-3 w-16 skeleton-shimmer rounded mb-1" />
                  <div className="h-5 w-24 skeleton-shimmer rounded" />
                </div>
                <div>
                  <div className="h-3 w-16 skeleton-shimmer rounded mb-1" />
                  <div className="h-5 w-24 skeleton-shimmer rounded" />
                </div>
              </div>
            </div>
            {/* Right Column Skeleton - QR Block */}
            <div className="w-full md:w-56 p-8 flex flex-col items-center justify-center bg-black/30 border-t md:border-t-0 border-[#B38F6F]/10 space-y-4">
              <div className="w-32 h-32 skeleton-shimmer rounded" />
              <div className="h-4 w-24 skeleton-shimmer rounded" />
              <div className="h-3 w-32 skeleton-shimmer rounded" />
            </div>
          </div>
          
          <div className="text-center mt-6 select-none font-sans text-xs text-pearl/40">
            Securing cryptographic transaction tokens & assembling vector print assets.
          </div>
        </div>
      </section>
    );
  }

  // 1. STEP: REGISTRATION DETAILS FORM (FREE SEAT SECURED INSTANTLY)
  return (
    <>
      <section className="min-h-screen pt-32 pb-24 px-6 md:px-12 bg-obsidian flex flex-col justify-center items-center relative overflow-hidden">
      {/* Background glow radial */}
      <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[80vw] h-[80vw] rounded-full crimson-gradient opacity-60 pointer-events-none select-none z-0" />
      
      <div className="w-full max-w-3xl relative z-10 animate-fade-in-up">
        {/* Title */}
        <div className="text-center mb-12">
          <p className="text-[10px] uppercase font-mono tracking-[0.3em] text-sand mb-2 block animate-pulse">
            Exclusive Seating
          </p>
          <h2 className="text-4xl md:text-5xl text-pearl font-normal tracking-tight font-serif-luxury leading-tight">
            Invitation Registry
          </h2>
          <div className="w-12 h-[1px] bg-sand mx-auto mt-4" />
          <p className="mt-4 text-xs md:text-sm text-pearl/60 font-light max-w-lg mx-auto leading-relaxed">
            Please fill out your verified credentials below to register. Your ticket will be compiled instantly for immediate PDF download.
          </p>
        </div>

        {/* REGISTRATION FORM COMPOSITION */}
        <form
          onSubmit={handleFormSubmit}
          className="luxury-blur-panel max-w-2xl mx-auto p-8 md:p-12 border border-sand/20 shadow-2xl relative"
        >
          {/* Corner highlights */}
          <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-sand" />
          <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-sand" />
          <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-sand" />
          <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-sand" />

          {/* Form grids */}
          <div className="space-y-6">
            {/* PERSONAL DETAILS SEGMENT */}
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-widest text-sand mb-4 pb-1 border-b border-sand/10">
                    Personal Information
                  </p>
                  
                  <div className="space-y-5">
                    {/* Full Name Input */}
                    <div>
                      <label htmlFor="fullName" className="block text-[10px] font-mono uppercase tracking-widest text-pearl/60 mb-2">
                        Full Name
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sand/60">
                          <User className="w-4 h-4" />
                        </span>
                        <input
                          type="text"
                          id="fullName"
                          name="fullName"
                          value={formData.fullName}
                          onChange={handleInputChange}
                          placeholder="e.g. David Afrane"
                          className={`w-full bg-obsidian/60 border ${
                            formErrors.fullName ? 'border-crimson' : 'border-sand/20'
                          } text-pearl placeholder-pearl/20 text-xs py-3 pl-11 pr-4 focus:outline-none focus:border-sand/80 focus:ring-1 focus:ring-sand/15 transition-all font-sans`}
                        />
                      </div>
                      {formErrors.fullName && (
                        <p className="text-[10px] text-crimson font-light mt-1.5">{formErrors.fullName}</p>
                      )}
                    </div>

                    {/* Grid for Email & Phone */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      {/* Email */}
                      <div>
                        <label htmlFor="email" className="block text-[10px] font-mono uppercase tracking-widest text-pearl/60 mb-2">
                          Email Address
                        </label>
                        <div className="relative">
                          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sand/60">
                            <Mail className="w-4 h-4" />
                          </span>
                          <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            placeholder="e.g. david@example.com"
                            className={`w-full bg-obsidian/60 border ${
                              formErrors.email ? 'border-crimson' : 'border-sand/20'
                            } text-pearl placeholder-pearl/20 text-xs py-3 pl-11 pr-4 focus:outline-none focus:border-sand/80 focus:ring-1 focus:ring-sand/15 transition-all font-sans`}
                          />
                        </div>
                        {formErrors.email && (
                          <p className="text-[10px] text-crimson font-light mt-1.5">{formErrors.email}</p>
                        )}
                      </div>

                      {/* Phone */}
                      <div>
                        <label htmlFor="phone" className="block text-[10px] font-mono uppercase tracking-widest text-pearl/60 mb-2">
                          Phone Number
                        </label>
                        <div className="relative">
                          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sand/60">
                            <Phone className="w-4 h-4" />
                          </span>
                          <input
                            type="tel"
                            id="phone"
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            placeholder="e.g. 0244000000"
                            className={`w-full bg-obsidian/60 border ${
                              formErrors.phone ? 'border-crimson' : 'border-sand/20'
                            } text-pearl placeholder-pearl/20 text-xs py-3 pl-11 pr-4 focus:outline-none focus:border-sand/80 focus:ring-1 focus:ring-sand/15 transition-all font-sans`}
                          />
                        </div>
                        {formErrors.phone && (
                          <p className="text-[10px] text-crimson font-light mt-1.5">{formErrors.phone}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* SEATING & TICKETING COORDINATE */}
            <div className="pt-2">
              <p className="text-[10px] font-mono uppercase tracking-widest text-sand mb-4 pb-1 border-b border-sand/10">
                Booking Information
              </p>

              <div>
                {/* Ticket Type Toggle/Selector */}
                <div>
                  <label htmlFor="ticketType" className="block text-[10px] font-mono uppercase tracking-widest text-pearl/60 mb-2">
                    Ticket Type
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sand/60">
                      <Ticket className="w-4 h-4" />
                    </span>
                    <select
                      id="ticketType"
                      name="ticketType"
                      value={formData.ticketType}
                      onChange={handleInputChange}
                      className="w-full bg-obsidian/60 border border-sand/20 text-pearl text-xs py-3 pl-11 pr-4 focus:outline-none focus:border-sand/80 transition-all font-sans appearance-none ring-0 outline-none"
                    >
                      <option value="Single" className="bg-obsidian text-pearl">Single Pass — GH₵ 100</option>
                      <option value="Double" className="bg-obsidian text-pearl">Double Pass — GH₵ 180</option>
                      <option value="Table of 4" className="bg-obsidian text-pearl">Table of 4 — GH₵ 350</option>
                    </select>
                  </div>
                </div>

                {/* Payment Option Selector */}
                <div className="mt-5">
                  <label className="block text-[10px] font-mono uppercase tracking-widest text-pearl/60 mb-3">
                    Payment Option
                  </label>
                  <div className="flex items-center gap-6 p-3 bg-obsidian/40 border border-sand/15 rounded-md">
                    <label className="flex items-center gap-3 cursor-pointer group select-none">
                      <div className="relative flex items-center justify-center">
                        <input
                          type="radio"
                          name="paymentPlan"
                          value="full"
                          checked={paymentPlan === 'full'}
                          onChange={() => {
                            setPaymentPlan('full');
                            setSelectedPayment(selectedPkg.price);
                          }}
                          className="sr-only"
                        />
                        <div className={`w-4 h-4 rounded-full border transition-all flex items-center justify-center ${
                          paymentPlan === 'full'
                            ? 'border-[#B38F6F] bg-[#B38F6F]/10'
                            : 'border-sand/30 bg-transparent group-hover:border-sand/50'
                        }`}>
                          <div className={`w-2 h-2 rounded-full bg-[#B38F6F] transition-all duration-200 ${
                            paymentPlan === 'full' ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
                          }`} />
                        </div>
                      </div>
                      <span className="text-xs font-mono uppercase tracking-wider text-pearl/90 group-hover:text-pearl transition-colors">
                        Full Payment
                      </span>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer group select-none">
                      <div className="relative flex items-center justify-center">
                        <input
                          type="radio"
                          name="paymentPlan"
                          value="installment"
                          checked={paymentPlan === 'installment'}
                          onChange={() => {
                            setPaymentPlan('installment');
                            const opts = getInstallmentOptions(selectedPkg.price).filter(amt => amt < selectedPkg.price);
                            setSelectedPayment(opts[opts.length - 1] || Math.round(selectedPkg.price / 2));
                          }}
                          className="sr-only"
                        />
                        <div className={`w-4 h-4 rounded-full border transition-all flex items-center justify-center ${
                          paymentPlan === 'installment'
                            ? 'border-[#B38F6F] bg-[#B38F6F]/10'
                            : 'border-sand/30 bg-transparent group-hover:border-sand/50'
                        }`}>
                          <div className={`w-2 h-2 rounded-full bg-[#B38F6F] transition-all duration-200 ${
                            paymentPlan === 'installment' ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
                          }`} />
                        </div>
                      </div>
                      <span className="text-xs font-mono uppercase tracking-wider text-pearl/90 group-hover:text-pearl transition-colors">
                        Installment Plan
                      </span>
                    </label>
                  </div>
                </div>

                {/* Conditional Payment Plan Input & Calculated Breakdown */}
                {paymentPlan === 'installment' && (
                  <div className="mt-4 space-y-3 animate-fade-in">
                    <div>
                      <label htmlFor="amountPaid" className="block text-[10px] font-mono uppercase tracking-widest text-[#B38F6F] mb-1.5">
                        First Installment Amount (To Pay Today)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sand/60 font-serif font-bold text-xs select-none">
                          GH₵
                        </span>
                        <select
                          id="amountPaid"
                          name="amountPaid"
                          value={selectedPayment}
                          onChange={(e) => setSelectedPayment(Number(e.target.value))}
                          className="w-full bg-obsidian/60 border border-sand/20 text-pearl text-xs py-2.5 pl-11 pr-4 focus:outline-none focus:border-sand/80 transition-all font-sans appearance-none ring-0 outline-none cursor-pointer"
                        >
                          {getInstallmentOptions(selectedPkg.price)
                            .filter(amt => amt < selectedPkg.price)
                            .map((amt) => (
                              <option key={amt} value={amt} className="bg-obsidian text-pearl">
                                GH₵ {amt}
                              </option>
                            ))}
                        </select>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-xs font-mono text-pearl/70 bg-obsidian/20 px-3 py-2 border border-sand/10 rounded-sm">
                      <span>Today: <strong className="text-[#B38F6F]">GH₵ {selectedPayment}</strong></span>
                      <span className="text-pearl/30">|</span>
                      <span>Balance Due: <strong className="text-amber-400">GH₵ {selectedPkg.price - selectedPayment}</strong></span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* PRICING NOTES */}
            <div className="mt-6 border-t border-sand/10 pt-6 flex justify-between items-baseline select-none">
              <div>
                <p className="text-xs font-mono uppercase tracking-wider text-pearl/50">Registration Investment</p>
                <p className="text-xs text-sand/60 font-light font-sans mt-0.5">
                  Package: {selectedPkg.type}
                </p>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-xs font-sans text-sand">GH₵</span>
                <span className="text-2xl font-serif text-[#B38F6F] font-bold">{selectedPkg.price}</span>
              </div>
            </div>

            {/* PROCESS TRIGGER */}
            <button
              type="submit"
              disabled={isGenerating}
              className="w-full mt-6 py-3.5 sm:py-4 bg-crimson hover:bg-crimson/90 disabled:bg-crimson/50 text-pearl text-[11px] sm:text-xs font-medium uppercase tracking-[0.1em] sm:tracking-[0.2em] transition-all duration-300 shadow-xl flex items-center justify-center gap-2 cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-sand shrink-0" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Ticket className="w-4 h-4 shrink-0" />
                  <span className="hidden sm:inline">Confirm Registration & Get Ticket</span>
                  <span className="inline sm:hidden">Confirm & Get Ticket</span>
                  <ArrowRight className="w-4 h-4 shrink-0" />
                </>
              )}
            </button>
          </div>
        </form>

        {/* SECURITY REASSURANCE SECURE MARKS */}
        <div className="mt-8 flex justify-center items-center gap-6 text-pearl/40 select-none">
          <div className="flex items-center gap-1.5 text-[10px] font-mono tracking-widest uppercase">
            <CheckCircle className="w-4 h-4 text-sand" /> Dynamic Ticket Code Validation
          </div>
          <div className="w-1.5 h-1.5 rounded-full bg-sand/30" />
          <div className="text-[10px] font-mono tracking-widest uppercase">
            WCF-KNUST Officials Verified
          </div>
        </div>
      </div>
    </section>



    {/* CELEBRATORY REGISTRATION SUCCESSFUL OVERLAY */}
    {showSuccessOverlay && confirmedBooking && (() => {
      const pkgPrice = TICKET_PACKAGES.find(p => p.type === confirmedBooking.registration.ticketType)?.price || 100;
      const isFullyPaid = confirmedBooking.amountPaid >= pkgPrice;
      return (
      <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-50 flex items-center justify-center p-4 overflow-y-auto no-print">
        
        {/* Floating Confetti Rendering */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {confetti.map((c) => (
            <motion.div
              key={c.id}
              initial={{ y: '-10%', opacity: 0, scale: 0.5 }}
              animate={{ 
                y: '110vh', 
                x: c.xOffset, 
                rotate: 360 * (c.id % 2 === 0 ? 2 : -2),
                opacity: [0, 1, 1, 0]
              }}
              transition={{
                duration: c.duration,
                delay: c.delay,
                repeat: Infinity,
                ease: "linear"
              }}
              className="absolute pointer-events-none"
              style={{
                left: c.left,
                width: c.size,
                height: c.size,
                color: c.color,
                fontSize: `${c.size}px`,
              }}
            >
              {c.shape === 'star' ? '★' : c.shape === 'triangle' ? '✦' : (
                <div 
                  className={`w-full h-full ${c.shape === 'circle' ? 'rounded-full' : 'rounded-sm'}`} 
                  style={{ backgroundColor: c.color }} 
                />
              )}
            </motion.div>
          ))}
        </div>

        {/* Shimmering Sparkles (Ambient Background Stars) */}
        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: 15 }).map((_, i) => (
            <motion.div
              key={`sparkle-${i}`}
              initial={{ opacity: 0.1, scale: 0.5 }}
              animate={{ 
                opacity: [0.1, 0.9, 0.1],
                scale: [0.5, 1.2, 0.5]
              }}
              transition={{
                duration: 2 + Math.random() * 3,
                delay: Math.random() * 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute text-sand/40"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
              }}
            >
              <Sparkles className="w-4 h-4 text-sand" />
            </motion.div>
          ))}
        </div>

        {/* Main Celebratory Modal Content */}
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", damping: 20, stiffness: 100 }}
          className="relative w-full max-w-xl bg-gradient-to-b from-[#1c0106] via-[#100003] to-[#040001] border-2 border-[#B38F6F]/70 p-8 md:p-10 shadow-[0_0_50px_rgba(179,143,111,0.25)] rounded-2xl text-center overflow-hidden"
        >
          {/* Luxurious Corner Accents */}
          <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-[#B38F6F]" />
          <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-[#B38F6F]" />
          <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-[#B38F6F]" />
          <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-[#B38F6F]" />

          {/* Radiant Checkmark Circle */}
          <div className="relative inline-flex items-center justify-center mb-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0 bg-[#B38F6F]/10 rounded-full blur-md"
            />
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#B38F6F] to-[#7c5a3a] p-1 shadow-2xl">
              <div className="w-full h-full rounded-full bg-[#100003] flex items-center justify-center border border-sand/20">
                <CheckCircle className="w-10 h-10 text-[#B38F6F]" />
              </div>
            </div>
          </div>

          {/* Success Headers */}
          <p className="text-[10px] font-mono tracking-[0.35em] text-sand uppercase font-bold block mb-2 animate-pulse">
            {isFullyPaid ? '★ SEATING SECURED ★' : '★ PAYMENT RECEIVED ★'}
          </p>
          <h3 className="text-3xl md:text-4xl font-serif text-pearl leading-tight font-normal tracking-wide">
            {isFullyPaid ? 'Registration Successful!' : 'Payment Received'}
          </h3>
          
          <div className="w-16 h-[1px] bg-[#B38F6F]/55 mx-auto my-5" />

          {/* Congratulations note */}
          <p className="text-sm text-pearl/85 font-light leading-relaxed max-w-md mx-auto mb-6">
            {isFullyPaid
              ? 'Congratulations! Your registration has been fully confirmed. Your premium admission credentials are compiled and locked in.'
              : 'Your part-payment has been received and your ticket will remain locked until the full balance is paid.'}
          </p>

          {/* Premium Ticket Info Card */}
          <div className="bg-[#240108]/70 border border-[#B38F6F]/25 rounded-xl p-6 text-left space-y-4 mb-8 backdrop-blur-sm">
            <div className="flex justify-between items-center border-b border-sand/10 pb-3">
              <div>
                <p className="text-[8px] font-mono text-sand/60 uppercase tracking-widest">Registrant</p>
                <p className="text-base font-serif font-bold text-pearl truncate mt-0.5">{confirmedBooking.registration.fullName}</p>
              </div>
              <div className="text-right">
                <p className="text-[8px] font-mono text-sand/60 uppercase tracking-widest">Selected Pass</p>
                <p className="text-sm font-semibold text-sand mt-0.5">{confirmedBooking.registration.ticketType} Pass</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs font-sans">
              <div>
                <p className="text-[8px] font-mono text-sand/50 uppercase tracking-widest">Admission Code</p>
                <p className="text-sm font-mono font-bold text-pearl tracking-wider mt-0.5">{confirmedBooking.id}</p>
              </div>
              <div className="text-right">
                <p className="text-[8px] font-mono text-sand/50 uppercase tracking-widest">Amount Paid</p>
                <p className="text-sm font-mono font-bold text-emerald-400 mt-0.5">GH₵ {confirmedBooking.amountPaid}</p>
              </div>
            </div>

            <div className="border-t border-sand/10 pt-3">
              <div className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${isFullyPaid ? 'bg-[#3ac58a]' : 'bg-amber-400'} animate-pulse`} />
                <p className={`text-[9px] font-mono uppercase tracking-wider ${isFullyPaid ? 'text-[#3ac58a]' : 'text-amber-400'}`}>
                  {isFullyPaid ? `Registration Reference: ${confirmedBooking.paymentRef || 'N/A'}` : `Balance Remaining: GH₵ ${pkgPrice - confirmedBooking.amountPaid}`}
                </p>
              </div>
            </div>
          </div>

          {/* CTA Button */}
          <button
            type="button"
            onClick={() => {
              setShowSuccessOverlay(false);
            }}
            className="group relative w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-sand text-obsidian text-xs font-bold uppercase tracking-widest transition-all duration-300 hover:bg-sand/85 hover:scale-[1.02] cursor-pointer shadow-[0_4px_20px_rgba(179,143,111,0.2)]"
          >
            <span>{isFullyPaid ? 'View My Ticket Details' : 'View Payment Status'}</span>
            <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
          </button>

          <p className="text-[9px] text-pearl/40 font-mono uppercase tracking-widest mt-4">
            WCF-KNUST ANNUAL GOLDEN BANQUET 2026
          </p>

        </motion.div>
      </div>
      );
    })()}
  </>
);
}
