import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { MovementDetails, getMovement, isUnauthorizedError } from '../api';
import { useI18n } from '../i18n/i18n';
import { Layout } from '../components/Layout';
import { formatAmountFromEur } from '../currency';

export function MovementPage(): JSX.Element {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { movementId = '' } = useParams();
  const [searchParams] = useSearchParams();
  const [movement, setMovement] = useState<MovementDetails | null>(null);
  const [error, setError] = useState('');
  const strategyId = searchParams.get('strategyId') ?? '';

  useEffect(() => {
    let active = true;
    async function loadMovement(): Promise<void> {
      try {
        const data = await getMovement(movementId, strategyId);
        if (!active) {
          return;
        }
        setMovement(data);
        setError('');
      } catch (currentError) {
        if (!active) {
          return;
        }
        if (isUnauthorizedError(currentError)) {
          navigate('/login', { replace: true });
          return;
        }
        setError('Unable to load the requested movement.');
      }
    }
    void loadMovement();
    return () => {
      active = false;
    };
  }, [movementId, navigate, strategyId]);

  return (
    <Layout
      title={t('page.movement.title')}
      subtitle={
        movement
          ? `${movement.id} | ${movement.timestamp}`
          : t('settings.loading')
      }
    >
      {error ? <section className="panel status">{error}</section> : null}
      {movement ? (
        <section className="panel movement-grid">
          <article>
            <h2>Execution</h2>
            <p>
              {movement.side} {movement.symbol} |{' '}
              {formatAmountFromEur(movement.amountEur)} |{' '}
              {formatAmountFromEur(movement.priceEur)} | {movement.status}
            </p>
            <p>
              Fees: {formatAmountFromEur(movement.feeEur)} (
              {movement.feeRatePct.toFixed(2)}%) | Net:{' '}
              {formatAmountFromEur(movement.netAmountEur)} | Market source:{' '}
              {movement.marketSource}
            </p>
          </article>
          <article>
            <h2>Decision</h2>
            <p>{movement.decisionSummary}</p>
          </article>
          <article>
            <h2>Expected gain</h2>
            <p>{movement.expectedGainPct.toFixed(2)}%</p>
            <p>{movement.expectedGainScenario}</p>
          </article>
          <article>
            <h2>AI recommendation</h2>
            <p>
              {movement.aiRecommendationAction} | Confidence:{' '}
              {movement.aiRecommendationConfidencePct.toFixed(1)}% | Source:{' '}
              {movement.aiRecommendationSource}
            </p>
            <p>{movement.aiRecommendationRationale}</p>
          </article>
          <article>
            <h2>Risk</h2>
            <p>{movement.riskLevel}</p>
            <p>{movement.riskScenario}</p>
          </article>
          <article>
            <h2>Goal contribution</h2>
            <p>{movement.objectiveContribution}</p>
            <p>{movement.extraInfo}</p>
          </article>
        </section>
      ) : (
        <section className="panel">{t('settings.loading')}</section>
      )}
    </Layout>
  );
}
