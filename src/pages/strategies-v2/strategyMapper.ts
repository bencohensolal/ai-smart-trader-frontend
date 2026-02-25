import type { Strategy, StrategyOverrideInput, StrategyRiskProfile } from '../../api';
import type { InvestmentStrategy, RiskLevel } from './types';

/** Map v2 RiskLevel → old StrategyRiskProfile */
function mapRiskLevel(level: RiskLevel): StrategyRiskProfile {
  switch (level) {
    case 'LOW':
      return 'defensive';
    case 'MEDIUM':
      return 'balanced';
    case 'HIGH':
      return 'aggressive';
    case 'CUSTOM':
      return 'balanced';
  }
}

/** Convert v2 InvestmentStrategy → old backend Strategy format */
export function toBackendStrategy(s: InvestmentStrategy): Strategy {
  return {
    id: s.id,
    name: s.name,
    description: s.description,
    riskProfile: mapRiskLevel(s.riskLevel),
    monthlyBudgetEur: s.monthlyBudget,
    rebalancingPerDay: s.aiCallFrequencyPerDay,
    maxPositionPct: s.maxPositionPerAssetPercent,
    advanced: {
      reserveCashPct: s.minCashReservePercent,
      minOrderSizeEur: 10,
      slippagePct: s.slippageTolerancePercent,
      feePreference: 'hybrid',
      takeProfitTargetPct: s.takeProfitPercent,
      stopLossPct: s.stopLossPercent,
      decisionMode: 'ai_assisted',
    },
  };
}

/** Build a StrategyOverrideInput from a v2 InvestmentStrategy */
export function toOverrideInput(s: InvestmentStrategy): StrategyOverrideInput {
  return {
    riskProfile: mapRiskLevel(s.riskLevel),
    monthlyBudgetEur: s.monthlyBudget,
    rebalancingPerDay: s.aiCallFrequencyPerDay,
    maxPositionPct: s.maxPositionPerAssetPercent,
    advanced: {
      reserveCashPct: s.minCashReservePercent,
      slippagePct: s.slippageTolerancePercent,
      takeProfitTargetPct: s.takeProfitPercent,
      stopLossPct: s.stopLossPercent,
    },
  };
}

/** Get display label for a v2 strategy in simulation selectors */
export function strategyDisplayLabel(s: InvestmentStrategy): string {
  return `${s.name} (${s.riskLevel})`;
}
