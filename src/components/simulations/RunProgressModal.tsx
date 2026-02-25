import { ReactElement } from 'react';
import { HistoricalSimulationRunSession } from '../../api';
import { formatAmountFromEur } from '../../currency';
import { useI18n } from '../../i18n/i18n';

const integer = new Intl.NumberFormat('fr-FR');

type RunProgressModalProps = {
  open: boolean;
  progress: HistoricalSimulationRunSession['progress'] | null;
  onClose: () => void;
};

export function RunProgressModal({
  open,
  progress,
  onClose,
}: RunProgressModalProps): ReactElement | null {
  const { t } = useI18n();
  if (!open || !progress) {
    return null;
  }

  const runProgressPct = Math.max(0, Math.min(100, progress.progressPct ?? 0));

  return (
    <div className="simulation-progress-modal-backdrop">
      <section className="panel simulation-progress-modal">
        <h2>
          {progress.status === 'failed'
            ? t('runProgressModal.stopped')
            : t('runProgressModal.running')}
        </h2>
        <p>
          {progress.status === 'failed'
            ? t('runProgressModal.failedMessage')
            : t('runProgressModal.runningMessage')}
        </p>
        <div className="simulation-progress-track">
          <div className="simulation-progress-fill" style={{ width: `${runProgressPct}%` }} />
        </div>
        <div className="simulation-progress-meta">
          <span>{runProgressPct.toFixed(1)}%</span>
          <span>
            {integer.format(progress.processedSteps)} / {integer.format(progress.totalSteps)} steps
          </span>
        </div>
        <div className="simulation-progress-kpis">
          <article>
            <span>{t('auto.executed_operations')}</span>
            <strong>{integer.format(progress.executedOperations)}</strong>
          </article>
          <article>
            <span>{t('auto.total_ai_calls')}</span>
            <strong>{integer.format(progress.aiCalls)}</strong>
          </article>
          <article>
            <span>{t('auto.successful_calls')}</span>
            <strong>{integer.format(progress.aiCallsSuccessful)}</strong>
          </article>
          <article>
            <span>{t('auto.failed_calls')}</span>
            <strong>{integer.format(progress.aiCallsFailed)}</strong>
          </article>
          <article>
            <span>{t('auto.tokens_consumed')}</span>
            <strong>{integer.format(progress.aiTotalTokens)}</strong>
          </article>
          <article>
            <span>{t('auto.prompt_tokens')}</span>
            <strong>{integer.format(progress.aiPromptTokens)}</strong>
          </article>
          <article>
            <span>{t('auto.completion_tokens')}</span>
            <strong>{integer.format(progress.aiCompletionTokens)}</strong>
          </article>
          <article>
            <span>{t('auto.current_cost')}</span>
            <strong>{formatAmountFromEur(progress.aiCostEur)}</strong>
          </article>
        </div>
        <section className="simulation-progress-operations">
          <h3>{t('auto.last_5_operations')}</h3>
          {progress.lastOperations.length > 0 ? (
            <ul>
              {progress.lastOperations.map((operation) => {
                return (
                  <li key={operation.id}>
                    <div>
                      <strong>
                        {operation.side} {operation.symbol}
                      </strong>
                      <span>
                        {operation.timestamp} · {operation.status}
                      </span>
                    </div>
                    <div>
                      <strong>{formatAmountFromEur(operation.amountEur)}</strong>
                      <span>{operation.rationale}</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p>{t('auto.no_operations_executed_yet')}</p>
          )}
        </section>
        {progress.status === 'failed' && progress.errorMessage ? (
          <p className="simulation-progress-error">{progress.errorMessage}</p>
        ) : null}
        {progress.status === 'failed' ? (
          <div className="form-actions">
            <button className="button button-secondary" type="button" onClick={onClose}>
              {t('auto.close')}
            </button>
          </div>
        ) : null}
      </section>
    </div>
  );
}
