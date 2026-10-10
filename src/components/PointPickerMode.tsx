import React from 'react';
import {
  MapPin,
  Sparkles,
  RotateCcw,
  Navigation,
  ArrowRight,
  Route,
  Check,
  X,
  Compass,
  ArrowLeftRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

export interface PointPickerState {
  isActive: boolean;
  step: 'pick_origin' | 'pick_destination' | 'ready';
  origin: { coords: [number, number]; name: string } | null;
  destination: { coords: [number, number]; name: string } | null;
  readyToPlan?: boolean;
}

interface PointPickerBarProps {
  pickerState: PointPickerState;
  onToggleActive: () => void;
  onReset: () => void;
  onSetPreset: (type: 'origin' | 'dest', coords: [number, number], name: string) => void;
  onOpenPlanner: () => void;
  onSwapPoints?: () => void;
}

const POPULAR_PRESETS: { name: string; nameGu: string; coords: [number, number] }[] = [
  { name: 'SVPIA Airport T1', nameGu: 'એરપોર્ટ T1', coords: [23.0735, 72.6275] },
  { name: 'Science City', nameGu: 'સાયન્સ સિટી', coords: [23.0815, 72.5025] },
  { name: 'Kalupur Station', nameGu: 'કાલુપુર રેલ્વે', coords: [23.0255, 72.6025] },
  { name: 'IIM / Vastrapur', nameGu: 'આઇઆઇએમ / વસ્ત્રાપુર', coords: [23.0360, 72.5275] },
  { name: 'Prahlad Nagar', nameGu: 'પ્રહલાદ નગર', coords: [23.0118, 72.5085] },
  { name: 'Bopal Approach', nameGu: 'બોપલ એપ્રોચ', coords: [23.0335, 72.4850] },
  { name: 'GIFT City', nameGu: 'ગિફ્ટ સિટી', coords: [23.1533, 72.6855] },
  { name: 'Sarkhej Roza', nameGu: 'સરખેજ રોઝા', coords: [22.9815, 72.5020] },
];

export const PointPickerBar: React.FC<PointPickerBarProps> = ({
  pickerState,
  onToggleActive,
  onReset,
  onSetPreset,
  onOpenPlanner,
  onSwapPoints,
}) => {
  const { language } = useLanguage();

  if (!pickerState.isActive) {
    return (
      <div className="absolute top-16 left-4 right-4 sm:left-auto sm:right-4 sm:w-auto z-30 pointer-events-auto animate-in fade-in duration-300">
        <button
          onClick={onToggleActive}
          className="w-full sm:w-auto px-4 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-xl shadow-blue-500/25 border border-white/20 flex items-center justify-center gap-2.5 font-bold text-xs sm:text-sm hover:scale-[1.03] active:scale-[0.98] transition-all group cursor-pointer"
        >
          <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center font-bold">
            <Compass className="w-4 h-4 text-white animate-spin-slow" />
          </div>
          <span>Plan 2-Point Multimodal Journey</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/25 text-white font-black tracking-wider uppercase hidden sm:inline">
            PS-08
          </span>
        </button>
      </div>
    );
  }

  return (
    <div className="absolute top-16 left-3 right-3 sm:left-1/2 sm:-translate-x-1/2 sm:max-w-xl z-30 pointer-events-auto animate-in slide-in-from-top-3 duration-200">
      <div className="bg-card/95 backdrop-blur-md border border-border rounded-2xl shadow-2xl p-3 sm:p-4 space-y-3">
        {/* Header Step Indicator */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs">
              <Compass className="w-4 h-4 animate-spin-slow" />
            </div>
            <div>
              <div className="text-xs sm:text-sm font-bold text-foreground flex items-center gap-1.5">
                <span>Select 2 Points for Multi-Modal Trip</span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                {pickerState.step === 'pick_origin' && 'Tap anywhere on the map to set Origin (Point A)'}
                {pickerState.step === 'pick_destination' && 'Now tap on the map to set Destination (Point B)'}
                {pickerState.step === 'ready' && 'Both points placed — calculating multimodal journey...'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={onReset}
              className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              title="Reset Points"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={onToggleActive}
              className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              title="Exit Mode"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Selected Points Pills with Quick Swap */}
        <div className="relative">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div
              className={cn(
                'p-2 rounded-xl border flex items-center gap-2 transition-all',
                pickerState.origin
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-foreground'
                  : 'bg-muted/40 border-dashed border-border text-muted-foreground'
              )}
            >
              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                A
              </span>
              <div className="truncate">
                <div className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400">
                  Origin
                </div>
                <div className="font-semibold truncate">
                  {pickerState.origin?.name || 'Tap map to set'}
                </div>
              </div>
            </div>

            <div
              className={cn(
                'p-2 rounded-xl border flex items-center gap-2 transition-all',
                pickerState.destination
                  ? 'bg-rose-500/10 border-rose-500/30 text-foreground'
                  : 'bg-muted/40 border-dashed border-border text-muted-foreground'
              )}
            >
              <span className="w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                B
              </span>
              <div className="truncate">
                <div className="text-[10px] uppercase font-bold text-rose-600 dark:text-rose-400">
                  Destination
                </div>
                <div className="font-semibold truncate">
                  {pickerState.destination?.name || 'Tap map to set'}
                </div>
              </div>
            </div>
          </div>

          {onSwapPoints && pickerState.origin && pickerState.destination && (
            <button
              onClick={onSwapPoints}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-card border border-border shadow-md flex items-center justify-center hover:scale-110 active:scale-95 transition-all text-primary hover:text-foreground z-10 cursor-pointer"
              title="Swap Origin and Destination"
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Quick Location Presets Carousel */}
        <div>
          <div className="text-[10px] uppercase font-bold text-muted-foreground mb-1">
            Quick City Landmarks:
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {POPULAR_PRESETS.map((p, idx) => (
              <button
                key={idx}
                onClick={() => {
                  if (pickerState.step === 'pick_origin' || !pickerState.origin) {
                    onSetPreset('origin', p.coords, p.name);
                  } else {
                    onSetPreset('dest', p.coords, p.name);
                  }
                }}
                className="px-2 py-1 rounded-lg border border-border bg-card hover:bg-muted/60 text-[11px] whitespace-nowrap text-foreground shrink-0 transition-colors"
              >
                {language === 'gu' ? p.nameGu : p.name}
              </button>
            ))}
          </div>
        </div>

        {/* Action Button when both points selected */}
        {pickerState.readyToPlan && (
          <button
            onClick={onOpenPlanner}
            className="w-full py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md animate-pulse"
          >
            <Route className="w-4 h-4" />
            <span>View Multi-Modal Routes & Fare Split</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
