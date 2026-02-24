import { ChangeEvent, ReactElement, ReactNode } from 'react';
import { Layout } from '../components/Layout';
import { useI18n } from '../i18n/i18n';
import { getWizardStrategy, importWizardStrategies } from '../api';
import { CRYPTO_CATALOG } from './strategy-wizard/constants';
import { ExecutionConfigurationSection } from './strategy-wizard/ExecutionConfigurationSection';
import { WizardStepLayout } from './strategy-wizard/WizardStepLayout';
import { useStrategyWizardState } from './strategy-wizard/useStrategyWizardState';
import { useStrategyWizardHandlers } from './strategy-wizard/useStrategyWizardHandlers';
import styles from './StrategyWizardPage.module.css';

type StrategyProfile = ApiStrategyProfile;
type PromptTemplate = ApiPromptTemplate;

export function StrategyWizardPage(): ReactElement {
  const wizardState = useStrategyWizardState();
  const wizardHandlers = useStrategyWizardHandlers(wizardState);
  // ...existing component code...
}

function Tooltip({
  children,
  content,
  enabled = true,
}: {
  children: ReactNode;
  content: string;
  enabled?: boolean;
}): ReactElement {
  if (!enabled) {
    return <>{children}</>;
  }

  return (
    <span className={styles.tooltipContainer}>
      {children}
      <span className={styles.tooltipIcon}>?</span>
      <span className={styles.tooltipContent}>{content}</span>
    </span>
  );

  const handleImportStrategies = async (
    event: ChangeEvent<HTMLInputElement>,
  ): Promise<void> => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setLoading(true);
    try {
      const raw = await file.text();
      const parsed = JSON.parse(raw) as {
        schemaVersion: 1;
        exportedAt: string;
        strategies: Array<{
          name: string;
          description: string;
          riskLevel: 'defensive' | 'balanced' | 'aggressive';
          type: StrategyType;
          config: Record<string, unknown>;
          safeguards: SafeguardsDefaults;
        }>;
      };

      await importWizardStrategies({
        schemaVersion: parsed.schemaVersion,
        exportedAt: parsed.exportedAt,
        strategies: parsed.strategies.map((strategy) => {
          if (strategy.type === 'allocation') {
            const allocationConfig = strategy.config as {
              allocation?: Record<string, number>;
              rebalancingFrequencyDays?: number;
              rebalancingThresholdPct?: number;
            };
            return {
              name: strategy.name,
              description: strategy.description,
              riskLevel: strategy.riskLevel,
              type: strategy.type,
              allocationConfig: {
                ...(allocationConfig.allocation ?? {}),
                rebalancingFrequencyDays:
                  allocationConfig.rebalancingFrequencyDays ?? 1,
                rebalancingThresholdPct:
                  allocationConfig.rebalancingThresholdPct ?? 5,
              },
              safeguards: strategy.safeguards,
            };
          }

          if (strategy.type === 'historical_signals') {
            const historicalConfig = strategy.config as {
              cryptoSymbols?: string[];
              lookbackDays?: number;
              buyDropThresholdPct?: number;
              sellRiseThresholdPct?: number;
              maxCapitalPerSignalPct?: number;
              trendLookbackDays?: number;
              maxVolatilityPct?: number;
              minDaysBetweenTrades?: number;
            };
            return {
              name: strategy.name,
              description: strategy.description,
              riskLevel: strategy.riskLevel,
              type: strategy.type,
              historicalConfig: {
                cryptoSymbols: historicalConfig.cryptoSymbols ?? ['BTC', 'ETH'],
                lookbackDays: historicalConfig.lookbackDays ?? 30,
                buyDropThresholdPct: historicalConfig.buyDropThresholdPct ?? 3,
                sellRiseThresholdPct:
                  historicalConfig.sellRiseThresholdPct ?? 5,
                maxCapitalPerSignalPct:
                  historicalConfig.maxCapitalPerSignalPct ?? 20,
                trendLookbackDays: historicalConfig.trendLookbackDays ?? 30,
                maxVolatilityPct: historicalConfig.maxVolatilityPct ?? 8,
                minDaysBetweenTrades:
                  historicalConfig.minDaysBetweenTrades ?? 2,
              },
              safeguards: strategy.safeguards,
            };
          }

          const aiConfig = strategy.config as {
            cryptoSymbols?: string[];
            aiQueryFrequencyDays?: number;
            promptTemplate?: 'defensive' | 'balanced' | 'aggressive';
            customPrompt?: string;
            aiSafeguards?: {
              maxCostPerCallEur?: number;
              maxCallsPerMonth?: number;
              maxSessionDurationMinutes?: number;
              maxConcurrentPositions?: number;
            };
          };

          return {
            name: strategy.name,
            description: strategy.description,
            riskLevel: strategy.riskLevel,
            type: strategy.type,
            aiConfig: {
              cryptoSymbols: aiConfig.cryptoSymbols ?? ['BTC', 'ETH', 'SOL'],
              aiQueryFrequencyDays: aiConfig.aiQueryFrequencyDays ?? 2,
              promptTemplate: aiConfig.promptTemplate,
              customPrompt: aiConfig.customPrompt,
              maxCostPerCallEur: aiConfig.aiSafeguards?.maxCostPerCallEur,
              maxCallsPerMonth: aiConfig.aiSafeguards?.maxCallsPerMonth,
              maxSessionDurationMinutes:
                aiConfig.aiSafeguards?.maxSessionDurationMinutes,
              maxConcurrentPositions:
                aiConfig.aiSafeguards?.maxConcurrentPositions,
            },
            safeguards: strategy.safeguards,
          };
        }),
      });

      setStatusKind('success');
      setStatus('Strategies imported successfully');
      await handleListStrategies();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to import strategies';
      setStatusKind('error');
      setStatus(message);
      setLoading(false);
    } finally {
      event.target.value = '';
    }
  };

  const handleEditStrategy = async (strategyId: string): Promise<void> => {
    setLoading(true);
    try {
      const { strategy } = await getWizardStrategy(strategyId);

      setEditingStrategyId(strategy.id);
      setName(strategy.name);
      setDescription(strategy.description);
      setRiskLevel(strategy.riskLevel);
      setStrategyType(strategy.type);

      const incomingSafeguards = strategy.safeguards as Partial<
        SafeguardsDefaults & {
          maxAmountPerDayEur?: number;
          maxAmountPerMonthEur?: number;
        }
      >;

      setSafeguards({
        monthlyBudgetEur:
          incomingSafeguards.monthlyBudgetEur ??
          incomingSafeguards.maxAmountPerMonthEur ??
          safeguards.monthlyBudgetEur,
        maxDailySpendEur:
          incomingSafeguards.maxDailySpendEur ??
          incomingSafeguards.maxAmountPerDayEur ??
          safeguards.maxDailySpendEur,
        decisionChecksPerDay:
          incomingSafeguards.decisionChecksPerDay ??
          safeguards.decisionChecksPerDay,
        minAiConfidencePctForExecution:
          incomingSafeguards.minAiConfidencePctForExecution ??
          safeguards.minAiConfidencePctForExecution,
        maxPositionSizeEur:
          incomingSafeguards.maxPositionSizeEur ??
          safeguards.maxPositionSizeEur,
        maxConcurrentPositions:
          incomingSafeguards.maxConcurrentPositions ??
          safeguards.maxConcurrentPositions,
        minOrderSizeEur:
          incomingSafeguards.minOrderSizeEur ?? safeguards.minOrderSizeEur,
        rebalancingEnabled:
          incomingSafeguards.rebalancingEnabled ??
          safeguards.rebalancingEnabled,
        acceptLosses:
          incomingSafeguards.acceptLosses ?? safeguards.acceptLosses,
      });

      if (strategy.type === 'allocation') {
        const config = strategy.config as {
          allocation?: Record<string, number>;
          rebalancingFrequencyDays?: number;
          rebalancingThresholdPct?: number;
        };
        const nextAllocation = config.allocation;
        if (nextAllocation && typeof nextAllocation === 'object') {
          setAllocation(nextAllocation);
        }
        setAllocationRebalancingFrequencyDays(
          config.rebalancingFrequencyDays ?? 1,
        );
        setAllocationRebalancingThresholdPct(
          config.rebalancingThresholdPct ?? 5,
        );
      } else if (strategy.type === 'ai_assisted') {
        const config = strategy.config as {
          cryptoSymbols?: string[];
          promptTemplate?: 'defensive' | 'balanced' | 'aggressive';
          aiQueryFrequencyDays?: number;
          customPrompt?: string;
          aiSafeguards?: {
            maxCostPerCallEur?: number;
            maxCallsPerMonth?: number;
            maxSessionDurationMinutes?: number;
            maxConcurrentPositions?: number;
          };
          maxCostPerCallEur?: number;
          maxCallsPerMonth?: number;
          maxSessionDurationMinutes?: number;
          maxConcurrentPositions?: number;
        };

        setCryptoSymbols(
          Array.isArray(config.cryptoSymbols)
            ? config.cryptoSymbols
            : ['BTC', 'ETH', 'SOL'],
        );
        setSelectedTemplate(config.promptTemplate ?? 'balanced');
        setCustomPrompt(config.customPrompt ?? '');

        const aiSafeguards = config.aiSafeguards ?? {};
        setAiGuardrails({
          aiQueryFrequencyDays: config.aiQueryFrequencyDays ?? 2,
          maxCostPerCallEur:
            aiSafeguards.maxCostPerCallEur ?? config.maxCostPerCallEur ?? 2,
          maxCallsPerMonth:
            aiSafeguards.maxCallsPerMonth ?? config.maxCallsPerMonth ?? 30,
          maxSessionDurationMinutes:
            aiSafeguards.maxSessionDurationMinutes ??
            config.maxSessionDurationMinutes ??
            60,
          maxConcurrentPositions:
            aiSafeguards.maxConcurrentPositions ??
            config.maxConcurrentPositions ??
            10,
        });
      } else {
        const config = strategy.config as {
          cryptoSymbols?: string[];
          lookbackDays?: number;
          buyDropThresholdPct?: number;
          sellRiseThresholdPct?: number;
          maxCapitalPerSignalPct?: number;
          trendLookbackDays?: number;
          maxVolatilityPct?: number;
          minDaysBetweenTrades?: number;
        };

        setCryptoSymbols(
          Array.isArray(config.cryptoSymbols)
            ? config.cryptoSymbols
            : ['BTC', 'ETH'],
        );
        setHistoricalLevers({
          lookbackDays: config.lookbackDays ?? 30,
          buyDropThresholdPct: config.buyDropThresholdPct ?? 3,
          sellRiseThresholdPct: config.sellRiseThresholdPct ?? 5,
          maxCapitalPerSignalPct: config.maxCapitalPerSignalPct ?? 20,
          trendLookbackDays: config.trendLookbackDays ?? 30,
          maxVolatilityPct: config.maxVolatilityPct ?? 8,
          minDaysBetweenTrades: config.minDaysBetweenTrades ?? 2,
        });
      }

      setStatus('');
      setCurrentStep('step1-info');
      setLoading(false);
      void handleLoadPromptTemplates();
    } catch (error) {
      const message =
        error instanceof ApiHttpError
          ? error.message
          : 'Failed to load strategy for edit';
      setStatusKind('error');
      setStatus(message);
      setLoading(false);
    }
  };

  const handleCancel = (): void => {
    const confirmed = window.confirm(
      'Cancel the wizard and return to strategy list?',
    );
    if (!confirmed) {
      return;
    }
    resetWizardForm();
    void handleListStrategies();
  };

  const resetWizardForm = (): void => {
    setName('');
    setDescription('');
    setEditingStrategyId(null);
    setRiskLevel('balanced');
    setStrategyType('ai_assisted');
    setCustomPrompt('');
    setPromptTemplates([]);
    setSelectedTemplate('balanced');
    setSelectedPromptContent('');
    setSafeguards(defaultSafeguardsByRisk('balanced'));
    setAllocationRebalancingFrequencyDays(1);
    setAllocationRebalancingThresholdPct(5);
    setAiGuardrails(defaultAiGuardrails());
    setHistoricalLevers({
      ...defaultHistoricalLeversByRisk('balanced'),
    });
    setCryptoSymbols(getDefaultCryptoSymbols());
    setAllocation(getDefaultAllocation());
    setStrategyPreview(null);
    setStatus('');
  };

  if (currentStep === 'list') {
    return (
      <Layout
        title={t('page.strategies.title')}
        subtitle={t('page.strategies.subtitle')}
      >
        <div className={styles.container}>
          <div className={styles.listHeader}>
            <h2>Your Strategies</h2>
            <div className={styles.listHeaderActions}>
              <input
                ref={importInputRef}
                type="file"
                accept="application/json"
                className={styles.fileInput}
                onChange={(event) => {
                  void handleImportStrategies(event);
                }}
              />
              <button
                className={styles.secondaryButton}
                onClick={() => importInputRef.current?.click()}
                disabled={loading}
              >
                Import
              </button>
              <button
                className={styles.secondaryButton}
                onClick={() => void handleExportStrategies()}
                disabled={loading}
              >
                Export
              </button>
              <button
                className={styles.secondaryButton}
                onClick={() => void handleRestoreDefaultStrategies()}
                disabled={loading}
              >
                Restore defaults
              </button>
              <button
                className={styles.primaryButton}
                onClick={handleStartWizard}
                disabled={loading}
                aria-label="Create a new investment strategy"
              >
                Create strategy
              </button>
            </div>
          </div>

          {statusKind === 'error' && (
            <div className={styles.error} role="alert" aria-live="assertive">
              {status}
            </div>
          )}
          {statusKind === 'success' && status && (
            <div className={styles.success} role="status" aria-live="polite">
              {status}
            </div>
          )}

          {loading ? (
            <div>Loading...</div>
          ) : strategies.length === 0 ? (
            <div className={styles.emptyState}>
              <p>
                No strategy created yet. Create your first strategy to get
                started.
              </p>
              <button
                className={styles.primaryButton}
                onClick={handleStartWizard}
                aria-label="Create my first investment strategy"
              >
                Create my first strategy
              </button>
            </div>
          ) : (
            <table className={styles.strategiesTable}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Risk level</th>
                  <th>Created on</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {strategies.map((strategy) => (
                  <tr key={strategy.id}>
                    <td className={styles.strategyName}>
                      <strong>{strategy.name}</strong>
                      <p>{strategy.description}</p>
                    </td>
                    <td>{strategy.type}</td>
                    <td>{strategy.riskLevel}</td>
                    <td>{new Date(strategy.createdAt).toLocaleDateString()}</td>
                    <td className={styles.actions}>
                      <button
                        className={styles.editButton}
                        onClick={() => void handleEditStrategy(strategy.id)}
                        disabled={loading}
                        aria-label={`Edit strategy ${strategy.name}`}
                      >
                        Edit
                      </button>
                      <button
                        className={styles.deleteButton}
                        onClick={() => void handleDeleteStrategy(strategy.id)}
                        disabled={loading}
                        aria-label={`Delete strategy ${strategy.name}`}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Layout>
    );
  }

  if (currentStep === 'step1-info') {
    return (
      <WizardStepLayout
        title="Create strategy - Step 1: General information"
        progressPct={20}
        progressAriaLabel="Wizard progress: step 1 of 5"
        heading="Step 1 of 5: General information"
        description="Name your strategy and describe its goal."
      >
        <form
          className={styles.form}
          onSubmit={(event) => {
            event.preventDefault();
            handleStep1Next();
          }}
        >
          <div className={styles.formGroup}>
            <label>Strategy name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Defensive BTC/ETH mix"
              maxLength={100}
              aria-label="Strategy name"
              aria-required="true"
            />
          </div>

          <div className={styles.formGroup}>
            <label>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your strategy goals and approach..."
              rows={4}
              maxLength={500}
              aria-label="Strategy description"
            />
          </div>

          {statusKind === 'error' && (
            <div className={styles.error} role="alert" aria-live="assertive">
              {status}
            </div>
          )}

          <div className={styles.buttonGroup}>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={handleCancel}
              aria-label="Cancel strategy creation"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.primaryButton}
              aria-label="Go to step 2: strategy type and risk level"
            >
              Next: Risk level
            </button>
          </div>
        </form>
      </WizardStepLayout>
    );
  }

  if (currentStep === 'step2-type') {
    return (
      <WizardStepLayout
        title="Create strategy - Step 2: Type and risk"
        progressPct={40}
        progressAriaLabel="Wizard progress: step 2 of 5"
        heading="Step 2 of 5: Strategy type and risk level"
      >
        <form
          className={styles.form}
          onSubmit={(event) => {
            event.preventDefault();
            handleStep2Next();
          }}
        >
          <div className={styles.formGroup}>
            <label>Risk level *</label>
            <div
              className={styles.radioGroup}
              role="radiogroup"
              aria-label="Risk level"
            >
              <label
                className={
                  riskLevel === 'defensive'
                    ? styles.radioOptionSelected
                    : styles.radioOption
                }
              >
                <input
                  type="radio"
                  value="defensive"
                  checked={riskLevel === 'defensive'}
                  onChange={(e) =>
                    setRiskLevel(e.target.value as StrategyRiskLevel)
                  }
                  aria-label="Defensive risk level"
                />
                <span>
                  <strong>Defensive</strong>
                  <small>
                    Lower-volatility targeting with strict downside controls.
                  </small>
                </span>
              </label>
              <label
                className={
                  riskLevel === 'balanced'
                    ? styles.radioOptionSelected
                    : styles.radioOption
                }
              >
                <input
                  type="radio"
                  value="balanced"
                  checked={riskLevel === 'balanced'}
                  onChange={(e) =>
                    setRiskLevel(e.target.value as StrategyRiskLevel)
                  }
                  aria-label="Balanced risk level"
                />
                <span>
                  <strong>Balanced</strong>
                  <small>Medium risk with diversified execution.</small>
                </span>
              </label>
              <label
                className={
                  riskLevel === 'aggressive'
                    ? styles.radioOptionSelected
                    : styles.radioOption
                }
              >
                <input
                  type="radio"
                  value="aggressive"
                  checked={riskLevel === 'aggressive'}
                  onChange={(e) =>
                    setRiskLevel(e.target.value as StrategyRiskLevel)
                  }
                  aria-label="Aggressive risk level"
                />
                <span>
                  <strong>Aggressive</strong>
                  <small>
                    Higher return target with higher tolerated losses.
                  </small>
                </span>
              </label>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label>Strategy type *</label>
            <div
              className={styles.radioGroup}
              role="radiogroup"
              aria-label="Strategy type"
            >
              <label
                className={
                  strategyType === 'allocation'
                    ? styles.radioOptionSelected
                    : styles.radioOption
                }
              >
                <input
                  type="radio"
                  value="allocation"
                  checked={strategyType === 'allocation'}
                  onChange={(e) =>
                    setStrategyType(e.target.value as StrategyType)
                  }
                  aria-label="Type allocation"
                />
                <span>
                  <strong>Allocation</strong>
                  <small>Fixed allocation and periodic rebalancing.</small>
                </span>
              </label>
              <label
                className={
                  strategyType === 'ai_assisted'
                    ? styles.radioOptionSelected
                    : styles.radioOption
                }
              >
                <input
                  type="radio"
                  value="ai_assisted"
                  checked={strategyType === 'ai_assisted'}
                  onChange={(e) =>
                    setStrategyType(e.target.value as StrategyType)
                  }
                  aria-label="AI-assisted type"
                />
                <span>
                  <strong>AI-assisted</strong>
                  <small>
                    Dynamic recommendations with guardrails and spending limits.
                  </small>
                </span>
              </label>
              <label
                className={
                  strategyType === 'historical_signals'
                    ? styles.radioOptionSelected
                    : styles.radioOption
                }
              >
                <input
                  type="radio"
                  value="historical_signals"
                  checked={strategyType === 'historical_signals'}
                  onChange={(e) =>
                    setStrategyType(e.target.value as StrategyType)
                  }
                  aria-label="Historical signals type"
                />
                <span>
                  <strong>Historical signals</strong>
                  <small>
                    Buy/sell triggers based on historical price changes.
                  </small>
                </span>
              </label>
            </div>
          </div>

          <div className={styles.buttonGroup}>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={handleCancel}
              aria-label="Cancel strategy creation"
            >
              Cancel
            </button>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={() => setCurrentStep('step1-info')}
              aria-label="Return to step 1"
            >
              Back
            </button>
            <button
              type="submit"
              className={styles.primaryButton}
              aria-label="Go to step 3: Configuration"
            >
              Next: Configuration
            </button>
          </div>
        </form>
      </WizardStepLayout>
    );
  }

  if (currentStep === 'step3-config') {
    return (
      <WizardStepLayout
        title="Create strategy - Step 3: Configuration"
        progressPct={60}
        progressAriaLabel="Wizard progress: step 3 of 5"
        heading="Step 3 of 5: Strategy configuration"
      >
        {strategyType === 'allocation' && (
          <form
            className={styles.form}
            onSubmit={(event) => {
              event.preventDefault();
              handleStep3Next();
            }}
          >
            <h3>Portfolio allocation</h3>
            <p>Specify target percentage for each cryptocurrency:</p>

            <div className={styles.allocationGrid}>
              {Object.entries(allocation).map(([symbol, percent]) => (
                <div key={symbol} className={styles.formGroup}>
                  <label>{symbol} %</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={percent}
                    aria-label={`Allocation ${symbol} in percentage`}
                    onChange={(e) =>
                      setAllocation({
                        ...allocation,
                        [symbol]: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
              ))}
            </div>

            <div className={styles.allocationGrid}>
              <div className={styles.formGroup}>
                <label>Rebalancing frequency (days)</label>
                <input
                  type="number"
                  min="1"
                  max="7"
                  step="1"
                  value={allocationRebalancingFrequencyDays}
                  aria-label="Rebalancing frequency in days"
                  onChange={(event) =>
                    setAllocationRebalancingFrequencyDays(
                      Math.max(
                        1,
                        Math.min(7, parseInt(event.target.value || '1', 10)),
                      ),
                    )
                  }
                />
              </div>
              <div className={styles.formGroup}>
                <label>Rebalancing threshold (%)</label>
                <input
                  type="number"
                  min="0.5"
                  max="20"
                  step="0.5"
                  value={allocationRebalancingThresholdPct}
                  aria-label="Rebalancing threshold in percentage"
                  onChange={(event) =>
                    setAllocationRebalancingThresholdPct(
                      Math.max(
                        0.5,
                        Math.min(20, parseFloat(event.target.value || '5')),
                      ),
                    )
                  }
                />
              </div>
            </div>

            <div
              className={`${styles.allocationTotal} ${
                Math.abs(
                  Object.values(allocation).reduce((s, v) => s + v, 0) - 100,
                ) < 0.01
                  ? styles.allocationValid
                  : styles.allocationInvalid
              }`}
              role="status"
              aria-live="polite"
            >
              Total:{' '}
              {Object.values(allocation)
                .reduce((s, v) => s + v, 0)
                .toFixed(2)}
              %
              {Math.abs(
                Object.values(allocation).reduce((s, v) => s + v, 0) - 100,
              ) < 0.01 ? (
                <span className={styles.allocationIcon}> ✓</span>
              ) : (
                <span className={styles.allocationIcon}> ✗</span>
              )}
            </div>

            <ExecutionConfigurationSection
              strategyType={strategyType}
              safeguards={safeguards}
              tooltipsEnabled={tooltipsEnabled}
              onSafeguardsChange={setSafeguards}
              TooltipComponent={Tooltip}
            />

            <div className={styles.buttonGroup}>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={handleCancel}
                aria-label="Cancel strategy creation"
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={() => setCurrentStep('step2-type')}
                aria-label="Return to step 2"
              >
                Back
              </button>
              <button
                type="submit"
                className={styles.primaryButton}
                aria-label="Go to step 4: Safeguards"
              >
                Next: Safeguards
              </button>
            </div>
          </form>
        )}

        {strategyType === 'ai_assisted' && (
          <form
            className={styles.form}
            onSubmit={(event) => {
              event.preventDefault();
              handleStep3Next();
            }}
          >
            <div className={styles.formGroup}>
              <Tooltip
                enabled={tooltipsEnabled}
                content="Choose at least 3 cryptocurrencies that the AI will analyze and potentially trade. More diversity reduces risk but requires more capital."
              >
                <label>Cryptocurrencies to monitor *</label>
              </Tooltip>
              <p>Select at least 3 cryptos</p>
              <div className={styles.cryptoCheckboxes}>
                {CRYPTO_CATALOG.map((asset) => {
                  const selected = cryptoSymbols.includes(asset.symbol);
                  return (
                    <div
                      key={asset.symbol}
                      className={
                        selected ? styles.cryptoCardSelected : styles.cryptoCard
                      }
                      tabIndex={0}
                      role="button"
                      aria-pressed={selected}
                      onClick={() => {
                        if (!selected) {
                          setCryptoSymbols([...cryptoSymbols, asset.symbol]);
                        } else {
                          setCryptoSymbols(
                            cryptoSymbols.filter((s) => s !== asset.symbol),
                          );
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === ' ' || e.key === 'Enter') {
                          e.preventDefault();
                          if (!selected) {
                            setCryptoSymbols([...cryptoSymbols, asset.symbol]);
                          } else {
                            setCryptoSymbols(
                              cryptoSymbols.filter((s) => s !== asset.symbol),
                            );
                          }
                        }
                      }}
                    >
                      <div className={styles.cryptoCardHead}>
                        <strong>{asset.symbol}</strong>
                      </div>
                      <small>{asset.thesis}</small>
                      <div className={styles.cryptoMeta}>
                        <span>Risk: {asset.risk}</span>
                        <span>Fees: {asset.fees}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <small>Selected: {cryptoSymbols.length} cryptos</small>
            </div>

            <div className={styles.formGroup}>
              <Tooltip
                enabled={tooltipsEnabled}
                content="Select a pre-configured AI behavior template. Defensive favors capital preservation, Balanced seeks moderate growth, Aggressive targets maximum returns. You can customize further below."
              >
                <label>Prompt template</label>
              </Tooltip>
              <div className={styles.templateGrid}>
                {(promptTemplates.length > 0
                  ? promptTemplates
                  : [
                      {
                        id: 'defensive',
                        name: 'Defensive',
                        preview: '',
                      },
                      {
                        id: 'balanced',
                        name: 'Balanced',
                        preview: '',
                      },
                      {
                        id: 'aggressive',
                        name: 'Aggressive',
                        preview: '',
                      },
                    ]
                ).map((template) => (
                  <button
                    key={template.id}
                    type="button"
                    className={
                      selectedTemplate === template.id
                        ? styles.templateChipSelected
                        : styles.templateChip
                    }
                    onClick={() => {
                      setSelectedTemplate(
                        template.id as 'defensive' | 'balanced' | 'aggressive',
                      );
                      setSelectedPromptContent(template.preview);
                    }}
                  >
                    {template.name}
                  </button>
                ))}
              </div>
              <Tooltip
                enabled={tooltipsEnabled}
                content="Advanced: Provide your own trading instructions for the AI. Leave empty to use the selected template. The system will ensure proper JSON output format automatically."
              >
                <textarea
                  value={customPrompt}
                  onChange={(event) => {
                    setCustomPrompt(event.target.value);
                    validateCustomPrompt(event.target.value);
                  }}
                  onBlur={(event) => validateCustomPrompt(event.target.value)}
                  placeholder="Optional custom prompt override (JSON output instructions will be enforced server-side)."
                  rows={4}
                  aria-label="Custom prompt for AI assistant"
                />
              </Tooltip>

              {customPrompt.trim() && (
                <div className={styles.promptValidation}>
                  <button
                    type="button"
                    className={styles.toggleButton}
                    onClick={() => setShowPromptPreview(!showPromptPreview)}
                    aria-label={
                      showPromptPreview
                        ? 'Hide custom prompt preview'
                        : 'Show custom prompt preview'
                    }
                  >
                    {showPromptPreview ? '▼' : '▶'} Custom prompt preview
                  </button>

                  {promptValidation.warnings.length > 0 && (
                    <div className={styles.promptWarnings}>
                      <strong>⚠️ Suggestions:</strong>
                      <ul>
                        {promptValidation.warnings.map((warning, idx) => (
                          <li key={idx}>{warning}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {showPromptPreview && (
                    <div className={styles.promptPreview}>
                      <strong>Your custom prompt:</strong>
                      <pre>{customPrompt}</pre>
                    </div>
                  )}
                </div>
              )}

              {selectedPromptContent ? (
                <small>Template preview: {selectedPromptContent}</small>
              ) : null}
            </div>

            <ExecutionConfigurationSection
              strategyType={strategyType}
              safeguards={safeguards}
              tooltipsEnabled={tooltipsEnabled}
              onSafeguardsChange={setSafeguards}
              TooltipComponent={Tooltip}
            />

            <div className={styles.buttonGroup}>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={handleCancel}
                aria-label="Cancel strategy creation"
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={() => setCurrentStep('step2-type')}
                aria-label="Return to step 2"
              >
                Back
              </button>
              <button
                type="submit"
                className={styles.primaryButton}
                aria-label="Go to step 4: Safeguards"
              >
                Next: Safeguards
              </button>
            </div>
          </form>
        )}

        {strategyType === 'historical_signals' && (
          <form
            className={styles.form}
            onSubmit={(event) => {
              event.preventDefault();
              handleStep3Next();
            }}
          >
            <div className={styles.formGroup}>
              <label>Cryptocurrencies to monitor *</label>
              <p>Select at least 2 cryptos</p>
              <div className={styles.cryptoCheckboxes}>
                {CRYPTO_CATALOG.map((asset) => (
                  <label
                    key={asset.symbol}
                    className={
                      cryptoSymbols.includes(asset.symbol)
                        ? styles.cryptoCardSelected
                        : styles.cryptoCard
                    }
                  >
                    <div className={styles.cryptoCardHead}>
                      <input
                        type="checkbox"
                        checked={cryptoSymbols.includes(asset.symbol)}
                        aria-label={`Select ${asset.symbol}`}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setCryptoSymbols([...cryptoSymbols, asset.symbol]);
                          } else {
                            setCryptoSymbols(
                              cryptoSymbols.filter((s) => s !== asset.symbol),
                            );
                          }
                        }}
                      />
                      <strong>{asset.symbol}</strong>
                    </div>
                    <small>{asset.thesis}</small>
                    <div className={styles.cryptoMeta}>
                      <span>Risk: {asset.risk}</span>
                      <span>Fees: {asset.fees}</span>
                    </div>
                  </label>
                ))}
              </div>
              <small>Selected: {cryptoSymbols.length} cryptos</small>
            </div>

            <div className={styles.allocationGrid}>
              <div className={styles.formGroup}>
                <label>
                  Analysis window (days)
                  <span
                    className={styles.tooltipHint}
                    title="Historical window length analyzed before deciding to buy or sell."
                  >
                    ⓘ
                  </span>
                </label>
                <input
                  type="number"
                  min="3"
                  max="90"
                  step="1"
                  value={historicalLevers.lookbackDays}
                  aria-label="Historical analysis window in days"
                  onChange={(event) =>
                    setHistoricalLevers({
                      ...historicalLevers,
                      lookbackDays:
                        parseInt(event.target.value || '30', 10) || 30,
                    })
                  }
                />
              </div>
              <div className={styles.formGroup}>
                <label>
                  Drop threshold for buy (%)
                  <span
                    className={styles.tooltipHint}
                    title="If price drops by at least this percentage over the analysis window, strategy can buy."
                  >
                    ⓘ
                  </span>
                </label>
                <input
                  type="number"
                  min="0.5"
                  max="25"
                  step="0.1"
                  value={historicalLevers.buyDropThresholdPct}
                  aria-label="Drop threshold for buy in percentage"
                  onChange={(event) =>
                    setHistoricalLevers({
                      ...historicalLevers,
                      buyDropThresholdPct:
                        parseFloat(event.target.value || '3') || 3,
                    })
                  }
                />
              </div>
              <div className={styles.formGroup}>
                <label>
                  Rise threshold for sell (%)
                  <span
                    className={styles.tooltipHint}
                    title="If price rises by at least this percentage over the analysis window, strategy can sell or reduce position."
                  >
                    ⓘ
                  </span>
                </label>
                <input
                  type="number"
                  min="0.5"
                  max="35"
                  step="0.1"
                  value={historicalLevers.sellRiseThresholdPct}
                  aria-label="Rise threshold for sell in percentage"
                  onChange={(event) =>
                    setHistoricalLevers({
                      ...historicalLevers,
                      sellRiseThresholdPct:
                        parseFloat(event.target.value || '5') || 5,
                    })
                  }
                />
              </div>
              <div className={styles.formGroup}>
                <label>
                  Maximum capital per signal (%)
                  <span
                    className={styles.tooltipHint}
                    title="Maximum share of available budget used for a buy/sell signal."
                  >
                    ⓘ
                  </span>
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  step="1"
                  value={historicalLevers.maxCapitalPerSignalPct}
                  aria-label="Maximum capital per signal in percentage"
                  onChange={(event) =>
                    setHistoricalLevers({
                      ...historicalLevers,
                      maxCapitalPerSignalPct:
                        parseInt(event.target.value || '20', 10) || 20,
                    })
                  }
                />
              </div>
              <div className={styles.formGroup}>
                <label>
                  Trend lookback (days)
                  <span
                    className={styles.tooltipHint}
                    title="Longer trend window used to confirm medium-term direction before entry/exit."
                  >
                    ⓘ
                  </span>
                </label>
                <input
                  type="number"
                  min="3"
                  max="90"
                  step="1"
                  value={historicalLevers.trendLookbackDays}
                  aria-label="Trend lookback window in days"
                  onChange={(event) =>
                    setHistoricalLevers({
                      ...historicalLevers,
                      trendLookbackDays:
                        parseInt(event.target.value || '30', 10) || 30,
                    })
                  }
                />
              </div>
              <div className={styles.formGroup}>
                <label>
                  Max volatility filter (%/day)
                  <span
                    className={styles.tooltipHint}
                    title="Buys are blocked when recent average daily volatility exceeds this threshold."
                  >
                    ⓘ
                  </span>
                </label>
                <input
                  type="number"
                  min="1"
                  max="25"
                  step="0.1"
                  value={historicalLevers.maxVolatilityPct}
                  aria-label="Maximum accepted volatility in percentage"
                  onChange={(event) =>
                    setHistoricalLevers({
                      ...historicalLevers,
                      maxVolatilityPct:
                        parseFloat(event.target.value || '8') || 8,
                    })
                  }
                />
              </div>
              <div className={styles.formGroup}>
                <label>
                  Minimum days between trades
                  <span
                    className={styles.tooltipHint}
                    title="Cooldown between two executed operations on the same asset to reduce overtrading."
                  >
                    ⓘ
                  </span>
                </label>
                <input
                  type="number"
                  min="0"
                  max="30"
                  step="1"
                  value={historicalLevers.minDaysBetweenTrades}
                  aria-label="Minimum days between operations"
                  onChange={(event) =>
                    setHistoricalLevers({
                      ...historicalLevers,
                      minDaysBetweenTrades:
                        parseInt(event.target.value || '2', 10) || 0,
                    })
                  }
                />
              </div>
            </div>

            <ExecutionConfigurationSection
              strategyType={strategyType}
              safeguards={safeguards}
              tooltipsEnabled={tooltipsEnabled}
              onSafeguardsChange={setSafeguards}
              TooltipComponent={Tooltip}
            />

            <div className={styles.buttonGroup}>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={handleCancel}
                aria-label="Cancel strategy creation"
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={() => setCurrentStep('step2-type')}
                aria-label="Return to step 2"
              >
                Back
              </button>
              <button
                type="submit"
                className={styles.primaryButton}
                aria-label="Go to step 4: Safeguards"
              >
                Next: Safeguards
              </button>
            </div>
          </form>
        )}
      </WizardStepLayout>
    );
  }

  if (currentStep === 'step4-safeguards') {
    return (
      <WizardStepLayout
        title="Create strategy - Step 4: Safeguards"
        progressPct={80}
        progressAriaLabel="Wizard progress: step 4 of 5"
        heading="Step 4 of 5: Risk safeguards"
        description="Configure spending limits and portfolio protection rules. Execution cadence is configured in step 3."
      >
        <form
          className={styles.form}
          onSubmit={(event) => {
            event.preventDefault();
            handleStep4Next();
          }}
        >
          <div className={styles.safeguardsPreview}>
            <div className={styles.safeguardsGrid}>
              <div className={styles.formGroup}>
                <Tooltip
                  enabled={tooltipsEnabled}
                  content="Maximum amount to invest per calendar month. This is your main spending limit to control overall exposure."
                >
                  <label>Monthly budget (EUR)</label>
                </Tooltip>
                <input
                  type="number"
                  min="50"
                  step="10"
                  value={safeguards.monthlyBudgetEur}
                  aria-label="Monthly budget in euros"
                  onChange={(event) =>
                    setSafeguards({
                      ...safeguards,
                      monthlyBudgetEur:
                        parseFloat(event.target.value) ||
                        safeguards.monthlyBudgetEur,
                    })
                  }
                />
              </div>
              <div className={styles.formGroup}>
                <Tooltip
                  enabled={tooltipsEnabled}
                  content="Maximum amount to spend in a single day. Prevents excessive trading activity and helps smooth out market entry over time."
                >
                  <label>Maximum daily spend (EUR)</label>
                </Tooltip>
                <input
                  type="number"
                  min="10"
                  step="5"
                  value={safeguards.maxDailySpendEur}
                  aria-label="Maximum daily spend in euros"
                  onChange={(event) =>
                    setSafeguards({
                      ...safeguards,
                      maxDailySpendEur:
                        parseFloat(event.target.value) ||
                        safeguards.maxDailySpendEur,
                    })
                  }
                />
              </div>
              <div className={styles.formGroup}>
                <Tooltip
                  enabled={tooltipsEnabled}
                  content="Maximum amount to invest in a single cryptocurrency. Diversifies risk by preventing over-concentration in one asset."
                >
                  <label>Maximum position size (EUR)</label>
                </Tooltip>
                <input
                  type="number"
                  min="10"
                  step="5"
                  value={safeguards.maxPositionSizeEur}
                  aria-label="Maximum position size in euros"
                  onChange={(event) =>
                    setSafeguards({
                      ...safeguards,
                      maxPositionSizeEur:
                        parseFloat(event.target.value) ||
                        safeguards.maxPositionSizeEur,
                    })
                  }
                />
              </div>
              <div className={styles.formGroup}>
                <Tooltip
                  enabled={tooltipsEnabled}
                  content="Maximum number of different cryptocurrencies you can hold simultaneously. More positions = more diversification but requires more capital."
                >
                  <label>Maximum concurrent positions</label>
                </Tooltip>
                <input
                  type="number"
                  min="1"
                  max="20"
                  step="1"
                  value={safeguards.maxConcurrentPositions}
                  aria-label="Maximum concurrent positions"
                  onChange={(event) =>
                    setSafeguards({
                      ...safeguards,
                      maxConcurrentPositions:
                        parseInt(event.target.value, 10) ||
                        safeguards.maxConcurrentPositions,
                    })
                  }
                />
              </div>
              <div className={styles.formGroup}>
                <Tooltip
                  enabled={tooltipsEnabled}
                  content="Minimum amount per individual buy or sell order. Prevents tiny orders that would be eaten by fees. Should be at least 10-15 EUR."
                >
                  <label>Minimum order size (EUR)</label>
                </Tooltip>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={safeguards.minOrderSizeEur}
                  aria-label="Minimum order size in euros"
                  onChange={(event) =>
                    setSafeguards({
                      ...safeguards,
                      minOrderSizeEur:
                        parseFloat(event.target.value) ||
                        safeguards.minOrderSizeEur,
                    })
                  }
                />
              </div>
            </div>

            <div className={styles.checkboxRow}>
              <Tooltip
                enabled={tooltipsEnabled}
                content="Allow automatic rebalancing to maintain target allocations when portfolio drifts. Recommended for allocation strategies."
              >
                <div
                  className={
                    safeguards.rebalancingEnabled
                      ? styles.toggleLabelSelected + ' ' + styles.toggleBtn
                      : styles.toggleLabel + ' ' + styles.toggleBtn
                  }
                  tabIndex={0}
                  role="button"
                  aria-pressed={safeguards.rebalancingEnabled}
                  onClick={() =>
                    setSafeguards({
                      ...safeguards,
                      rebalancingEnabled: !safeguards.rebalancingEnabled,
                    })
                  }
                  onKeyDown={(e) => {
                    if (e.key === ' ' || e.key === 'Enter') {
                      e.preventDefault();
                      setSafeguards({
                        ...safeguards,
                        rebalancingEnabled: !safeguards.rebalancingEnabled,
                      });
                    }
                  }}
                >
                  Enable rebalancing
                </div>
              </Tooltip>
              <Tooltip
                enabled={tooltipsEnabled}
                content="Allow selling positions even if currently at a loss. Disable this for defensive 'hold only' strategies. Enable for active trading."
              >
                <div
                  className={
                    safeguards.acceptLosses
                      ? styles.toggleLabelSelected + ' ' + styles.toggleBtn
                      : styles.toggleLabel + ' ' + styles.toggleBtn
                  }
                  tabIndex={0}
                  role="button"
                  aria-pressed={safeguards.acceptLosses}
                  onClick={() =>
                    setSafeguards({
                      ...safeguards,
                      acceptLosses: !safeguards.acceptLosses,
                    })
                  }
                  onKeyDown={(e) => {
                    if (e.key === ' ' || e.key === 'Enter') {
                      e.preventDefault();
                      setSafeguards({
                        ...safeguards,
                        acceptLosses: !safeguards.acceptLosses,
                      });
                    }
                  }}
                >
                  Allow selling at a loss
                </div>
              </Tooltip>
            </div>

            {strategyType === 'ai_assisted' ? (
              <div className={styles.aiSafeguardsBlock}>
                <h3>AI usage guardrails</h3>
                <div className={styles.safeguardsGrid}>
                  <div className={styles.formGroup}>
                    <Tooltip
                      enabled={tooltipsEnabled}
                      content="How often to consult the AI for trading recommendations. More frequent = more responsive but higher AI costs. Range: 1-7 days."
                    >
                      <label>AI query frequency (days)</label>
                    </Tooltip>
                    <input
                      type="number"
                      min="1"
                      max="7"
                      step="1"
                      value={aiGuardrails.aiQueryFrequencyDays}
                      aria-label="AI query frequency in days"
                      onChange={(event) =>
                        setAiGuardrails({
                          ...aiGuardrails,
                          aiQueryFrequencyDays:
                            parseInt(event.target.value || '1', 10) || 1,
                        })
                      }
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <Tooltip
                      enabled={tooltipsEnabled}
                      content="Maximum cost for a single AI consultation. Limits expensive AI models. Typical range: 0.50-5.00 EUR per call depending on model and complexity."
                    >
                      <label>Maximum AI cost per call (EUR)</label>
                    </Tooltip>
                    <input
                      type="number"
                      min="0.1"
                      step="0.1"
                      value={aiGuardrails.maxCostPerCallEur}
                      aria-label="Maximum AI cost per call in euros"
                      onChange={(event) =>
                        setAiGuardrails({
                          ...aiGuardrails,
                          maxCostPerCallEur:
                            parseFloat(event.target.value || '0') ||
                            aiGuardrails.maxCostPerCallEur,
                        })
                      }
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <Tooltip
                      enabled={tooltipsEnabled}
                      content="Maximum number of AI consultations per calendar month. Controls total monthly AI spend. Calculate: frequency x 30 days for reference."
                    >
                      <label>Maximum AI calls per month</label>
                    </Tooltip>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={aiGuardrails.maxCallsPerMonth}
                      aria-label="Maximum AI calls per month"
                      onChange={(event) =>
                        setAiGuardrails({
                          ...aiGuardrails,
                          maxCallsPerMonth:
                            parseInt(event.target.value || '1', 10) || 1,
                        })
                      }
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <Tooltip
                      enabled={tooltipsEnabled}
                      content="Maximum duration for AI to maintain conversation context. Longer sessions = better continuity but higher costs. Optimal: 30-120 minutes."
                    >
                      <label>
                        Maximum AI context session duration (minutes)
                      </label>
                    </Tooltip>
                    <input
                      type="number"
                      min="5"
                      step="5"
                      value={aiGuardrails.maxSessionDurationMinutes}
                      aria-label="Maximum AI session duration in minutes"
                      onChange={(event) =>
                        setAiGuardrails({
                          ...aiGuardrails,
                          maxSessionDurationMinutes:
                            parseInt(event.target.value || '5', 10) || 5,
                        })
                      }
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <Tooltip
                      enabled={tooltipsEnabled}
                      content="Maximum number of positions the AI can recommend holding simultaneously. Independent from general max concurrent positions."
                    >
                      <label>Maximum concurrent AI positions</label>
                    </Tooltip>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      step="1"
                      value={aiGuardrails.maxConcurrentPositions}
                      aria-label="Maximum concurrent AI positions"
                      onChange={(event) =>
                        setAiGuardrails({
                          ...aiGuardrails,
                          maxConcurrentPositions:
                            parseInt(event.target.value || '1', 10) || 1,
                        })
                      }
                    />
                  </div>
                </div>
                <small>
                  Estimated monthly AI cost cap:{' '}
                  {(
                    aiGuardrails.maxCostPerCallEur *
                    aiGuardrails.maxCallsPerMonth
                  ).toFixed(2)}{' '}
                  EUR
                </small>
              </div>
            ) : null}
          </div>

          {statusKind === 'error' && (
            <div className={styles.error} role="alert" aria-live="assertive">
              {status}
            </div>
          )}

          <div className={styles.buttonGroup}>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={handleCancel}
              aria-label="Cancel strategy creation"
            >
              Cancel
            </button>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={() => setCurrentStep('step3-config')}
              aria-label="Return to step 3"
            >
              Back
            </button>
            <button
              type="submit"
              className={styles.primaryButton}
              aria-label="Go to step 5: Review"
            >
              Next: Review and creation
            </button>
          </div>
        </form>
      </WizardStepLayout>
    );
  }

  // Step 5: Review
  return (
    <WizardStepLayout
      title="Create strategy - Step 5: Review"
      progressPct={100}
      progressAriaLabel="Wizard progress: step 5 of 5"
      heading="Step 5 of 5: Review and creation"
    >
      <div className={styles.reviewSection}>
        <h3>Strategy summary</h3>
        <div className={styles.reviewItem}>
          <strong>Name:</strong> {name}
        </div>
        <div className={styles.reviewItem}>
          <strong>Description:</strong> {description || '(none)'}
        </div>
        <div className={styles.reviewItem}>
          <strong>Type:</strong> {strategyType}
        </div>
        <div className={styles.reviewItem}>
          <strong>Risk level:</strong> {riskLevel}
        </div>
        <div className={styles.reviewItem}>
          <strong>Monthly budget:</strong> {safeguards.monthlyBudgetEur} EUR
        </div>
        <div className={styles.reviewItem}>
          <strong>Daily maximum:</strong> {safeguards.maxDailySpendEur} EUR
        </div>
        <div className={styles.reviewItem}>
          <strong>Decision checks/day:</strong>{' '}
          {safeguards.decisionChecksPerDay}
        </div>
        {strategyType === 'ai_assisted' ? (
          <div className={styles.reviewItem}>
            <strong>Minimum AI confidence:</strong>{' '}
            {safeguards.minAiConfidencePctForExecution}%
          </div>
        ) : null}
        <div className={styles.reviewItem}>
          <strong>Max position size:</strong> {safeguards.maxPositionSizeEur}{' '}
          EUR
        </div>
        <div className={styles.reviewItem}>
          <strong>Minimum order:</strong> {safeguards.minOrderSizeEur} EUR
        </div>
        <div className={styles.reviewItem}>
          <strong>Sell at loss allowed:</strong>{' '}
          {safeguards.acceptLosses ? 'Yes' : 'No'}
        </div>
        {strategyType !== 'allocation' ? (
          <div className={styles.reviewItem}>
            <strong>Selected cryptos:</strong> {cryptoSymbols.join(', ')}
          </div>
        ) : null}
        {strategyType === 'ai_assisted' ? (
          <>
            <div className={styles.reviewItem}>
              <strong>AI query frequency:</strong>{' '}
              {aiGuardrails.aiQueryFrequencyDays} day(s)
            </div>
            <div className={styles.reviewItem}>
              <strong>AI cost cap:</strong> {aiGuardrails.maxCostPerCallEur} EUR
              / call
            </div>
            <div className={styles.reviewItem}>
              <strong>AI call limit:</strong> {aiGuardrails.maxCallsPerMonth} /
              month
            </div>
            <div className={styles.reviewItem}>
              <strong>AI session limit:</strong>{' '}
              {aiGuardrails.maxSessionDurationMinutes} minutes
            </div>
          </>
        ) : null}
        {strategyType === 'historical_signals' ? (
          <>
            <div className={styles.reviewItem}>
              <strong>Analysis window:</strong> {historicalLevers.lookbackDays}{' '}
              days
            </div>
            <div className={styles.reviewItem}>
              <strong>Buy trigger (drop):</strong>{' '}
              {historicalLevers.buyDropThresholdPct}%
            </div>
            <div className={styles.reviewItem}>
              <strong>Sell trigger (rise):</strong>{' '}
              {historicalLevers.sellRiseThresholdPct}%
            </div>
            <div className={styles.reviewItem}>
              <strong>Max capital / signal:</strong>{' '}
              {historicalLevers.maxCapitalPerSignalPct}%
            </div>
            <div className={styles.reviewItem}>
              <strong>Trend lookback:</strong>{' '}
              {historicalLevers.trendLookbackDays} days
            </div>
            <div className={styles.reviewItem}>
              <strong>Max volatility:</strong>{' '}
              {historicalLevers.maxVolatilityPct}% / day
            </div>
            <div className={styles.reviewItem}>
              <strong>Trade cooldown:</strong>{' '}
              {historicalLevers.minDaysBetweenTrades} day(s)
            </div>
          </>
        ) : null}

        {strategyPreview ? (
          <div className={styles.previewSimulationPanel}>
            <h4>Monthly simulation preview</h4>
            <p>
              Estimated orders / month:{' '}
              <strong>{strategyPreview.estimatedOrdersPerMonth}</strong>
            </p>
            <p>
              Estimated capital / order:{' '}
              <strong>
                {strategyPreview.estimatedCapitalPerOrderEur.toFixed(2)} EUR
              </strong>
            </p>
            <div className={styles.previewAllocationList}>
              {strategyPreview.projectedAllocation.map((entry) => (
                <div
                  key={entry.symbol}
                  className={styles.previewAllocationItem}
                >
                  <span>{entry.symbol}</span>
                  <span>{entry.targetPct.toFixed(2)}%</span>
                  <span>{entry.projectedAmountEur.toFixed(2)} EUR</span>
                </div>
              ))}
            </div>
            {strategyPreview.warnings.length > 0 ? (
              <ul className={styles.previewWarnings}>
                {strategyPreview.warnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            ) : (
              <p className={styles.previewOk}>
                No blocking warning detected for this simulation.
              </p>
            )}
          </div>
        ) : null}

        {statusKind === 'error' && (
          <div className={styles.error} role="alert" aria-live="assertive">
            {status}
          </div>
        )}

        <div className={styles.buttonGroup}>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={() => setStrategyPreview(buildPreview())}
            disabled={loading}
          >
            Preview simulation
          </button>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={handleCancel}
            disabled={loading}
            aria-label="Cancel strategy creation"
          >
            Cancel
          </button>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={() => setCurrentStep('step4-safeguards')}
            disabled={loading}
            aria-label="Return to step 4"
          >
            Back
          </button>
          <button
            type="button"
            className={styles.primaryButton}
            onClick={() => {
              void handleCreateStrategy();
            }}
            disabled={loading}
            aria-label={
              editingStrategyId ? 'Save strategy changes' : 'Create strategy'
            }
          >
            {loading
              ? editingStrategyId
                ? 'Saving...'
                : 'Creating...'
              : editingStrategyId
                ? 'Save changes'
                : 'Create strategy'}
          </button>
        </div>
      </div>
    </WizardStepLayout>
  );
}
