import { describe, it, expect } from 'vitest';
import {
  computeMainPeriodPreset,
  computeAdvancedPeriodPreset,
  computeAbComparisonPeriodPreset,
} from './periodPresets';

describe('periodPresets', () => {
  describe('computeMainPeriodPreset', () => {
    it('should compute period of specified days ending on given date', () => {
      const result = computeMainPeriodPreset('2024-03-31', 30);
      expect(result.periodEnd).toBe('2024-03-31');
      expect(result.periodStart).toBe('2024-03-02'); // 29 days before (30 day period)
    });

    it('should compute 90 day period', () => {
      const result = computeMainPeriodPreset('2024-12-31', 90);
      expect(result.periodEnd).toBe('2024-12-31');
      expect(result.periodStart).toBe('2024-10-03'); // 89 days before
    });

    it('should compute 7 day period', () => {
      const result = computeMainPeriodPreset('2024-06-15', 7);
      expect(result.periodEnd).toBe('2024-06-15');
      expect(result.periodStart).toBe('2024-06-09'); // 6 days before
    });

    it('should handle invalid date by using current date', () => {
      const result = computeMainPeriodPreset('invalid-date', 30);
      expect(result.periodStart).toBeTruthy();
      expect(result.periodEnd).toBeTruthy();
    });

    it('should handle single day period', () => {
      const result = computeMainPeriodPreset('2024-06-15', 1);
      expect(result.periodStart).toBe('2024-06-15');
      expect(result.periodEnd).toBe('2024-06-15');
    });
  });

  describe('computeAdvancedPeriodPreset', () => {
    const basePeriods = [
      { periodStart: '2024-01-01', periodEnd: '2024-03-31' },
      { periodStart: '2024-04-01', periodEnd: '2024-06-30' },
      { periodStart: '2024-07-01', periodEnd: '2024-09-30' },
    ];

    it('should update specified period with new duration', () => {
      const result = computeAdvancedPeriodPreset(basePeriods, 1, 60, '2024-01-01');
      expect(result[0]).toEqual(basePeriods[0]); // First period unchanged
      expect(result[1].periodStart).toBe('2024-04-01');
      expect(result[1].periodEnd).toBe('2024-05-30'); // 59 days after start
      expect(result[2]).toEqual(basePeriods[2]); // Third period unchanged
    });

    it('should use fallback start date when period start is invalid', () => {
      const periodsWithInvalid = [{ periodStart: 'invalid', periodEnd: '2024-03-31' }];
      const result = computeAdvancedPeriodPreset(periodsWithInvalid, 0, 30, '2024-02-01');
      expect(result[0].periodStart).toBe('2024-02-01');
      expect(result[0].periodEnd).toBe('2024-03-01'); // 29 days after
    });

    it('should use current date when both period start and fallback are invalid', () => {
      const periodsWithInvalid = [{ periodStart: 'invalid-date', periodEnd: '2024-03-31' }];
      const result = computeAdvancedPeriodPreset(periodsWithInvalid, 0, 30, 'invalid-fallback');
      // Should use current date as ultimate fallback
      expect(result[0].periodStart).toBeTruthy();
      expect(result[0].periodEnd).toBeTruthy();
      // Verify it's a valid ISO date format
      expect(result[0].periodStart).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(result[0].periodEnd).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should return original array when index out of bounds', () => {
      const result = computeAdvancedPeriodPreset(basePeriods, 99, 30, '2024-01-01');
      expect(result).toEqual(basePeriods);
    });

    it('should handle first period update', () => {
      const result = computeAdvancedPeriodPreset(basePeriods, 0, 45, '2024-01-01');
      expect(result[0].periodStart).toBe('2024-01-01');
      expect(result[0].periodEnd).toBe('2024-02-14'); // 44 days after
      expect(result[1]).toEqual(basePeriods[1]);
      expect(result[2]).toEqual(basePeriods[2]);
    });

    it('should handle last period update', () => {
      const result = computeAdvancedPeriodPreset(basePeriods, 2, 90, '2024-01-01');
      expect(result[0]).toEqual(basePeriods[0]);
      expect(result[1]).toEqual(basePeriods[1]);
      expect(result[2].periodStart).toBe('2024-07-01');
      expect(result[2].periodEnd).toBe('2024-09-28'); // 89 days after
    });
  });

  describe('computeAbComparisonPeriodPreset', () => {
    it('should compute period of specified days ending on given date', () => {
      const result = computeAbComparisonPeriodPreset('2024-06-30', 90);
      expect(result.periodEnd).toBe('2024-06-30');
      expect(result.periodStart).toBe('2024-04-02'); // 89 days before
    });

    it('should compute 30 day period', () => {
      const result = computeAbComparisonPeriodPreset('2024-12-31', 30);
      expect(result.periodEnd).toBe('2024-12-31');
      expect(result.periodStart).toBe('2024-12-02'); // 29 days before
    });

    it('should compute 180 day period', () => {
      const result = computeAbComparisonPeriodPreset('2024-06-15', 180);
      expect(result.periodEnd).toBe('2024-06-15');
      expect(result.periodStart).toBe('2023-12-19'); // 179 days before
    });

    it('should handle invalid date by using current date', () => {
      const result = computeAbComparisonPeriodPreset('invalid-date', 30);
      expect(result.periodStart).toBeTruthy();
      expect(result.periodEnd).toBeTruthy();
    });
  });
});
