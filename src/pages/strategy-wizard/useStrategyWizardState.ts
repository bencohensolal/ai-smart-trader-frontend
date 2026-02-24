import { useState, useEffect, useRef } from 'react';
import {
  ApiHttpError,
  PromptTemplate as ApiPromptTemplate,
  StrategyProfile as ApiStrategyProfile,
  getWizardPromptTemplates,
  listWizardStrategies,
} from '../../api';
import {
  defaultAiGuardrails,
  defaultHistoricalLeversByRisk,
  defaultSafeguardsByRisk,
} from './defaults';
import { buildStrategyPreview, validateCustomPromptContent } from './helpers';
import {
  AiGuardrails,
  HistoricalLevers,
  SafeguardsDefaults,
  StrategyPreviewResult,
  StrategyRiskLevel,
  StrategyType,
  WizardStep,
} from './types';
import { getDefaultAllocation, getDefaultCryptoSymbols } from './constants';

export function useStrategyWizardState() {
  const importInputRef = useRef<HTMLInputElement | null>(null);

  const [currentStep, setCurrentStep] = useState<WizardStep>('list');
  const [strategies, setStrategies] = useState<ApiStrategyProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [statusKind, setStatusKind] = useState<'success' | 'error'>('success');
  const [editingStrategyId, setEditingStrategyId] = useState<string | null>(
    null,
  );
  const [strategyPreview, setStrategyPreview] =
    useState<StrategyPreviewResult | null>(null);

  // Wizard state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [riskLevel, setRiskLevel] = useState<StrategyRiskLevel>('balanced');
  const [strategyType, setStrategyType] = useState<StrategyType>('ai_assisted');
  const [promptTemplates, setPromptTemplates] = useState<ApiPromptTemplate[]>(
    [],
  );
  const [selectedTemplate, setSelectedTemplate] = useState<
    'defensive' | 'balanced' | 'aggressive'
  >('balanced');
  const [selectedPromptContent, setSelectedPromptContent] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');
  const [showPromptPreview, setShowPromptPreview] = useState(false);
  const [promptValidation, setPromptValidation] = useState<{
    isValid: boolean;
    warnings: string[];
  }>({ isValid: true, warnings: [] });
  const [safeguards, setSafeguards] = useState<SafeguardsDefaults>(
    defaultSafeguardsByRisk('balanced'),
  );
  const [
    allocationRebalancingFrequencyDays,
    setAllocationRebalancingFrequencyDays,
  ] = useState(1);
  const [
    allocationRebalancingThresholdPct,
    setAllocationRebalancingThresholdPct,
  ] = useState(5);
  const [aiGuardrails, setAiGuardrails] = useState<AiGuardrails>(
    defaultAiGuardrails(),
  );
  const [historicalLevers, setHistoricalLevers] = useState<HistoricalLevers>({
    ...defaultHistoricalLeversByRisk('balanced'),
  });
  const [cryptoSymbols, setCryptoSymbols] = useState<string[]>(
    getDefaultCryptoSymbols(),
  );
  const [allocation, setAllocation] = useState<Record<string, number>>(
    getDefaultAllocation(),
  );

  useEffect(() => {
    void handleListStrategies();
  }, []);

  const handleListStrategies = async (): Promise<void> => {
    setCurrentStep('list');
    setLoading(true);
    try {
      const response = await listWizardStrategies();
      setStrategies(response.strategies);
      setStatus('');
      setLoading(false);
    } catch (error) {
      const message =
        error instanceof ApiHttpError
          ? error.message
          : 'Failed to load strategies';
      setStatusKind('error');
      setStatus(message);
      setLoading(false);
    }
  };

  const handleLoadPromptTemplates = async (): Promise<void> => {
    if (promptTemplates.length > 0) return;
    try {
      const response = await getWizardPromptTemplates();
      setPromptTemplates(response.templates);
      if (!selectedPromptContent) {
        const matchingTemplate = response.templates.find(
          (template) => template.id === selectedTemplate,
        );
        setSelectedPromptContent(matchingTemplate?.preview ?? '');
      }
    } catch {
      setPromptTemplates([]);
    }
  };

  const validateCustomPrompt = (prompt: string): void => {
    setPromptValidation(validateCustomPromptContent(prompt));
  };

  const buildPreview = (): StrategyPreviewResult =>
    buildStrategyPreview({
      safeguards,
      strategyType,
      allocationRebalancingFrequencyDays,
      aiGuardrails,
      historicalLevers,
      allocation,
      cryptoSymbols,
    });

  return {
    importInputRef,
    currentStep,
    setCurrentStep,
    strategies,
    setStrategies,
    loading,
    setLoading,
    status,
    setStatus,
    statusKind,
    setStatusKind,
    editingStrategyId,
    setEditingStrategyId,
    strategyPreview,
    setStrategyPreview,
    name,
    setName,
    description,
    setDescription,
    riskLevel,
    setRiskLevel,
    strategyType,
    setStrategyType,
    promptTemplates,
    setPromptTemplates,
    selectedTemplate,
    setSelectedTemplate,
    selectedPromptContent,
    setSelectedPromptContent,
    customPrompt,
    setCustomPrompt,
    showPromptPreview,
    setShowPromptPreview,
    promptValidation,
    setPromptValidation,
    safeguards,
    setSafeguards,
    allocationRebalancingFrequencyDays,
    setAllocationRebalancingFrequencyDays,
    allocationRebalancingThresholdPct,
    setAllocationRebalancingThresholdPct,
    aiGuardrails,
    setAiGuardrails,
    historicalLevers,
    setHistoricalLevers,
    cryptoSymbols,
    setCryptoSymbols,
    allocation,
    setAllocation,
    handleListStrategies,
    handleLoadPromptTemplates,
    validateCustomPrompt,
    buildPreview,
    defaultSafeguardsByRisk,
    defaultAiGuardrails,
    defaultHistoricalLeversByRisk,
    getDefaultCryptoSymbols,
    getDefaultAllocation,
  };
}
