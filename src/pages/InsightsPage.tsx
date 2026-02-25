import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { InsightsData, Strategy, getInsights, getStrategies, isUnauthorizedError } from '../api';
import { useI18n } from '../i18n/i18n';
import { Layout } from '../components/Layout';

export function InsightsPage(): JSX.Element {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [selectedStrategyId, setSelectedStrategyId] = useState('');
  const [insights, setInsights] = useState<InsightsData | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    async function loadStrategies(): Promise<void> {
      try {
        const list = await getStrategies();
        if (!active) {
          return;
        }
        setStrategies(list);
        const fromUrl = searchParams.get('strategyId') ?? '';
        setSelectedStrategyId(list.find((item) => item.id === fromUrl)?.id ?? list[0]?.id ?? '');
        setError('');
      } catch (currentError) {
        if (!active) {
          return;
        }
        if (isUnauthorizedError(currentError)) {
          navigate('/login', { replace: true });
          return;
        }
        setError('Unable to load strategies for insights.');
      }
    }
    void loadStrategies();
    return () => {
      active = false;
    };
  }, [navigate, searchParams]);

  useEffect(() => {
    let active = true;
    async function loadInsights(): Promise<void> {
      if (!selectedStrategyId) {
        return;
      }
      try {
        const data = await getInsights(selectedStrategyId);
        if (!active) {
          return;
        }
        setInsights(data);
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
        setError('Unable to load insights.');
      }
    }
    void loadInsights();
    return () => {
      active = false;
    };
  }, [navigate, selectedStrategyId, setSearchParams]);

  return (
    <Layout
      title={t('page.insights.title')}
      subtitle={
        insights
          ? t('page.insights.subtitle.loaded', {
              strategyName: insights.strategyName,
              insightScore: insights.insightScore,
              generatedAt: insights.generatedAt,
            })
          : t('page.insights.subtitle.loading')
      }
    >
      <section className="panel controls-panel">
        <label className="field">
          <span>{t('auto.analyzed_strategy')}</span>
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

      {insights ? (
        <>
          <section className="kpis">
            <article className="kpi">
              <span>{t('auto.market_regime')}</span>
              <strong>{insights.marketRegime}</strong>
            </article>
            <article className="kpi">
              <span>{t('auto.risk')}</span>
              <strong>{insights.riskLevel}</strong>
            </article>
            <article className="kpi">
              <span>{t('auto.confidence')}</span>
              <strong>{insights.confidencePct.toFixed(1)}%</strong>
            </article>
            <article className="kpi">
              <span>{t('auto.30d_volatility')}</span>
              <strong>{insights.metrics.volatility30dPct.toFixed(2)}%</strong>
            </article>
          </section>

          <section className="panel">
            <h2>{t('auto.recommendations')}</h2>
            <ul className="cards-list">
              {insights.recommendations.map((item) => {
                return (
                  <li key={item.id}>
                    <h3>{item.title}</h3>
                    <p>{item.rationale}</p>
                    <p>{item.action}</p>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="panel">
            <h2>{t('auto.alerts')}</h2>
            <ul className="cards-list">
              {insights.alerts.map((alert) => {
                return (
                  <li key={alert.title}>
                    <h3>{alert.title}</h3>
                    <p>{alert.detail}</p>
                  </li>
                );
              })}
            </ul>
          </section>
        </>
      ) : (
        <section className="panel">{t('auto.loading')}</section>
      )}
    </Layout>
  );
}
