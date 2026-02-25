import { describe, it, expect } from 'vitest';
import { validateCustomPromptContent, buildStrategyPreview } from './helpers';

describe('strategy-wizard helpers', () => {
  describe('validateCustomPromptContent', () => {
    it('should return valid for empty prompt', () => {
      const result = validateCustomPromptContent('');
      expect(result.isValid).toBe(true);
      expect(result.warnings).toHaveLength(0);
    });

    it('should return valid for whitespace-only prompt', () => {
      const result = validateCustomPromptContent('   ');
      expect(result.isValid).toBe(true);
      expect(result.warnings).toHaveLength(0);
    });

    it('should warn about missing portfolio context', () => {
      const result = validateCustomPromptContent('Make a trade decision');
      expect(result.warnings).toContain(
        'Consider mentioning portfolio/holdings for context awareness',
      );
    });

    it('should not warn when portfolio context is present', () => {
      const result = validateCustomPromptContent('Analyze my portfolio');
      expect(result.warnings).not.toContain(
        'Consider mentioning portfolio/holdings for context awareness',
      );
    });

    it('should not warn when holdings context is present', () => {
      const result = validateCustomPromptContent('Review current holdings');
      expect(result.warnings).not.toContain(
        'Consider mentioning portfolio/holdings for context awareness',
      );
    });

    it('should not warn when positions context is present', () => {
      const result = validateCustomPromptContent('Check positions');
      expect(result.warnings).not.toContain(
        'Consider mentioning portfolio/holdings for context awareness',
      );
    });

    it('should warn about missing action keywords', () => {
      const result = validateCustomPromptContent('Analyze portfolio');
      expect(result.warnings).toContain('Consider including trading action keywords (buy/sell)');
    });

    it('should not warn when buy is present', () => {
      const result = validateCustomPromptContent('Portfolio buy decision');
      expect(result.warnings).not.toContain(
        'Consider including trading action keywords (buy/sell)',
      );
    });

    it('should not warn when sell is present', () => {
      const result = validateCustomPromptContent('Portfolio sell decision');
      expect(result.warnings).not.toContain(
        'Consider including trading action keywords (buy/sell)',
      );
    });

    it('should not warn when trade is present', () => {
      const result = validateCustomPromptContent('Portfolio trade analysis');
      expect(result.warnings).not.toContain(
        'Consider including trading action keywords (buy/sell)',
      );
    });

    it('should not warn when action is present', () => {
      const result = validateCustomPromptContent('Portfolio action recommendation');
      expect(result.warnings).not.toContain(
        'Consider including trading action keywords (buy/sell)',
      );
    });

    it('should note JSON format enforcement', () => {
      const result = validateCustomPromptContent('Analyze portfolio and buy assets');
      expect(result.warnings).toContain(
        'Note: JSON output format will be enforced automatically by the system',
      );
    });

    it('should not warn about JSON when json keyword present', () => {
      const result = validateCustomPromptContent('Return JSON with portfolio buy decision');
      expect(result.warnings).not.toContain(
        'Note: JSON output format will be enforced automatically by the system',
      );
    });

    it('should not warn about JSON when format keyword present', () => {
      const result = validateCustomPromptContent('Format portfolio buy decision');
      expect(result.warnings).not.toContain(
        'Note: JSON output format will be enforced automatically by the system',
      );
    });

    it('should not warn about JSON when structure keyword present', () => {
      const result = validateCustomPromptContent('Structure portfolio buy decision');
      expect(result.warnings).not.toContain(
        'Note: JSON output format will be enforced automatically by the system',
      );
    });

    it('should be case insensitive', () => {
      const result = validateCustomPromptContent('Analyze PORTFOLIO and BUY assets as JSON');
      expect(result.isValid).toBe(true);
      expect(result.warnings).toHaveLength(0);
    });

    it('should return valid:false when warnings exist', () => {
      const result = validateCustomPromptContent('Do something');
      expect(result.isValid).toBe(false);
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('should return valid:true when all checks pass', () => {
      const result = validateCustomPromptContent(
        'Analyze portfolio holdings and decide whether to buy or sell in JSON format',
      );
      expect(result.isValid).toBe(true);
      expect(result.warnings).toHaveLength(0);
    });
  });

  describe('buildStrategyPreview', () => {
    const baseSafeguards = {
      monthlyBudgetEur: 500,
      maxDailySpendEur: 100,
      decisionChecksPerDay: 20,
      minAiConfidencePctForExecution: 60,
      maxPositionSizeEur: 250,
      maxConcurrentPositions: 8,
      minOrderSizeEur: 15,
      rebalancingEnabled: true,
      acceptLosses: true,
    };

    const baseAiGuardrails = {
      aiQueryFrequencyDays: 2,
      maxCostPerCallEur: 2,
      maxCallsPerMonth: 30,
      maxSessionDurationMinutes: 60,
      maxConcurrentPositions: 10,
    };

    const baseHistoricalLevers = {
      lookbackDays: 14,
      buyDropThresholdPct: 1.8,
      sellRiseThresholdPct: 3.5,
      maxCapitalPerSignalPct: 18,
      trendLookbackDays: 30,
      maxVolatilityPct: 8,
      minDaysBetweenTrades: 2,
    };

    it('should calculate orders per month for allocation strategy', () => {
      const result = buildStrategyPreview({
        safeguards: baseSafeguards,
        strategyType: 'allocation',
        allocationRebalancingFrequencyDays: 7,
        aiGuardrails: baseAiGuardrails,
        historicalLevers: baseHistoricalLevers,
        allocation: { BTC: 50, ETH: 50 },
        cryptoSymbols: [],
      });

      expect(result.estimatedOrdersPerMonth).toBe(5); // ceil(30 / 7 days)
    });

    it('should calculate orders per month for ai_assisted strategy', () => {
      const result = buildStrategyPreview({
        safeguards: baseSafeguards,
        strategyType: 'ai_assisted',
        allocationRebalancingFrequencyDays: 7,
        aiGuardrails: baseAiGuardrails,
        historicalLevers: baseHistoricalLevers,
        allocation: {},
        cryptoSymbols: ['BTC', 'ETH'],
      });

      expect(result.estimatedOrdersPerMonth).toBe(15); // min(30, 30 / 2 days)
    });

    it('should cap AI orders by maxCallsPerMonth', () => {
      const result = buildStrategyPreview({
        safeguards: baseSafeguards,
        strategyType: 'ai_assisted',
        allocationRebalancingFrequencyDays: 7,
        aiGuardrails: { ...baseAiGuardrails, aiQueryFrequencyDays: 1, maxCallsPerMonth: 10 },
        historicalLevers: baseHistoricalLevers,
        allocation: {},
        cryptoSymbols: ['BTC'],
      });

      expect(result.estimatedOrdersPerMonth).toBe(10); // capped by maxCallsPerMonth
    });

    it('should calculate orders per month for historical_signals strategy', () => {
      const result = buildStrategyPreview({
        safeguards: baseSafeguards,
        strategyType: 'historical_signals',
        allocationRebalancingFrequencyDays: 7,
        aiGuardrails: baseAiGuardrails,
        historicalLevers: baseHistoricalLevers,
        allocation: {},
        cryptoSymbols: ['BTC'],
      });

      expect(result.estimatedOrdersPerMonth).toBeGreaterThan(0);
    });

    it('should calculate capital per order', () => {
      const result = buildStrategyPreview({
        safeguards: { ...baseSafeguards, monthlyBudgetEur: 1000 },
        strategyType: 'allocation',
        allocationRebalancingFrequencyDays: 10,
        aiGuardrails: baseAiGuardrails,
        historicalLevers: baseHistoricalLevers,
        allocation: { BTC: 100 },
        cryptoSymbols: [],
      });

      expect(result.estimatedCapitalPerOrderEur).toBe(1000 / 3); // 1000 / 3 orders
    });

    it('should build projected allocation for allocation strategy', () => {
      const result = buildStrategyPreview({
        safeguards: baseSafeguards,
        strategyType: 'allocation',
        allocationRebalancingFrequencyDays: 7,
        aiGuardrails: baseAiGuardrails,
        historicalLevers: baseHistoricalLevers,
        allocation: { BTC: 60, ETH: 40 },
        cryptoSymbols: [],
      });

      expect(result.projectedAllocation).toHaveLength(2);
      expect(result.projectedAllocation[0]).toEqual({
        symbol: 'BTC',
        targetPct: 60,
        projectedAmountEur: 300, // 500 * 0.6
      });
      expect(result.projectedAllocation[1]).toEqual({
        symbol: 'ETH',
        targetPct: 40,
        projectedAmountEur: 200, // 500 * 0.4
      });
    });

    it('should filter out zero allocation', () => {
      const result = buildStrategyPreview({
        safeguards: baseSafeguards,
        strategyType: 'allocation',
        allocationRebalancingFrequencyDays: 7,
        aiGuardrails: baseAiGuardrails,
        historicalLevers: baseHistoricalLevers,
        allocation: { BTC: 100, ETH: 0 },
        cryptoSymbols: [],
      });

      expect(result.projectedAllocation).toHaveLength(1);
      expect(result.projectedAllocation[0].symbol).toBe('BTC');
    });

    it('should build equal projected allocation for AI and historical strategies', () => {
      const result = buildStrategyPreview({
        safeguards: baseSafeguards,
        strategyType: 'ai_assisted',
        allocationRebalancingFrequencyDays: 7,
        aiGuardrails: baseAiGuardrails,
        historicalLevers: baseHistoricalLevers,
        allocation: {},
        cryptoSymbols: ['BTC', 'ETH', 'SOL'],
      });

      expect(result.projectedAllocation).toHaveLength(3);
      result.projectedAllocation.forEach((item) => {
        expect(item.targetPct).toBeCloseTo(100 / 3);
        expect(item.projectedAmountEur).toBeCloseTo(500 / 3);
      });
    });

    it('should warn when capital per order is below minimum', () => {
      const result = buildStrategyPreview({
        safeguards: { ...baseSafeguards, monthlyBudgetEur: 30, minOrderSizeEur: 20 },
        strategyType: 'allocation',
        allocationRebalancingFrequencyDays: 3,
        aiGuardrails: baseAiGuardrails,
        historicalLevers: baseHistoricalLevers,
        allocation: { BTC: 100 },
        cryptoSymbols: [],
      });

      expect(result.warnings).toContain('Estimated capital per order is below minimum order size.');
    });

    it('should warn when capital per order exceeds maximum position', () => {
      const result = buildStrategyPreview({
        safeguards: { ...baseSafeguards, monthlyBudgetEur: 10000, maxPositionSizeEur: 200 },
        strategyType: 'allocation',
        allocationRebalancingFrequencyDays: 30,
        aiGuardrails: baseAiGuardrails,
        historicalLevers: baseHistoricalLevers,
        allocation: { BTC: 100 },
        cryptoSymbols: [],
      });

      expect(result.warnings).toContain(
        'Estimated capital per order exceeds maximum position size.',
      );
    });

    it('should warn when AI cost per call is high', () => {
      const result = buildStrategyPreview({
        safeguards: baseSafeguards,
        strategyType: 'ai_assisted',
        allocationRebalancingFrequencyDays: 7,
        aiGuardrails: { ...baseAiGuardrails, maxCostPerCallEur: 10 },
        historicalLevers: baseHistoricalLevers,
        allocation: {},
        cryptoSymbols: ['BTC'],
      });

      expect(result.warnings).toContain('AI cost per call is high and may impact net performance.');
    });

    it('should not warn when all checks pass', () => {
      const result = buildStrategyPreview({
        safeguards: baseSafeguards,
        strategyType: 'allocation',
        allocationRebalancingFrequencyDays: 7,
        aiGuardrails: baseAiGuardrails,
        historicalLevers: baseHistoricalLevers,
        allocation: { BTC: 100 },
        cryptoSymbols: [],
      });

      expect(result.warnings).toHaveLength(0);
    });

    it('should handle historical_replay strategy type', () => {
      const result = buildStrategyPreview({
        safeguards: baseSafeguards,
        strategyType: 'historical_signals',
        allocationRebalancingFrequencyDays: 7,
        aiGuardrails: baseAiGuardrails,
        historicalLevers: baseHistoricalLevers,
        allocation: {},
        cryptoSymbols: ['BTC', 'ETH'],
      });

      expect(result.estimatedOrdersPerMonth).toBeGreaterThan(0);
      expect(result.projectedAllocation).toHaveLength(2);
    });
  });
});
