import { describe, it, expect } from 'vitest';
import { parseGujlishTransitQuery, resolvePlace } from '@/lib/gujlishParser';

describe('Gujlish & Natural Language Transit Query Parser (PS-08)', () => {
  describe('Geographic Landmark & Station Resolution', () => {
    it('resolves popular urban landmarks and transit hubs', () => {
      const thaltej = resolvePlace('Thaltej');
      expect(thaltej).toBeDefined();
      expect(thaltej?.name).toContain('Thaltej');
      expect(thaltej?.coordinates[0]).toBeCloseTo(23.05, 1);

      const kalupur = resolvePlace('Kalupur');
      expect(kalupur).toBeDefined();
      expect(kalupur?.name).toContain('Kalupur');

      const airport = resolvePlace('Airport');
      expect(airport).toBeDefined();
      expect(airport?.name).toContain('Airport');

      const scienceCity = resolvePlace('Science City');
      expect(scienceCity).toBeDefined();
      expect(scienceCity?.name).toContain('Science City');
    });

    it('handles colloquial names and variations (e.g. bopal, iskcon, iim, kankaria)', () => {
      expect(resolvePlace('bopal')?.name).toContain('Bopal');
      expect(resolvePlace('iskcon')?.name).toContain('Iskcon');
      expect(resolvePlace('iim')?.name).toContain('IIM');
      expect(resolvePlace('kankaria lake')?.name).toContain('Kankaria');
    });
  });

  describe('Gujlish Colloquial Transit Queries', () => {
    it('parses "mane Maninagar thi Thaltej javu che, ochhu chalvu"', () => {
      const parsed = parseGujlishTransitQuery('mane Maninagar thi Thaltej javu che, ochhu chalvu');
      expect(parsed.originName).toContain('Maninagar');
      expect(parsed.destName).toContain('Thaltej');
      expect(parsed.preference).toBe('min_transfers');
      expect(parsed.confidence).toBeGreaterThan(0.8);
      expect(parsed.detectedLanguage).toBe('gujlish');
    });

    it('parses "Bopal thi Motera stadium jaldi pahochvu che"', () => {
      const parsed = parseGujlishTransitQuery('Bopal thi Motera stadium jaldi pahochvu che');
      expect(parsed.originName).toContain('Bopal');
      expect(parsed.destName).toContain('Motera');
      expect(parsed.preference).toBe('fastest');
      expect(parsed.confidence).toBeGreaterThan(0.8);
    });

    it('parses "Science City thi Kalupur sasto rasto"', () => {
      const parsed = parseGujlishTransitQuery('Science City thi Kalupur sasto rasto');
      expect(parsed.originName).toContain('Science City');
      expect(parsed.destName).toContain('Kalupur');
      expect(parsed.preference).toBe('cheapest');
    });

    it('parses "Airport to IIM Ahmedabad AC bus ma garmi vagar"', () => {
      const parsed = parseGujlishTransitQuery('Airport to IIM Ahmedabad AC bus ma garmi vagar');
      expect(parsed.originName).toContain('Airport');
      expect(parsed.destName).toContain('IIM');
      expect(parsed.preference).toBe('heat_avoidance');
    });
  });

  describe('English & Hindi Natural Queries', () => {
    it('parses standard English: "from Thaltej to GIFT City"', () => {
      const parsed = parseGujlishTransitQuery('from Thaltej to GIFT City');
      expect(parsed.originName).toContain('Thaltej');
      expect(parsed.destName).toContain('GIFT City');
      expect(parsed.confidence).toBeGreaterThan(0.8);
    });

    it('parses Hindi: "Kankaria se Ranip kaise jaye"', () => {
      const parsed = parseGujlishTransitQuery('Kankaria se Ranip kaise jaye');
      expect(parsed.originName).toContain('Kankaria');
      expect(parsed.destName).toContain('Ranip');
      expect(parsed.confidence).toBeGreaterThan(0.8);
    });
  });

  describe('Edge Cases and Resilience', () => {
    it('handles ambiguous or unresolvable strings without throwing errors', () => {
      const parsed = parseGujlishTransitQuery('random gibberish text abc xyz');
      expect(parsed).toBeDefined();
      expect(parsed.confidence).toBeLessThan(0.7);
      expect(parsed.explanation).toBeTruthy();
    });

    it('handles single location query gracefully', () => {
      const parsed = parseGujlishTransitQuery('Thaltej');
      expect(parsed).toBeDefined();
      expect(parsed.explanation).toBeTruthy();
    });
  });
});
