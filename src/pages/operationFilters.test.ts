import { describe, it, expect } from 'vitest';
import {
  normalizeOperationSideFilter,
  normalizeOperationOutcomeFilter,
  matchesOperationFilters,
  buildOperationFiltersQueryString,
} from './operationFilters';

describe('operationFilters', () => {
  describe('normalizeOperationSideFilter', () => {
    it('should return "buy" for "buy"', () => {
      expect(normalizeOperationSideFilter('buy')).toBe('buy');
    });

    it('should return "sell" for "sell"', () => {
      expect(normalizeOperationSideFilter('sell')).toBe('sell');
    });

    it('should return "all" for "all"', () => {
      expect(normalizeOperationSideFilter('all')).toBe('all');
    });

    it('should return "all" for null', () => {
      expect(normalizeOperationSideFilter(null)).toBe('all');
    });

    it('should return "all" for undefined', () => {
      expect(normalizeOperationSideFilter(undefined)).toBe('all');
    });

    it('should return "all" for invalid value', () => {
      expect(normalizeOperationSideFilter('invalid')).toBe('all');
    });
  });

  describe('normalizeOperationOutcomeFilter', () => {
    it('should return "successful" for "successful"', () => {
      expect(normalizeOperationOutcomeFilter('successful')).toBe('successful');
    });

    it('should return "failed" for "failed"', () => {
      expect(normalizeOperationOutcomeFilter('failed')).toBe('failed');
    });

    it('should return "all" for "all"', () => {
      expect(normalizeOperationOutcomeFilter('all')).toBe('all');
    });

    it('should return "successful" for null', () => {
      expect(normalizeOperationOutcomeFilter(null)).toBe('successful');
    });

    it('should return "successful" for undefined', () => {
      expect(normalizeOperationOutcomeFilter(undefined)).toBe('successful');
    });

    it('should return "successful" for invalid value', () => {
      expect(normalizeOperationOutcomeFilter('invalid')).toBe('successful');
    });
  });

  describe('matchesOperationFilters', () => {
    it('should match operation with all filters', () => {
      const operation = { side: 'BUY' as const, status: 'FILLED' as const };
      const result = matchesOperationFilters(operation, { side: 'all', outcome: 'all' });
      expect(result).toBe(true);
    });

    it('should match buy operation with buy filter', () => {
      const operation = { side: 'BUY' as const, status: 'FILLED' as const };
      const result = matchesOperationFilters(operation, { side: 'buy', outcome: 'all' });
      expect(result).toBe(true);
    });

    it('should not match sell operation with buy filter', () => {
      const operation = { side: 'SELL' as const, status: 'FILLED' as const };
      const result = matchesOperationFilters(operation, { side: 'buy', outcome: 'all' });
      expect(result).toBe(false);
    });

    it('should match successful operation with successful filter', () => {
      const operation = { side: 'BUY' as const, status: 'FILLED' as const };
      const result = matchesOperationFilters(operation, { side: 'all', outcome: 'successful' });
      expect(result).toBe(true);
    });

    it('should match failed operation with failed filter', () => {
      const operation = { side: 'BUY' as const, status: 'REJECTED' as const };
      const result = matchesOperationFilters(operation, { side: 'all', outcome: 'failed' });
      expect(result).toBe(true);
    });

    it('should not match filled operation with failed filter', () => {
      const operation = { side: 'BUY' as const, status: 'FILLED' as const };
      const result = matchesOperationFilters(operation, { side: 'all', outcome: 'failed' });
      expect(result).toBe(false);
    });

    it('should match with combined filters', () => {
      const operation = { side: 'SELL' as const, status: 'FILLED' as const };
      const result = matchesOperationFilters(operation, { side: 'sell', outcome: 'successful' });
      expect(result).toBe(true);
    });
  });

  describe('buildOperationFiltersQueryString', () => {
    it('should build query string with all filters', () => {
      const result = buildOperationFiltersQueryString({ side: 'all', outcome: 'all' });
      expect(result).toBe('side=all&outcome=all');
    });

    it('should build query string with buy side', () => {
      const result = buildOperationFiltersQueryString({ side: 'buy', outcome: 'successful' });
      expect(result).toBe('side=buy&outcome=successful');
    });

    it('should build query string with failed outcome', () => {
      const result = buildOperationFiltersQueryString({ side: 'sell', outcome: 'failed' });
      expect(result).toBe('side=sell&outcome=failed');
    });
  });
});
