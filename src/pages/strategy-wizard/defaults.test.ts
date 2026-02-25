import { describe, it, expect } from 'vitest';
import {
  defaultHistoricalLeversByRisk,
  defaultSafeguardsByRisk,
  defaultAiGuardrails,
} from './defaults';

describe('strategy-wizard defaults', () => {
  describe('defaultHistoricalLeversByRisk', () => {
    it('should return defensive levers', () => {
      const levers = defaultHistoricalLeversByRisk('defensive');
      expect(levers.lookbackDays).toBe(21);
      expect(levers.buyDropThresholdPct).toBe(2.5);
      expect(levers.sellRiseThresholdPct).toBe(4.5);
      expect(levers.maxCapitalPerSignalPct).toBe(12);
      expect(levers.trendLookbackDays).toBe(45);
      expect(levers.maxVolatilityPct).toBe(6);
      expect(levers.minDaysBetweenTrades).toBe(4);
    });

    it('should return balanced levers', () => {
      const levers = defaultHistoricalLeversByRisk('balanced');
      expect(levers.lookbackDays).toBe(14);
      expect(levers.buyDropThresholdPct).toBe(1.8);
      expect(levers.sellRiseThresholdPct).toBe(3.5);
      expect(levers.maxCapitalPerSignalPct).toBe(18);
      expect(levers.trendLookbackDays).toBe(30);
      expect(levers.maxVolatilityPct).toBe(8);
      expect(levers.minDaysBetweenTrades).toBe(2);
    });

    it('should return aggressive levers', () => {
      const levers = defaultHistoricalLeversByRisk('aggressive');
      expect(levers.lookbackDays).toBe(7);
      expect(levers.buyDropThresholdPct).toBe(1.2);
      expect(levers.sellRiseThresholdPct).toBe(2.5);
      expect(levers.maxCapitalPerSignalPct).toBe(25);
      expect(levers.trendLookbackDays).toBe(21);
      expect(levers.maxVolatilityPct).toBe(12);
      expect(levers.minDaysBetweenTrades).toBe(1);
    });

    it('should have shorter lookback for aggressive', () => {
      const defensive = defaultHistoricalLeversByRisk('defensive');
      const balanced = defaultHistoricalLeversByRisk('balanced');
      const aggressive = defaultHistoricalLeversByRisk('aggressive');
      expect(aggressive.lookbackDays).toBeLessThan(balanced.lookbackDays);
      expect(balanced.lookbackDays).toBeLessThan(defensive.lookbackDays);
    });

    it('should have higher volatility tolerance for aggressive', () => {
      const defensive = defaultHistoricalLeversByRisk('defensive');
      const balanced = defaultHistoricalLeversByRisk('balanced');
      const aggressive = defaultHistoricalLeversByRisk('aggressive');
      expect(aggressive.maxVolatilityPct).toBeGreaterThan(balanced.maxVolatilityPct);
      expect(balanced.maxVolatilityPct).toBeGreaterThan(defensive.maxVolatilityPct);
    });
  });

  describe('defaultSafeguardsByRisk', () => {
    it('should return defensive safeguards', () => {
      const safeguards = defaultSafeguardsByRisk('defensive');
      expect(safeguards.monthlyBudgetEur).toBe(300);
      expect(safeguards.maxDailySpendEur).toBe(50);
      expect(safeguards.decisionChecksPerDay).toBe(16);
      expect(safeguards.minAiConfidencePctForExecution).toBe(75);
      expect(safeguards.maxPositionSizeEur).toBe(150);
      expect(safeguards.maxConcurrentPositions).toBe(5);
      expect(safeguards.minOrderSizeEur).toBe(10);
      expect(safeguards.rebalancingEnabled).toBe(true);
      expect(safeguards.acceptLosses).toBe(false);
    });

    it('should return balanced safeguards', () => {
      const safeguards = defaultSafeguardsByRisk('balanced');
      expect(safeguards.monthlyBudgetEur).toBe(500);
      expect(safeguards.maxDailySpendEur).toBe(100);
      expect(safeguards.decisionChecksPerDay).toBe(20);
      expect(safeguards.minAiConfidencePctForExecution).toBe(60);
      expect(safeguards.maxPositionSizeEur).toBe(250);
      expect(safeguards.maxConcurrentPositions).toBe(8);
      expect(safeguards.minOrderSizeEur).toBe(15);
      expect(safeguards.rebalancingEnabled).toBe(true);
      expect(safeguards.acceptLosses).toBe(true);
    });

    it('should return aggressive safeguards', () => {
      const safeguards = defaultSafeguardsByRisk('aggressive');
      expect(safeguards.monthlyBudgetEur).toBe(1000);
      expect(safeguards.maxDailySpendEur).toBe(300);
      expect(safeguards.decisionChecksPerDay).toBe(24);
      expect(safeguards.minAiConfidencePctForExecution).toBe(45);
      expect(safeguards.maxPositionSizeEur).toBe(500);
      expect(safeguards.maxConcurrentPositions).toBe(10);
      expect(safeguards.minOrderSizeEur).toBe(5);
      expect(safeguards.rebalancingEnabled).toBe(true);
      expect(safeguards.acceptLosses).toBe(true);
    });

    it('should have higher budget for aggressive', () => {
      const defensive = defaultSafeguardsByRisk('defensive');
      const balanced = defaultSafeguardsByRisk('balanced');
      const aggressive = defaultSafeguardsByRisk('aggressive');
      expect(aggressive.monthlyBudgetEur).toBeGreaterThan(balanced.monthlyBudgetEur);
      expect(balanced.monthlyBudgetEur).toBeGreaterThan(defensive.monthlyBudgetEur);
    });

    it('should have lower AI confidence requirement for aggressive', () => {
      const defensive = defaultSafeguardsByRisk('defensive');
      const balanced = defaultSafeguardsByRisk('balanced');
      const aggressive = defaultSafeguardsByRisk('aggressive');
      expect(aggressive.minAiConfidencePctForExecution).toBeLessThan(
        balanced.minAiConfidencePctForExecution,
      );
      expect(balanced.minAiConfidencePctForExecution).toBeLessThan(
        defensive.minAiConfidencePctForExecution,
      );
    });

    it('should not accept losses for defensive', () => {
      const defensive = defaultSafeguardsByRisk('defensive');
      expect(defensive.acceptLosses).toBe(false);
    });

    it('should accept losses for balanced and aggressive', () => {
      const balanced = defaultSafeguardsByRisk('balanced');
      const aggressive = defaultSafeguardsByRisk('aggressive');
      expect(balanced.acceptLosses).toBe(true);
      expect(aggressive.acceptLosses).toBe(true);
    });
  });

  describe('defaultAiGuardrails', () => {
    it('should return default AI guardrails', () => {
      const guardrails = defaultAiGuardrails();
      expect(guardrails.aiQueryFrequencyDays).toBe(2);
      expect(guardrails.maxCostPerCallEur).toBe(2);
      expect(guardrails.maxCallsPerMonth).toBe(30);
      expect(guardrails.maxSessionDurationMinutes).toBe(60);
      expect(guardrails.maxConcurrentPositions).toBe(10);
    });

    it('should have reasonable cost per call', () => {
      const guardrails = defaultAiGuardrails();
      expect(guardrails.maxCostPerCallEur).toBeGreaterThan(0);
      expect(guardrails.maxCostPerCallEur).toBeLessThan(10);
    });

    it('should have reasonable calls per month', () => {
      const guardrails = defaultAiGuardrails();
      expect(guardrails.maxCallsPerMonth).toBeGreaterThan(10);
      expect(guardrails.maxCallsPerMonth).toBeLessThan(100);
    });
  });
});
