import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  HistoricalSimulationOperationDetails,
  getHistoricalSimulationOperation,
  isUnauthorizedError,
} from '../api';
import { LineChart } from '../components/LineChart';
import { useI18n } from '../i18n/i18n';
import { Layout } from '../components/Layout';
import { formatAmountFromEur } from '../currency';
import {
  buildOperationFiltersQueryString,
  normalizeOperationOutcomeFilter,
  normalizeOperationSideFilter,
} from './operationFilters';

export function SimulationOperationPage(): JSX.Element {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { simulationId = '', operationId = '' } = useParams();
  const [searchParams] = useSearchParams();
  const operationSideFilter = normalizeOperationSideFilter(searchParams.get('side'));
  const operationOutcomeFilter = normalizeOperationOutcomeFilter(searchParams.get('outcome'));
  const [details, setDetails] = useState<HistoricalSimulationOperationDetails | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    async function loadDetails(): Promise<void> {
      try {
        const payload = await getHistoricalSimulationOperation(simulationId, operationId, {
          side: operationSideFilter,
          outcome: operationOutcomeFilter,
        });
        if (!active) {
          return;
        }
        setDetails(payload);
        setError('');
      } catch (currentError) {
        if (!active) {
          return;
        }
        if (isUnauthorizedError(currentError)) {
          navigate('/login', { replace: true });
          return;
        }
        setError('Unable to load operation details.');
      }
    }
    void loadDetails();
    return () => {
      active = false;
    };
  }, [navigate, operationId, operationOutcomeFilter, operationSideFilter, simulationId]);

  const summaryLabel = useMemo(() => {
    if (!details) {
      return t('settings.loading');
    }
    const operation = details.operation;
    return (
      details.operationDate +
      ' | ' +
      operation.side +
      ' ' +
      operation.symbol +
      ' | ' +
      operation.status
    );
  }, [details, t]);

  const operationFiltersQuery = buildOperationFiltersQueryString({
    side: operationSideFilter,
    outcome: operationOutcomeFilter,
  });
  const parentSimulationUrl = useMemo(() => {
    return '/simulations/' + encodeURIComponent(simulationId) + '?' + operationFiltersQuery;
  }, [operationFiltersQuery, simulationId]);

  const previousOperationId = details?.navigation.previousOperationId ?? null;
  const nextOperationId = details?.navigation.nextOperationId ?? null;

  return (
    <Layout title={t('page.simulationOperation.title')} subtitle={summaryLabel}>
      <section className="panel form-actions">
        <button
          className="button button-secondary"
          type="button"
          onClick={() => {
            navigate(parentSimulationUrl);
          }}
        >
          Back to parent simulation
        </button>
        <button
          className="button button-secondary"
          type="button"
          disabled={!previousOperationId}
          onClick={() => {
            if (!previousOperationId) {
              return;
            }
            navigate(
              '/simulations/' +
                encodeURIComponent(simulationId) +
                '/operations/' +
                encodeURIComponent(previousOperationId) +
                '?' +
                operationFiltersQuery,
            );
          }}
        >
          Previous operation
        </button>
        <button
          className="button button-secondary"
          type="button"
          disabled={!nextOperationId}
          onClick={() => {
            if (!nextOperationId) {
              return;
            }
            navigate(
              '/simulations/' +
                encodeURIComponent(simulationId) +
                '/operations/' +
                encodeURIComponent(nextOperationId) +
                '?' +
                operationFiltersQuery,
            );
          }}
        >
          Next operation
        </button>
      </section>

      {error ? <section className="panel status status-error">{error}</section> : null}

      {!details ? (
        <section className="panel">Loading...</section>
      ) : (
        <>
          <section className="kpis">
            <article className="kpi">
              <span>Spot price at time T</span>
              <strong>{formatAmountFromEur(details.valuationAtOperation.spotPriceEur)}</strong>
            </article>
            <article className="kpi">
              <span>Portfolio value</span>
              <strong>{formatAmountFromEur(details.valuationAtOperation.portfolioValueEur)}</strong>
            </article>
            <article className="kpi">
              <span>Available cash</span>
              <strong>{formatAmountFromEur(details.valuationAtOperation.cashEur)}</strong>
            </article>
            <article className="kpi">
              <span>Cumulative invested</span>
              <strong>{formatAmountFromEur(details.valuationAtOperation.investedEur)}</strong>
            </article>
            <article className="kpi">
              <span>Position before order</span>
              <strong>
                {details.valuationAtOperation.symbolQuantityBefore.toFixed(6)}{' '}
                {details.operation.symbol}
              </strong>
            </article>
            <article className="kpi">
              <span>Asset weight before order</span>
              <strong>{details.valuationAtOperation.symbolWeightBeforePct.toFixed(2)}%</strong>
            </article>
          </section>

          <section className="movement-grid">
            <article className="panel">
              <h2>Execution</h2>
              <p>
                Amount: {formatAmountFromEur(details.operation.amountEur)} | Price:{' '}
                {formatAmountFromEur(details.operation.priceEur)}
              </p>
              <p>
                Fees: {formatAmountFromEur(details.operation.feeEur)} (
                {details.operation.feeRatePct.toFixed(2)}%) | Net:{' '}
                {formatAmountFromEur(details.operation.netAmountEur)}
              </p>
              <p>
                ID: {details.operation.id} | Index: #{details.operationIndex + 1} /{' '}
                {details.navigation.totalOperations}
              </p>
            </article>

            <article className="panel">
              <h2>Decision rationale</h2>
              <p>{details.decision.summary}</p>
              <p>{details.decision.rationale}</p>
              <p>{details.decision.riskContext}</p>
              <p>{details.decision.objectiveContribution}</p>
            </article>

            <article className="panel">
              <h2>Financial impact</h2>
              {details.operation.side === 'SELL' ? (
                <>
                  <p>Realized gain: {formatNullableCurrency(details.pnl.realizedGainEur)}</p>
                  <p>Realized return: {formatNullablePercent(details.pnl.realizedGainPct)}</p>
                  <p>Average cost basis: {formatNullableCurrency(details.pnl.breakEvenPriceEur)}</p>
                </>
              ) : (
                <>
                  <p>Expected gain: {formatNullableCurrency(details.pnl.expectedGainEur)}</p>
                  <p>Expected gain (%): {formatNullablePercent(details.pnl.expectedGainPct)}</p>
                  <p>
                    Break-even price (including fees):{' '}
                    {formatNullableCurrency(details.pnl.breakEvenPriceEur)}
                  </p>
                </>
              )}
            </article>
          </section>

          <section className="chart-grid">
            <LineChart
              title="Portfolio curve up to this operation"
              subtitle="Total value (cash + positions)"
              points={details.charts.portfolioCurveToOperation.map((point) => {
                return {
                  label: point.date,
                  value: point.portfolioValueEur,
                };
              })}
              valueFormatter={(value) => formatAmountFromEur(value)}
            />
            <LineChart
              title={`${details.operation.symbol} curve up to this operation`}
              subtitle="Historical spot price known at that time"
              stroke="#54a6ff"
              points={details.charts.symbolPriceCurveToOperation.map((point) => {
                return {
                  label: point.date,
                  value: point.priceEur,
                };
              })}
              valueFormatter={(value) => formatAmountFromEur(value)}
            />
          </section>
        </>
      )}
    </Layout>
  );
}

function formatNullableCurrency(value: number | null): string {
  if (value === null) {
    return 'N/A';
  }
  return formatAmountFromEur(value);
}

function formatNullablePercent(value: number | null): string {
  if (value === null) {
    return 'N/A';
  }
  return value.toFixed(2) + '%';
}
