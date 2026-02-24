import { useCallback } from 'react';
import {
  defaultSafeguardsByRisk,
  defaultHistoricalLeversByRisk,
  defaultAiGuardrails,
} from './defaults';
import { getDefaultCryptoSymbols, getDefaultAllocation } from './constants';
import {
  createWizardStrategy,
  updateWizardStrategy,
  deleteWizardStrategy,
  exportWizardStrategies,
  resetWizardDefaultStrategies,
  ApiHttpError,
} from '../../api';
import { StrategyWizardState } from './types';

export function useStrategyWizardHandlers(state: StrategyWizardState) {
  const {
    setCurrentStep,
    setLoading,
    setStatus,
    setStatusKind,
    setStrategies,
    setEditingStrategyId,
    setName,
    setDescription,
    setRiskLevel,
    setStrategyType,
    setPromptTemplates,
    setSelectedTemplate,
    setSelectedPromptContent,
    setCustomPrompt,
    setShowPromptPreview,
    setPromptValidation,
    setSafeguards,
    setAllocationRebalancingFrequencyDays,
    setAllocationRebalancingThresholdPct,
    setAiGuardrails,
    setHistoricalLevers,
    setCryptoSymbols,
    setAllocation,
    handleListStrategies,
  } = state;

  const resetWizardForm = useCallback(() => {
    setEditingStrategyId(null);
    setName('');
    setDescription('');
    setRiskLevel('balanced');
    setStrategyType('ai_assisted');
    setPromptTemplates([]);
    setSelectedTemplate('balanced');
    setSelectedPromptContent('');
    setCustomPrompt('');
    setShowPromptPreview(false);
    setPromptValidation({ isValid: true, warnings: [] });
    setSafeguards(defaultSafeguardsByRisk('balanced'));
    setAllocationRebalancingFrequencyDays(1);
    setAllocationRebalancingThresholdPct(5);
    setAiGuardrails(defaultAiGuardrails());
    setHistoricalLevers(defaultHistoricalLeversByRisk('balanced'));
    setCryptoSymbols(
      typeof state.getDefaultCryptoSymbols === 'function'
        ? state.getDefaultCryptoSymbols()
        : getDefaultCryptoSymbols(),
    );
    setAllocation(
      typeof state.getDefaultAllocation === 'function'
        ? state.getDefaultAllocation()
        : getDefaultAllocation(),
    );
  }, [
    setEditingStrategyId,
    setName,
    setDescription,
    setRiskLevel,
    setStrategyType,
    setPromptTemplates,
    setSelectedTemplate,
    setSelectedPromptContent,
    setCustomPrompt,
    setShowPromptPreview,
    setPromptValidation,
    setSafeguards,
    setAllocationRebalancingFrequencyDays,
    setAllocationRebalancingThresholdPct,
    setAiGuardrails,
    setHistoricalLevers,
    setCryptoSymbols,
    setAllocation,
    defaultSafeguardsByRisk,
    defaultAiGuardrails,
    defaultHistoricalLeversByRisk,
    // intentionally not including getDefaultCryptoSymbols/getDefaultAllocation in deps
  ]);

  const handleStep1Next = useCallback(() => {
    if (!state.name.trim()) {
      setStatusKind('error');
      setStatus('Strategy name is required');
      return;
    }
    setCurrentStep('step2-type');
  }, [state.name, setStatusKind, setStatus, setCurrentStep]);

  const handleStep2Next = useCallback(() => {
    setSafeguards(state.defaultSafeguardsByRisk(state.riskLevel));
    setHistoricalLevers(state.defaultHistoricalLeversByRisk(state.riskLevel));
    setCurrentStep('step3-config');
  }, [
    setSafeguards,
    setHistoricalLevers,
    setCurrentStep,
    state.riskLevel,
    state.defaultSafeguardsByRisk,
    state.defaultHistoricalLeversByRisk,
  ]);

  const handleStep3Next = useCallback(() => {
    // ...validation logic as in original page...
    // (omitted for brevity, will be filled in next)
    setCurrentStep('step4-safeguards');
  }, [setCurrentStep]);

  const handleStep4Next = useCallback(() => {
    // ...validation logic as in original page...
    setStatus('');
    setCurrentStep('step5-review');
  }, [setStatus, setCurrentStep]);

  const handleCreateStrategy = useCallback(async () => {
    setLoading(true);
    try {
      const payload = {
        name: state.name,
        description: state.description,
        riskLevel: state.riskLevel,
        type: state.strategyType,
        safeguards: state.safeguards,
        allocationConfig:
          state.strategyType === 'allocation'
            ? {
                allocation: state.allocation,
                rebalancingFrequencyDays: state.allocationRebalancingFrequencyDays,
                rebalancingThresholdPct: state.allocationRebalancingThresholdPct,
              }
            : undefined,
        aiConfig:
          state.strategyType === 'ai_assisted'
            ? {
                cryptoSymbols: state.cryptoSymbols,
                aiQueryFrequencyDays: state.aiGuardrails.aiQueryFrequencyDays,
                promptTemplate: state.selectedTemplate,
                customPrompt: state.customPrompt,
                maxCostPerCallEur: state.aiGuardrails.maxCostPerCallEur,
                maxCallsPerMonth: state.aiGuardrails.maxCallsPerMonth,
                maxSessionDurationMinutes: state.aiGuardrails.maxSessionDurationMinutes,
                maxConcurrentPositions: state.aiGuardrails.maxConcurrentPositions,
              }
            : undefined,
        historicalConfig:
          state.strategyType === 'historical_signals'
            ? {
                cryptoSymbols: state.cryptoSymbols,
                lookbackDays: state.historicalLevers.lookbackDays,
                buyDropThresholdPct: state.historicalLevers.buyDropThresholdPct,
                sellRiseThresholdPct: state.historicalLevers.sellRiseThresholdPct,
                maxCapitalPerSignalPct: state.historicalLevers.maxCapitalPerSignalPct,
                trendLookbackDays: state.historicalLevers.trendLookbackDays,
                maxVolatilityPct: state.historicalLevers.maxVolatilityPct,
                minDaysBetweenTrades: state.historicalLevers.minDaysBetweenTrades,
              }
            : undefined,
      };
      if (state.editingStrategyId) {
        await updateWizardStrategy(state.editingStrategyId, payload);
      } else {
        await createWizardStrategy(payload);
      }
      setLoading(false);
      setStatusKind('success');
      setStatus(
        state.editingStrategyId ? 'Strategy updated successfully' : 'Strategy created successfully',
      );
      await handleListStrategies();
    } catch (error) {
      const message = error instanceof ApiHttpError ? error.message : 'Failed to create strategy';
      setStatusKind('error');
      setStatus(message);
      setLoading(false);
    }
  }, [
    setLoading,
    setStatusKind,
    setStatus,
    handleListStrategies,
    state.editingStrategyId,
    state.name,
    state.description,
    state.riskLevel,
    state.strategyType,
    state.safeguards,
    state.allocation,
    state.allocationRebalancingFrequencyDays,
    state.allocationRebalancingThresholdPct,
    state.cryptoSymbols,
    state.aiGuardrails,
    state.selectedTemplate,
    state.customPrompt,
    state.historicalLevers,
  ]);

  const handleDeleteStrategy = useCallback(
    async (strategyId: string) => {
      const confirmed = window.confirm('Are you sure you want to delete this strategy?');
      if (!confirmed) return;
      setLoading(true);
      try {
        await deleteWizardStrategy(strategyId);
        setStatusKind('success');
        setStatus('Strategy deleted');
        await handleListStrategies();
      } catch {
        setStatusKind('error');
        setStatus('Failed to delete strategy');
        setLoading(false);
      }
    },
    [setLoading, setStatusKind, setStatus, handleListStrategies],
  );

  const handleRestoreDefaultStrategies = useCallback(async () => {
    const confirmed = window.confirm(
      'Restore default strategies? This will replace your current strategy list.',
    );
    if (!confirmed) return;
    setLoading(true);
    try {
      const response = await resetWizardDefaultStrategies();
      setStrategies(response.strategies);
      setStatusKind('success');
      setStatus('Default strategies restored');
      setCurrentStep('list');
      setLoading(false);
    } catch (error) {
      const message =
        error instanceof ApiHttpError ? error.message : 'Failed to restore default strategies';
      setStatusKind('error');
      setStatus(message);
      setLoading(false);
    }
  }, [setLoading, setStrategies, setStatusKind, setStatus, setCurrentStep]);

  const handleExportStrategies = useCallback(async () => {
    setLoading(true);
    try {
      const payload = await exportWizardStrategies();
      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `strategies-${new Date().toISOString().slice(0, 10)}.json`;
      anchor.click();
      URL.revokeObjectURL(url);
      setStatusKind('success');
      setStatus('Strategies exported successfully');
      setLoading(false);
    } catch (error) {
      const message = error instanceof ApiHttpError ? error.message : 'Failed to export strategies';
      setStatusKind('error');
      setStatus(message);
      setLoading(false);
    }
  }, [setLoading, setStatusKind, setStatus]);

  return {
    resetWizardForm,
    handleStep1Next,
    handleStep2Next,
    handleStep3Next,
    handleStep4Next,
    handleCreateStrategy,
    handleDeleteStrategy,
    handleRestoreDefaultStrategies,
    handleExportStrategies,
  };
}
