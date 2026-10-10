import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Route,
  Cpu,
  QrCode,
  ArrowRight,
  Landmark,
  Layers,
  Send,
  Train,
  Bus,
  Compass,
  CheckCircle2,
  Percent,
  ChevronRight,
  HelpCircle,
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { parseGujlishTransitQuery } from '@/lib/gujlishParser';
import { toast } from 'sonner';

interface PresetTrip {
  id: string;
  title: string;
  titleGu: string;
  titleHi: string;
  badge: string;
  origName: string;
  origCoords: [number, number];
  destName: string;
  destCoords: [number, number];
  modes: ('metro' | 'brts' | 'amts')[];
  summary: string;
}

const PRESET_TRIPS: PresetTrip[] = [
  {
    id: 'airport-to-iim',
    title: 'Airport T1 ➔ IIM Ahmedabad',
    titleGu: 'એરપોર્ટ T1 ➔ આઇઆઇએમ અમદાવાદ',
    titleHi: 'एयरपोर्ट T1 ➔ आईआईएम अहमदाबाद',
    badge: '3-Modal Transfer',
    origName: 'SVPIA Domestic Airport T1',
    origCoords: [23.0735, 72.6275],
    destName: 'IIM Ahmedabad (Vastrapur)',
    destCoords: [23.0315, 72.5325],
    modes: ['amts', 'metro', 'brts'],
    summary: 'Airport Shuttle ➔ Purple Metro ➔ BRTS 132ft Ring Road',
  },
  {
    id: 'kalupur-to-science-city',
    title: 'Kalupur Railway ➔ Science City',
    titleGu: 'કાલુપુર રેલ્વે ➔ સાયન્સ સિટી',
    titleHi: 'कालूपुर रेलवे ➔ साइंस सिटी',
    badge: 'Metro + Feeder',
    origName: 'Kalupur Railway Station',
    origCoords: [23.0255, 72.6025],
    destName: 'Gujarat Science City',
    destCoords: [23.0815, 72.5025],
    modes: ['metro', 'amts'],
    summary: 'East-West Metro Rail ➔ Thaltej Gam ➔ Science City Feeder',
  },
  {
    id: 'gift-to-iscon',
    title: 'GIFT City ➔ ISKCON Cross Road',
    titleGu: 'ગિફ્ટ સિટી ➔ ઇસ્કોન ક્રોસ રોડ',
    titleHi: 'गिफ्ट सिटी ➔ इस्कॉन क्रॉस रोड',
    badge: 'Express Corridor',
    origName: 'GIFT City Club',
    origCoords: [23.1533, 72.6855],
    destName: 'ISKCON Cross Road BRTS',
    destCoords: [23.0280, 72.5075],
    modes: ['metro', 'brts'],
    summary: 'GNLU Metro Branch ➔ Motera ➔ SG Highway Busway',
  },
];

