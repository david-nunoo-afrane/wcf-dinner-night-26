/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, FormEvent } from 'react';
import { Lock, Unlock, Search, Users, Ticket, CheckCircle, Flame, RefreshCw, Trash2, Plus, ArrowLeft, ShieldAlert, Sparkles, Check, Download, Printer, Copy, Loader2, Calendar, ExternalLink, Mail, Phone, User, Coins } from 'lucide-react';
import { BookingConfirmation, TicketType } from '../types';
import { getBookingsFromFirestore, addBookingToFirestore, deleteBookingFromFirestore, resetBookingsInFirestore } from '../lib/firebase';
import WcfLogo from './WcfLogo';
import WinnersLogo from './WinnersLogo';
// @ts-ignore
import heroBg from '../assets/images/dark_skinned_toast_1779788617328.png';

// Hardcoded PIN for authorized workspace access
const SECURE_PIN = '5050';

// Rich pre-populated luxury attendees data (Seed data)
const SEED_ATTENDEES: BookingConfirmation[] = [
  {
    id: 'WCF-882910',
    registration: {
      fullName: 'Prof. Ebenezer Osei',
      email: 'e.osei@knust.edu.gh',
      phone: '+233 24 551 0021',
      ticketType: 'Single' as TicketType,
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
      ticketType: 'Double' as TicketType,
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
      ticketType: 'Single' as TicketType,
      quantity: 1,
    },
    amountPaid: 0,
    date: 'May 24, 2026',
    status: 'Confirmed'
  },
  {
    id: 'WCF-294025',
    registration: {
      fullName: 'Divine Kwaku Boateng',
      email: 'dboateng@yahoo.com',
      phone: '+233 24 931 4455',
      ticketType: 'Double' as TicketType,
      quantity: 2,
      guestName: 'Gifty Boateng'
    },
    amountPaid: 0,
    date: 'May 24, 2026',
    status: 'Confirmed'
  },
  {
    id: 'WCF-411299',
    registration: {
      fullName: 'Abigail Adobea',
      email: 'abbyadobea@gmail.com',
      phone: '+233 20 883 0012',
      ticketType: 'Single' as TicketType,
      quantity: 1,
    },
    amountPaid: 0,
    date: 'May 24, 2026',
    status: 'Confirmed'
  }
];

interface AttendeesViewProps {
  onBack: () => void;
}

