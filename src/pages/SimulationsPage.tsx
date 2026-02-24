import { FormEvent, ReactElement, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AdvancedBacktestingRunSession,
  AdvancedBacktestingComparisonResult,
  AdvancedBacktestingResult,
  HistoricalSimulationRunSession,
  HistoricalSimulationSummary,
  Strategy,
  StrategyOverrideInput,
  StrategyRiskProfile,
  getStrategies,
  isUnauthorizedError,
  listHistoricalSimulations,
  deleteHistoricalSimulation,
  deleteAllHistoricalSimulations,
  startAdvancedBacktestingComparisonRunSession,
  startAdvancedBacktestingRunSession,
  startHistoricalSimulationRunSession,
} from '../api';
import { InfoTip } from '../components/InfoTip';
import { DatePickerInput } from '../components/DatePickerInput';
import { AdvancedComparisonSection } from '../components/simulations/AdvancedComparisonSection';
import { AdvancedRunProgressModal } from '../components/simulations/AdvancedRunProgressModal';
import { ContinuousSimulationSection } from '../components/simulations/ContinuousSimulationSection';
import { RunProgressModal } from '../components/simulations/RunProgressModal';
import { SimulationArchiveSection } from '../components/simulations/SimulationArchiveSection';
import { useI18n } from '../i18n/i18n';
import { Layout } from '../components/Layout';
import { formatAmountFromEur } from '../currency';
import { parseIsoDate } from '../dateUtils';
import {
  AdvancedPeriodDraft,
  buildDefaultAdvancedPeriods,
  resolveDefaultPeriodEnd,
  resolveDefaultPeriodStart,
} from './simulations/datePresets';
import {
  computeAbComparisonPeriodPreset,
  computeAdvancedPeriodPreset,
  computeMainPeriodPreset,
} from './simulations/periodPresets';
import { useContinuousSimulation } from './simulations/useContinuousSimulation';
import { useSimulationArchive } from './simulations/useSimulationArchive';
import { useSimulationSessionTracking } from './simulations/useSimulationSessionTracking';

