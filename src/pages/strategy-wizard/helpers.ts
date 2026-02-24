import {
  AiGuardrails,
  HistoricalLevers,
  PromptValidationResult,
  SafeguardsDefaults,
  StrategyPreviewResult,
  StrategyType,
} from './types';

export function validateCustomPromptContent(
  prompt: string,
): PromptValidationResult {
  if (!prompt.trim()) {
    return { isValid: true, warnings: [] };
  }

  const warnings: string[] = [];
  const lowerPrompt = prompt.toLowerCase();

  if (
    !lowerPrompt.includes('portfolio') &&
    !lowerPrompt.includes('holdings') &&
    !lowerPrompt.includes('positions')
  ) {
    warnings.push(
      'Consider mentioning portfolio/holdings for context awareness',
    );
  }

  if (
    !lowerPrompt.includes('buy') &&
    !lowerPrompt.includes('sell') &&
    !lowerPrompt.includes('trade') &&
    !lowerPrompt.includes('action')
  ) {
    warnings.push('Consider including trading action keywords (buy/sell)');
  }

  if (
    !lowerPrompt.includes('json') &&
    !lowerPrompt.includes('format') &&
    !lowerPrompt.includes('structure')
  ) {
    warnings.push(
      'Note: JSON output format will be enforced automatically by the system',
    );
  }

  return {
    isValid: warnings.length === 0,
    warnings,
  };
}

export function buildStrategyPreview(input: {
  safeguards: SafeguardsDefaults;
  strategyType: StrategyType;
  allocationRebalancingFrequencyDays: number;
  aiGuardrails: AiGuardrails;
  historicalLevers: HistoricalLevers;
  allocation: Record<string, number>;
  cryptoSymbols: string[];
}): StrategyPreviewResult {
  const {
    safeguards,
    strategyType,
    allocationRebalancingFrequencyDays,
    aiGuardrails,
    historicalLevers,
    allocation,
    cryptoSymbols,
  } = input;

  const monthlyBudget = safeguards.monthlyBudgetEur;
  let estimatedOrdersPerMonth = 4;

  if (strategyType === 'allocation') {
    estimatedOrdersPerMonth = Math.max(
      1,
      Math.ceil(30 / allocationRebalancingFrequencyDays),
    );
  } else if (strategyType === 'ai_assisted') {
    const estimatedByFrequency = Math.ceil(
      30 / aiGuardrails.aiQueryFrequencyDays,
    );
    estimatedOrdersPerMonth = Math.max(
      1,
      Math.min(aiGuardrails.maxCallsPerMonth, estimatedByFrequency),
    );
  } else {
    estimatedOrdersPerMonth = Math.max(
      1,
      Math.ceil(
        30 / Math.max(1, Math.floor(historicalLevers.lookbackDays / 2)),
      ),
    );
  }

  const estimatedCapitalPerOrderEur = monthlyBudget / estimatedOrdersPerMonth;

  let projectedAllocation: StrategyPreviewResult['projectedAllocation'];
  if (strategyType === 'allocation') {
    projectedAllocation = Object.entries(allocation)
      .filter(([, percent]) => percent > 0)
      .map(([symbol, percent]) => ({
        symbol,
        targetPct: percent,
        projectedAmountEur: (monthlyBudget * percent) / 100,
      }));
  } else {
    const perAssetPct =
      cryptoSymbols.length > 0 ? 100 / cryptoSymbols.length : 0;
    projectedAllocation = cryptoSymbols.map((symbol) => ({
      symbol,
      targetPct: perAssetPct,
      projectedAmountEur: monthlyBudget / Math.max(1, cryptoSymbols.length),
    }));
  }

  const warnings: string[] = [];
  if (estimatedCapitalPerOrderEur < safeguards.minOrderSizeEur) {
    warnings.push('Estimated capital per order is below minimum order size.');
  }
  if (estimatedCapitalPerOrderEur > safeguards.maxPositionSizeEur) {
    warnings.push('Estimated capital per order exceeds maximum position size.');
  }
  if (strategyType === 'ai_assisted' && aiGuardrails.maxCostPerCallEur > 5) {
    warnings.push('AI cost per call is high and may impact net performance.');
  }

  return {
    estimatedOrdersPerMonth,
    estimatedCapitalPerOrderEur,
    projectedAllocation,
    warnings,
  };
}
