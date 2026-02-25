import { useEffect, useMemo, useState } from 'react';
import type { JSX } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  HistoricalSimulationReport,
  HistoricalSimulationSummary,
  OperationOutcomeFilter,
  OperationSideFilter,
  getHistoricalSimulation,
  isUnauthorizedError,
  listHistoricalSimulations,
} from '../api';
import { Layout } from '../components/Layout';
import { formatAmountFromEur } from '../currency';
import { useI18n } from '../i18n/i18n';
import {
  buildOperationFiltersQueryString,
  matchesOperationFilters,
  normalizeOperationOutcomeFilter,
  normalizeOperationSideFilter,
} from './operationFilters';

type EquityPoint = {
  date: string;
  investedEur: number;
  portfolioValueEur: number;
  cashEur: number;
};

type AiUsageEvolutionPoint = {
  step: number;
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
};

type AiRecommendationEvolutionPoint = {
  step: number;
  buyRecommendations: number;
  sellRecommendations: number;
  holdRecommendations: number;
  llmRecommendations: number;
  fallbackRecommendations: number;
};

type OperationMarkerKind = 'BUY_FILLED' | 'SELL_FILLED' | 'BUY_REJECTED' | 'SELL_REJECTED';

type AssetPriceCurvePoint = {
  timestamp: string;
  label: string;
  [key: string]: string | number | undefined;
};

const EVENT_MARKER_COLORS: Record<OperationMarkerKind, string> = {
  BUY_FILLED: '#22c55e',
  SELL_FILLED: '#f97316',
  BUY_REJECTED: '#86efac',
  SELL_REJECTED: '#fdba74',
};

const ASSET_LINE_COLORS = [
  '#38bdf8',
  '#a78bfa',
  '#f472b6',
  '#34d399',
  '#f59e0b',
  '#60a5fa',
  '#fb7185',
  '#2dd4bf',
  '#c084fc',
  '#facc15',
  '#4ade80',
];

function assetPriceKey(symbol: string): string {
  return `${symbol}__price`;
}

function assetEventKey(symbol: string): string {
  return `${symbol}__event`;
}

function normalizeMarkerKind(operation: {
  side: 'BUY' | 'SELL';
  status: 'FILLED' | 'REJECTED';
}): OperationMarkerKind {
  if (operation.side === 'BUY' && operation.status === 'FILLED') {
    return 'BUY_FILLED';
  }
  if (operation.side === 'BUY' && operation.status === 'REJECTED') {
    return 'BUY_REJECTED';
  }
  if (operation.side === 'SELL' && operation.status === 'FILLED') {
    return 'SELL_FILLED';
  }
  return 'SELL_REJECTED';
}

function buildAssetPriceCurve(report: HistoricalSimulationReport | null): {
  symbols: string[];
  points: AssetPriceCurvePoint[];
} {
  const operations = [...(report?.operations ?? [])].sort((left, right) => {
    return Date.parse(left.timestamp) - Date.parse(right.timestamp);
  });
  if (operations.length === 0) {
    return { symbols: [], points: [] };
  }

  const symbols = Array.from(
    new Set(
      operations.map((operation) => {
        return operation.symbol;
      }),
    ),
  ).sort((left, right) => left.localeCompare(right));

  const lastPriceBySymbol = symbols.reduce<Record<string, number>>((accumulator, symbol) => {
    accumulator[symbol] = 0;
    return accumulator;
  }, {});

  const points: AssetPriceCurvePoint[] = [];

  for (const operation of operations) {
    const symbol = operation.symbol;
    const rawPrice = Number(operation.priceEur);
    const referencePrice = Number.isFinite(rawPrice) && rawPrice > 0 ? rawPrice : 0;
    if (referencePrice > 0) {
      lastPriceBySymbol[symbol] = referencePrice;
    }

    const point: AssetPriceCurvePoint = {
      timestamp: operation.timestamp,
      label: operation.timestamp.replace('T', ' ').slice(0, 16),
    };
    for (const currentSymbol of symbols) {
      point[assetPriceKey(currentSymbol)] = Number(
        Math.max(0, lastPriceBySymbol[currentSymbol]).toFixed(2),
      );
    }
    point[assetEventKey(symbol)] = normalizeMarkerKind(operation);
    points.push(point);
  }

  return {
    symbols,
    points,
  };
}

