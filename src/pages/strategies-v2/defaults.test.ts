import { describe, it, expect } from 'vitest';
import {
  buildDefaultStrategy,
  buildEmptyStrategy,
  getDefaultsByRisk,
  DEFAULT_SYSTEM_PROMPT,
} from './defaults';
import type { RiskLevel } from './types';

describe('buildDefaultStrategy', () => {
  it('returns a complete strategy with MEDIUM risk level', () => {
    const strategy = buildDefaultStrategy();
    expect(strategy.id).toBe('default_balanced_btc_eth');
    expect(strategy.name).toBe('Balanced BTC/ETH');
    expect(strategy.riskLevel).toBe('MEDIUM');
    expect(strategy.isActive).toBe(false);
    expect(strategy.mode).toBe('simulation');
    expect(strategy.allowedAssets).toContain('BTC');
    expect(strategy.allowedAssets).toContain('ETH');
    expect(strategy.baseCurrency).toBe('USDT');
    expect(strategy.monthlyBudget).toBeGreaterThan(0);
    expect(strategy.systemPrompt).toBe(DEFAULT_SYSTEM_PROMPT);
    expect(strategy.enforceJsonResponse).toBe(true);
  });
});

describe('buildEmptyStrategy', () => {
  it('returns defaults with MEDIUM risk level', () => {
    const defaults = buildEmptyStrategy();
    expect(defaults.riskLevel).toBe('MEDIUM');
    expect(defaults.isActive).toBe(false);
    expect(defaults.allowedAssets).toContain('BTC');
    expect(defaults.allowedAssets).toContain('ETH');
    expect(defaults.monthlyBudget).toBeGreaterThan(0);
    expect(defaults.systemPrompt).toBe(DEFAULT_SYSTEM_PROMPT);
  });
});

describe('getDefaultsByRisk', () => {
  const riskLevels: RiskLevel[] = ['LOW', 'MEDIUM', 'HIGH', 'CUSTOM'];

  it.each(riskLevels)('returns valid defaults for %s risk', (level) => {
    const defaults = getDefaultsByRisk(level);
    // CUSTOM falls back to MEDIUM defaults
    const expectedRisk = level === 'CUSTOM' ? 'MEDIUM' : level;
    expect(defaults.riskLevel).toBe(expectedRisk);
    expect(defaults.monthlyBudget).toBeGreaterThan(0);
    expect(defaults.maxCapitalExposure).toBeGreaterThan(0);
    expect(defaults.maxSingleTradeAmount).toBeGreaterThan(0);
    expect(defaults.aiTemperature).toBeGreaterThanOrEqual(0);
    expect(defaults.aiTemperature).toBeLessThanOrEqual(2);
    expect(defaults.systemPrompt).toBe(DEFAULT_SYSTEM_PROMPT);
    expect(defaults.enforceJsonResponse).toBe(true);
    expect(typeof defaults.analysisPrompt).toBe('string');
    expect(defaults.analysisPrompt.length).toBeGreaterThan(0);
  });

  it('LOW risk has stricter safeguards than HIGH', () => {
    const low = getDefaultsByRisk('LOW');
    const high = getDefaultsByRisk('HIGH');
    expect(low.maxDrawdownPercent).toBeLessThan(high.maxDrawdownPercent);
    expect(low.emergencyStopLossPercent).toBeLessThan(high.emergencyStopLossPercent);
    expect(low.minConfidenceThreshold).toBeGreaterThan(high.minConfidenceThreshold);
  });

  it('CUSTOM defaults to same as MEDIUM', () => {
    const medium = getDefaultsByRisk('MEDIUM');
    const custom = getDefaultsByRisk('CUSTOM');
    expect(custom.monthlyBudget).toBe(medium.monthlyBudget);
    expect(custom.riskLevel).toBe('MEDIUM');
  });
});
