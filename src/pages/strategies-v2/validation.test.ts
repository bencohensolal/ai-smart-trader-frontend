import { describe, it, expect } from 'vitest';
import {
  investmentStrategySchema,
  createStrategySchema,
  updateStrategySchema,
  aiTradeActionSchema,
  aiTradingResponseSchema,
  validateSafeguards,
} from './validation';
import { buildDefaultStrategy } from './defaults';

describe('investmentStrategySchema', () => {
  it('validates a correct default strategy', () => {
    const strategy = buildDefaultStrategy();
    const result = investmentStrategySchema.safeParse(strategy);
    expect(result.success).toBe(true);
  });

  it('rejects a strategy with empty name', () => {
    const strategy = { ...buildDefaultStrategy(), name: '' };
    const result = investmentStrategySchema.safeParse(strategy);
    expect(result.success).toBe(false);
  });

  it('rejects a strategy with empty allowedAssets', () => {
    const strategy = { ...buildDefaultStrategy(), allowedAssets: [] };
    const result = investmentStrategySchema.safeParse(strategy);
    expect(result.success).toBe(false);
  });

  it('rejects invalid aiTemperature', () => {
    const strategy = { ...buildDefaultStrategy(), aiTemperature: 5 };
    const result = investmentStrategySchema.safeParse(strategy);
    expect(result.success).toBe(false);
  });
});

describe('createStrategySchema', () => {
  it('validates without id/timestamps', () => {
    const strategy = buildDefaultStrategy();
    const { id: _id, createdAt: _ca, updatedAt: _ua, ...rest } = strategy;
    const result = createStrategySchema.safeParse(rest);
    expect(result.success).toBe(true);
  });
});

describe('updateStrategySchema', () => {
  it('validates with only id and partial fields', () => {
    const result = updateStrategySchema.safeParse({
      id: 'test-id',
      name: 'Updated Name',
    });
    expect(result.success).toBe(true);
  });

  it('rejects without id', () => {
    const result = updateStrategySchema.safeParse({ name: 'No Id' });
    expect(result.success).toBe(false);
  });
});

describe('aiTradeActionSchema', () => {
  it('validates a correct trade action', () => {
    const action = {
      type: 'BUY',
      asset: 'BTC',
      amountType: 'PERCENT',
      amountValue: 10,
      entryPrice: 50000,
      targetPrice: 55000,
      stopLoss: 48000,
      confidence: 0.85,
      expectedReturnPercent: 10,
      riskRewardRatio: 2.5,
      timeframeDays: 30,
      rationale: 'Strong uptrend with high volume',
    };
    const result = aiTradeActionSchema.safeParse(action);
    expect(result.success).toBe(true);
  });
});

describe('aiTradingResponseSchema', () => {
  it('validates a correct AI trading response', () => {
    const response = {
      timestamp: '2026-01-01T00:00:00Z',
      globalMarketBias: 'BULLISH',
      confidenceScore: 0.82,
      portfolioAdjustment: {
        recommendedCashPercent: 30,
        recommendedExposurePercent: 70,
      },
      actions: [],
      riskWarnings: [],
    };
    const result = aiTradingResponseSchema.safeParse(response);
    expect(result.success).toBe(true);
  });
});

