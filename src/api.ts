// Retourne le prix spot EUR d'une crypto (ex: 'BTC')
export async function getCryptoSpotPrice(symbol: StrategySymbol): Promise<number> {
  const data = await requestJson<{ priceEur: number }>(
    `/api/market/spot-price?symbol=${encodeURIComponent(symbol)}`,
  );
  return data.priceEur;
}
export type StrategyRiskProfile = 'defensive' | 'balanced' | 'aggressive';
export type StrategyFeePreference = 'taker' | 'maker' | 'hybrid';
export type StrategyDecisionMode = 'allocation_only' | 'rule_based' | 'ai_assisted';
export type PromptType = 'ai_advisor_system' | 'ai_advisor_user' | 'simulation_explainer';
export type OperationSideFilter = 'all' | 'buy' | 'sell';
export type OperationOutcomeFilter = 'successful' | 'failed' | 'all';
export type StrategySymbol =
  | 'BTC'
  | 'ETH'
  | 'SOL'
  | 'LINK'
  | 'USDC'
  | 'XRP'
  | 'DOGE'
  | 'AVAX'
  | 'POLKADOT'
  | 'ARB'
  | 'OP';

export const STRATEGY_SYMBOLS: StrategySymbol[] = [
  'BTC',
  'ETH',
  'SOL',
  'LINK',
  'USDC',
  'XRP',
  'DOGE',
  'AVAX',
  'POLKADOT',
  'ARB',
  'OP',
];
export type StrategyTargetAllocation = Record<StrategySymbol, number>;
export type UserTheme = 'ocean' | 'sunset' | 'forest' | 'slate';
export type UserLanguage = 'fr' | 'en';
export type DefaultLandingPage = 'dashboard' | 'simulations' | 'strategies' | 'insights';

export type StrategyAdvancedSettings = {
  reserveCashPct: number;
  minOrderSizeEur: number;
  slippagePct: number;
  feePreference: StrategyFeePreference;
  takeProfitTargetPct: number;
  stopLossPct: number;
  allowSellAtLoss?: boolean;
  forceSellAfterDowntrendDays?: number;
  forceSellDowntrendThresholdPct?: number;
  requireDipForBuy?: boolean;
  minDipPctToBuy?: number;
  maxDailyPumpPctToBuy?: number;
  decisionMode?: StrategyDecisionMode;
  minAiConfidencePct?: number;
  aiSystemPromptId?: string;
  aiUserPromptId?: string;
};

export type PromptDefinition = {
  id: string;
  type: PromptType;
  name: string;
  description: string;
  content: string;
  isDefault: boolean;
  templateKey: string | null;
  createdAt: string;
  updatedAt: string;
};

type ApiErrorPayload = {
  message?: string;
};

export class ApiHttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiHttpError';
  }
}

export function isUnauthorizedError(error: unknown): boolean {
  return error instanceof ApiHttpError && error.status === 401;
}

export type Strategy = {
  id: string;
  name: string;
  description: string;
  riskProfile: StrategyRiskProfile;
  monthlyBudgetEur: number;
  rebalancingPerDay: number;
  maxPositionPct: number;
  advanced: StrategyAdvancedSettings;
  targetAllocation?: StrategyTargetAllocation;
};

export type PublicStrategyListing = {
  shareId: string;
  ownerAlias: string;
  sourceStrategyId: string | null;
  strategy: Strategy;
  sharedAt: string;
  updatedAt: string;
  isOwnedByRequester: boolean;
};

export type DashboardData = {
  generatedAt: string;
  strategyId: string;
  strategyName: string;
  strategyRiskProfile: StrategyRiskProfile;
  simulationStartDate: string;
  monthlyBudgetEur: number;
  totalInvestedEur: number;
  portfolioValueEur: number;
  totalFeesEur: number;
  realizedPnlEur: number;
  unrealizedPnlEur: number;
  winRatePct: number;
  maxDrawdownPct: number;
  currentAllocation: Array<{ symbol: string; weightPct: number }>;
  equityCurve: Array<{ label: string; value: number }>;
  strategyComparison: Array<{
    strategyId: string;
    strategyName: string;
    riskProfile: StrategyRiskProfile;
    estimatedMonthlyReturnPct: number;
    estimatedDrawdownPct: number;
    score: number;
  }>;
  lastOperations: Array<{
    id: string;
    timestamp: string;
    symbol: string;
    side: 'BUY' | 'SELL';
    amountEur: number;
    priceEur: number;
    feeEur: number;
    status: 'FILLED' | 'REJECTED' | 'PENDING';
  }>;
};

export type MovementDetails = {
  id: string;
  timestamp: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  amountEur: number;
  priceEur: number;
  status: 'FILLED' | 'REJECTED' | 'PENDING';
  feeRatePct: number;
  feeEur: number;
  netAmountEur: number;
  marketSource: 'kraken' | 'coingecko';
  expectedGainPct: number;
  riskLevel: 'low' | 'medium' | 'high';
  fundingSource: 'monthly_envelope' | 'portfolio_rebalance';
  decisionSummary: string;
  expectedGainScenario: string;
  riskScenario: string;
  objectiveContribution: string;
  extraInfo: string;
  aiRecommendationAction: 'BUY' | 'SELL' | 'HOLD';
  aiRecommendationConfidencePct: number;
  aiRecommendationSource: 'llm' | 'fallback';
  aiRecommendationRationale: string;
};

