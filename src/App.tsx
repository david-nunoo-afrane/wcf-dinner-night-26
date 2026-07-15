/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import TicketSection from './components/TicketSection';
import RegistrationForm from './components/RegistrationForm';
import ContactView from './components/ContactView';
import AttendeesView from './components/AttendeesView';
import Footer from './components/Footer';
import { ViewPath, TicketType } from './types';

export default function App() {
  const [currentView, setView] = useState<ViewPath>('home');
  const [selectedTicketType, setSelectedTicketType] = useState<TicketType>('Single');
  
  // Prefilled from user metadata if provided
  const primaryUserEmail = "davidafrane637@gmail.com";

  const handleSelectTicket = (type: TicketType) => {
    setSelectedTicketType(type);
  };

  const handleScrollToPackages = () => {
    const section = document.getElementById('ticket-packages-section');
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="relative min-h-screen bg-obsidian text-pearl font-sans selection:bg-crimson selection:text-pearl flex flex-col justify-between">
      {/* GLOBAL BACKGROUND NOISE & GRADIENT ATMOSPHERE */}
      <div className="fixed inset-0 pointer-events-none select-none z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-crimson/15 via-obsidian/40 to-obsidian" />
        <div className="absolute inset-0 opacity-[0.015] bg-[radial-gradient(#b38f6f_1px,transparent_1px)] [background-size:16px_16px]" />
      </div>

      {/* FIXED NAVBAR */}
      <Navbar currentView={currentView} setView={setView} />

      {/* CORE ROUTING SECTION */}
      <main className="flex-grow relative z-10">
        {currentView === 'home' && (
          <div className="animate-fade-in-up">
            <Hero setView={setView} onViewPackages={handleScrollToPackages} />
            <TicketSection setView={setView} onSelectTicket={handleSelectTicket} />
          </div>
        )}

        {currentView === 'register' && (
          <div className="animate-fade-in-up">
            <RegistrationForm
              selectedTicketType={selectedTicketType}
              setSelectedTicketType={setSelectedTicketType}
              setView={setView}
            />
          </div>
        )}

        {currentView === 'contact' && (
          <div className="animate-fade-in-up">
            <ContactView userEmail={primaryUserEmail} />
          </div>
        )}

        {currentView === 'attendees' && (
          <div className="animate-fade-in-up">
            <AttendeesView onBack={() => setView('home')} />
          </div>
        )}
      </main>

      {/* GLOBAL FOOTER */}
      <Footer setView={setView} />
    </div>
  );
}

