import { FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PublicStrategyListing,
  PromptDefinition,
  StrategyAdvancedSettings,
  StrategyDecisionMode,
  StrategyFeePreference,
  Strategy,
  StrategyRiskProfile,
  StrategySymbol,
  STRATEGY_SYMBOLS,
  StrategyTargetAllocation,
  createStrategy,
  deleteStrategy,
  duplicateStrategy,
  getStrategies,
  importPublicStrategy,
  isUnauthorizedError,
  listPublicStrategies,
  listPrompts,
  resetDefaultStrategies,
  shareStrategy,
  unshareStrategy,
  updateStrategy,
} from '../api';
import { InfoTip } from '../components/InfoTip';
import { useI18n } from '../i18n/i18n';
import { Layout } from '../components/Layout';

export function StrategiesPage(): JSX.Element {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [prompts, setPrompts] = useState<PromptDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [statusKind, setStatusKind] = useState<'success' | 'error'>('success');
  const [editingStrategyId, setEditingStrategyId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [riskProfile, setRiskProfile] = useState<StrategyRiskProfile>('balanced');
  const [monthlyBudgetEur, setMonthlyBudgetEur] = useState(300);
  const [rebalancingPerDay, setRebalancingPerDay] = useState(1);
  const [maxPositionPct, setMaxPositionPct] = useState(55);
  const [reserveCashPct, setReserveCashPct] = useState(6);
  const [minOrderSizeEur, setMinOrderSizeEur] = useState(6);
  const [slippagePct, setSlippagePct] = useState(0.12);
  const [feePreference, setFeePreference] = useState<StrategyFeePreference>('maker');
  const [takeProfitTargetPct, setTakeProfitTargetPct] = useState(4.8);
  const [stopLossPct, setStopLossPct] = useState(2.6);
  const [allowSellAtLoss, setAllowSellAtLoss] = useState(false);
  const [forceSellAfterDowntrendDays, setForceSellAfterDowntrendDays] = useState(10);
  const [forceSellDowntrendThresholdPct, setForceSellDowntrendThresholdPct] = useState(6);
  const [requireDipForBuy, setRequireDipForBuy] = useState(true);
  const [minDipPctToBuy, setMinDipPctToBuy] = useState(0.5);
  const [maxDailyPumpPctToBuy, setMaxDailyPumpPctToBuy] = useState(2.6);
  const [decisionMode, setDecisionMode] = useState<StrategyDecisionMode>('ai_assisted');
  const [aiSystemPromptId, setAiSystemPromptId] = useState('ai-advisor-system-default');
  const [aiUserPromptId, setAiUserPromptId] = useState('ai-advisor-user-default');
  const [targetAllocation, setTargetAllocation] = useState<StrategyTargetAllocation>(
    defaultTargetAllocationByRisk('balanced'),
  );
  const [comparisonStrategyIds, setComparisonStrategyIds] = useState<string[]>([]);
  const [publicStrategies, setPublicStrategies] = useState<PublicStrategyListing[]>([]);

  useEffect(() => {
    async function load(): Promise<void> {
      try {
        const [strategyList, promptList, publicList] = await Promise.all([
          getStrategies(),
          listPrompts(),
          listPublicStrategies(),
        ]);
        setStrategies(strategyList);
        setPrompts(promptList);
        setPublicStrategies(publicList);
        setLoading(false);
        setStatus('');
      } catch (currentError) {
        if (isUnauthorizedError(currentError)) {
          navigate('/login', { replace: true });
          return;
        }
        setLoading(false);
        setStatusKind('error');
        setStatus('Unable to load strategies.');
      }
    }
    void load();
  }, [navigate]);

  useEffect(() => {
    setComparisonStrategyIds((current) => {
      const available = new Set(strategies.map((strategy) => strategy.id));
      return current.filter((id) => available.has(id));
    });
  }, [strategies]);

  function toggleStrategyComparison(strategyId: string): void {
    setComparisonStrategyIds((current) => {
      if (current.includes(strategyId)) {
        return current.filter((id) => id !== strategyId);
      }
      if (current.length >= 3) {
        return [...current.slice(1), strategyId];
      }
      return [...current, strategyId];
    });
  }

  const comparedStrategies = strategies.filter((strategy) =>
    comparisonStrategyIds.includes(strategy.id),
  );

  async function handleSave(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    try {
      const input = {
        name: name.trim(),
        description: description.trim(),
        riskProfile,
        monthlyBudgetEur: Math.min(5000, Math.max(50, monthlyBudgetEur)),
        rebalancingPerDay: Math.min(4, Math.max(1, rebalancingPerDay)),
        maxPositionPct: Math.min(80, Math.max(10, maxPositionPct)),
        advanced: buildAdvancedSettings({
          reserveCashPct,
          minOrderSizeEur,
          slippagePct,
          feePreference,
          takeProfitTargetPct,
          stopLossPct,
          allowSellAtLoss,
          forceSellAfterDowntrendDays,
          forceSellDowntrendThresholdPct,
          requireDipForBuy,
          minDipPctToBuy,
          maxDailyPumpPctToBuy,
          decisionMode,
          aiSystemPromptId,
          aiUserPromptId,
        }),
        targetAllocation: normalizeTargetAllocation(targetAllocation, riskProfile),
      };
      if (editingStrategyId) {
        const payload = await updateStrategy(editingStrategyId, input);
        setStrategies(payload.strategies);
        setStatusKind('success');
        setStatus(`Strategy updated: ${payload.updated.name} (${payload.updated.id})`);
      } else {
        const payload = await createStrategy(input);
        setStrategies(payload.strategies);
        setStatusKind('success');
        setStatus(`Strategy created: ${payload.created.name} (${payload.created.id})`);
      }
      resetForm();
    } catch (currentError) {
      if (isUnauthorizedError(currentError)) {
        navigate('/login', { replace: true });
        return;
      }
      setStatusKind('error');
      setStatus(editingStrategyId ? 'Failed to update strategy.' : 'Failed to create strategy.');
    }
  }

  async function handleDuplicate(strategy: Strategy): Promise<void> {
    try {
      const payload = await duplicateStrategy(strategy.id);
      setStrategies(payload.strategies);
      setStatusKind('success');
      setStatus(`Strategy duplicated: ${payload.duplicated.name} (${payload.duplicated.id})`);
    } catch (currentError) {
      if (isUnauthorizedError(currentError)) {
        navigate('/login', { replace: true });
        return;
      }
      setStatusKind('error');
      setStatus('Unable to duplicate strategy.');
    }
  }

  async function handleShare(strategy: Strategy): Promise<void> {
    try {
      const payload = await shareStrategy(strategy.id);
      setPublicStrategies(payload.strategies);
      setStatusKind('success');
      setStatus(`Strategy shared publicly: ${strategy.name}`);
    } catch (currentError) {
      if (isUnauthorizedError(currentError)) {
        navigate('/login', { replace: true });
        return;
      }
      setStatusKind('error');
      setStatus('Unable to share this strategy.');
    }
  }

  async function handleUnshare(shareId: string): Promise<void> {
    try {
      await unshareStrategy(shareId);
      const refreshed = await listPublicStrategies();
      setPublicStrategies(refreshed);
      setStatusKind('success');
      setStatus('Public share removed.');
    } catch (currentError) {
      if (isUnauthorizedError(currentError)) {
        navigate('/login', { replace: true });
        return;
      }
      setStatusKind('error');
      setStatus('Unable to remove this share.');
    }
  }

  async function handleImportPublic(shareId: string): Promise<void> {
    try {
      const payload = await importPublicStrategy(shareId);
      setStrategies(payload.strategies);
      setStatusKind('success');
      setStatus(`Strategy imported: ${payload.imported.name}`);
    } catch (currentError) {
      if (isUnauthorizedError(currentError)) {
        navigate('/login', { replace: true });
        return;
      }
      setStatusKind('error');
      setStatus('Unable to import this public strategy.');
    }
  }

  async function handleDelete(strategy: Strategy): Promise<void> {
    const confirmed = window.confirm(`Delete strategy "${strategy.name}"?`);
    if (!confirmed) {
      return;
    }

    try {
      const payload = await deleteStrategy(strategy.id);
      setStrategies(payload.strategies);
      setStatusKind('success');
      setStatus(`Strategy deleted: ${strategy.name} (${strategy.id})`);
      if (editingStrategyId === strategy.id) {
        resetForm();
      }
    } catch (currentError) {
      if (isUnauthorizedError(currentError)) {
        navigate('/login', { replace: true });
        return;
      }
      setStatusKind('error');
      setStatus('Unable to delete strategy.');
    }
  }

  async function handleResetDefaults(): Promise<void> {
    const confirmed = window.confirm('Replace all strategies with the 3 default strategies?');
    if (!confirmed) {
      return;
    }

    try {
      const payload = await resetDefaultStrategies();
      setStrategies(payload.strategies);
      resetForm();
      setStatusKind('success');
      setStatus('Default strategies recreated.');
    } catch (currentError) {
      if (isUnauthorizedError(currentError)) {
        navigate('/login', { replace: true });
        return;
      }
      setStatusKind('error');
      setStatus('Unable to recreate default strategies.');
    }
  }

  function startEdit(strategy: Strategy): void {
    setEditingStrategyId(strategy.id);
    setName(strategy.name);
    setDescription(strategy.description);
    setRiskProfile(strategy.riskProfile);
    setMonthlyBudgetEur(strategy.monthlyBudgetEur);
    setRebalancingPerDay(strategy.rebalancingPerDay);
    setMaxPositionPct(strategy.maxPositionPct);
    setReserveCashPct(strategy.advanced.reserveCashPct);
    setMinOrderSizeEur(strategy.advanced.minOrderSizeEur);
    setSlippagePct(strategy.advanced.slippagePct);
    setFeePreference(strategy.advanced.feePreference);
    setTakeProfitTargetPct(strategy.advanced.takeProfitTargetPct);
    setStopLossPct(strategy.advanced.stopLossPct);
    setAllowSellAtLoss(strategy.advanced.allowSellAtLoss ?? false);
    setForceSellAfterDowntrendDays(strategy.advanced.forceSellAfterDowntrendDays ?? 28);
    setForceSellDowntrendThresholdPct(strategy.advanced.forceSellDowntrendThresholdPct ?? 15);
    setRequireDipForBuy(strategy.advanced.requireDipForBuy ?? true);
    setMinDipPctToBuy(strategy.advanced.minDipPctToBuy ?? 0.7);
    setMaxDailyPumpPctToBuy(strategy.advanced.maxDailyPumpPctToBuy ?? 3.4);
    setDecisionMode(strategy.advanced.decisionMode ?? 'ai_assisted');
    setAiSystemPromptId(strategy.advanced.aiSystemPromptId ?? 'ai-advisor-system-default');
    setAiUserPromptId(strategy.advanced.aiUserPromptId ?? 'ai-advisor-user-default');
    setTargetAllocation(
      strategy.targetAllocation ?? defaultTargetAllocationByRisk(strategy.riskProfile),
    );
    setStatus('');
  }

  function resetForm(): void {
    setEditingStrategyId(null);
    setName('');
    setDescription('');
    setRiskProfile('balanced');
    setMonthlyBudgetEur(300);
    setRebalancingPerDay(1);
    setMaxPositionPct(55);
    setReserveCashPct(6);
    setMinOrderSizeEur(6);
    setSlippagePct(0.12);
    setFeePreference('maker');
    setTakeProfitTargetPct(4.8);
    setStopLossPct(2.6);
    setAllowSellAtLoss(false);
    setForceSellAfterDowntrendDays(10);
    setForceSellDowntrendThresholdPct(6);
    setRequireDipForBuy(true);
    setMinDipPctToBuy(0.5);
    setMaxDailyPumpPctToBuy(2.6);
    setDecisionMode('ai_assisted');
    setAiSystemPromptId('ai-advisor-system-default');
    setAiUserPromptId('ai-advisor-user-default');
    setTargetAllocation(defaultTargetAllocationByRisk('balanced'));
  }

  const formTitle = editingStrategyId ? 'Edit strategy' : 'Create strategy';
  const submitLabel = editingStrategyId ? 'Save changes' : 'Save strategy';

  return (
    <Layout title={t('page.strategies.title')} subtitle={t('page.strategies.subtitle')}>
      <section className="strategies-grid">
        <article className="panel strategy-form-panel">
          <h2>{formTitle}</h2>
          <p>{t('auto.beginner_tip_change_only_a_few')}</p>
          <form
            className="strategy-form strategy-form--stacked"
            onSubmit={(event) => void handleSave(event)}
          >
            <div className="form-group">
              <h3>{t('auto.strategy_identity')}</h3>
              <div className="form-grid">
                <label className="field">
                  <span className="field-label">
                    {t('auto.name')}
                    <InfoTip
                      label="Strategy name"
                      text="Short name to quickly identify the tested idea."
                    />
                  </span>
                  <input
                    value={name}
                    onChange={(event) => {
                      setName(event.target.value);
                    }}
                    placeholder="Ex: Cautious DCA 300€"
                    required
                  />
                </label>
                <label className="field">
                  <span className="field-label">
                    {t('auto.description')}
                    <InfoTip
                      label="Description"
                      text="Hypothesis being tested (ex: more ETH, lower frequency, etc.)."
                    />
                  </span>
                  <input
                    value={description}
                    onChange={(event) => {
                      setDescription(event.target.value);
                    }}
                    placeholder="Ex: Reduce frequency to limit false signals"
                    required
                  />
                </label>
              </div>
            </div>

            <div className="form-group">
              <h3>{t('auto.execution')}</h3>
              <div className="form-grid">
                <label className="field">
                  <span className="field-label">
                    Monthly budget (EUR)
                    <InfoTip
                      label="Monthly budget"
                      text="Amount injected each month into the strategy (simulated funds in paper trading)."
                    />
                  </span>
                  <input
                    type="number"
                    min={50}
                    max={5000}
                    value={monthlyBudgetEur}
                    onChange={(event) => {
                      setMonthlyBudgetEur(Number(event.target.value));
                    }}
                    required
                  />
                </label>
                <label className="field">
                  <span className="field-label">
                    {t('auto.trading_cycles_day')}
                    <InfoTip
                      label="Trading cycles"
                      text="Number of order passes per day. Higher is more reactive but noisier."
                    />
                  </span>
                  <input
                    type="number"
                    min={1}
                    max={4}
                    value={rebalancingPerDay}
                    onChange={(event) => {
                      setRebalancingPerDay(Number(event.target.value));
                    }}
                    required
                  />
                </label>
              </div>
            </div>

            <div className="form-group">
              <h3>{t('auto.risk')}</h3>
              <div className="form-grid">
                <label className="field">
                  <span className="field-label">
                    {t('auto.risk_profile')}
                    <InfoTip
                      label="Risk profile"
                      text="Defensive = more cautious, balanced = intermediate, aggressive = more volatile."
                    />
                  </span>
                  <select
                    value={riskProfile}
                    onChange={(event) => {
                      setRiskProfile(event.target.value as StrategyRiskProfile);
                    }}
                  >
                    <option value="defensive">{t('auto.defensive')}</option>
                    <option value="balanced">{t('auto.balanced')}</option>
                    <option value="aggressive">{t('auto.aggressive')}</option>
                  </select>
                </label>

                <label className="field">
                  <span className="field-label">
                    {t('auto.ai_system_prompt')}
                    <InfoTip
                      label="AI system prompt"
                      text="Global rules sent to the AI model (response format, guardrails, decision style)."
                    />
                  </span>
                  <select
                    value={aiSystemPromptId}
                    onChange={(event) => {
                      setAiSystemPromptId(event.target.value);
                    }}
                  >
                    {buildPromptOptions(prompts, 'ai_advisor_system').map((prompt) => {
                      return (
                        <option key={prompt.id} value={prompt.id}>
                          {prompt.name}
                        </option>
                      );
                    })}
                  </select>
                </label>

                <label className="field">
                  <span className="field-label">
                    {t('auto.ai_context_prompt')}
                    <InfoTip
                      label="AI context prompt"
                      text="Template containing cycle context. Usually uses {{contextJson}} to inject data."
                    />
                  </span>
                  <select
                    value={aiUserPromptId}
                    onChange={(event) => {
                      setAiUserPromptId(event.target.value);
                    }}
                  >
                    {buildPromptOptions(prompts, 'ai_advisor_user').map((prompt) => {
                      return (
                        <option key={prompt.id} value={prompt.id}>
                          {prompt.name}
                        </option>
                      );
                    })}
                  </select>
                </label>
                <label className="field">
                  <span className="field-label">
                    Max position per asset (%)
                    <InfoTip
                      label="Max position"
                      text="Concentration limit: maximum portfolio share allowed on a single asset."
                    />
                  </span>
                  <input
                    type="number"
                    min={10}
                    max={80}
                    value={maxPositionPct}
                    onChange={(event) => {
                      setMaxPositionPct(Number(event.target.value));
                    }}
                    required
                  />
                </label>
              </div>
            </div>

            <div className="form-group">
              <h3>Target allocation (%)</h3>
              <p>{t('auto.define_the_weight_of_each_cryp')}</p>
              <div className="form-grid">
                {STRATEGY_SYMBOLS.map((symbol) => {
                  return (
                    <label className="field" key={symbol}>
                      <span className="field-label">
                        {symbol}
                        <InfoTip
                          label={'Allocation ' + symbol}
                          text={'Target percentage allocated to ' + symbol + ' in this strategy.'}
                        />
                      </span>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step={0.5}
                        value={targetAllocation[symbol]}
                        onChange={(event) => {
                          setTargetAllocation((current) => {
                            return {
                              ...current,
                              [symbol]: Number(event.target.value),
                            };
                          });
                        }}
                        required
                      />
                    </label>
                  );
                })}
              </div>
              <div className="form-actions">
                <span>Total: {sumTargetAllocation(targetAllocation).toFixed(2)}%</span>
                <button
                  className="button button-secondary button-small"
                  type="button"
                  onClick={() => {
                    setTargetAllocation(defaultTargetAllocationByRisk(riskProfile));
                  }}
                >
                  {t('auto.prefill_from_profile')}
                </button>
              </div>
            </div>

            <details className="form-group advanced-group">
              <summary>
                {t('auto.advanced_configuration')}
                <InfoTip
                  label="Advanced configuration"
                  text="Optional parameters to refine simulation: use them progressively for clean comparisons."
                />
              </summary>
              <div className="form-grid">
                <label className="field">
                  <span className="field-label">
                    Cash / stablecoin reserve (%)
                    <InfoTip
                      label="Cash reserve"
                      text="Part of monthly budget kept in reserve (ex: USDC) to reduce volatility and keep flexibility."
                    />
                  </span>
                  <input
                    type="number"
                    min={0}
                    max={40}
                    step={0.5}
                    value={reserveCashPct}
                    onChange={(event) => {
                      setReserveCashPct(Number(event.target.value));
                    }}
                    required
                  />
                </label>

                <label className="field">
                  <span className="field-label">
                    Minimum order size (EUR)
                    <InfoTip
                      label="Minimum size"
                      text="Orders below this amount are ignored to avoid low-value micro operations."
                    />
                  </span>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    step={0.5}
                    value={minOrderSizeEur}
                    onChange={(event) => {
                      setMinOrderSizeEur(Number(event.target.value));
                    }}
                    required
                  />
                </label>

                <label className="field">
                  <span className="field-label">
                    Estimated max slippage (%)
                    <InfoTip
                      label="Slippage"
                      text="Difference between target and executed price. Higher values can mean less favorable execution."
                    />
                  </span>
                  <input
                    type="number"
                    min={0}
                    max={2}
                    step={0.01}
                    value={slippagePct}
                    onChange={(event) => {
                      setSlippagePct(Number(event.target.value));
                    }}
                    required
                  />
                </label>

                <label className="field">
                  <span className="field-label">
                    {t('auto.fee_preference')}
                    <InfoTip
                      label="Fee preference"
                      text="Maker: often lower fees but less immediate execution. Taker: immediate execution but higher fees."
                    />
                  </span>
                  <select
                    value={feePreference}
                    onChange={(event) => {
                      setFeePreference(event.target.value as StrategyFeePreference);
                    }}
                  >
                    <option value="hybrid">hybrid (mix)</option>
                    <option value="maker">{t('auto.maker')}</option>
                    <option value="taker">{t('auto.taker')}</option>
                  </select>
                </label>

                <label className="field">
                  <span className="field-label">
                    Take-profit threshold (%)
                    <InfoTip
                      label="Take-profit"
                      text="Sales are only validated if estimated gain exceeds this threshold."
                    />
                  </span>
                  <input
                    type="number"
                    min={0.5}
                    max={12}
                    step={0.1}
                    value={takeProfitTargetPct}
                    onChange={(event) => {
                      setTakeProfitTargetPct(Number(event.target.value));
                    }}
                    required
                  />
                </label>

                <label className="field">
                  <span className="field-label">
                    {t('auto.decision_mode')}
                    <InfoTip
                      label="Decision mode"
                      text="Simple allocation: automatic distribution. Rules: configurable buy/sell filter. AI: assistant suggesting buy/sell/hold without future data."
                    />
                  </span>
                  <select
                    value={decisionMode}
                    onChange={(event) => {
                      setDecisionMode(event.target.value as StrategyDecisionMode);
                    }}
                  >
                    <option value="allocation_only">{t('auto.simple_allocation')}</option>
                    <option value="rule_based">{t('auto.strategy_rules')}</option>
                    <option value="ai_assisted">{t('auto.ai_assisted')}</option>
                  </select>
                </label>

                <label className="field">
                  <span className="field-label">
                    Stop-loss threshold (%)
                    <InfoTip
                      label="Stop-loss"
                      text="Avoids buys if simulated downside exceeds this threshold to limit exposure in turbulent markets."
                    />
                  </span>
                  <input
                    type="number"
                    min={0.5}
                    max={12}
                    step={0.1}
                    value={stopLossPct}
                    onChange={(event) => {
                      setStopLossPct(Number(event.target.value));
                    }}
                    required
                  />
                </label>

                <div className="form-toggle-row">
                  <div
                    className={`toggle-btn${allowSellAtLoss ? ' selected' : ''}`}
                    tabIndex={0}
                    role="button"
                    aria-pressed={allowSellAtLoss}
                    onClick={() => setAllowSellAtLoss((v) => !v)}
                    onKeyDown={(e) => {
                      if (e.key === ' ' || e.key === 'Enter') {
                        e.preventDefault();
                        setAllowSellAtLoss((v) => !v);
                      }
                    }}
                  >
                    {t('auto.allow_selling_at_a_loss')}
                    <InfoTip
                      label="Sell at loss"
                      text="Disabled (recommended): strategy avoids negative exits unless trend remains durably poor."
                    />
                  </div>
                </div>

                <label className="field">
                  <span className="field-label">
                    Forced sell after downtrend (days)
                    <InfoTip
                      label="Blocage long"
                      text="If a crypto remains in a downtrend for this duration, selling at a loss becomes possible to limit stagnation."
                    />
                  </span>
                  <input
                    type="number"
                    min={3}
                    max={120}
                    step={1}
                    value={forceSellAfterDowntrendDays}
                    onChange={(event) => {
                      setForceSellAfterDowntrendDays(Number(event.target.value));
                    }}
                    required
                  />
                </label>

                <label className="field">
                  <span className="field-label">
                    Minimum drawdown for forced sell (%)
                    <InfoTip
                      label="Downside threshold"
                      text="Minimum loss from latest peak before allowing forced exit."
                    />
                  </span>
                  <input
                    type="number"
                    min={2}
                    max={60}
                    step={0.5}
                    value={forceSellDowntrendThresholdPct}
                    onChange={(event) => {
                      setForceSellDowntrendThresholdPct(Number(event.target.value));
                    }}
                    required
                  />
                </label>

                <div className="form-toggle-row">
                  <div
                    className={`toggle-btn${requireDipForBuy ? ' selected' : ''}`}
                    tabIndex={0}
                    role="button"
                    aria-pressed={requireDipForBuy}
                    onClick={() => setRequireDipForBuy((v) => !v)}
                    onKeyDown={(e) => {
                      if (e.key === ' ' || e.key === 'Enter') {
                        e.preventDefault();
                        setRequireDipForBuy((v) => !v);
                      }
                    }}
                  >
                    {t('auto.require_a_dip_before_buy')}
                    <InfoTip
                      label="Buy timing"
                      text="Strategy waits for a slight dip before buying to avoid chasing a rapid rally."
                    />
                  </div>
                </div>

                <label className="field">
                  <span className="field-label">
                    Minimum dip before buy (%)
                    <InfoTip
                      label="Minimum dip"
                      text="Minimum recent decline required before validating a buy."
                    />
                  </span>
                  <input
                    type="number"
                    min={0}
                    max={15}
                    step={0.1}
                    value={minDipPctToBuy}
                    onChange={(event) => {
                      setMinDipPctToBuy(Number(event.target.value));
                    }}
                    required
                    disabled={!requireDipForBuy}
                  />
                </label>

                <label className="field">
                  <span className="field-label">
                    Maximum tolerated rise before buy (%)
                    <InfoTip
                      label="Maximum rise"
                      text="If price has already risen above this threshold, buying is blocked."
                    />
                  </span>
                  <input
                    type="number"
                    min={0.5}
                    max={20}
                    step={0.1}
                    value={maxDailyPumpPctToBuy}
                    onChange={(event) => {
                      setMaxDailyPumpPctToBuy(Number(event.target.value));
                    }}
                    required
                  />
                </label>
              </div>
            </details>

            <div className="form-actions">
              <button className="button" type="submit">
                {submitLabel}
              </button>
              <button
                className="button button-secondary"
                type="button"
                onClick={() => {
                  void handleResetDefaults();
                }}
              >
                {t('auto.recreate_default_strategies')}
              </button>
              <button className="button button-secondary" type="button" onClick={resetForm}>
                {t('auto.reset')}
              </button>
              {editingStrategyId ? (
                <button className="button button-secondary" type="button" onClick={resetForm}>
                  {t('auto.cancel_editing')}
                </button>
              ) : null}
            </div>
          </form>
        </article>

        <aside className="panel strategy-help-panel">
          <h2>{t('auto.quick_help')}</h2>
          <p>{t('auto.this_page_fully_replaces_yaml')}</p>
          <ul className="cards-list">
            <li>
              <h3>{t('auto.clean_a_b_testing')}</h3>
              <p>{t('auto.compare_two_strategies_over_th')}</p>
            </li>
            <li>
              <h3>{t('auto.beginner_risk')}</h3>
              <p>
                {t('auto.if_you_are_starting_begin_with')}
                <strong>{t('auto.balanced')}</strong> and a low frequency (1 or 2 cycles/day).
              </p>
            </li>
            <li>
              <h3>{t('auto.concentration')}</h3>
              <p>{t('auto.keep_a_reasonable_max_per_asse')}</p>
            </li>
            <li>
              <h3>{t('auto.advanced_not_complicated')}</h3>
              <p>
                Open advanced settings only when testing a precise hypothesis (fees, slippage, cash
                reserve, etc.).
              </p>
            </li>
          </ul>
        </aside>
      </section>

      <section className="panel">
        <h2>{t('auto.saved_strategies')}</h2>
        {loading ? (
          <p>{t('auto.loading')}</p>
        ) : (
          <div className="table-scroll table-scroll-wide">
            <table>
              <thead>
                <tr>
                  <th>{t('auto.id')}</th>
                  <th>{t('auto.name')}</th>
                  <th>{t('auto.description')}</th>
                  <th>{t('auto.risk')}</th>
                  <th>{t('auto.budget')}</th>
                  <th>{t('auto.cycles')}</th>
                  <th>{t('auto.position_max')}</th>
                  <th>{t('auto.reserve')}</th>
                  <th>{t('auto.fees')}</th>
                  <th>{t('auto.slippage')}</th>
                  <th>{t('auto.mode')}</th>
                  <th>{t('auto.guardrails')}</th>
                  <th>{t('auto.allocation')}</th>
                  <th>{t('auto.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {strategies.map((strategy) => {
                  const ownShare = publicStrategies.find((row) => {
                    return row.isOwnedByRequester && row.sourceStrategyId === strategy.id;
                  });
                  return (
                    <tr key={strategy.id}>
                      <td>{strategy.id}</td>
                      <td>{strategy.name}</td>
                      <td>{strategy.description}</td>
                      <td>{strategy.riskProfile}</td>
                      <td>{strategy.monthlyBudgetEur} EUR</td>
                      <td>{strategy.rebalancingPerDay}</td>
                      <td>{strategy.maxPositionPct}%</td>
                      <td>{strategy.advanced.reserveCashPct}%</td>
                      <td>{strategy.advanced.feePreference}</td>
                      <td>{strategy.advanced.slippagePct}%</td>
                      <td>{formatDecisionMode(strategy.advanced.decisionMode)}</td>
                      <td>{formatDecisionGuards(strategy.advanced)}</td>
                      <td>{formatTargetAllocation(strategy.targetAllocation)}</td>
                      <td>
                        <div className="table-actions">
                          <button
                            className="button button-secondary button-small"
                            type="button"
                            onClick={() => {
                              if (ownShare) {
                                void handleUnshare(ownShare.shareId);
                                return;
                              }
                              void handleShare(strategy);
                            }}
                          >
                            {ownShare ? 'Remove from social' : 'Share'}
                          </button>
                          <button
                            className="button button-secondary button-small"
                            type="button"
                            onClick={() => {
                              toggleStrategyComparison(strategy.id);
                            }}
                          >
                            {comparisonStrategyIds.includes(strategy.id)
                              ? 'Remove comparison'
                              : 'Compare'}
                          </button>
                          <button
                            className="button button-secondary button-small"
                            type="button"
                            onClick={() => {
                              startEdit(strategy);
                            }}
                          >
                            {t('auto.edit')}
                          </button>
                          <button
                            className="button button-secondary button-small"
                            type="button"
                            onClick={() => {
                              void handleDuplicate(strategy);
                            }}
                          >
                            {t('auto.duplicate')}
                          </button>
                          <button
                            className="button button-danger button-small"
                            type="button"
                            onClick={() => {
                              void handleDelete(strategy);
                            }}
                          >
                            {t('auto.delete')}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="panel">
        <h2>Strategy comparison (2 to 3)</h2>
        {comparedStrategies.length < 2 ? (
          <p>{t('auto.select_at_least_2_strategies_w')}</p>
        ) : (
          <div className="table-scroll table-scroll-wide">
            <table>
              <thead>
                <tr>
                  <th>{t('auto.criterion')}</th>
                  {comparedStrategies.map((strategy) => (
                    <th key={strategy.id}>{strategy.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{t('auto.risk_profile')}</td>
                  {comparedStrategies.map((strategy) => (
                    <td key={strategy.id}>{strategy.riskProfile}</td>
                  ))}
                </tr>
                <tr>
                  <td>{t('auto.monthly_budget')}</td>
                  {comparedStrategies.map((strategy) => (
                    <td key={strategy.id}>{strategy.monthlyBudgetEur} EUR</td>
                  ))}
                </tr>
                <tr>
                  <td>{t('auto.cycles_day')}</td>
                  {comparedStrategies.map((strategy) => (
                    <td key={strategy.id}>{strategy.rebalancingPerDay}</td>
                  ))}
                </tr>
                <tr>
                  <td>Position max (%)</td>
                  {comparedStrategies.map((strategy) => (
                    <td key={strategy.id}>{strategy.maxPositionPct}%</td>
                  ))}
                </tr>
                <tr>
                  <td>{t('auto.decision_mode')}</td>
                  {comparedStrategies.map((strategy) => (
                    <td key={strategy.id}>{formatDecisionMode(strategy.advanced.decisionMode)}</td>
                  ))}
                </tr>
                <tr>
                  <td>{t('auto.target_allocation')}</td>
                  {comparedStrategies.map((strategy) => (
                    <td key={strategy.id}>{formatTargetAllocation(strategy.targetAllocation)}</td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="panel">
        <h2>Social portfolio (public and anonymized)</h2>
        <p>{t('auto.discover_community_shared_stra')}</p>
        {publicStrategies.filter((row) => !row.isOwnedByRequester).length === 0 ? (
          <p>{t('auto.no_public_strategy_available_a')}</p>
        ) : (
          <div className="table-scroll table-scroll-wide">
            <table>
              <thead>
                <tr>
                  <th>{t('auto.share')}</th>
                  <th>{t('auto.author')}</th>
                  <th>{t('auto.name')}</th>
                  <th>{t('auto.description')}</th>
                  <th>{t('auto.risk')}</th>
                  <th>{t('auto.budget')}</th>
                  <th>{t('auto.cycles')}</th>
                  <th>{t('auto.position_max')}</th>
                  <th>{t('auto.allocation')}</th>
                  <th>{t('auto.action')}</th>
                </tr>
              </thead>
              <tbody>
                {publicStrategies
                  .filter((row) => !row.isOwnedByRequester)
                  .map((row) => (
                    <tr key={row.shareId}>
                      <td>{row.shareId}</td>
                      <td>{row.ownerAlias}</td>
                      <td>{row.strategy.name}</td>
                      <td>{row.strategy.description}</td>
                      <td>{row.strategy.riskProfile}</td>
                      <td>{row.strategy.monthlyBudgetEur} EUR</td>
                      <td>{row.strategy.rebalancingPerDay}</td>
                      <td>{row.strategy.maxPositionPct}%</td>
                      <td>{formatTargetAllocation(row.strategy.targetAllocation)}</td>
                      <td>
                        <button
                          className="button button-secondary button-small"
                          type="button"
                          onClick={() => {
                            void handleImportPublic(row.shareId);
                          }}
                        >
                          {t('auto.import')}
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {status ? (
        <section
          className={`panel status ${statusKind === 'error' ? 'status-error' : 'status-success'}`}
        >
          {status}
        </section>
      ) : null}
    </Layout>
  );
}

function buildAdvancedSettings(input: StrategyAdvancedSettings): StrategyAdvancedSettings {
  return {
    reserveCashPct: Math.min(40, Math.max(0, input.reserveCashPct)),
    minOrderSizeEur: Math.min(100, Math.max(1, input.minOrderSizeEur)),
    slippagePct: Math.min(2, Math.max(0, input.slippagePct)),
    feePreference: input.feePreference,
    takeProfitTargetPct: Math.min(12, Math.max(0.5, input.takeProfitTargetPct)),
    stopLossPct: Math.min(12, Math.max(0.5, input.stopLossPct)),
    allowSellAtLoss: Boolean(input.allowSellAtLoss),
    forceSellAfterDowntrendDays: Math.floor(
      Math.min(120, Math.max(3, input.forceSellAfterDowntrendDays ?? 28)),
    ),
    forceSellDowntrendThresholdPct: Math.min(
      60,
      Math.max(2, input.forceSellDowntrendThresholdPct ?? 15),
    ),
    requireDipForBuy: input.requireDipForBuy ?? true,
    minDipPctToBuy: Math.min(15, Math.max(0, input.minDipPctToBuy ?? 0.7)),
    maxDailyPumpPctToBuy: Math.min(20, Math.max(0.5, input.maxDailyPumpPctToBuy ?? 3.4)),
    decisionMode: normalizeDecisionMode(input.decisionMode),
    aiSystemPromptId: normalizePromptId(input.aiSystemPromptId, 'ai-advisor-system-default'),
    aiUserPromptId: normalizePromptId(input.aiUserPromptId, 'ai-advisor-user-default'),
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

function normalizeTargetAllocation(
  allocation: StrategyTargetAllocation,
  riskProfile: StrategyRiskProfile,
): StrategyTargetAllocation {
  const fallback = defaultTargetAllocationByRisk(riskProfile);
  const symbols: StrategySymbol[] = STRATEGY_SYMBOLS;
  const values = symbols.map((symbol) => {
    return Number(allocation[symbol]);
  });

  if (values.some((value) => !Number.isFinite(value) || value < 0)) {
    return fallback;
  }

  const total = values.reduce((sum, value) => {
    return sum + value;
  }, 0);
  if (total <= 0) {
    return fallback;
  }

  const normalized = {} as StrategyTargetAllocation;
  let partial = 0;
  for (let index = 0; index < symbols.length; index += 1) {
    const symbol = symbols[index];
    if (index === symbols.length - 1) {
      normalized[symbol] = Number((100 - partial).toFixed(2));
    } else {
      const value = Number(((allocation[symbol] / total) * 100).toFixed(2));
      normalized[symbol] = value;
      partial = Number((partial + value).toFixed(2));
    }
  }

  return normalized;
}

function sumTargetAllocation(allocation: StrategyTargetAllocation): number {
  return STRATEGY_SYMBOLS.reduce((sum, symbol) => {
    return sum + allocation[symbol];
  }, 0);
}

function formatTargetAllocation(allocation?: StrategyTargetAllocation): string {
  const value = allocation ?? defaultTargetAllocationByRisk('balanced');
  return STRATEGY_SYMBOLS.map((symbol) => {
    return symbol + ' ' + value[symbol].toFixed(1) + '%';
  }).join(' · ');
}

function formatDecisionGuards(advanced: StrategyAdvancedSettings): string {
  const lossRule = advanced.allowSellAtLoss ? 'Selling at loss allowed' : 'Selling at loss blocked';
  const forcedSell =
    (advanced.forceSellAfterDowntrendDays ?? 28).toFixed(0) +
    'j / ' +
    (advanced.forceSellDowntrendThresholdPct ?? 15).toFixed(1) +
    '%';
  const buyRule =
    advanced.requireDipForBuy === false
      ? 'Buy without required dip'
      : 'Dip > ' + (advanced.minDipPctToBuy ?? 0.7).toFixed(1) + '%';
  const pumpRule = 'Max pump ' + (advanced.maxDailyPumpPctToBuy ?? 3.4) + '%';
  const promptRule =
    'Prompts: ' +
    (advanced.aiSystemPromptId ?? 'ai-advisor-system-default') +
    ' / ' +
    (advanced.aiUserPromptId ?? 'ai-advisor-user-default');

  return (
    lossRule + ' · Forced: ' + forcedSell + ' · ' + buyRule + ' · ' + pumpRule + ' · ' + promptRule
  );
}

function formatDecisionMode(mode: StrategyDecisionMode | undefined): string {
  const normalized = normalizeDecisionMode(mode);
  if (normalized === 'allocation_only') {
    return 'simple allocation';
  }
  if (normalized === 'ai_assisted') {
    return 'AI-assisted';
  }
  return 'rules';
}

function normalizeDecisionMode(mode: StrategyDecisionMode | undefined): StrategyDecisionMode {
  if (mode === 'allocation_only' || mode === 'rule_based' || mode === 'ai_assisted') {
    return mode;
  }
  return 'rule_based';
}

function normalizePromptId(value: string | undefined, fallback: string): string {
  if (typeof value !== 'string') {
    return fallback;
  }
  const cleaned = value.trim();
  if (!cleaned) {
    return fallback;
  }
  return cleaned;
}

function buildPromptOptions(
  prompts: PromptDefinition[],
  type: 'ai_advisor_system' | 'ai_advisor_user',
): PromptDefinition[] {
  const byType = prompts.filter((prompt) => {
    return prompt.type === type;
  });
  if (byType.length > 0) {
    return byType;
  }
  return [
    {
      id: type === 'ai_advisor_system' ? 'ai-advisor-system-default' : 'ai-advisor-user-default',
      type,
      name:
        type === 'ai_advisor_system'
          ? 'AI Advisor - System (Default)'
          : 'AI Advisor - Context (Default)',
      description: '',
      content: '',
      isDefault: true,
      templateKey: null,
      createdAt: '',
      updatedAt: '',
    },
  ];
}