export function SimulationReportPage(): JSX.Element {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { simulationId = '' } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  const [run, setRun] = useState<HistoricalSimulationSummary | null>(null);
  const [report, setReport] = useState<HistoricalSimulationReport | null>(null);
  const [allRuns, setAllRuns] = useState<HistoricalSimulationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [operationSideFilter, setOperationSideFilter] = useState<OperationSideFilter>(() => {
    return normalizeOperationSideFilter(searchParams.get('side'));
  });
  const [operationOutcomeFilter, setOperationOutcomeFilter] = useState<OperationOutcomeFilter>(
    () => {
      return normalizeOperationOutcomeFilter(searchParams.get('outcome'));
    },
  );
  const [operationSymbolFilter, setOperationSymbolFilter] = useState('all');
  const [operationsPageSize, setOperationsPageSize] = useState(50);
  const [operationsPage, setOperationsPage] = useState(1);

  useEffect(() => {
    let active = true;

    async function load(): Promise<void> {
      try {
        setLoading(true);
        const [runsPayload, simulationPayload] = await Promise.all([
          listHistoricalSimulations(),
          getHistoricalSimulation(simulationId),
        ]);

        if (!active) {
          return;
        }

        setAllRuns(runsPayload);
        setRun(simulationPayload.run);
        setReport(simulationPayload.report);
        setError('');
      } catch (currentError) {
        if (!active) {
          return;
        }
        if (isUnauthorizedError(currentError)) {
          navigate('/login', { replace: true });
          return;
        }
        setError('Unable to load this simulation report.');
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [navigate, simulationId]);

  const orderedRuns = useMemo(() => {
    return [...allRuns].sort((left, right) => {
      return Date.parse(right.createdAt) - Date.parse(left.createdAt);
    });
  }, [allRuns]);

  const runIndex = useMemo(() => {
    return orderedRuns.findIndex((item) => item.id === simulationId);
  }, [orderedRuns, simulationId]);

  const previousRunId = runIndex >= 0 ? (orderedRuns[runIndex + 1]?.id ?? '') : '';
  const nextRunId = runIndex > 0 ? (orderedRuns[runIndex - 1]?.id ?? '') : '';

  const equityChartData = useMemo(() => {
    return (report?.equityCurve ?? []).map((point: EquityPoint) => ({
      date: point.date,
      investedEur: point.investedEur,
      portfolioValueEur: point.portfolioValueEur,
      gainLossEur: Number((point.portfolioValueEur - point.investedEur).toFixed(2)),
    }));
  }, [report]);

  const aiUsageTotals = useMemo(() => {
    const operations = report?.operations ?? [];
    const attemptedCalls = operations.filter((operation) => {
      return operation.aiRemoteCallAttempted;
    }).length;
    const successfulCalls = operations.filter((operation) => {
      return operation.aiRemoteCallOutcome === 'successful';
    }).length;
    const failedCalls = operations.filter((operation) => {
      return operation.aiRemoteCallOutcome === 'failed';
    }).length;

    return {
      totalCalls: report?.aiUsage?.remoteCalls ?? attemptedCalls,
      successfulCalls: report?.aiUsage?.successfulCalls ?? successfulCalls,
      failedCalls: report?.aiUsage?.failedCalls ?? failedCalls,
      promptTokens: report?.aiUsage?.promptTokens ?? 0,
      completionTokens: report?.aiUsage?.completionTokens ?? 0,
      totalTokens: report?.aiUsage?.totalTokens ?? 0,
      estimatedCostEur: report?.aiUsage?.estimatedCostEur ?? 0,
    };
  }, [report]);

  const aiUsageEvolution = useMemo(() => {
    const points: AiUsageEvolutionPoint[] = [];
    let totalCalls = 0;
    let successfulCalls = 0;
    let failedCalls = 0;

    for (const operation of report?.operations ?? []) {
      if (!operation.aiRemoteCallAttempted) {
        continue;
      }
      totalCalls += 1;
      if (operation.aiRemoteCallOutcome === 'successful') {
        successfulCalls += 1;
      }
      if (operation.aiRemoteCallOutcome === 'failed') {
        failedCalls += 1;
      }
      points.push({
        step: points.length + 1,
        totalCalls,
        successfulCalls,
        failedCalls,
      });
    }

    return points;
  }, [report]);

  const aiRecommendationEvolution = useMemo(() => {
    const points: AiRecommendationEvolutionPoint[] = [];
    let buyRecommendations = 0;
    let sellRecommendations = 0;
    let holdRecommendations = 0;
    let llmRecommendations = 0;
    let fallbackRecommendations = 0;

    for (const operation of report?.operations ?? []) {
      const action = operation.aiRecommendationAction;
      if (!action) {
        continue;
      }

      if (action === 'BUY') {
        buyRecommendations += 1;
      }
      if (action === 'SELL') {
        sellRecommendations += 1;
      }
      if (action === 'HOLD') {
        holdRecommendations += 1;
      }

      if (operation.aiRecommendationSource === 'llm') {
        llmRecommendations += 1;
      }
      if (operation.aiRecommendationSource === 'fallback') {
        fallbackRecommendations += 1;
      }

      points.push({
        step: points.length + 1,
        buyRecommendations,
        sellRecommendations,
        holdRecommendations,
        llmRecommendations,
        fallbackRecommendations,
      });
    }

    return points;
  }, [report]);

  const assetPriceCurve = useMemo(() => {
    return buildAssetPriceCurve(report);
  }, [report]);

  const assetLineColorBySymbol = useMemo(() => {
    return assetPriceCurve.symbols.reduce<Record<string, string>>((accumulator, symbol, index) => {
      accumulator[symbol] = ASSET_LINE_COLORS[index % ASSET_LINE_COLORS.length] ?? 'var(--accent)';
      return accumulator;
    }, {});
  }, [assetPriceCurve.symbols]);

  const symbolOptions = useMemo(() => {
    const symbols = new Set<string>();
    for (const operation of report?.operations ?? []) {
      symbols.add(operation.symbol);
    }
    return Array.from(symbols).sort((left, right) => left.localeCompare(right));
  }, [report]);

  const filteredOperations = useMemo(() => {
    return (report?.operations ?? []).filter((operation) => {
      if (operationSymbolFilter !== 'all' && operation.symbol !== operationSymbolFilter) {
        return false;
      }
      return matchesOperationFilters(operation, {
        side: operationSideFilter,
        outcome: operationOutcomeFilter,
      });
    });
  }, [operationOutcomeFilter, operationSideFilter, operationSymbolFilter, report]);

  useEffect(() => {
    setOperationsPage(1);
  }, [operationOutcomeFilter, operationSideFilter, operationSymbolFilter, operationsPageSize]);

  const operationsPageCount = Math.max(
    1,
    Math.ceil(filteredOperations.length / operationsPageSize),
  );
  const safeOperationsPage = Math.min(operationsPage, operationsPageCount);

  const pagedOperations = useMemo(() => {
    const start = (safeOperationsPage - 1) * operationsPageSize;
    return filteredOperations.slice(start, start + operationsPageSize);
  }, [filteredOperations, operationsPageSize, safeOperationsPage]);

  const operationFilterQuery = useMemo(() => {
    return buildOperationFiltersQueryString({
      side: operationSideFilter,
      outcome: operationOutcomeFilter,
    });
  }, [operationOutcomeFilter, operationSideFilter]);

  function navigateToRun(targetId: string): void {
    if (!targetId) {
      return;
    }
    navigate(`/simulations/${encodeURIComponent(targetId)}`);
  }

  return (
    <Layout
      title="Simulation report"
      subtitle={run ? `${run.strategyName} · ${run.periodStart} → ${run.periodEnd}` : 'Loading...'}
    >
      <section className="panel">
        <div className="form-actions">
          <button
            className="button button-secondary"
            type="button"
            onClick={() => {
              navigate('/simulations');
            }}
          >
            {t('auto.back_to_simulations')}
          </button>
          <button
            className="button button-secondary"
            type="button"
            onClick={() => {
              navigateToRun(previousRunId);
            }}
            disabled={!previousRunId}
          >
            {t('auto.previous_simulation')}
          </button>
          <button
            className="button button-secondary"
            type="button"
            onClick={() => {
              navigateToRun(nextRunId);
            }}
            disabled={!nextRunId}
          >
            {t('auto.next_simulation')}
          </button>
        </div>
      </section>

      {loading ? <section className="panel">{t('auto.loading')}</section> : null}
      {!loading && error ? <section className="panel status status-error">{error}</section> : null}

      {!loading && !error && run && report ? (
        <>
          <section className="kpis">
            <article className="kpi">
              <span>{t('auto.total_invested')}</span>
              <strong>{formatAmountFromEur(report.totals.totalInvestedEur)}</strong>
            </article>
            <article className="kpi">
              <span>{t('auto.final_value')}</span>
              <strong>{formatAmountFromEur(report.totals.finalValueEur)}</strong>
            </article>
            <article className="kpi">
              <span>{t('auto.net_gain_loss')}</span>
              <strong>{formatAmountFromEur(report.totals.netProfitEur)}</strong>
            </article>
            <article className="kpi">
              <span>{t('auto.return')}</span>
              <strong>{report.totals.returnPct.toFixed(2)}%</strong>
            </article>
            <article className="kpi">
              <span>{t('auto.fees')}</span>
              <strong>{formatAmountFromEur(report.totals.totalFeesEur)}</strong>
            </article>
            <article className="kpi">
              <span>{t('auto.win_rate')}</span>
              <strong>{report.totals.winRatePct.toFixed(2)}%</strong>
            </article>
            <article className="kpi">
              <span>{t('auto.ai_calls')}</span>
              <strong>{aiUsageTotals.totalCalls}</strong>
            </article>
            <article className="kpi">
              <span>{t('auto.ai_calls_successful')}</span>
              <strong>{aiUsageTotals.successfulCalls}</strong>
            </article>
            <article className="kpi">
              <span>{t('auto.ai_calls_failed')}</span>
              <strong>{aiUsageTotals.failedCalls}</strong>
            </article>
            <article className="kpi">
              <span>{t('auto.ai_tokens')}</span>
              <strong>{aiUsageTotals.totalTokens}</strong>
            </article>
            <article className="kpi">
              <span>{t('auto.ai_cost')}</span>
              <strong>{formatAmountFromEur(aiUsageTotals.estimatedCostEur)}</strong>
            </article>
          </section>

          <section className="charts-grid">
            <article className="panel chart-panel chart-panel-wide">
              <h2>{t('auto.asset_price_curves_by_crypto')}</h2>
              <p className="chart-help">
                Real crypto price evolution over time (not holdings quantity or owned amount). One
                chart per crypto.
              </p>
              {assetPriceCurve.points.length > 0 ? (
                assetPriceCurve.symbols.map((symbol) => {
                  const priceKey = assetPriceKey(symbol);
                  const eventKey = assetEventKey(symbol);
                  const lineColor = assetLineColorBySymbol[symbol] ?? 'var(--accent)';
                  return (
                    <div className="chart-wrap" key={`asset-price-${symbol}`}>
                      <h3>{symbol}</h3>
                      <ResponsiveContainer width="100%" height={260}>
                        <LineChart data={assetPriceCurve.points}>
                          <CartesianGrid stroke="var(--line)" strokeDasharray="3 3" />
                          <XAxis dataKey="label" stroke="var(--muted)" />
                          <YAxis
                            stroke="var(--muted)"
                            tickFormatter={(value: number) => `${Math.round(value)} €`}
                          />
                          <Tooltip
                            formatter={(value: number) => formatAmountFromEur(value)}
                            contentStyle={{
                              background: 'var(--panel)',
                              border: '1px solid var(--line)',
                            }}
                          />
                          <Legend />
                          <Line
                            key={`asset-curve-${symbol}`}
                            type="monotone"
                            dataKey={priceKey}
                            name={`${symbol} price (€)`}
                            stroke={lineColor}
                            strokeWidth={2}
                            isAnimationActive={false}
                            dot={(dotProps: {
                              cx?: number;
                              cy?: number;
                              payload?: Record<string, unknown>;
                            }) => {
                              const marker = dotProps.payload?.[eventKey] as
                                | OperationMarkerKind
                                | undefined;
                              if (
                                typeof dotProps.cx !== 'number' ||
                                typeof dotProps.cy !== 'number'
                              ) {
                                return <circle cx={0} cy={0} r={0} />;
                              }
                              if (!marker) {
                                return <circle cx={dotProps.cx} cy={dotProps.cy} r={0} />;
                              }
                              return (
                                <circle
                                  cx={dotProps.cx}
                                  cy={dotProps.cy}
                                  r={4.5}
                                  fill={EVENT_MARKER_COLORS[marker]}
                                  stroke={lineColor}
                                  strokeWidth={1.2}
                                />
                              );
                            }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  );
                })
              ) : (
                <p>{t('auto.no_operation_data_available_to')}</p>
              )}
              <div className="simulation-marker-legend">
                <span>
                  <i style={{ background: EVENT_MARKER_COLORS.BUY_FILLED }} />
                  {t('auto.buy_filled')}
                </span>
                <span>
                  <i style={{ background: EVENT_MARKER_COLORS.SELL_FILLED }} />
                  {t('auto.sell_filled')}
                </span>
                <span>
                  <i style={{ background: EVENT_MARKER_COLORS.BUY_REJECTED }} />
                  {t('auto.buy_rejected')}
                </span>
                <span>
                  <i style={{ background: EVENT_MARKER_COLORS.SELL_REJECTED }} />
                  {t('auto.sell_rejected')}
                </span>
              </div>
            </article>

            <article className="panel chart-panel chart-panel-wide">
              <h2>{t('auto.portfolio_vs_invested_evolutio')}</h2>
              <p className="chart-help">
                Compare portfolio value to invested capital: above means overall gain, below means
                overall loss.
              </p>
              <div className="chart-wrap">
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={equityChartData}>
                    <CartesianGrid stroke="var(--line)" strokeDasharray="3 3" />
                    <XAxis dataKey="date" stroke="var(--muted)" />
                    <YAxis
                      stroke="var(--muted)"
                      tickFormatter={(value: number) => `${Math.round(value)} €`}
                    />
                    <Tooltip
                      formatter={(value: number) => formatAmountFromEur(value)}
                      contentStyle={{
                        background: 'var(--panel)',
                        border: '1px solid var(--line)',
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="investedEur"
                      name="Invested capital"
                      stroke="var(--muted)"
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="portfolioValueEur"
                      name="Portfolio value"
                      stroke="var(--accent)"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </article>

            <article className="panel chart-panel chart-panel-wide">
              <h2>{t('auto.gain_loss_evolution')}</h2>
              <p className="chart-help">
                This chart shows net gain/loss over time: positive means profit, negative means
                loss.
              </p>
              <div className="chart-wrap">
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={equityChartData}>
                    <CartesianGrid stroke="var(--line)" strokeDasharray="3 3" />
                    <XAxis dataKey="date" stroke="var(--muted)" />
                    <YAxis
                      stroke="var(--muted)"
                      tickFormatter={(value: number) => `${Math.round(value)} €`}
                    />
                    <Tooltip
                      formatter={(value: number) => formatAmountFromEur(value)}
                      contentStyle={{
                        background: 'var(--panel)',
                        border: '1px solid var(--line)',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="gainLossEur"
                      name="Gain/Loss"
                      stroke="var(--accent)"
                      fill="var(--accent)"
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </article>

            <article className="panel chart-panel chart-panel-wide">
              <h2>{t('auto.ai_usage_evolution')}</h2>
              <p className="chart-help">
                Cumulative AI remote calls during the simulation, with successful and failed calls
                over time.
              </p>
              <div className="chart-wrap">
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={aiUsageEvolution}>
                    <CartesianGrid stroke="var(--line)" strokeDasharray="3 3" />
                    <XAxis dataKey="step" stroke="var(--muted)" />
                    <YAxis stroke="var(--muted)" allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        background: 'var(--panel)',
                        border: '1px solid var(--line)',
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="totalCalls"
                      name="Total calls"
                      stroke="var(--accent)"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="successfulCalls"
                      name="Successful"
                      stroke="var(--text)"
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="failedCalls"
                      name="Failed"
                      stroke="var(--muted)"
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </article>

            <article className="panel chart-panel chart-panel-wide">
              <h2>{t('auto.ai_recommendation_evolution')}</h2>
              <p className="chart-help">{t('auto.cumulative_recommendation_flow')}</p>
              <div className="chart-wrap">
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={aiRecommendationEvolution}>
                    <CartesianGrid stroke="var(--line)" strokeDasharray="3 3" />
                    <XAxis dataKey="step" stroke="var(--muted)" />
                    <YAxis stroke="var(--muted)" allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        background: 'var(--panel)',
                        border: '1px solid var(--line)',
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="buyRecommendations"
                      name="BUY"
                      stroke="var(--accent)"
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="sellRecommendations"
                      name="SELL"
                      stroke="var(--text)"
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="holdRecommendations"
                      name="HOLD"
                      stroke="var(--muted)"
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="llmRecommendations"
                      name="LLM source"
                      stroke="var(--accent)"
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="fallbackRecommendations"
                      name="Fallback source"
                      stroke="var(--muted)"
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </article>
          </section>

          <section className="panel">
            <h2>{t('auto.simulation_operations')}</h2>
            <section className="controls-panel">
              <label className="field">
                <span>{t('auto.side')}</span>
                <select
                  value={operationSideFilter}
                  onChange={(event) => {
                    const next = normalizeOperationSideFilter(event.target.value);
                    setOperationSideFilter(next);
                    setSearchParams((current) => {
                      const params = new URLSearchParams(current);
                      params.set('side', next);
                      params.set('outcome', operationOutcomeFilter);
                      return params;
                    });
                  }}
                >
                  <option value="all">{t('auto.all')}</option>
                  <option value="buy">{t('auto.buy')}</option>
                  <option value="sell">{t('auto.sell')}</option>
                </select>
              </label>

              <label className="field">
                <span>{t('auto.outcome')}</span>
                <select
                  value={operationOutcomeFilter}
                  onChange={(event) => {
                    const next = normalizeOperationOutcomeFilter(event.target.value);
                    setOperationOutcomeFilter(next);
                    setSearchParams((current) => {
                      const params = new URLSearchParams(current);
                      params.set('side', operationSideFilter);
                      params.set('outcome', next);
                      return params;
                    });
                  }}
                >
                  <option value="successful">{t('auto.successful')}</option>
                  <option value="failed">{t('auto.failed')}</option>
                  <option value="all">{t('auto.all')}</option>
                </select>
              </label>

              <label className="field">
                <span>{t('auto.asset')}</span>
                <select
                  value={operationSymbolFilter}
                  onChange={(event) => {
                    setOperationSymbolFilter(event.target.value);
                  }}
                >
                  <option value="all">{t('auto.all')}</option>
                  {symbolOptions.map((symbol) => {
                    return (
                      <option key={symbol} value={symbol}>
                        {symbol}
                      </option>
                    );
                  })}
                </select>
              </label>

              <label className="field">
                <span>{t('auto.rows_page')}</span>
                <select
                  value={String(operationsPageSize)}
                  onChange={(event) => {
                    const next = Number(event.target.value);
                    if (next === 50 || next === 100 || next === 200) {
                      setOperationsPageSize(next);
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
              {filteredOperations.length} filtered operation(s) · page {safeOperationsPage}/
              {operationsPageCount}
            </p>

            <div className="table-scroll table-scroll-wide">
              <table>
                <thead>
                  <tr>
                    <th>{t('auto.timestamp')}</th>
                    <th>{t('auto.asset')}</th>
                    <th>{t('auto.side')}</th>
                    <th>{t('auto.status')}</th>
                    <th>{t('auto.amount')}</th>
                    <th>{t('auto.price')}</th>
                    <th>{t('auto.fees')}</th>
                    <th>{t('auto.rationale')}</th>
                    <th>{t('auto.detail')}</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedOperations.map((operation) => {
                    return (
                      <tr
                        key={operation.id}
                        onClick={() => {
                          navigate(
                            '/simulations/' +
                              encodeURIComponent(simulationId) +
                              '/operations/' +
                              encodeURIComponent(operation.id) +
                              '?' +
                              operationFilterQuery,
                          );
                        }}
                      >
                        <td>{operation.timestamp}</td>
                        <td>{operation.symbol}</td>
                        <td>{operation.side}</td>
                        <td>{operation.status}</td>
                        <td>{formatAmountFromEur(operation.amountEur)}</td>
                        <td>{formatAmountFromEur(operation.priceEur)}</td>
                        <td>{formatAmountFromEur(operation.feeEur)}</td>
                        <td>{operation.rationale}</td>
                        <td>{t('auto.open')}</td>
                      </tr>
                    );
                  })}
                  {pagedOperations.length === 0 ? (
                    <tr>
                      <td colSpan={9}>{t('auto.no_operations_for_these_filter')}</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>

            <div className="list-pagination">
              <button
                className="button button-secondary button-small"
                type="button"
                onClick={() => {
                  setOperationsPage((current) => Math.max(1, current - 1));
                }}
                disabled={safeOperationsPage <= 1}
              >
                {t('auto.previous')}
              </button>
              <span>
                Page {safeOperationsPage} / {operationsPageCount}
              </span>
              <button
                className="button button-secondary button-small"
                type="button"
                onClick={() => {
                  setOperationsPage((current) => Math.min(operationsPageCount, current + 1));
                }}
                disabled={safeOperationsPage >= operationsPageCount}
              >
                {t('auto.next')}
              </button>
            </div>
          </section>
        </>
      ) : null}
    </Layout>
  );
}