export type InsightsData = {
  generatedAt: string;
  strategyId: string;
  strategyName: string;
  insightScore: number;
  riskLevel: 'low' | 'moderate' | 'high';
  marketRegime: 'bullish' | 'sideways' | 'bearish';
  confidencePct: number;
  metrics: {
    volatility30dPct: number;
    momentum14dPct: number;
    sharpeProxy: number;
    drawdownPct: number;
    exposureConcentrationPct: number;
  };
  alerts: Array<{
    title: string;
    severity: 'info' | 'warning' | 'critical';
    detail: string;
  }>;
  recommendations: Array<{
    id: string;
    title: string;
    priority: 'high' | 'medium' | 'low';
    rationale: string;
    action: string;
  }>;
  allocationAdjustments: Array<{
    symbol: string;
    currentWeightPct: number;
    targetWeightPct: number;
    deltaPct: number;
  }>;
  highlights: Array<{
    title: string;
    impact: 'positive' | 'neutral' | 'negative';
    detail: string;
  }>;
};

export type HistoricalSimulationSummary = {
  id: string;
  strategyId: string;
  strategyName: string;
  groupId?: string;
  groupType?: 'multi_period' | 'multi_strategy';
  periodStart: string;
  periodEnd: string;
  createdAt: string;
  status: 'completed' | 'failed';
  totalInvestedEur: number;
  finalValueEur: number;
  netProfitEur: number;
  returnPct: number;
  totalFeesEur: number;
  operationsCount: number;
  winRatePct: number;
  aiUsage?: {
    decisionMode: StrategyDecisionMode;
    liveEnabled: boolean;
    remoteCalls: number;
  };
  errorMessage?: string;
  failedAtStep?: number;
};

export type HistoricalSimulationReport = {
  assumptions: string[];
  strategySnapshot: Strategy;
  periodStart: string;
  periodEnd: string;
  generatedAt: string;
  initialCapitalEur: number;
  monthlyContributionEur: number;
  contributions: Array<{
    date: string;
    amountEur: number;
    type: 'initial_capital' | 'monthly_contribution';
  }>;
  operations: Array<{
    id: string;
    timestamp: string;
    symbol: StrategySymbol;
    side: 'BUY' | 'SELL';
    status: 'FILLED' | 'REJECTED';
    amountEur: number;
    priceEur: number;
    feeRatePct: number;
    feeEur: number;
    netAmountEur: number;
    expectedGainPct: number;
    aiRecommendationAction?: 'BUY' | 'SELL' | 'HOLD';
    aiRecommendationSource?: 'llm' | 'fallback';
    aiRemoteCallAttempted?: boolean;
    aiRemoteCallOutcome?: 'successful' | 'failed';
    rationale: string;
  }>;
  equityCurve: Array<{
    date: string;
    investedEur: number;
    portfolioValueEur: number;
    cashEur: number;
  }>;
  holdings: Array<{
    symbol: StrategySymbol;
    quantity: number;
    valueEur: number;
    weightPct: number;
  }>;
  aiUsage?: {
    decisionMode: StrategyDecisionMode;
    liveEnabled: boolean;
    remoteCalls: number;
    successfulCalls: number;
    failedCalls: number;
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    estimatedCostEur: number;
  };
  totals: {
    totalInvestedEur: number;
    finalValueEur: number;
    netProfitEur: number;
    returnPct: number;
    totalFeesEur: number;
    operationsCount: number;
    winRatePct: number;
  };
};

export type HistoricalSimulationOperationDetails = {
  simulationId: string;
  strategyId: string;
  strategyName: string;
  operation: HistoricalSimulationReport['operations'][number];
  operationIndex: number;
  navigation: {
    totalOperations: number;
    previousOperationId: string | null;
    nextOperationId: string | null;
  };
  operationDate: string;
  valuationAtOperation: {
    investedEur: number;
    portfolioValueEur: number;
    cashEur: number;
    spotPriceEur: number;
    symbolQuantityBefore: number;
    symbolValueBeforeEur: number;
    symbolWeightBeforePct: number;
  };
  pnl: {
    realizedGainEur: number | null;
    realizedGainPct: number | null;
    expectedGainEur: number | null;
    expectedGainPct: number;
    breakEvenPriceEur: number | null;
  };
  decision: {
    summary: string;
    rationale: string;
    riskContext: string;
    objectiveContribution: string;
  };
  charts: {
    portfolioCurveToOperation: HistoricalSimulationReport['equityCurve'];
    symbolPriceCurveToOperation: Array<{ date: string; priceEur: number }>;
  };
};

export type StrategyOverrideInput = {
  riskProfile?: StrategyRiskProfile;
  monthlyBudgetEur?: number;
  rebalancingPerDay?: number;
  maxPositionPct?: number;
  advanced?: Partial<StrategyAdvancedSettings>;
  targetAllocation?: Partial<StrategyTargetAllocation>;
};

export type HistoricalSimulationRunSessionStatus = 'pending' | 'running' | 'completed' | 'failed';

export type HistoricalSimulationRunProgress = {
  sessionId: string;
  status: HistoricalSimulationRunSessionStatus;
  progressPct: number;
  processedSteps: number;
  totalSteps: number;
  aiCalls: number;
  aiCallsSuccessful: number;
  aiCallsFailed: number;
  aiPromptTokens: number;
  aiCompletionTokens: number;
  aiTotalTokens: number;
  aiCostEur: number;
  executedOperations: number;
  lastOperations: Array<{
    id: string;
    timestamp: string;
    symbol: StrategySymbol;
    side: 'BUY' | 'SELL';
    status: 'FILLED' | 'REJECTED';
    amountEur: number;
    rationale: string;
  }>;
  startedAt: string;
  updatedAt: string;
  finishedAt: string | null;
  runId: string | null;
  errorMessage: string;
};

export type HistoricalSimulationRunSession = {
  progress: HistoricalSimulationRunProgress;
  result: {
    run: HistoricalSimulationSummary;
    report: HistoricalSimulationReport;
  } | null;
};

