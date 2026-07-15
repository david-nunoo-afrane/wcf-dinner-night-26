/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Phone, MessageSquare, ShieldCheck, CornerDownRight } from 'lucide-react';

interface ContactViewProps {
  userEmail?: string;
}

export default function ContactView({ userEmail }: ContactViewProps) {
  const organizers = [
    {
      name: 'David Afrane',
      phone: '+233 54 575 7841',
      email: 'afrane.david@wcfknust.org',
      whatsapp: 'https://wa.me/233545757841?text=Hello%20David%2C%20I%20have%20an%20inquiry%20about%20WCF-KNUST%20Dinner%20Night%20%2726'
    },
    {
      name: 'Naphtali Semekor',
      phone: '+233 20 023 3788',
      email: 'semekor.naphtali@wcfknust.org',
      whatsapp: 'https://wa.me/233200233788?text=Hello%20Naphtali%2C%20I%20have%20an%20inquiry%20about%20WCF-KNUST%20Dinner%20Night%20%2726'
    },
    {
      name: 'Evans Affum',
      phone: '+233 55 480 4301',
      email: 'affum.evans@wcfknust.org',
      whatsapp: 'https://wa.me/233554804301?text=Hello%20Evans%2C%20I%20have%20an%20inquiry%20about%20WCF-KNUST%20Dinner%20Night%20%2726'
    },
    {
      name: 'Divine Chukwudi',
      phone: '+233 54 343 4784',
      email: 'chukwudi.divine@wcfknust.org',
      whatsapp: 'https://wa.me/233543434784?text=Hello%20Divine%2C%20I%20have%20an%20inquiry%20about%20WCF-KNUST%20Dinner%20Night%20%2726'
    }
  ];

  return (
    <section className="min-h-screen pt-32 pb-24 px-6 md:px-12 bg-obsidian relative overflow-hidden">
      {/* Background radial crimson depth */}
      <div className="absolute top-[30%] left-[10%] w-[60vw] h-[60vw] rounded-full crimson-gradient opacity-40 blur-[95px] pointer-events-none" />
      <div className="absolute bottom-[10%] right-[10%] w-[40vw] h-[40vw] rounded-full bg-sand/5 blur-[95px] pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10 animate-fade-in-up">
        {/* SECTION HEADER */}
        <div className="text-center max-w-2xl mx-auto mb-16 md:mb-24">
          <p className="text-[10px] uppercase font-mono tracking-[0.3em] text-sand mb-3 block">
            Immediate Response Coordinates
          </p>
          <h2 className="text-4xl md:text-5xl lg:text-6xl text-pearl font-normal tracking-tight font-serif-luxury leading-tight">
            Connect With The Host
          </h2>
          <div className="w-12 h-[1px] bg-sand mx-auto mt-6" />
          <p className="mt-6 text-sm md:text-base text-pearl/60 font-light max-w-md mx-auto leading-relaxed">
            Have questions regarding seating configurations, dietary structures, or banquet reservations? Contact our coordinators directly.
          </p>
        </div>

        {/* DETAILS GRID - CENTERED ENVOYS */}
        <div className="max-w-3xl mx-auto space-y-8">
          <h3 className="text-xs font-mono uppercase tracking-[0.25em] text-sand mb-6 flex items-center gap-2 justify-center">
            <CornerDownRight className="w-4 h-4 text-crimson" /> Committee Envoys
          </h3>

          <div className="space-y-6">
            {organizers.map((org, idx) => (
              <div
                key={idx}
                className="p-6 md:p-8 border border-sand/10 bg-pearl/[0.01] hover:border-sand/35 transition-all duration-500 relative flex flex-col sm:flex-row justify-between sm:items-center gap-6"
              >
                <div className="space-y-2">
                  <h4 className="text-xl text-pearl font-serif tracking-wide">{org.name}</h4>
                  
                  <div className="flex flex-col gap-1 pt-2 font-sans text-xs text-pearl/70">
                    <a href={`tel:${org.phone}`} className="flex items-center gap-2 hover:text-sand transition-colors">
                      <Phone className="w-3.5 h-3.5 text-sand" /> {org.phone}
                    </a>
                  </div>
                </div>

                {/* WhatsApp click target */}
                <a
                  href={org.whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="self-start sm:self-auto flex items-center gap-2.5 px-4.5 py-2.5 border border-emerald-500/20 hover:border-emerald-400 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-400 text-[10px] font-mono tracking-widest uppercase transition-all"
                >
                  <MessageSquare className="w-3.5 h-3.5" /> WhatsApp Envoy
                </a>
              </div>
            ))}
          </div>
        </div>

        {/* SECURITY REASSURANCE SECURE MARKS */}
        <div className="mt-20 border-t border-sand/10 max-w-4xl mx-auto pt-8 flex flex-col sm:flex-row gap-6 items-center justify-between text-center sm:text-left text-pearl/40 font-mono select-none">
          <div className="flex items-center gap-1.5 text-xs">
            <ShieldCheck className="w-4 h-4 text-sand" /> Official WCF-KNUST Channels Validated
          </div>
          <div className="text-[10px] tracking-widest uppercase">
            KWAME NKRUMAH UNIVERSITY OF SCIENCE & TECHNOLOGY
          </div>
        </div>
      </div>
    </section>
  );
}

