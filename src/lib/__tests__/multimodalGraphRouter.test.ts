import { describe, it, expect } from 'vitest';
import {
  buildMultimodalGraph,
  solveDijkstraPath,
  solveParetoMultimodalPaths,
} from '@/lib/multimodalGraphRouter';

describe('Multi-Modal Dynamic Graph Solver (PS-08)', () => {
  describe('Graph Construction & Adjacency', () => {
    it('builds a unified network graph containing Metro, BRTS, and AMTS nodes', () => {
      const { nodes, adjacency } = buildMultimodalGraph();
      expect(nodes.size).toBeGreaterThanOrEqual(100);
      expect(adjacency.size).toBeGreaterThanOrEqual(100);

      // Verify Metro node
      const thaltej = nodes.get('thaltej');
      expect(thaltej).toBeDefined();
      expect(thaltej?.mode).toBe('metro');

      // Verify BRTS node
      const ranipBrts = nodes.get('brts_ranip');
      expect(ranipBrts).toBeDefined();
      expect(ranipBrts?.mode).toBe('brts');

      // Verify AMTS node
      const bopalAmts = nodes.get('amts_bopal_south');
      expect(bopalAmts).toBeDefined();
      expect(bopalAmts?.mode).toBe('amts');
    });

    it('contains explicit footpath interchange edges between neighboring transit modes', () => {
      const { adjacency } = buildMultimodalGraph();
      const ranipEdges = adjacency.get('ranip') || [];

      // Ranip Metro should have a direct walking edge to Ranip BRTS
      const walkToBrts = ranipEdges.find(
        (e) => e.toId === 'brts_ranip' && e.mode === 'walk'
      );
      expect(walkToBrts).toBeDefined();
      expect(walkToBrts?.distanceKm).toBeLessThanOrEqual(0.1);
      expect(walkToBrts?.durationMinutes).toBeLessThanOrEqual(2);
    });
  });

  describe('Dijkstra Shortest Path Search', () => {
    it('solves a path across the Metro Blue line between Thaltej and Kalupur', () => {
      const result = solveDijkstraPath('thaltej', 'kalupur', {
        timeWeight: 1,
        fareWeight: 0,
        transferPenaltyMinutes: 0,
      });

      expect(result).not.toBeNull();
      expect(result!.legs.length).toBeGreaterThanOrEqual(1);
      expect(result!.totalDistanceKm).toBeGreaterThan(5);
      expect(result!.totalDurationMinutes).toBeGreaterThan(15);
      expect(result!.totalFare).toBeGreaterThan(0);

      // Should contain metro leg
      const metroLeg = result!.legs.find((l) => l.mode === 'metro');
      expect(metroLeg).toBeDefined();
      expect(metroLeg?.fromName).toContain('Thaltej');
      expect(metroLeg?.toName).toContain('Kalupur');
      // Intermediate stops should be populated
      expect(metroLeg?.intermediateStops.length).toBeGreaterThan(5);
    });

    it('solves a multi-modal path connecting AMTS Feeder to Janmarg BRTS', () => {
      // From South Bopal AMTS to Geeta Mandir BRTS
      const result = solveDijkstraPath('amts_bopal_south', 'brts_geeta_mandir', {
        timeWeight: 1,
        fareWeight: 1,
        transferPenaltyMinutes: 2,
      });

      expect(result).not.toBeNull();
      expect(result!.legs.length).toBeGreaterThanOrEqual(1);
      expect(result!.totalDistanceKm).toBeGreaterThan(8);
      expect(result!.totalDurationMinutes).toBeGreaterThan(20);
    });
  });

  describe('Pareto-Optimal Solutions (Fastest, Cheapest, Min Transfers)', () => {
    it('produces 3 Pareto variants for cross-city journey', () => {
      const { fastest, cheapest, minTransfers } = solveParetoMultimodalPaths(
        'amts_science_city',
        'brts_iscon_cross_road'
      );

      expect(fastest).not.toBeNull();
      expect(cheapest).not.toBeNull();
      expect(minTransfers).not.toBeNull();

      expect(fastest!.totalDurationMinutes).toBeGreaterThan(0);
      expect(cheapest!.totalFare).toBeGreaterThan(0);
      expect(minTransfers!.transferCount).toBeLessThanOrEqual(fastest!.transferCount + 1);
    });
  });
});