export type AdvancedBacktestingRunScope = 'period' | 'strategy';

export type AdvancedBacktestingRunProgress = {
  sessionId: string;
  scope: AdvancedBacktestingRunScope;
  labels: string[];
  status: HistoricalSimulationRunSessionStatus;
  progressPct: number;
  processedItems: number;
  totalItems: number;
  aiCallsTotal: number;
  aiCallsByLabel: number[];
  startedAt: string;
  updatedAt: string;
  finishedAt: string | null;
  errorMessage: string;
};

export type AdvancedBacktestingRunSession = {
  progress: AdvancedBacktestingRunProgress;
  result:
    | {
        kind: 'multi_period';
        backtest: AdvancedBacktestingResult;
      }
    | {
        kind: 'comparison';
        comparison: AdvancedBacktestingComparisonResult;
      }
    | null;
};

export type AdvancedBacktestPeriodInput = {
  periodStart: string;
  periodEnd: string;
};

export type AdvancedBacktestingResult = {
  strategyId: string;
  strategyName: string;
  generatedAt: string;
  periods: Array<{
    periodStart: string;
    periodEnd: string;
    summary: HistoricalSimulationSummary;
  }>;
  aggregate: {
    averageReturnPct: number;
    bestReturnPct: number;
    worstReturnPct: number;
    positiveRatePct: number;
    averageWinRatePct: number;
    averageFinalValueEur: number;
    totalOperations: number;
  };
  monteCarlo: {
    iterations: number;
    horizonMonths: number;
    seedReturnsCount: number;
    startValueEur: number;
    monthlyContributionEur: number;
    p10FinalValueEur: number;
    p50FinalValueEur: number;
    p90FinalValueEur: number;
    expectedFinalValueEur: number;
    curve: Array<{
      month: number;
      p10ValueEur: number;
      p50ValueEur: number;
      p90ValueEur: number;
    }>;
  };
};

export type AdvancedBacktestingComparisonResult = {
  generatedAt: string;
  periodStart: string;
  periodEnd: string;
  bestStrategyId: string;
  strategies: Array<{
    strategyId: string;
    strategyName: string;
    summary: HistoricalSimulationSummary;
  }>;
  ranking: Array<{
    rank: number;
    strategyId: string;
    strategyName: string;
    returnPct: number;
    netProfitEur: number;
    finalValueEur: number;
    winRatePct: number;
    operationsCount: number;
    deltaVsBestReturnPct: number;
    deltaVsBestNetProfitEur: number;
  }>;
};

export type UserProfile = {
  firstName: string;
  lastName: string;
  birthDate: string;
  country: string;
  city: string;
  timezone: string;
  occupation: string;
  bio: string;
  investmentExperience: 'beginner' | 'intermediate' | 'advanced';
};

export type UserSettings = {
  theme: UserTheme;
  language: UserLanguage;
  aiAdvisorEnabled: boolean;
  defaultLandingPage: DefaultLandingPage;
  showTooltips: boolean;
  denseTables: boolean;
  aiAdvisor: UserAiAdvisorSettings;
};

export type AiProvider = 'openai' | 'anthropic' | 'gemini';

export type UserAiAdvisorSettings = {
  provider: AiProvider;
  model: string;
  baseUrl: string;
  temperature: number;
  timeoutMs: number;
  maxPromptTokensPerCall: number;
  maxCompletionTokensPerCall: number;
  maxCallsPerDay: number;
  maxCostEurPerDay: number;
  inputCostPer1MTokensUsd: number;
  outputCostPer1MTokensUsd: number;
  usdToEurRate: number;
  pricingSource: string;
  pricingUpdatedAt: string;
  apiKeySet: boolean;
  apiKeyMasked: string;
};

export type UserAiAdvisorSettingsInput = Partial<
  Omit<UserAiAdvisorSettings, 'apiKeySet' | 'apiKeyMasked'>
> & {
  apiKey?: string;
  clearApiKey?: boolean;
};

export type UserSettingsUpdateInput = Partial<Omit<UserSettings, 'aiAdvisor'>> & {
  aiAdvisor?: UserAiAdvisorSettingsInput;
};

export type UserAiUsage = {
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCostUsd: number;
  estimatedCostEur: number;
  averageDurationMs: number;
  lastDurationMs: number;
  lastCallAt: string;
  lastModel: string;
  updatedAt: string;
};

export type UserAiCallMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

export type UserAiCallRequestPayload = {
  endpoint: string;
  model: string;
  temperature: number;
  timeoutMs: number;
  messages: UserAiCallMessage[];
};

export type UserAiCallResponsePayload = {
  providerStatus: 'success' | 'error';
  responseModel: string;
  finishReason: string;
  rawText: string;
  parsedRecommendation: Record<string, unknown> | null;
  errorMessage: string;
  httpStatus: number | null;
};

export type UserAiCallRecord = {
  id: string;
  success: boolean;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCostUsd: number;
  estimatedCostEur: number;
  durationMs: number;
  model: string;
  calledAt: string;
  createdAt: string;
  requestPayload: UserAiCallRequestPayload;
  responsePayload: UserAiCallResponsePayload;
};

export type AiAdvisorConfigurationTestResult = {
  ok: boolean;
  provider: AiProvider;
  model: string;
  endpoint: string;
  durationMs: number;
  statusCode: number | null;
  finishReason: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  outputPreview: string;
  pricing: {
    inputCostPer1MTokensUsd: number;
    outputCostPer1MTokensUsd: number;
    usdToEurRate: number;
    pricingSource: string;
    pricingUpdatedAt: string;
  };
  errorMessage: string;
};

