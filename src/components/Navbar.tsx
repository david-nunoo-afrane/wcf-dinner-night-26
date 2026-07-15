/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Menu, X, ArrowRight } from 'lucide-react';
import { ViewPath } from '../types';
import WcfLogo from './WcfLogo';
import WinnersLogo from './WinnersLogo';

interface NavbarProps {
  currentView: ViewPath;
  setView: (view: ViewPath) => void;
}

export default function Navbar({ currentView, setView }: NavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Home', path: 'home' as ViewPath },
    { name: 'Register', path: 'register' as ViewPath },
    { name: 'Contact', path: 'contact' as ViewPath },
    { name: 'DEV', path: 'attendees' as ViewPath },
  ];

  const handleNavClick = (path: ViewPath) => {
    setView(path);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <nav
      id="main-app-navbar"
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-in-out py-4 md:py-6 ${
        isScrolled
          ? 'bg-obsidian/80 backdrop-blur-md border-b border-sand/10 shadow-lg'
          : 'bg-transparent border-b border-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-12 flex items-center justify-between">
        {/* LOGO & BRANDING */}
         <button
          onClick={() => handleNavClick('home')}
          className="flex items-center gap-3.5 group text-left focus:outline-none"
          aria-label="WCF-KNUST Home"
        >
          <div className="flex items-center gap-2">
            <WcfLogo className="w-12 h-12 md:w-14 md:h-14 group-hover:scale-105 transition-transform duration-300 object-contain" size={56} />
            <WinnersLogo className="w-12 h-12 md:w-14 md:h-14 group-hover:scale-105 transition-transform duration-300 object-contain" size={56} />
          </div>
          <div className="flex flex-col">
            <span className="font-serif text-base tracking-wider font-semibold text-pearl leading-none group-hover:text-sand transition-colors duration-300">
              WCF • KNUST
            </span>
            <span className="text-[8px] font-mono tracking-widest text-sand uppercase font-medium mt-0.5">
              Dinner Night '26
            </span>
          </div>
        </button>

        {/* DESKTOP LINKS */}
        <div className="hidden md:flex items-center gap-10">
          <ul className="flex items-center gap-8">
            {navLinks.map((link) => (
              <li key={link.path}>
                <button
                  onClick={() => handleNavClick(link.path)}
                  className={`relative text-xs font-medium uppercase tracking-widest transition-all duration-300 hover:text-sand cursor-pointer py-1 ${
                    currentView === link.path ? 'text-sand' : 'text-pearl/70'
                  }`}
                >
                  {link.name}
                  {currentView === link.path && (
                    <span className="absolute bottom-0 left-0 right-0 h-[1px] bg-sand" />
                  )}
                </button>
              </li>
            ))}
          </ul>

          <button
            onClick={() => handleNavClick('register')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-none border border-sand bg-transparent text-sand text-[11px] font-medium tracking-widest uppercase hover:bg-sand hover:text-obsidian transition-all duration-500 group cursor-pointer"
          >
            <span>Reserve Seat</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-300" />
          </button>
        </div>

        {/* MOBILE TRIGGER */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden text-pearl hover:text-sand transition-colors p-1"
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* MOBILE FULL-SCREEN / BLUR DRAWER */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-x-0 top-[72px] bg-obsidian/95 border-b border-sand/15 backdrop-blur-xl h-screen z-40 transition-all duration-300 animate-fade-in-up">
          <div className="flex flex-col px-8 py-12 gap-8">
            <ul className="flex flex-col gap-6">
              {navLinks.map((link) => (
                <li key={link.path} className="border-b border-sand/5 pb-4">
                  <button
                    onClick={() => handleNavClick(link.path)}
                    className={`text-lg font-serif tracking-widest w-full text-left transition-colors ${
                      currentView === link.path ? 'text-sand font-medium' : 'text-pearl/80'
                    }`}
                  >
                    {link.name}
                  </button>
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleNavClick('register')}
              className="mt-4 flex items-center justify-between px-6 py-4 border border-sand bg-crimson text-pearl text-xs font-semibold tracking-widest uppercase hover:bg-sand hover:text-obsidian transition-all duration-300"
            >
              <span>RESERVE SEAT NOW</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="mt-12 text-center text-[10px] font-mono tracking-widest text-sand/40">
              WCF-KNUST • WINNERS’ CAMPUS FELLOWSHIP
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
