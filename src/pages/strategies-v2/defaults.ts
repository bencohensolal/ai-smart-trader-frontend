import type { InvestmentStrategy, RiskLevel } from './types';

/** Available crypto assets for selection */
export const AVAILABLE_ASSETS = [
  'BTC',
  'ETH',
  'SOL',
  'LINK',
  'XRP',
  'DOGE',
  'AVAX',
  'DOT',
  'ARB',
  'OP',
  'MATIC',
  'ADA',
  'ATOM',
  'UNI',
  'AAVE',
] as const;

/** Available AI models */
export const AI_MODELS = [
  { id: 'gpt-4o', label: 'GPT-4o' },
  { id: 'gpt-4o-mini', label: 'GPT-4o Mini' },
  { id: 'gpt-5', label: 'GPT-5' },
  { id: 'claude-4-sonnet', label: 'Claude 4 Sonnet' },
  { id: 'claude-4-opus', label: 'Claude 4 Opus' },
  { id: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
] as const;

/** Available base currencies */
export const BASE_CURRENCIES = ['USDT', 'USDC', 'EUR', 'USD'] as const;

// ─── Default AI Prompts ──────────────────────────────────────────────────────

export const DEFAULT_SYSTEM_PROMPT = `You are a senior crypto trading analyst AI. Your role is to analyze market data and provide structured investment recommendations.

CRITICAL RULES:
- You MUST respond with valid JSON only. No text outside JSON.
- Never present any prediction as certain. Always express confidence as a probability.
- Consider multiple scenarios and risk factors.
- Factor in fees, slippage, and realistic execution conditions.
- Never recommend over-concentration in a single asset.
- Be conservative with confidence scores — 0.7+ means very high conviction.`;

export const DEFAULT_ANALYSIS_PROMPT_LOW = `Analyze the following market data with a CONSERVATIVE approach. Prioritize capital preservation over returns. Only recommend BUY if confidence is very high (>0.80) and risk/reward is excellent.

Current portfolio: {{portfolio}}
Market data: {{marketData}}
Strategy constraints: {{constraints}}

Respond with the exact JSON format specified.`;

export const DEFAULT_ANALYSIS_PROMPT_MEDIUM = `Analyze the following market data with a BALANCED approach. Seek moderate growth opportunities while managing downside risk. Recommend trades when confidence is solid (>0.70) with favorable risk/reward.

Current portfolio: {{portfolio}}
Market data: {{marketData}}
Strategy constraints: {{constraints}}

Respond with the exact JSON format specified.`;

export const DEFAULT_ANALYSIS_PROMPT_HIGH = `Analyze the following market data with an AGGRESSIVE growth approach. Seek high-return opportunities and be willing to accept higher volatility. Recommend trades when confidence is reasonable (>0.60) with acceptable risk/reward.

Current portfolio: {{portfolio}}
Market data: {{marketData}}
Strategy constraints: {{constraints}}

Respond with the exact JSON format specified.`;

/** Expected JSON response format (displayed as reference in the UI) */
export const AI_RESPONSE_FORMAT_REFERENCE = `{
  "timestamp": "ISO-8601",
  "globalMarketBias": "BULLISH | BEARISH | NEUTRAL",
  "confidenceScore": 0.78,
  "portfolioAdjustment": {
    "recommendedCashPercent": 25,
    "recommendedExposurePercent": 75
  },
  "actions": [
    {
      "type": "BUY | SELL | HOLD",
      "asset": "BTC",
      "amountType": "PERCENT | FIXED",
      "amountValue": 15,
      "entryPrice": 63000,
      "targetPrice": 70000,
      "stopLoss": 59000,
      "confidence": 0.82,
      "expectedReturnPercent": 11.2,
      "riskRewardRatio": 2.1,
      "timeframeDays": 21,
      "rationale": "Short technical summary"
    }
  ],
  "riskWarnings": ["Volatility spike detected"]
}`;

type StrategyDefaults = Omit<InvestmentStrategy, 'id' | 'createdAt' | 'updatedAt'>;

const LOW_RISK: StrategyDefaults = {
  name: '',
  description: '',
  riskLevel: 'LOW',
  isActive: false,
  mode: 'simulation',

  // Crypto Universe
  allowedAssets: ['BTC', 'ETH'],
  baseCurrency: 'USDT',
  maxAssetAllocationPercent: 30,

  // Capital & Money Management
  monthlyBudget: 200,
  maxCapitalExposure: 1000,
  maxSingleTradeAmount: 50,
  minCashReservePercent: 30,

  // AI Parameters
  aiModel: 'gpt-4o',
  aiTemperature: 0.3,
  aiMaxTokens: 4096,
  aiCallFrequencyPerDay: 2,
  minConfidenceThreshold: 0.8,
  minExpectedReturnPercent: 3,
  predictionTimeframeDays: 30,

  // Safeguards
  maxDailyTrades: 2,
  maxWeeklyTrades: 5,
  maxDrawdownPercent: 10,
  emergencyStopLossPercent: 15,
  slippageTolerancePercent: 0.5,
  maxFeesPercentPerMonth: 2,

  // Buy Conditions
  requiredConfidenceToBuy: 0.8,
  requiredRiskRewardRatio: 2.5,
  allowAveragingDown: false,
  maxPositionPerAssetPercent: 30,

  // Sell Conditions
  takeProfitPercent: 8,
  stopLossPercent: 5,
  trailingStopPercent: 3,
  forceSellAfterDays: 60,
  sellIfConfidenceDropsBelow: 0.4,

  // Prompts
  systemPrompt: DEFAULT_SYSTEM_PROMPT,
  analysisPrompt: DEFAULT_ANALYSIS_PROMPT_LOW,
  customInstructions: '',
  enforceJsonResponse: true,

  // Advanced
  cooldownAfterTradeMinutes: 120,
  volatilityFilterEnabled: true,
  minimumMarketVolume: 100000,
  blacklistAssets: [],
  whitelistAssets: [],
  rebalanceFrequencyDays: 14,
};

const MEDIUM_RISK: StrategyDefaults = {
  name: '',
  description: '',
  riskLevel: 'MEDIUM',
  isActive: false,
  mode: 'simulation',

  allowedAssets: ['BTC', 'ETH', 'SOL', 'LINK'],
  baseCurrency: 'USDT',
  maxAssetAllocationPercent: 40,

  monthlyBudget: 500,
  maxCapitalExposure: 3000,
  maxSingleTradeAmount: 150,
  minCashReservePercent: 20,

  aiModel: 'gpt-4o',
  aiTemperature: 0.5,
  aiMaxTokens: 4096,
  aiCallFrequencyPerDay: 4,
  minConfidenceThreshold: 0.7,
  minExpectedReturnPercent: 5,
  predictionTimeframeDays: 21,

  maxDailyTrades: 5,
  maxWeeklyTrades: 15,
  maxDrawdownPercent: 20,
  emergencyStopLossPercent: 25,
  slippageTolerancePercent: 1.0,
  maxFeesPercentPerMonth: 3,

  requiredConfidenceToBuy: 0.7,
  requiredRiskRewardRatio: 2.0,
  allowAveragingDown: false,
  maxPositionPerAssetPercent: 40,

  takeProfitPercent: 15,
  stopLossPercent: 8,
  trailingStopPercent: 5,
  forceSellAfterDays: 45,
  sellIfConfidenceDropsBelow: 0.35,

  systemPrompt: DEFAULT_SYSTEM_PROMPT,
  analysisPrompt: DEFAULT_ANALYSIS_PROMPT_MEDIUM,
  customInstructions: '',
  enforceJsonResponse: true,

  cooldownAfterTradeMinutes: 60,
  volatilityFilterEnabled: true,
  minimumMarketVolume: 50000,
  blacklistAssets: [],
  whitelistAssets: [],
  rebalanceFrequencyDays: 7,
};

const HIGH_RISK: StrategyDefaults = {
  name: '',
  description: '',
  riskLevel: 'HIGH',
  isActive: false,
  mode: 'simulation',

  allowedAssets: ['BTC', 'ETH', 'SOL', 'LINK', 'DOGE', 'AVAX', 'ARB'],
  baseCurrency: 'USDT',
  maxAssetAllocationPercent: 50,

  monthlyBudget: 1000,
  maxCapitalExposure: 10000,
  maxSingleTradeAmount: 500,
  minCashReservePercent: 10,

  aiModel: 'gpt-4o',
  aiTemperature: 0.7,
  aiMaxTokens: 8192,
  aiCallFrequencyPerDay: 8,
  minConfidenceThreshold: 0.6,
  minExpectedReturnPercent: 8,
  predictionTimeframeDays: 14,

  maxDailyTrades: 10,
  maxWeeklyTrades: 30,
  maxDrawdownPercent: 35,
  emergencyStopLossPercent: 40,
  slippageTolerancePercent: 2.0,
  maxFeesPercentPerMonth: 5,

  requiredConfidenceToBuy: 0.6,
  requiredRiskRewardRatio: 1.5,
  allowAveragingDown: true,
  maxPositionPerAssetPercent: 50,

  takeProfitPercent: 25,
  stopLossPercent: 12,
  trailingStopPercent: 8,
  forceSellAfterDays: 30,
  sellIfConfidenceDropsBelow: 0.3,

  systemPrompt: DEFAULT_SYSTEM_PROMPT,
  analysisPrompt: DEFAULT_ANALYSIS_PROMPT_HIGH,
  customInstructions: '',
  enforceJsonResponse: true,

  cooldownAfterTradeMinutes: 30,
  volatilityFilterEnabled: false,
  minimumMarketVolume: 10000,
  blacklistAssets: [],
  whitelistAssets: [],
  rebalanceFrequencyDays: 3,
};

const PRESETS: Record<RiskLevel, StrategyDefaults> = {
  LOW: LOW_RISK,
  MEDIUM: MEDIUM_RISK,
  HIGH: HIGH_RISK,
  CUSTOM: MEDIUM_RISK,
};

/** Get default strategy values for a given risk level */
export function getDefaultsByRisk(riskLevel: RiskLevel): StrategyDefaults {
  return { ...PRESETS[riskLevel] };
}

/** Build an empty strategy form state with defaults for MEDIUM risk */
export function buildEmptyStrategy(): StrategyDefaults {
  return getDefaultsByRisk('MEDIUM');
}

/** Pre-built default strategy available to all users */
export function buildDefaultStrategy(): InvestmentStrategy {
  const now = new Date().toISOString();
  const defaults = getDefaultsByRisk('MEDIUM');
  return {
    ...defaults,
    id: 'default_balanced_btc_eth',
    name: 'Balanced BTC/ETH',
    description:
      'A balanced AI-assisted strategy focused on BTC and ETH with moderate risk parameters. ' +
      'Good starting point for most investors. Feel free to customize or delete and recreate.',
    riskLevel: 'MEDIUM',
    isActive: false,
    mode: 'simulation',
    allowedAssets: ['BTC', 'ETH', 'SOL', 'LINK'],
    createdAt: now,
    updatedAt: now,
  };
}
