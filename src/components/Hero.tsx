/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { ViewPath } from '../types';
import WcfLogo from './WcfLogo';
import WinnersLogo from './WinnersLogo';
// @ts-ignore
import heroBg from '../assets/images/dark_skinned_toast_1779788617328.png';

interface HeroProps {
  setView: (view: ViewPath) => void;
  onViewPackages: () => void;
}

export default function Hero({ setView, onViewPackages }: HeroProps) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false,
    targetYear: 2026
  });

  useEffect(() => {
    const baseTarget = new Date('2026-09-04T19:00:00');
    const now = new Date();
    // To keep the numbers ticking down beautifully for the preview, if September 4, 2026 has passed,
    // we dynamically target September 4, 2027 so the numbers are active and elegant.
    const hasPassed = now > baseTarget;
    const target = hasPassed ? new Date('2027-09-04T19:00:00') : baseTarget;
    const targetYear = target.getFullYear();

    const calculateTimeLeft = () => {
      const difference = target.getTime() - new Date().getTime();
      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true, targetYear });
        return;
      }

      setTimeLeft({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
        isExpired: false,
        targetYear
      });
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, []);
  return (
    <section
      id="hero-section"
      className="relative min-h-screen flex flex-col justify-center items-center px-6 md:px-12 pt-28 pb-16 overflow-hidden bg-obsidian"
    >
      {/* cinematic BACKGROUND toast IMAGE WITH LUXURY OVERLAYS */}
      <div className="absolute inset-0 w-full h-full z-0 select-none pointer-events-none overflow-hidden">
        <img
          src={heroBg}
          alt="Elegant dark-skinned hands raising crystal glasses in toast"
          className="w-full h-full object-cover object-center opacity-[0.70] scale-100 filter brightness-[1.15] transition-all duration-1000"
          referrerPolicy="no-referrer"
        />
        {/* Luxury crimson and sand atmospheric glow */}
        <div className="absolute inset-0 bg-gradient-to-b from-obsidian/25 via-obsidian/60 to-obsidian/95" />
        <div className="absolute top-[20%] left-1/2 -translate-x-1/2 -translate-y-[20%] w-[80vw] h-[80vw] max-w-[800px] rounded-full crimson-gradient opacity-[0.7] pointer-events-none" />
        <div className="absolute bottom-[10%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-sand/5 blur-[100px] pointer-events-none" />
      </div>

      {/* FLYER INSPIRATION: INTENDED GLASS RIPPLES */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-7xl px-12 flex justify-between opacity-10 pointer-events-none select-none z-0">
        <div className="w-[1px] h-full bg-gradient-to-b from-transparent via-sand to-transparent" />
        <div className="hidden md:block w-[1px] h-full bg-gradient-to-b from-transparent via-sand to-transparent" />
        <div className="hidden md:block w-[1px] h-full bg-gradient-to-b from-transparent via-sand to-transparent" />
        <div className="w-[1px] h-full bg-gradient-to-b from-transparent via-sand to-transparent" />
      </div>

      {/* HERO MAIN BODY */}
      <div className="relative z-10 max-w-4xl w-full text-center flex flex-col items-center">
        {/* PRESENTATION LOGO & TEXT */}
        <div className="mb-6 flex flex-col items-center gap-4 animate-fade-in-up">
          <div className="flex items-center justify-center gap-6 sm:gap-8">
            <WcfLogo className="w-28 h-28 sm:w-32 sm:h-32 filter drop-shadow-[0_0_25px_rgba(113,0,20,0.4)] hover:scale-105 transition-transform duration-300 object-contain" size={128} />
            <div className="w-px h-16 sm:h-20 bg-sand/25 self-center" />
            <WinnersLogo className="w-28 h-28 sm:w-32 sm:h-32 filter drop-shadow-[0_0_25px_rgba(179,143,111,0.3)] hover:scale-105 transition-transform duration-300 object-contain" size={128} />
          </div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-pearl/5 border border-sand/20 rounded-full backdrop-blur-sm mt-3">
            <span className="w-1.5 h-1.5 rounded-full bg-sand animate-pulse" />
            <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-sand font-medium">
              Winners' Chapel Int. & WCF Present
            </span>
          </div>
        </div>

        {/* MAIN TYPOGRAPHY TITLE */}
        <h1 className="text-6xl sm:text-7xl md:text-9xl tracking-tight text-pearl font-normal leading-[0.9] select-none animate-fade-in-up [animation-delay:200ms]">
          Dinner <br />
          <span className="font-serif italic text-sand-heavy text-transparent bg-gradient-to-r from-sand to-pearl bg-clip-text font-light">
            Night ’26
          </span>
        </h1>

        {/* SUBTITLE */}
        <p className="mt-8 text-sm sm:text-base md:text-lg text-pearl/75 font-sans font-light tracking-wide max-w-2xl leading-relaxed animate-fade-in-up [animation-delay:400ms]">
          The premier dinner experience hosted by WCF-KNUST — an evening of elegance, connection, and unforgettable moments.
        </p>

        {/* SOPHISTICATED COUNTDOWN TIMER COMPONENT */}
        <div className="mt-10 w-full max-w-lg mx-auto p-6 bg-gradient-to-b from-[#130d0a]/80 to-[#050302]/90 border border-[#B38F6F]/25 rounded-xl shadow-[0_15px_40px_rgba(0,0,0,0.6)] backdrop-blur-md relative select-none animate-fade-in-up [animation-delay:450ms] group hover:border-[#B38F6F]/45 transition-colors duration-300">
          {/* Subtle gold luxury corner accents */}
          <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t border-l border-[#B38F6F]/40 rounded-tl-sm" />
          <div className="absolute top-0 right-0 w-2.5 h-2.5 border-t border-r border-[#B38F6F]/40 rounded-tr-sm" />
          <div className="absolute bottom-0 left-0 w-2.5 h-2.5 border-b border-l border-[#B38F6F]/40 rounded-bl-sm" />
          <div className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b border-r border-[#B38F6F]/40 rounded-br-sm" />

          <p className="text-[9px] uppercase tracking-[0.3em] font-mono text-sand/65 mb-4 font-semibold text-center">
            {timeLeft.targetYear === 2026 ? "DINNER NIGHT '26 COUNTDOWN" : "COUNTDOWN TO THE GOLDEN EVENT"}
          </p>

          <div className="flex justify-center items-center gap-2 sm:gap-4 font-serif">
            {/* Days */}
            <div className="flex flex-col items-center">
              <div className="relative w-16 sm:w-20 h-16 sm:h-20 bg-[#1e1410] border border-[#B38F6F]/20 rounded-md flex items-center justify-center shadow-inner overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1/2 bg-white/[0.01] border-b border-pearl/5" />
                <span className="text-2xl sm:text-3xl text-sand font-light tracking-wide">
                  {String(timeLeft.days).padStart(2, '0')}
                </span>
              </div>
              <span className="text-[8px] sm:text-[9px] font-mono tracking-widest text-pearl/40 uppercase mt-2">Days</span>
            </div>

            <span className="text-sand/30 text-lg sm:text-xl font-light mb-5 animate-pulse">:</span>

            {/* Hours */}
            <div className="flex flex-col items-center">
              <div className="relative w-16 sm:w-20 h-16 sm:h-20 bg-[#1e1410] border border-[#B38F6F]/20 rounded-md flex items-center justify-center shadow-inner overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1/2 bg-white/[0.01] border-b border-pearl/5" />
                <span className="text-2xl sm:text-3xl text-sand font-light tracking-wide">
                  {String(timeLeft.hours).padStart(2, '0')}
                </span>
              </div>
              <span className="text-[8px] sm:text-[9px] font-mono tracking-widest text-pearl/40 uppercase mt-2">Hours</span>
            </div>

            <span className="text-sand/30 text-lg sm:text-xl font-light mb-5 animate-pulse">:</span>

            {/* Minutes */}
            <div className="flex flex-col items-center">
              <div className="relative w-16 sm:w-20 h-16 sm:h-20 bg-[#1e1410] border border-[#B38F6F]/20 rounded-md flex items-center justify-center shadow-inner overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1/2 bg-white/[0.01] border-b border-pearl/5" />
                <span className="text-2xl sm:text-3xl text-sand font-light tracking-wide">
                  {String(timeLeft.minutes).padStart(2, '0')}
                </span>
              </div>
              <span className="text-[8px] sm:text-[9px] font-mono tracking-widest text-pearl/40 uppercase mt-2">Mins</span>
            </div>

            <span className="text-sand/30 text-lg sm:text-xl font-light mb-5 animate-pulse">:</span>

            {/* Seconds */}
            <div className="flex flex-col items-center">
              <div className="relative w-16 sm:w-20 h-16 sm:h-20 bg-[#1e1410]/90 border border-crimson/25 rounded-md flex items-center justify-center shadow-inner overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1/2 bg-white/[0.01] border-b border-pearl/5" />
                <span className="text-2xl sm:text-3xl text-crimson font-light tracking-wide animate-pulse">
                  {String(timeLeft.seconds).padStart(2, '0')}
                </span>
              </div>
              <span className="text-[8px] sm:text-[9px] font-mono tracking-widest text-pearl/40 uppercase mt-2 animate-pulse">Secs</span>
            </div>
          </div>
        </div>

        {/* DYNAMIC METADATA - CLEAN MINIMALISM LAYOUT */}
        <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-12 w-full max-w-2xl text-center sm:text-left border-y border-sand/15 py-6 font-sans text-pearl/80 animate-fade-in-up [animation-delay:500ms]">
          <div className="flex flex-col items-center sm:items-start">
            <span className="text-[9px] uppercase tracking-[0.2em] text-sand mb-1 font-mono">Date</span>
            <span className="text-sm font-medium tracking-wide uppercase">Friday, September 4, 2026</span>
          </div>
          <div className="hidden sm:block w-px h-8 bg-pearl/20" />
          <div className="flex flex-col items-center sm:items-start">
            <span className="text-[9px] uppercase tracking-[0.2em] text-sand mb-1 font-mono">Location</span>
            <span className="text-sm font-medium tracking-wide uppercase">TBD</span>
          </div>
        </div>

        {/* CTA ACTIONS */}
        <div className="mt-10 flex flex-col sm:flex-row gap-4 items-center animate-fade-in-up [animation-delay:600ms]">
          <button
            onClick={() => setView('register')}
            className="w-full sm:w-auto px-8 py-3.5 bg-crimson hover:bg-crimson/90 text-pearl text-xs tracking-[0.2em] font-medium uppercase font-sans border border-crimson transition-all duration-300 shadow-lg hover:shadow-crimson/20 cursor-pointer"
          >
            Reserve Seat
          </button>
          <button
            onClick={onViewPackages}
            className="w-full sm:w-auto px-8 py-3.5 bg-transparent hover:bg-pearl/5 text-sand text-xs tracking-[0.2em] font-medium uppercase font-sans border border-sand/45 hover:border-sand transition-all duration-300 cursor-pointer"
          >
            View Packages
          </button>
        </div>
      </div>

      {/* FLYER INTERACTIVE TRACE: "ANTICIPATE" SIGNATURE SECTION */}
      <div className="relative mt-20 md:mt-24 z-10 flex flex-col items-center select-none animate-fade-in-up [animation-delay:750ms]">
        <div className="text-[10px] uppercase font-mono tracking-[0.4em] text-sand/50 mb-3 font-light">
          Flyer Signature
        </div>
        
        <div className="relative w-56 h-20 flex items-center justify-center">
          <p className="font-serif italic text-4xl tracking-widest text-pearl/90 relative z-10">
            Anticipate
          </p>
          <div className="absolute right-[-10px] top-[10px] w-2 h-2 rounded-full bg-crimson animate-ping" />
        </div>

        {/* PULSING DOT CIRCLE INSPIRED BY THE FLYER LOADING ICON */}
        <div className="mt-4 flex items-center justify-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-sand/60 animate-bounce duration-1000" />
          <span className="w-1.5 h-1.5 rounded-full bg-sand/40 animate-bounce duration-1000 [animation-delay:200ms]" />
          <span className="w-1.5 h-1.5 rounded-full bg-sand/30 animate-bounce duration-1000 [animation-delay:400ms]" />
          <span className="w-1.5 h-1.5 rounded-full bg-sand/20 animate-bounce duration-1000 [animation-delay:600ms]" />
          <span className="w-1.5 h-1.5 rounded-full bg-sand/10 animate-bounce duration-1000 [animation-delay:800ms]" />
        </div>
      </div>

      {/* FOOTER SCROLL DOWN ARROW */}
      <button
        onClick={onViewPackages}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 text-sand/40 hover:text-sand transition-colors duration-300 z-10 flex flex-col items-center gap-1 cursor-pointer focus:outline-none"
        aria-label="Scroll to packages"
      >
        <span className="text-[9px] font-mono tracking-widest uppercase">Explore Night</span>
        <ChevronDown className="w-4 h-4 animate-bounce" />
      </button>
    </section>
  );
}
