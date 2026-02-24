import { ReactElement } from 'react';
import { HistoricalSimulationRunSession } from '../../api';
import { formatAmountFromEur } from '../../currency';

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
  if (!open || !progress) {
    return null;
  }

  const runProgressPct = Math.max(0, Math.min(100, progress.progressPct ?? 0));

  return (
    <div className="simulation-progress-modal-backdrop">
      <section className="panel simulation-progress-modal">
        <h2>
          {progress.status === 'failed'
            ? 'Simulation stopped'
            : 'Simulation running'}
        </h2>
        <p>
          {progress.status === 'failed'
            ? 'Simulation failed. Check the message below.'
            : 'Backtest running. AI metrics update automatically.'}
        </p>
        <div className="simulation-progress-track">
          <div
            className="simulation-progress-fill"
            style={{ width: `${runProgressPct}%` }}
          />
        </div>
        <div className="simulation-progress-meta">
          <span>{runProgressPct.toFixed(1)}%</span>
          <span>
            {integer.format(progress.processedSteps)} /{' '}
            {integer.format(progress.totalSteps)} steps
          </span>
        </div>
        <div className="simulation-progress-kpis">
          <article>
            <span>Executed operations</span>
            <strong>{integer.format(progress.executedOperations)}</strong>
          </article>
          <article>
            <span>Total AI calls</span>
            <strong>{integer.format(progress.aiCalls)}</strong>
          </article>
          <article>
            <span>Successful calls</span>
            <strong>{integer.format(progress.aiCallsSuccessful)}</strong>
          </article>
          <article>
            <span>Failed calls</span>
            <strong>{integer.format(progress.aiCallsFailed)}</strong>
          </article>
          <article>
            <span>Tokens consumed</span>
            <strong>{integer.format(progress.aiTotalTokens)}</strong>
          </article>
          <article>
            <span>Prompt tokens</span>
            <strong>{integer.format(progress.aiPromptTokens)}</strong>
          </article>
          <article>
            <span>Completion tokens</span>
            <strong>{integer.format(progress.aiCompletionTokens)}</strong>
          </article>
          <article>
            <span>Current cost</span>
            <strong>{formatAmountFromEur(progress.aiCostEur)}</strong>
          </article>
        </div>
        <section className="simulation-progress-operations">
          <h3>Last 5 operations</h3>
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
                      <strong>
                        {formatAmountFromEur(operation.amountEur)}
                      </strong>
                      <span>{operation.rationale}</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p>No operations executed yet.</p>
          )}
        </section>
        {progress.status === 'failed' && progress.errorMessage ? (
          <p className="simulation-progress-error">{progress.errorMessage}</p>
        ) : null}
        {progress.status === 'failed' ? (
          <div className="form-actions">
            <button
              className="button button-secondary"
              type="button"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        ) : null}
      </section>
    </div>
  );
}
