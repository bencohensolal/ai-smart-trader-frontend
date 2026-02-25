import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  resolveDefaultPeriodStart,
  resolveDefaultPeriodEnd,
  buildDefaultAdvancedPeriods,
} from './datePresets';

describe('datePresets', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('resolveDefaultPeriodStart', () => {
    it('should return date 6 months ago', () => {
      vi.setSystemTime(new Date('2024-06-15T12:00:00Z'));
      const result = resolveDefaultPeriodStart();
      expect(result).toBe('2023-12-15');
    });

    it('should handle month boundaries', () => {
      vi.setSystemTime(new Date('2024-03-31T12:00:00Z'));
      const result = resolveDefaultPeriodStart();
      // 6 months before March 31 is September 30 (or October 1 depending on implementation)
      expect(result).toMatch(/2023-(09|10)-/);
    });

    it('should handle year boundaries', () => {
      vi.setSystemTime(new Date('2024-01-15T12:00:00Z'));
      const result = resolveDefaultPeriodStart();
      expect(result).toBe('2023-07-15');
    });
  });

  describe('resolveDefaultPeriodEnd', () => {
    it('should return today in ISO format', () => {
      vi.setSystemTime(new Date('2024-06-15T12:00:00Z'));
      const result = resolveDefaultPeriodEnd();
      expect(result).toBe('2024-06-15');
    });

    it('should handle different dates', () => {
      vi.setSystemTime(new Date('2024-12-25T23:59:59Z'));
      const result = resolveDefaultPeriodEnd();
      expect(result).toBe('2024-12-25');
    });
  });

  describe('buildDefaultAdvancedPeriods', () => {
    it('should return 3 periods', () => {
      vi.setSystemTime(new Date('2024-06-15T12:00:00Z'));
      const periods = buildDefaultAdvancedPeriods();
      expect(periods).toHaveLength(3);
    });

    it('should create non-overlapping sequential periods', () => {
      vi.setSystemTime(new Date('2024-06-15T12:00:00Z'));
      const periods = buildDefaultAdvancedPeriods();

      // Verify each period has start and end
      periods.forEach((period) => {
        expect(period.periodStart).toBeTruthy();
        expect(period.periodEnd).toBeTruthy();
        expect(period.periodStart < period.periodEnd).toBe(true);
      });

      // Verify periods are sequential (end of period N should be close to start of period N+1)
      for (let i = 0; i < periods.length - 1; i++) {
        const currentEnd = new Date(periods[i].periodEnd);
        const nextStart = new Date(periods[i + 1].periodStart);
        const daysDiff = Math.abs(
          (nextStart.getTime() - currentEnd.getTime()) / (1000 * 60 * 60 * 24),
        );
        expect(daysDiff).toBeLessThan(2); // Should be 1 day apart
      }
    });

    it('should create periods going back in time', () => {
      vi.setSystemTime(new Date('2024-06-15T12:00:00Z'));
      const periods = buildDefaultAdvancedPeriods();

      // First period should be oldest
      const firstPeriodStart = new Date(periods[0].periodStart);
      const lastPeriodEnd = new Date(periods[2].periodEnd);

      expect(firstPeriodStart < lastPeriodEnd).toBe(true);
    });
  });
});
