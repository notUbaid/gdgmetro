import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Route,
  Clock,
  Coins,
  ArrowRight,
  Sparkles,
  Check,
  ChevronDown,
  ChevronUp,
  Flame,
  QrCode,
  ShieldCheck,
  Share2,
  Leaf,
  Layers,
  MapPin,
  TrendingDown,
  Info,
  Sliders,
  Building,
  Bus,
  Train,
  AlertTriangle,
  Scale,
  Download,
  Search,
  ArrowLeftRight,
  Copy,
  CheckCircle2,
  SlidersHorizontal,
  Zap,
  Wallet,
  ThermometerSun,
  Briefcase,
  Car,
  Compass,
  Languages,
} from 'lucide-react';
import {
  MultimodalJourney,
  MultimodalLeg,
  OperatorFareSplit,
  FareSplitMethod,
  calculateOperatorFareSplit,
  detectTransferDeserts,
  simulateAuthoritySettlement,
  generateAuthoritySettlementCsv,
  TransferDesertReport,
} from '@/lib/multimodalRouter';
import {
  COMMUTER_PERSONAS,
  CommuterPersona,
  evaluateJourneyWithAI,
} from '@/lib/aiTripOptimizer';
import {
  parseGujlishTransitQuery,
  ParsedTransitQuery,
} from '@/lib/gujlishParser';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface MultimodalRouteModalProps {
  isOpen: boolean;
  onClose: () => void;
  journeys: MultimodalJourney[];
  originName: string;
  destName: string;
  selectedJourneyIndex: number;
  onSelectJourneyIndex: (index: number) => void;
  onShowOnMap: (journey: MultimodalJourney) => void;
  onUpdateEndpoints?: (origCoords: [number, number], origName: string, destCoords: [number, number], destName: string) => void;
  onSwapPoints?: () => void;
}

