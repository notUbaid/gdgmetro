// Gujlish & Natural Language Transit Query Parser (PS-08)
// Parses Gujarati, Hindi, English, and colloquial "Gujlish" transit queries
// 100% Client-side, offline-first, deterministic, schema-validated.

import { popularPlaces } from '@/data/popularPlaces';
import { stations } from '@/data/metroData';
import { allBusStops } from '@/data/multimodalData';

export interface ParsedTransitQuery {
  rawQuery: string;
  originName?: string;
  originCoords?: [number, number];
  originStopId?: string;
  destName?: string;
  destCoords?: [number, number];
  destStopId?: string;
  preference: 'fastest' | 'cheapest' | 'min_transfers' | 'heat_avoidance';
  departureTime?: string;
  confidence: number; // 0 to 1
  detectedLanguage: 'gu' | 'hi' | 'en' | 'gujlish';
  explanation: string;
}

// Normalized aliases dictionary for Ahmedabad/Gandhinagar landmarks and hubs
interface ResolvedPlace {
  name: string;
  coordinates: [number, number];
  stopId?: string;
}

const KNOWN_PLACES: Record<string, ResolvedPlace> = {
  // Metro Stations & Interchanges
  thaltej: { name: 'Thaltej', coordinates: [23.0505, 72.5166], stopId: 'thaltej' },
  'thaltej gam': { name: 'Thaltej Gam', coordinates: [23.052, 72.508], stopId: 'thaltej_gam' },
  kalupur: { name: 'Kalupur Railway Station', coordinates: [23.0298, 72.6006], stopId: 'kalupur_railway_station' },
  ranip: { name: 'Ranip', coordinates: [23.0681, 72.5745], stopId: 'ranip' },
  motera: { name: 'Motera Stadium', coordinates: [23.0925, 72.5975], stopId: 'motera_stadium' },
  'old high court': { name: 'Old High Court', coordinates: [23.0365, 72.571], stopId: 'old_high_court' },
  apmc: { name: 'APMC', coordinates: [22.9865, 72.545], stopId: 'apmc' },
  vastral: { name: 'Vastral Gam', coordinates: [23.0035, 72.6645], stopId: 'vastral_gam' },
  paldi: { name: 'Paldi', coordinates: [23.0145, 72.565], stopId: 'paldi' },
  vadaj: { name: 'Vadaj', coordinates: [23.0565, 72.573], stopId: 'vadaj' },
  sabarmati: { name: 'Sabarmati', coordinates: [23.0825, 72.585], stopId: 'sabarmati' },
  maninagar: { name: 'Maninagar', coordinates: [22.998, 72.6025], stopId: 'kankaria_east' },
  'kankaria lake': { name: 'Kankaria Lake', coordinates: [23.006, 72.602], stopId: 'kankaria_east' },
  kankaria: { name: 'Kankaria', coordinates: [23.006, 72.602], stopId: 'kankaria_east' },
  'gift city': { name: 'GIFT City', coordinates: [23.161, 72.684], stopId: 'gift_city' },
  gift: { name: 'GIFT City', coordinates: [23.161, 72.684], stopId: 'gift_city' },
  infocity: { name: 'Infocity Gandhinagar', coordinates: [23.197, 72.632], stopId: 'infocity' },
  'mahatma mandir': { name: 'Mahatma Mandir', coordinates: [23.235, 72.638], stopId: 'mahatma_mandir' },
  gnlu: { name: 'GNLU', coordinates: [23.155, 72.656], stopId: 'gnlu' },
  koteshwar: { name: 'Koteshwar Road', coordinates: [23.107, 72.599], stopId: 'koteshwar_road' },

  // Key Bus Hubs & Urban Landmarks
  bopal: { name: 'Bopal Approach', coordinates: [23.0345, 72.4715], stopId: 'brts_bopal_approach' },
  ghuma: { name: 'Ghuma', coordinates: [23.0285, 72.4585], stopId: 'brts_bopal_approach' },
  iskcon: { name: 'Iskcon Cross Road', coordinates: [23.0278, 72.5075], stopId: 'brts_iskcon_cross_road' },
  iscon: { name: 'Iskcon Cross Road', coordinates: [23.0278, 72.5075], stopId: 'brts_iskcon_cross_road' },
  shivranjani: { name: 'Shivranjani Cross Road', coordinates: [23.0255, 72.5298], stopId: 'brts_shivranjani' },
  nehrunagar: { name: 'Nehrunagar', coordinates: [23.0205, 72.545], stopId: 'brts_nehrunagar' },
  anjali: { name: 'Anjali (Vasna)', coordinates: [23.0085, 72.5585], stopId: 'brts_anjali' },
  'geeta mandir': { name: 'Geeta Mandir Central', coordinates: [23.0145, 72.5925], stopId: 'brts_geeta_mandir' },
  naroda: { name: 'Naroda Gam', coordinates: [23.0678, 72.6512], stopId: 'brts_naroda' },
  'rto circle': { name: 'RTO Circle', coordinates: [23.0642, 72.5815], stopId: 'brts_rto_circle' },
  rto: { name: 'RTO Circle', coordinates: [23.0642, 72.5815], stopId: 'brts_rto_circle' },
  'science city': { name: 'Science City', coordinates: [23.0782, 72.5025], stopId: 'brts_science_city' },
  airport: { name: 'Sardar Vallabhbhai Patel Airport', coordinates: [23.0735, 72.6265], stopId: 'amts_airport_circle' },
  'airport circle': { name: 'Airport Circle', coordinates: [23.0735, 72.6265], stopId: 'amts_airport_circle' },
  iim: { name: 'IIM Ahmedabad', coordinates: [23.0315, 72.5325], stopId: 'brts_andhjan_mandal' },
  'iim ahmedabad': { name: 'IIM Ahmedabad', coordinates: [23.0315, 72.5325], stopId: 'brts_andhjan_mandal' },
  'law garden': { name: 'Law Garden', coordinates: [23.0265, 72.558], stopId: 'amts_law_garden' },
  'lal darwaja': { name: 'Lal Darwaja Terminus', coordinates: [23.0245, 72.581], stopId: 'amts_lal_darwaja' },
  'vastrapur lake': { name: 'Vastrapur Lake', coordinates: [23.035, 72.528], stopId: 'brts_himmatlal_park' },
  vastrapur: { name: 'Vastrapur', coordinates: [23.035, 72.528], stopId: 'brts_himmatlal_park' },
  'sg highway': { name: 'SG Highway (Iskcon)', coordinates: [23.0278, 72.5075], stopId: 'brts_iskcon_cross_road' },
  chandkheda: { name: 'Chandkheda', coordinates: [23.112, 72.582], stopId: 'brts_chandkheda' },
  zundal: { name: 'Zundal Circle', coordinates: [23.135, 72.584], stopId: 'brts_zundal_circle' },
};