async function requestJson<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const response = await fetch(input, init);
  const contentType = response.headers.get('content-type') ?? '';

  let payload: unknown = null;
  if (contentType.includes('application/json')) {
    payload = await response.json();
  } else {
    payload = await response.text();
  }

  if (!response.ok) {
    const rawMessage =
      typeof payload === 'object' &&
      payload !== null &&
      'message' in payload &&
      typeof (payload as ApiErrorPayload).message === 'string'
        ? (payload as ApiErrorPayload).message
        : undefined;
    const message = rawMessage ?? `HTTP ${response.status}`;
    throw new ApiHttpError(response.status, message);
  }

  return payload as T;
}

export async function getStrategies(): Promise<Strategy[]> {
  const data = await requestJson<{ strategies?: Strategy[] }>('/api/strategies');
  if (Array.isArray(data.strategies)) {
    return data.strategies.map((strategy) => normalizeStrategy(strategy));
  }
  return [];
}

export async function getDashboard(strategyId: string): Promise<DashboardData> {
  return requestJson<DashboardData>('/api/dashboard?strategyId=' + encodeURIComponent(strategyId));
}

export async function getMovement(
  movementId: string,
  strategyId: string,
): Promise<MovementDetails> {
  return requestJson<MovementDetails>(
    '/api/movements/' +
      encodeURIComponent(movementId) +
      '?strategyId=' +
      encodeURIComponent(strategyId),
  );
}

export async function getInsights(strategyId: string): Promise<InsightsData> {
  return requestJson<InsightsData>('/api/insights?strategyId=' + encodeURIComponent(strategyId));
}

export async function getStrategyConfig(): Promise<{
  path: string;
  content: string;
}> {
  return requestJson<{ path: string; content: string }>('/api/strategy-config');
}

export async function saveStrategyConfig(
  content: string,
): Promise<{ path: string; savedAt: string }> {
  return requestJson<{ path: string; savedAt: string }>('/api/strategy-config', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ content }),
  });
}

export async function createStrategy(input: {
  name: string;
  description: string;
  riskProfile: StrategyRiskProfile;
  monthlyBudgetEur: number;
  rebalancingPerDay: number;
  maxPositionPct: number;
  advanced: StrategyAdvancedSettings;
  targetAllocation: StrategyTargetAllocation;
}): Promise<{ created: Strategy; strategies: Strategy[] }> {
  const payload = await requestJson<{
    created: Strategy;
    strategies?: Strategy[];
  }>('/api/strategies', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });
  return {
    created: normalizeStrategy(payload.created),
    strategies: Array.isArray(payload.strategies)
      ? payload.strategies.map((strategy) => normalizeStrategy(strategy))
      : [],
  };
}

export async function updateStrategy(
  strategyId: string,
  input: {
    name: string;
    description: string;
    riskProfile: StrategyRiskProfile;
    monthlyBudgetEur: number;
    rebalancingPerDay: number;
    maxPositionPct: number;
    advanced: StrategyAdvancedSettings;
    targetAllocation: StrategyTargetAllocation;
  },
): Promise<{ updated: Strategy; strategies: Strategy[] }> {
  const payload = await requestJson<{
    updated: Strategy;
    strategies?: Strategy[];
  }>('/api/strategies/' + encodeURIComponent(strategyId), {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });
  return {
    updated: normalizeStrategy(payload.updated),
    strategies: Array.isArray(payload.strategies)
      ? payload.strategies.map((strategy) => normalizeStrategy(strategy))
      : [],
  };
}

export async function duplicateStrategy(
  strategyId: string,
): Promise<{ duplicated: Strategy; strategies: Strategy[] }> {
  const payload = await requestJson<{
    duplicated: Strategy;
    strategies?: Strategy[];
  }>('/api/strategies/' + encodeURIComponent(strategyId) + '/duplicate', {
    method: 'POST',
  });
  return {
    duplicated: normalizeStrategy(payload.duplicated),
    strategies: Array.isArray(payload.strategies)
      ? payload.strategies.map((strategy) => normalizeStrategy(strategy))
      : [],
  };
}

export async function deleteStrategy(
  strategyId: string,
): Promise<{ deletedId: string; strategies: Strategy[] }> {
  const payload = await requestJson<{
    deletedId: string;
    strategies?: Strategy[];
  }>('/api/strategies/' + encodeURIComponent(strategyId), {
    method: 'DELETE',
  });
  return {
    deletedId: payload.deletedId,
    strategies: Array.isArray(payload.strategies)
      ? payload.strategies.map((strategy) => normalizeStrategy(strategy))
      : [],
  };
}

export async function resetDefaultStrategies(): Promise<{
  strategies: Strategy[];
}> {
  const payload = await requestJson<{ strategies?: Strategy[] }>('/api/strategies/reset-defaults', {
    method: 'POST',
  });
  return {
    strategies: Array.isArray(payload.strategies)
      ? payload.strategies.map((strategy) => normalizeStrategy(strategy))
      : [],
  };
}

export async function listPublicStrategies(): Promise<PublicStrategyListing[]> {
  const payload = await requestJson<{
    strategies?: Array<{
      shareId: string;
      ownerAlias: string;
      sourceStrategyId: string | null;
      strategy: Strategy;
      sharedAt: string;
      updatedAt: string;
      isOwnedByRequester: boolean;
    }>;
  }>('/api/strategies/public');

  return Array.isArray(payload.strategies)
    ? payload.strategies.map((row) => ({
        ...row,
        strategy: normalizeStrategy(row.strategy),
      }))
    : [];
}

