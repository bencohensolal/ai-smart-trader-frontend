import {
  AiGuardrails,
  HistoricalLevers,
  SafeguardsDefaults,
  StrategyRiskLevel,
} from './types';

export function defaultHistoricalLeversByRisk(
  risk: StrategyRiskLevel,
): HistoricalLevers {
  if (risk === 'defensive') {
    return {
      lookbackDays: 21,
      buyDropThresholdPct: 2.5,
      sellRiseThresholdPct: 4.5,
      maxCapitalPerSignalPct: 12,
      trendLookbackDays: 45,
      maxVolatilityPct: 6,
      minDaysBetweenTrades: 4,
    };
  }

  if (risk === 'aggressive') {
    return {
      lookbackDays: 7,
      buyDropThresholdPct: 1.2,
      sellRiseThresholdPct: 2.5,
      maxCapitalPerSignalPct: 25,
      trendLookbackDays: 21,
      maxVolatilityPct: 12,
      minDaysBetweenTrades: 1,
    };
  }

  return {
    lookbackDays: 14,
    buyDropThresholdPct: 1.8,
    sellRiseThresholdPct: 3.5,
    maxCapitalPerSignalPct: 18,
    trendLookbackDays: 30,
    maxVolatilityPct: 8,
    minDaysBetweenTrades: 2,
  };
}

export function defaultSafeguardsByRisk(
  risk: StrategyRiskLevel,
): SafeguardsDefaults {
  if (risk === 'defensive') {
    return {
      monthlyBudgetEur: 300,
      maxDailySpendEur: 50,
      decisionChecksPerDay: 16,
      minAiConfidencePctForExecution: 75,
      maxPositionSizeEur: 150,
      maxConcurrentPositions: 5,
      minOrderSizeEur: 10,
      rebalancingEnabled: true,
      acceptLosses: false,
    };
  }

  if (risk === 'aggressive') {
    return {
      monthlyBudgetEur: 1000,
      maxDailySpendEur: 300,
      decisionChecksPerDay: 24,
      minAiConfidencePctForExecution: 45,
      maxPositionSizeEur: 500,
      maxConcurrentPositions: 10,
      minOrderSizeEur: 5,
      rebalancingEnabled: true,
      acceptLosses: true,
    };
  }

  return {
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
}

export function defaultAiGuardrails(): AiGuardrails {
  return {
    aiQueryFrequencyDays: 2,
    maxCostPerCallEur: 2,
    maxCallsPerMonth: 30,
    maxSessionDurationMinutes: 60,
    maxConcurrentPositions: 10,
  };
}
