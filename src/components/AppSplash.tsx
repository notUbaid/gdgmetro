import React, { useEffect, useState, useCallback, useRef } from 'react';

interface AppSplashProps {
  isSuspenseFallback?: boolean;
}

export const AppSplash: React.FC<AppSplashProps> = ({ isSuspenseFallback = false }) => {
  const [phase, setPhase] = useState<'animating' | 'exiting' | 'finished'>('animating');
  const [statusText, setStatusText] = useState('Connecting Multimodal Transit...');
  const startTimeRef = useRef<number>(Date.now());
  const minDurationMs = 750; // Guaranteed minimum presence so the motion is felt but remains snappy
  const maxTimeoutMs = 2500; // Hard timeout safety net

  const triggerExit = useCallback(() => {
    setPhase((prev) => {
      if (prev === 'finished' || prev === 'exiting') return prev;
      setStatusText('Network Ready');
      return 'exiting';
    });

    // After the exit morph animation finishes (380ms), completely unmount
    setTimeout(() => {
      setPhase('finished');
    }, 400);
  }, []);

  const handleMapReady = useCallback(() => {
    const elapsed = Date.now() - startTimeRef.current;
    const remaining = Math.max(0, minDurationMs - elapsed);
    setTimeout(triggerExit, remaining);
  }, [triggerExit]);

  useEffect(() => {
    if (isSuspenseFallback) return;

    // Listen for custom event from MetroMap or timetable readiness
    const onMapReady = () => handleMapReady();
    window.addEventListener('ek-safar-map-ready', onMapReady);
    window.addEventListener('ahm-map-ready', onMapReady);

    // Dynamic status text transition
    const t1 = setTimeout(() => {
      setStatusText('Loading Multimodal Networks...');
    }, 400);

    // Hard fallback timer in case tile network is slow
    const fallbackTimer = setTimeout(() => {
      handleMapReady();
    }, maxTimeoutMs);

    return () => {
      window.removeEventListener('ek-safar-map-ready', onMapReady);
      window.removeEventListener('ahm-map-ready', onMapReady);
      clearTimeout(t1);
      clearTimeout(fallbackTimer);
    };
  }, [handleMapReady, isSuspenseFallback]);

  // If unmounted or finished, render nothing
  if (phase === 'finished') {
    return null;
  }

  const isExiting = phase === 'exiting';

  return (
    <div
      role="status"
      aria-label="Starting Ek Safar"
      onClick={triggerExit}
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center select-none overflow-hidden cursor-pointer transition-all duration-400 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] ${
        isExiting ? 'opacity-0 pointer-events-none scale-105' : 'opacity-100'
      }`}
      style={{
        backgroundColor: '#090D16',
        willChange: 'opacity, transform',
      }}
    >
      {/* Background Multi-Line Ambient Glows (Multimodal: Metro, BRTS, AMTS) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Blue Metro Ambient (North-West) */}
        <div
          className={`absolute -top-24 -left-24 w-80 h-80 rounded-full bg-blue-600/20 blur-[90px] transition-all duration-700 ${
            isExiting ? 'scale-150 opacity-0' : 'scale-100 opacity-100'
          }`}
        />
        {/* Janmarg BRTS Amber Ambient (North-East) */}
        <div
          className={`absolute -top-20 -right-20 w-80 h-80 rounded-full bg-amber-600/20 blur-[90px] transition-all duration-700 ${
            isExiting ? 'scale-150 opacity-0' : 'scale-100 opacity-100'
          }`}
        />
        {/* AMTS Feeder Emerald Ambient (South-West) */}
        <div
          className={`absolute -bottom-24 -left-20 w-80 h-80 rounded-full bg-emerald-600/20 blur-[90px] transition-all duration-700 ${
            isExiting ? 'scale-150 opacity-0' : 'scale-100 opacity-100'
          }`}
        />
        {/* Purple Line Ambient (South-East) */}
        <div
          className={`absolute -bottom-24 -right-20 w-80 h-80 rounded-full bg-purple-600/15 blur-[90px] transition-all duration-700 ${
            isExiting ? 'scale-150 opacity-0' : 'scale-100 opacity-100'
          }`}
        />
      </div>

      {/* Central Content Box with Momentum Zoom Morph */}
      <div
        className={`relative z-10 flex flex-col items-center text-center px-6 transition-all duration-400 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] ${
          isExiting ? 'scale-110 -translate-y-4 blur-[3px] opacity-0' : 'scale-100 translate-y-0 blur-0 opacity-100'
        }`}
      >
        {/* Emblem Container with Subtle Frosted Glass & Border Light */}
        <div className="relative group flex items-center justify-center mb-6">
          {/* Breathing Core Aura */}
          <div className="absolute -inset-3 rounded-3xl bg-gradient-to-r from-blue-500/25 via-amber-500/20 to-emerald-500/25 blur-xl animate-pulse" />

          {/* Frosted Badge Frame */}
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-3xl p-0.5 bg-gradient-to-b from-white/20 via-white/10 to-white/5 shadow-2xl backdrop-blur-md">
            <div className="w-full h-full rounded-[22px] bg-[#0c1322]/90 flex items-center justify-center p-3 sm:p-4 overflow-hidden shadow-inner">
              {/* Bespoke Ek Safar Multimodal Transit Network Emblem */}
              <svg
                viewBox="0 0 100 100"
                className="w-full h-full drop-shadow-[0_4px_16px_rgba(37,99,235,0.45)]"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Hexagonal Multimodal Boundary */}
                <polygon
                  points="50,6 88,28 88,72 50,94 12,72 12,28"
                  stroke="url(#hex_border)"
                  strokeWidth="2.5"
                  fill="url(#hex_bg)"
                />

                {/* Metro Blue Corridor Line */}
                <path
                  d="M20 70 C 35 50, 40 40, 50 50 C 60 60, 65 50, 80 30"
                  stroke="#3B82F6"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />

                {/* Janmarg BRTS Amber Corridor Line */}
                <path
                  d="M22 30 C 36 36, 44 44, 50 50 C 56 56, 68 64, 78 70"
                  stroke="#F59E0B"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />

                {/* AMTS Feeder Emerald Vertical Axis */}
                <path
                  d="M50 16 L50 84"
                  stroke="#10B981"
                  strokeWidth="2.5"
                  strokeDasharray="3 3"
                  strokeLinecap="round"
                />

                {/* Multimodal Transit Interchange Hub (Center Nexus) */}
                <circle cx="50" cy="50" r="9" fill="#0F172A" stroke="#FFFFFF" strokeWidth="2.5" />
                <circle cx="50" cy="50" r="5" fill="#3B82F6" className="animate-pulse" />

                {/* Outer Node Stops */}
                <circle cx="20" cy="70" r="3.5" fill="#3B82F6" stroke="#FFFFFF" strokeWidth="1.5" />
                <circle cx="80" cy="30" r="3.5" fill="#3B82F6" stroke="#FFFFFF" strokeWidth="1.5" />
                <circle cx="22" cy="30" r="3.5" fill="#F59E0B" stroke="#FFFFFF" strokeWidth="1.5" />
                <circle cx="78" cy="70" r="3.5" fill="#F59E0B" stroke="#FFFFFF" strokeWidth="1.5" />
                <circle cx="50" cy="18" r="3" fill="#10B981" stroke="#FFFFFF" strokeWidth="1" />
                <circle cx="50" cy="82" r="3" fill="#10B981" stroke="#FFFFFF" strokeWidth="1" />

                <defs>
                  <linearGradient id="hex_border" x1="12" y1="6" x2="88" y2="94" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#60A5FA" />
                    <stop offset="0.5" stopColor="#F59E0B" />
                    <stop offset="1" stopColor="#10B981" />
                  </linearGradient>
                  <linearGradient id="hex_bg" x1="50" y1="6" x2="50" y2="94" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#1E293B" stopOpacity="0.8" />
                    <stop offset="1" stopColor="#0B132B" stopOpacity="0.95" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>
        </div>

        {/* Brand Name Typography */}
        <div className="flex flex-col items-center gap-1">
          <div className="flex items-center gap-1.5">
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white font-sans drop-shadow-sm">
              Ek<span className="text-blue-500">Safar</span>
            </h1>
          </div>
          <p className="text-[11px] sm:text-xs font-semibold tracking-[0.2em] uppercase text-slate-400">
            One City • One Journey • One Fare
          </p>
        </div>

        {/* Dynamic Electric Track Line Sweep */}
        <div className="relative w-48 sm:w-56 h-1 mt-7 rounded-full bg-slate-800/80 overflow-hidden border border-white/5">
          {/* Luminous High-Speed Photon Beam */}
          <div
            className="absolute top-0 bottom-0 w-24 bg-gradient-to-r from-transparent via-blue-400 to-transparent"
            style={{
              animation: 'track-sweep 1.2s cubic-bezier(0.4, 0, 0.2, 1) infinite',
            }}
          />
        </div>

        {/* Micro-Status Pill with Live Signal Pulse */}
        <div className="flex items-center gap-2 mt-4 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-800 backdrop-blur-sm">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-[11px] font-medium text-slate-300 tracking-wide font-sans">
            {statusText}
          </span>
        </div>
      </div>

      {/* Embedded CSS Keyframes for Track Beam */}
      <style>{`
        @keyframes track-sweep {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(250%);
          }
        }
      `}</style>
    </div>
  );
};

export default AppSplash;