export async function shareStrategy(strategyId: string): Promise<{
  shared: PublicStrategyListing;
  strategies: PublicStrategyListing[];
}> {
  const payload = await requestJson<{
    shared: PublicStrategyListing;
    strategies?: PublicStrategyListing[];
  }>('/api/strategies/' + encodeURIComponent(strategyId) + '/share', {
    method: 'POST',
  });

  return {
    shared: {
      ...payload.shared,
      strategy: normalizeStrategy(payload.shared.strategy),
    },
    strategies: Array.isArray(payload.strategies)
      ? payload.strategies.map((row) => ({
          ...row,
          strategy: normalizeStrategy(row.strategy),
        }))
      : [],
  };
}

export async function unshareStrategy(
  shareId: string,
): Promise<{ deletedId: string; strategies: PublicStrategyListing[] }> {
  const payload = await requestJson<{
    deletedId: string;
    strategies?: PublicStrategyListing[];
  }>('/api/strategies/public/' + encodeURIComponent(shareId), {
    method: 'DELETE',
  });

  return {
    deletedId: payload.deletedId,
    strategies: Array.isArray(payload.strategies)
      ? payload.strategies.map((row) => ({
          ...row,
          strategy: normalizeStrategy(row.strategy),
        }))
      : [],
  };
}

export async function importPublicStrategy(
  shareId: string,
): Promise<{ imported: Strategy; strategies: Strategy[] }> {
  const payload = await requestJson<{
    imported: Strategy;
    strategies?: Strategy[];
  }>('/api/strategies/public/' + encodeURIComponent(shareId) + '/import', {
    method: 'POST',
  });

  return {
    imported: normalizeStrategy(payload.imported),
    strategies: Array.isArray(payload.strategies)
      ? payload.strategies.map((strategy) => normalizeStrategy(strategy))
      : [],
  };
}

export async function listHistoricalSimulations(): Promise<HistoricalSimulationSummary[]> {
  const payload = await requestJson<{
    simulations?: HistoricalSimulationSummary[];
  }>('/api/simulations');
  return Array.isArray(payload.simulations) ? payload.simulations : [];
}

export async function getHistoricalSimulation(simulationId: string): Promise<{
  run: HistoricalSimulationSummary;
  report: HistoricalSimulationReport;
  override: StrategyOverrideInput;
}> {
  return requestJson<{
    run: HistoricalSimulationSummary;
    report: HistoricalSimulationReport;
    override: StrategyOverrideInput;
  }>('/api/simulations/' + encodeURIComponent(simulationId));
}

export async function deleteHistoricalSimulation(
  simulationId: string,
): Promise<{ deletedId: string }> {
  return requestJson<{ deletedId: string }>(
    '/api/simulations/' + encodeURIComponent(simulationId),
    {
      method: 'DELETE',
    },
  );
}

export async function deleteAllHistoricalSimulations(): Promise<{
  deletedCount: number;
}> {
  return requestJson<{ deletedCount: number }>('/api/simulations', {
    method: 'DELETE',
  });
}

export async function getHistoricalSimulationOperation(
  simulationId: string,
  operationId: string,
  filters?: {
    side?: OperationSideFilter;
    outcome?: OperationOutcomeFilter;
  },
): Promise<HistoricalSimulationOperationDetails> {
  const query = new URLSearchParams();
  if (filters?.side) {
    query.set('side', filters.side);
  }
  if (filters?.outcome) {
    query.set('outcome', filters.outcome);
  }
  const suffix = query.toString() ? `?${query.toString()}` : '';
  return requestJson<HistoricalSimulationOperationDetails>(
    '/api/simulations/' +
      encodeURIComponent(simulationId) +
      '/operations/' +
      encodeURIComponent(operationId) +
      suffix,
  );
}

export async function runHistoricalSimulation(input: {
  strategyId: string;
  periodStart: string;
  periodEnd: string;
  override?: StrategyOverrideInput;
  useLiveAiInSimulation?: boolean;
}): Promise<{
  run: HistoricalSimulationSummary;
  report: HistoricalSimulationReport;
}> {
  return requestJson<{
    run: HistoricalSimulationSummary;
    report: HistoricalSimulationReport;
  }>('/api/simulations/run', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });
}

export async function startHistoricalSimulationRunSession(input: {
  strategyId: string;
  periodStart: string;
  periodEnd: string;
  override?: StrategyOverrideInput;
  useLiveAiInSimulation?: boolean;
}): Promise<{ session: HistoricalSimulationRunSession }> {
  return requestJson<{ session: HistoricalSimulationRunSession }>('/api/simulations/run/sessions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });
}

export async function getHistoricalSimulationRunSession(
  sessionId: string,
): Promise<{ session: HistoricalSimulationRunSession }> {
  return requestJson<{ session: HistoricalSimulationRunSession }>(
    '/api/simulations/run/sessions/' + encodeURIComponent(sessionId),
  );
}

export async function startAdvancedBacktestingRunSession(input: {
  strategyId: string;
  periods: AdvancedBacktestPeriodInput[];
  override?: StrategyOverrideInput;
  useLiveAiInSimulation?: boolean;
  monteCarloIterations?: number;
  monteCarloHorizonMonths?: number;
}): Promise<{ session: AdvancedBacktestingRunSession }> {
  return requestJson<{ session: AdvancedBacktestingRunSession }>(
    '/api/simulations/advanced-backtest/sessions',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    },
  );
}

export async function startAdvancedBacktestingComparisonRunSession(input: {
  strategyIds: string[];
  periodStart: string;
  periodEnd: string;
  override?: StrategyOverrideInput;
  useLiveAiInSimulation?: boolean;
}): Promise<{ session: AdvancedBacktestingRunSession }> {
  return requestJson<{ session: AdvancedBacktestingRunSession }>(
    '/api/simulations/advanced-backtest/comparison/sessions',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    },
  );
}

