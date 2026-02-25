import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AiAdvisorConfigurationTestResult,
  PromptDefinition,
  PromptType,
  UserAiCallRecord,
  UserAiUsage,
  UserSettings,
  UserSettingsUpdateInput,
  createPrompt,
  deletePrompt,
  getUserAiUsage,
  getUserAiUsageCall,
  getUserAiUsageCalls,
  getUserSettings,
  isUnauthorizedError,
  listPrompts,
  resetDefaultPrompts,
  resetPromptToDefault,
  saveUserSettings,
  testUserAiAdvisorConfiguration,
  updatePrompt,
} from '../api';
import {
  getProviderDefaults,
  getProviderModels,
  getProviderModelRates,
} from '../aiProviderCatalog';
import { Layout } from '../components/Layout';
import { useI18n } from '../i18n/i18n';

export function AiUsagePage(): JSX.Element {
  const { t, locale } = useI18n();
  const navigate = useNavigate();
  const [usage, setUsage] = useState<UserAiUsage | null>(null);
  const [calls, setCalls] = useState<UserAiCallRecord[]>([]);
  const [callsStatusFilter, setCallsStatusFilter] = useState<'all' | 'success' | 'error'>('all');
  const [callsModelFilter, setCallsModelFilter] = useState('all');
  const [callsPageSize, setCallsPageSize] = useState(50);
  const [callsPage, setCallsPage] = useState(1);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [prompts, setPrompts] = useState<PromptDefinition[]>([]);
  const [selectedCallId, setSelectedCallId] = useState<string>('');
  const [selectedCall, setSelectedCall] = useState<UserAiCallRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [error, setError] = useState('');
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsStatus, setSettingsStatus] = useState('');
  const [settingsStatusKind, setSettingsStatusKind] = useState<'success' | 'error'>('success');
  const [isTestingAiConfig, setIsTestingAiConfig] = useState(false);
  const [lastAiConfigTest, setLastAiConfigTest] = useState<AiAdvisorConfigurationTestResult | null>(
    null,
  );
  const [aiApiKeyDraft, setAiApiKeyDraft] = useState('');
  const [clearAiApiKey, setClearAiApiKey] = useState(false);
  const [promptsSaving, setPromptsSaving] = useState(false);
  const [promptsStatus, setPromptsStatus] = useState('');
  const [promptsStatusKind, setPromptsStatusKind] = useState<'success' | 'error'>('success');
  const [editingPromptId, setEditingPromptId] = useState<string | null>(null);
  const [type, setType] = useState<PromptType>('ai_advisor_system');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');

  const numberFormatter = useMemo(() => {
    return new Intl.NumberFormat(locale);
  }, [locale]);

  const currencyFormatter = useMemo(() => {
    return new Intl.NumberFormat(locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6,
    });
  }, [locale]);

  const durationFormatter = useMemo(() => {
    return new Intl.NumberFormat(locale, {
      maximumFractionDigits: 0,
    });
  }, [locale]);

  const dateFormatter = useMemo(() => {
    return new Intl.DateTimeFormat(locale, {
      dateStyle: 'medium',
      timeStyle: 'medium',
    });
  }, [locale]);

  const groupedPrompts = useMemo(() => {
    return {
      ai_advisor_system: prompts.filter((prompt) => {
        return prompt.type === 'ai_advisor_system';
      }),
      ai_advisor_user: prompts.filter((prompt) => {
        return prompt.type === 'ai_advisor_user';
      }),
      simulation_explainer: prompts.filter((prompt) => {
        return prompt.type === 'simulation_explainer';
      }),
    };
  }, [prompts]);

  const callsByFilters = useMemo(() => {
    return calls.filter((call) => {
      if (callsStatusFilter === 'success' && !call.success) {
        return false;
      }
      if (callsStatusFilter === 'error' && call.success) {
        return false;
      }
      if (callsModelFilter !== 'all' && (call.model || '-') !== callsModelFilter) {
        return false;
      }
      return true;
    });
  }, [calls, callsModelFilter, callsStatusFilter]);

  const callModels = useMemo(() => {
    return Array.from(new Set(calls.map((call) => call.model || '-'))).sort((left, right) =>
      left.localeCompare(right),
    );
  }, [calls]);

  useEffect(() => {
    setCallsPage(1);
  }, [callsModelFilter, callsPageSize, callsStatusFilter]);

  const callsPageCount = Math.max(1, Math.ceil(callsByFilters.length / callsPageSize));
  const safeCallsPage = Math.min(callsPage, callsPageCount);
  const pagedCalls = useMemo(() => {
    const start = (safeCallsPage - 1) * callsPageSize;
    return callsByFilters.slice(start, start + callsPageSize);
  }, [callsByFilters, callsPageSize, safeCallsPage]);

  const usageTokenLimitPct = useMemo(() => {
    if (!settings || settings.aiAdvisor.maxPromptTokensPerCall <= 0) {
      return 0;
    }
    const used = usage?.promptTokens ?? 0;
    const maxTheoretical =
      settings.aiAdvisor.maxPromptTokensPerCall * Math.max(1, usage?.totalCalls ?? 1);
    return Math.min(100, (used / maxTheoretical) * 100);
  }, [settings, usage]);

  const usageCostGuardrailPct = useMemo(() => {
    if (!settings || settings.aiAdvisor.maxCostEurPerDay <= 0) {
      return 0;
    }
    return Math.min(
      100,
      ((usage?.estimatedCostEur ?? 0) / settings.aiAdvisor.maxCostEurPerDay) * 100,
    );
  }, [settings, usage]);

  const loadCallDetails = useCallback(
    async (callId: string): Promise<void> => {
      if (!callId.trim()) {
        return;
      }
      try {
        setIsLoadingDetail(true);
        const payload = await getUserAiUsageCall(callId);
        setSelectedCall(payload.call);
        setSelectedCallId(callId);
      } catch (loadError) {
        if (isUnauthorizedError(loadError)) {
          navigate('/login', { replace: true });
          return;
        }
        setError(t('aiUsage.loadError'));
      } finally {
        setIsLoadingDetail(false);
      }
    },
    [navigate, t],
  );

  const load = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError('');
    try {
      const [usagePayload, callsPayload, settingsPayload, promptsPayload] = await Promise.all([
        getUserAiUsage(),
        getUserAiUsageCalls(150),
        getUserSettings(),
        listPrompts(),
      ]);
      setUsage(usagePayload.usage);
      setCalls(callsPayload.calls);
      setSettings(settingsPayload.settings);
      setPrompts(promptsPayload);
      setAiApiKeyDraft('');
      setClearAiApiKey(false);
      const firstCall = callsPayload.calls[0];
      if (firstCall) {
        setSelectedCallId(firstCall.id);
        setSelectedCall(firstCall);
      } else {
        setSelectedCallId('');
        setSelectedCall(null);
      }
    } catch (loadError) {
      if (isUnauthorizedError(loadError)) {
        navigate('/login', { replace: true });
        return;
      }
      setError(t('aiUsage.loadError'));
    } finally {
      setIsLoading(false);
    }
  }, [navigate, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const availableModels = useMemo(() => {
    if (!settings) {
      return [];
    }
    const models = getProviderModels(settings.aiAdvisor.provider);
    if (settings.aiAdvisor.model && !models.includes(settings.aiAdvisor.model)) {
      return [settings.aiAdvisor.model, ...models];
    }
    return models;
  }, [settings]);

  function applyProviderDefaults(provider: UserSettings['aiAdvisor']['provider']): void {
    if (!settings) {
      return;
    }
    const defaults = getProviderDefaults(provider);
    setSettings({
      ...settings,
      aiAdvisor: {
        ...settings.aiAdvisor,
        ...defaults,
      },
    });
  }

  function updateAiModel(model: string): void {
    if (!settings) {
      return;
    }
    const rates = getProviderModelRates(settings.aiAdvisor.provider, model);
    setSettings({
      ...settings,
      aiAdvisor: {
        ...settings.aiAdvisor,
        model,
        inputCostPer1MTokensUsd: rates.inputCostPer1MTokensUsd,
        outputCostPer1MTokensUsd: rates.outputCostPer1MTokensUsd,
        pricingSource: `catalog:${settings.aiAdvisor.provider}:${model}`,
        pricingUpdatedAt: '2026-02-21',
      },
    });
  }

  async function handleSaveAiSettings(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!settings) {
      return;
    }
    try {
      setSettingsSaving(true);
      setSettingsStatus('');
      const aiAdvisorPayload: NonNullable<UserSettingsUpdateInput['aiAdvisor']> = {
        provider: settings.aiAdvisor.provider,
        model: settings.aiAdvisor.model,
        baseUrl: settings.aiAdvisor.baseUrl,
        temperature: settings.aiAdvisor.temperature,
        timeoutMs: settings.aiAdvisor.timeoutMs,
        maxPromptTokensPerCall: settings.aiAdvisor.maxPromptTokensPerCall,
        maxCompletionTokensPerCall: settings.aiAdvisor.maxCompletionTokensPerCall,
        maxCallsPerDay: settings.aiAdvisor.maxCallsPerDay,
        maxCostEurPerDay: settings.aiAdvisor.maxCostEurPerDay,
        inputCostPer1MTokensUsd: settings.aiAdvisor.inputCostPer1MTokensUsd,
        outputCostPer1MTokensUsd: settings.aiAdvisor.outputCostPer1MTokensUsd,
        usdToEurRate: settings.aiAdvisor.usdToEurRate,
        pricingSource: settings.aiAdvisor.pricingSource,
        pricingUpdatedAt: settings.aiAdvisor.pricingUpdatedAt,
        clearApiKey: clearAiApiKey,
      };
      if (aiApiKeyDraft.trim()) {
        aiAdvisorPayload.apiKey = aiApiKeyDraft.trim();
        aiAdvisorPayload.clearApiKey = false;
      }

      const payload = await saveUserSettings({
        aiAdvisorEnabled: settings.aiAdvisorEnabled,
        aiAdvisor: aiAdvisorPayload,
      });
      setSettings(payload.settings);
      setAiApiKeyDraft('');
      setClearAiApiKey(false);
      setSettingsStatusKind('success');
      setSettingsStatus(t('settings.saved'));
    } catch (saveError) {
      if (isUnauthorizedError(saveError)) {
        navigate('/login', { replace: true });
        return;
      }
      setSettingsStatusKind('error');
      setSettingsStatus(t('settings.saveError'));
    } finally {
      setSettingsSaving(false);
    }
  }

  async function handleTestAiSettings(): Promise<void> {
    if (!settings) {
      return;
    }
    try {
      setIsTestingAiConfig(true);
      setSettingsStatus('');
      const payload = await testUserAiAdvisorConfiguration({
        provider: settings.aiAdvisor.provider,
        model: settings.aiAdvisor.model,
        baseUrl: settings.aiAdvisor.baseUrl,
        temperature: settings.aiAdvisor.temperature,
        timeoutMs: settings.aiAdvisor.timeoutMs,
        maxPromptTokensPerCall: settings.aiAdvisor.maxPromptTokensPerCall,
        maxCompletionTokensPerCall: settings.aiAdvisor.maxCompletionTokensPerCall,
        maxCallsPerDay: settings.aiAdvisor.maxCallsPerDay,
        maxCostEurPerDay: settings.aiAdvisor.maxCostEurPerDay,
        inputCostPer1MTokensUsd: settings.aiAdvisor.inputCostPer1MTokensUsd,
        outputCostPer1MTokensUsd: settings.aiAdvisor.outputCostPer1MTokensUsd,
        usdToEurRate: settings.aiAdvisor.usdToEurRate,
        pricingSource: settings.aiAdvisor.pricingSource,
        pricingUpdatedAt: settings.aiAdvisor.pricingUpdatedAt,
        apiKey: aiApiKeyDraft.trim() || undefined,
        clearApiKey: clearAiApiKey,
      });
      setLastAiConfigTest(payload);
      setSettings({
        ...settings,
        aiAdvisor: {
          ...settings.aiAdvisor,
          model: payload.model,
          inputCostPer1MTokensUsd: payload.pricing.inputCostPer1MTokensUsd,
          outputCostPer1MTokensUsd: payload.pricing.outputCostPer1MTokensUsd,
          usdToEurRate: payload.pricing.usdToEurRate,
          pricingSource: payload.pricing.pricingSource,
          pricingUpdatedAt: payload.pricing.pricingUpdatedAt,
        },
      });
      setSettingsStatusKind(payload.ok ? 'success' : 'error');
      setSettingsStatus(
        payload.ok ? t('settings.aiProvider.testSuccess') : t('settings.aiProvider.testError'),
      );
    } catch (testError) {
      if (isUnauthorizedError(testError)) {
        navigate('/login', { replace: true });
        return;
      }
      setSettingsStatusKind('error');
      setSettingsStatus(t('settings.aiProvider.testError'));
    } finally {
      setIsTestingAiConfig(false);
    }
  }

  async function handleSavePrompt(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      setPromptsSaving(true);
      setPromptsStatus('');
      if (editingPromptId) {
        const payload = await updatePrompt(editingPromptId, {
          name,
          description,
          content,
        });
        setPrompts(payload.prompts);
        setPromptsStatusKind('success');
        setPromptsStatus('Prompt updated.');
      } else {
        const payload = await createPrompt({
          type,
          name,
          description,
          content,
        });
        setPrompts(payload.prompts);
        setPromptsStatusKind('success');
        setPromptsStatus('Prompt created.');
      }
      resetPromptForm();
    } catch (saveError) {
      if (isUnauthorizedError(saveError)) {
        navigate('/login', { replace: true });
        return;
      }
      setPromptsStatusKind('error');
      setPromptsStatus('Unable to save this prompt.');
    } finally {
      setPromptsSaving(false);
    }
  }

  async function handleDeletePrompt(prompt: PromptDefinition): Promise<void> {
    const confirmed = window.confirm(`Delete prompt "${prompt.name}"?`);
    if (!confirmed) {
      return;
    }
    try {
      setPromptsSaving(true);
      const payload = await deletePrompt(prompt.id);
      setPrompts(payload.prompts);
      setPromptsStatusKind('success');
      setPromptsStatus('Prompt deleted.');
      if (editingPromptId === prompt.id) {
        resetPromptForm();
      }
    } catch (deleteError) {
      if (isUnauthorizedError(deleteError)) {
        navigate('/login', { replace: true });
        return;
      }
      setPromptsStatusKind('error');
      setPromptsStatus('Unable to delete this prompt.');
    } finally {
      setPromptsSaving(false);
    }
  }

  async function handleResetPrompt(prompt: PromptDefinition): Promise<void> {
    try {
      setPromptsSaving(true);
      const payload = await resetPromptToDefault(prompt.id);
      setPrompts(payload.prompts);
      setPromptsStatusKind('success');
      setPromptsStatus('Prompt reset to default version.');
      if (editingPromptId === prompt.id) {
        setName(payload.updated.name);
        setDescription(payload.updated.description);
        setContent(payload.updated.content);
      }
    } catch (resetError) {
      if (isUnauthorizedError(resetError)) {
        navigate('/login', { replace: true });
        return;
      }
      setPromptsStatusKind('error');
      setPromptsStatus('Unable to restore this prompt.');
    } finally {
      setPromptsSaving(false);
    }
  }

  async function handleResetDefaults(typeToReset?: PromptType): Promise<void> {
    const confirmed = window.confirm(
      typeToReset ? 'Reset default prompts for this type?' : 'Reset all default prompts?',
    );
    if (!confirmed) {
      return;
    }
    try {
      setPromptsSaving(true);
      const payload = await resetDefaultPrompts(typeToReset);
      setPrompts(payload.prompts);
      setPromptsStatusKind('success');
      setPromptsStatus('Default prompts restored.');
      resetPromptForm();
    } catch (resetError) {
      if (isUnauthorizedError(resetError)) {
        navigate('/login', { replace: true });
        return;
      }
      setPromptsStatusKind('error');
      setPromptsStatus('Unable to reset prompts.');
    } finally {
      setPromptsSaving(false);
    }
  }

  function startEditPrompt(prompt: PromptDefinition): void {
    setEditingPromptId(prompt.id);
    setType(prompt.type);
    setName(prompt.name);
    setDescription(prompt.description);
    setContent(prompt.content);
    setPromptsStatus('');
  }

  function resetPromptForm(): void {
    setEditingPromptId(null);
    setType('ai_advisor_system');
    setName('');
    setDescription('');
    setContent('');
  }

  return (
    <Layout title={t('page.aiUsage.title')} subtitle={t('page.aiUsage.subtitle')}>
      {isLoading ? <section className="panel">{t('aiUsage.loading')}</section> : null}
      {!isLoading && error ? (
        <section className="panel status status-error">{error}</section>
      ) : null}

      {!isLoading && !error && settings ? (
        <>
          <section className="panel">
            <h2>{t('settings.aiProvider.title')}</h2>
            <form
              className="strategy-form strategy-form--stacked"
              onSubmit={(event) => {
                void handleSaveAiSettings(event);
              }}
            >
              <div className="form-toggle-row">
                <div
                  className={`toggle-btn${settings.aiAdvisorEnabled ? ' selected' : ''}`}
                  tabIndex={0}
                  role="button"
                  aria-pressed={settings.aiAdvisorEnabled}
                  onClick={() =>
                    setSettings({
                      ...settings,
                      aiAdvisorEnabled: !settings.aiAdvisorEnabled,
                    })
                  }
                  onKeyDown={(e) => {
                    if (e.key === ' ' || e.key === 'Enter') {
                      e.preventDefault();
                      setSettings({
                        ...settings,
                        aiAdvisorEnabled: !settings.aiAdvisorEnabled,
                      });
                    }
                  }}
                >
                  {t('settings.aiAdvisor')}
                </div>
              </div>

              <div className="form-grid">
                <label className="field">
                  <span className="field-label">{t('settings.aiProvider.partner')}</span>
                  <select
                    value={settings.aiAdvisor.provider}
                    onChange={(event) => {
                      applyProviderDefaults(
                        event.target.value as UserSettings['aiAdvisor']['provider'],
                      );
                    }}
                  >
                    <option value="openai">{t('auto.openai')}</option>
                    <option value="anthropic">{t('auto.anthropic')}</option>
                    <option value="gemini">{t('auto.google_gemini')}</option>
                  </select>
                </label>

                <label className="field">
                  <span className="field-label">{t('settings.aiProvider.model')}</span>
                  <select
                    value={settings.aiAdvisor.model}
                    onChange={(event) => {
                      updateAiModel(event.target.value);
                    }}
                  >
                    {availableModels.map((model) => {
                      return (
                        <option key={model} value={model}>
                          {model}
                        </option>
                      );
                    })}
                  </select>
                </label>

                <label className="field">
                  <span className="field-label">{t('settings.aiProvider.baseUrl')}</span>
                  <input
                    type="text"
                    value={settings.aiAdvisor.baseUrl}
                    onChange={(event) => {
                      setSettings({
                        ...settings,
                        aiAdvisor: {
                          ...settings.aiAdvisor,
                          baseUrl: event.target.value,
                        },
                      });
                    }}
                  />
                </label>

                <label className="field">
                  <span className="field-label">{t('settings.aiProvider.timeout')}</span>
                  <input
                    type="number"
                    min={500}
                    max={30000}
                    value={settings.aiAdvisor.timeoutMs}
                    onChange={(event) => {
                      const timeoutMs = Number(event.target.value);
                      if (!Number.isFinite(timeoutMs)) {
                        return;
                      }
                      setSettings({
                        ...settings,
                        aiAdvisor: {
                          ...settings.aiAdvisor,
                          timeoutMs,
                        },
                      });
                    }}
                  />
                </label>

                <label className="field">
                  <span className="field-label">{t('settings.aiProvider.temperature')}</span>
                  <input
                    type="number"
                    min={0}
                    max={2}
                    step={0.1}
                    value={settings.aiAdvisor.temperature}
                    onChange={(event) => {
                      const temperature = Number(event.target.value);
                      if (!Number.isFinite(temperature)) {
                        return;
                      }
                      setSettings({
                        ...settings,
                        aiAdvisor: {
                          ...settings.aiAdvisor,
                          temperature,
                        },
                      });
                    }}
                  />
                </label>

                <label className="field">
                  <span className="field-label">{t('settings.aiProvider.maxPromptTokens')}</span>
                  <input
                    type="number"
                    min={256}
                    max={200000}
                    value={settings.aiAdvisor.maxPromptTokensPerCall}
                    onChange={(event) => {
                      const value = Number(event.target.value);
                      if (!Number.isFinite(value)) {
                        return;
                      }
                      setSettings({
                        ...settings,
                        aiAdvisor: {
                          ...settings.aiAdvisor,
                          maxPromptTokensPerCall: value,
                        },
                      });
                    }}
                  />
                </label>

                <label className="field">
                  <span className="field-label">
                    {t('settings.aiProvider.maxCompletionTokens')}
                  </span>
                  <input
                    type="number"
                    min={64}
                    max={50000}
                    value={settings.aiAdvisor.maxCompletionTokensPerCall}
                    onChange={(event) => {
                      const value = Number(event.target.value);
                      if (!Number.isFinite(value)) {
                        return;
                      }
                      setSettings({
                        ...settings,
                        aiAdvisor: {
                          ...settings.aiAdvisor,
                          maxCompletionTokensPerCall: value,
                        },
                      });
                    }}
                  />
                </label>

                <label className="field">
                  <span className="field-label">{t('settings.aiProvider.maxCostPerDay')}</span>
                  <input
                    type="number"
                    min={0.1}
                    max={10000}
                    step={0.1}
                    value={settings.aiAdvisor.maxCostEurPerDay}
                    onChange={(event) => {
                      const value = Number(event.target.value);
                      if (!Number.isFinite(value)) {
                        return;
                      }
                      setSettings({
                        ...settings,
                        aiAdvisor: {
                          ...settings.aiAdvisor,
                          maxCostEurPerDay: value,
                        },
                      });
                    }}
                  />
                </label>

                <label className="field">
                  <span className="field-label">{t('settings.aiProvider.inputTokenRate')}</span>
                  <input
                    type="number"
                    min={0}
                    step={0.000001}
                    value={settings.aiAdvisor.inputCostPer1MTokensUsd}
                    onChange={(event) => {
                      const value = Number(event.target.value);
                      if (!Number.isFinite(value)) {
                        return;
                      }
                      setSettings({
                        ...settings,
                        aiAdvisor: {
                          ...settings.aiAdvisor,
                          inputCostPer1MTokensUsd: value,
                        },
                      });
                    }}
                  />
                </label>

                <label className="field">
                  <span className="field-label">{t('settings.aiProvider.outputTokenRate')}</span>
                  <input
                    type="number"
                    min={0}
                    step={0.000001}
                    value={settings.aiAdvisor.outputCostPer1MTokensUsd}
                    onChange={(event) => {
                      const value = Number(event.target.value);
                      if (!Number.isFinite(value)) {
                        return;
                      }
                      setSettings({
                        ...settings,
                        aiAdvisor: {
                          ...settings.aiAdvisor,
                          outputCostPer1MTokensUsd: value,
                        },
                      });
                    }}
                  />
                </label>

                <label className="field">
                  <span className="field-label">{t('settings.aiProvider.usdToEurRate')}</span>
                  <input
                    type="number"
                    min={0.01}
                    step={0.000001}
                    value={settings.aiAdvisor.usdToEurRate}
                    onChange={(event) => {
                      const value = Number(event.target.value);
                      if (!Number.isFinite(value)) {
                        return;
                      }
                      setSettings({
                        ...settings,
                        aiAdvisor: {
                          ...settings.aiAdvisor,
                          usdToEurRate: value,
                        },
                      });
                    }}
                  />
                </label>
              </div>

              <label className="field">
                <span className="field-label">{t('settings.aiProvider.apiKey')}</span>
                <input
                  type="password"
                  placeholder={
                    settings.aiAdvisor.apiKeySet
                      ? settings.aiAdvisor.apiKeyMasked
                      : t('settings.aiProvider.apiKeyPlaceholder')
                  }
                  value={aiApiKeyDraft}
                  onChange={(event) => {
                    setAiApiKeyDraft(event.target.value);
                    if (event.target.value.trim()) {
                      setClearAiApiKey(false);
                    }
                  }}
                />
              </label>

              <div className="form-toggle-row">
                <div
                  className={`toggle-btn${clearAiApiKey ? ' selected' : ''}`}
                  tabIndex={0}
                  role="button"
                  aria-pressed={clearAiApiKey}
                  onClick={() => {
                    setClearAiApiKey(!clearAiApiKey);
                    if (!clearAiApiKey) {
                      setAiApiKeyDraft('');
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === ' ' || e.key === 'Enter') {
                      e.preventDefault();
                      setClearAiApiKey(!clearAiApiKey);
                      if (!clearAiApiKey) {
                        setAiApiKeyDraft('');
                      }
                    }
                  }}
                >
                  {t('settings.aiProvider.clearApiKey')}
                </div>
              </div>

              <div className="form-actions">
                <button
                  className="button button-secondary"
                  type="button"
                  disabled={settingsSaving || isTestingAiConfig}
                  onClick={() => {
                    void handleTestAiSettings();
                  }}
                >
                  {isTestingAiConfig
                    ? t('settings.aiProvider.testing')
                    : t('settings.aiProvider.test')}
                </button>
                <button className="button" type="submit" disabled={settingsSaving}>
                  {settingsSaving ? t('settings.saving') : t('settings.save')}
                </button>
              </div>
            </form>
            {lastAiConfigTest ? (
              <div className="sub-panel">
                <h3>{t('settings.aiProvider.lastTest')}</h3>
                <p>
                  {t('settings.aiProvider.lastTestStatus')}:{' '}
                  {lastAiConfigTest.ok ? t('aiUsage.calls.success') : t('aiUsage.calls.error')}
                </p>
                <p>
                  HTTP:{' '}
                  {lastAiConfigTest.statusCode === null ? '-' : String(lastAiConfigTest.statusCode)}
                </p>
                <p>
                  {t('settings.aiProvider.inputTokenRate')}:{' '}
                  {lastAiConfigTest.pricing.inputCostPer1MTokensUsd}
                </p>
                <p>
                  {t('settings.aiProvider.outputTokenRate')}:{' '}
                  {lastAiConfigTest.pricing.outputCostPer1MTokensUsd}
                </p>
                <p>
                  {t('settings.aiProvider.pricingSource')}: {lastAiConfigTest.pricing.pricingSource}
                </p>
                <p>
                  {t('settings.aiProvider.pricingUpdatedAt')}:{' '}
                  {lastAiConfigTest.pricing.pricingUpdatedAt}
                </p>
                {lastAiConfigTest.outputPreview ? (
                  <pre>{lastAiConfigTest.outputPreview}</pre>
                ) : null}
              </div>
            ) : null}
          </section>

          {settingsStatus ? (
            <section
              className={`panel status ${settingsStatusKind === 'error' ? 'status-error' : 'status-success'}`}
            >
              {settingsStatus}
            </section>
          ) : null}

          <section className="panel">
            <h2>{t('page.prompts.title')}</h2>
            <p>{t('page.prompts.subtitle')}</p>

            <div className="prompts-grid">
              <article className="panel">
                <h3>{editingPromptId ? 'Edit prompt' : 'New prompt'}</h3>
                <p>{t('auto.you_can_create_multiple_prompt')}</p>
                <form
                  className="strategy-form strategy-form--stacked"
                  onSubmit={(event) => {
                    void handleSavePrompt(event);
                  }}
                >
                  <div className="form-grid">
                    <label className="field">
                      <span className="field-label">{t('auto.prompt_type')}</span>
                      <select
                        value={type}
                        onChange={(event) => {
                          setType(event.target.value as PromptType);
                        }}
                        disabled={Boolean(editingPromptId)}
                      >
                        <option value="ai_advisor_system">{t('auto.ai_advisor_system')}</option>
                        <option value="ai_advisor_user">{t('auto.ai_advisor_context')}</option>
                        <option value="simulation_explainer">
                          {t('auto.simulation_explanation')}
                        </option>
                      </select>
                    </label>

                    <label className="field">
                      <span className="field-label">{t('auto.name')}</span>
                      <input
                        value={name}
                        onChange={(event) => {
                          setName(event.target.value);
                        }}
                        placeholder="Ex: Cautious AI / anti-overtrading"
                        required
                      />
                    </label>

                    <label className="field">
                      <span className="field-label">{t('auto.description')}</span>
                      <input
                        value={description}
                        onChange={(event) => {
                          setDescription(event.target.value);
                        }}
                        placeholder="This prompt limits overly aggressive selling"
                        required
                      />
                    </label>
                  </div>

                  <label className="field">
                    <span className="field-label">{t('auto.prompt_content')}</span>
                    <textarea
                      rows={10}
                      value={content}
                      onChange={(event) => {
                        setContent(event.target.value);
                      }}
                      placeholder="Ex: Analyze this context and respond in JSON..."
                      required
                    />
                  </label>

                  <div className="form-actions">
                    <button className="button" type="submit" disabled={promptsSaving}>
                      {editingPromptId ? 'Save' : 'Create'}
                    </button>
                    <button
                      className="button button-secondary"
                      type="button"
                      onClick={resetPromptForm}
                      disabled={promptsSaving}
                    >
                      {t('auto.reset_form')}
                    </button>
                    <button
                      className="button button-secondary"
                      type="button"
                      onClick={() => {
                        void handleResetDefaults();
                      }}
                      disabled={promptsSaving}
                    >
                      {t('auto.restore_all_defaults')}
                    </button>
                  </div>
                </form>
              </article>

              <aside className="panel">
                <h3>{t('auto.quick_help')}</h3>
                <ul className="cards-list">
                  <li>
                    <h3>{t('auto.multiple_variants')}</h3>
                    <p>{t('auto.create_multiple_prompts_of_the')}</p>
                  </li>
                  <li>
                    <h3>{t('auto.default_version')}</h3>
                    <p>{t('auto.prompts_shipped_with_the_proje')}</p>
                  </li>
                  <li>
                    <h3>{t('auto.strategy_setup')}</h3>
                    <p>{t('auto.each_strategy_can_choose_its_a')}</p>
                  </li>
                </ul>
              </aside>
            </div>

            {(['ai_advisor_system', 'ai_advisor_user', 'simulation_explainer'] as const).map(
              (promptType) => {
                const list = groupedPrompts[promptType];
                return (
                  <article className="sub-panel" key={promptType}>
                    <div className="sub-panel-head">
                      <h3>{formatPromptType(promptType)}</h3>
                      <button
                        className="button button-secondary button-small"
                        type="button"
                        onClick={() => {
                          void handleResetDefaults(promptType);
                        }}
                        disabled={promptsSaving}
                      >
                        Restore defaults ({formatPromptType(promptType)})
                      </button>
                    </div>
                    <div className="table-scroll table-scroll-wide">
                      <table>
                        <thead>
                          <tr>
                            <th>{t('auto.id')}</th>
                            <th>{t('auto.name')}</th>
                            <th>{t('auto.description')}</th>
                            <th>{t('auto.default')}</th>
                            <th>{t('auto.actions')}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {list.map((prompt) => {
                            return (
                              <tr key={prompt.id}>
                                <td>{prompt.id}</td>
                                <td>{prompt.name}</td>
                                <td>{prompt.description}</td>
                                <td>{prompt.isDefault ? 'yes' : 'no'}</td>
                                <td>
                                  <div className="table-actions">
                                    <button
                                      className="button button-secondary button-small"
                                      type="button"
                                      onClick={() => {
                                        startEditPrompt(prompt);
                                      }}
                                      disabled={promptsSaving}
                                    >
                                      {t('auto.edit')}
                                    </button>
                                    {prompt.templateKey ? (
                                      <button
                                        className="button button-secondary button-small"
                                        type="button"
                                        onClick={() => {
                                          void handleResetPrompt(prompt);
                                        }}
                                        disabled={promptsSaving}
                                      >
                                        {t('auto.reset_to_default')}
                                      </button>
                                    ) : (
                                      <button
                                        className="button button-danger button-small"
                                        type="button"
                                        onClick={() => {
                                          void handleDeletePrompt(prompt);
                                        }}
                                        disabled={promptsSaving}
                                      >
                                        {t('auto.delete')}
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </article>
                );
              },
            )}
          </section>

          {promptsStatus ? (
            <section
              className={`panel status ${promptsStatusKind === 'error' ? 'status-error' : 'status-success'}`}
            >
              {promptsStatus}
            </section>
          ) : null}

          <section className="panel">
            <div className="kpis ai-usage-summary-kpis">
              <article className="kpi">
                <span>{t('auto.tokens_used')}</span>
                <strong>{numberFormatter.format(usage?.totalTokens ?? 0)}</strong>
                <small>{usageTokenLimitPct.toFixed(1)}% of theoretical limit</small>
              </article>
              <article className="kpi">
                <span>{t('auto.estimated_cost')}</span>
                <strong>{currencyFormatter.format(usage?.estimatedCostEur ?? 0)} EUR</strong>
                <small>{usageCostGuardrailPct.toFixed(1)}% of daily limit</small>
              </article>
            </div>

            <div className="ai-usage-layout">
              <section className="ai-usage-list">
                <h2>{t('aiUsage.calls.title')}</h2>
                <section className="controls-panel">
                  <label className="field">
                    <span>{t('auto.status')}</span>
                    <select
                      value={callsStatusFilter}
                      onChange={(event) => {
                        const next = event.target.value;
                        if (next === 'all' || next === 'success' || next === 'error') {
                          setCallsStatusFilter(next);
                        }
                      }}
                    >
                      <option value="all">{t('auto.all')}</option>
                      <option value="success">{t('auto.success')}</option>
                      <option value="error">{t('auto.error')}</option>
                    </select>
                  </label>
                  <label className="field">
                    <span>{t('auto.model')}</span>
                    <select
                      value={callsModelFilter}
                      onChange={(event) => {
                        setCallsModelFilter(event.target.value);
                      }}
                    >
                      <option value="all">{t('auto.all')}</option>
                      {callModels.map((model) => {
                        return (
                          <option key={model} value={model}>
                            {model}
                          </option>
                        );
                      })}
                    </select>
                  </label>
                  <label className="field">
                    <span>{t('auto.rows_page')}</span>
                    <select
                      value={String(callsPageSize)}
                      onChange={(event) => {
                        const next = Number(event.target.value);
                        if (next === 50 || next === 100 || next === 200) {
                          setCallsPageSize(next);
                        }
                      }}
                    >
                      <option value="50">50</option>
                      <option value="100">100</option>
                      <option value="200">200</option>
                    </select>
                  </label>
                </section>
                <p>
                  {callsByFilters.length} filtered call(s) · page {safeCallsPage}/{callsPageCount}
                </p>
                {calls.length === 0 ? <p>{t('aiUsage.calls.empty')}</p> : null}
                {calls.length > 0 ? (
                  <div className="ai-usage-calls-table-wrap">
                    <table className="ai-usage-calls-table">
                      <thead>
                        <tr>
                          <th>{t('aiUsage.calls.status')}</th>
                          <th>{t('aiUsage.calls.when')}</th>
                          <th>{t('aiUsage.calls.model')}</th>
                          <th>{t('aiUsage.calls.tokens')}</th>
                          <th>{t('aiUsage.calls.cost')}</th>
                          <th>{t('aiUsage.calls.duration')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pagedCalls.map((call) => {
                          const active = selectedCallId === call.id;
                          return (
                            <tr key={call.id} className={active ? 'active' : ''}>
                              <td>
                                <button
                                  type="button"
                                  className="ai-usage-call-btn"
                                  onClick={() => {
                                    void loadCallDetails(call.id);
                                  }}
                                >
                                  {call.success
                                    ? t('aiUsage.calls.success')
                                    : t('aiUsage.calls.error')}
                                </button>
                              </td>
                              <td>{formatDate(call.calledAt, dateFormatter)}</td>
                              <td>{call.model || '-'}</td>
                              <td>{numberFormatter.format(call.totalTokens)}</td>
                              <td>{currencyFormatter.format(call.estimatedCostEur)} EUR</td>
                              <td>{durationFormatter.format(call.durationMs)} ms</td>
                            </tr>
                          );
                        })}
                        {pagedCalls.length === 0 ? (
                          <tr>
                            <td colSpan={6}>{t('auto.no_calls_for_these_filters')}</td>
                          </tr>
                        ) : null}
                      </tbody>
                    </table>
                  </div>
                ) : null}
                {calls.length > 0 ? (
                  <div className="list-pagination">
                    <button
                      className="button button-secondary button-small"
                      type="button"
                      onClick={() => {
                        setCallsPage((current) => Math.max(1, current - 1));
                      }}
                      disabled={safeCallsPage <= 1}
                    >
                      {t('auto.previous')}
                    </button>
                    <span>
                      Page {safeCallsPage} / {callsPageCount}
                    </span>
                    <button
                      className="button button-secondary button-small"
                      type="button"
                      onClick={() => {
                        setCallsPage((current) => Math.min(callsPageCount, current + 1));
                      }}
                      disabled={safeCallsPage >= callsPageCount}
                    >
                      {t('auto.next')}
                    </button>
                  </div>
                ) : null}
              </section>

              <section className="ai-usage-detail">
                <h2>{t('aiUsage.details.title')}</h2>
                {isLoadingDetail ? <p>{t('aiUsage.details.loading')}</p> : null}
                {!isLoadingDetail && !selectedCall ? <p>{t('aiUsage.details.empty')}</p> : null}

                {!isLoadingDetail && selectedCall ? (
                  <>
                    <div className="ai-usage-detail-grid">
                      <div className="kpi">
                        <span>{t('aiUsage.details.id')}</span>
                        <strong className="ai-usage-id">{selectedCall.id}</strong>
                      </div>
                      <div className="kpi">
                        <span>{t('aiUsage.details.status')}</span>
                        <strong>
                          {selectedCall.success
                            ? t('aiUsage.calls.success')
                            : t('aiUsage.calls.error')}
                        </strong>
                      </div>
                      <div className="kpi">
                        <span>{t('aiUsage.details.totalTokens')}</span>
                        <strong>{numberFormatter.format(selectedCall.totalTokens)}</strong>
                      </div>
                      <div className="kpi">
                        <span>{t('aiUsage.details.tokenBreakdown')}</span>
                        <strong>
                          {numberFormatter.format(selectedCall.promptTokens)} /{' '}
                          {numberFormatter.format(selectedCall.completionTokens)}
                        </strong>
                      </div>
                      <div className="kpi">
                        <span>{t('aiUsage.details.costEur')}</span>
                        <strong>
                          {currencyFormatter.format(selectedCall.estimatedCostEur)} EUR
                        </strong>
                      </div>
                      <div className="kpi">
                        <span>{t('aiUsage.details.costUsd')}</span>
                        <strong>
                          {currencyFormatter.format(selectedCall.estimatedCostUsd)} USD
                        </strong>
                      </div>
                      <div className="kpi">
                        <span>{t('aiUsage.details.costPer1kTokens')}</span>
                        <strong>
                          {currencyFormatter.format(
                            selectedCall.totalTokens > 0
                              ? (selectedCall.estimatedCostEur / selectedCall.totalTokens) * 1000
                              : 0,
                          )}{' '}
                          EUR
                        </strong>
                      </div>
                      <div className="kpi">
                        <span>{t('aiUsage.details.duration')}</span>
                        <strong>{durationFormatter.format(selectedCall.durationMs)} ms</strong>
                      </div>
                      <div className="kpi">
                        <span>{t('aiUsage.details.calledAt')}</span>
                        <strong>{formatDate(selectedCall.calledAt, dateFormatter)}</strong>
                      </div>
                      <div className="kpi">
                        <span>{t('aiUsage.details.endpoint')}</span>
                        <strong>{selectedCall.requestPayload.endpoint || '-'}</strong>
                      </div>
                      <div className="kpi">
                        <span>{t('aiUsage.details.httpStatus')}</span>
                        <strong>
                          {selectedCall.responsePayload.httpStatus === null
                            ? '-'
                            : selectedCall.responsePayload.httpStatus}
                        </strong>
                      </div>
                      <div className="kpi">
                        <span>{t('aiUsage.details.finishReason')}</span>
                        <strong>{selectedCall.responsePayload.finishReason || '-'}</strong>
                      </div>
                    </div>

                    <div className="ai-usage-payload-grid">
                      <article className="panel ai-usage-code-panel">
                        <h3>{t('aiUsage.details.requestPayload')}</h3>
                        <pre>{JSON.stringify(selectedCall.requestPayload, null, 2)}</pre>
                      </article>

                      <article className="panel ai-usage-code-panel">
                        <h3>{t('aiUsage.details.responsePayload')}</h3>
                        <pre>{JSON.stringify(selectedCall.responsePayload, null, 2)}</pre>
                      </article>
                    </div>
                  </>
                ) : null}
              </section>
            </div>
          </section>
        </>
      ) : null}
    </Layout>
  );
}

function formatDate(value: string, formatter: Intl.DateTimeFormat): string {
  if (!value.trim()) {
    return '-';
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return '-';
  }
  return formatter.format(parsed);
}

function formatPromptType(type: PromptType): string {
  if (type === 'ai_advisor_system') {
    return 'AI Advisor - System';
  }
  if (type === 'ai_advisor_user') {
    return 'AI Advisor - Context';
  }
  return 'Simulation - Explanation';
}
