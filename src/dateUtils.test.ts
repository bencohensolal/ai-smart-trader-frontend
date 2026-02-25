import { describe, it, expect } from 'vitest';
import { parseIsoDate, formatIsoDate, shiftDateDays } from './dateUtils';

describe('dateUtils', () => {
  describe('parseIsoDate', () => {
    it('should parse valid ISO date', () => {
      const result = parseIsoDate('2024-03-15');
      expect(result).toBeInstanceOf(Date);
      expect(result?.getFullYear()).toBe(2024);
      expect(result?.getMonth()).toBe(2); // March is month 2 (0-indexed)
      expect(result?.getDate()).toBe(15);
    });

    it('should parse date with leading zeros', () => {
      const result = parseIsoDate('2024-01-05');
      expect(result).toBeInstanceOf(Date);
      expect(result?.getMonth()).toBe(0);
      expect(result?.getDate()).toBe(5);
    });

    it('should handle trimmed whitespace', () => {
      const result = parseIsoDate('  2024-03-15  ');
      expect(result).toBeInstanceOf(Date);
      expect(result?.getFullYear()).toBe(2024);
    });

    it('should return null for invalid format', () => {
      expect(parseIsoDate('2024/03/15')).toBeNull();
      expect(parseIsoDate('15-03-2024')).toBeNull();
      expect(parseIsoDate('2024-3-15')).toBeNull();
      expect(parseIsoDate('invalid')).toBeNull();
      expect(parseIsoDate('')).toBeNull();
    });

    it('should return null for invalid date', () => {
      expect(parseIsoDate('2024-02-30')).toBeNull(); // February doesn't have 30 days
      expect(parseIsoDate('2024-13-01')).toBeNull(); // Month 13 doesn't exist
      expect(parseIsoDate('2024-00-01')).toBeNull(); // Month 0 doesn't exist
    });

    it('should handle leap year correctly', () => {
      const leapYear = parseIsoDate('2024-02-29');
      expect(leapYear).toBeInstanceOf(Date);
      expect(leapYear?.getDate()).toBe(29);

      const nonLeapYear = parseIsoDate('2023-02-29');
      expect(nonLeapYear).toBeNull();
    });

    it('should return null for out of range dates', () => {
      expect(parseIsoDate('2024-04-31')).toBeNull(); // April has only 30 days
    });
  });

  describe('formatIsoDate', () => {
    it('should format date to ISO string', () => {
      const date = new Date(2024, 2, 15, 12, 0, 0, 0); // March 15, 2024
      expect(formatIsoDate(date)).toBe('2024-03-15');
    });

    it('should add leading zeros to month', () => {
      const date = new Date(2024, 0, 15, 12, 0, 0, 0); // January 15, 2024
      expect(formatIsoDate(date)).toBe('2024-01-15');
    });

    it('should add leading zeros to day', () => {
      const date = new Date(2024, 2, 5, 12, 0, 0, 0); // March 5, 2024
      expect(formatIsoDate(date)).toBe('2024-03-05');
    });

    it('should handle end of year', () => {
      const date = new Date(2024, 11, 31, 12, 0, 0, 0); // December 31, 2024
      expect(formatIsoDate(date)).toBe('2024-12-31');
    });

    it('should handle beginning of year', () => {
      const date = new Date(2024, 0, 1, 12, 0, 0, 0); // January 1, 2024
      expect(formatIsoDate(date)).toBe('2024-01-01');
    });
  });

  describe('shiftDateDays', () => {
    it('should shift date forward by positive days', () => {
      const date = new Date(2024, 2, 15, 12, 0, 0, 0); // March 15, 2024
      const shifted = shiftDateDays(date, 10);
      expect(shifted.getFullYear()).toBe(2024);
      expect(shifted.getMonth()).toBe(2);
      expect(shifted.getDate()).toBe(25);
    });

    it('should shift date backward by negative days', () => {
      const date = new Date(2024, 2, 15, 12, 0, 0, 0); // March 15, 2024
      const shifted = shiftDateDays(date, -10);
      expect(shifted.getFullYear()).toBe(2024);
      expect(shifted.getMonth()).toBe(2);
      expect(shifted.getDate()).toBe(5);
    });

    it('should handle month boundaries forward', () => {
      const date = new Date(2024, 2, 28, 12, 0, 0, 0); // March 28, 2024
      const shifted = shiftDateDays(date, 5);
      expect(shifted.getFullYear()).toBe(2024);
      expect(shifted.getMonth()).toBe(3); // April
      expect(shifted.getDate()).toBe(2);
    });

    it('should handle month boundaries backward', () => {
      const date = new Date(2024, 3, 2, 12, 0, 0, 0); // April 2, 2024
      const shifted = shiftDateDays(date, -5);
      expect(shifted.getFullYear()).toBe(2024);
      expect(shifted.getMonth()).toBe(2); // March
      expect(shifted.getDate()).toBe(28);
    });

    it('should handle year boundaries forward', () => {
      const date = new Date(2024, 11, 28, 12, 0, 0, 0); // December 28, 2024
      const shifted = shiftDateDays(date, 5);
      expect(shifted.getFullYear()).toBe(2025);
      expect(shifted.getMonth()).toBe(0); // January
      expect(shifted.getDate()).toBe(2);
    });

    it('should handle year boundaries backward', () => {
      const date = new Date(2024, 0, 2, 12, 0, 0, 0); // January 2, 2024
      const shifted = shiftDateDays(date, -5);
      expect(shifted.getFullYear()).toBe(2023);
      expect(shifted.getMonth()).toBe(11); // December
      expect(shifted.getDate()).toBe(28);
    });

    it('should handle zero days shift', () => {
      const date = new Date(2024, 2, 15, 12, 0, 0, 0); // March 15, 2024
      const shifted = shiftDateDays(date, 0);
      expect(shifted.getFullYear()).toBe(2024);
      expect(shifted.getMonth()).toBe(2);
      expect(shifted.getDate()).toBe(15);
    });

    it('should set time to noon', () => {
      const date = new Date(2024, 2, 15, 8, 30, 45, 123);
      const shifted = shiftDateDays(date, 1);
      expect(shifted.getHours()).toBe(12);
      expect(shifted.getMinutes()).toBe(0);
      expect(shifted.getSeconds()).toBe(0);
      expect(shifted.getMilliseconds()).toBe(0);
    });
  });
});