export async function getAdvancedBacktestingRunSession(
  sessionId: string,
): Promise<{ session: AdvancedBacktestingRunSession }> {
  return requestJson<{ session: AdvancedBacktestingRunSession }>(
    '/api/simulations/advanced-backtest/sessions/' + encodeURIComponent(sessionId),
  );
}

export async function runAdvancedBacktesting(input: {
  strategyId: string;
  periods: AdvancedBacktestPeriodInput[];
  override?: StrategyOverrideInput;
  useLiveAiInSimulation?: boolean;
  monteCarloIterations?: number;
  monteCarloHorizonMonths?: number;
}): Promise<{ backtest: AdvancedBacktestingResult }> {
  return requestJson<{ backtest: AdvancedBacktestingResult }>(
    '/api/simulations/advanced-backtest',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    },
  );
}

export async function runAdvancedBacktestingComparison(input: {
  strategyIds: string[];
  periodStart: string;
  periodEnd: string;
  override?: StrategyOverrideInput;
  useLiveAiInSimulation?: boolean;
}): Promise<{ comparison: AdvancedBacktestingComparisonResult }> {
  return requestJson<{ comparison: AdvancedBacktestingComparisonResult }>(
    '/api/simulations/advanced-backtest/comparison',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    },
  );
}

function normalizeStrategy(strategy: Strategy): Strategy {
  const fallbackTargetAllocation = defaultTargetAllocationByRisk(strategy.riskProfile);
  return {
    ...strategy,
    advanced: {
      reserveCashPct: strategy.advanced?.reserveCashPct ?? 6,
      minOrderSizeEur: strategy.advanced?.minOrderSizeEur ?? 6,
      slippagePct: strategy.advanced?.slippagePct ?? 0.12,
      feePreference: strategy.advanced?.feePreference ?? 'maker',
      takeProfitTargetPct: strategy.advanced?.takeProfitTargetPct ?? 4.8,
      stopLossPct: strategy.advanced?.stopLossPct ?? 2.6,
      allowSellAtLoss: strategy.advanced?.allowSellAtLoss ?? false,
      forceSellAfterDowntrendDays: strategy.advanced?.forceSellAfterDowntrendDays ?? 10,
      forceSellDowntrendThresholdPct: strategy.advanced?.forceSellDowntrendThresholdPct ?? 6,
      requireDipForBuy: strategy.advanced?.requireDipForBuy ?? true,
      minDipPctToBuy: strategy.advanced?.minDipPctToBuy ?? 0.5,
      maxDailyPumpPctToBuy: strategy.advanced?.maxDailyPumpPctToBuy ?? 2.6,
      decisionMode: strategy.advanced?.decisionMode ?? 'ai_assisted',
      aiSystemPromptId: strategy.advanced?.aiSystemPromptId ?? 'ai-advisor-system-default',
      aiUserPromptId: strategy.advanced?.aiUserPromptId ?? 'ai-advisor-user-default',
    },
    targetAllocation: {
      BTC: strategy.targetAllocation?.BTC ?? fallbackTargetAllocation.BTC,
      ETH: strategy.targetAllocation?.ETH ?? fallbackTargetAllocation.ETH,
      SOL: strategy.targetAllocation?.SOL ?? fallbackTargetAllocation.SOL,
      LINK: strategy.targetAllocation?.LINK ?? fallbackTargetAllocation.LINK,
      USDC: strategy.targetAllocation?.USDC ?? fallbackTargetAllocation.USDC,
      XRP: strategy.targetAllocation?.XRP ?? fallbackTargetAllocation.XRP,
      DOGE: strategy.targetAllocation?.DOGE ?? fallbackTargetAllocation.DOGE,
      AVAX: strategy.targetAllocation?.AVAX ?? fallbackTargetAllocation.AVAX,
      POLKADOT: strategy.targetAllocation?.POLKADOT ?? fallbackTargetAllocation.POLKADOT,
      ARB: strategy.targetAllocation?.ARB ?? fallbackTargetAllocation.ARB,
      OP: strategy.targetAllocation?.OP ?? fallbackTargetAllocation.OP,
    },
  };
}

function defaultTargetAllocationByRisk(riskProfile: StrategyRiskProfile): StrategyTargetAllocation {
  if (riskProfile === 'defensive') {
    return {
      BTC: 55,
      ETH: 30,
      SOL: 4,
      LINK: 3,
      USDC: 8,
      XRP: 0,
      DOGE: 0,
      AVAX: 0,
      POLKADOT: 0,
      ARB: 0,
      OP: 0,
    };
  }
  if (riskProfile === 'aggressive') {
    return {
      BTC: 43,
      ETH: 32,
      SOL: 15,
      LINK: 10,
      USDC: 0,
      XRP: 0,
      DOGE: 0,
      AVAX: 0,
      POLKADOT: 0,
      ARB: 0,
      OP: 0,
    };
  }
  return {
    BTC: 50,
    ETH: 34,
    SOL: 10,
    LINK: 4,
    USDC: 2,
    XRP: 0,
    DOGE: 0,
    AVAX: 0,
    POLKADOT: 0,
    ARB: 0,
    OP: 0,
  };
}

export async function getLoginStatus(): Promise<{
  authDisabled: boolean;
  googleSsoConfigured: boolean;
  authenticated: boolean;
  user?: { email: string; displayName: string };
}> {
  return requestJson<{
    authDisabled: boolean;
    googleSsoConfigured: boolean;
    authenticated: boolean;
    user?: { email: string; displayName: string };
  }>('/auth/login-status');
}

