import { describe, it, expect } from 'vitest';
import {
  calculateBrtsFare,
  calculateAmtsFare,
  calculateWalkMinutes,
  calculateOperatorFareSplit,
  detectTransferDeserts,
  simulateAuthoritySettlement,
  generateAuthoritySettlementCsv,
  planMultimodalJourney,
  getAllUnifiedStops,
  findNearestTransitStops,
  MultimodalLeg,
} from '@/lib/multimodalRouter';

describe('Multi-Modal Transit Router & Fare Engine (PS-08)', () => {
  describe('Bus Fare Slabs (AMC 2023 Revision in ₹5 Steps)', () => {
    it('calculates BRTS fares matching official stage slabs up to ₹30', () => {
      expect(calculateBrtsFare(1.5)).toBe(5);
      expect(calculateBrtsFare(3.0)).toBe(5);
      expect(calculateBrtsFare(4.2)).toBe(10);
      expect(calculateBrtsFare(6.0)).toBe(10);
      expect(calculateBrtsFare(8.5)).toBe(15);
      expect(calculateBrtsFare(10.0)).toBe(15);
      expect(calculateBrtsFare(13.2)).toBe(20);
      expect(calculateBrtsFare(15.0)).toBe(20);
      expect(calculateBrtsFare(18.0)).toBe(25);
      expect(calculateBrtsFare(20.0)).toBe(25);
      expect(calculateBrtsFare(24.5)).toBe(30);
    });

    it('calculates AMTS feeder bus fares matching official ₹5 step slabs', () => {
      expect(calculateAmtsFare(2.0)).toBe(5);
      expect(calculateAmtsFare(5.5)).toBe(10);
      expect(calculateAmtsFare(9.0)).toBe(15);
      expect(calculateAmtsFare(14.0)).toBe(20);
      expect(calculateAmtsFare(19.0)).toBe(25);
      expect(calculateAmtsFare(28.0)).toBe(30);
    });

    it('calculates walking times at standard pedestrian speed (4.5 km/h)', () => {
      // 0.3 km at 4.5 km/h = 4 minutes
      expect(calculateWalkMinutes(0.3)).toBe(4);
      // Minimum is 1 minute
      expect(calculateWalkMinutes(0.01)).toBe(1);
      // 1.5 km = 20 minutes
      expect(calculateWalkMinutes(1.5)).toBe(20);
    });
  });

  describe('Hare-Niemeyer Exact-Paise Fare Splitting & PPP Clearinghouse', () => {
    const mockMultiLegs: MultimodalLeg[] = [
      {
        id: 'leg-1',
        mode: 'amts',
        color: '#2563EB',
        fromId: 'amts_sc_approach',
        fromName: 'Science City Approach AMTS',
        fromCoords: [23.0782, 72.5025],
        toId: 'brts_science_city',
        toName: 'Science City BRTS',
        toCoords: [23.0725, 72.5165],
        distanceKm: 2.1,
        durationMinutes: 8,
        fare: 5,
        intermediateStops: [],
        instruction: 'AMTS feeder',
        instructionGu: 'AMTS ફીડર',
        instructionHi: 'AMTS फीडर',
      },
      {
        id: 'leg-2',
        mode: 'brts',
        color: '#F97316',
        fromId: 'brts_science_city',
        fromName: 'Science City BRTS',
        fromCoords: [23.0725, 72.5165],
        toId: 'brts_sola_cross_road',
        toName: 'Sola Cross Road BRTS',
        toCoords: [23.0615, 72.5275],
        distanceKm: 3.4,
        durationMinutes: 9,
        fare: 10,
        intermediateStops: [],
        instruction: 'Janmarg BRTS',
        instructionGu: 'જનમાર્ગ BRTS',
        instructionHi: 'जनमार्ग BRTS',
      },
      {
        id: 'leg-3',
        mode: 'walk',
        color: '#64748B',
        fromId: 'brts_sola_cross_road',
        fromName: 'Sola Cross Road BRTS',
        fromCoords: [23.0615, 72.5275],
        toId: 'thaltej',
        toName: 'Thaltej Metro Station',
        toCoords: [23.0505, 72.5166],
        distanceKm: 0.28,
        durationMinutes: 4,
        fare: 0,
        intermediateStops: [],
        instruction: 'Transfer Walkway',
        instructionGu: 'વૉકિંગ ટ્રાન્સફર',
        instructionHi: 'वॉकिंग ट्रांसफर',
      },
      {
        id: 'leg-4',
        mode: 'metro',
        color: '#10B981',
        fromId: 'thaltej',
        fromName: 'Thaltej Metro Station',
        fromCoords: [23.0505, 72.5166],
        toId: 'kalupur',
        toName: 'Kalupur Railway Station Metro',
        toCoords: [23.0298, 72.6006],
        distanceKm: 12.8,
        durationMinutes: 24,
        fare: 25,
        intermediateStops: [],
        instruction: 'Gujarat Metro Rail',
        instructionGu: 'ગુજરાત મેટ્રો રેલ',
        instructionHi: 'गुजरात मेट्रो रेल',
      },
    ];

    it('divides fare with zero remaining discrepancy using Hare-Niemeyer largest-remainder method', () => {
      const integratedFare = 34; // 15% discount on ₹40 standalone
      const split = calculateOperatorFareSplit(mockMultiLegs, integratedFare, 'fare_share');

      // Operator split must have 4 entries: GMRC, Janmarg BRTS, AMTS, and PPP Clearinghouse Reserve
      expect(split.length).toBe(4);

      // Sum of settled shares in Rupees must strictly equal integratedFare
      const sumShares = split.reduce((acc, curr) => acc + curr.settledShare, 0);
      expect(sumShares).toBe(integratedFare);

      // Total percentage must sum to 100%
      const totalPct = split.reduce((acc, curr) => acc + curr.percentage, 0);
      expect(totalPct).toBeCloseTo(100, 0);

      // 5% clearinghouse reserve fee must be allocated
      const pppReserve = split.find((s) => s.operator.includes('Clearinghouse'));
      expect(pppReserve).toBeDefined();
      expect(pppReserve!.settledShare).toBeGreaterThanOrEqual(1);

      // Base boarding gate floor: each transit provider must receive at least ₹2
      const transitOps = split.filter((s) => !s.operator.includes('Clearinghouse'));
      for (const op of transitOps) {
        expect(op.settledShare).toBeGreaterThanOrEqual(2);
      }
    });

    it('supports Passenger-Km (PKM) proportional allocation method', () => {
      const integratedFare = 30;
      const split = calculateOperatorFareSplit(mockMultiLegs, integratedFare, 'pkm');

      const sumShares = split.reduce((acc, curr) => acc + curr.settledShare, 0);
      expect(sumShares).toBe(integratedFare);

      // Metro had 12.8 km out of ~18.3 km, so GMRC must receive highest share
      const gmrc = split.find((s) => s.operator.includes('Metro'));
      const amts = split.find((s) => s.operator.includes('AMTS'));
      expect(gmrc!.settledShare).toBeGreaterThan(amts!.settledShare);
    });
  });

  describe('Authority Console & Network Gap Audits', () => {
    it('detects transfer deserts across the 53 metro stations', () => {
      const deserts = detectTransferDeserts();
      expect(deserts.length).toBeGreaterThan(0);

      // Verify structure of transfer desert report
      const firstDesert = deserts[0];
      expect(firstDesert).toHaveProperty('stationId');
      expect(firstDesert).toHaveProperty('stationName');
      expect(firstDesert).toHaveProperty('nearestBusDistanceMeters');
      expect(firstDesert).toHaveProperty('nearestBusStopName');
      expect(firstDesert).toHaveProperty('suggestedFeeder');

      // Deserts must be sorted descending by distance
      for (let i = 0; i < deserts.length - 1; i++) {
        expect(deserts[i].nearestBusDistanceMeters).toBeGreaterThanOrEqual(
          deserts[i + 1].nearestBusDistanceMeters
        );
      }
    });

    it('simulates 5,000 trips settlement for authority revenue planning', () => {
      const sim = simulateAuthoritySettlement(15, 5000);
      expect(sim.sampleTripsCount).toBe(5000);
      expect(sim.rebatePercent).toBe(15);
      expect(sim.statusQuoTotalRevenue).toBeGreaterThan(0);
      expect(sim.integratedTotalRevenue).toBeGreaterThan(0);
      expect(sim.operatorRevenues.clearingReserve).toBeGreaterThan(0);

      // Break-even formula validation: r / (1 - r)
      // At 15% discount (r = 0.15), required ridership uplift is 0.15 / 0.85 = ~17.65%
      expect(sim.requiredUpliftPercent).toBeCloseTo(17.6, 1);
    });

    it('exports structured CSV audit report for authority review', () => {
      const sim = simulateAuthoritySettlement(15, 5000);
      const deserts = detectTransferDeserts();
      const csv = generateAuthoritySettlementCsv(sim, deserts);

      expect(csv).toContain('EK SAFAR (એક સફર) - AHMEDABAD MULTIMODAL UNIFIED SETTLEMENT AUDIT REPORT');
      expect(csv).toContain('5000');
      expect(csv).toContain('15%');
      expect(csv).toContain('Gujarat Metro Rail Corp (GMRC)');
      expect(csv).toContain('Janmarg BRTS');
      expect(csv).toContain('AMTS (Municipal City Bus)');
      expect(csv).toContain('PPP Smart Clearinghouse Reserve');
      expect(csv).toContain('FIRST & LAST MILE TRANSFER DESERT AUDIT');
    });
  });

  describe('End-to-End Multimodal Journey Planning (A to B on Map)', () => {
    it('generates 3 Pareto-optimal journeys (Fastest, Cheapest, Min Transfers) for a long cross-city trip', () => {
      // Science City (West) to Airport Circle (North-East)
      const origin: [number, number] = [23.078, 72.502];
      const destination: [number, number] = [23.073, 72.626];

      const journeys = planMultimodalJourney({
        originCoords: origin,
        originName: 'Science City',
        destCoords: destination,
        destName: 'Airport Circle',
      });

      expect(journeys.length).toBe(3);
      expect(journeys[0].category).toBe('fastest');
      expect(journeys[1].category).toBe('cheapest');
      expect(journeys[2].category).toBe('min_transfers');

      for (const journey of journeys) {
        expect(journey.legs.length).toBeGreaterThanOrEqual(1);
        expect(journey.totalDurationMinutes).toBeGreaterThan(0);
        expect(journey.totalDistanceKm).toBeGreaterThan(0);
        expect(journey.integratedFare).toBeLessThanOrEqual(journey.standaloneTotalFare);
        expect(journey.discountSaved).toBeGreaterThanOrEqual(0);
        expect(journey.autoRickshawEstimatedCost).toBeGreaterThan(journey.integratedFare);
        expect(journey.co2SavedKg).toBeGreaterThan(0);
      }
    });

    it('correctly clusters stops into unified multimodal directory', () => {
      const stops = getAllUnifiedStops();
      expect(Object.keys(stops).length).toBeGreaterThan(70);

      const nearest = findNearestTransitStops(23.0505, 72.5166, 3);
      expect(nearest.length).toBe(3);
      expect(nearest[0].stop.name).toContain('Thaltej');
    });
  });
});
