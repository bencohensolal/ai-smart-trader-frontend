import { z } from 'zod';

// ─── Enums ───────────────────────────────────────────────────────────────────
const riskLevelSchema = z.enum(['LOW', 'MEDIUM', 'HIGH', 'CUSTOM']);
const strategyModeSchema = z.enum(['simulation', 'live']);
const tradeActionTypeSchema = z.enum(['BUY', 'SELL', 'HOLD']);
const amountTypeSchema = z.enum(['PERCENT', 'FIXED']);
const marketBiasSchema = z.enum(['BULLISH', 'BEARISH', 'NEUTRAL']);

// ─── Investment Strategy Schema ──────────────────────────────────────────────
export const investmentStrategySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(100),
  description: z.string().max(500).default(''),
  riskLevel: riskLevelSchema,
  isActive: z.boolean(),
  mode: strategyModeSchema,
  createdAt: z.string(),
  updatedAt: z.string(),

  // Crypto Universe
  allowedAssets: z.array(z.string().min(1)).min(1),
  baseCurrency: z.string().min(1),
  maxAssetAllocationPercent: z.number().min(1).max(100),

  // Capital & Money Management
  monthlyBudget: z.number().min(10),
  maxCapitalExposure: z.number().min(10),
  maxSingleTradeAmount: z.number().min(1),
  minCashReservePercent: z.number().min(0).max(100),

  // AI Parameters
  aiModel: z.string().min(1),
  aiTemperature: z.number().min(0).max(2),
  aiMaxTokens: z.number().min(100).max(128000),
  aiCallFrequencyPerDay: z.number().min(1).max(48),
  minConfidenceThreshold: z.number().min(0).max(1),
  minExpectedReturnPercent: z.number().min(0).max(100),
  predictionTimeframeDays: z.number().min(1).max(365),

  // Safeguards
  maxDailyTrades: z.number().min(1).max(100),
  maxWeeklyTrades: z.number().min(1).max(500),
  maxDrawdownPercent: z.number().min(1).max(100),
  emergencyStopLossPercent: z.number().min(1).max(100),
  slippageTolerancePercent: z.number().min(0).max(10),
  maxFeesPercentPerMonth: z.number().min(0).max(50),

  // Buy Conditions
  requiredConfidenceToBuy: z.number().min(0).max(1),
  requiredRiskRewardRatio: z.number().min(0.1).max(20),
  allowAveragingDown: z.boolean(),
  maxPositionPerAssetPercent: z.number().min(1).max(100),

  // Sell Conditions
  takeProfitPercent: z.number().min(0.1).max(1000),
  stopLossPercent: z.number().min(0.1).max(100),
  trailingStopPercent: z.number().min(0).max(100),
  forceSellAfterDays: z.number().min(0).max(365),
  sellIfConfidenceDropsBelow: z.number().min(0).max(1),

  // Prompts
  systemPrompt: z.string().min(10).max(5000),
  analysisPrompt: z.string().min(10).max(5000),
  customInstructions: z.string().max(2000).default(''),
  enforceJsonResponse: z.boolean(),

  // Advanced
  cooldownAfterTradeMinutes: z.number().min(0).max(1440),
  volatilityFilterEnabled: z.boolean(),
  minimumMarketVolume: z.number().min(0),
  blacklistAssets: z.array(z.string()),
  whitelistAssets: z.array(z.string()),
  rebalanceFrequencyDays: z.number().min(1).max(90),
});

/** Schema for creating a new strategy (no id/timestamps required) */
export const createStrategySchema = investmentStrategySchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

/** Schema for updating an existing strategy (partial, id required) */
export const updateStrategySchema = createStrategySchema.partial().extend({
  id: z.string().min(1),
});

// ─── AI Trading Response Schema ──────────────────────────────────────────────
export const aiTradeActionSchema = z.object({
  type: tradeActionTypeSchema,
  asset: z.string().min(1),
  amountType: amountTypeSchema,
  amountValue: z.number().positive(),
  entryPrice: z.number().positive(),
  targetPrice: z.number().positive(),
  stopLoss: z.number().positive(),
  confidence: z.number().min(0).max(1),
  expectedReturnPercent: z.number(),
  riskRewardRatio: z.number().positive(),
  timeframeDays: z.number().positive().int(),
  rationale: z.string().min(1),
});

export const aiTradingResponseSchema = z.object({
  timestamp: z.string(),
  globalMarketBias: marketBiasSchema,
  confidenceScore: z.number().min(0).max(1),
  portfolioAdjustment: z.object({
    recommendedCashPercent: z.number().min(0).max(100),
    recommendedExposurePercent: z.number().min(0).max(100),
  }),
  actions: z.array(aiTradeActionSchema),
  riskWarnings: z.array(z.string()),
});

// ─── Safeguard Validation (server-side checks, client-side preview) ──────────
export interface SafeguardViolation {
  rule: string;
  message: string;
}

export function validateSafeguards(
  strategy: z.infer<typeof investmentStrategySchema>,
  aiResponse: z.infer<typeof aiTradingResponseSchema>,
): SafeguardViolation[] {
  const violations: SafeguardViolation[] = [];

  // Check global confidence
  if (aiResponse.confidenceScore < strategy.minConfidenceThreshold) {
    violations.push({
      rule: 'MIN_CONFIDENCE',
      message: `AI confidence ${aiResponse.confidenceScore} is below minimum ${strategy.minConfidenceThreshold}`,
    });
  }

  // Check each action
  for (const action of aiResponse.actions) {
    if (action.type === 'BUY') {
      if (action.confidence < strategy.requiredConfidenceToBuy) {
        violations.push({
          rule: 'BUY_CONFIDENCE',
          message: `Buy confidence ${action.confidence} for ${action.asset} is below required ${strategy.requiredConfidenceToBuy}`,
        });
      }
      if (action.riskRewardRatio < strategy.requiredRiskRewardRatio) {
        violations.push({
          rule: 'RISK_REWARD',
          message: `Risk/reward ${action.riskRewardRatio} for ${action.asset} is below required ${strategy.requiredRiskRewardRatio}`,
        });
      }
    }
  }

  return violations;
}
