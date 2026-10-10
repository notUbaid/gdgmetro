// AI Trip Optimizer & Context-Aware Journey Intelligence
// Designed for PS-08: "One City, One Journey" (DevFest Gandhinagar)

import { MultimodalJourney, MultimodalLeg } from './multimodalRouter';

export type CommuterPersona = 'balanced' | 'speed' | 'budget' | 'heat_avoidance' | 'accessible_luggage';

export interface TripPersonaConfig {
  id: CommuterPersona;
  label: string;
  labelGu: string;
  labelHi: string;
  icon: string;
  description: string;
  weightTime: number;
  weightCost: number;
  weightWalk: number;
  weightTransfer: number;
  weightHeat: number;
}

export const COMMUTER_PERSONAS: Record<CommuterPersona, TripPersonaConfig> = {
  balanced: {
    id: 'balanced',
    label: 'Smart Balanced',
    labelGu: 'સ્માર્ટ સંતુલિત',
    labelHi: 'स्मार्ट संतुलित',
    icon: 'balance',
    description: 'Equally balances transit speed, cost, and comfortable transfer distances.',
    weightTime: 1.0,
    weightCost: 1.0,
    weightWalk: 1.0,
    weightTransfer: 1.2,
    weightHeat: 0.8,
  },
  speed: {
    id: 'speed',
    label: 'Express / Rapid Transit',
    labelGu: 'સુપરફાસ્ટ / એક્સપ્રેસ',
    labelHi: 'सुपरफास्ट / एक्सप्रेस',
    icon: 'zap',
    description: 'Minimizes travel time at all costs by prioritizing rapid rail & dedicated bus lanes.',
    weightTime: 2.5,
    weightCost: 0.4,
    weightWalk: 0.8,
    weightTransfer: 0.9,
    weightHeat: 0.5,
  },
  budget: {
    id: 'budget',
    label: 'Student / Budget Saver',
    labelGu: 'બજેટ ફ્રેન્ડલી (સસ્તું)',
    labelHi: 'बजट फ्रेंडली (सस्ता)',
    icon: 'wallet',
    description: 'Minimizes ticket cost by leveraging municipal feeder slabs and unified 15% discount.',
    weightTime: 0.6,
    weightCost: 2.8,
    weightWalk: 1.2,
    weightTransfer: 1.0,
    weightHeat: 0.7,
  },
  heat_avoidance: {
    id: 'heat_avoidance',
    label: 'Beat the Heat (AC Comfort)',
    labelGu: 'ગરમીથી બચો (એસી)',
    labelHi: 'गर्मी से बचें (एसी)',
    icon: 'sun',
    description: 'Minimizes exposed walking in Ahmedabad sun (45°C), maximizes air-conditioned Metro & AC BRTS.',
    weightTime: 0.9,
    weightCost: 0.6,
    weightWalk: 2.5,
    weightTransfer: 1.5,
    weightHeat: 3.0,
  },
  accessible_luggage: {
    id: 'accessible_luggage',
    label: 'Heavy Luggage / Accessible',
    labelGu: 'સામાન સાથે / સુગમ',
    labelHi: 'सामान के साथ / सुगम',
    icon: 'briefcase',
    description: 'Minimizes interchanges and footbridges. Prefers elevator-equipped metro and level BRTS boarding.',
    weightTime: 0.8,
    weightCost: 0.7,
    weightWalk: 2.2,
    weightTransfer: 2.8,
    weightHeat: 1.2,
  },
};

export interface AIJourneyAnalysis {
  journeyId: string;
  aiScore: number; // 0 to 100
  verdict: string;
  verdictGu: string;
  verdictHi: string;
  keyAdvantages: string[];
  autoRickshawComparison: {
    autoCost: number;
    moneySaved: number;
    moneySavedPercent: number;
    trafficDelayAvoidedMins: number;
  };
  heatComfortScore: number; // 0 to 10
  environmentalImpact: {
    co2SavedKg: number;
    treesEquivalent: number;
  };
  smartTip: string;
  smartTipGu: string;
  smartTipHi: string;
}

/**
 * Proper AI Evaluation Function:
 * Computes multi-objective utility scoring and detailed natural-language
 * reasoning for multi-modal journeys, tailored to commuter personas.
 */