export const WelcomeOverlay: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [quickQuery, setQuickQuery] = useState('');
  const { language, setLanguage } = useLanguage();

  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem('hasSeenEkSafarHub_v3');
    const pathname = window.location.pathname;
    const searchParams = new URLSearchParams(window.location.search);
    const isDeepLink =
      pathname.includes('/station/') ||
      pathname.includes('/route/') ||
      searchParams.has('orig') ||
      searchParams.has('dest') ||
      searchParams.has('station');

    if (!hasSeenWelcome && !isDeepLink) {
      setIsOpen(true);
    }

    const handleOpenLaunchpad = () => {
      setIsOpen(true);
      setIsMinimized(false);
    };

    window.addEventListener('open-ek-safar-hub', handleOpenLaunchpad);
    return () => window.removeEventListener('open-ek-safar-hub', handleOpenLaunchpad);
  }, []);

  const handleClose = () => {
    localStorage.setItem('hasSeenEkSafarHub_v3', 'true');
    setIsOpen(false);
  };

  const handleStartPicker = () => {
    handleClose();
    window.dispatchEvent(new CustomEvent('start-multimodal-picker'));
  };

  const handleOpenAuthority = () => {
    handleClose();
    window.dispatchEvent(new CustomEvent('open-multimodal-modal', { detail: { tab: 'authority' } }));
  };

  const handleLaunchPreset = (trip: PresetTrip) => {
    handleClose();
    window.dispatchEvent(
      new CustomEvent('plan-multimodal-preset', {
        detail: {
          origCoords: trip.origCoords,
          origName: trip.origName,
          destCoords: trip.destCoords,
          destName: trip.destName,
        },
      })
    );
  };

  const handleQuickGujlishSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickQuery.trim()) return;

    const parsed = parseGujlishTransitQuery(quickQuery);
    if (parsed.originCoords && parsed.destCoords && parsed.originName && parsed.destName) {
      handleClose();
      window.dispatchEvent(
        new CustomEvent('plan-multimodal-preset', {
          detail: {
            origCoords: parsed.originCoords,
            origName: parsed.originName,
            destCoords: parsed.destCoords,
            destName: parsed.destName,
          },
        })
      );
      toast.success(`Planning trip: ${parsed.originName} ➔ ${parsed.destName}`);
    } else {
      handleClose();
      window.dispatchEvent(
        new CustomEvent('open-multimodal-modal', {
          detail: { initialQuery: quickQuery },
        })
      );
    }
  };

  return (
    <>
      {/* Floating launcher trigger badge when dismissed */}
      {!isOpen && (
        <div className="fixed top-4 left-4 z-[999] pointer-events-auto animate-in fade-in duration-300">
          <button
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-background/90 hover:bg-background border border-border/80 text-foreground shadow-xl backdrop-blur-md transition-all hover:scale-105 active:scale-95 text-xs font-bold cursor-pointer"
            title="Ek Safar Multimodal Hub (PS-08)"
          >
            <div className="w-5 h-5 rounded-lg bg-gradient-to-tr from-blue-600 via-amber-500 to-emerald-600 flex items-center justify-center text-white text-[10px] font-black">
              એ
            </div>
            <span>Ek Safar</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400 font-bold uppercase">
              PS-08
            </span>
          </button>
        </div>
      )}

      {isOpen && (
        <div
          className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/70 backdrop-blur-md p-3 sm:p-5 animate-in fade-in duration-300"
          role="dialog"
          aria-modal="true"
          aria-labelledby="ek-safar-hub-title"
        >
          <div className="bg-background border border-border/80 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden relative animate-in zoom-in-95 duration-300 max-h-[94vh] flex flex-col">
            {/* Top Close Button */}
            <button
              onClick={handleClose}
              aria-label="Close Launchpad"
              className="absolute top-4 right-4 p-2.5 bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground rounded-full transition-colors z-20 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Hero Banner Header */}
            <div className="relative bg-gradient-to-br from-blue-600/15 via-amber-500/10 to-emerald-600/15 p-5 sm:p-6 border-b border-border/60 overflow-hidden">
              <div className="absolute -top-16 -left-16 w-36 h-36 bg-blue-500/20 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute -bottom-16 -right-16 w-36 h-36 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 relative z-10">
                <div className="flex items-center gap-3">
                  {/* Hexagon Multimodal Nexus Emblem */}
                  <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-emerald-600 flex items-center justify-center shadow-lg shadow-blue-500/25 text-white shrink-0">
                    <Layers className="w-7 h-7" />
                  </div>
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold uppercase tracking-wider mb-1">
                      <Sparkles className="w-3 h-3" />
                      <span>DevFest Gandhinagar • PS-08</span>
                    </div>
                    <h1 id="ek-safar-hub-title" className="text-xl sm:text-2xl font-black text-foreground tracking-tight font-sans">
                      Ek Safar <span className="text-blue-600 dark:text-blue-400 font-normal text-lg sm:text-xl">(એક સફર)</span>
                    </h1>
                    <p className="text-[11px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {language === 'gu'
                        ? 'એક શહેર • એક મુસાફરી • એક ટિકિટ'
                        : language === 'hi'
                        ? 'एक शहर • एक यात्रा • एक टिकट'
                        : 'One City • One Journey • One Unified Fare'}
                    </p>
                  </div>
                </div>

                {/* Trilingual Pill Switcher */}
                <div className="flex items-center gap-1 p-1 bg-background/80 rounded-xl border border-border/50 self-start sm:self-center">
                  <button
                    type="button"
                    onClick={() => setLanguage('en')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      language === 'en'
                        ? 'bg-primary text-primary-foreground shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    EN
                  </button>
                  <button
                    type="button"
                    onClick={() => setLanguage('gu')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      language === 'gu'
                        ? 'bg-primary text-primary-foreground shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    ગુ
                  </button>
                  <button
                    type="button"
                    onClick={() => setLanguage('hi')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      language === 'hi'
                        ? 'bg-primary text-primary-foreground shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    हि
                  </button>
                </div>
              </div>

              {/* Multimodal Transit Trinity Strip */}
              <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-border/40 text-center text-xs">
                <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20">
                  <div className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400 flex items-center justify-center gap-1">
                    <Train className="w-3 h-3" />
                    <span>Metro Rail</span>
                  </div>
                  <div className="text-xs sm:text-sm font-black text-foreground mt-0.5">53 Stations</div>
                  <div className="text-[10px] text-muted-foreground hidden sm:block">4 Rail Lines (GMRC)</div>
                </div>

                <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <div className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400 flex items-center justify-center gap-1">
                    <Bus className="w-3 h-3" />
                    <span>Janmarg BRTS</span>
                  </div>
                  <div className="text-xs sm:text-sm font-black text-foreground mt-0.5">158 Busways</div>
                  <div className="text-[10px] text-muted-foreground hidden sm:block">Dedicated Corridors</div>
                </div>

                <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <div className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1">
                    <Route className="w-3 h-3" />
                    <span>AMTS Feeder</span>
                  </div>
                  <div className="text-xs sm:text-sm font-black text-foreground mt-0.5">City Buses</div>
                  <div className="text-[10px] text-muted-foreground hidden sm:block">First/Last-Mile</div>
                </div>
              </div>
            </div>

            {/* Launchpad Body Content */}
            <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
              {/* Natural Language Gujlish Prompt Box */}
              <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/60">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Cpu className="w-4 h-4 text-emerald-500" />
                    <span>Vernacular Gujlish Transit Prompt (Offline Gemma)</span>
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-semibold">
                    100% Offline
                  </span>
                </div>
                <form onSubmit={handleQuickGujlishSubmit} className="flex gap-2">
                  <input
                    type="text"
                    value={quickQuery}
                    onChange={(e) => setQuickQuery(e.target.value)}
                    placeholder="e.g. Airport to IIM Ahmedabad AC bus ma garmi vagar..."
                    className="flex-1 bg-background border border-border/70 rounded-xl px-3.5 py-2 text-xs outline-none focus:border-primary text-foreground placeholder:text-muted-foreground"
                  />
                  <button
                    type="submit"
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer transition-colors"
                  >
                    <span>Plan</span>
                    <Send className="w-3 h-3" />
                  </button>
                </form>
              </div>

              {/* Interactive Demo Trips Section (For Judges & Commuters) */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Compass className="w-3.5 h-3.5 text-primary" />
                    <span>Live 3-Modal Route Demos (One-Tap Test)</span>
                  </h3>
                  <span className="text-[10px] text-primary font-semibold">Instant Map Draw</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {PRESET_TRIPS.map((trip) => (
                    <button
                      key={trip.id}
                      onClick={() => handleLaunchPreset(trip)}
                      className="p-3 rounded-2xl bg-card border border-border/70 hover:border-primary/50 hover:bg-muted/30 transition-all text-left flex flex-col justify-between group cursor-pointer shadow-xs active:scale-[0.98]"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-600 dark:text-blue-400">
                            {trip.badge}
                          </span>
                          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                        </div>
                        <h4 className="font-bold text-xs text-foreground group-hover:text-primary transition-colors line-clamp-1">
                          {language === 'gu' ? trip.titleGu : language === 'hi' ? trip.titleHi : trip.title}
                        </h4>
                        <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                          {trip.summary}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 mt-2.5 pt-2 border-t border-border/40 text-[10px] font-semibold text-primary">
                        <span>Simulate Trip</span>
                        <ArrowRight className="w-3 h-3" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Policy & Revenue Clearinghouse Banner */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-500/10 via-indigo-500/5 to-blue-500/10 border border-purple-500/20 flex items-start gap-3">
                <div className="p-2 rounded-xl bg-purple-500/20 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5">
                  <Percent className="w-4 h-4" />
                </div>
                <div className="text-xs">
                  <div className="font-bold text-foreground flex items-center gap-2">
                    <span>15% Integrated Single-Pass Rebate</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-600 dark:text-purple-300 font-semibold">
                      Hare-Niemeyer Split
                    </span>
                  </div>
                  <p className="text-muted-foreground mt-0.5 leading-relaxed text-[11px]">
                    Automatic exact-paise clearinghouse across Gujarat Metro Rail, Janmarg BRTS, and AMTS with anti-fraud QR tokens and transfer desert auditing.
                  </p>
                </div>
              </div>
            </div>

            {/* Launchpad Footer CTAs */}
            <div className="p-4 sm:p-5 bg-muted/30 border-t border-border/70 flex flex-col sm:flex-row gap-2.5">
              <button
                onClick={handleStartPicker}
                className="group flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3 px-5 rounded-2xl shadow-lg shadow-blue-600/25 active:scale-[0.98] transition-all cursor-pointer text-xs sm:text-sm"
              >
                <Compass className="w-4 h-4" />
                <span>Plan Any 2 Points on Map (બે પોઇન્ટ રૂટ)</span>
                <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
              </button>

              <button
                onClick={handleOpenAuthority}
                className="flex items-center justify-center gap-1.5 px-4 py-3 rounded-2xl bg-background border border-border text-foreground hover:bg-muted font-semibold text-xs active:scale-[0.98] transition-all cursor-pointer"
              >
                <Landmark className="w-4 h-4 text-primary" />
                <span>Authority Audit Console</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
