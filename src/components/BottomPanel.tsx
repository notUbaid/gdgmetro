import { getISTDate, minutesUntil, cn } from '@/lib/utils';
import { X, MapPin, Clock, Train, Navigation, Locate, Loader2, Route, AlertTriangle, Users, ChevronUp, ChevronDown, Bus, CreditCard, Languages, Building2, Compass } from 'lucide-react';
import { toast } from 'sonner';
import { Station, LINE_COLORS } from '@/data/metroData';
import { getUpcomingTrains, getLastTrainWarnings, getCurrentHeadway, getServiceWindow } from '@/data/timetable';
import { getCrowdLevel } from '@/lib/crowding';
import { useLanguage } from '@/contexts/LanguageContext';
import { t, getStationName } from '@/lib/i18n';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { getBestUserLocation } from '@/lib/geolocation';
import { useCurrentTime } from '@/hooks/useCurrentTime';
import { findNearestTransitStops } from '@/lib/multimodalRouter';

interface BottomPanelProps {
  selectedStation: Station | null;
  nearestStation: Station | null;
  distance: number | null; // in meters (real walking distance)
  walkingTime: number | null; // in seconds (real walking time)
  onClose: () => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onLocate: (lat: number, lng: number) => void;
  onPlanRoute?: (stationId: string) => void;
  onOpenRoutePlanner?: () => void;
  onStartMultimodalPicker?: () => void;
  userLocation: [number, number] | null;
  searchedLocation?: [number, number] | null;
}

const formatDistance = (meters: number): string => {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
};

const formatWalkingTime = (seconds: number): string => {
  const minutes = Math.round(seconds / 60);
  if (minutes < 1) return '< 1 min';
  if (minutes < 60) return `${minutes} min`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
};

