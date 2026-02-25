import { AiProvider, UserAiAdvisorSettings } from './api';

type ModelRate = {
  inputCostPer1MTokensUsd: number;
  outputCostPer1MTokensUsd: number;
};

type ProviderPreset = {
  provider: AiProvider;
  models: string[];
  defaults: Pick<
    UserAiAdvisorSettings,
    | 'provider'
    | 'model'
    | 'baseUrl'
    | 'temperature'
    | 'timeoutMs'
    | 'maxPromptTokensPerCall'
    | 'maxCompletionTokensPerCall'
    | 'maxCallsPerDay'
    | 'maxCostEurPerDay'
    | 'inputCostPer1MTokensUsd'
    | 'outputCostPer1MTokensUsd'
    | 'usdToEurRate'
    | 'pricingSource'
    | 'pricingUpdatedAt'
  >;
  modelRates: Record<string, ModelRate>;
};

const PRESETS: Record<AiProvider, ProviderPreset> = {
  openai: {
    provider: 'openai',
    models: ['gpt-4o-mini', 'gpt-4.1-mini', 'gpt-4.1', 'gpt-4o'],
    defaults: {
      provider: 'openai',
      model: 'gpt-4o-mini',
      baseUrl: 'https://api.openai.com/v1/chat/completions',
      temperature: 0.2,
      timeoutMs: 8000,
      maxPromptTokensPerCall: 8000,
      maxCompletionTokensPerCall: 1000,
      maxCallsPerDay: 500,
      maxCostEurPerDay: 10,
      inputCostPer1MTokensUsd: 0.15,
      outputCostPer1MTokensUsd: 0.6,
      usdToEurRate: 0.92,
      pricingSource: 'catalog:openai:gpt-4o-mini',
      pricingUpdatedAt: '2026-02-21',
    },
    modelRates: {
      'gpt-4o-mini': {
        inputCostPer1MTokensUsd: 0.15,
        outputCostPer1MTokensUsd: 0.6,
      },
      'gpt-4.1-mini': {
        inputCostPer1MTokensUsd: 0.4,
        outputCostPer1MTokensUsd: 1.6,
      },
      'gpt-4.1': { inputCostPer1MTokensUsd: 2, outputCostPer1MTokensUsd: 8 },
      'gpt-4o': { inputCostPer1MTokensUsd: 2.5, outputCostPer1MTokensUsd: 10 },
    },
  },
  anthropic: {
    provider: 'anthropic',
    models: [
      'claude-sonnet-4-6',
      'claude-opus-4-6',
      'claude-opus-4-5-20251101',
      'claude-haiku-4-5-20251001',
      'claude-sonnet-4-5-20250929',
      'claude-opus-4-1-20250805',
      'claude-opus-4-20250514',
      'claude-sonnet-4-20250514',
      'claude-3-haiku-20240307',
    ],
    defaults: {
      provider: 'anthropic',
      model: 'claude-sonnet-4-6',
      baseUrl: 'https://api.anthropic.com/v1/messages',
      temperature: 0.2,
      timeoutMs: 12000,
      maxPromptTokensPerCall: 8000,
      maxCompletionTokensPerCall: 1200,
      maxCallsPerDay: 300,
      maxCostEurPerDay: 10,
      inputCostPer1MTokensUsd: 3,
      outputCostPer1MTokensUsd: 15,
      usdToEurRate: 0.92,
      pricingSource: 'catalog:anthropic:claude-sonnet-4-6',
      pricingUpdatedAt: '2026-02-21',
    },
    modelRates: {
      'claude-sonnet-4-6': {
        inputCostPer1MTokensUsd: 3,
        outputCostPer1MTokensUsd: 15,
      },
      'claude-opus-4-6': {
        inputCostPer1MTokensUsd: 15,
        outputCostPer1MTokensUsd: 75,
      },
      'claude-opus-4-5-20251101': {
        inputCostPer1MTokensUsd: 15,
        outputCostPer1MTokensUsd: 75,
      },
      'claude-haiku-4-5-20251001': {
        inputCostPer1MTokensUsd: 0.8,
        outputCostPer1MTokensUsd: 4,
      },
      'claude-sonnet-4-5-20250929': {
        inputCostPer1MTokensUsd: 3,
        outputCostPer1MTokensUsd: 15,
      },
      'claude-opus-4-1-20250805': {
        inputCostPer1MTokensUsd: 15,
        outputCostPer1MTokensUsd: 75,
      },
      'claude-opus-4-20250514': {
        inputCostPer1MTokensUsd: 15,
        outputCostPer1MTokensUsd: 75,
      },
      'claude-sonnet-4-20250514': {
        inputCostPer1MTokensUsd: 3,
        outputCostPer1MTokensUsd: 15,
      },
      'claude-3-haiku-20240307': {
        inputCostPer1MTokensUsd: 0.25,
        outputCostPer1MTokensUsd: 1.25,
      },
    },
  },
  gemini: {
    provider: 'gemini',
    models: ['gemini-2.0-flash-lite', 'gemini-2.0-flash', 'gemini-2.5-pro'],
    defaults: {
      provider: 'gemini',
      model: 'gemini-2.0-flash',
      baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
      temperature: 0.2,
      timeoutMs: 12000,
      maxPromptTokensPerCall: 8000,
      maxCompletionTokensPerCall: 1500,
      maxCallsPerDay: 400,
      maxCostEurPerDay: 10,
      inputCostPer1MTokensUsd: 0.1,
      outputCostPer1MTokensUsd: 0.4,
      usdToEurRate: 0.92,
      pricingSource: 'catalog:gemini:gemini-2.0-flash',
      pricingUpdatedAt: '2026-02-21',
    },
    modelRates: {
      'gemini-2.0-flash-lite': {
        inputCostPer1MTokensUsd: 0.075,
        outputCostPer1MTokensUsd: 0.3,
      },
      'gemini-2.0-flash': {
        inputCostPer1MTokensUsd: 0.1,
        outputCostPer1MTokensUsd: 0.4,
      },
      'gemini-2.5-pro': {
        inputCostPer1MTokensUsd: 1.25,
        outputCostPer1MTokensUsd: 5,
      },
    },
  },
};

export function getProviderPreset(provider: AiProvider): ProviderPreset {
  return PRESETS[provider];
}

export function getProviderModels(provider: AiProvider): string[] {
  return PRESETS[provider].models.slice();
}

export function getProviderDefaults(provider: AiProvider): ProviderPreset['defaults'] {
  return { ...PRESETS[provider].defaults };
}

export function getProviderModelRates(provider: AiProvider, model: string): ModelRate {
  const preset = PRESETS[provider];
  const byModel = preset.modelRates[model];
  const byDefault = preset.modelRates[preset.defaults.model];
  /* v8 ignore next 4 */
  const fallback: ModelRate = {
    inputCostPer1MTokensUsd: preset.defaults.inputCostPer1MTokensUsd,
    outputCostPer1MTokensUsd: preset.defaults.outputCostPer1MTokensUsd,
  };
  return byModel ?? byDefault ?? /* v8 ignore next */ fallback;
}