export async function getCurrentUser(): Promise<{
  authenticated: boolean;
  user?: {
    provider: 'google';
    providerId: string;
    email: string;
    displayName: string;
    picture: string;
  };
}> {
  return requestJson<{
    authenticated: boolean;
    user?: {
      provider: 'google';
      providerId: string;
      email: string;
      displayName: string;
      picture: string;
    };
  }>('/auth/me');
}

export async function getUserProfile(): Promise<{ profile: UserProfile }> {
  return requestJson<{ profile: UserProfile }>('/api/user/profile');
}

export async function saveUserProfile(
  input: Partial<UserProfile>,
): Promise<{ profile: UserProfile; savedAt: string }> {
  return requestJson<{ profile: UserProfile; savedAt: string }>('/api/user/profile', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });
}

export async function getUserSettings(): Promise<{ settings: UserSettings }> {
  return requestJson<{ settings: UserSettings }>('/api/user/settings');
}

export async function getUserAiUsage(): Promise<{ usage: UserAiUsage }> {
  return requestJson<{ usage: UserAiUsage }>('/api/user/ai-usage');
}

export async function getUserAiUsageCalls(limit = 100): Promise<{
  calls: UserAiCallRecord[];
}> {
  const query = '?limit=' + encodeURIComponent(String(limit));
  return requestJson<{
    calls: UserAiCallRecord[];
  }>('/api/user/ai-usage/calls' + query);
}

export async function getUserAiUsageCall(callId: string): Promise<{ call: UserAiCallRecord }> {
  return requestJson<{ call: UserAiCallRecord }>(
    '/api/user/ai-usage/calls/' + encodeURIComponent(callId),
  );
}

export async function saveUserSettings(
  input: UserSettingsUpdateInput,
): Promise<{ settings: UserSettings; savedAt: string }> {
  return requestJson<{ settings: UserSettings; savedAt: string }>('/api/user/settings', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });
}

export async function testUserAiAdvisorConfiguration(
  input?: UserAiAdvisorSettingsInput,
): Promise<AiAdvisorConfigurationTestResult> {
  return requestJson<AiAdvisorConfigurationTestResult>('/api/user/ai-advisor/test', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input ?? {}),
  });
}

export async function listPrompts(type?: PromptType): Promise<PromptDefinition[]> {
  const suffix = type ? '?type=' + encodeURIComponent(type) : '';
  const payload = await requestJson<{ prompts?: PromptDefinition[] }>('/api/prompts' + suffix);
  return Array.isArray(payload.prompts) ? payload.prompts : [];
}

