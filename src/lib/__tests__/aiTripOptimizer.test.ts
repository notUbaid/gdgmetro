import { describe, it, expect } from 'vitest';
import {
  evaluateJourneyWithAI,
  COMMUTER_PERSONAS,
  CommuterPersona,
} from '@/lib/aiTripOptimizer';
import { MultimodalJourney } from '@/lib/multimodalRouter';

describe('AI Trip Optimizer & Context-Aware Journey Intelligence (PS-08)', () => {
  const sampleFastJourney: MultimodalJourney = {
    id: 'test-fastest',
    title: 'Fastest Multi-Modal Transit',
    category: 'fastest',
    badge: 'Express Rail + Dedicated BRTS',
    summary: 'Metro + BRTS corridor via Thaltej Interchange',
    totalDurationMinutes: 28,
    totalDistanceKm: 14.5,
    totalWalkingMinutes: 5,
    totalWalkingDistanceKm: 0.35,
    transferCount: 1,
    standaloneTotalFare: 35,
    integratedFare: 30,
    discountSaved: 5,
    autoRickshawEstimatedCost: 180,
    co2SavedKg: 1.85,
    legs: [],
    fareSplit: [],
    modesUsed: ['metro', 'brts', 'walk'],
  };

  const sampleWalkHeavyJourney: MultimodalJourney = {
    id: 'test-walk-heavy',
    title: 'Walk-Heavy Bus Transit',
    category: 'cheapest',
    badge: 'Economy Feeder',
    summary: 'AMTS Feeder with surface walking',
    totalDurationMinutes: 45,
    totalDistanceKm: 12.0,
    totalWalkingMinutes: 22,
    totalWalkingDistanceKm: 1.6,
    transferCount: 2,
    standaloneTotalFare: 20,
    integratedFare: 17,
    discountSaved: 3,
    autoRickshawEstimatedCost: 150,
    co2SavedKg: 1.5,
    legs: [],
    fareSplit: [],
    modesUsed: ['amts', 'walk'],
  };

  describe('Commuter Personas Specification', () => {
    it('defines 5 distinct commuter personas with multilingual labels', () => {
      const personaKeys: CommuterPersona[] = [
        'balanced',
        'speed',
        'budget',
        'heat_avoidance',
        'accessible_luggage',
      ];

      for (const key of personaKeys) {
        const p = COMMUTER_PERSONAS[key];
        expect(p).toBeDefined();
        expect(p.label).toBeTruthy();
        expect(p.labelGu).toBeTruthy();
        expect(p.labelHi).toBeTruthy();
        expect(p.weightTime).toBeGreaterThan(0);
        expect(p.weightCost).toBeGreaterThan(0);
        expect(p.weightWalk).toBeGreaterThan(0);
      }
    });

    it('applies higher time penalty to speed persona and higher cost penalty to budget persona', () => {
      expect(COMMUTER_PERSONAS.speed.weightTime).toBeGreaterThan(COMMUTER_PERSONAS.budget.weightTime);
      expect(COMMUTER_PERSONAS.budget.weightCost).toBeGreaterThan(COMMUTER_PERSONAS.speed.weightCost);
      expect(COMMUTER_PERSONAS.heat_avoidance.weightHeat).toBeGreaterThan(COMMUTER_PERSONAS.balanced.weightHeat);
    });
  });

  describe('Utility Scoring & Beat-the-Heat Comfort', () => {
    it('scores fast metro-backed journey higher than walk-heavy journey under balanced persona', () => {
      const evalFast = evaluateJourneyWithAI(sampleFastJourney, 'balanced', 35);
      const evalWalk = evaluateJourneyWithAI(sampleWalkHeavyJourney, 'balanced', 35);

      expect(evalFast.aiScore).toBeGreaterThan(evalWalk.aiScore);
      expect(evalFast.aiScore).toBeLessThanOrEqual(99);
      expect(evalFast.aiScore).toBeGreaterThanOrEqual(40);
    });

    it('penalizes walking substantially more in scorching heat (44°C vs 26°C)', () => {
      const evalCool = evaluateJourneyWithAI(sampleWalkHeavyJourney, 'heat_avoidance', 26);
      const evalHot = evaluateJourneyWithAI(sampleWalkHeavyJourney, 'heat_avoidance', 44);

      expect(evalCool.aiScore).toBeGreaterThan(evalHot.aiScore);
    });

    it('awards high Beat-the-Heat comfort rating to AC Metro journeys with low walking', () => {
      const evalFast = evaluateJourneyWithAI(sampleFastJourney, 'heat_avoidance', 40);
      const evalWalk = evaluateJourneyWithAI(sampleWalkHeavyJourney, 'heat_avoidance', 40);

      expect(evalFast.heatComfortScore).toBeGreaterThan(evalWalk.heatComfortScore);
      expect(evalFast.heatComfortScore).toBeGreaterThanOrEqual(7);
    });
  });

  describe('Auto-Rickshaw Comparative Economics & Multilingual Intelligence', () => {
    it('accurately computes monetary savings and traffic time saved over road auto-rickshaw', () => {
      const result = evaluateJourneyWithAI(sampleFastJourney, 'balanced');

      // Auto cost ₹180, Integrated Fare ₹30 -> ₹150 saved
      expect(result.autoRickshawComparison.autoCost).toBe(180);
      expect(result.autoRickshawComparison.moneySaved).toBe(150);
      expect(result.autoRickshawComparison.moneySavedPercent).toBe(83);
      expect(result.autoRickshawComparison.trafficDelayAvoidedMins).toBeGreaterThan(20);
    });

    it('provides coherent multilingual explanations and smart tips across English, Gujarati, and Hindi', () => {
      const result = evaluateJourneyWithAI(sampleFastJourney, 'balanced');

      // English
      expect(result.verdict).toContain('Highly recommended');
      expect(result.smartTip).toBeTruthy();

      // Gujarati
      expect(result.verdictGu).toContain('સમય બચાવવા માટે');
      expect(result.smartTipGu).toBeTruthy();

      // Hindi
      expect(result.verdictHi).toContain('समय बचाने');
      expect(result.smartTipHi).toBeTruthy();

      // Key advantages
      expect(result.keyAdvantages.length).toBeGreaterThan(2);
      expect(result.environmentalImpact.treesEquivalent).toBeGreaterThan(0);
    });
  });
});