export default function AttendeesView({ onBack }: AttendeesViewProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [pinInput, setPinInput] = useState<string>('');
  const [pinError, setPinError] = useState<string>('');
  
  // Attendee Core States
  const [attendees, setAttendees] = useState<BookingConfirmation[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('all');
  
  // Add dynamic quick tester attendee state
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newGuestName, setNewGuestName] = useState<string>('');
  const [newGuestEmail, setNewGuestEmail] = useState<string>('');
  const [newGuestPhone, setNewGuestPhone] = useState<string>('');
  const [newGuestType, setNewGuestType] = useState<TicketType>('Single');
  const [newGuestPayment, setNewGuestPayment] = useState<number>(100);
  const [newRegisterError, setNewRegisterError] = useState<string>('');

  // Synchronize dynamic payment options for manual guest entries
  useEffect(() => {
    const fullPrice = newGuestType === 'Table of 4' ? 350 : (newGuestType === 'Double' ? 180 : 100);
    setNewGuestPayment(fullPrice);
  }, [newGuestType]);

  // Manual & System tabs
  const [activeTab, setActiveTab] = useState<'list' | 'manual'>('list');
  const [manualTicket, setManualTicket] = useState<BookingConfirmation | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<BookingConfirmation | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [recordPaymentTarget, setRecordPaymentTarget] = useState<BookingConfirmation | null>(null);
  const [extraPaymentAmount, setExtraPaymentAmount] = useState<number>(25);
  const [isRecordingPayment, setIsRecordingPayment] = useState<boolean>(false);

  // Keypad numbers helper
  const keypadNumbers = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'Clear', '0', 'Submit'];

  // Initialize and load attendees
  useEffect(() => {
    const fetchAttendees = async () => {
      const localData = localStorage.getItem('wcf_registrations');
      if (localData) {
        try {
          const parsedLocal = JSON.parse(localData);
          setAttendees(parsedLocal);
        } catch (err) {
          console.warn('Failed to parse local attendee cache, falling back to seed data.', err);
          setAttendees(SEED_ATTENDEES);
        }
      } else {
        setAttendees(SEED_ATTENDEES);
      }

      try {
        const firestoreList = await getBookingsFromFirestore();
        if (firestoreList.length > 0 && (!localData || JSON.parse(localData).length === 0)) {
          setAttendees(firestoreList);
          localStorage.setItem('wcf_registrations', JSON.stringify(firestoreList));
        }
      } catch (e) {
        console.error("Failed to load attendees from Firestore:", e);
      }
    };

    void fetchAttendees();
  }, []);

  const handlePinSubmit = (enteredPin: string) => {
    if (enteredPin === SECURE_PIN) {
      setIsAuthenticated(true);
      setPinError('');
    } else {
      setPinError('Access Denied. Invalid Authorization Code.');
      setPinInput('');
    }
  };

  const handleKeypadPress = (val: string) => {
    setPinError('');
    if (val === 'Clear') {
      setPinInput('');
    } else if (val === 'Submit') {
      handlePinSubmit(pinInput);
    } else {
      if (pinInput.length < 4) {
        const nextPin = pinInput + val;
        setPinInput(nextPin);
        // Auto-submit on 4th digit
        if (nextPin.length === 4) {
          setTimeout(() => handlePinSubmit(nextPin), 250);
        }
      }
    }
  };

  const handleResetAttendees = async () => {
    if (window.confirm('Are you sure you want to reset all attendees back to seed data?')) {
      try {
        await resetBookingsInFirestore(SEED_ATTENDEES);
        localStorage.setItem('wcf_registrations', JSON.stringify(SEED_ATTENDEES));
        setAttendees(SEED_ATTENDEES);
      } catch (err) {
        console.error("Failed to reset database:", err);
      }
    }
  };

  const handleDeleteAttendee = (att: BookingConfirmation) => {
    setDeleteConfirmTarget(att);
  };

  const confirmDeleteAttendee = async () => {
    if (!deleteConfirmTarget) return;
    const updated = attendees.filter(a => a.id !== deleteConfirmTarget.id);
    localStorage.setItem('wcf_registrations', JSON.stringify(updated));
    setAttendees(updated);
    setDeleteConfirmTarget(null);
    setIsDeleting(true);

    try {
      await deleteBookingFromFirestore(deleteConfirmTarget.id);
    } catch (err) {
      console.warn('Cloud deletion failed, but the attendee was removed locally:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleManualRegister = async (e: FormEvent) => {
    e.preventDefault();
    if (!newGuestName.trim() || !newGuestEmail.trim() || !newGuestPhone.trim()) {
      setNewRegisterError('All core details must be provided.');
      return;
    }

    setIsGenerating(true);
    setNewRegisterError('');

    const existingMatching = attendees.find(a => 
      a.registration.email.trim().toLowerCase() === newGuestEmail.trim().toLowerCase()
    );

    let recordToSave: BookingConfirmation;
    let isMerge = false;

    if (existingMatching) {
      isMerge = true;
      const targetFullPrice = existingMatching.registration.ticketType === 'Table of 4' ? 350 : (existingMatching.registration.ticketType === 'Double' ? 180 : 100);
      const oldPaid = existingMatching.amountPaid !== undefined ? existingMatching.amountPaid : targetFullPrice;
      const aggregatedPaid = Math.min(oldPaid + newGuestPayment, targetFullPrice);

      recordToSave = {
        ...existingMatching,
        amountPaid: aggregatedPaid,
        status: aggregatedPaid >= targetFullPrice ? 'Confirmed' : 'Pending',
        paymentMethod: 'Cash / Manual',
        registration: {
          ...existingMatching.registration,
          fullName: newGuestName || existingMatching.registration.fullName,
          phone: newGuestPhone || existingMatching.registration.phone
        }
      };
    } else {
      const randomId = 'WCF-' + Math.floor(100000 + Math.random() * 900000);
      const fullPrice = newGuestType === 'Table of 4' ? 350 : (newGuestType === 'Double' ? 180 : 100);
      const quantity = newGuestType === 'Table of 4' ? 4 : (newGuestType === 'Double' ? 2 : 1);

      recordToSave = {
        id: randomId,
        registration: {
          fullName: newGuestName,
          email: newGuestEmail,
          phone: newGuestPhone,
          ticketType: newGuestType,
          quantity,
          guestName: newGuestType === 'Double' ? 'Assigned Companion' : undefined
        },
        amountPaid: newGuestPayment,
        date: new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }),
        status: newGuestPayment >= fullPrice ? 'Confirmed' : 'Pending',
        paymentMethod: 'Cash / Manual'
      };
    }

    try {
      try {
        await addBookingToFirestore(recordToSave);
      } catch (firestoreErr) {
        console.warn('Cloud Firestore save failed for manual registration, using local fallback:', firestoreErr);
      }
      
      let updated;
      if (isMerge) {
        updated = attendees.map(a => a.id === recordToSave.id ? recordToSave : a);
      } else {
        updated = [recordToSave, ...attendees];
      }
      localStorage.setItem('wcf_registrations', JSON.stringify(updated));
      setAttendees(updated);

      setManualTicket(recordToSave);
      setIsGenerating(false);

      // Reset Form fields
      setNewGuestName('');
      setNewGuestEmail('');
      setNewGuestPhone('');
      setNewGuestType('Single');
      setNewRegisterError('');
      setShowAddModal(false);
    } catch (err) {
      console.error("Failed to save manual registration to database:", err);
      setNewRegisterError('Failed to save manual registration. The local fallback was also unavailable.');
      setIsGenerating(false);
    }
  };

  const copyManualRefCode = (ticketId: string) => {
    navigator.clipboard.writeText(ticketId);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleDownloadManualTicket = (ticket: BookingConfirmation) => {
    if (!ticket) return;
    
    // Construct real scannable QR ticket data info
    const qrData = `WCF-KNUST Dinner Night '26\nTicket: ${ticket.id}\nName: ${ticket.registration.fullName}\nType: ${ticket.registration.ticketType} Pass\nStatus: CONFIRMED ADMISSION\nDate: September 4, 2026\nVenue: TBD`;
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
      
      // Top Punch
      ctx.fillStyle = '#0a0a0c';
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

      // Perforation line split
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
      ctx.fillText(ticket.registration.fullName, 50, 222);

      // Details Columns: Tier, ID, Date, Venue
      ctx.fillStyle = 'rgba(179, 143, 111, 0.75)';
      ctx.font = 'bold 10px "Courier New", Courier, monospace';
      ctx.fillText('TICKET SEATING', 50, 265);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px "Helvetica Neue", Arial';
      ctx.fillText(`${ticket.registration.ticketType || 'Single'} PASS`, 50, 286);

      ctx.fillStyle = 'rgba(179, 143, 111, 0.75)';
      ctx.font = 'bold 10px "Courier New", Courier, monospace';
      ctx.fillText('ADMISSION REF CODE', 240, 265);
      ctx.fillStyle = '#B38F6F';
      ctx.font = 'bold 14px "Courier New"';
      ctx.fillText(ticket.id, 240, 286);

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

      // Barcode graphics render
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
      ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.font = '9px "Courier New", Courier, monospace';
      ctx.fillText(`*DN-2026-${ticket.id}*`, 50, 428);

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

      const stubQrX = stubCenter - 75;
      const stubQrY = 100;
      const stubQrSize = 150;

      if (loadedQrImg) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(stubQrX, stubQrY, stubQrSize, stubQrSize);
        ctx.drawImage(loadedQrImg, stubQrX + 6, stubQrY + 6, stubQrSize - 12, stubQrSize - 12);
      } else {
        ctx.fillStyle = '#B38F6F';
        ctx.fillRect(stubQrX, stubQrY, stubQrSize, stubQrSize);
      }

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
      ctx.fillText(ticket.id, stubCenter, 290);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.font = '9px "Courier New", Courier, monospace';
      ctx.fillText('ANNUAL BANQUET', stubCenter, 320);

      ctx.fillStyle = '#B38F6F';
      ctx.font = 'bold 8.5px "Courier New", Courier, monospace';
      ctx.fillText('SCAN TO VALIDATE', stubCenter, 350);

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
      ctx.fillText(`SEQ-${ticket.id}`, stubCenter, 412);

      ctx.textAlign = 'left';

      try {
        const dataUrl = canvas.toDataURL('image/png', 1.0);
        const link = document.createElement('a');
        link.download = `WCF_Banquet_Ticket_${ticket.id}.png`;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (err) {
        console.warn('Canvas export failed:', err);
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

  const handleDownloadCSV = () => {
    const headers = [
      'Ticket ID',
      'Guest Name',
      'Email Address',
      'Phone Number',
      'Ticket Tier',
      'Total Price (GH₵)',
      'Amount Paid (GH₵)',
      'Outstanding Balance (GH₵)',
      'Payment Status',
      'Total Seats Allocated',
      'Companion Guest',
      'Registration Date'
    ];
    
    // Structure rows elegantly
    const rows = attendees.map(att => {
      const fullPrice = att.registration.ticketType === 'Table of 4' ? 350 : (att.registration.ticketType === 'Double' ? 180 : 100);
      const paid = att.amountPaid !== undefined ? att.amountPaid : fullPrice;
      const balance = fullPrice - paid;
      const progressStatus = balance <= 0 ? 'Fully Paid' : `Installment - Bal: GH₵ ${balance}`;
      return [
        att.id,
        att.registration.fullName,
        att.registration.email,
        att.registration.phone,
        att.registration.ticketType,
        fullPrice,
        paid,
        balance,
        progressStatus,
        att.registration.ticketType === 'Double' ? 2 : (att.registration.ticketType === 'Table of 4' ? 4 : 1),
        att.registration.guestName || 'None',
        att.date
      ];
    });

    // Build standard CSV body safe for commas
    const csvContent = [
      headers.join(','), 
      ...rows.map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `WCF_KNUST_Banquet_Attendees_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setPinInput('');
    setPinError('');
  };

  // Filter and search logic
  const filteredAttendees = attendees.filter(att => {
    const matchesSearch = 
      att.registration.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      att.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      att.registration.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      att.registration.phone.includes(searchQuery);

    if (filterType === 'all') return matchesSearch;
    if (filterType === 'single') return matchesSearch && att.registration.ticketType === 'Single';
    if (filterType === 'double') return matchesSearch && att.registration.ticketType === 'Double';
    if (filterType === 'table of 4') return matchesSearch && att.registration.ticketType === 'Table of 4';
    return matchesSearch;
  });

  // Calculate high quality stats
  const totalBookings = attendees.length;
  const singleBookings = attendees.filter(a => a.registration.ticketType === 'Single').length;
  const doubleBookings = attendees.filter(a => a.registration.ticketType === 'Double').length;
  const tableBookings = attendees.filter(a => a.registration.ticketType === 'Table of 4').length;
  const totalGuestsAdmitted = attendees.reduce((acc, current) => {
    const qty = current.registration.ticketType === 'Table of 4' ? 4 : (current.registration.ticketType === 'Double' ? 2 : 1);
    return acc + qty;
  }, 0);

  return (
    <div className="pt-24 pb-20 px-6 max-w-7xl mx-auto relative z-10 selection:bg-crimson">
      <button
        onClick={onBack}
        className="mb-8 flex items-center gap-2 group text-xs font-semibold tracking-widest uppercase text-sand hover:text-pearl transition-colors duration-300"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Back to Home
      </button>

      {!isAuthenticated ? (
        /* LOCK SCREEN PROMPT WITH INTERACTIVE KEYPAD */
        <div className="max-w-md mx-auto bg-obsidian border border-sand/20 p-8 shadow-2xl relative">
          {/* Accent corners */}
          <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-sand" />
          <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-sand" />
          <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-sand" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-sand" />

          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-sand/10 border border-sand/30 flex items-center justify-center mb-5 text-sand">
              <Lock className="w-8 h-8 animate-pulse" />
            </div>
            
            <h1 className="font-serif text-2xl text-pearl tracking-wide">Secure Boardroom Access</h1>
            <p className="text-xs text-sand/60 tracking-widest uppercase font-mono mt-1.5">WCF KNUST BANQUET DATABASE</p>
            <p className="text-sm text-pearl/50 mt-4 leading-relaxed max-w-sm">
              Please enter the 4-digit security PIN to unlock the official Winners' Campus Fellowship Golden Banquet registered guest manifests.
            </p>

            {/* Verification Inputs */}
            <div className="mt-6 w-full">
              <div className="flex justify-center gap-3.5 mb-2">
                {[0, 1, 2, 3].map((index) => (
                  <div
                    key={index}
                    className={`w-11 h-14 border-2 flex items-center justify-center font-mono text-xl font-bold rounded-none transition-all duration-300 ${
                      pinInput.length > index
                        ? 'border-sand bg-sand/15 text-pearl'
                        : 'border-sand/20 bg-pearl/5 text-sand/20'
                    }`}
                  >
                    {pinInput.length > index ? '•' : ''}
                  </div>
                ))}
              </div>

              {pinError && (
                <div className="text-rose-500 text-xs font-mono font-medium tracking-wide text-center mt-3 animate-bounce flex items-center justify-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  {pinError}
                </div>
              )}

              {/* Security Hint */}
              <p className="text-[10px] font-mono tracking-wider text-sand/40 text-center mt-3">
                Authorized access only. Use digital device credentials.
              </p>

              {/* Physical/Custom styled keyboard layout */}
              <div className="grid grid-cols-3 gap-3 mt-6">
                {keypadNumbers.map((num) => {
                  const isSpecial = num === 'Clear' || num === 'Submit';
                  return (
                    <button
                      key={num}
                      type="button"
                      onClick={() => handleKeypadPress(num)}
                      className={`h-11 border text-xs tracking-widest uppercase font-mono transition-all duration-200 active:scale-95 ${
                        isSpecial
                          ? 'border-sand/15 hover:border-sand hover:bg-sand/10 text-sand hover:text-pearl font-bold'
                          : 'border-sand/10 hover:border-sand/30 bg-pearl/0 hover:bg-pearl/5 text-pearl/85 hover:text-sand'
                      }`}
                    >
                      {num}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* AUTHORIZED LIST LAYOUT SCREEN WITH CONTROLS */
        <div className="animate-fade-in-up">
          {/* Header Dashboard Banner */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-sand/15 pb-8 mb-8">
            <div>
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-sand/15 text-sand">
                  <Unlock className="w-4 h-4 text-sand" />
                </span>
                <span className="text-xs font-mono font-semibold tracking-widest text-emerald-500 uppercase flex items-center gap-1">
                  Approved Clearance Level 1
                </span>
              </div>
              <h1 className="font-serif text-3xl md:text-4xl text-pearl tracking-wide font-semibold mt-1.5 font-serif-luxury">
                Prestige Control Console
              </h1>
              <p className="text-sm text-pearl/50 mt-1 max-w-xl">
                Real-time official check-in registrar, manual ticket allocator and metrics dashboard for the Golden Banquet.
              </p>
            </div>

            <div className="flex flex-row items-center gap-3 no-print">
              <button
                onClick={handleDownloadCSV}
                className="flex items-center gap-1.5 px-4 py-2.5 border border-sand hover:bg-sand/15 text-sand text-[11px] font-bold tracking-widest uppercase transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" /> Download CSV
              </button>
              <button
                onClick={handleResetAttendees}
                title="Reset Database to Seed Data"
                className="p-2.5 border border-sand/20 hover:border-sand/50 text-pearl/70 hover:text-sand transition-colors cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2.5 bg-crimson hover:bg-crimson/90 text-pearl text-[11px] font-bold tracking-widest uppercase transition-colors cursor-pointer"
              >
                Lock Portal
              </button>
            </div>
          </div>

          {/* TWO DUAL WORKSPACE BUTTONS AS REQUESTED */}
          <div className="grid grid-cols-2 gap-4 pb-8 mb-8 border-b border-sand/15 no-print">
            <button
              onClick={() => { setActiveTab('list'); setManualTicket(null); }}
              className={`py-4 px-6 border text-xs md:text-sm font-bold tracking-widest uppercase flex items-center justify-center gap-3 transition-all duration-300 cursor-pointer ${
                activeTab === 'list'
                  ? 'bg-sand text-obsidian border-sand shadow-lg'
                  : 'bg-pearl/5 text-pearl/50 border-sand/10 hover:border-sand/30 hover:text-pearl'
              }`}
            >
              <Users className="w-5 h-5" />
              Attendees Register List
            </button>
            <button
              onClick={() => { setActiveTab('manual'); setManualTicket(null); }}
              className={`py-4 px-6 border text-xs md:text-sm font-bold tracking-widest uppercase flex items-center justify-center gap-3 transition-all duration-300 cursor-pointer ${
                activeTab === 'manual'
                  ? 'bg-sand text-obsidian border-sand shadow-lg'
                  : 'bg-pearl/5 text-pearl/50 border-sand/10 hover:border-sand/30 hover:text-pearl'
              }`}
            >
              <Ticket className="w-5 h-5" />
              Manual Registration Entry
            </button>
          </div>

          {activeTab === 'list' ? (
            /* DATABASE REGISTRY SEARCH & LIST PANELS */
            <div className="space-y-6">
              {/* Analytics Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-4 no-print2">
                <div className="bg-pearl/5 border border-sand/10 p-5 relative overflow-hidden backdrop-blur-sm">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-sand/5 rounded-full translate-x-12 -translate-y-12" />
                  <div className="text-xs font-mono text-sand uppercase tracking-widest mb-1 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" /> Total Bookings
                  </div>
                  <p className="text-3xl font-serif text-pearl font-bold">{totalBookings}</p>
                  <div className="text-[10px] text-pearl/40 font-mono mt-1">Receipt entries registered</div>
                </div>

                <div className="bg-pearl/5 border border-sand/10 p-5 relative overflow-hidden backdrop-blur-sm">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-sand/5 rounded-full translate-x-12 -translate-y-12" />
                  <div className="text-xs font-mono text-sand uppercase tracking-widest mb-1 flex items-center gap-1.5">
                    <Ticket className="w-3.5 h-3.5 text-sand" /> Seat Allocations
                  </div>
                  <p className="text-3xl font-serif text-sand font-bold">{totalGuestsAdmitted}</p>
                  <div className="text-[10px] text-pearl/40 font-mono mt-1">Aggregated guest count</div>
                </div>

                <div className="bg-pearl/5 border border-sand/10 p-5 relative overflow-hidden backdrop-blur-sm">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-sand/5 rounded-full translate-x-12 -translate-y-12" />
                  <div className="text-xs font-mono text-sand uppercase tracking-widest mb-1 flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Single Passes
                  </div>
                  <p className="text-3xl font-serif text-pearl font-bold">{singleBookings}</p>
                  <div className="text-[10px] text-emerald-400/50 font-mono mt-1">{singleBookings} seats mapped</div>
                </div>

                <div className="bg-pearl/5 border border-sand/10 p-5 relative overflow-hidden backdrop-blur-sm">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-sand/5 rounded-full translate-x-12 -translate-y-12" />
                  <div className="text-xs font-mono text-sand uppercase tracking-widest mb-1 flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-crimson" /> Double & Tables
                  </div>
                  <p className="text-3xl font-serif text-pearl font-bold">
                    {doubleBookings} <span className="text-lg text-pearl/40">D</span> / {tableBookings} <span className="text-lg text-pearl/40">T</span>
                  </p>
                  <div className="text-[10px] text-crimson/50 font-mono mt-1">{doubleBookings * 2 + tableBookings * 4} seats allocated</div>
                </div>
              </div>

              {/* Filtering and Instant Search Controls */}
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-between no-print">
                <div className="relative w-full sm:max-w-md">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-sand/50" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search guests by Name, ID, Phone or Email..."
                    className="w-full bg-pearl/5 border border-sand/25 hover:border-sand/40 focus:border-sand focus:outline-none pl-10 pr-4 py-2.5 text-xs text-pearl tracking-wide transition-colors"
                  />
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <span className="text-[10px] font-mono tracking-widest uppercase text-sand/65">Category:</span>
                  <div className="flex rounded-none border border-sand/20 p-0.5 bg-obsidian">
                    {[
                      { id: 'all', label: 'All' },
                      { id: 'single', label: 'Single Pass' },
                      { id: 'double', label: 'Double Pass' },
                      { id: 'table of 4', label: 'Table of 4' },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setFilterType(tab.id)}
                        className={`px-3.5 py-1 text-[10px] tracking-widest uppercase transition-colors font-medium cursor-pointer ${
                          filterType === tab.id
                            ? 'bg-sand text-obsidian'
                            : 'text-pearl/70 hover:text-sand'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Main Registrations Table / Grid */}
              <div className="bg-pearl/5 border border-sand/10 rounded-none overflow-hidden hover:border-sand/20 transition-all">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-sand/15 bg-pearl/5">
                        <th className="py-4 px-6 text-[10px] font-mono tracking-widest text-sand uppercase">Ticket ID</th>
                        <th className="py-4 px-6 text-[10px] font-mono tracking-widest text-sand uppercase">Guest / Companion Name</th>
                        <th className="py-4 px-6 text-[10px] font-mono tracking-widest text-sand uppercase">Contact Information</th>
                        <th className="py-4 px-6 text-[10px] font-mono tracking-widest text-sand uppercase">Pass Tier</th>
                        <th className="py-4 px-6 text-[10px] font-mono tracking-widest text-sand uppercase">Payment Status</th>
                        <th className="py-4 px-6 text-[10px] font-mono tracking-widest text-sand uppercase">Registration Date</th>
                        <th className="py-4 px-6 text-[10px] font-mono tracking-widest text-sand uppercase text-right no-print">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-sand/10">
                      {filteredAttendees.length > 0 ? (
                        filteredAttendees.map((att) => {
                          const fullPrice = att.registration.ticketType === 'Table of 4' ? 350 : (att.registration.ticketType === 'Double' ? 180 : 100);
                          const paid = att.amountPaid !== undefined ? att.amountPaid : fullPrice;
                          const isFullyPaid = paid >= fullPrice;
                          return (
                            <tr key={att.id} className="hover:bg-pearl/5 transition-colors group">
                              <td className="py-4 px-6">
                                <span className="font-mono text-xs font-bold text-pearl select-all">
                                  {att.id}
                                </span>
                              </td>
                              <td className="py-4 px-6">
                                <div className="flex flex-col">
                                  <span className="font-serif text-sm font-semibold text-pearl">
                                    {att.registration.fullName}
                                  </span>
                                  {att.registration.guestName && (
                                    <span className="text-[10px] font-mono tracking-wide text-sand/60 mt-0.5 truncate max-w-[200px]">
                                      Companion: + {att.registration.guestName}
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="py-4 px-6">
                                <div className="flex flex-col">
                                  <span className="font-mono text-[11px] text-pearl/80">
                                    {att.registration.email}
                                  </span>
                                  <span className="font-mono text-[10px] text-pearl/40 mt-0.5">
                                    {att.registration.phone}
                                  </span>
                                </div>
                              </td>
                              <td className="py-4 px-6">
                                <span className={`inline-block px-2.5 py-1 text-[9px] font-mono font-bold uppercase tracking-widest ${
                                  att.registration.ticketType === 'Table of 4'
                                    ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                                    : att.registration.ticketType === 'Double'
                                      ? 'bg-crimson/15 text-crimson border border-crimson/20'
                                      : 'bg-sand/15 text-sand border border-sand/20'
                                  }`}>
                                  {att.registration.ticketType} Pass
                                </span>
                              </td>
                              <td className="py-4 px-6">
                                <div className="flex flex-col">
                                  <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[9px] font-mono font-bold uppercase tracking-widest rounded-sm w-fit ${
                                    isFullyPaid 
                                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                  }`}>
                                    {isFullyPaid ? 'Fully Paid' : 'Installment'}
                                  </span>
                                  <span className="text-[11px] font-mono text-pearl/80 mt-1">
                                    Paid: GH₵ {paid} / {fullPrice}
                                  </span>
                                  {att.paymentRef && (
                                    <span className="text-[9px] font-mono text-emerald-400/80 mt-0.5 truncate max-w-[150px]" title={`Ref: ${att.paymentRef}`}>
                                      Ref: {att.paymentRef}
                                    </span>
                                  )}
                                  {att.paymentMethod && (
                                    <span className="text-[8px] font-mono text-pearl/30 uppercase tracking-wider block mt-0.5">
                                      {att.paymentMethod}
                                    </span>
                                  )}
                                  {!isFullyPaid && (
                                    <span className="text-[9px] font-mono text-amber-500/80 mt-0.5">
                                      Bal: GH₵ {fullPrice - paid}
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="py-4 px-6">
                                <span className="text-xs text-pearl/60 font-mono">
                                  {att.date}
                                </span>
                              </td>
                              <td className="py-4 px-6 text-right no-print">
                                <div className="flex items-center justify-end gap-2 text-right">
                                  {isFullyPaid ? (
                                    <button
                                      onClick={() => handleDownloadManualTicket(att)}
                                      className="p-2 text-sand hover:text-pearl hover:bg-sand/15 rounded-lg transition-all duration-200 cursor-pointer inline-flex items-center justify-center"
                                      title="Download Ticket as PNG"
                                    >
                                      <Download className="w-4.5 h-4.5" />
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => {
                                        setRecordPaymentTarget(att);
                                        const remaining = fullPrice - paid;
                                        setExtraPaymentAmount(remaining);
                                      }}
                                      className="p-2 text-amber-500 hover:text-amber-400 hover:bg-[#B38F6F]/10 rounded-lg transition-all duration-200 cursor-pointer inline-flex items-center justify-center animate-pulse"
                                      title={`Click to record payment: GH₵ ${fullPrice - paid} path-payment outstanding`}
                                    >
                                      <Lock className="w-4 h-4 text-amber-500" />
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleDeleteAttendee(att)}
                                    className="p-2 text-rose-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all duration-200 cursor-pointer inline-flex items-center justify-center"
                                    title="Revoke Registration Access"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={7} className="py-12 text-center text-sm text-pearl/50 font-serif italic">
                            No registered attendees matched your filter parameters.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="bg-pearl/5 border-t border-sand/10 py-4 px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <span className="text-xs font-mono text-sand/50">
                    Viewing {filteredAttendees.length} of {attendees.length} Verified Records
                  </span>
                  <span className="text-[10px] font-mono text-sand/40">
                    Winners’ Campus Fellowship Dinner Night Office Registry • Kumasi, GH
                  </span>
                </div>
              </div>
            </div>
          ) : (
            /* MANUAL REGISTRATION ENTRY WORKSPACE */
            <div className="space-y-8">
              {(() => {
                if (!manualTicket) return false;
                const fullPrice = manualTicket.registration.ticketType === 'Table of 4' ? 350 : (manualTicket.registration.ticketType === 'Double' ? 180 : 100);
                const paid = manualTicket.amountPaid !== undefined ? manualTicket.amountPaid : fullPrice;
                return paid < fullPrice;
              })() ? (() => {
                const fullPrice = manualTicket.registration.ticketType === 'Table of 4' ? 350 : (manualTicket.registration.ticketType === 'Double' ? 180 : 100);
                const paid = manualTicket.amountPaid !== undefined ? manualTicket.amountPaid : fullPrice;
                const remainingBalance = fullPrice - paid;
                return (
                  <div className="max-w-xl mx-auto animate-fade-in-up">
                    <div className="text-center mb-8">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/35 text-amber-500 mb-4 shadow-[0_0_15px_rgba(245,158,11,0.2)] animate-pulse">
                        <Lock className="w-7 h-7" />
                      </div>
                      <h2 className="text-2xl md:text-3xl font-serif text-pearl tracking-tight leading-tight">
                        Admission Ticket Locked
                      </h2>
                      <p className="text-[10px] font-mono text-sand uppercase tracking-[0.25em] mt-2 block font-semibold">
                        Outstanding Balance Pending
                      </p>
                    </div>

                    <div className="bg-[#120002] border border-[#B38F6F]/40 p-8 shadow-2xl relative rounded-md text-left overflow-hidden col-span-2">
                      <div className="absolute top-2.5 left-2.5 text-[7px] font-mono text-sand/40 uppercase tracking-widest font-light">WCF // SYSTEM LOCK</div>
                      <div className="absolute bottom-2.5 right-2.5 text-[7px] font-mono text-sand/40 uppercase tracking-widest font-light">REG. ID: [LOCKED - COMPLETE BALANCE]</div>
                      
                      <div className="border-b border-sand/15 pb-5 mb-6 flex items-center justify-between">
                        <div>
                          <h3 className="text-base font-serif text-[#B38F6F] font-bold tracking-wide">DN'26 // SEMI-REGISTERED</h3>
                          <p className="text-[9px] font-mono text-pearl/50 tracking-wider uppercase mt-1">INSTALLMENT INTENDED RECEIPT</p>
                        </div>
                        <span className="px-2.5 py-1 text-[9px] font-mono font-bold bg-amber-500/15 text-amber-400 border border-amber-500/25 uppercase tracking-widest">
                          PARTIAL PAID
                        </span>
                      </div>

                      <div className="space-y-4 font-sans text-xs text-pearl/95 leading-relaxed">
                        <div className="grid grid-cols-2 gap-4 pb-4 border-b border-sand/10">
                          <div>
                            <p className="text-[9px] font-mono text-sand/50 uppercase tracking-widest">Registrant Name</p>
                            <p className="text-sm font-serif font-bold text-pearl mt-0.5">{manualTicket.registration.fullName}</p>
                          </div>
                          <div>
                            <p className="text-[9px] font-mono text-sand/50 uppercase tracking-widest">Registration Code</p>
                            <p className="text-xs font-mono font-bold text-amber-400 select-none mt-1.5 uppercase tracking-wider">[ LOCKED - COMPLETE BALANCE ]</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2 py-2">
                          <div className="bg-pearl/[0.02] border border-sand/10 p-3 text-center">
                            <p className="text-[8px] font-mono text-sand/50 uppercase tracking-widest leading-none">Total Ticket Price</p>
                            <p className="text-sm font-mono text-pearl font-bold mt-1">GH₵ {fullPrice}</p>
                          </div>
                          <div className="bg-pearl/[0.02] border border-emerald-500/10 p-3 text-center">
                            <p className="text-[8px] font-mono text-emerald-400/50 uppercase tracking-widest leading-none">Amount Paid</p>
                            <p className="text-sm font-mono text-emerald-400 font-bold mt-1">GH₵ {paid}</p>
                          </div>
                          <div className="bg-pearl/[0.02] border border-amber-500/10 p-3 text-center">
                            <p className="text-[8px] font-mono text-amber-400/50 uppercase tracking-widest leading-none">Balance Remaining</p>
                            <p className="text-sm font-mono text-amber-400 font-bold mt-1">GH₵ {remainingBalance}</p>
                          </div>
                        </div>

                        <div className="p-4 bg-amber-500/[0.03] border border-amber-500/20 text-[11px] text-pearl/70 leading-relaxed mt-4">
                          <p className="font-semibold text-amber-500 mb-1">Ticket Access Restricted</p>
                          This intake is recorded under an installment plan. The scannable ticket and registration code are securely locked and cannot be viewed or downloaded until the remaining balance of GHS {remainingBalance} is saved.
                        </div>
                      </div>
                    </div>

                    <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center no-print">
                      <button
                        onClick={() => setManualTicket(null)}
                        className="flex items-center justify-center gap-2 px-8 py-3 bg-crimson hover:bg-crimson/90 text-pearl text-xs font-bold uppercase tracking-widest transition-colors cursor-pointer w-full"
                      >
                        Return to Registry <ArrowLeft className="w-4 h-4 rotate-180" />
                      </button>
                    </div>
                  </div>
                );
              })() : manualTicket ? (
                /* EXQUISITE LUXURY TICKET VIEW WITH OPTIONS */
                <div className="max-w-2xl mx-auto animate-fade-in-up">
                  <div className="text-center mb-8 no-print">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#1b2f20] border border-emerald-500 text-emerald-400 mb-4 animate-pulse">
                      <CheckCircle className="w-6 h-6" />
                    </div>
                    <h2 className="text-2xl md:text-3xl font-serif text-pearl tracking-tight leading-tight">
                      System Placement Secured
                    </h2>
                    <p className="text-[10px] font-mono text-sand uppercase tracking-[0.25em] mt-2 block">
                      Physical Registration Code Compiled Successfully
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

                    {/* Cutouts & Custom styling */}
                    <div className="absolute top-[-12px] left-1/2 md:left-[72%] w-6 h-6 bg-obsidian border border-[#B38F6F] rounded-full -translate-x-1/2 z-20 pointer-events-none" />
                    <div className="absolute bottom-[-12px] left-1/2 md:left-[72%] w-6 h-6 bg-obsidian border border-[#B38F6F] rounded-full -translate-x-1/2 z-20 pointer-events-none" />
                    
                    <div className="absolute left-[-12px] top-1/2 -translate-y-1/2 w-6 h-6 bg-obsidian border border-[#B38F6F] rounded-full z-20 pointer-events-none hidden md:block" />
                    <div className="absolute right-[-12px] top-1/2 -translate-y-1/2 w-6 h-6 bg-obsidian border border-[#B38F6F] rounded-full z-20 pointer-events-none hidden md:block" />

                    <div className="absolute left-1/2 md:left-[72%] top-3 bottom-3 -translate-x-1/2 border-l-2 border-dashed border-[#B38F6F]/25 z-10 hidden md:block" />
                    <div className="absolute left-3 right-3 top-[51%] -translate-y-1/2 border-t-2 border-dashed border-[#B38F6F]/25 z-10 md:hidden" />

                    {/* Left Portion of Pass */}
                    <div className="w-full md:w-[72%] p-8 md:p-10 flex flex-col justify-between relative z-10 text-left">
                      <div className="absolute top-2.5 left-2.5 text-[7px] font-mono text-sand/40 uppercase tracking-widest font-light">DN26//ADMISSION</div>
                      <div className="absolute bottom-2.5 left-2.5 text-[7px] font-mono text-sand/45 uppercase tracking-widest font-light">LFCWW x WCF</div>

                      {/* Header Logo titles */}
                      <div className="border-b border-sand/15 pb-5 mb-5 font-sans">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 shrink-0 bg-[#3a0009]/60 p-1.5 border border-sand/20 rounded-md">
                              <WcfLogo className="w-10 h-10 object-contain" size={40} />
                              <WinnersLogo className="w-10 h-10 object-contain" size={40} />
                            </div>
                            <div>
                              <h3 className="text-lg md:text-xl font-serif text-[#B38F6F] font-bold tracking-wider leading-none">DN'26 // GOLDEN BANQUET</h3>
                              <p className="text-[8.5px] font-mono text-pearl/50 tracking-widest mt-1.5 uppercase leading-none">Winners' Chapel Int. & WCF Present</p>
                            </div>
                          </div>
                          <div className="text-left sm:text-right">
                            <span className="text-[8.5px] font-mono text-sand/50 uppercase tracking-widest leading-none">ADMIT TICKET</span>
                            <p className="text-xs font-bold text-emerald-400 font-mono tracking-widest uppercase mt-1">★ VERIFIED</p>
                          </div>
                        </div>
                      </div>

                      {/* Attendee credentials inside pass */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6">
                        <div>
                          <p className="text-[9px] font-mono uppercase tracking-widest text-sand/50">ADMIT GUEST</p>
                          <p className="text-lg font-serif text-pearl leading-none mt-1 font-semibold">{manualTicket.registration.fullName}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-mono uppercase tracking-widest text-sand/50">REGISTRATION CODE</p>
                          <p className="text-sm font-mono text-pearl font-extrabold mt-1 tracking-widest">{manualTicket.id}</p>
                        </div>
                        
                        <div className="pt-3 border-t border-sand/10 col-span-2 grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-[8.5px] font-mono uppercase tracking-widest text-sand/50">EVENT NIGHT DATE</p>
                            <p className="text-xs font-semibold text-pearl font-serif">Friday, September 4, 2026</p>
                          </div>
                          <div>
                            <p className="text-[8.5px] font-mono uppercase tracking-widest text-sand/50">VENUE ACCREDITATION</p>
                            <p className="text-xs font-semibold text-pearl">TBD</p>
                            <p className="text-[9px] font-mono text-[#B38F6F]/65 mt-1 font-medium">KUMASI, GHANA</p>
                          </div>
                        </div>
                      </div>

                      {/* Barcode line patterns */}
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
                            *DN-2026-{manualTicket.id}*
                          </p>
                        </div>
                        
                        <div className="text-right shrink-0">
                          <p className="text-[8.5px] font-mono text-sand/50 uppercase tracking-widest leading-none">TICKET TYPE</p>
                          <p className="text-base font-serif text-sand font-bold mt-1 tracking-wider leading-none uppercase">{manualTicket.registration.ticketType || 'Single'} Pass</p>
                        </div>
                      </div>
                    </div>

                    {/* Right portion (Stub) */}
                    <div className="w-full md:w-[28%] p-8 md:p-10 flex flex-col justify-between items-center bg-[#c5a880]/[0.02] border-t md:border-t-0 border-[#B38F6F]/15 relative z-10 text-center">
                      <div className="absolute top-2.5 right-2.5 text-[7px] font-mono text-sand/45 uppercase tracking-widest font-light">STUB</div>
                      <div className="absolute bottom-2.5 right-2.5 text-[7px] font-mono text-sand/40 uppercase tracking-widest font-light">SEQ.{manualTicket.id}</div>

                      <div className="w-full flex flex-col items-center">
                        <h4 className="text-[10px] font-mono tracking-[0.25em] text-sand uppercase font-bold text-center">ADMIT ONE STUB</h4>
                        <div className="w-10 h-[1px] bg-sand/30 my-2.5" />
                        
                        {/* Secure QR Code container */}
                        <div className="relative p-2 bg-white border border-sand/30 rounded-lg shadow-xl inline-block my-2">
                          <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
                              `WCF-KNUST Dinner Night '26\nTicket: ${manualTicket.id}\nGuest: ${manualTicket.registration.fullName}\nPass: ${manualTicket.registration.ticketType} Pass\nStatus: VERIFIED ADMISSION`
                            )}`}
                            alt="Admission Pass QR"
                            className="w-24 h-24 block object-contain"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      </div>
                      
                      <div className="w-full mt-3">
                        <p className="text-[10px] font-mono text-pearl tracking-widest font-bold uppercase">{manualTicket.id}</p>
                        <p className="text-[8px] font-mono text-sand/60 uppercase tracking-wider mt-1">SCAN RECORD CONTROL</p>
                      </div>
                    </div>
                  </div>

                  {/* Actions for manual ticket */}
                  <div className="mt-8 flex flex-wrap gap-4 justify-center no-print">
                    <button
                      onClick={() => handleDownloadManualTicket(manualTicket)}
                      className="flex items-center justify-center gap-2 px-6 py-3 bg-sand text-obsidian text-xs font-bold uppercase tracking-widest transition-colors hover:bg-sand/85 cursor-pointer shadow-md"
                    >
                      <Download className="w-4 h-4" /> Download Ticket (PNG)
                    </button>
                    <button
                      onClick={() => window.print()}
                      className="flex items-center justify-center gap-2 px-6 py-3 bg-pearl/5 hover:bg-pearl/10 border border-sand/30 text-pearl text-xs font-semibold uppercase tracking-widest transition-colors cursor-pointer"
                    >
                      <Printer className="w-4 h-4 text-sand" /> Print / Save PDF
                    </button>
                    <button
                      onClick={() => copyManualRefCode(manualTicket.id)}
                      className="flex items-center justify-center gap-2 px-6 py-3 bg-pearl/5 hover:bg-pearl/10 border border-sand/30 text-pearl text-xs font-semibold uppercase tracking-widest transition-colors cursor-pointer"
                    >
                      <Copy className="w-4 h-4 text-sand" /> {copiedLink ? 'Copied Code!' : 'Copy Ticket Code'}
                    </button>
                    <button
                      onClick={() => setManualTicket(null)}
                      className="flex items-center justify-center gap-2 px-6 py-3 bg-crimson hover:bg-crimson/90 text-pearl text-xs font-bold uppercase tracking-widest transition-colors cursor-pointer"
                    >
                      Proceed to Register Another <ArrowLeft className="w-4 h-4 rotate-180" />
                    </button>
                  </div>
                </div>
              ) : (
                /* LUXURY MANUAL INPUT FORM - MATCHES ORIGINAL PAYMENT VISUALS */
                <form
                  onSubmit={handleManualRegister}
                  className="max-w-xl mx-auto p-8 md:p-10 bg-pearl/[0.02] border border-sand/20 shadow-2xl relative text-left"
                >
                  <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t-2 border-l-2 border-sand" />
                  <div className="absolute top-0 right-0 w-2.5 h-2.5 border-t-2 border-r-2 border-sand" />
                  <div className="absolute bottom-0 left-0 w-2.5 h-2.5 border-b-2 border-l-2 border-sand" />
                  <div className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b-2 border-r-2 border-sand" />

                  <div className="mb-6">
                    <h2 className="font-serif text-2xl text-pearl font-normal leading-tight">Manual Registrant Intake</h2>
                    <p className="text-xs text-sand/65 font-mono tracking-widest uppercase mt-1">Cash Intake / Ticket Issuance Desk</p>
                    <div className="w-10 h-[1px] bg-sand/30 mt-3.5" />
                  </div>

                  {newRegisterError && (
                    <div className="mb-6 p-4 bg-crimson/10 border border-crimson/30 text-rose-500 text-xs font-mono">
                      {newRegisterError}
                    </div>
                  )}

                  <div className="space-y-5">
                    {/* Full Name */}
                    <div>
                      <label htmlFor="fullNameAdmin" className="block text-[10px] font-mono uppercase tracking-widest text-[#B38F6F] mb-1.5">
                        Full Name
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sand/40">
                          <User className="w-4 h-4" />
                        </span>
                        <input
                          type="text"
                          id="fullNameAdmin"
                          required
                          value={newGuestName}
                          onChange={(e) => setNewGuestName(e.target.value)}
                          placeholder="e.g. Samuel Amankwah"
                          className="w-full bg-obsidian border border-sand/20 focus:border-sand/70 focus:outline-none pl-10 pr-4 py-3 text-xs text-pearl placeholder-pearl/20 font-sans tracking-wide"
                        />
                      </div>
                    </div>

                    {/* Email and Phone */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label htmlFor="emailAdmin" className="block text-[10px] font-mono uppercase tracking-widest text-[#B38F6F] mb-1.5">
                          Email Address
                        </label>
                        <div className="relative">
                          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sand/40">
                            <Mail className="w-4 h-4" />
                          </span>
                          <input
                            type="email"
                            id="emailAdmin"
                            required
                            value={newGuestEmail}
                            onChange={(e) => setNewGuestEmail(e.target.value)}
                            placeholder="e.g. samuel@example.com"
                            className="w-full bg-obsidian border border-sand/20 focus:border-sand/70 focus:outline-none pl-10 pr-4 py-3 text-xs text-pearl placeholder-pearl/20 font-sans tracking-wide"
                          />
                        </div>
                      </div>

                      <div>
                        <label htmlFor="phoneAdmin" className="block text-[10px] font-mono uppercase tracking-widest text-[#B38F6F] mb-1.5">
                          Phone Number
                        </label>
                        <div className="relative">
                          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sand/40">
                            <Phone className="w-4 h-4" />
                          </span>
                          <input
                            type="text"
                            id="phoneAdmin"
                            required
                            value={newGuestPhone}
                            onChange={(e) => setNewGuestPhone(e.target.value)}
                            placeholder="e.g. 0244558899"
                            className="w-full bg-obsidian border border-sand/20 focus:border-sand/70 focus:outline-none pl-10 pr-4 py-3 text-xs text-pearl placeholder-pearl/20 font-sans tracking-wide"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Seating coordinates selection */}
                    <div>
                      <label htmlFor="guestTypeAdmin" className="block text-[10px] font-mono uppercase tracking-widest text-[#B38F6F] mb-1.5">
                        Booking Seating Pass
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sand/40">
                          <Ticket className="w-4 h-4" />
                        </span>
                        <select
                          id="guestTypeAdmin"
                          value={newGuestType}
                          onChange={(e) => setNewGuestType(e.target.value as TicketType)}
                          className="w-full bg-obsidian border border-sand/20 focus:border-sand/70 focus:outline-none pl-10 pr-4 py-3 text-xs text-pearl font-semibold appearance-none cursor-pointer outline-none font-sans"
                        >
                          <option value="Single" className="bg-obsidian text-pearl">Single Pass — GH₵ 100</option>
                          <option value="Double" className="bg-obsidian text-pearl">Double Companion Pass — GH₵ 180</option>
                          <option value="Table of 4" className="bg-obsidian text-pearl">Table of 4 — GH₵ 350</option>
                        </select>
                      </div>
                    </div>

                    {/* Payment Plan Dropdown for Admin modal */}
                    <div className="mt-4">
                      <label htmlFor="guestPaymentAdmin" className="block text-[10px] font-mono uppercase tracking-widest text-[#B38F6F] mb-2">
                        Payment Mode (Amount Paid Now)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sand/40 font-serif font-bold text-xs select-none">
                          GH₵
                        </span>
                        <select
                          id="guestPaymentAdmin"
                          value={newGuestPayment}
                          onChange={(e) => setNewGuestPayment(Number(e.target.value))}
                          className="w-full bg-obsidian border border-sand/20 focus:border-sand/70 focus:outline-none pl-11 pr-4 py-3 text-xs text-pearl font-semibold appearance-none cursor-pointer outline-none font-sans"
                        >
                          {(() => {
                            const fullPrice = newGuestType === 'Table of 4' ? 350 : (newGuestType === 'Double' ? 180 : 100);
                            const optionsList = [25, 50, 60, 100, 180, 200, 250, 350];
                            const validOptions = optionsList.filter(amt => amt <= fullPrice);
                            return validOptions.map(amt => (
                              <option key={amt} value={amt} className="bg-obsidian text-pearl">
                                GH₵ {amt} {amt === fullPrice ? '(Paid in Full)' : '(Installment)'}
                              </option>
                            ));
                          })()}
                        </select>
                      </div>
                    </div>

                    {/* Pricing with detailed summary */}
                    <div className="pt-4 border-t border-sand/10 flex justify-between items-baseline select-none">
                      <div>
                        <p className="text-[10px] font-mono uppercase tracking-wider text-pearl/40">Admission Payment Summary</p>
                        <p className="text-xs text-sand/65 font-light font-sans mt-0.5">
                          Tier: {newGuestType} Pass (GH₵ {newGuestType === 'Table of 4' ? 350 : (newGuestType === 'Double' ? 180 : 100)})
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-baseline gap-1 justify-end">
                          <span className="text-xs font-sans text-sand/70">Paid: GH₵</span>
                          <span className="text-2xl font-serif text-[#B38F6F] font-bold">
                            {newGuestPayment}
                          </span>
                        </div>
                        {(() => {
                          const fullPrice = newGuestType === 'Table of 4' ? 350 : (newGuestType === 'Double' ? 180 : 100);
                          const balance = fullPrice - newGuestPayment;
                          if (balance > 0) {
                            return (
                              <p className="text-[10px] text-amber-500 font-mono mt-0.5 font-semibold">
                                Pending Bal: GH₵ {balance}
                              </p>
                            );
                          } else {
                            return (
                              <p className="text-[10px] text-emerald-400 font-mono mt-0.5 font-semibold">
                                ✓ Fully Paid
                              </p>
                            );
                          }
                        })()}
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isGenerating}
                      className="w-full py-4 bg-sand text-obsidian text-xs font-bold uppercase tracking-[0.2em] transition-all duration-300 shadow-xl flex items-center justify-center gap-2 cursor-pointer mt-4"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-obsidian" />
                          <span>Generating Secure Ticket Code...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Generate Pass & Save to Database</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      )}

      {deleteConfirmTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-obsidian/95 backdrop-blur-sm animate-fade-in-up no-print">
          <div className="relative w-full max-w-md bg-gradient-to-b from-[#1c0205] to-[#0c0001] border-2 border-red-500/40 p-8 shadow-2xl rounded-xl">
            {/* Elegant luxury gold/crimson styling corner accents */}
            <div className="absolute top-0 left-0 w-3.5 h-3.5 border-t-2 border-l-2 border-red-500/50" />
            <div className="absolute top-0 right-0 w-3.5 h-3.5 border-t-2 border-r-2 border-red-500/50" />
            <div className="absolute bottom-0 left-0 w-3.5 h-3.5 border-b-2 border-l-2 border-red-500/50" />
            <div className="absolute bottom-0 right-0 w-3.5 h-3.5 border-b-2 border-r-2 border-red-500/50" />

            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-red-500/10 border border-red-500/30 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <h2 className="font-serif text-2xl text-pearl leading-tight font-semibold">Revoke Banquet Admission?</h2>
              <p className="text-[10px] font-mono text-[#B38F6F] tracking-widest uppercase mt-2">CONFIRM TRANSACTION CANCELLATION</p>
            </div>

            <div className="bg-[#050000] border border-red-500/15 p-5 mb-6 text-left rounded-lg space-y-3 font-sans">
              <div>
                <span className="text-[9px] font-mono text-sand/40 uppercase block">Ticket Identifier</span>
                <span className="text-xs font-mono font-bold text-pearl select-all">{deleteConfirmTarget.id}</span>
              </div>
              <div>
                <span className="text-[9px] font-mono text-sand/40 uppercase block">Primary Guest Name</span>
                <span className="text-sm font-semibold text-pearl">{deleteConfirmTarget.registration.fullName}</span>
              </div>
              <div>
                <span className="text-[9px] font-mono text-[#B38F6F] uppercase block">Pass Category</span>
                <span className="text-xs font-mono font-bold text-sand uppercase">
                  {deleteConfirmTarget.registration.ticketType} Pass
                </span>
              </div>
              <div className="pt-2.5 border-t border-red-500/10 text-[10.5px] text-pearl/50 leading-relaxed font-sans mt-2.5 flex gap-2">
                <span className="text-rose-500 font-bold">⚠️</span>
                <span>
                  Deleting this entry will permanently revoke active list credentials and render the associated ticket's scannable barcode invalid at check-in.
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeleteConfirmTarget(null)}
                className="w-full sm:w-1/2 py-3 border border-sand/20 hover:border-sand/40 text-[#B38F6F] text-xs font-bold tracking-widest uppercase bg-[#B38F6F]/5 hover:bg-[#B38F6F]/10 transition-colors cursor-pointer"
              >
                Keep Booking
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={confirmDeleteAttendee}
                className="w-full sm:w-1/2 py-3 bg-red-600 hover:bg-red-700 disabled:bg-red-800/40 text-pearl text-xs font-bold tracking-widest uppercase transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-lg"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-pearl" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Confirm Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {recordPaymentTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-obsidian/95 backdrop-blur-sm animate-fade-in-up no-print">
          <div className="relative w-full max-w-md bg-gradient-to-b from-[#120002] to-[#040001] border-2 border-[#B38F6F] p-8 shadow-2xl rounded-xl">
            {/* Elegant luxury gold/crimson styling corner accents */}
            <div className="absolute top-0 left-0 w-3.5 h-3.5 border-t-2 border-l-2 border-[#B38F6F]/50" />
            <div className="absolute top-0 right-0 w-3.5 h-3.5 border-t-2 border-r-2 border-[#B38F6F]/50" />
            <div className="absolute bottom-0 left-0 w-3.5 h-3.5 border-b-2 border-l-2 border-[#B38F6F]/50" />
            <div className="absolute bottom-0 right-0 w-3.5 h-3.5 border-b-2 border-r-2 border-[#B38F6F]/50" />

            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-amber-500/10 border border-amber-500/30 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Coins className="w-8 h-8" />
              </div>
              <h2 className="font-serif text-2.5xl text-pearl leading-tight font-semibold">Record Installment</h2>
              <p className="text-[10px] font-mono text-[#B38F6F] tracking-widest uppercase mt-2">Update Attendee Balance Information</p>
            </div>

            <div className="bg-[#0c0001] border border-sand/15 p-5 mb-6 text-left rounded-lg space-y-3 font-sans">
              <div>
                <span className="text-[9px] font-mono text-sand/40 uppercase block">Ticket ID</span>
                <span className="text-xs font-mono font-bold text-pearl select-all">{recordPaymentTarget.id}</span>
              </div>
              <div>
                <span className="text-[9px] font-mono text-sand/40 uppercase block">Attendee Name</span>
                <span className="text-sm font-semibold text-pearl">{recordPaymentTarget.registration.fullName}</span>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-1">
                <div>
                  <span className="text-[9px] font-mono text-sand/40 uppercase block">Current Paid</span>
                  <span className="text-xs font-mono text-emerald-400 font-bold block mt-0.5">GH₵ {recordPaymentTarget.amountPaid}</span>
                </div>
                <div>
                  <span className="text-[9px] font-mono text-sand/40 uppercase block">Remaining Balance</span>
                  <span className="text-xs font-mono text-amber-500 font-bold block mt-0.5">
                    GH₵ {(recordPaymentTarget.registration.ticketType === 'Table of 4' ? 350 : (recordPaymentTarget.registration.ticketType === 'Double' ? 180 : 100)) - (recordPaymentTarget.amountPaid || 0)}
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-sand/10">
                <label htmlFor="extraPaymentInput" className="block text-[10px] font-mono uppercase tracking-widest text-[#B38F6F] mb-2 font-semibold">
                  Amount Received (GH₵)
                </label>
                <input
                  id="extraPaymentInput"
                  type="number"
                  min="1"
                  max={(recordPaymentTarget.registration.ticketType === 'Table of 4' ? 350 : (recordPaymentTarget.registration.ticketType === 'Double' ? 180 : 100)) - (recordPaymentTarget.amountPaid || 0)}
                  value={extraPaymentAmount}
                  onChange={(e) => setExtraPaymentAmount(Number(e.target.value))}
                  className="w-full bg-obsidian border border-sand/35 focus:border-[#B38F6F] text-pearl font-serif font-bold text-lg p-2.5 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                disabled={isRecordingPayment}
                onClick={() => setRecordPaymentTarget(null)}
                className="w-full sm:w-1/2 py-3 border border-sand/20 hover:border-sand/40 text-pearl text-xs font-bold tracking-widest uppercase bg-pearl/5 hover:bg-pearl/10 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isRecordingPayment}
                onClick={async () => {
                  setIsRecordingPayment(true);
                  const fullPrice = recordPaymentTarget.registration.ticketType === 'Table of 4' ? 350 : (recordPaymentTarget.registration.ticketType === 'Double' ? 180 : 100);
                  const newTotalPaid = Math.min((recordPaymentTarget.amountPaid || 0) + extraPaymentAmount, fullPrice);
                  
                  const updatedRecord: BookingConfirmation = {
                    ...recordPaymentTarget,
                    amountPaid: newTotalPaid,
                    status: newTotalPaid >= fullPrice ? 'Confirmed' : 'Pending'
                  };

                  try {
                    await addBookingToFirestore(updatedRecord);
                    const updatedList = attendees.map(a => a.id === updatedRecord.id ? updatedRecord : a);
                    localStorage.setItem('wcf_registrations', JSON.stringify(updatedList));
                    setAttendees(updatedList);
                    setRecordPaymentTarget(null);
                  } catch (err) {
                    console.error("Failed to update booking amountPaid inside Firestore:", err);
                  } finally {
                    setIsRecordingPayment(false);
                  }
                }}
                className="w-full sm:w-1/2 py-3 bg-[#B38F6F] hover:bg-[#8f6f52] disabled:bg-sand/30 text-obsidian font-bold text-xs tracking-widest uppercase transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-lg"
              >
                {isRecordingPayment ? (
                  <>
                    <Loader2 className="w-4.5 h-4.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Coins className="w-4 h-4" />
                    <span>Confirm</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
