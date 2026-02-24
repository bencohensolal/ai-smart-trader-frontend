import { ReactElement } from 'react';
import { DashboardData } from '../../api';
import { formatAmountFromEur } from '../../currency';
import { useI18n } from '../../i18n/i18n';

type ContinuousSimulationSectionProps = {
  enabled: boolean;
  intervalMs: number;
  snapshot: DashboardData | null;
  loading: boolean;
  error: string;
  updatedAt: string;
  onEnabledChange: (enabled: boolean) => void;
  onIntervalChange: (intervalMs: number) => void;
};

export function ContinuousSimulationSection({
  enabled,
  intervalMs,
  snapshot,
  loading,
  error,
  updatedAt,
  onEnabledChange,
  onIntervalChange,
}: ContinuousSimulationSectionProps): ReactElement {
  const { t } = useI18n();

  return (
    <section className="panel">
      <h2>{t('simulations.continuous.title')}</h2>
      <p>{t('simulations.continuous.subtitle')}</p>
      <section className="controls-panel">
        <div className="field checkbox-field">
          <span>{t('simulations.continuous.toggle')}</span>
          <div
            className={`toggle-btn${enabled ? ' selected' : ''}`}
            tabIndex={0}
            role="button"
            aria-pressed={enabled}
            onClick={() => onEnabledChange(!enabled)}
            onKeyDown={(e) => {
              if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                onEnabledChange(!enabled);
              }
            }}
          >
            {enabled
              ? t('simulations.continuous.enabled')
              : t('simulations.continuous.disabled')}
          </div>
        </div>
        <label className="field">
          <span>{t('simulations.continuous.interval')}</span>
          <select
            value={String(intervalMs)}
            onChange={(event) => {
              onIntervalChange(Number(event.target.value));
            }}
            disabled={!enabled}
          >
            <option value="10000">10s</option>
            <option value="15000">15s</option>
            <option value="30000">30s</option>
            <option value="60000">60s</option>
          </select>
        </label>
      </section>

      {enabled && loading && !snapshot ? (
        <p>{t('simulations.continuous.loading')}</p>
      ) : null}
      {enabled && error ? <p className="status-error">{error}</p> : null}

      {enabled && snapshot ? (
        <>
          <p>
            {t('simulations.continuous.updatedAt', {
              updatedAt: new Date(updatedAt).toLocaleTimeString(),
            })}
          </p>
          <section className="kpis">
            <article className="kpi">
              <span>{t('simulations.continuous.kpi.portfolio')}</span>
              <strong>{formatAmountFromEur(snapshot.portfolioValueEur)}</strong>
            </article>
            <article className="kpi">
              <span>{t('simulations.continuous.kpi.invested')}</span>
              <strong>{formatAmountFromEur(snapshot.totalInvestedEur)}</strong>
            </article>
            <article className="kpi">
              <span>{t('simulations.continuous.kpi.unrealized')}</span>
              <strong>{formatAmountFromEur(snapshot.unrealizedPnlEur)}</strong>
            </article>
            <article className="kpi">
              <span>{t('simulations.continuous.kpi.operations')}</span>
              <strong>{snapshot.lastOperations.length}</strong>
            </article>
          </section>

          <h3>{t('simulations.continuous.operations')}</h3>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>{t('dashboard.operations.timestamp')}</th>
                  <th>{t('dashboard.operations.asset')}</th>
                  <th>{t('dashboard.operations.side')}</th>
                  <th>{t('dashboard.operations.amount')}</th>
                  <th>{t('dashboard.operations.price')}</th>
                  <th>{t('dashboard.operations.status')}</th>
                </tr>
              </thead>
              <tbody>
                {snapshot.lastOperations.slice(0, 10).map((operation) => (
                  <tr key={operation.id}>
                    <td>{operation.timestamp}</td>
                    <td>{operation.symbol}</td>
                    <td>{operation.side}</td>
                    <td>{formatAmountFromEur(operation.amountEur)}</td>
                    <td>{formatAmountFromEur(operation.priceEur)}</td>
                    <td>{operation.status}</td>
                  </tr>
                ))}
                {snapshot.lastOperations.length === 0 ? (
                  <tr>
                    <td colSpan={6}>{t('simulations.continuous.empty')}</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </>
      ) : null}
    </section>
  );
}
