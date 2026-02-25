import { describe, it, expect } from 'vitest';
import { toBackendStrategy, toOverrideInput, strategyDisplayLabel } from './strategyMapper';
import { buildDefaultStrategy } from './defaults';
import type { InvestmentStrategy } from './types';

function makeStrategy(overrides: Partial<InvestmentStrategy> = {}): InvestmentStrategy {
  return { ...buildDefaultStrategy(), ...overrides };
}

describe('toBackendStrategy', () => {
  it('maps v2 strategy to old backend Strategy format', () => {
    const v2 = makeStrategy();
    const backend = toBackendStrategy(v2);
    expect(backend.id).toBe(v2.id);
    expect(backend.name).toBe(v2.name);
    expect(backend.description).toBe(v2.description);
    expect(backend.riskProfile).toBe('balanced');
    expect(backend.monthlyBudgetEur).toBe(v2.monthlyBudget);
    expect(backend.rebalancingPerDay).toBe(v2.aiCallFrequencyPerDay);
    expect(backend.maxPositionPct).toBe(v2.maxPositionPerAssetPercent);
    expect(backend.advanced.stopLossPct).toBe(v2.stopLossPercent);
    expect(backend.advanced.takeProfitTargetPct).toBe(v2.takeProfitPercent);
    expect(backend.advanced.reserveCashPct).toBe(v2.minCashReservePercent);
    expect(backend.advanced.slippagePct).toBe(v2.slippageTolerancePercent);
  });

  it.each([
    ['LOW', 'defensive'],
    ['MEDIUM', 'balanced'],
    ['HIGH', 'aggressive'],
    ['CUSTOM', 'balanced'],
  ] as const)('maps risk level %s → %s', (v2Risk, backendRisk) => {
    const backend = toBackendStrategy(makeStrategy({ riskLevel: v2Risk }));
    expect(backend.riskProfile).toBe(backendRisk);
  });
});

describe('toOverrideInput', () => {
  it('builds override input from v2 strategy', () => {
    const v2 = makeStrategy();
    const override = toOverrideInput(v2);
    expect(override.riskProfile).toBe('balanced');
    expect(override.monthlyBudgetEur).toBe(v2.monthlyBudget);
    expect(override.rebalancingPerDay).toBe(v2.aiCallFrequencyPerDay);
    expect(override.maxPositionPct).toBe(v2.maxPositionPerAssetPercent);
    expect(override.advanced?.stopLossPct).toBe(v2.stopLossPercent);
    expect(override.advanced?.takeProfitTargetPct).toBe(v2.takeProfitPercent);
  });
});

describe('strategyDisplayLabel', () => {
  it('returns name and risk level', () => {
    const v2 = makeStrategy({ name: 'My Strategy', riskLevel: 'HIGH' });
    expect(strategyDisplayLabel(v2)).toBe('My Strategy (HIGH)');
  });
});