describe('validateSafeguards', () => {
  const strategy = investmentStrategySchema.parse(buildDefaultStrategy());

  it('returns no violations when AI confidence is above threshold', () => {
    const aiResponse = {
      timestamp: '2026-01-01T00:00:00Z',
      globalMarketBias: 'BULLISH' as const,
      confidenceScore: 0.9,
      portfolioAdjustment: { recommendedCashPercent: 30, recommendedExposurePercent: 70 },
      actions: [],
      riskWarnings: [],
    };
    const violations = validateSafeguards(strategy, aiResponse);
    expect(violations).toEqual([]);
  });

  it('returns MIN_CONFIDENCE violation when score is too low', () => {
    const aiResponse = {
      timestamp: '2026-01-01T00:00:00Z',
      globalMarketBias: 'NEUTRAL' as const,
      confidenceScore: 0.1,
      portfolioAdjustment: { recommendedCashPercent: 50, recommendedExposurePercent: 50 },
      actions: [],
      riskWarnings: [],
    };
    const violations = validateSafeguards(strategy, aiResponse);
    expect(violations.some((v) => v.rule === 'MIN_CONFIDENCE')).toBe(true);
  });

  it('returns BUY_CONFIDENCE violation for low-confidence buy', () => {
    const aiResponse = {
      timestamp: '2026-01-01T00:00:00Z',
      globalMarketBias: 'BULLISH' as const,
      confidenceScore: 0.9,
      portfolioAdjustment: { recommendedCashPercent: 30, recommendedExposurePercent: 70 },
      actions: [
        {
          type: 'BUY' as const,
          asset: 'BTC',
          amountType: 'PERCENT' as const,
          amountValue: 10,
          entryPrice: 50000,
          targetPrice: 55000,
          stopLoss: 48000,
          confidence: 0.3,
          expectedReturnPercent: 10,
          riskRewardRatio: 2.5,
          timeframeDays: 30,
          rationale: 'Test',
        },
      ],
      riskWarnings: [],
    };
    const violations = validateSafeguards(strategy, aiResponse);
    expect(violations.some((v) => v.rule === 'BUY_CONFIDENCE')).toBe(true);
  });

  it('returns RISK_REWARD violation for low ratio', () => {
    const aiResponse = {
      timestamp: '2026-01-01T00:00:00Z',
      globalMarketBias: 'BULLISH' as const,
      confidenceScore: 0.9,
      portfolioAdjustment: { recommendedCashPercent: 30, recommendedExposurePercent: 70 },
      actions: [
        {
          type: 'BUY' as const,
          asset: 'ETH',
          amountType: 'FIXED' as const,
          amountValue: 100,
          entryPrice: 3000,
          targetPrice: 3050,
          stopLoss: 2900,
          confidence: 0.95,
          expectedReturnPercent: 1.6,
          riskRewardRatio: 0.2,
          timeframeDays: 7,
          rationale: 'Weak opportunity',
        },
      ],
      riskWarnings: [],
    };
    const violations = validateSafeguards(strategy, aiResponse);
    expect(violations.some((v) => v.rule === 'RISK_REWARD')).toBe(true);
  });

  it('ignores SELL and HOLD actions for buy checks', () => {
    const aiResponse = {
      timestamp: '2026-01-01T00:00:00Z',
      globalMarketBias: 'BEARISH' as const,
      confidenceScore: 0.9,
      portfolioAdjustment: { recommendedCashPercent: 70, recommendedExposurePercent: 30 },
      actions: [
        {
          type: 'SELL' as const,
          asset: 'BTC',
          amountType: 'PERCENT' as const,
          amountValue: 50,
          entryPrice: 50000,
          targetPrice: 45000,
          stopLoss: 52000,
          confidence: 0.1,
          expectedReturnPercent: -10,
          riskRewardRatio: 0.1,
          timeframeDays: 5,
          rationale: 'Exit position',
        },
        {
          type: 'HOLD' as const,
          asset: 'ETH',
          amountType: 'PERCENT' as const,
          amountValue: 0,
          entryPrice: 3000,
          targetPrice: 3000,
          stopLoss: 2800,
          confidence: 0.1,
          expectedReturnPercent: 0,
          riskRewardRatio: 0.1,
          timeframeDays: 1,
          rationale: 'Wait',
        },
      ],
      riskWarnings: [],
    };
    const violations = validateSafeguards(strategy, aiResponse);
    expect(violations.filter((v) => v.rule === 'BUY_CONFIDENCE')).toEqual([]);
    expect(violations.filter((v) => v.rule === 'RISK_REWARD')).toEqual([]);
  });
});
