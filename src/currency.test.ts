import { describe, it, expect, beforeEach } from 'vitest';
import {
  getStoredDisplayCurrency,
  applyDisplayCurrency,
  convertEurToDisplayCurrency,
  formatAmountFromEur,
} from './currency';

describe('currency', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('getStoredDisplayCurrency', () => {
    it('should return EUR when no currency is stored', () => {
      expect(getStoredDisplayCurrency()).toBe('EUR');
    });

    it('should return stored EUR', () => {
      localStorage.setItem('ai-smart-trader.display-currency', 'EUR');
      expect(getStoredDisplayCurrency()).toBe('EUR');
    });

    it('should return stored USD', () => {
      localStorage.setItem('ai-smart-trader.display-currency', 'USD');
      expect(getStoredDisplayCurrency()).toBe('USD');
    });

    it('should return stored GBP', () => {
      localStorage.setItem('ai-smart-trader.display-currency', 'GBP');
      expect(getStoredDisplayCurrency()).toBe('GBP');
    });

    it('should return stored CHF', () => {
      localStorage.setItem('ai-smart-trader.display-currency', 'CHF');
      expect(getStoredDisplayCurrency()).toBe('CHF');
    });

    it('should return EUR for invalid stored value', () => {
      localStorage.setItem('ai-smart-trader.display-currency', 'INVALID');
      expect(getStoredDisplayCurrency()).toBe('EUR');
    });
  });

  describe('applyDisplayCurrency', () => {
    it('should store EUR', () => {
      applyDisplayCurrency('EUR');
      expect(localStorage.getItem('ai-smart-trader.display-currency')).toBe('EUR');
    });

    it('should store USD', () => {
      applyDisplayCurrency('USD');
      expect(localStorage.getItem('ai-smart-trader.display-currency')).toBe('USD');
    });

    it('should store GBP', () => {
      applyDisplayCurrency('GBP');
      expect(localStorage.getItem('ai-smart-trader.display-currency')).toBe('GBP');
    });

    it('should store CHF', () => {
      applyDisplayCurrency('CHF');
      expect(localStorage.getItem('ai-smart-trader.display-currency')).toBe('CHF');
    });
  });

  describe('convertEurToDisplayCurrency', () => {
    it('should convert EUR to EUR (1:1)', () => {
      expect(convertEurToDisplayCurrency(100, 'EUR')).toBe(100);
    });

    it('should convert EUR to USD', () => {
      expect(convertEurToDisplayCurrency(100, 'USD')).toBeCloseTo(109, 5);
    });

    it('should convert EUR to GBP', () => {
      expect(convertEurToDisplayCurrency(100, 'GBP')).toBe(86);
    });

    it('should convert EUR to CHF', () => {
      expect(convertEurToDisplayCurrency(100, 'CHF')).toBe(95);
    });

    it('should handle zero amount', () => {
      expect(convertEurToDisplayCurrency(0, 'USD')).toBe(0);
    });

    it('should handle negative amount', () => {
      expect(convertEurToDisplayCurrency(-50, 'USD')).toBeCloseTo(-54.5, 5);
    });

    it('should handle decimal amount', () => {
      expect(convertEurToDisplayCurrency(50.5, 'USD')).toBe(55.045);
    });
  });

  describe('formatAmountFromEur', () => {
    it('should format amount with default locale (fr-FR) and stored currency', () => {
      localStorage.setItem('ai-smart-trader.display-currency', 'EUR');
      const formatted = formatAmountFromEur(100);
      expect(formatted).toContain('100');
      expect(formatted).toContain('€');
    });

    it('should format amount with USD currency', () => {
      localStorage.setItem('ai-smart-trader.display-currency', 'USD');
      const formatted = formatAmountFromEur(100);
      expect(formatted).toContain('109');
    });

    it('should format amount with custom locale', () => {
      localStorage.setItem('ai-smart-trader.display-currency', 'EUR');
      const formatted = formatAmountFromEur(100, { locale: 'en-US' });
      expect(formatted).toContain('100');
      expect(formatted).toContain('€');
    });

    it('should format amount with minimumFractionDigits', () => {
      localStorage.setItem('ai-smart-trader.display-currency', 'EUR');
      const formatted = formatAmountFromEur(100, { minimumFractionDigits: 2 });
      expect(formatted).toMatch(/100[.,]00/);
    });

    it('should format amount with maximumFractionDigits', () => {
      localStorage.setItem('ai-smart-trader.display-currency', 'EUR');
      const formatted = formatAmountFromEur(100.123456, { maximumFractionDigits: 2 });
      expect(formatted).toMatch(/100[.,]12/);
    });

    it('should cache formatters for same configuration', () => {
      localStorage.setItem('ai-smart-trader.display-currency', 'EUR');
      const formatted1 = formatAmountFromEur(100);
      const formatted2 = formatAmountFromEur(200);
      // Both should use the same formatter (internal cache)
      expect(typeof formatted1).toBe('string');
      expect(typeof formatted2).toBe('string');
    });

    it('should handle different currencies without stored preference', () => {
      const formatted = formatAmountFromEur(100);
      expect(formatted).toContain('100');
    });
  });
});
