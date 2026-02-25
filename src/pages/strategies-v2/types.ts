// ─── Risk Levels ──────────────────────────────────────────────────────────────
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CUSTOM';

// ─── Strategy Mode ───────────────────────────────────────────────────────────
export type StrategyMode = 'simulation' | 'live';

// ─── AI Trade Action ─────────────────────────────────────────────────────────
export type TradeActionType = 'BUY' | 'SELL' | 'HOLD';
export type AmountType = 'PERCENT' | 'FIXED';
export type MarketBias = 'BULLISH' | 'BEARISH' | 'NEUTRAL';

// ─── Investment Strategy ─────────────────────────────────────────────────────
export interface InvestmentStrategy {
  /** Unique identifier */
  id: string;
  /** User-facing strategy name */
  name: string;
  /** Free-text description */
  description: string;
  /** Risk level category */
  riskLevel: RiskLevel;
  /** Whether this strategy is currently active */
  isActive: boolean;
  /** Operating mode: simulation or live trading */
  mode: StrategyMode;
  /** ISO timestamp of creation */
  createdAt: string;
  /** ISO timestamp of last update */
  updatedAt: string;

  // ── Crypto Universe ──────────────────────────────────────────────────────
  /** Allowed crypto symbols (e.g. ["BTC","ETH","SOL"]) */
  allowedAssets: string[];
  /** Base currency for trades (e.g. "USDT") */
  baseCurrency: string;
  /** Max allocation per single asset (0-100%) */
  maxAssetAllocationPercent: number;

  // ── Capital & Money Management ───────────────────────────────────────────
  /** Monthly investment budget in EUR */
  monthlyBudget: number;
  /** Maximum total capital exposure in EUR */
  maxCapitalExposure: number;
  /** Maximum amount for a single trade in EUR */
  maxSingleTradeAmount: number;
  /** Minimum cash reserve as % of portfolio */
  minCashReservePercent: number;

  // ── AI Parameters ────────────────────────────────────────────────────────
  /** AI model identifier (e.g. "gpt-4o", "gpt-5") */
  aiModel: string;
  /** AI temperature (0.0-2.0, lower = more deterministic) */
  aiTemperature: number;
  /** Maximum tokens per AI call */
  aiMaxTokens: number;
  /** Number of AI calls allowed per day */
  aiCallFrequencyPerDay: number;
  /** Minimum confidence threshold to act (0.0-1.0) */
  minConfidenceThreshold: number;
  /** Minimum expected return % for a trade to be considered */
  minExpectedReturnPercent: number;
  /** AI prediction timeframe in days */
  predictionTimeframeDays: number;

  // ── Safeguards ───────────────────────────────────────────────────────────
  /** Maximum trades per day */
  maxDailyTrades: number;
  /** Maximum trades per week */
  maxWeeklyTrades: number;
  /** Maximum drawdown % before pausing strategy */
  maxDrawdownPercent: number;
  /** Emergency stop-loss % triggers full liquidation */
  emergencyStopLossPercent: number;
  /** Slippage tolerance % */
  slippageTolerancePercent: number;
  /** Maximum trading fees as % of portfolio per month */
  maxFeesPercentPerMonth: number;

  // ── Buy Conditions ───────────────────────────────────────────────────────
  /** Minimum AI confidence to execute a buy */
  requiredConfidenceToBuy: number;
  /** Minimum risk/reward ratio to buy */
  requiredRiskRewardRatio: number;
  /** Allow averaging down on losing positions */
  allowAveragingDown: boolean;
  /** Maximum position size per asset (% of portfolio) */
  maxPositionPerAssetPercent: number;

  // ── Sell Conditions ──────────────────────────────────────────────────────
  /** Take profit target % */
  takeProfitPercent: number;
  /** Stop-loss % */
  stopLossPercent: number;
  /** Trailing stop % */
  trailingStopPercent: number;
  /** Force sell after N days regardless */
  forceSellAfterDays: number;
  /** Sell if AI confidence drops below this */
  sellIfConfidenceDropsBelow: number;

  // ── AI Prompt Configuration ──────────────────────────────────────────────
  /** System prompt defining AI role and constraints */
  systemPrompt: string;
  /** Analysis prompt template sent with market data */
  analysisPrompt: string;
  /** Additional custom instructions appended to every AI call */
  customInstructions: string;
  /** Whether to enforce strict JSON-only response from AI */
  enforceJsonResponse: boolean;

  // ── Advanced Parameters ──────────────────────────────────────────────────
  /** Cooldown period between trades (minutes) */
  cooldownAfterTradeMinutes: number;
  /** Enable volatility filter (block trades during high vol) */
  volatilityFilterEnabled: boolean;
  /** Minimum market volume required for trades */
  minimumMarketVolume: number;
  /** Symbols explicitly blacklisted */
  blacklistAssets: string[];
  /** Symbols explicitly whitelisted (override) */
  whitelistAssets: string[];
  /** Portfolio rebalance frequency in days */
  rebalanceFrequencyDays: number;
}

// ─── AI Response Format ──────────────────────────────────────────────────────
export interface AiTradeAction {
  type: TradeActionType;
  asset: string;
  amountType: AmountType;
  amountValue: number;
  entryPrice: number;
  targetPrice: number;
  stopLoss: number;
  confidence: number;
  expectedReturnPercent: number;
  riskRewardRatio: number;
  timeframeDays: number;
  rationale: string;
}

export interface AiTradingResponse {
  timestamp: string;
  globalMarketBias: MarketBias;
  confidenceScore: number;
  portfolioAdjustment: {
    recommendedCashPercent: number;
    recommendedExposurePercent: number;
  };
  actions: AiTradeAction[];
  riskWarnings: string[];
}

// ─── Strategy List Item (summary for table) ──────────────────────────────────
export interface StrategyListItem {
  id: string;
  name: string;
  riskLevel: RiskLevel;
  monthlyBudget: number;
  maxCapitalExposure: number;
  isActive: boolean;
  mode: StrategyMode;
  simulatedRoiPercent: number | null;
  maxDrawdownPercent: number;
  createdAt: string;
  updatedAt: string;
}

// ─── AI Decision Log ─────────────────────────────────────────────────────────
export interface AiDecisionLog {
  id: string;
  strategyId: string;
  timestamp: string;
  response: AiTradingResponse;
  safeguardResults: SafeguardCheckResult[];
  executedActions: number;
  rejectedActions: number;
}

export interface SafeguardCheckResult {
  rule: string;
  passed: boolean;
  reason: string;
}

// ─── Performance Metrics ─────────────────────────────────────────────────────
export interface StrategyPerformance {
  strategyId: string;
  totalReturnPercent: number;
  monthlyReturnPercent: number;
  maxDrawdownPercent: number;
  winRate: number;
  totalTrades: number;
  aiReliabilityScore: number;
  sharpeRatio: number | null;
}

// ─── Form Section ID (for accordion navigation) ─────────────────────────────
export type FormSectionId =
  | 'general'
  | 'crypto-universe'
  | 'ai-parameters'
  | 'money-management'
  | 'safeguards'
  | 'trading-conditions'
  | 'advanced'
  | 'simulation';
