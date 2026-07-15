/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Star, Users, Crown } from 'lucide-react';
import { ViewPath, TicketConfig, TicketType } from '../types';

interface TicketSectionProps {
  setView: (view: ViewPath) => void;
  onSelectTicket: (ticketType: TicketType) => void;
}

export const TICKET_PACKAGES: TicketConfig[] = [
  {
    type: 'Single',
    price: 100,
    description: 'A solo invitation to an unforgettable evening of connection, delightful cuisine, and golden fellowship.'
  },
  {
    type: 'Double',
    price: 180,
    description: 'A shared enrollment tailored perfectly for couples, best friends, or closest companions celebrating together.'
  },
  {
    type: 'Table of 4',
    price: 350,
    description: 'An exclusive collective reservation for up to four guests, offering a reserved group table experience for the banquet.'
  }
];

export default function TicketSection({ setView, onSelectTicket }: TicketSectionProps) {
  const handleReserve = (type: TicketType) => {
    onSelectTicket(type);
    setView('register');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <section
      id="ticket-packages-section"
      className="py-24 md:py-32 bg-obsidian border-t border-sand/5 relative overflow-hidden"
    >
      <div className="absolute top-1/2 left-[10%] -translate-y-1/2 w-[300px] h-[300px] rounded-full crimson-gradient opacity-30 blur-[80px]" />
      
      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        {/* SECTION HEADER */}
        <div className="text-center max-w-2xl mx-auto mb-16 md:mb-24">
          <p className="text-[10px] uppercase font-mono tracking-[0.3em] text-sand mb-3 block">
            Exquisite Offerings
          </p>
          <h2 className="text-4xl md:text-5xl lg:text-6xl text-pearl font-normal tracking-tight font-serif-luxury leading-tight">
            Reserve Your Portal
          </h2>
          <div className="w-12 h-[1px] bg-sand mx-auto mt-6" />
          <p className="mt-6 text-sm md:text-base text-pearl/60 font-light font-sans leading-relaxed">
            Choose between our tailored packages, curated to provide a frictionless, luxurious access path to Dinner Night ’26.
          </p>
        </div>

        {/* PRICE CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {TICKET_PACKAGES.map((pkg) => {
            const isDouble = pkg.type === 'Double';
            const isTable = pkg.type === 'Table of 4';
            const highlightClass = isDouble
              ? 'border-sand bg-obsidian shadow-2xl shadow-crimson/10'
              : 'border-sand/20 bg-pearl/[0.02] hover:border-sand/40';

            return (
              <div
                key={pkg.type}
                className={`relative flex flex-col justify-between p-8 md:p-10 h-full transition-all duration-500 ease-in-out border ${highlightClass}`}
              >
                {/* DECORATIVE CORNER ACCENTS FOR LUXURY INDIVIDUALIZATION */}
                <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t border-l border-sand/40" />
                <div className="absolute top-0 right-0 w-2.5 h-2.5 border-t border-r border-sand/40" />
                <div className="absolute bottom-0 left-0 w-2.5 h-2.5 border-b border-l border-sand/40" />
                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b border-r border-sand/40" />

                {/* CARD BODY */}
                <div>
                  {/* LABEL BAR */}
                  <div className="flex items-center justify-between mb-6">
                    <p className="text-xs font-mono uppercase tracking-[0.25em] text-sand font-medium">
                      {pkg.type} Entry
                    </p>
                    {isTable ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[9px] font-mono uppercase tracking-widest rounded-full">
                        <Crown className="w-3 h-3 text-amber-400" /> Royal Group
                      </span>
                    ) : isDouble ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-sand/15 text-sand border border-sand/30 text-[9px] font-mono uppercase tracking-widest rounded-full">
                        <Users className="w-3 h-3" /> Popular Choice
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-pearl/5 text-pearl/60 border border-pearl/10 text-[9px] font-mono tracking-widest rounded-full">
                        <Star className="w-3 h-3" /> Solo Grace
                      </span>
                    )}
                  </div>

                  {/* PRICE DISPLAY */}
                  <div className="mb-8">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-lg md:text-xl font-sans font-light text-sand">GH₵</span>
                      <span className="text-4xl md:text-5xl font-light tracking-tight text-pearl font-serif font-serif-luxury">
                        {pkg.price}
                      </span>
                    </div>
                    <p className="text-xs text-pearl/40 mt-1 font-mono tracking-wider">All-inclusive admission ticket</p>
                  </div>

                  <p className="text-xs md:text-sm text-pearl/70 leading-relaxed font-light mb-12 border-t border-sand/10 pt-6">
                    {pkg.description}
                  </p>
                </div>

                {/* ACTION BUTTON */}
                <button
                  onClick={() => handleReserve(pkg.type)}
                  className={`w-full py-4 text-xs font-medium uppercase tracking-[0.2em] transition-all duration-300 cursor-pointer ${
                    isDouble
                      ? 'bg-sand hover:bg-sand/90 text-obsidian border border-sand font-semibold'
                      : 'bg-transparent hover:bg-pearl/5 text-pearl border border-sand/30 hover:border-sand'
                  }`}
                >
                  Reserve {pkg.type} Pass
                </button>
              </div>
            );
          })}
        </div>

        {/* REASSURANCE BAR */}
        <div className="mt-20 border-t border-sand/10 max-w-4xl mx-auto pt-8 flex items-center justify-center text-center text-pearl/50">
          <div className="text-xs font-mono tracking-wider text-sand uppercase">
            WCF-KNUST • Winners' Campus Fellowship
          </div>
        </div>
      </div>
    </section>
  );
}