export function SimulationsPage(): ReactElement {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [runs, setRuns] = useState<HistoricalSimulationSummary[]>([]);
  const [selectedStrategyId, setSelectedStrategyId] = useState('');
  const [periodStart, setPeriodStart] = useState(resolveDefaultPeriodStart());
  const [periodEnd, setPeriodEnd] = useState(resolveDefaultPeriodEnd());
  const [overrideEnabled, setOverrideEnabled] = useState(false);
  const [overrideRiskProfile, setOverrideRiskProfile] =
    useState<StrategyRiskProfile>('balanced');
  const [overrideMonthlyBudget, setOverrideMonthlyBudget] = useState(300);
  const [overrideRebalancingPerDay, setOverrideRebalancingPerDay] = useState(2);
  const [overrideMaxPositionPct, setOverrideMaxPositionPct] = useState(45);
  const [useLiveAiInSimulation, setUseLiveAiInSimulation] = useState(false);
  const [running, setRunning] = useState(false);
  const [loadingRuns, setLoadingRuns] = useState(true);
  const [status, setStatus] = useState('');
  const [statusKind, setStatusKind] = useState<'success' | 'error'>('success');
  const [runSession, setRunSession] =
    useState<HistoricalSimulationRunSession | null>(null);
  const [showRunProgressModal, setShowRunProgressModal] = useState(false);
  const [advancedPeriods, setAdvancedPeriods] = useState<AdvancedPeriodDraft[]>(
    () => buildDefaultAdvancedPeriods(),
  );
  const [advancedMonteCarloIterations, setAdvancedMonteCarloIterations] =
    useState(400);
  const [advancedMonteCarloHorizonMonths, setAdvancedMonteCarloHorizonMonths] =
    useState(12);
  const [advancedBacktestStrategyId, setAdvancedBacktestStrategyId] =
    useState('');
  const [advancedBacktestResult, setAdvancedBacktestResult] =
    useState<AdvancedBacktestingResult | null>(null);
  const [advancedBacktestRunning, setAdvancedBacktestRunning] = useState(false);
  const [abComparisonStrategyIds, setAbComparisonStrategyIds] = useState<
    string[]
  >([]);
  const [abComparisonPeriodStart, setAbComparisonPeriodStart] = useState(
    resolveDefaultPeriodStart(),
  );
  const [abComparisonPeriodEnd, setAbComparisonPeriodEnd] = useState(
    resolveDefaultPeriodEnd(),
  );
  const [
    abComparisonUseLiveAiInSimulation,
    setAbComparisonUseLiveAiInSimulation,
  ] = useState(false);
  const [
    advancedBacktestComparisonResult,
    setAdvancedBacktestComparisonResult,
  ] = useState<AdvancedBacktestingComparisonResult | null>(null);
  const [
    advancedBacktestComparisonRunning,
    setAdvancedBacktestComparisonRunning,
  ] = useState(false);
  const [showAdvancedProgressModal, setShowAdvancedProgressModal] =
    useState(false);
  const [advancedRunSession, setAdvancedRunSession] =
    useState<AdvancedBacktestingRunSession | null>(null);
  const [advancedProgressScope, setAdvancedProgressScope] = useState<
    'strategy' | 'period'
  >('period');
  const [advancedProgressLabels, setAdvancedProgressLabels] = useState<
    string[]
  >([]);
  const [advancedProgressSelectedIndex, setAdvancedProgressSelectedIndex] =
    useState(0);
  const [advancedProgressLiveAiRequested, setAdvancedProgressLiveAiRequested] =
    useState(false);

  const {
    archiveStatusFilter,
    setArchiveStatusFilter,
    archiveStrategyFilter,
    setArchiveStrategyFilter,
    archivePageSize,
    setArchivePageSize,
    onPreviousPage,
    onNextPage,
    filteredRuns,
    archiveStrategies,
    archivePageCount,
    safeArchivePage,
    pagedRuns,
  } = useSimulationArchive(runs);

  const {
    continuousModeEnabled,
    continuousIntervalMs,
    continuousSnapshot,
    continuousLoading,
    continuousError,
    continuousUpdatedAt,
    setContinuousIntervalMs,
    handleContinuousEnabledChange,
  } = useContinuousSimulation(selectedStrategyId, () => {
    navigate('/login', { replace: true });
  });

  useEffect(() => {
    let active = true;

    async function loadInitialData(): Promise<void> {
      try {
        const [strategyList, simulations] = await Promise.all([
          getStrategies(),
          listHistoricalSimulations(),
        ]);
        if (!active) {
          return;
        }

        setStrategies(strategyList);
        setSelectedStrategyId(strategyList[0]?.id ?? '');
        setAdvancedBacktestStrategyId(strategyList[0]?.id ?? '');
        setAbComparisonStrategyIds(
          strategyList.slice(0, 3).map((strategy) => strategy.id),
        );
        setRuns(simulations);
        setStatus('');
        setLoadingRuns(false);
      } catch (error) {
        if (!active) {
          return;
        }
        if (isUnauthorizedError(error)) {
          navigate('/login', { replace: true });
          return;
        }
        setLoadingRuns(false);
        setStatusKind('error');
        setStatus('Unable to load simulation data.');
      }
    }

    void loadInitialData();
    return () => {
      active = false;
    };
  }, [navigate]);

  async function handleRunSimulation(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();
    if (!selectedStrategyId) {
      setStatusKind('error');
      setStatus('Select a strategy first.');
      return;
    }

    try {
      setRunning(true);
      setStatus('');
      const override: StrategyOverrideInput | undefined = overrideEnabled
        ? {
            riskProfile: overrideRiskProfile,
            monthlyBudgetEur: overrideMonthlyBudget,
            rebalancingPerDay: overrideRebalancingPerDay,
            maxPositionPct: overrideMaxPositionPct,
          }
        : undefined;

      const payload = await startHistoricalSimulationRunSession({
        strategyId: selectedStrategyId,
        periodStart,
        periodEnd,
        override,
        useLiveAiInSimulation,
      });
      setRunSession(payload.session);
      setShowRunProgressModal(true);
    } catch (error) {
      if (isUnauthorizedError(error)) {
        navigate('/login', { replace: true });
        return;
      }
      setStatusKind('error');
      setStatus(
        error instanceof Error
          ? `Simulation failed: ${error.message}`
          : 'Simulation failed.',
      );
      setRunning(false);
    }
  }

  async function handleRunAdvancedBacktest(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();
    if (!advancedBacktestStrategyId) {
      setStatusKind('error');
      setStatus('Select a strategy first.');
      return;
    }

    const periods = advancedPeriods
      .map((period) => ({
        periodStart: period.periodStart.trim(),
        periodEnd: period.periodEnd.trim(),
      }))
      .filter((period) => period.periodStart && period.periodEnd);

    if (periods.length < 2) {
      setStatusKind('error');
      setStatus('Add at least two valid periods for advanced backtesting.');
      return;
    }

    try {
      setAdvancedBacktestRunning(true);
      setStatus('');
      setAdvancedBacktestResult(null);
      setAdvancedProgressScope('period');
      setAdvancedProgressLabels(
        periods.map((period) => `${period.periodStart} → ${period.periodEnd}`),
      );
      setAdvancedProgressSelectedIndex(0);
      setAdvancedProgressLiveAiRequested(useLiveAiInSimulation);
      setShowAdvancedProgressModal(true);
      setAdvancedRunSession(null);

      const payload = await startAdvancedBacktestingRunSession({
        strategyId: advancedBacktestStrategyId,
        periods,
        override: overrideEnabled
          ? {
              riskProfile: overrideRiskProfile,
              monthlyBudgetEur: overrideMonthlyBudget,
              rebalancingPerDay: overrideRebalancingPerDay,
              maxPositionPct: overrideMaxPositionPct,
            }
          : undefined,
        useLiveAiInSimulation,
        monteCarloIterations: advancedMonteCarloIterations,
        monteCarloHorizonMonths: advancedMonteCarloHorizonMonths,
      });
      setAdvancedRunSession(payload.session);
    } catch (error) {
      if (isUnauthorizedError(error)) {
        navigate('/login', { replace: true });
        return;
      }
      setStatusKind('error');
      setStatus(
        error instanceof Error
          ? `Advanced backtesting failed: ${error.message}`
          : 'Advanced backtesting failed.',
      );
      setAdvancedBacktestRunning(false);
    }
  }

  async function handleRunAdvancedBacktestComparison(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();
    if (
      abComparisonStrategyIds.length < 2 ||
      abComparisonStrategyIds.length > 3
    ) {
      setStatusKind('error');
      setStatus('Select between 2 and 3 strategies for A/B testing.');
      return;
    }

    const start = parseIsoDate(abComparisonPeriodStart);
    const end = parseIsoDate(abComparisonPeriodEnd);
    if (!start || !end || end < start) {
      setStatusKind('error');
      setStatus('Invalid A/B testing period.');
      return;
    }

    try {
      setAdvancedBacktestComparisonRunning(true);
      setStatus('');
      setAdvancedBacktestComparisonResult(null);
      const strategyLabelById = new Map(
        strategies.map((strategy) => [
          strategy.id,
          `${strategy.name} (${strategy.riskProfile})`,
        ]),
      );
      setAdvancedProgressScope('strategy');
      setAdvancedProgressLabels(
        abComparisonStrategyIds.map((strategyId) => {
          return strategyLabelById.get(strategyId) ?? strategyId;
        }),
      );
      setAdvancedProgressSelectedIndex(0);
      setAdvancedProgressLiveAiRequested(abComparisonUseLiveAiInSimulation);
      setShowAdvancedProgressModal(true);
      setAdvancedRunSession(null);

      const payload = await startAdvancedBacktestingComparisonRunSession({
        strategyIds: abComparisonStrategyIds,
        periodStart: abComparisonPeriodStart,
        periodEnd: abComparisonPeriodEnd,
        override: overrideEnabled
          ? {
              riskProfile: overrideRiskProfile,
              monthlyBudgetEur: overrideMonthlyBudget,
              rebalancingPerDay: overrideRebalancingPerDay,
              maxPositionPct: overrideMaxPositionPct,
            }
          : undefined,
        useLiveAiInSimulation: abComparisonUseLiveAiInSimulation,
      });
      setAdvancedRunSession(payload.session);
    } catch (error) {
      if (isUnauthorizedError(error)) {
        navigate('/login', { replace: true });
        return;
      }
      setStatusKind('error');
      setStatus(
        error instanceof Error
          ? `A/B testing failed: ${error.message}`
          : 'A/B testing failed.',
      );
      setAdvancedBacktestComparisonRunning(false);
    }
  }

  function toggleComparisonStrategy(strategyId: string): void {
    setAbComparisonStrategyIds((current) => {
      if (current.includes(strategyId)) {
        return current.filter((id) => id !== strategyId);
      }
      if (current.length >= 3) {
        return current;
      }
      return [...current, strategyId];
    });
  }

  function applyMainPeriodPreset(days: number): void {
    const next = computeMainPeriodPreset(periodEnd, days);
    setPeriodStart(next.periodStart);
    setPeriodEnd(next.periodEnd);
  }

  function applyAdvancedPeriodPreset(index: number, days: number): void {
    setAdvancedPeriods((current) => {
      return computeAdvancedPeriodPreset(current, index, days, periodStart);
    });
  }

  function applyAbComparisonPeriodPreset(days: number): void {
    const next = computeAbComparisonPeriodPreset(abComparisonPeriodEnd, days);
    setAbComparisonPeriodStart(next.periodStart);
    setAbComparisonPeriodEnd(next.periodEnd);
  }

  useSimulationSessionTracking({
    runSession,
    setRunSession,
    setRuns,
    setRunning,
    setShowRunProgressModal,
    advancedRunSession,
    setAdvancedRunSession,
    setAdvancedBacktestResult,
    setAdvancedBacktestComparisonResult,
    advancedProgressLiveAiRequested,
    setStatusKind,
    setStatus,
    onUnauthorized: () => {
      navigate('/login', { replace: true });
    },
  });

  function openRun(run: HistoricalSimulationSummary): void {
    navigate(`/simulations/${encodeURIComponent(run.id)}`);
  }

  async function handleDeleteRun(
    run: HistoricalSimulationSummary,
  ): Promise<void> {
    const confirmed = window.confirm(
      `Delete simulation ${run.id} (${run.periodStart} -> ${run.periodEnd})? This action is irreversible.`,
    );
    if (!confirmed) {
      return;
    }

    try {
      const payload = await deleteHistoricalSimulation(run.id);
      setRuns((current) => {
        return current.filter((item) => item.id !== payload.deletedId);
      });
      setStatusKind('success');
      setStatus('Simulation deleted.');
    } catch (error) {
      if (isUnauthorizedError(error)) {
        navigate('/login', { replace: true });
        return;
      }
      setStatusKind('error');
      setStatus('Unable to delete this simulation.');
    }
  }

  async function handleDeleteAllRuns(): Promise<void> {
    const confirmed = window.confirm(
      t('simulations.archive.deleteAll.confirm'),
    );
    if (!confirmed) {
      return;
    }

    try {
      const payload = await deleteAllHistoricalSimulations();
      setRuns([]);
      setStatusKind('success');
      setStatus(
        t('simulations.archive.deleteAll.success', {
          count: payload.deletedCount,
        }),
      );
    } catch (error) {
      if (isUnauthorizedError(error)) {
        navigate('/login', { replace: true });
        return;
      }
      setStatusKind('error');
      setStatus(t('simulations.archive.deleteAll.error'));
    }
  }

  const runProgress = runSession?.progress ?? null;
  const advancedProgress = advancedRunSession?.progress ?? null;
  const advancedProgressRunningNow =
    advancedProgress?.status === 'pending' ||
    advancedProgress?.status === 'running';

  function closeAdvancedProgressModal(): void {
    if (advancedProgressRunningNow) {
      return;
    }
    setShowAdvancedProgressModal(false);
    setAdvancedProgressLabels([]);
    setAdvancedRunSession(null);
    setAdvancedProgressSelectedIndex(0);
  }
  return (
    <Layout
      title={t('page.simulations.title')}
      subtitle={t('page.simulations.subtitle')}
    >
      <section className="strategies-grid">
        <article className="panel strategy-form-panel">
          <h2>New simulation</h2>
          <form
            className="strategy-form strategy-form--stacked"
            onSubmit={(event) => {
              void handleRunSimulation(event);
            }}
          >
            <div className="form-grid">
              <label className="field">
                <span className="field-label">
                  Strategy
                  <InfoTip
                    label="Strategy"
                    text="Base strategy used for this simulation."
                  />
                </span>
                <select
                  value={selectedStrategyId}
                  onChange={(event) => {
                    setSelectedStrategyId(event.target.value);
                  }}
                  required
                >
                  {strategies.map((strategy) => {
                    return (
                      <option key={strategy.id} value={strategy.id}>
                        {strategy.name} ({strategy.riskProfile})
                      </option>
                    );
                  })}
                </select>
              </label>
            </div>

            <div className="form-grid simulations-period-grid">
              <label className="field">
                <span className="field-label">
                  Start
                  <InfoTip
                    label="Start date"
                    text="Backtest start date (inclusive)."
                  />
                </span>
                <DatePickerInput
                  value={periodStart}
                  max={periodEnd}
                  required
                  onChange={(value) => {
                    setPeriodStart(value);
                  }}
                />
              </label>

              <label className="field">
                <span className="field-label">
                  End
                  <InfoTip
                    label="End date"
                    text="Backtest end date (inclusive)."
                  />
                </span>
                <DatePickerInput
                  value={periodEnd}
                  min={periodStart}
                  required
                  onChange={(value) => {
                    setPeriodEnd(value);
                  }}
                />
              </label>
            </div>

            <div
              className="date-range-presets"
              aria-label="Date interval presets"
            >
              {[10, 30, 90, 180, 365].map((days) => {
                return (
                  <button
                    key={`period-preset-${days}`}
                    className="button button-secondary button-small"
                    type="button"
                    onClick={() => {
                      applyMainPeriodPreset(days);
                    }}
                  >
                    {days}j
                  </button>
                );
              })}
            </div>

            <div className="form-toggle-row">
              <div
                className={`toggle-btn${overrideEnabled ? ' selected' : ''}`}
                tabIndex={0}
                role="button"
                aria-pressed={overrideEnabled}
                onClick={() => setOverrideEnabled((v) => !v)}
                onKeyDown={(e) => {
                  if (e.key === ' ' || e.key === 'Enter') {
                    e.preventDefault();
                    setOverrideEnabled((v) => !v);
                  }
                }}
              >
                Override strategy for this test
              </div>
              <div
                className={`toggle-btn${useLiveAiInSimulation ? ' selected' : ''}`}
                tabIndex={0}
                role="button"
                aria-pressed={useLiveAiInSimulation}
                onClick={() => setUseLiveAiInSimulation((v) => !v)}
                onKeyDown={(e) => {
                  if (e.key === ' ' || e.key === 'Enter') {
                    e.preventDefault();
                    setUseLiveAiInSimulation((v) => !v);
                  }
                }}
              >
                Use live AI (potential cost)
                <InfoTip
                  label="Live AI in simulation"
                  text="Enables real AI calls during historical simulation. Decisions still rely only on data available at the simulated date."
                />
              </div>
            </div>

            {overrideEnabled ? (
              <div className="form-group">
                <h3>Temporary override (not persisted)</h3>
                <div className="form-grid">
                  <label className="field">
                    <span>Risk profile</span>
                    <select
                      value={overrideRiskProfile}
                      onChange={(event) => {
                        setOverrideRiskProfile(
                          event.target.value as StrategyRiskProfile,
                        );
                      }}
                    >
                      <option value="defensive">defensive</option>
                      <option value="balanced">balanced</option>
                      <option value="aggressive">aggressive</option>
                    </select>
                  </label>
                  <label className="field">
                    <span>Monthly budget (EUR)</span>
                    <input
                      type="number"
                      min={50}
                      max={5000}
                      value={overrideMonthlyBudget}
                      onChange={(event) => {
                        setOverrideMonthlyBudget(Number(event.target.value));
                      }}
                    />
                  </label>
                  <label className="field">
                    <span>Cycles / day</span>
                    <input
                      type="number"
                      min={1}
                      max={4}
                      value={overrideRebalancingPerDay}
                      onChange={(event) => {
                        setOverrideRebalancingPerDay(
                          Number(event.target.value),
                        );
                      }}
                    />
                  </label>
                  <label className="field">
                    <span>Max position (%)</span>
                    <input
                      type="number"
                      min={10}
                      max={80}
                      value={overrideMaxPositionPct}
                      onChange={(event) => {
                        setOverrideMaxPositionPct(Number(event.target.value));
                      }}
                    />
                  </label>
                </div>
              </div>
            ) : null}

            <div className="form-actions">
              <button className="button" type="submit" disabled={running}>
                {running ? 'Simulation running...' : 'Run simulation'}
              </button>
              <button
                className="button button-secondary"
                type="button"
                onClick={() => {
                  setPeriodStart(resolveDefaultPeriodStart());
                  setPeriodEnd(resolveDefaultPeriodEnd());
                  setOverrideEnabled(false);
                  setUseLiveAiInSimulation(false);
                }}
              >
                Reset
              </button>
            </div>
          </form>
        </article>

        <aside className="panel strategy-help-panel">
          <h2>Simulation rules</h2>
          <ul className="cards-list">
            <li>
              <h3>Initial capital</h3>
              <p>300 EUR injected at the start date.</p>
            </li>
            <li>
              <h3>Monthly contributions</h3>
              <p>
                The strategy monthly budget is added at the start of each
                following month.
              </p>
            </li>
            <li>
              <h3>No look-ahead bias</h3>
              <p>
                On each date, decisions use only historical data available up to
                that date.
              </p>
            </li>
          </ul>
        </aside>
      </section>

      <section className="panel simulations-advanced-panel">
        <h2>Advanced backtesting (multi-period + Monte Carlo)</h2>
        <form
          className="strategy-form strategy-form--stacked"
          onSubmit={(event) => {
            void handleRunAdvancedBacktest(event);
          }}
        >
          <div className="form-grid">
            <label className="field">
              <span>Strategy</span>
              <select
                value={advancedBacktestStrategyId}
                onChange={(event) => {
                  setAdvancedBacktestStrategyId(event.target.value);
                }}
                required
              >
                {strategies.map((strategy) => {
                  return (
                    <option key={strategy.id} value={strategy.id}>
                      {strategy.name} ({strategy.riskProfile})
                    </option>
                  );
                })}
              </select>
            </label>
            <label className="field">
              <span>Monte Carlo iterations</span>
              <input
                type="number"
                min={100}
                max={2000}
                step={50}
                value={advancedMonteCarloIterations}
                onChange={(event) => {
                  setAdvancedMonteCarloIterations(Number(event.target.value));
                }}
              />
            </label>
            <label className="field">
              <span>Projection horizon (months)</span>
              <input
                type="number"
                min={1}
                max={36}
                value={advancedMonteCarloHorizonMonths}
                onChange={(event) => {
                  setAdvancedMonteCarloHorizonMonths(
                    Number(event.target.value),
                  );
                }}
              />
            </label>
          </div>

          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Period</th>
                  <th>Start</th>
                  <th>End</th>
                  <th>Presets</th>
                </tr>
              </thead>
              <tbody>
                {advancedPeriods.map((period, index) => {
                  return (
                    <tr key={`advanced-period-${index + 1}`}>
                      <td>#{index + 1}</td>
                      <td>
                        <DatePickerInput
                          value={period.periodStart}
                          max={period.periodEnd || undefined}
                          onChange={(value) => {
                            setAdvancedPeriods((current) => {
                              const next = [...current];
                              next[index] = {
                                ...next[index],
                                periodStart: value,
                              };
                              return next;
                            });
                          }}
                          className="date-picker-input date-picker-input--compact"
                        />
                      </td>
                      <td>
                        <DatePickerInput
                          value={period.periodEnd}
                          min={period.periodStart || undefined}
                          onChange={(value) => {
                            setAdvancedPeriods((current) => {
                              const next = [...current];
                              next[index] = {
                                ...next[index],
                                periodEnd: value,
                              };
                              return next;
                            });
                          }}
                          className="date-picker-input date-picker-input--compact"
                        />
                      </td>
                      <td>
                        <div className="date-range-presets date-range-presets--compact">
                          {[10, 30, 90, 180, 365].map((days) => {
                            return (
                              <button
                                key={`advanced-period-${index + 1}-${days}`}
                                className="button button-secondary button-small"
                                type="button"
                                onClick={() => {
                                  applyAdvancedPeriodPreset(index, days);
                                }}
                              >
                                {days}j
                              </button>
                            );
                          })}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="form-actions">
            <button
              className="button"
              type="submit"
              disabled={advancedBacktestRunning}
            >
              {advancedBacktestRunning
                ? 'Advanced backtesting running...'
                : 'Run advanced backtesting'}
            </button>
          </div>
        </form>

        {advancedBacktestResult ? (
          <>
            <section className="kpis">
              <article className="kpi">
                <span>Average return</span>
                <strong>
                  {advancedBacktestResult.aggregate.averageReturnPct}%
                </strong>
              </article>
              <article className="kpi">
                <span>Positive period rate</span>
                <strong>
                  {advancedBacktestResult.aggregate.positiveRatePct}%
                </strong>
              </article>
              <article className="kpi">
                <span>Average final value</span>
                <strong>
                  {formatAmountFromEur(
                    advancedBacktestResult.aggregate.averageFinalValueEur,
                  )}
                </strong>
              </article>
              <article className="kpi">
                <span>Median projection (P50)</span>
                <strong>
                  {formatAmountFromEur(
                    advancedBacktestResult.monteCarlo.p50FinalValueEur,
                  )}
                </strong>
              </article>
            </section>

            <h3>Results by period</h3>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Period</th>
                    <th>Return</th>
                    <th>Final value</th>
                    <th>Win rate</th>
                    <th>Operations</th>
                  </tr>
                </thead>
                <tbody>
                  {advancedBacktestResult.periods.map((period) => {
                    return (
                      <tr key={`${period.periodStart}-${period.periodEnd}`}>
                        <td>
                          {period.periodStart} → {period.periodEnd}
                        </td>
                        <td>{period.summary.returnPct.toFixed(2)}%</td>
                        <td>
                          {formatAmountFromEur(period.summary.finalValueEur)}
                        </td>
                        <td>{period.summary.winRatePct.toFixed(2)}%</td>
                        <td>{period.summary.operationsCount}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <h3>Projection Monte Carlo (P10 / P50 / P90)</h3>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Month</th>
                    <th>P10</th>
                    <th>P50</th>
                    <th>P90</th>
                  </tr>
                </thead>
                <tbody>
                  {advancedBacktestResult.monteCarlo.curve.map((point) => {
                    return (
                      <tr key={`mc-${point.month}`}>
                        <td>{point.month}</td>
                        <td>{formatAmountFromEur(point.p10ValueEur)}</td>
                        <td>{formatAmountFromEur(point.p50ValueEur)}</td>
                        <td>{formatAmountFromEur(point.p90ValueEur)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        ) : null}

        <AdvancedComparisonSection
          strategies={strategies}
          periodStart={abComparisonPeriodStart}
          periodEnd={abComparisonPeriodEnd}
          selectedStrategyIds={abComparisonStrategyIds}
          useLiveAiInSimulation={abComparisonUseLiveAiInSimulation}
          running={advancedBacktestComparisonRunning}
          result={advancedBacktestComparisonResult}
          onPeriodStartChange={setAbComparisonPeriodStart}
          onPeriodEndChange={setAbComparisonPeriodEnd}
          onApplyPeriodPreset={applyAbComparisonPeriodPreset}
          onToggleLiveAi={setAbComparisonUseLiveAiInSimulation}
          onToggleStrategy={toggleComparisonStrategy}
          onSubmit={(event) => {
            void handleRunAdvancedBacktestComparison(event);
          }}
        />
      </section>

      {status ? (
        <section
          className={`panel status ${statusKind === 'error' ? 'status-error' : 'status-success'}`}
        >
          {status}
        </section>
      ) : null}

      <ContinuousSimulationSection
        enabled={continuousModeEnabled}
        intervalMs={continuousIntervalMs}
        snapshot={continuousSnapshot}
        loading={continuousLoading}
        error={continuousError}
        updatedAt={continuousUpdatedAt}
        onEnabledChange={handleContinuousEnabledChange}
        onIntervalChange={setContinuousIntervalMs}
      />

      <SimulationArchiveSection
        loadingRuns={loadingRuns}
        runs={runs}
        archiveStatusFilter={archiveStatusFilter}
        archiveStrategyFilter={archiveStrategyFilter}
        archivePageSize={archivePageSize}
        archiveStrategies={archiveStrategies}
        filteredRunsCount={filteredRuns.length}
        safeArchivePage={safeArchivePage}
        archivePageCount={archivePageCount}
        pagedRuns={pagedRuns}
        onDeleteAllRuns={() => {
          void handleDeleteAllRuns();
        }}
        onArchiveStatusFilterChange={setArchiveStatusFilter}
        onArchiveStrategyFilterChange={setArchiveStrategyFilter}
        onArchivePageSizeChange={setArchivePageSize}
        onPreviousPage={onPreviousPage}
        onNextPage={onNextPage}
        onOpenRun={openRun}
        onDeleteRun={(run) => {
          void handleDeleteRun(run);
        }}
      />

      <AdvancedRunProgressModal
        open={showAdvancedProgressModal}
        scope={advancedProgressScope}
        labels={advancedProgressLabels}
        progress={advancedProgress}
        selectedIndex={advancedProgressSelectedIndex}
        liveAiRequested={advancedProgressLiveAiRequested}
        onSelectedIndexChange={setAdvancedProgressSelectedIndex}
        onClose={closeAdvancedProgressModal}
      />

      <RunProgressModal
        open={showRunProgressModal}
        progress={runProgress}
        onClose={() => {
          setShowRunProgressModal(false);
          setRunSession(null);
        }}
      />
    </Layout>
  );
}
