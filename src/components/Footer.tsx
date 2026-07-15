/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ArrowUp, Instagram } from 'lucide-react';
import { ViewPath } from '../types';
import WcfLogo from './WcfLogo';
import WinnersLogo from './WinnersLogo';

interface FooterProps {
  setView: (view: ViewPath) => void;
}

export default function Footer({ setView }: FooterProps) {
  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLinkClick = (path: ViewPath) => {
    setView(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer
      id="app-footer"
      className="bg-obsidian border-t border-sand/15 pt-16 pb-12 relative overflow-hidden select-none"
    >
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[80%] h-[150px] bg-crimson/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        {/* TOP LAYOUT */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-10 pb-12 border-b border-sand/10">
          {/* Logo brand */}
          <div className="flex items-center gap-3.5">
            <div className="flex items-center gap-2">
              <WcfLogo className="w-12 h-12 object-contain" size={48} />
              <WinnersLogo className="w-12 h-12 object-contain" size={48} />
            </div>
            <div className="flex flex-col justify-center">
              <span className="font-serif text-base tracking-wider font-semibold text-pearl leading-none">WCF & LFCWW</span>
              <span className="text-[8px] font-mono tracking-widest text-sand uppercase font-medium mt-1">Winners' Campus Fellowship & Winners Chapel</span>
            </div>
          </div>

          {/* Links cluster */}
          <div className="flex flex-wrap gap-8 md:gap-12">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-sand mb-4">Navigations</p>
              <ul className="space-y-2 text-xs text-pearl/60">
                <li>
                  <button onClick={() => handleLinkClick('home')} className="hover:text-sand cursor-pointer transition-colors">
                    Home
                  </button>
                </li>
                <li>
                  <button onClick={() => handleLinkClick('register')} className="hover:text-sand cursor-pointer transition-colors">
                    Register Seat
                  </button>
                </li>
                <li>
                  <button onClick={() => handleLinkClick('contact')} className="hover:text-sand cursor-pointer transition-colors">
                    Direct Contact
                  </button>
                </li>
                <li>
                  <button onClick={() => handleLinkClick('attendees')} className="hover:text-sand cursor-pointer transition-colors text-sand/80 flex items-center gap-1.5">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-sand animate-pulse" />
                    DEV Panel
                  </button>
                </li>
              </ul>
            </div>

            <div>
              <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-sand mb-4">Venue & Time</p>
              <ul className="space-y-2 text-xs text-pearl/60 font-light">
                <li>TBD</li>
                <li>Friday, September 4, 2026</li>
                <li>7:00 PM GMT</li>
              </ul>
            </div>

            <div>
              <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-sand mb-4">Followship</p>
              <ul className="space-y-2 text-xs text-pearl/60">
                <li>
                  <a href="https://www.instagram.com/wcfknust_official" target="_blank" rel="noreferrer" className="hover:text-sand transition-colors flex items-center gap-2">
                    {/* SVG Gradient definition for Instagram logo */}
                    <svg width="0" height="0" className="absolute" style={{ width: 0, height: 0, overflow: 'hidden' }}>
                      <defs>
                        <linearGradient id="instagram-grad" x1="0%" y1="100%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#fdf497" />
                          <stop offset="28%" stopColor="#fd5949" />
                          <stop offset="75%" stopColor="#d6249f" />
                          <stop offset="100%" stopColor="#285AEB" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <Instagram className="w-4 h-4 shrink-0" stroke="url(#instagram-grad)" />
                    <span>@wcfknust_official</span>
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* BOTTOM COPYRIGHT */}
        <div className="pt-8 flex flex-col md:flex-row justify-between items-center gap-6 text-center md:text-left text-[11px] font-mono text-pearl/40">
          <div>
            © {new Date().getFullYear()} WCF-KNUST. All Rights Reserved. <span title="Made with ♥️🌚 by DNA" className="cursor-help hover:text-sand/70 transition-colors">Crafted for Dinner Night '26</span>.
          </div>
          
          <div className="flex items-center gap-6">
            <span className="text-[9px] uppercase tracking-widest text-[#B38F6F]">Intimate. Elegant. Unforgettable.</span>
            <button
              onClick={handleScrollToTop}
              className="p-2 border border-sand/20 hover:border-sand/60 text-sand hover:bg-pearl/5 transition-all outline-none rounded-none cursor-pointer flex items-center justify-center"
              aria-label="Scroll to top"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