export async function createPrompt(input: {
  type: PromptType;
  name: string;
  description: string;
  content: string;
}): Promise<{ created: PromptDefinition; prompts: PromptDefinition[] }> {
  const payload = await requestJson<{
    created: PromptDefinition;
    prompts?: PromptDefinition[];
  }>('/api/prompts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });
  return {
    created: payload.created,
    prompts: Array.isArray(payload.prompts) ? payload.prompts : [],
  };
}

export async function updatePrompt(
  promptId: string,
  input: Partial<Pick<PromptDefinition, 'name' | 'description' | 'content'>>,
): Promise<{ updated: PromptDefinition; prompts: PromptDefinition[] }> {
  const payload = await requestJson<{
    updated: PromptDefinition;
    prompts?: PromptDefinition[];
  }>('/api/prompts/' + encodeURIComponent(promptId), {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });
  return {
    updated: payload.updated,
    prompts: Array.isArray(payload.prompts) ? payload.prompts : [],
  };
}

export async function deletePrompt(
  promptId: string,
): Promise<{ deletedId: string; prompts: PromptDefinition[] }> {
  const payload = await requestJson<{
    deletedId: string;
    prompts?: PromptDefinition[];
  }>('/api/prompts/' + encodeURIComponent(promptId), {
    method: 'DELETE',
  });
  return {
    deletedId: payload.deletedId,
    prompts: Array.isArray(payload.prompts) ? payload.prompts : [],
  };
}

export async function resetDefaultPrompts(type?: PromptType): Promise<{
  prompts: PromptDefinition[];
}> {
  const endpoint = type
    ? '/api/prompts/reset-defaults/' + encodeURIComponent(type)
    : '/api/prompts/reset-defaults';
  const payload = await requestJson<{ prompts?: PromptDefinition[] }>(endpoint, {
    method: 'POST',
  });
  return {
    prompts: Array.isArray(payload.prompts) ? payload.prompts : [],
  };
}

export async function resetPromptToDefault(promptId: string): Promise<{
  updated: PromptDefinition;
  prompts: PromptDefinition[];
}> {
  const payload = await requestJson<{
    updated: PromptDefinition;
    prompts?: PromptDefinition[];
  }>('/api/prompts/' + encodeURIComponent(promptId) + '/reset-default', {
    method: 'POST',
  });
  return {
    updated: payload.updated,
    prompts: Array.isArray(payload.prompts) ? payload.prompts : [],
  };
}

// Strategy Wizard API

export type PromptTemplate = {
  id: 'defensive' | 'balanced' | 'aggressive';
  name: string;
  preview: string;
};

export type Safeguards = {
  monthlyBudgetEur: number;
  maxDailySpendEur: number;
  decisionChecksPerDay: number;
  minAiConfidencePctForExecution?: number;
  maxPositionSizeEur: number;
  maxConcurrentPositions: number;
  minOrderSizeEur: number;
  rebalancingEnabled: boolean;
  acceptLosses: boolean;
};

export type AllocationConfig = {
  BTC?: number;
  ETH?: number;
  SOL?: number;
  XRP?: number;
  DOGE?: number;
  AVAX?: number;
  POLKADOT?: number;
  LINK?: number;
  ARB?: number;
  OP?: number;
  rebalancingFrequencyDays: number;
  rebalancingThresholdPct: number;
};

export type AiAssistedConfig = {
  cryptoSymbols: string[];
  aiQueryFrequencyDays: number;
  promptTemplate?: 'defensive' | 'balanced' | 'aggressive';
  customPrompt?: string;
  maxCostPerCallEur?: number;
  maxCallsPerMonth?: number;
  maxSessionDurationMinutes?: number;
  maxConcurrentPositions?: number;
};

export type HistoricalSignalsConfig = {
  cryptoSymbols: string[];
  lookbackDays: number;
  buyDropThresholdPct: number;
  sellRiseThresholdPct: number;
  maxCapitalPerSignalPct: number;
  trendLookbackDays?: number;
  maxVolatilityPct?: number;
  minDaysBetweenTrades?: number;
};

export type StrategyProfile = {
  id: string;
  ownerId: string;
  name: string;
  description: string;
  riskLevel: 'defensive' | 'balanced' | 'aggressive';
  type: 'allocation' | 'ai_assisted' | 'historical_signals';
  config: AllocationConfig | AiAssistedConfig | HistoricalSignalsConfig;
  safeguards: Safeguards;
  createdAt: string;
  updatedAt: string;
};

export async function getWizardPromptTemplates(): Promise<{
  templates: PromptTemplate[];
}> {
  return requestJson('/api/strategies/wizard/prompts/templates');
}

export async function getWizardPromptTemplate(
  templateName: 'defensive' | 'balanced' | 'aggressive',
): Promise<{ content: string }> {
  return requestJson('/api/strategies/wizard/prompts/' + encodeURIComponent(templateName));
}

export async function getWizardDefaultSafeguards(
  riskLevel: 'defensive' | 'balanced' | 'aggressive',
): Promise<Safeguards> {
  return requestJson('/api/strategies/wizard/safeguards/' + encodeURIComponent(riskLevel));
}

export async function validateAllocationConfig(config: AllocationConfig): Promise<{
  isValid: boolean;
  errors: string[];
  config?: AllocationConfig;
}> {
  return requestJson('/api/strategies/wizard/allocation/validate', {
    method: 'POST',
    body: JSON.stringify(config),
  });
}

export async function validateAiAssistedConfig(config: AiAssistedConfig): Promise<{
  isValid: boolean;
  errors: string[];
  config?: AiAssistedConfig;
}> {
  return requestJson('/api/strategies/wizard/ai-assisted/validate', {
    method: 'POST',
    body: JSON.stringify(config),
  });
}

export async function createWizardStrategy(input: {
  name: string;
  description: string;
  riskLevel: 'defensive' | 'balanced' | 'aggressive';
  type: 'allocation' | 'ai_assisted' | 'historical_signals';
  allocationConfig?: AllocationConfig;
  aiConfig?: AiAssistedConfig;
  historicalConfig?: HistoricalSignalsConfig;
  safeguards: Safeguards;
}): Promise<{ strategy: StrategyProfile }> {
  return requestJson('/api/strategies/wizard/create', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function listWizardStrategies(): Promise<{
  strategies: StrategyProfile[];
}> {
  return requestJson('/api/strategies/wizard/list');
}

export async function getWizardStrategy(strategyId: string): Promise<{
  strategy: StrategyProfile;
}> {
  return requestJson('/api/strategies/wizard/' + encodeURIComponent(strategyId));
}

export async function updateWizardStrategy(
  strategyId: string,
  input: Partial<{
    name: string;
    description: string;
    riskLevel: 'defensive' | 'balanced' | 'aggressive';
    type: 'allocation' | 'ai_assisted' | 'historical_signals';
    allocationConfig?: AllocationConfig;
    aiConfig?: AiAssistedConfig;
    historicalConfig?: HistoricalSignalsConfig;
    safeguards: Safeguards;
  }>,
): Promise<{ strategy: StrategyProfile }> {
  return requestJson('/api/strategies/wizard/' + encodeURIComponent(strategyId), {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}

export async function deleteWizardStrategy(strategyId: string): Promise<{
  deleted: boolean;
}> {
  return requestJson('/api/strategies/wizard/' + encodeURIComponent(strategyId), {
    method: 'DELETE',
  });
}

export async function resetWizardDefaultStrategies(): Promise<{
  strategies: StrategyProfile[];
}> {
  return requestJson('/api/strategies/wizard/reset-defaults', {
    method: 'POST',
  });
}

export async function exportWizardStrategies(): Promise<{
  schemaVersion: 1;
  exportedAt: string;
  strategies: Array<{
    name: string;
    description: string;
    riskLevel: 'defensive' | 'balanced' | 'aggressive';
    type: 'allocation' | 'ai_assisted' | 'historical_signals';
    config: AllocationConfig | AiAssistedConfig | HistoricalSignalsConfig;
    safeguards: Safeguards;
  }>;
}> {
  return requestJson('/api/strategies/wizard/export');
}

export async function importWizardStrategies(input: {
  schemaVersion: 1;
  exportedAt: string;
  strategies: Array<{
    name: string;
    description: string;
    riskLevel: 'defensive' | 'balanced' | 'aggressive';
    type: 'allocation' | 'ai_assisted' | 'historical_signals';
    allocationConfig?: AllocationConfig;
    aiConfig?: AiAssistedConfig;
    historicalConfig?: HistoricalSignalsConfig;
    safeguards: Safeguards;
  }>;
}): Promise<{ imported: number; strategies: StrategyProfile[] }> {
  return requestJson('/api/strategies/wizard/import', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}