/**
 * Normalizes text: trims, lowercases, removes punctuation, handles common Gujarati/Hindi transliterations
 */
export const normalizeQueryText = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[?,.!/\\()_#]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * Resolves a place name substring against known transit stations and landmarks
 */
export const resolvePlace = (queryStr: string): ResolvedPlace | null => {
  const clean = normalizeQueryText(queryStr);
  if (!clean || clean.length < 2) return null;

  // 1. Direct dictionary match
  if (KNOWN_PLACES[clean]) {
    return KNOWN_PLACES[clean];
  }

  // 2. Substring matching in known places
  for (const [key, place] of Object.entries(KNOWN_PLACES)) {
    if (clean.includes(key) || key.includes(clean)) {
      return place;
    }
  }

  // 3. Search Metro stations registry
  for (const [id, station] of Object.entries(stations)) {
    const sName = station.name.toLowerCase();
    const sGu = (station.nameGu || '').toLowerCase();
    const sHi = (station.nameHi || '').toLowerCase();
    if (
      sName.includes(clean) ||
      clean.includes(sName) ||
      (sGu && clean.includes(sGu)) ||
      (sHi && clean.includes(sHi))
    ) {
      return {
        name: station.name,
        coordinates: station.coordinates,
        stopId: id,
      };
    }
  }

  // 4. Search BRTS / AMTS bus stops
  for (const [id, stop] of Object.entries(allBusStops)) {
    const bName = stop.name.toLowerCase();
    if (bName.includes(clean) || clean.includes(bName)) {
      return {
        name: stop.name,
        coordinates: stop.coordinates,
        stopId: id,
      };
    }
  }

  // 5. Search popularPlaces offline index (~3500 places)
  for (const place of popularPlaces) {
    const pName = place.n.toLowerCase();
    if (pName.includes(clean) || clean.includes(pName)) {
      return {
        name: place.n,
        coordinates: place.c,
      };
    }
  }

  return null;
};

/**
 * Core Gujlish, Gujarati, Hindi & English Natural Language Transit Query Parser
 */
export const parseGujlishTransitQuery = (input: string): ParsedTransitQuery => {
  const normalized = normalizeQueryText(input);

  // 1. Language detection heuristic
  const hasGujaratiChars = /[\u0A80-\u0AFF]/.test(input);
  const hasHindiChars = /[\u0900-\u097F]/.test(input);
  let detectedLanguage: ParsedTransitQuery['detectedLanguage'] = 'en';
  if (hasGujaratiChars) detectedLanguage = 'gu';
  else if (hasHindiChars) detectedLanguage = 'hi';
  else if (
    /\b(thi|javu|che|javanu|rasto|sasto|ochhu|chalvu|jaldi|savare|vage|pahocho)\b/i.test(
      input
    )
  ) {
    detectedLanguage = 'gujlish';
  }

  // 2. Preference detection
  let preference: ParsedTransitQuery['preference'] = 'fastest';
  if (
    /\b(sasto|sasti|cheap|cheapest|kam paisa|budget|bajat|ochha paisa|kam daam|sasta)\b/i.test(
      normalized
    )
  ) {
    preference = 'cheapest';
  } else if (
    /\b(ochhu chalvu|kam paidal|less walk|kam chalna|comfort|aaram|no transfer|direct|sidhu|sidhi)\b/i.test(
      normalized
    )
  ) {
    preference = 'min_transfers';
  } else if (
    /\b(garmi|heat|ac|chhaya|dhoop|sun|cool|thandu|thandak)\b/i.test(
      normalized
    )
  ) {
    preference = 'heat_avoidance';
  } else if (
    /\b(jaldi|fast|express|quick|urgent|speed|turant|ekdum fast)\b/i.test(
      normalized
    )
  ) {
    preference = 'fastest';
  }

  // 3. Extraction Patterns for Origin & Destination
  let rawOrigin = '';
  let rawDest = '';

  // Pattern A: "A thi B" (Gujarati / Gujlish: "A થી B" or "A thi B javu che")
  const gujlishMatch =
    normalized.match(
      /(?:mane\s+)?([a-z\s]+?)\s+(?:thi|થી|se|से)\s+([a-z\s]+?)(?:\s+(?:javu|javanu|pahochvu|jana|jayen|to|sudhi|vage|che|chhe|rasto|route))/i
    ) || normalized.match(/([a-z\s]+?)\s+(?:thi|થી|se|से)\s+([a-z\s]+)/i);

  // Pattern B: "from A to B"
  const englishMatch =
    normalized.match(
      /(?:from\s+)?([a-z\s]+?)\s+(?:to|towards|sudhi)\s+([a-z\s]+)/i
    ) || normalized.match(/([a-z\s]+?)\s+to\s+([a-z\s]+)/i);

  if (gujlishMatch) {
    rawOrigin = gujlishMatch[1].trim();
    rawDest = gujlishMatch[2].trim();
  } else if (englishMatch) {
    rawOrigin = englishMatch[1].trim();
    rawDest = englishMatch[2].trim();
  }

  // Clean trailing filler words from raw extractions
  const cleanTokens = (str: string) => {
    return str
      .replace(
        /\b(javu|che|chhe|javanu|jana|hai|kaise|rasto|route|jaldi|sasto|ochhu|chalvu|metro|bus|ma|me|mein|please)\b/gi,
        ''
      )
      .trim();
  };

  rawOrigin = cleanTokens(rawOrigin);
  rawDest = cleanTokens(rawDest);

  // Resolve against geographic index
  const resolvedOrigin = resolvePlace(rawOrigin);
  const resolvedDest = resolvePlace(rawDest);

  let confidence = 0.3;
  if (resolvedOrigin && resolvedDest) confidence = 0.95;
  else if (resolvedOrigin || resolvedDest) confidence = 0.65;

  let explanation = '';
  if (resolvedOrigin && resolvedDest) {
    explanation = `Route planned from ${resolvedOrigin.name} to ${resolvedDest.name} (${preference.replace('_', ' ')}).`;
  } else if (resolvedOrigin) {
    explanation = `Origin resolved to ${resolvedOrigin.name}. Please confirm destination.`;
  } else if (resolvedDest) {
    explanation = `Destination resolved to ${resolvedDest.name}. Please confirm origin.`;
  } else {
    explanation = 'Could not resolve transit landmarks. Please select points directly on the map.';
  }

  return {
    rawQuery: input,
    originName: resolvedOrigin?.name,
    originCoords: resolvedOrigin?.coordinates,
    originStopId: resolvedOrigin?.stopId,
    destName: resolvedDest?.name,
    destCoords: resolvedDest?.coordinates,
    destStopId: resolvedDest?.stopId,
    preference,
    confidence,
    detectedLanguage,
    explanation,
  };
};

/**
 * Curated list of typical commuter Gujlish & bilingual queries for quick test chips
 */
export const SAMPLE_GUJLISH_QUERIES = [
  {
    query: 'mane Maninagar thi Thaltej javu che, ochhu chalvu',
    label: 'Maninagar થી Thaltej (ઓછું ચાલવું)',
    lang: 'Gujlish',
  },
  {
    query: 'Bopal thi Motera stadium jaldi pahochvu che',
    label: 'Bopal થી Motera (ઝડપી રસ્તો)',
    lang: 'Gujlish',
  },
  {
    query: 'Science City thi Kalupur sasto rasto',
    label: 'Science City થી Kalupur (સસ્તું)',
    lang: 'Gujlish',
  },
  {
    query: 'Airport to IIM Ahmedabad AC bus ma',
    label: 'Airport થી IIM (AC / ગરમીથી બચો)',
    lang: 'English / Guj',
  },
  {
    query: 'Kankaria lake se GIFT City metro se kaise jaye',
    label: 'Kankaria से GIFT City (मेट्रो)',
    lang: 'Hindi',
  },
];
