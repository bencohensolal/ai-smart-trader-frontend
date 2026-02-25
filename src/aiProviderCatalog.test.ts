import { describe, it, expect } from 'vitest';
import {
  getProviderPreset,
  getProviderModels,
  getProviderDefaults,
  getProviderModelRates,
} from './aiProviderCatalog';

describe('aiProviderCatalog', () => {
  describe('getProviderPreset', () => {
    it('should get openai preset', () => {
      const preset = getProviderPreset('openai');
      expect(preset.provider).toBe('openai');
      expect(preset.models).toContain('gpt-4o-mini');
      expect(preset.defaults.model).toBe('gpt-4o-mini');
    });

    it('should get anthropic preset', () => {
      const preset = getProviderPreset('anthropic');
      expect(preset.provider).toBe('anthropic');
      expect(preset.models).toContain('claude-sonnet-4-6');
      expect(preset.defaults.model).toBe('claude-sonnet-4-6');
    });

    it('should get gemini preset', () => {
      const preset = getProviderPreset('gemini');
      expect(preset.provider).toBe('gemini');
      expect(preset.models).toContain('gemini-2.0-flash');
      expect(preset.defaults.model).toBe('gemini-2.0-flash');
    });
  });

  describe('getProviderModels', () => {
    it('should get openai models', () => {
      const models = getProviderModels('openai');
      expect(models).toEqual(['gpt-4o-mini', 'gpt-4.1-mini', 'gpt-4.1', 'gpt-4o']);
    });

    it('should get anthropic models', () => {
      const models = getProviderModels('anthropic');
      expect(models).toContain('claude-sonnet-4-6');
      expect(models).toContain('claude-opus-4-6');
      expect(models).toContain('claude-3-haiku-20240307');
      expect(models.length).toBeGreaterThan(5);
    });

    it('should get gemini models', () => {
      const models = getProviderModels('gemini');
      expect(models).toEqual(['gemini-2.0-flash-lite', 'gemini-2.0-flash', 'gemini-2.5-pro']);
    });

    it('should return a copy of the array', () => {
      const models1 = getProviderModels('openai');
      const models2 = getProviderModels('openai');
      expect(models1).toEqual(models2);
      expect(models1).not.toBe(models2);
    });
  });

  describe('getProviderDefaults', () => {
    it('should get openai defaults', () => {
      const defaults = getProviderDefaults('openai');
      expect(defaults.provider).toBe('openai');
      expect(defaults.model).toBe('gpt-4o-mini');
      expect(defaults.baseUrl).toBe('https://api.openai.com/v1/chat/completions');
      expect(defaults.temperature).toBe(0.2);
      expect(defaults.maxCallsPerDay).toBe(500);
    });

    it('should get anthropic defaults', () => {
      const defaults = getProviderDefaults('anthropic');
      expect(defaults.provider).toBe('anthropic');
      expect(defaults.model).toBe('claude-sonnet-4-6');
      expect(defaults.baseUrl).toBe('https://api.anthropic.com/v1/messages');
      expect(defaults.temperature).toBe(0.2);
      expect(defaults.maxCallsPerDay).toBe(300);
    });

    it('should get gemini defaults', () => {
      const defaults = getProviderDefaults('gemini');
      expect(defaults.provider).toBe('gemini');
      expect(defaults.model).toBe('gemini-2.0-flash');
      expect(defaults.baseUrl).toBe('https://generativelanguage.googleapis.com/v1beta');
      expect(defaults.temperature).toBe(0.2);
      expect(defaults.maxCallsPerDay).toBe(400);
    });

    it('should return a copy of the defaults object', () => {
      const defaults1 = getProviderDefaults('openai');
      const defaults2 = getProviderDefaults('openai');
      expect(defaults1).toEqual(defaults2);
      expect(defaults1).not.toBe(defaults2);
    });

    it('should include pricing information', () => {
      const defaults = getProviderDefaults('openai');
      expect(defaults.inputCostPer1MTokensUsd).toBeGreaterThan(0);
      expect(defaults.outputCostPer1MTokensUsd).toBeGreaterThan(0);
      expect(defaults.usdToEurRate).toBeGreaterThan(0);
      expect(defaults.pricingSource).toBeTruthy();
      expect(defaults.pricingUpdatedAt).toBeTruthy();
    });
  });

  describe('getProviderModelRates', () => {
    it('should return model rates for known model', () => {
      const rates = getProviderModelRates('openai', 'gpt-4o-mini');
      expect(rates.inputCostPer1MTokensUsd).toBe(0.15);
      expect(rates.outputCostPer1MTokensUsd).toBe(0.6);
    });

    it('should return fallback rates for unknown model', () => {
      const rates = getProviderModelRates('openai', 'unknown-model');
      expect(rates.inputCostPer1MTokensUsd).toBe(0.15);
      expect(rates.outputCostPer1MTokensUsd).toBe(0.6);
    });

    it('should get openai model rates for gpt-4.1-mini', () => {
      const rates = getProviderModelRates('openai', 'gpt-4.1-mini');
      expect(rates.inputCostPer1MTokensUsd).toBe(0.4);
      expect(rates.outputCostPer1MTokensUsd).toBe(1.6);
    });

    it('should get openai model rates for gpt-4.1', () => {
      const rates = getProviderModelRates('openai', 'gpt-4.1');
      expect(rates.inputCostPer1MTokensUsd).toBe(2);
      expect(rates.outputCostPer1MTokensUsd).toBe(8);
    });

    it('should get openai model rates for gpt-4o', () => {
      const rates = getProviderModelRates('openai', 'gpt-4o');
      expect(rates.inputCostPer1MTokensUsd).toBe(2.5);
      expect(rates.outputCostPer1MTokensUsd).toBe(10);
    });

    it('should get anthropic model rates for claude-sonnet-4-6', () => {
      const rates = getProviderModelRates('anthropic', 'claude-sonnet-4-6');
      expect(rates.inputCostPer1MTokensUsd).toBe(3);
      expect(rates.outputCostPer1MTokensUsd).toBe(15);
    });

    it('should get anthropic model rates for claude-opus-4-6', () => {
      const rates = getProviderModelRates('anthropic', 'claude-opus-4-6');
      expect(rates.inputCostPer1MTokensUsd).toBe(15);
      expect(rates.outputCostPer1MTokensUsd).toBe(75);
    });

    it('should get anthropic model rates for claude-3-haiku-20240307', () => {
      const rates = getProviderModelRates('anthropic', 'claude-3-haiku-20240307');
      expect(rates.inputCostPer1MTokensUsd).toBe(0.25);
      expect(rates.outputCostPer1MTokensUsd).toBe(1.25);
    });

    it('should get gemini model rates for gemini-2.0-flash-lite', () => {
      const rates = getProviderModelRates('gemini', 'gemini-2.0-flash-lite');
      expect(rates.inputCostPer1MTokensUsd).toBe(0.075);
      expect(rates.outputCostPer1MTokensUsd).toBe(0.3);
    });

    it('should get gemini model rates for gemini-2.0-flash', () => {
      const rates = getProviderModelRates('gemini', 'gemini-2.0-flash');
      expect(rates.inputCostPer1MTokensUsd).toBe(0.1);
      expect(rates.outputCostPer1MTokensUsd).toBe(0.4);
    });

    it('should get gemini model rates for gemini-2.5-pro', () => {
      const rates = getProviderModelRates('gemini', 'gemini-2.5-pro');
      expect(rates.inputCostPer1MTokensUsd).toBe(1.25);
      expect(rates.outputCostPer1MTokensUsd).toBe(5);
    });

    it('should fallback to default model rates for unknown model', () => {
      const rates = getProviderModelRates('openai', 'unknown-model');
      const defaults = getProviderDefaults('openai');
      expect(rates.inputCostPer1MTokensUsd).toBe(defaults.inputCostPer1MTokensUsd);
      expect(rates.outputCostPer1MTokensUsd).toBe(defaults.outputCostPer1MTokensUsd);
    });

    it('should handle provider without model rates by using defaults', () => {
      // Test the ultimate fallback path (lines 185-187)
      const rates = getProviderModelRates('anthropic', 'completely-unknown-model-xyz');
      // Should fallback to default model rates
      expect(rates).toBeDefined();
      expect(rates.inputCostPer1MTokensUsd).toBeGreaterThan(0);
      expect(rates.outputCostPer1MTokensUsd).toBeGreaterThan(0);
    });
  });
});
