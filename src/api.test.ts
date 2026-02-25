import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ApiHttpError, isUnauthorizedError, STRATEGY_SYMBOLS } from './api';

describe('api', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('ApiHttpError', () => {
    it('should create error with status and message', () => {
      const error = new ApiHttpError(404, 'Not found');
      expect(error.status).toBe(404);
      expect(error.message).toBe('Not found');
      expect(error.name).toBe('ApiHttpError');
    });
  });

  describe('isUnauthorizedError', () => {
    it('should return true for 401 ApiHttpError', () => {
      const error = new ApiHttpError(401, 'Unauthorized');
      expect(isUnauthorizedError(error)).toBe(true);
    });

    it('should return false for non-401 ApiHttpError', () => {
      const error = new ApiHttpError(404, 'Not found');
      expect(isUnauthorizedError(error)).toBe(false);
    });

    it('should return false for non-ApiHttpError', () => {
      const error = new Error('Generic error');
      expect(isUnauthorizedError(error)).toBe(false);
    });

    it('should return false for null', () => {
      expect(isUnauthorizedError(null)).toBe(false);
    });
  });

  describe('STRATEGY_SYMBOLS', () => {
    it('should export array of symbols', () => {
      expect(STRATEGY_SYMBOLS).toContain('BTC');
      expect(STRATEGY_SYMBOLS).toContain('ETH');
      expect(STRATEGY_SYMBOLS).toHaveLength(11);
    });
  });
});