export const BottomPanel = React.memo(({
  selectedStation,
  nearestStation,
  distance,
  walkingTime,
  onClose,
  isExpanded,
  onToggleExpand,
  onLocate,
  onPlanRoute,
  onOpenRoutePlanner,
  onStartMultimodalPicker,
  userLocation,
  searchedLocation,
}: BottomPanelProps) => {
  const [upcomingMetros, setUpcomingMetros] = useState<ReturnType<typeof getUpcomingTrains>>([]);
  const [lastTrainWarnings, setLastTrainWarnings] = useState<ReturnType<typeof getLastTrainWarnings>>([]);
  const [isLocating, setIsLocating] = useState(false);
  const [departureModeFilter, setDepartureModeFilter] = useState<'all' | 'metro' | 'brts' | 'amts'>('all');
  const currentTime = useCurrentTime();
  const { language } = useLanguage();

  const station = selectedStation || nearestStation;

  // Connected Janmarg BRTS and AMTS Feeder stops within walking reach of this station
  const nearbyBrts = useMemo(() => {
    if (!station) return [];
    return findNearestTransitStops(station.coordinates[0], station.coordinates[1], 1, 'brts');
  }, [station]);

  const nearbyAmts = useMemo(() => {
    if (!station) return [];
    return findNearestTransitStops(station.coordinates[0], station.coordinates[1], 1, 'amts');
  }, [station]);

  // Service day window at this station — stable across the day, so no time dep.
  const serviceWindow = useMemo(() => (station ? getServiceWindow(station.id) : null), [station]);

  // Auto-refresh upcoming metros and Last Metro warnings every 10 seconds
  useEffect(() => {
    if (station) {
      setUpcomingMetros(getUpcomingTrains(station.id, 3, language));
      setLastTrainWarnings(getLastTrainWarnings(station.id, language));
      const interval = setInterval(() => {
        setUpcomingMetros(getUpcomingTrains(station.id, 3, language));
        setLastTrainWarnings(getLastTrainWarnings(station.id, language));
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [station, language]);

  // Calculate live "minutes away" based on current time
  const getLiveMinutesAway = (arrivalTime: string): number => {
    const [h, m] = arrivalTime.split(':').map(Number);
    const arrivalMinutes = h * 60 + m;
    const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
    const minutesAway = minutesUntil(arrivalMinutes, currentMinutes);
    const secondsIntoMinute = currentTime.getSeconds();
    return Math.max(0, minutesAway - (secondsIntoMinute > 30 ? 1 : 0));
  };

  const formatMinutesAway = (mins: number) => {
    if (mins === 0) return t('panel.now', language);
    if (mins >= 60) {
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      return m > 0 ? `${h}h ${m}m` : `${h}h`;
    }
    return `${mins}m`;
  };


  const locatingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clean up any pending locate timeout on unmount
  useEffect(() => {
    return () => {
      if (locatingTimeoutRef.current) {
        clearTimeout(locatingTimeoutRef.current);
      }
    };
  }, []);

  const handleLocate = () => {
    if (!('geolocation' in navigator)) {
      toast.error(t('panel.geoUnsupported', language));
      return;
    }

    // If we already have a location from watchPosition, use it immediately with zero delay
    if (userLocation) {
      onLocate(userLocation[0], userLocation[1]);
      return;
    }

    if (isLocating) return; // Prevent duplicate clicks
    setIsLocating(true);

    if (locatingTimeoutRef.current) {
      clearTimeout(locatingTimeoutRef.current);
      locatingTimeoutRef.current = null;
    }

    // Global safety timer so spinner never gets stuck
    locatingTimeoutRef.current = setTimeout(() => {
      setIsLocating(false);
      locatingTimeoutRef.current = null;
    }, 28000);

    getBestUserLocation(
      (coords) => {
        if (locatingTimeoutRef.current) {
          clearTimeout(locatingTimeoutRef.current);
          locatingTimeoutRef.current = null;
        }
        setIsLocating(false);
        onLocate(coords.latitude, coords.longitude);
      },
      (error) => {
        if (locatingTimeoutRef.current) {
          clearTimeout(locatingTimeoutRef.current);
          locatingTimeoutRef.current = null;
        }
        setIsLocating(false);

        if (error.code === 'PERMISSION_DENIED') {
          toast.error(t('panel.locationDenied', language));
        } else if (error.code === 'POSITION_UNAVAILABLE') {
          toast.error(t('panel.locationUnavailable', language));
        } else if (error.code === 'TIMEOUT') {
          toast.error(t('panel.locationTimeout', language));
        } else {
          toast.error(t('panel.locationFailed', language));
        }
      }
    );
  };


  const touchStartYRef = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartYRef.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartYRef.current === null) return;
    const touchEndY = e.changedTouches[0].clientY;
    const deltaY = touchEndY - touchStartYRef.current;
    touchStartYRef.current = null;

    if (Math.abs(deltaY) > 35) {
      if (deltaY < 0 && !isExpanded) {
        onToggleExpand();
      } else if (deltaY > 0 && isExpanded) {
        onToggleExpand();
      }
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[1000] pointer-events-none">
      {/* Floating buttons */}
      {/* Plan Route button - left side */}
      {selectedStation && onPlanRoute && (
        <button
          onClick={() => onPlanRoute(selectedStation.id)}
          className="absolute -top-16 left-4 p-3.5 flex items-center gap-2 bg-background text-foreground border border-border rounded-2xl shadow-xl shadow-black/5 hover:bg-muted transition-all hover:scale-105 active:scale-95 animate-fade-in pointer-events-auto will-change-transform transform-gpu"
          aria-label={t('panel.planRoute', language)}
        >
          <Route className="w-5 h-5" />
          <span className="font-semibold text-sm">{t('panel.planRoute', language)}</span>
        </button>
      )}

      {/* Navigate button - show when no selection but nearest exists */}
      {!selectedStation && nearestStation && (
        <button
          onClick={() => {
            const [lat, lng] = nearestStation.coordinates;
            const travelMode = (distance !== null && distance > 30000) ? 'driving' : 'walking';
            let url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=${travelMode}`;
            
            // Prefer searched location as origin if active, otherwise fallback to GPS location
            const originLocation = searchedLocation || userLocation;
            if (originLocation) {
              url += `&origin=${originLocation[0]},${originLocation[1]}`;
            }
            window.open(url, '_blank');
          }}
          className="absolute -top-16 left-4 p-3.5 bg-blue-600 text-white rounded-2xl shadow-xl shadow-blue-600/25 hover:bg-blue-700 transition-all hover:scale-105 active:scale-95 flex items-center gap-2 animate-fade-in pointer-events-auto"
          aria-label={t('panel.directions', language)}
        >
          <Navigation className="w-5 h-5 fill-current" />
          <span className="font-semibold text-sm">{t('panel.directions', language)}</span>
        </button>
      )}

      <button
        onClick={handleLocate}
        disabled={isLocating}
        className="absolute -top-16 right-4 p-3.5 glass-panel rounded-2xl shadow-xl shadow-black/5 hover:bg-background/70 transition-all hover-scale disabled:opacity-50 pointer-events-auto"
        aria-label={t('panel.locateMe', language)}
      >
        {isLocating ? (
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
        ) : (
          <Locate className="w-5 h-5 text-primary" />
        )}
      </button>

      {/* Panel container */}
      <div className="glass-panel rounded-t-3xl shadow-[0_-8px_30px_rgb(0,0,0,0.12)] border-t pointer-events-auto safe-p-bottom transition-all duration-500 cubic-bezier(0.32, 0.72, 0, 1) will-change-transform transform-gpu">
        {/* Always visible header - clickable to expand/collapse and swipeable */}
        <div
          className="px-4 pt-3 pb-3 cursor-pointer active:bg-muted/30 transition-colors select-none"
          onClick={() => onToggleExpand()}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Visual drag handle pill */}
          <div className="w-10 h-1 rounded-full bg-muted-foreground/30 mx-auto mb-3" />

          {station ? (
            <>
              {/* Station header */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  {!selectedStation && nearestStation && distance !== null && !isNaN(distance) && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                      <Navigation className="w-3 h-3" />
                      <span>{t('panel.nearestStation', language)}</span>
                    </div>
                  )}
                  <h2 className="text-lg font-semibold">{getStationName(station, language)}</h2>
                  {language === 'en' && station.nameGu && (
                    <p className="text-sm text-muted-foreground">{station.nameGu}</p>
                  )}
                  {language === 'gu' && (
                    <p className="text-sm text-muted-foreground">{station.name}</p>
                  )}
                  {language === 'hi' && (
                    <p className="text-sm text-muted-foreground">{station.name}</p>
                  )}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const [lat, lng] = station.coordinates;
                      const travelMode = (distance !== null && distance > 30000) ? 'driving' : 'walking';
                      let url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=${travelMode}`;
                      const originLocation = searchedLocation || userLocation;
                      if (originLocation) {
                        url += `&origin=${originLocation[0]},${originLocation[1]}`;
                      }
                      window.open(url, '_blank');
                    }}
                    className="p-2 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-full hover:bg-primary/10 text-primary transition-colors"
                    aria-label={t('panel.directions', language)}
                    title={t('panel.directions', language)}
                  >
                    <Navigation className="w-4 h-4 fill-current" />
                  </button>
                  {selectedStation && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onClose();
                      }}
                      className="p-1.5 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full hover:bg-muted transition-colors"
                      aria-label={t('common.close', language)}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Line badges */}
              <div className="flex flex-wrap gap-1.5 mb-2">
                {station.lines.map(line => (
                  <span
                    key={line}
                    className="px-2.5 py-0.5 rounded-full text-xs font-semibold text-white shadow-xs capitalize tracking-wide"
                    style={{ backgroundColor: LINE_COLORS[line as keyof typeof LINE_COLORS] || '#0066CC' }}
                  >
                    {t(`route.${line}Line` as Parameters<typeof t>[0], language)}
                  </span>
                ))}
                {station.isInterchange && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-muted/80 text-foreground border border-border/60">
                    {t('panel.interchange', language)}
                  </span>
                )}
              </div>

              {/* Distance info */}
              {!selectedStation && distance !== null && !isNaN(distance) && (
                distance > 30000 ? (
                  <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 font-medium">
                    <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{t('panel.outsideServiceArea', language)} ({formatDistance(distance)})</span>
                  </div>
                ) : (
                  walkingTime !== null && !isNaN(walkingTime) && (
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium">{formatDistance(distance)}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-primary" />
                        <span className="text-sm">{formatWalkingTime(walkingTime)} {t('panel.walk', language)}</span>
                      </div>
                    </div>
                  )
                )
              )}

              {/* Multi-Modal Connectivity Strip (Metro + Janmarg BRTS + AMTS) */}
              <div className="mt-2.5 p-2 rounded-xl bg-muted/40 border border-border/60 flex items-center justify-between text-xs gap-2">
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                  {nearbyBrts[0] && (
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400 font-medium shrink-0 text-[11px]">
                      <Bus className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate max-w-[110px] sm:max-w-[150px] font-semibold">{nearbyBrts[0].stop.name}</span>
                      <span className="text-[10px] opacity-75 font-mono tabular-nums">({(nearbyBrts[0].distanceKm * 1000).toFixed(0)}m)</span>
                    </div>
                  )}
                  {nearbyAmts[0] && (
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 font-medium shrink-0 text-[11px]">
                      <Bus className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate max-w-[110px] sm:max-w-[150px] font-semibold">{nearbyAmts[0].stop.name}</span>
                      <span className="text-[10px] opacity-75 font-mono tabular-nums">({(nearbyAmts[0].distanceKm * 1000).toFixed(0)}m)</span>
                    </div>
                  )}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    window.dispatchEvent(
                      new CustomEvent('open-multimodal-modal', {
                        detail: {
                          originName: getStationName(station, language),
                          originCoords: station.coordinates,
                        },
                      })
                    );
                  }}
                  className="px-2.5 py-1 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-[11px] shrink-0 transition-colors shadow-xs cursor-pointer flex items-center gap-1"
                >
                  <Route className="w-3 h-3" />
                  <span>Plan Multi-Modal</span>
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-2 px-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold uppercase tracking-wider mb-2">
                <Compass className="w-3 h-3 text-primary" />
                <span>Ek Safar · Metropolitan Transit Network</span>
              </div>
              <h2 className="text-base sm:text-lg font-bold tracking-tight mb-1 text-foreground">
                Ek Safar Multimodal Transit <span className="font-normal text-xs text-muted-foreground">(એક સફર)</span>
              </h2>
              <p className="text-xs text-muted-foreground mb-3 max-w-sm mx-auto leading-relaxed">
                Seamless door-to-door transit combining Gujarat Metro, Janmarg BRTS dedicated corridors, and AMTS feeder buses with unified RuPay NCMC fare caps.
              </p>

              {/* Multimodal Quick Action Buttons */}
              <div className="flex items-center justify-center gap-2 flex-wrap mb-3">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onStartMultimodalPicker) {
                      onStartMultimodalPicker();
                    } else {
                      window.dispatchEvent(new CustomEvent('start-multimodal-picker'));
                    }
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-xs shadow-sm hover:opacity-95 active:scale-95 transition-all cursor-pointer min-h-[42px]"
                >
                  <Route className="w-4 h-4" />
                  <span>Plan Point-to-Point Route</span>
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.dispatchEvent(new CustomEvent('open-multimodal-modal'));
                  }}
                  className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-muted/80 border border-border text-foreground font-semibold text-xs hover:bg-muted active:scale-95 transition-all cursor-pointer min-h-[42px]"
                >
                  <Languages className="w-3.5 h-3.5 text-primary" />
                  <span>Gujlish Transit Search</span>
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.dispatchEvent(new CustomEvent('open-multimodal-modal', { detail: { tab: 'authority' } }));
                  }}
                  className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-muted/80 border border-border text-foreground font-semibold text-xs hover:bg-muted active:scale-95 transition-all cursor-pointer min-h-[42px]"
                >
                  <Building2 className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Clearinghouse Audit</span>
                </button>
              </div>

              {/* Transit Network Hierarchy Chips */}
              <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground flex-wrap">
                <span className="px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold border border-blue-500/20 flex items-center gap-1.5">
                  <Train className="w-3 h-3" /> 53 Metro Stations
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400 font-semibold border border-orange-500/20 flex items-center gap-1.5">
                  <Bus className="w-3 h-3" /> Janmarg BRTS Corridors
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 font-semibold border border-sky-500/20 flex items-center gap-1.5">
                  <Bus className="w-3 h-3" /> AMTS Feeder Routes
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-500/20 flex items-center gap-1.5">
                  <CreditCard className="w-3 h-3" /> NCMC RuPay Fare Cap
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Collapsible content - Upcoming Metros */}
        {station && (
          <div className={`transition-all duration-300 ease-out overflow-hidden ${isExpanded ? 'max-h-[60vh]' : 'max-h-0'}`}>
            <div className="px-4 pb-4 overflow-y-auto">
              {/* Last Metro warnings */}
              {lastTrainWarnings.length > 0 && (
                <div className="mb-3 space-y-2">
                  {lastTrainWarnings.map((warning, i) => (
                    <div
                      key={`${warning.destination}-${warning.lastTrainTime}`}
                      className="flex items-center gap-2 p-2.5 bg-amber-500/15 border border-amber-500/30 rounded-lg"
                    >
                      <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                      <span className="text-sm text-amber-700 dark:text-amber-400">
                        <span className="font-medium">{t('panel.lastMetro', language)}</span> {t('panel.to', language)} {warning.destination} {t('panel.departsIn', language)}{' '}
                        <span className="font-semibold">{warning.minutesRemaining} {t('commute.min', language)}</span>
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Multi-Modal Mode Filter Tabs */}
              <div className="flex items-center gap-1.5 mb-3 bg-muted/60 p-1 rounded-xl">
                <button
                  onClick={() => setDepartureModeFilter('all')}
                  className={cn(
                    'flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1 cursor-pointer',
                    departureModeFilter === 'all'
                      ? 'bg-background text-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  All Modes
                </button>
                <button
                  onClick={() => setDepartureModeFilter('metro')}
                  className={cn(
                    'flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1 cursor-pointer',
                    departureModeFilter === 'metro'
                      ? 'bg-background text-primary shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Train className="w-3.5 h-3.5" />
                  <span>Metro</span>
                </button>
                <button
                  onClick={() => setDepartureModeFilter('brts')}
                  className={cn(
                    'flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1 cursor-pointer',
                    departureModeFilter === 'brts'
                      ? 'bg-background text-orange-600 dark:text-orange-400 shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Bus className="w-3.5 h-3.5" />
                  <span>BRTS</span>
                </button>
                <button
                  onClick={() => setDepartureModeFilter('amts')}
                  className={cn(
                    'flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1 cursor-pointer',
                    departureModeFilter === 'amts'
                      ? 'bg-background text-sky-600 dark:text-sky-400 shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Bus className="w-3.5 h-3.5" />
                  <span>AMTS</span>
                </button>
              </div>

              {/* Upcoming Metros Section */}
              {(departureModeFilter === 'all' || departureModeFilter === 'metro') && (
                <div className="mb-4">
                  <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                    <Train className="w-4 h-4" />
                    {t('panel.upcomingMetros', language)}
                    {upcomingMetros.length > 0 && new Set(upcomingMetros.map(t => t.line)).size === 1 && (
                      <>
                        {upcomingMetros[0].minutesAway <= 60 && (
                          <span className="text-xs text-muted-foreground font-normal">
                            · {t('panel.every', language)} {getCurrentHeadway(upcomingMetros[0].line).label}
                          </span>
                        )}
                        <span className="ml-auto text-xs text-muted-foreground font-normal flex items-center">
                          {t('panel.live', language)}
                          <span className="inline-block w-1.5 h-1.5 bg-green-500 rounded-full ml-1 animate-pulse" />
                        </span>
                      </>
                    )}
                  </h3>
                  {upcomingMetros.length > 0 ? (
                    <div className="space-y-2">
                      {upcomingMetros.map((train) => {
                        const liveMinutes = getLiveMinutesAway(train.arrivalTime);
                        const crowd = getCrowdLevel(train.line, train.trainId || '', {
                          stationIndex: train.stationIndex,
                          totalStations: train.stationList.length,
                          stationList: train.stationList,
                        });
                        return (
                          <div
                            key={`${train.arrivalTime}-${train.destination}`}
                            className="flex items-center justify-between p-2.5 bg-gradient-to-r from-muted/30 to-muted/20 rounded-xl transition-all shadow-sm"
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div
                                className="w-3 h-3 rounded-full flex-shrink-0"
                                style={{ backgroundColor: LINE_COLORS[train.line as keyof typeof LINE_COLORS] }}
                              />
                              <div className="min-w-0">
                                <div className="text-sm font-semibold truncate">
                                  {train.remainingStations.length === 0 ? t('panel.terminatesHere', language) : train.destination}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {train.remainingStations.length === 0 ? t('panel.arrivalOnly', language) : train.direction}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 flex-shrink-0">
                              <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${crowd.level === 'low'
                                ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                                : crowd.level === 'moderate'
                                  ? 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400'
                                  : 'bg-red-500/10 text-red-600 dark:text-red-400'
                                }`}>
                                <Users className="w-3 h-3" />
                                <span>{crowd.label}</span>
                              </div>
                              <div className="flex flex-col items-end">
                                <div className="text-sm font-semibold font-mono tabular-nums">{train.arrivalTime}</div>
                                <div className={`text-xs font-medium px-2 py-0.5 rounded-full mt-1 ${liveMinutes === 0 ? 'bg-green-500/20 text-green-600' : liveMinutes <= 2 ? 'bg-green-500/10 text-green-700' : liveMinutes <= 5 ? 'bg-yellow-500/10 text-yellow-700' : 'bg-muted text-muted-foreground'}`}>
                                  {formatMinutesAway(liveMinutes)}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground text-center py-3 bg-muted/30 rounded-lg">
                      {(() => {
                        const nowMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
                        if (serviceWindow) {
                          const firstMin = Number(serviceWindow.first.slice(0, 2)) * 60 + Number(serviceWindow.first.slice(3));
                          const lastMin = Number(serviceWindow.last.slice(0, 2)) * 60 + Number(serviceWindow.last.slice(3));
                          if (nowMinutes < firstMin) {
                            return `${t('panel.firstMetro', language)} ${serviceWindow.first}`;
                          }
                          if (nowMinutes > lastMin) {
                            return `${t('panel.serviceEnded', language)} · ${t('panel.firstMetroTomorrow', language)} ${serviceWindow.first}`;
                          }
                          return `${t('panel.noUpcomingMetros', language)} · ${t('panel.lastMetro', language)} ${serviceWindow.last}`;
                        }
                        return t('panel.noUpcomingMetros', language);
                      })()}
                    </div>
                  )}
                </div>
              )}

              {/* Connected Janmarg BRTS Feeder Corridors */}
              {(departureModeFilter === 'all' || departureModeFilter === 'brts') && nearbyBrts.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5 text-orange-600 dark:text-orange-400">
                    <Bus className="w-4 h-4" />
                    <span>Janmarg BRTS Dedicated Busway</span>
                    <span className="ml-auto text-xs text-muted-foreground font-normal">Headway: 4–6 min</span>
                  </h3>
                  <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/25 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-foreground">
                      <span>{nearbyBrts[0].stop.name}</span>
                      <span className="text-orange-600 dark:text-orange-400 font-mono tabular-nums">
                        {(nearbyBrts[0].distanceKm * 1000).toFixed(0)}m walk
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Level-platform median corridor · Zero road traffic delay · ₹4–₹10 RuPay NCMC stage fare.
                    </p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        window.dispatchEvent(
                          new CustomEvent('open-multimodal-modal', {
                            detail: {
                              originName: nearbyBrts[0].stop.name,
                              originCoords: nearbyBrts[0].stop.coordinates,
                            },
                          })
                        );
                      }}
                      className="w-full py-1.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-semibold text-xs transition-colors cursor-pointer"
                    >
                      Plan Route from {nearbyBrts[0].stop.name}
                    </button>
                  </div>
                </div>
              )}

              {/* Connected AMTS Municipal Feeder Routes */}
              {(departureModeFilter === 'all' || departureModeFilter === 'amts') && nearbyAmts.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5 text-sky-600 dark:text-sky-400">
                    <Bus className="w-4 h-4" />
                    <span>AMTS Municipal Feeder Service</span>
                    <span className="ml-auto text-xs text-muted-foreground font-normal">Base Fare: ₹3</span>
                  </h3>
                  <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/25 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-foreground">
                      <span>{nearbyAmts[0].stop.name}</span>
                      <span className="text-sky-600 dark:text-sky-400 font-mono tabular-nums">
                        {(nearbyAmts[0].distanceKm * 1000).toFixed(0)}m walk
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Municipal last-mile feeder bus · Connects surrounding residential sectors and markets.
                    </p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        window.dispatchEvent(
                          new CustomEvent('open-multimodal-modal', {
                            detail: {
                              originName: nearbyAmts[0].stop.name,
                              originCoords: nearbyAmts[0].stop.coordinates,
                            },
                          })
                        );
                      }}
                      className="w-full py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs transition-colors cursor-pointer"
                    >
                      Plan Route from {nearbyAmts[0].stop.name}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

export default BottomPanel;