export const evaluateJourneyWithAI = (
  journey: MultimodalJourney,
  personaKey: CommuterPersona = 'balanced',
  ambientTemperatureC: number = 38
): AIJourneyAnalysis => {
  const persona = COMMUTER_PERSONAS[personaKey] || COMMUTER_PERSONAS.balanced;

  // 1. Calculate Multi-Objective Utility Score
  // Normalized penalties:
  // - Duration penalty: 1 pt per 2 mins above 15 mins
  const timePenalty = Math.max(0, (journey.totalDurationMinutes - 15) * 0.5) * persona.weightTime;
  // - Fare penalty: 1 pt per ₹2
  const costPenalty = (journey.integratedFare / 2) * persona.weightCost;
  // - Walking penalty: 2 pts per 5 mins walk
  const walkPenalty = (journey.totalWalkingMinutes * 0.4) * persona.weightWalk;
  // - Transfer penalty: 6 pts per interchange
  const transferPenalty = (journey.transferCount * 6) * persona.weightTransfer;
  // - Heat penalty: additional penalty for walking when temperature is high (> 34°C)
  const heatFactor = Math.max(0, (ambientTemperatureC - 32) / 10);
  const heatPenalty = (journey.totalWalkingMinutes * heatFactor * 0.8) * persona.weightHeat;

  const rawScore = 100 - (timePenalty + costPenalty + walkPenalty + transferPenalty + heatPenalty);
  const aiScore = Math.max(40, Math.min(99, Math.round(rawScore)));

  // 2. Heat Comfort Score (10 is coolest, 0 is extreme outdoor exposure)
  const walkingRatio = journey.totalWalkingMinutes / Math.max(1, journey.totalDurationMinutes);
  const hasAcMetro = journey.modesUsed.includes('metro');
  const heatComfortScore = Math.max(
    2,
    Math.min(10, Math.round(10 - walkingRatio * 8 + (hasAcMetro ? 1.5 : 0)))
  );

  // 3. Auto Rickshaw Comparative Economics
  const autoCost = journey.autoRickshawEstimatedCost;
  const moneySaved = Math.max(0, autoCost - journey.integratedFare);
  const moneySavedPercent = Math.round((moneySaved / Math.max(1, autoCost)) * 100);
  // Estimate traffic delay avoided on major roads like SG Highway & Ashram Road
  const trafficDelayAvoidedMins = Math.round(journey.totalDistanceKm * 1.8);

  // 4. Tree Equivalent from CO2 savings
  const treesEquivalent = Number((journey.co2SavedKg * 0.05).toFixed(2));

  // 5. Advantages synthesis based on legs
  const keyAdvantages: string[] = [];
  if (journey.modesUsed.includes('metro')) {
    keyAdvantages.push('Grade-separated Metro bypasses peak traffic jams completely');
  }
  if (journey.modesUsed.includes('brts')) {
    keyAdvantages.push('Janmarg dedicated busway ensures uninterrupted surface travel');
  }
  if (journey.discountSaved > 0) {
    keyAdvantages.push(`Unified One-City ticketing rebate saves ₹${journey.discountSaved} instantly`);
  }
  if (journey.totalWalkingMinutes <= 8) {
    keyAdvantages.push(`Low walking strain: only ${journey.totalWalkingMinutes} minutes total on foot`);
  }
  keyAdvantages.push(`Cuts ₹${moneySaved} (${moneySavedPercent}% cheaper) compared to private auto`);

  // 6. Multilingual Verdict and Actionable Smart Tips
  let verdict = '';
  let verdictGu = '';
  let verdictHi = '';
  let smartTip = '';
  let smartTipGu = '';
  let smartTipHi = '';

  if (journey.category === 'fastest') {
    verdict = `Highly recommended for time-sensitive commutes. Saves ~${trafficDelayAvoidedMins} minutes over road gridlock.`;
    verdictGu = `સમય બચાવવા માટે શ્રેષ્ઠ વિકલ્પ. ટ્રાફિક જામ કરતાં ~${trafficDelayAvoidedMins} મિનિટ ઝડપી પહોંચાડે છે.`;
    verdictHi = `समय बचाने के लिए सबसे उत्तम विकल्प। सड़क जाम से ~${trafficDelayAvoidedMins} मिनट पहले पहुंचेगा।`;
    smartTip = 'Board train in the middle coaches for the shortest walk to interchange stairs/lifts.';
    smartTipGu = 'ઇન્ટરચેન્જ માટે ઝડપી પહોંચવા ટ્રેનના મધ્ય કોચમાં બેસો.';
    smartTipHi = 'इंटरचेंज सीढ़ियों के नजदीक उतरने के लिए ट्रेन के बीच के कोच में बैठें।';
  } else if (journey.category === 'cheapest') {
    verdict = `Maximum economical efficiency: saves ₹${moneySaved} vs auto with combined municipal transfer fares.`;
    verdictGu = `સૌથી સસ્તો વિકલ્પ: રીક્ષાની સરખામણીમાં ₹${moneySaved} ની મોટી બચત થાય છે.`;
    verdictHi = `किफायती और सही: ऑटो-रिक्शा के मुकाबले ₹${moneySaved} की बचत होगी।`;
    smartTip = 'Show your unified One-City QR ticket to AMTS conductor or scan at BRTS smart turnstiles.';
    smartTipGu = 'એએમટીએસ કંડક્ટરને સિંગલ QR ટિકિટ બતાવો અથવા બીઆરટીએસ ટર્નસ્ટાઇલ પર સ્કેન કરો.';
    smartTipHi = 'एएमटीएस कंडक्टर को सिंगल क्यूआर टिकट दिखाएं या बीआरटीएस गेट पर स्कैन करें।';
  } else {
    verdict = `Comfort-optimized route with effortless boarding and direct arterial corridor navigation.`;
    verdictGu = `ઓછા ટ્રાન્સફર અને સરળ મુસાફરી માટે શ્રેષ્ઠ આરામદાયક રસ્તો.`;
    verdictHi = `कम इंटरचेंज और आरामदायक सफर के लिए उपयुक्त रूट।`;
    smartTip = 'Stations are equipped with level platform ramps and barrier-free elevators.';
    smartTipGu = 'સ્ટેશનો પર સરળ રેમ્પ અને લિફ્ટની સુવિધા ઉપલબ્ધ છે.';
    smartTipHi = 'स्टेशनों पर व्हीलचेयर रैंप और लिफ्ट की सुविधा मौजूद है।';
  }

  return {
    journeyId: journey.id,
    aiScore,
    verdict,
    verdictGu,
    verdictHi,
    keyAdvantages,
    autoRickshawComparison: {
      autoCost,
      moneySaved,
      moneySavedPercent,
      trafficDelayAvoidedMins,
    },
    heatComfortScore,
    environmentalImpact: {
      co2SavedKg: journey.co2SavedKg,
      treesEquivalent,
    },
    smartTip,
    smartTipGu,
    smartTipHi,
  };
};
