export interface StrategyWizardState {
  importInputRef: React.RefObject<HTMLInputElement>;
  currentStep: WizardStep;
  setCurrentStep: (step: WizardStep) => void;
  strategies: any[];
  setStrategies: (strategies: any[]) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  status: string;
  setStatus: (status: string) => void;
  statusKind: 'success' | 'error';
  setStatusKind: (kind: 'success' | 'error') => void;
  editingStrategyId: string | null;
  setEditingStrategyId: (id: string | null) => void;
  strategyPreview: StrategyPreviewResult | null;
  setStrategyPreview: (preview: StrategyPreviewResult | null) => void;
  name: string;
  setName: (name: string) => void;
  description: string;
  setDescription: (desc: string) => void;
  riskLevel: StrategyRiskLevel;
  setRiskLevel: (level: StrategyRiskLevel) => void;
  strategyType: StrategyType;
  setStrategyType: (type: StrategyType) => void;
  promptTemplates: any[];
  setPromptTemplates: (templates: any[]) => void;
  selectedTemplate: 'defensive' | 'balanced' | 'aggressive';
  setSelectedTemplate: (
    template: 'defensive' | 'balanced' | 'aggressive',
  ) => void;
  selectedPromptContent: string;
  setSelectedPromptContent: (content: string) => void;
  customPrompt: string;
  setCustomPrompt: (prompt: string) => void;
  showPromptPreview: boolean;
  setShowPromptPreview: (show: boolean) => void;
  promptValidation: { isValid: boolean; warnings: string[] };
  setPromptValidation: (validation: {
    isValid: boolean;
    warnings: string[];
  }) => void;
  safeguards: SafeguardsDefaults;
  setSafeguards: (safeguards: SafeguardsDefaults) => void;
  allocationRebalancingFrequencyDays: number;
  setAllocationRebalancingFrequencyDays: (days: number) => void;
  allocationRebalancingThresholdPct: number;
  setAllocationRebalancingThresholdPct: (pct: number) => void;
  aiGuardrails: AiGuardrails;
  setAiGuardrails: (guardrails: AiGuardrails) => void;
  historicalLevers: HistoricalLevers;
  setHistoricalLevers: (levers: HistoricalLevers) => void;
  cryptoSymbols: string[];
  setCryptoSymbols: (symbols: string[]) => void;
  allocation: Record<string, number>;
  setAllocation: (allocation: Record<string, number>) => void;
  handleListStrategies: () => Promise<void>;
  handleLoadPromptTemplates: () => Promise<void>;
  validateCustomPrompt: (prompt: string) => void;
  buildPreview: () => StrategyPreviewResult;
  defaultSafeguardsByRisk: (level: StrategyRiskLevel) => SafeguardsDefaults;
  defaultAiGuardrails: () => AiGuardrails;
  defaultHistoricalLeversByRisk: (level: StrategyRiskLevel) => HistoricalLevers;
  getDefaultCryptoSymbols: () => string[];
  getDefaultAllocation: () => Record<string, number>;
}
export type WizardStep =
  | 'list'
  | 'step1-info'
  | 'step2-type'
  | 'step3-config'
  | 'step4-safeguards'
  | 'step5-review';

export type StrategyRiskLevel = 'defensive' | 'balanced' | 'aggressive';
export type StrategyType = 'allocation' | 'ai_assisted' | 'historical_signals';

export interface SafeguardsDefaults {
  monthlyBudgetEur: number;
  maxDailySpendEur: number;
  decisionChecksPerDay: number;
  minAiConfidencePctForExecution: number;
  maxPositionSizeEur: number;
  maxConcurrentPositions: number;
  minOrderSizeEur: number;
  rebalancingEnabled: boolean;
  acceptLosses: boolean;
}

export interface AiGuardrails {
  aiQueryFrequencyDays: number;
  maxCostPerCallEur: number;
  maxCallsPerMonth: number;
  maxSessionDurationMinutes: number;
  maxConcurrentPositions: number;
}

export interface HistoricalLevers {
  lookbackDays: number;
  buyDropThresholdPct: number;
  sellRiseThresholdPct: number;
  maxCapitalPerSignalPct: number;
  trendLookbackDays: number;
  maxVolatilityPct: number;
  minDaysBetweenTrades: number;
}

export interface StrategyPreviewResult {
  estimatedOrdersPerMonth: number;
  estimatedCapitalPerOrderEur: number;
  projectedAllocation: Array<{
    symbol: string;
    targetPct: number;
    projectedAmountEur: number;
  }>;
  warnings: string[];
}

export interface PromptValidationResult {
  isValid: boolean;
  warnings: string[];
}

export interface CryptoCatalogAsset {
  symbol: string;
  thesis: string;
  risk: 'Low' | 'Medium' | 'High';
  fees: 'Low' | 'Medium' | 'High';
}