export const MultimodalRouteModal: React.FC<MultimodalRouteModalProps> = ({
  isOpen,
  onClose,
  journeys,
  originName,
  destName,
  selectedJourneyIndex,
  onSelectJourneyIndex,
  onShowOnMap,
  onUpdateEndpoints,
  onSwapPoints,
}) => {
  const { language } = useLanguage();
  const [selectedPersona, setSelectedPersona] = useState<CommuterPersona>('balanced');
  const [showFareSplitModal, setShowFareSplitModal] = useState(false);
  const [showQrTicket, setShowQrTicket] = useState(false);
  const [activeTab, setActiveTab] = useState<'commuter' | 'authority'>('commuter');
  const [splitMethod, setSplitMethod] = useState<FareSplitMethod>('fare_share');
  const [rebateSliderValue, setRebateSliderValue] = useState<number>(15);
  const [expandedLegs, setExpandedLegs] = useState<Record<string, boolean>>({});

  // Gujlish & NLP state
  const [gujlishQuery, setGujlishQuery] = useState('');
  const [parsedQueryInfo, setParsedQueryInfo] = useState<ParsedTransitQuery | null>(null);
  const [qrCountdown, setQrCountdown] = useState<number>(5340); // 89 mins
  const [qrCopied, setQrCopied] = useState(false);
  const ticketRefId = useMemo(
    () => (showQrTicket ? `EK-SAFAR-${Math.floor(100000 + Math.random() * 900000)}` : ''),
    [showQrTicket]
  );

  // Live QR Pass Countdown Timer
  useEffect(() => {
    if (!showQrTicket) return;
    const interval = setInterval(() => {
      setQrCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [showQrTicket]);

  const activeJourney = journeys[selectedJourneyIndex] || journeys[0];

  // Dynamic Fare Split for active journey based on chosen method
  const dynamicFareSplit = useMemo(() => {
    if (!activeJourney) return [];
    return calculateOperatorFareSplit(activeJourney.legs, activeJourney.integratedFare, splitMethod);
  }, [activeJourney, splitMethod]);

  // Authority Console Data
  const transferDeserts = useMemo(() => detectTransferDeserts(), []);
  const settlementSimulation = useMemo(
    () => simulateAuthoritySettlement(rebateSliderValue, 5000),
    [rebateSliderValue]
  );

  // AI Evaluation for active journey
  const aiAnalysis = useMemo(() => {
    if (!activeJourney) return null;
    return evaluateJourneyWithAI(activeJourney, selectedPersona);
  }, [activeJourney, selectedPersona]);

  if (!isOpen || !activeJourney) return null;

  const toggleLegExpand = (legId: string) => {
    setExpandedLegs((prev) => ({ ...prev, [legId]: !prev[legId] }));
  };

  const handleRunGujlishQuery = (customText?: string) => {
    const textToRun = (customText || gujlishQuery).trim();
    if (!textToRun) return;

    const result = parseGujlishTransitQuery(textToRun);
    setParsedQueryInfo(result);

    if (result.originCoords && result.destCoords && result.originName && result.destName) {
      if (onUpdateEndpoints) {
        onUpdateEndpoints(result.originCoords, result.originName, result.destCoords, result.destName);
      }
      if (result.preference === 'heat_avoidance') {
        setSelectedPersona('heat_avoidance');
      } else if (result.preference === 'fastest') {
        setSelectedPersona('speed');
      } else if (result.preference === 'cheapest') {
        setSelectedPersona('budget');
      } else if (result.preference === 'min_transfers') {
        setSelectedPersona('accessible_luggage');
      }
      toast.success(`Recognized: ${result.originName} ➔ ${result.destName}`);
    } else {
      toast.info(result.explanation || 'Could not resolve both endpoints. Try selecting from map.');
    }
  };

  const handleDownloadAuthorityCsv = () => {
    const csvContent = generateAuthoritySettlementCsv(settlementSimulation, transferDeserts);
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Ek_Safar_Ahmedabad_UMTA_Settlement_Audit_${rebateSliderValue}pct.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Authority settlement audit CSV downloaded!');
  };

  const SAMPLE_GUJLISH_PROMPTS = [
    { label: 'Mane Maninagar thi Thaltej javu che, ochhu chalvu', desc: 'Heat Avoidance / Min Walk' },
    { label: 'Bopal thi Motera stadium jaldi', desc: 'Fastest' },
    { label: 'Airport thi Kalupur station sasto rasto', desc: 'Cheapest' },
    { label: 'IIM thi Gift city ac metro', desc: 'AC Train' },
    { label: 'Science city thi Iscon cross road', desc: 'Multimodal' },
  ];

  const getModeBadge = (mode: string) => {
    switch (mode) {
      case 'metro':
        return {
          bg: 'bg-blue-600 text-white',
          label: 'Gujarat Metro',
          labelGu: 'ગુજરાત મેટ્રો',
          labelHi: 'गुजरात मेट्रो',
        };
      case 'brts':
        return {
          bg: 'bg-amber-600 text-white',
          label: 'Janmarg BRTS',
          labelGu: 'જનમાર્ગ બીઆરટીએસ',
          labelHi: 'जनमार्ग बीआरटीएस',
        };
      case 'amts':
        return {
          bg: 'bg-sky-600 text-white',
          label: 'AMTS City Bus',
          labelGu: 'એએમટીએસ સિટી બસ',
          labelHi: 'एएमटीएस सिटी बस',
        };
      default:
        return {
          bg: 'bg-slate-500 text-white',
          label: 'Pedestrian Walk',
          labelGu: 'પગપાળા વોક',
          labelHi: 'पैदल वॉक',
        };
    }
  };

  const renderPersonaIcon = (id: CommuterPersona) => {
    switch (id) {
      case 'speed':
        return <Zap className="w-3.5 h-3.5 shrink-0" />;
      case 'budget':
        return <Wallet className="w-3.5 h-3.5 shrink-0" />;
      case 'heat_avoidance':
        return <ThermometerSun className="w-3.5 h-3.5 shrink-0" />;
      case 'accessible_luggage':
        return <Briefcase className="w-3.5 h-3.5 shrink-0" />;
      case 'balanced':
      default:
        return <SlidersHorizontal className="w-3.5 h-3.5 shrink-0" />;
    }
  };

  const getLegProvenance = (mode: string) => {
    switch (mode) {
      case 'metro':
        return {
          tag: 'Verified GMRC Timetable',
          sub: 'Headway: 12-15m • High Speed Electric Rail • 0 Congestion',
          color: 'text-blue-600 dark:text-blue-400 border-blue-500/30 bg-blue-500/10',
        };
      case 'brts':
        return {
          tag: 'Janmarg Dedicated Busway',
          sub: 'Headway: 4-6m • Dedicated Median Corridor • Level Boarding',
          color: 'text-amber-600 dark:text-amber-400 border-amber-500/30 bg-amber-500/10',
        };
      case 'amts':
        return {
          tag: 'AMTS Municipal Feeder',
          sub: 'Headway: 10-15m • Mixed Traffic First/Last Mile Feeder',
          color: 'text-sky-600 dark:text-sky-400 border-sky-500/30 bg-sky-500/10',
        };
      default:
        return {
          tag: 'Pedestrian Walkway / Crosswalk',
          sub: 'Paved sidewalk • Signal-controlled pedestrian crossing',
          color: 'text-slate-600 dark:text-slate-400 border-slate-500/30 bg-slate-500/10',
        };
    }
  };

  const getTransferRiskBadge = (walkMins: number) => {
    if (walkMins <= 3) {
      return {
        label: 'Seamless Transfer (<3 min)',
        color: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
        hint: 'Direct covered concourse or immediate kerbside interchange.',
      };
    }
    if (walkMins <= 6) {
      return {
        label: 'Standard Transfer (3–6 min)',
        color: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30',
        hint: 'Signal crosswalk connection with clear wayfinding signage.',
      };
    }
    return {
      label: 'Buffer Recommended (>6 min)',
      color: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
      hint: 'Significant walking distance; recommend departing 5m earlier.',
    };
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full sm:max-w-2xl bg-card border border-border sm:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-3.5 sm:p-4 border-b border-border bg-muted/40 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <Route className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-extrabold text-foreground tracking-tight">
                  Ek Safar <span className="text-xs font-normal text-muted-foreground">(એક સફર)</span>
                </h2>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                  PS-08 One City, One Journey
                </span>
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5 truncate max-w-[280px] sm:max-w-md">
                <span className="font-semibold text-foreground truncate">{originName}</span>
                <ArrowRight className="w-3 h-3 text-muted-foreground shrink-0" />
                <span className="font-semibold text-foreground truncate">{destName}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle: Commuter vs Authority */}
            <div className="hidden sm:flex items-center p-0.5 rounded-lg border border-border bg-muted/60 text-xs font-semibold">
              <button
                onClick={() => setActiveTab('commuter')}
                className={cn(
                  'px-2.5 py-1 rounded-md transition-all',
                  activeTab === 'commuter'
                    ? 'bg-card text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                Commuter View
              </button>
              <button
                onClick={() => setActiveTab('authority')}
                className={cn(
                  'px-2.5 py-1 rounded-md transition-all flex items-center gap-1',
                  activeTab === 'authority'
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Building className="w-3 h-3" />
                <span>Authority Console</span>
              </button>
            </div>

            <button
              id="close-multimodal-modal-btn"
              onClick={onClose}
              className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              aria-label="Close Multimodal Route Dialog"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mobile View Switcher */}
        <div className="sm:hidden px-4 pt-2 pb-0 flex border-b border-border bg-muted/30">
          <button
            onClick={() => setActiveTab('commuter')}
            className={cn(
              'flex-1 py-1.5 text-xs font-bold border-b-2 transition-all',
              activeTab === 'commuter'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground'
            )}
          >
            Commuter View
          </button>
          <button
            onClick={() => setActiveTab('authority')}
            className={cn(
              'flex-1 py-1.5 text-xs font-bold border-b-2 transition-all flex items-center justify-center gap-1',
              activeTab === 'authority'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground'
            )}
          >
            <Building className="w-3 h-3" />
            <span>Authority Console</span>
          </button>
        </div>

        {/* Scrollable Main Body */}
        <div className="overflow-y-auto p-4 space-y-4">
          {activeTab === 'commuter' ? (
            <>
              {/* Natural Language Gujlish Transit Search Bar (PS-08 Flagship Feature) */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-primary/10 via-card to-card border border-primary/30 shadow-xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs">
                      <Languages className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-foreground">
                        Gujlish / Vernacular Smart Assistant
                      </span>
                      <span className="text-[10px] text-muted-foreground ml-2 hidden sm:inline">
                        100% offline NLP query engine
                      </span>
                    </div>
                  </div>
                  {onSwapPoints && (
                    <button
                      onClick={onSwapPoints}
                      className="px-2 py-1 rounded-lg border border-border bg-card hover:bg-muted text-[11px] font-semibold text-foreground flex items-center gap-1 transition-colors"
                      title="Swap Origin and Destination"
                    >
                      <ArrowLeftRight className="w-3 h-3 text-primary" />
                      <span>Swap Points</span>
                    </button>
                  )}
                </div>

                {/* Input & Submit */}
                <div className="flex items-center gap-1.5">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={gujlishQuery}
                      onChange={(e) => setGujlishQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleRunGujlishQuery();
                      }}
                      placeholder="Mane Maninagar thi Thaltej javu che, ochhu chalvu..."
                      className="w-full pl-8 pr-3 py-2 rounded-xl text-xs bg-card border border-border focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground"
                    />
                    <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
                  </div>
                  <button
                    onClick={() => handleRunGujlishQuery()}
                    className="px-3.5 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs shrink-0 shadow-xs transition-colors"
                  >
                    Ask
                  </button>
                </div>

                {/* Quick Sample Chips */}
                <div className="space-y-1">
                  <div className="text-[10px] uppercase font-bold text-muted-foreground">
                    Try asking in colloquial Gujarati / Gujlish:
                  </div>
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
                    {SAMPLE_GUJLISH_PROMPTS.map((p, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setGujlishQuery(p.label);
                          handleRunGujlishQuery(p.label);
                        }}
                        className="px-2 py-1 rounded-lg border border-border/80 bg-card hover:bg-muted/80 text-[10.5px] whitespace-nowrap text-foreground shrink-0 flex items-center gap-1 transition-all hover:scale-[1.02]"
                      >
                        <Sparkles className="w-3 h-3 text-primary/70 shrink-0" />
                        <span>{p.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Recognized Result Badge */}
                {parsedQueryInfo && (
                  <div className="p-2 rounded-xl bg-muted/60 border border-border text-[11px] text-foreground flex items-center justify-between">
                    <div>
                      <span className="font-bold text-primary capitalize">
                        [{parsedQueryInfo.detectedLanguage}]
                      </span>{' '}
                      <span>{parsedQueryInfo.explanation}</span>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                      {(parsedQueryInfo.confidence * 100).toFixed(0)}% match
                    </span>
                  </div>
                )}
              </div>

              {/* Persona / Commuter Preference Selector */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-primary" />
                    Commuter Priority Mode
                  </span>
                  <span className="text-[11px] text-muted-foreground truncate max-w-[200px] sm:max-w-none">
                    {COMMUTER_PERSONAS[selectedPersona].description}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                  {(Object.keys(COMMUTER_PERSONAS) as CommuterPersona[]).map((key) => {
                    const p = COMMUTER_PERSONAS[key];
                    const isSelected = selectedPersona === key;
                    return (
                      <button
                        key={key}
                        onClick={() => setSelectedPersona(key)}
                        className={cn(
                          'px-2 py-1.5 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all text-center cursor-pointer',
                          isSelected
                            ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                            : 'bg-card border-border/80 hover:bg-muted/60 text-muted-foreground hover:text-foreground'
                        )}
                      >
                        {renderPersonaIcon(key)}
                        <span className="truncate">
                          {language === 'gu' ? p.labelGu : language === 'hi' ? p.labelHi : p.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3 Pareto Journey Option Tabs */}
              <div className="grid grid-cols-3 gap-2">
                {journeys.map((j, idx) => {
                  const isSelected = idx === selectedJourneyIndex;
                  return (
                    <button
                      key={j.id}
                      onClick={() => onSelectJourneyIndex(idx)}
                      className={cn(
                        'p-2.5 rounded-xl border text-left transition-all relative overflow-hidden cursor-pointer',
                        isSelected
                          ? 'border-primary bg-primary/5 ring-2 ring-primary/20 shadow-sm'
                          : 'border-border bg-card hover:bg-muted/40'
                      )}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-muted/80 text-foreground border border-border/50 uppercase tracking-tight">
                          {j.category === 'fastest' ? 'Fastest' : j.category === 'cheapest' ? 'Economy' : 'Direct'}
                        </span>
                        <span className="text-xs font-extrabold text-foreground font-mono tabular-nums">₹{j.integratedFare}</span>
                      </div>
                      <div className="text-sm font-bold text-foreground font-mono tabular-nums">
                        {j.totalDurationMinutes} mins
                      </div>
                      <div className="text-[11px] text-muted-foreground flex items-center justify-between mt-1">
                        <span className="font-mono tabular-nums">{j.totalDistanceKm} km</span>
                        <span>{j.transferCount} transfer{j.transferCount === 1 ? '' : 's'}</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Multimodal Efficiency & Savings Banner */}
              {aiAnalysis && (
                <div className="rounded-xl border border-primary/20 bg-muted/30 p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-primary/10 text-primary flex items-center justify-center text-xs font-bold border border-primary/20">
                        <Compass className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-bold text-foreground">
                        Route Efficiency Score:{' '}
                        <span className="text-primary font-extrabold text-sm font-mono tabular-nums">
                          {aiAnalysis.aiScore}/100
                        </span>
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-mono tabular-nums">
                      <TrendingDown className="w-3.5 h-3.5" />
                      Save ₹{aiAnalysis.autoRickshawComparison.moneySaved} vs Auto
                    </div>
                  </div>

                  <p className="text-xs text-foreground/90 leading-relaxed">
                    {language === 'gu'
                      ? aiAnalysis.verdictGu
                      : language === 'hi'
                      ? aiAnalysis.verdictHi
                      : aiAnalysis.verdict}
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-amber-500/20 text-[11px]">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Flame className="w-3.5 h-3.5 text-orange-500" />
                      <span>
                        Heat Comfort: <strong className="text-foreground">{aiAnalysis.heatComfortScore}/10</strong>
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="w-3.5 h-3.5 text-blue-500" />
                      <span>
                        Traffic Saved: <strong className="text-foreground">~{aiAnalysis.autoRickshawComparison.trafficDelayAvoidedMins}m</strong>
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Coins className="w-3.5 h-3.5 text-emerald-500" />
                      <span>
                        Auto Cost: <strong className="line-through text-muted-foreground">₹{aiAnalysis.autoRickshawComparison.autoCost}</strong>
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Leaf className="w-3.5 h-3.5 text-green-500" />
                      <span>
                        CO2 Cut: <strong className="text-foreground">{aiAnalysis.environmentalImpact.co2SavedKg} kg</strong>
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Unified Ticketing & Single Fare Header Bar */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-muted/60 border border-border">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-foreground">
                      One Unified Mobility Fare:
                    </span>
                    <span className="text-lg font-extrabold text-primary">
                      ₹{activeJourney.integratedFare}
                    </span>
                    {activeJourney.discountSaved > 0 && (
                      <>
                        <span className="text-xs line-through text-muted-foreground">
                          ₹{activeJourney.standaloneTotalFare}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold">
                          15% Single Pass Rebate (Save ₹{activeJourney.discountSaved})
                        </span>
                      </>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Single ticket valid for GMRC Metro + Janmarg BRTS + AMTS city bus
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowFareSplitModal(true)}
                    className="px-2.5 py-1.5 rounded-lg border border-border bg-card hover:bg-muted text-xs font-semibold flex items-center gap-1.5 text-foreground transition-colors"
                    title="View Operator Revenue Splitting Logic"
                  >
                    <Layers className="w-3.5 h-3.5 text-primary" />
                    <span>Fare Split</span>
                  </button>
                  <button
                    onClick={() => setShowQrTicket(true)}
                    className="px-2.5 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>One-Ticket QR</span>
                  </button>
                </div>
              </div>

              {/* Step-by-Step Multi-Modal Timeline */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Journey Timeline & Transfers ({activeJourney.legs.length} legs)
                </h3>

                <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
                  {activeJourney.legs.map((leg, lIdx) => {
                    const badge = getModeBadge(leg.mode);

                    return (
                      <div key={leg.id} className="relative">
                        {/* Circle Node Icon on the vertical timeline */}
                        <div
                          className={cn(
                            'absolute -left-6 top-1 w-5 h-5 rounded-full border-2 border-background flex items-center justify-center text-[10px] font-bold shadow-xs',
                            badge.bg
                          )}
                        >
                          {lIdx + 1}
                        </div>

                        <div className="rounded-xl border border-border bg-card p-3 shadow-xs space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span
                                className={cn(
                                  'text-[10px] font-bold uppercase px-2 py-0.5 rounded-full',
                                  badge.bg
                                )}
                              >
                                {language === 'gu'
                                  ? badge.labelGu
                                  : language === 'hi'
                                  ? badge.labelHi
                                  : badge.label}
                              </span>
                              {leg.routeName && (
                                <span className="text-xs font-semibold text-muted-foreground truncate max-w-[160px]">
                                  {leg.routeName}
                                </span>
                              )}
                              {/* Provenance Honesty Badge */}
                              {(() => {
                                const prov = getLegProvenance(leg.mode);
                                return (
                                  <span
                                    className={cn(
                                      'text-[9.5px] font-semibold px-1.5 py-0.5 rounded-md border',
                                      prov.color
                                    )}
                                  >
                                    {prov.tag}
                                  </span>
                                );
                              })()}
                              {/* Transfer Risk Badge for Pedestrian Links */}
                              {leg.mode === 'walk' && (() => {
                                const risk = getTransferRiskBadge(leg.durationMinutes);
                                return (
                                  <span
                                    className={cn(
                                      'text-[9.5px] font-bold px-1.5 py-0.5 rounded-md border',
                                      risk.color
                                    )}
                                  >
                                    {risk.label}
                                  </span>
                                );
                              })()}
                            </div>
                            <div className="text-xs font-bold text-foreground flex items-center gap-1 shrink-0">
                              <Clock className="w-3 h-3 text-muted-foreground" />
                              <span>{leg.durationMinutes}m</span>
                              {leg.fare > 0 && (
                                <span className="text-muted-foreground font-normal ml-1">
                                  (₹{leg.fare})
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="text-xs font-medium text-foreground leading-snug">
                            {language === 'gu'
                              ? leg.instructionGu
                              : language === 'hi'
                              ? leg.instructionHi
                              : leg.instruction}
                          </div>

                          {/* Operating Specs / Corridor Characteristics */}
                          <div className="text-[10.5px] text-muted-foreground bg-muted/40 p-2 rounded-lg border border-border/60 space-y-0.5">
                            <div>{getLegProvenance(leg.mode).sub}</div>
                            {leg.mode === 'walk' && (
                              <div className="text-amber-600 dark:text-amber-400 font-semibold text-[10px] flex items-center gap-1">
                                <Info className="w-3 h-3 shrink-0" />
                                <span>{getTransferRiskBadge(leg.durationMinutes).hint}</span>
                              </div>
                            )}
                            {leg.mode !== 'walk' && (
                              <div className="text-primary font-semibold text-[10px] flex items-center gap-1">
                                <Clock className="w-3 h-3 shrink-0" />
                                <span>Average Headway: ~{leg.waitMinutes || 5} min</span>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/40">
                            <span>
                              From <strong className="text-foreground">{leg.fromName}</strong> to{' '}
                              <strong className="text-foreground">{leg.toName}</strong>
                            </span>
                            <span>{leg.distanceKm} km</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            /* AUTHORITY CONSOLE (For Hackathon Judges, GMRC, AMC, and UMTA Officials) */
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl border border-primary/30 bg-primary/5 text-xs space-y-1">
                <div className="font-bold text-foreground flex items-center gap-1.5">
                  <Building className="w-4 h-4 text-primary" />
                  <span>Authority Transit Clearinghouse & Policy Console</span>
                </div>
                <p className="text-muted-foreground text-[11px] leading-relaxed">
                  Demonstrating live inter-operator settlement simulations, transfer gap analysis,
                  and Public-Private Partnership (PPP) break-even mechanics for Ahmedabad UMTA.
                </p>
              </div>

              {/* Settlement Split Method Chooser */}
              <div className="p-3 rounded-xl border border-border bg-card space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Scale className="w-3.5 h-3.5 text-primary" />
                    <span>Settlement Allocation Method</span>
                  </span>
                  <span className="text-[11px] text-muted-foreground">Largest-Remainder exact paise</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    onClick={() => setSplitMethod('fare_share')}
                    className={cn(
                      'p-2 rounded-lg border text-left font-medium transition-all',
                      splitMethod === 'fare_share'
                        ? 'border-primary bg-primary/10 text-primary font-bold'
                        : 'border-border text-muted-foreground hover:bg-muted'
                    )}
                  >
                    <div>1. Fare-Share (Default)</div>
                    <div className="text-[10px] font-normal text-muted-foreground">
                      Pro-rata tariff share + ₹2 boarding floor
                    </div>
                  </button>
                  <button
                    onClick={() => setSplitMethod('pkm')}
                    className={cn(
                      'p-2 rounded-lg border text-left font-medium transition-all',
                      splitMethod === 'pkm'
                        ? 'border-primary bg-primary/10 text-primary font-bold'
                        : 'border-border text-muted-foreground hover:bg-muted'
                    )}
                  >
                    <div>2. Passenger-Km (PKM)</div>
                    <div className="text-[10px] font-normal text-muted-foreground">
                      Proportional to travel distance on tracks/roads
                    </div>
                  </button>
                </div>
              </div>

              {/* Live Fare Split for Active Route */}
              <div className="p-3 rounded-xl border border-border bg-card space-y-2">
                <span className="text-xs font-bold text-foreground">
                  Current Sample Trip Split (₹{activeJourney.integratedFare} Total)
                </span>
                <div className="space-y-1.5">
                  {dynamicFareSplit.map((s, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs">
                      <span className="font-medium text-foreground">{s.operator}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground text-[11px]">
                          {s.distanceKm > 0 ? `${s.distanceKm} km` : ''}
                        </span>
                        <span className="font-extrabold text-foreground">₹{s.settledShare}</span>
                        <span className="text-[11px] font-semibold text-primary">({s.percentage}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 5,000 Trips Settlement Simulation & Break-even Slider */}
              <div className="p-3.5 rounded-xl border border-border bg-card space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-primary" />
                      <span>Multimodal Rebate & Break-Even Simulation (5,000 Trips)</span>
                    </span>
                    <p className="text-[11px] text-muted-foreground">
                      Formula: Required ridership uplift = r / (1 - r)
                    </p>
                  </div>
                  <span className="text-sm font-extrabold text-primary">{rebateSliderValue}% Rebate</span>
                </div>

                <input
                  type="range"
                  min="5"
                  max="25"
                  step="1"
                  value={rebateSliderValue}
                  onChange={(e) => setRebateSliderValue(Number(e.target.value))}
                  className="w-full accent-primary cursor-pointer"
                />

                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2 rounded-lg bg-muted/50 border border-border/60">
                    <div className="text-[10px] text-muted-foreground uppercase font-bold">Status Quo</div>
                    <div className="font-bold text-foreground">
                      ₹{(settlementSimulation.statusQuoTotalRevenue / 1000).toFixed(0)}k
                    </div>
                  </div>
                  <div className="p-2 rounded-lg bg-muted/50 border border-border/60">
                    <div className="text-[10px] text-muted-foreground uppercase font-bold">Integrated</div>
                    <div className="font-bold text-primary">
                      ₹{(settlementSimulation.integratedTotalRevenue / 1000).toFixed(0)}k
                    </div>
                  </div>
                  <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                    <div className="text-[10px] text-emerald-700 dark:text-emerald-400 uppercase font-bold">
                      Break-Even Uplift
                    </div>
                    <div className="font-extrabold text-emerald-600 dark:text-emerald-400">
                      +{settlementSimulation.requiredUpliftPercent}% trips
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-muted-foreground italic">
                  With a {rebateSliderValue}% unified transfer discount, multimodal ridership needs to rise by{' '}
                  <strong className="text-foreground">+{settlementSimulation.requiredUpliftPercent}%</strong>{' '}
                  to maintain complete operator revenue neutrality (historically 15% switch occurs from private two-wheelers).
                </p>
              </div>

              {/* Transfer Deserts Report (Gap Analysis) */}
              <div className="p-3.5 rounded-xl border border-border bg-card space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                    <span>Identified Transfer Deserts ({transferDeserts.length} Stations)</span>
                  </span>
                  <span className="text-[11px] text-muted-foreground">Gap &gt; 500m to nearest bus</span>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {transferDeserts.slice(0, 4).map((d) => (
                    <div
                      key={d.stationId}
                      className="p-2 rounded-lg border border-border/70 bg-muted/30 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between font-bold text-foreground">
                        <span>{d.stationName}</span>
                        <span className="text-amber-600 dark:text-amber-400 text-[11px]">
                          {d.nearestBusDistanceMeters}m gap
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-tight">
                        Nearest: {d.nearestBusStopName}
                      </p>
                      <p className="text-[11px] font-semibold text-primary leading-tight flex items-center gap-1">
                        <Compass className="w-3.5 h-3.5 shrink-0" />
                        <span>{d.suggestedFeeder}</span>
                      </p>
                    </div>
                  ))}
                </div>

                {/* Authority CSV Export Button */}
                <button
                  onClick={handleDownloadAuthorityCsv}
                  className="w-full py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Authority Settlement Audit Report (CSV)</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-3 sm:p-4 border-t border-border bg-muted/40 flex items-center justify-between shrink-0">
          <button
            onClick={() => {
              onShowOnMap(activeJourney);
              onClose();
              toast.success('Route displayed on map!');
            }}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            <MapPin className="w-4 h-4" />
            <span>Show Complete Route on Map</span>
          </button>

          <button
            onClick={onClose}
            className="hidden sm:inline-flex px-4 py-2.5 rounded-xl border border-border hover:bg-muted font-medium text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>

      {/* MODAL 1: Operator Revenue Splitting Logic (PS-08 Deliverable & Bonus) */}
      {showFareSplitModal && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in"
          onClick={() => setShowFareSplitModal(false)}
        >
          <div
            className="w-full max-w-lg bg-card border border-border rounded-2xl p-5 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-foreground">
                    Operator Fare-Splitting Logic
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    Inter-agency financial clearing & revenue settlement
                  </p>
                </div>
              </div>
              <button
                aria-label="Close Fare Split Dialog"
                onClick={() => setShowFareSplitModal(false)}
                className="w-7 h-7 rounded-full hover:bg-muted flex items-center justify-center text-muted-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-muted/50 border border-border text-xs space-y-1.5 text-foreground/90">
              <div className="font-semibold text-foreground flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                Hare-Niemeyer Exact Paise Splitting ({splitMethod === 'fare_share' ? 'Fare-Share Pro-Rata' : 'PKM Proportional'})
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Revenues from the ₹{activeJourney.integratedFare} unified ticket are automatically
                divided across operating agencies via digital smart clearinghouse with ₹2 base gate floors.
              </p>
            </div>

            {/* Fare Breakdown Table */}
            <div className="border border-border rounded-xl overflow-hidden text-xs">
              <table className="w-full divide-y divide-border">
                <thead className="bg-muted/70 text-muted-foreground font-semibold">
                  <tr>
                    <th className="px-3 py-2 text-left">Operator Agency</th>
                    <th className="px-3 py-2 text-right">Distance</th>
                    <th className="px-3 py-2 text-right">Share</th>
                    <th className="px-3 py-2 text-right">% Split</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {dynamicFareSplit.map((s, idx) => (
                    <tr key={idx} className="hover:bg-muted/30">
                      <td className="px-3 py-2.5 font-medium text-foreground">
                        {s.operator}
                      </td>
                      <td className="px-3 py-2.5 text-right text-muted-foreground">
                        {s.distanceKm > 0 ? `${s.distanceKm} km` : '—'}
                      </td>
                      <td className="px-3 py-2.5 text-right font-bold text-foreground">
                        ₹{s.settledShare}
                      </td>
                      <td className="px-3 py-2.5 text-right font-semibold text-primary">
                        {s.percentage}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Rationale explanation */}
            <div className="space-y-1.5 text-[11px] text-muted-foreground">
              <div className="font-semibold text-foreground">Settlement Breakdown:</div>
              {dynamicFareSplit.map((s, idx) => (
                <div key={idx} className="flex items-start gap-1.5">
                  <span className="text-primary font-bold">•</span>
                  <span>
                    <strong className="text-foreground">{s.operator}</strong>: {s.settlementRationale}
                  </span>
                </div>
              ))}
            </div>

            <button
              id="fare-split-done-btn"
              aria-label="Close Fare Split Dialog"
              onClick={() => setShowFareSplitModal(false)}
              className="w-full py-2 rounded-xl bg-primary text-primary-foreground font-semibold text-xs cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* MODAL 2: Simulated "Ek Safar" Single QR Ticket with Anti-Fraud Live Wave */}
      {showQrTicket && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in"
          onClick={() => setShowQrTicket(false)}
        >
          <div
            className="w-full max-w-sm bg-card border border-border rounded-3xl p-5 sm:p-6 shadow-2xl space-y-3.5 text-center relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Dynamic Anti-Screenshot Animated Sweep Bar */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-primary to-amber-500 animate-pulse" />

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span className="text-xs font-bold uppercase tracking-wider text-primary">
                  Ek Safar Mobility Pass
                </span>
              </div>
              <button
                id="qr-ticket-done-btn"
                aria-label="Close QR Ticket Dialog"
                onClick={() => setShowQrTicket(false)}
                className="w-6 h-6 rounded-full hover:bg-muted flex items-center justify-center text-muted-foreground cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-1">
              <div className="text-3xl font-black text-foreground">₹{activeJourney.integratedFare}</div>
              <p className="text-[11px] text-muted-foreground">
                All-in-One Multi-Modal Transit Pass (15% Integrated Rebate)
              </p>
            </div>

            {/* Simulated QR Code Canvas with Dynamic Live Frame */}
            <div className="w-48 h-48 mx-auto p-3 bg-white rounded-2xl shadow-inner flex flex-col items-center justify-center border-4 border-primary/20 relative">
              <div className="w-full h-full bg-slate-900 rounded-lg p-2.5 flex flex-col items-center justify-center text-white space-y-1.5">
                <QrCode className="w-20 h-20 text-white" />
                <span className="text-[8.5px] tracking-widest uppercase font-mono text-slate-300">
                  GMRC • BRTS • AMTS
                </span>
                <span className="text-[8px] font-mono text-emerald-400">
                  LIVE SECURE PASS
                </span>
              </div>
            </div>

            {/* Live 90-Minute Countdown Clock */}
            <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/30 text-xs flex items-center justify-between">
              <span className="font-semibold text-foreground flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-primary animate-spin-slow" />
                <span>Valid for:</span>
              </span>
              <span className="font-extrabold text-primary font-mono text-sm">
                {Math.floor(qrCountdown / 60)}m {(qrCountdown % 60).toString().padStart(2, '0')}s
              </span>
            </div>

            {/* Turnstile Checkmarks */}
            <div className="p-2.5 rounded-xl bg-muted/50 border border-border text-left space-y-1 text-[11px]">
              <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>GMRC AFC Smart Gates — Ready to Tap</span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Janmarg BRTS Turnstiles — QR Scanned</span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>AMTS Municipal ETM — Validated Pass</span>
              </div>
            </div>

            {/* Ticket Ref & Copy */}
            <div className="flex items-center justify-between text-[11px] text-muted-foreground px-1">
              <span className="font-mono text-[10px]">{ticketRefId}</span>
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(ticketRefId);
                  setQrCopied(true);
                  toast.success('Ticket reference copied!');
                  setTimeout(() => setQrCopied(false), 2000);
                }}
                className="text-primary hover:underline flex items-center gap-1 text-[10px] cursor-pointer"
              >
                {qrCopied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                <span>{qrCopied ? 'Copied' : 'Copy Ref'}</span>
              </button>
            </div>

            <button
              onClick={() => {
                setShowQrTicket(false);
                toast.success('Pass tapped successfully at GMRC Smart Gate! Enjoy your journey.');
              }}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-colors cursor-pointer"
            >
              Simulate Turnstile Gate Tap & Board
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
