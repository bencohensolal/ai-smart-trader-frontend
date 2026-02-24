import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  DashboardData,
  OperationOutcomeFilter,
  OperationSideFilter,
  Strategy,
  getDashboard,
  getStrategies,
  isUnauthorizedError,
} from '../api';
import { useI18n } from '../i18n/i18n';
import { Layout } from '../components/Layout';
import { formatAmountFromEur } from '../currency';
import {
  matchesOperationFilters,
  normalizeOperationOutcomeFilter,
  normalizeOperationSideFilter,
} from './operationFilters';

const percentage = new Intl.NumberFormat('fr-FR', {
  style: 'percent',
  maximumFractionDigits: 2,
});

type MonteCarloPoint = {
  label: string;
  median: number;
  p10: number;
  p90: number;
};

type CorrelationCell = {
  rowSymbol: string;
  colSymbol: string;
  value: number;
};

function computeReturns(values: number[]): number[] {
  const returns: number[] = [];
  for (let index = 1; index < values.length; index += 1) {
    const previous = values[index - 1];
    const current = values[index];
    if (previous <= 0 || !Number.isFinite(previous) || !Number.isFinite(current)) {
      continue;
    }
    returns.push((current - previous) / previous);
  }
  return returns;
}

function computeStdDev(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

function computeCorrelation(seriesA: number[], seriesB: number[]): number {
  const points = Math.min(seriesA.length, seriesB.length);
  if (points < 2) {
    return 0;
  }

  const a = seriesA.slice(seriesA.length - points);
  const b = seriesB.slice(seriesB.length - points);
  const meanA = a.reduce((sum, value) => sum + value, 0) / points;
  const meanB = b.reduce((sum, value) => sum + value, 0) / points;

  let covariance = 0;
  let varianceA = 0;
  let varianceB = 0;

  for (let index = 0; index < points; index += 1) {
    const deltaA = a[index] - meanA;
    const deltaB = b[index] - meanB;
    covariance += deltaA * deltaB;
    varianceA += deltaA ** 2;
    varianceB += deltaB ** 2;
  }

  if (varianceA === 0 || varianceB === 0) {
    return 0;
  }

  return covariance / Math.sqrt(varianceA * varianceB);
}

function createSeededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function createNormalGenerator(seed: number): () => number {
  const random = createSeededRandom(seed);
  return () => {
    const u1 = Math.max(random(), Number.EPSILON);
    const u2 = Math.max(random(), Number.EPSILON);
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  };
}

function ChartTitleWithHelp({ title, help }: { title: string; help: string }): JSX.Element {
  return (
    <div className="chart-title-row">
      <h2>{title}</h2>
      <span className="chart-help-trigger" tabIndex={0} aria-label={help}>
        ?
        <span className="chart-help-popover" role="tooltip">
          {help}
        </span>
      </span>
    </div>
  );
}

export function DashboardPage(): JSX.Element {
  const { t } = useI18n();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [selectedStrategyId, setSelectedStrategyId] = useState('');
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [operationSideFilter, setOperationSideFilter] = useState<OperationSideFilter>('all');
  const [operationOutcomeFilter, setOperationOutcomeFilter] =
    useState<OperationOutcomeFilter>('successful');
  const [operationsPageSize, setOperationsPageSize] = useState(50);
  const [operationsPage, setOperationsPage] = useState(1);
  const strategyIdFromUrl = searchParams.get('strategyId') ?? '';

  useEffect(() => {
    let active = true;
    async function load(): Promise<void> {
      try {
        const strategyList = await getStrategies();
        if (!active) {
          return;
        }
        setStrategies(strategyList);
        const defaultStrategyId =
          strategyList.find((item) => item.id === strategyIdFromUrl)?.id ??
          strategyList[0]?.id ??
          '';
        setSelectedStrategyId(defaultStrategyId);
        setError('');
      } catch (currentError) {
        if (!active) {
          return;
        }
        if (isUnauthorizedError(currentError)) {
          navigate('/login', { replace: true });
          return;
        }
        setError('Unable to load strategies for the dashboard.');
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [navigate, strategyIdFromUrl]);

  useEffect(() => {
    let active = true;
    async function loadDashboard(): Promise<void> {
      if (!selectedStrategyId) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const data = await getDashboard(selectedStrategyId);
        if (!active) {
          return;
        }
        setDashboard(data);
        setSearchParams({ strategyId: data.strategyId });
        setError('');
      } catch (currentError) {
        if (!active) {
          return;
        }
        if (isUnauthorizedError(currentError)) {
          navigate('/login', { replace: true });
          return;
        }
        setError('Unable to load dashboard data.');
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }
    void loadDashboard();
    return () => {
      active = false;
    };
  }, [navigate, selectedStrategyId, setSearchParams]);

  const lastOperations = useMemo(() => {
    return (dashboard?.lastOperations ?? []).filter((operation) => {
      return matchesOperationFilters(operation, {
        side: operationSideFilter,
        outcome: operationOutcomeFilter,
      });
    });
  }, [dashboard, operationOutcomeFilter, operationSideFilter]);

  useEffect(() => {
    setOperationsPage(1);
  }, [operationOutcomeFilter, operationSideFilter, operationsPageSize]);

  const operationsPageCount = Math.max(1, Math.ceil(lastOperations.length / operationsPageSize));
  const safeOperationsPage = Math.min(operationsPage, operationsPageCount);
  const pagedOperations = useMemo(() => {
    const start = (safeOperationsPage - 1) * operationsPageSize;
    return lastOperations.slice(start, start + operationsPageSize);
  }, [lastOperations, operationsPageSize, safeOperationsPage]);

  const selectedStrategy = useMemo(() => {
    if (!dashboard) {
      return null;
    }
    return strategies.find((strategy) => strategy.id === dashboard.strategyId) ?? null;
  }, [dashboard, strategies]);

  const riskReturnData = useMemo(() => {
    return (dashboard?.strategyComparison ?? []).map((row) => ({
      strategyName: row.strategyName,
      drawdown: row.estimatedDrawdownPct,
      return: row.estimatedMonthlyReturnPct,
      score: row.score,
    }));
  }, [dashboard]);

  const riskReturnMetricLabelByKey = useMemo(() => {
    return {
      drawdown: t('dashboard.charts.riskReturn.drawdown'),
      return: t('dashboard.charts.riskReturn.return'),
      score: t('dashboard.charts.riskReturn.score'),
    } as Record<string, string>;
  }, [t]);

  const pnlCurveData = useMemo(() => {
    if (!dashboard) {
      return [];
    }

    const pointCount = dashboard.equityCurve.length;
    if (pointCount === 0) {
      return [];
    }

    const totalPnl = dashboard.realizedPnlEur + dashboard.unrealizedPnlEur;
    const realizedWeight = totalPnl === 0 ? 0.5 : dashboard.realizedPnlEur / totalPnl;

    return dashboard.equityCurve.map((point, index) => {
      const investedEur = dashboard.totalInvestedEur * ((index + 1) / pointCount);
      const totalPnlEur = point.value - investedEur;
      const realizedPnlEur = totalPnlEur * realizedWeight;
      const unrealizedPnlEur = totalPnlEur - realizedPnlEur;

      return {
        label: point.label,
        realizedPnlEur,
        unrealizedPnlEur,
      };
    });
  }, [dashboard]);

  const targetVsActualData = useMemo(() => {
    if (!dashboard) {
      return [];
    }

    const currentAllocation = new Map(
      dashboard.currentAllocation.map((item) => [item.symbol, item.weightPct]),
    );
    const targetAllocation = selectedStrategy?.targetAllocation ?? {};
    const symbols = Array.from(
      new Set([...Object.keys(targetAllocation), ...currentAllocation.keys()]),
    );

    return symbols.map((symbol) => ({
      symbol,
      targetPct: targetAllocation[symbol] ?? 0,
      actualPct: currentAllocation.get(symbol) ?? 0,
    }));
  }, [dashboard, selectedStrategy]);

  const operationPricesBySymbol = useMemo(() => {
    const bySymbol = new Map<string, Array<{ timestamp: number; priceEur: number }>>();

    for (const operation of dashboard?.lastOperations ?? []) {
      const timestamp = Date.parse(operation.timestamp);
      const bucket = bySymbol.get(operation.symbol) ?? [];
      bucket.push({ timestamp, priceEur: operation.priceEur });
      bySymbol.set(operation.symbol, bucket);
    }

    for (const [symbol, points] of bySymbol.entries()) {
      bySymbol.set(
        symbol,
        [...points].sort((left, right) => left.timestamp - right.timestamp),
      );
    }

    return bySymbol;
  }, [dashboard]);

  const volatilityData = useMemo(() => {
    const symbols = new Set<string>();
    for (const row of dashboard?.currentAllocation ?? []) {
      symbols.add(row.symbol);
    }
    for (const symbol of operationPricesBySymbol.keys()) {
      symbols.add(symbol);
    }

    return Array.from(symbols)
      .sort((left, right) => left.localeCompare(right))
      .map((symbol) => {
        const prices = (operationPricesBySymbol.get(symbol) ?? []).map((point) => point.priceEur);
        const returns = computeReturns(prices);
        const volatilityPct = computeStdDev(returns) * Math.sqrt(30) * 100;

        return {
          symbol,
          volatilityPct,
          samples: returns.length,
        };
      });
  }, [dashboard, operationPricesBySymbol]);

  const correlationCells = useMemo(() => {
    const symbols = new Set<string>();
    for (const row of dashboard?.currentAllocation ?? []) {
      symbols.add(row.symbol);
    }
    for (const symbol of operationPricesBySymbol.keys()) {
      symbols.add(symbol);
    }

    const orderedSymbols = Array.from(symbols).sort((left, right) => left.localeCompare(right));

    const returnsBySymbol = new Map<string, number[]>();
    for (const symbol of orderedSymbols) {
      const prices = (operationPricesBySymbol.get(symbol) ?? []).map((point) => point.priceEur);
      returnsBySymbol.set(symbol, computeReturns(prices));
    }

    const matrix: CorrelationCell[] = [];
    for (const rowSymbol of orderedSymbols) {
      for (const colSymbol of orderedSymbols) {
        const value =
          rowSymbol === colSymbol
            ? 1
            : computeCorrelation(
                returnsBySymbol.get(rowSymbol) ?? [],
                returnsBySymbol.get(colSymbol) ?? [],
              );
        matrix.push({
          rowSymbol,
          colSymbol,
          value: Number.isFinite(value) ? value : 0,
        });
      }
    }

    return {
      symbols: orderedSymbols,
      matrix,
    };
  }, [dashboard, operationPricesBySymbol]);

  const eventTimelineData = useMemo(() => {
    return [...(dashboard?.lastOperations ?? [])]
      .sort((left, right) => Date.parse(left.timestamp) - Date.parse(right.timestamp))
      .slice(-12)
      .map((operation) => {
        const isLargeOperation =
          dashboard !== null && operation.amountEur >= dashboard.monthlyBudgetEur * 0.5;
        const eventType = isLargeOperation
          ? t('dashboard.charts.timeline.rebalance')
          : operation.side === 'BUY'
            ? t('dashboard.charts.timeline.buy')
            : t('dashboard.charts.timeline.sell');

        return {
          id: operation.id,
          timestamp: operation.timestamp,
          symbol: operation.symbol,
          eventType,
          amountEur: operation.amountEur,
          status: operation.status,
        };
      })
      .reverse();
  }, [dashboard, t]);

  const monteCarloData = useMemo(() => {
    if (!dashboard || dashboard.equityCurve.length < 3) {
      return [] as MonteCarloPoint[];
    }

    const equityValues = dashboard.equityCurve.map((point) => point.value);
    const returns = computeReturns(equityValues);
    if (returns.length < 2) {
      return [] as MonteCarloPoint[];
    }

    const mean = returns.reduce((sum, value) => sum + value, 0) / returns.length;
    const volatility = computeStdDev(returns);
    const steps = 12;
    const scenarios = 120;
    const lastValue = equityValues[equityValues.length - 1];
    const normal = createNormalGenerator(42);

    const paths = Array.from({ length: scenarios }, () => {
      const points = [lastValue];
      let current = lastValue;
      for (let step = 1; step <= steps; step += 1) {
        const shock = normal();
        const growth = mean + shock * volatility;
        current = Math.max(0, current * (1 + growth));
        points.push(current);
      }
      return points;
    });

    return Array.from({ length: steps + 1 }, (_, step) => {
      const slice = paths.map((path) => path[step]).sort((left, right) => left - right);
      const p10 = slice[Math.floor(slice.length * 0.1)] ?? lastValue;
      const median = slice[Math.floor(slice.length * 0.5)] ?? lastValue;
      const p90 = slice[Math.floor(slice.length * 0.9)] ?? lastValue;

      return {
        label:
          step === 0
            ? t('dashboard.charts.monteCarlo.now')
            : t('dashboard.charts.monteCarlo.month', { month: step }),
        median,
        p10,
        p90,
      };
    });
  }, [dashboard, t]);

  const waterfallData = useMemo(() => {
    if (!dashboard) {
      return [];
    }

    const totalPnlEur = dashboard.realizedPnlEur + dashboard.unrealizedPnlEur;
    const steps = [
      {
        label: t('dashboard.charts.waterfall.initial'),
        targetValue: dashboard.totalInvestedEur,
      },
      {
        label: t('dashboard.charts.waterfall.fees'),
        targetValue: dashboard.totalInvestedEur - dashboard.totalFeesEur,
      },
      {
        label: t('dashboard.charts.waterfall.pnl'),
        targetValue: dashboard.totalInvestedEur - dashboard.totalFeesEur + totalPnlEur,
      },
      {
        label: t('dashboard.charts.waterfall.final'),
        targetValue: dashboard.portfolioValueEur,
      },
    ];

    let previous = 0;
    return steps.map((step) => {
      const lower = Math.min(previous, step.targetValue);
      const rise = step.targetValue > previous ? step.targetValue - previous : 0;
      const fall = step.targetValue < previous ? previous - step.targetValue : 0;
      previous = step.targetValue;

      return {
        label: step.label,
        base: lower,
        rise,
        fall,
        total: step.targetValue,
      };
    });
  }, [dashboard, t]);

  return (
    <Layout
      title={t('page.dashboard.title')}
      subtitle={
        dashboard
          ? t('page.dashboard.subtitle.loaded', {
              strategyName: dashboard.strategyName,
              strategyRiskProfile: dashboard.strategyRiskProfile,
              generatedAt: dashboard.generatedAt,
            })
          : t('page.dashboard.subtitle.loading')
      }
    >
      <section className="panel controls-panel">
        <label className="field">
          <span>{t('dashboard.strategyFilter')}</span>
          <select
            value={selectedStrategyId}
            onChange={(event) => {
              setSelectedStrategyId(event.target.value);
            }}
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
      </section>

      {error ? <section className="panel status">{error}</section> : null}

      {loading || !dashboard ? (
        <section className="panel">{t('dashboard.loading')}</section>
      ) : (
        <>
          <section className="kpis">
            <article className="kpi">
              <span>{t('dashboard.kpi.monthlyBudget')}</span>
              <strong>{formatAmountFromEur(dashboard.monthlyBudgetEur)}</strong>
            </article>
            <article className="kpi">
              <span>{t('dashboard.kpi.totalInvested')}</span>
              <strong>{formatAmountFromEur(dashboard.totalInvestedEur)}</strong>
            </article>
            <article className="kpi">
              <span>{t('dashboard.kpi.portfolioValue')}</span>
              <strong>{formatAmountFromEur(dashboard.portfolioValueEur)}</strong>
            </article>
            <article className="kpi">
              <span>{t('dashboard.kpi.realizedPnl')}</span>
              <strong>{formatAmountFromEur(dashboard.realizedPnlEur)}</strong>
            </article>
            <article className="kpi">
              <span>{t('dashboard.kpi.unrealizedPnl')}</span>
              <strong>{formatAmountFromEur(dashboard.unrealizedPnlEur)}</strong>
            </article>
            <article className="kpi">
              <span>{t('dashboard.kpi.totalFees')}</span>
              <strong>{formatAmountFromEur(dashboard.totalFeesEur)}</strong>
            </article>
            <article className="kpi">
              <span>{t('dashboard.kpi.winRateDrawdown')}</span>
              <strong>
                {dashboard.winRatePct.toFixed(1)}% / {dashboard.maxDrawdownPct.toFixed(1)}%
              </strong>
            </article>
          </section>

          <section className="charts-grid">
            <article className="panel chart-panel">
              <ChartTitleWithHelp
                title={t('dashboard.charts.equity.title')}
                help={t('dashboard.charts.equity.help')}
              />
              <div className="chart-wrap">
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={dashboard.equityCurve}>
                    <CartesianGrid stroke="var(--line)" strokeDasharray="3 3" />
                    <XAxis dataKey="label" stroke="var(--muted)" />
                    <YAxis
                      stroke="var(--muted)"
                      tickFormatter={(value: number) => `${Math.round(value)} €`}
                    />
                    <Tooltip
                      formatter={(value: number) => formatAmountFromEur(value)}
                      labelFormatter={(label) => String(label)}
                      contentStyle={{
                        background: 'var(--panel)',
                        border: '1px solid var(--line)',
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="value"
                      name={t('dashboard.charts.equity.value')}
                      stroke="var(--accent)"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </article>

            <article className="panel chart-panel">
              <ChartTitleWithHelp
                title={t('dashboard.charts.allocation.title')}
                help={t('dashboard.charts.allocation.help')}
              />
              <div className="chart-wrap">
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={dashboard.currentAllocation}
                      dataKey="weightPct"
                      nameKey="symbol"
                      innerRadius={55}
                      outerRadius={90}
                      paddingAngle={2}
                    >
                      {dashboard.currentAllocation.map((entry, index) => (
                        <Cell
                          key={entry.symbol}
                          fill={
                            index % 3 === 0
                              ? 'var(--accent)'
                              : index % 3 === 1
                                ? 'var(--muted)'
                                : 'var(--text)'
                          }
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number | string) => {
                        const numeric = Number(value);
                        if (!Number.isFinite(numeric)) {
                          return ['—', t('dashboard.charts.targetVsActual.actual')];
                        }
                        return [
                          percentage.format(numeric / 100),
                          t('dashboard.charts.targetVsActual.actual'),
                        ];
                      }}
                      labelFormatter={(label) =>
                        t('dashboard.charts.volatility.asset', {
                          symbol: String(label),
                        })
                      }
                      contentStyle={{
                        background: 'var(--panel)',
                        border: '1px solid var(--line)',
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </article>

            <article className="panel chart-panel">
              <ChartTitleWithHelp
                title={t('dashboard.charts.pnl.title')}
                help={t('dashboard.charts.pnl.help')}
              />
              <div className="chart-wrap">
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={pnlCurveData}>
                    <CartesianGrid stroke="var(--line)" strokeDasharray="3 3" />
                    <XAxis dataKey="label" stroke="var(--muted)" />
                    <YAxis
                      stroke="var(--muted)"
                      tickFormatter={(value: number) => `${Math.round(value)} €`}
                    />
                    <Tooltip
                      formatter={(value: number) => formatAmountFromEur(value)}
                      labelFormatter={(label) =>
                        `${String(label)} · ${t('dashboard.charts.pnl.periodHelp')}`
                      }
                      contentStyle={{
                        background: 'var(--panel)',
                        border: '1px solid var(--line)',
                      }}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="realizedPnlEur"
                      name={t('dashboard.charts.pnl.realized')}
                      stackId="1"
                      stroke="var(--accent)"
                      fill="var(--accent)"
                      fillOpacity={0.35}
                    />
                    <Area
                      type="monotone"
                      dataKey="unrealizedPnlEur"
                      name={t('dashboard.charts.pnl.unrealized')}
                      stackId="1"
                      stroke="var(--muted)"
                      fill="var(--muted)"
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </article>

            <article className="panel chart-panel">
              <ChartTitleWithHelp
                title={t('dashboard.charts.riskReturn.title')}
                help={t('dashboard.charts.riskReturn.help')}
              />
              <div className="chart-wrap">
                <ResponsiveContainer width="100%" height={260}>
                  <ScatterChart>
                    <CartesianGrid stroke="var(--line)" strokeDasharray="3 3" />
                    <XAxis
                      type="number"
                      dataKey="drawdown"
                      name={t('dashboard.charts.riskReturn.drawdown')}
                      unit="%"
                      stroke="var(--muted)"
                    />
                    <YAxis
                      type="number"
                      dataKey="return"
                      name={t('dashboard.charts.riskReturn.return')}
                      unit="%"
                      stroke="var(--muted)"
                    />
                    <Tooltip
                      cursor={{ strokeDasharray: '3 3' }}
                      labelFormatter={(_label, payload) => {
                        const strategyName = payload?.[0]?.payload?.strategyName;
                        return strategyName
                          ? String(strategyName)
                          : t('dashboard.charts.riskReturn.strategies');
                      }}
                      formatter={(value: number | string, name: string) => {
                        const numeric = Number(value);
                        const metricLabel = riskReturnMetricLabelByKey[name] ?? name;
                        if (!Number.isFinite(numeric)) {
                          return ['—', metricLabel];
                        }
                        if (name === 'score') {
                          return [numeric.toFixed(1), metricLabel];
                        }
                        return [`${numeric.toFixed(2)}%`, metricLabel];
                      }}
                      contentStyle={{
                        background: 'var(--panel)',
                        border: '1px solid var(--line)',
                      }}
                    />
                    <Scatter
                      name={t('dashboard.charts.riskReturn.strategies')}
                      data={riskReturnData}
                      fill="var(--accent)"
                    />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </article>

            <article className="panel chart-panel chart-panel-wide">
              <ChartTitleWithHelp
                title={t('dashboard.charts.targetVsActual.title')}
                help={t('dashboard.charts.targetVsActual.help')}
              />
              <div className="chart-wrap">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={targetVsActualData}>
                    <CartesianGrid stroke="var(--line)" strokeDasharray="3 3" />
                    <XAxis dataKey="symbol" stroke="var(--muted)" />
                    <YAxis
                      stroke="var(--muted)"
                      tickFormatter={(value: number) => `${value.toFixed(0)}%`}
                    />
                    <Tooltip
                      formatter={(value: number) => `${value.toFixed(2)}%`}
                      contentStyle={{
                        background: 'var(--panel)',
                        border: '1px solid var(--line)',
                      }}
                    />
                    <Legend />
                    <Bar
                      dataKey="targetPct"
                      name={t('dashboard.charts.targetVsActual.target')}
                      fill="var(--muted)"
                    />
                    <Bar
                      dataKey="actualPct"
                      name={t('dashboard.charts.targetVsActual.actual')}
                      fill="var(--accent)"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </article>
          </section>

          <section className="charts-grid">
            <article className="panel chart-panel chart-panel-wide">
              <ChartTitleWithHelp
                title={t('dashboard.charts.correlation.title')}
                help={t('dashboard.charts.correlation.help')}
              />
              {correlationCells.symbols.length <= 1 ? (
                <p>{t('dashboard.charts.correlation.empty')}</p>
              ) : (
                <div className="correlation-heatmap" role="table">
                  <div className="correlation-row correlation-row-head" role="row">
                    <span className="correlation-corner" aria-hidden="true" />
                    {correlationCells.symbols.map((symbol) => (
                      <span key={`head-${symbol}`} className="correlation-head">
                        {symbol}
                      </span>
                    ))}
                  </div>
                  {correlationCells.symbols.map((rowSymbol) => (
                    <div key={`row-${rowSymbol}`} className="correlation-row" role="row">
                      <span className="correlation-head">{rowSymbol}</span>
                      {correlationCells.symbols.map((colSymbol) => {
                        const cell = correlationCells.matrix.find(
                          (item) => item.rowSymbol === rowSymbol && item.colSymbol === colSymbol,
                        );
                        const value = cell?.value ?? 0;
                        const intensity = Math.min(1, Math.abs(value));
                        const mixToken = value >= 0 ? 'var(--accent)' : 'var(--muted)';
                        return (
                          <span
                            key={`${rowSymbol}-${colSymbol}`}
                            className="correlation-cell"
                            style={{
                              background: `color-mix(in srgb, ${mixToken} ${Math.round(
                                20 + intensity * 70,
                              )}%, transparent)`,
                            }}
                            title={`${rowSymbol} / ${colSymbol}: ${value.toFixed(2)}`}
                          >
                            {value.toFixed(2)}
                          </span>
                        );
                      })}
                    </div>
                  ))}
                </div>
              )}
            </article>

            <article className="panel chart-panel">
              <ChartTitleWithHelp
                title={t('dashboard.charts.volatility.title')}
                help={t('dashboard.charts.volatility.help')}
              />
              <div className="chart-wrap">
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={volatilityData}>
                    <CartesianGrid stroke="var(--line)" strokeDasharray="3 3" />
                    <XAxis dataKey="symbol" stroke="var(--muted)" />
                    <YAxis
                      stroke="var(--muted)"
                      tickFormatter={(value: number) => `${value.toFixed(1)}%`}
                    />
                    <Tooltip
                      formatter={(value: number | string, _name: string, item) => {
                        const numeric = Number(value);
                        const samples = Number(item?.payload?.samples ?? 0);
                        if (samples < 2 || !Number.isFinite(numeric)) {
                          return [
                            t('dashboard.charts.volatility.insufficient'),
                            t('dashboard.charts.volatility.value'),
                          ];
                        }
                        return [
                          `${numeric.toFixed(2)}% · ${t('dashboard.charts.tooltip.samples', {
                            count: samples,
                          })}`,
                          t('dashboard.charts.volatility.value'),
                        ];
                      }}
                      labelFormatter={(label) =>
                        t('dashboard.charts.volatility.asset', {
                          symbol: String(label),
                        })
                      }
                      contentStyle={{
                        background: 'var(--panel)',
                        border: '1px solid var(--line)',
                      }}
                    />
                    <Bar
                      dataKey="volatilityPct"
                      name={t('dashboard.charts.volatility.value')}
                      fill="var(--accent)"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </article>

            <article className="panel chart-panel">
              <ChartTitleWithHelp
                title={t('dashboard.charts.timeline.title')}
                help={t('dashboard.charts.timeline.help')}
              />
              <div className="timeline-list" role="list">
                {eventTimelineData.length === 0 ? (
                  <p>{t('dashboard.charts.timeline.empty')}</p>
                ) : (
                  eventTimelineData.map((eventItem) => (
                    <article key={eventItem.id} className="timeline-item" role="listitem">
                      <header>
                        <strong>{eventItem.eventType}</strong>
                        <span>{eventItem.symbol}</span>
                      </header>
                      <p>
                        {eventItem.timestamp} · {formatAmountFromEur(eventItem.amountEur)} ·{' '}
                        {eventItem.status}
                      </p>
                    </article>
                  ))
                )}
              </div>
            </article>

            <article className="panel chart-panel">
              <ChartTitleWithHelp
                title={t('dashboard.charts.monteCarlo.title')}
                help={t('dashboard.charts.monteCarlo.help')}
              />
              {monteCarloData.length === 0 ? (
                <p>{t('dashboard.charts.monteCarlo.empty')}</p>
              ) : (
                <div className="chart-wrap">
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={monteCarloData}>
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
                        type="monotone"
                        dataKey="p10"
                        name={t('dashboard.charts.monteCarlo.p10')}
                        stroke="var(--muted)"
                        dot={false}
                        strokeDasharray="3 4"
                      />
                      <Line
                        type="monotone"
                        dataKey="median"
                        name={t('dashboard.charts.monteCarlo.median')}
                        stroke="var(--accent)"
                        strokeWidth={2}
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="p90"
                        name={t('dashboard.charts.monteCarlo.p90')}
                        stroke="var(--text)"
                        dot={false}
                        strokeDasharray="6 3"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </article>

            <article className="panel chart-panel">
              <ChartTitleWithHelp
                title={t('dashboard.charts.waterfall.title')}
                help={t('dashboard.charts.waterfall.help')}
              />
              <div className="chart-wrap">
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={waterfallData}>
                    <CartesianGrid stroke="var(--line)" strokeDasharray="3 3" />
                    <XAxis dataKey="label" stroke="var(--muted)" />
                    <YAxis
                      stroke="var(--muted)"
                      tickFormatter={(value: number) => `${Math.round(value)} €`}
                    />
                    <Tooltip
                      formatter={(value: number, name: string) => {
                        if (name === 'Total') {
                          return [formatAmountFromEur(value), name];
                        }
                        return [formatAmountFromEur(value), name];
                      }}
                      contentStyle={{
                        background: 'var(--panel)',
                        border: '1px solid var(--line)',
                      }}
                    />
                    <Legend />
                    <Bar dataKey="base" stackId="wf" fill="transparent" name="" />
                    <Bar
                      dataKey="rise"
                      stackId="wf"
                      fill="var(--accent)"
                      name={t('dashboard.charts.waterfall.increase')}
                    />
                    <Bar
                      dataKey="fall"
                      stackId="wf"
                      fill="var(--muted)"
                      name={t('dashboard.charts.waterfall.decrease')}
                    />
                    <Line
                      type="monotone"
                      dataKey="total"
                      name={t('dashboard.charts.waterfall.total')}
                      stroke="var(--text)"
                      dot={{ r: 2 }}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </article>
          </section>

          <section className="panel">
            <h2>{t('dashboard.comparison.title')}</h2>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>{t('dashboard.comparison.strategy')}</th>
                    <th>{t('dashboard.comparison.risk')}</th>
                    <th>{t('dashboard.comparison.estimatedReturn')}</th>
                    <th>{t('dashboard.comparison.estimatedDrawdown')}</th>
                    <th>{t('dashboard.comparison.score')}</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboard.strategyComparison.map((row) => {
                    const isActive = row.strategyId === dashboard.strategyId;
                    return (
                      <tr key={row.strategyId} className={isActive ? 'active-row' : ''}>
                        <td>{row.strategyName}</td>
                        <td>{row.riskProfile}</td>
                        <td>{row.estimatedMonthlyReturnPct.toFixed(2)}%</td>
                        <td>{row.estimatedDrawdownPct.toFixed(2)}%</td>
                        <td>{row.score.toFixed(1)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          <section className="panel">
            <h2>{t('dashboard.operations.title')}</h2>
            <section className="controls-panel">
              <label className="field">
                <span>{t('dashboard.operations.side')}</span>
                <select
                  value={operationSideFilter}
                  onChange={(event) => {
                    setOperationSideFilter(normalizeOperationSideFilter(event.target.value));
                  }}
                >
                  <option value="all">{t('dashboard.operations.side.all')}</option>
                  <option value="buy">{t('dashboard.operations.side.buy')}</option>
                  <option value="sell">{t('dashboard.operations.side.sell')}</option>
                </select>
              </label>
              <label className="field">
                <span>{t('dashboard.operations.outcome')}</span>
                <select
                  value={operationOutcomeFilter}
                  onChange={(event) => {
                    setOperationOutcomeFilter(normalizeOperationOutcomeFilter(event.target.value));
                  }}
                >
                  <option value="successful">{t('dashboard.operations.outcome.successful')}</option>
                  <option value="failed">{t('dashboard.operations.outcome.failed')}</option>
                  <option value="all">{t('dashboard.operations.outcome.all')}</option>
                </select>
              </label>
              <label className="field">
                <span>Rows/page</span>
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
              {t('dashboard.operations.count', {
                count: lastOperations.length,
              })}
              {' · page '}
              {safeOperationsPage}/{operationsPageCount}
            </p>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>{t('dashboard.operations.timestamp')}</th>
                    <th>{t('dashboard.operations.asset')}</th>
                    <th>{t('dashboard.operations.side')}</th>
                    <th>{t('dashboard.operations.amount')}</th>
                    <th>{t('dashboard.operations.price')}</th>
                    <th>{t('dashboard.operations.fee')}</th>
                    <th>{t('dashboard.operations.status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedOperations.map((operation) => {
                    return (
                      <tr
                        key={operation.id}
                        onClick={() => {
                          navigate(
                            `/movements/${encodeURIComponent(operation.id)}?strategyId=${encodeURIComponent(
                              dashboard.strategyId,
                            )}`,
                          );
                        }}
                      >
                        <td>{operation.timestamp}</td>
                        <td>{operation.symbol}</td>
                        <td>{operation.side}</td>
                        <td>{formatAmountFromEur(operation.amountEur)}</td>
                        <td>{formatAmountFromEur(operation.priceEur)}</td>
                        <td>{formatAmountFromEur(operation.feeEur)}</td>
                        <td>{operation.status}</td>
                      </tr>
                    );
                  })}
                  {pagedOperations.length === 0 ? (
                    <tr>
                      <td colSpan={7}>{t('dashboard.operations.empty')}</td>
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
                Previous
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
                Next
              </button>
            </div>
          </section>
        </>
      )}
    </Layout>
  );
}
