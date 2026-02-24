import { ReactElement } from 'react';
import { AdvancedBacktestingRunProgress, AdvancedBacktestingRunScope } from '../../api';

type AdvancedRunProgressModalProps = {
  open: boolean;
  scope: AdvancedBacktestingRunScope;
  labels: string[];
  progress: AdvancedBacktestingRunProgress | null;
  selectedIndex: number;
  liveAiRequested: boolean;
  onSelectedIndexChange: (index: number) => void;
  onClose: () => void;
};

const integer = new Intl.NumberFormat('fr-FR');

export function AdvancedRunProgressModal({
  open,
  scope,
  labels,
  progress,
  selectedIndex,
  liveAiRequested,
  onSelectedIndexChange,
  onClose,
}: AdvancedRunProgressModalProps): ReactElement | null {
  if (!open || labels.length === 0) {
    return null;
  }

  const progressPct = Math.max(0, Math.min(100, progress?.progressPct ?? 0));
  const tabCount = Math.max(labels.length, 1);
  const activeIndex = Math.min(tabCount - 1, Math.max(0, (progress?.processedItems ?? 1) - 1));
  const completedCount =
    progress?.status === 'completed' ? tabCount : Math.min(progress?.processedItems ?? 0, tabCount);
  const selectedSafeIndex = Math.min(Math.max(selectedIndex, 0), tabCount - 1);
  const isRunning = progress?.status === 'pending' || progress?.status === 'running';

  const statusText =
    progress?.status === 'failed'
      ? 'Failed'
      : selectedSafeIndex < completedCount
        ? 'Completed'
        : selectedSafeIndex === activeIndex && progressPct < 100
          ? 'Running'
          : progressPct >= 100
            ? 'Completed'
            : 'Pending';

  return (
    <div className="simulation-progress-modal-backdrop">
      <section className="panel simulation-progress-modal">
        <h2>
          {scope === 'strategy'
            ? 'Parallel simulations in progress'
            : 'Multi-period simulation in progress'}
        </h2>
        <p>
          {scope === 'strategy' ? 'One tab per selected strategy.' : 'One tab per selected period.'}
        </p>
        <div className="simulation-progress-track">
          <div className="simulation-progress-fill" style={{ width: `${progressPct}%` }} />
        </div>
        <div className="simulation-progress-meta">
          <span>{progressPct.toFixed(1)}%</span>
          <span>
            {integer.format(Math.max(progress?.processedItems ?? 0, 0))} /{' '}
            {integer.format(tabCount)}
          </span>
        </div>
        <section className="simulation-progress-tabs" aria-label="Progress tabs">
          {labels.map((label, index) => {
            const isCompleted = index < completedCount;
            const isActive = !isCompleted && index === activeIndex && progressPct < 100;
            const isSelected = index === selectedSafeIndex;
            const stateClass = isCompleted ? 'is-completed' : isActive ? 'is-active' : 'is-pending';
            return (
              <button
                key={`advanced-progress-tab-${index}-${label}`}
                className={`simulation-progress-tab ${stateClass} ${isSelected ? 'is-selected' : ''}`}
                type="button"
                onClick={() => {
                  onSelectedIndexChange(index);
                }}
                title={label}
              >
                <span>
                  {scope === 'strategy' ? `Strategy ${index + 1}` : `Period ${index + 1}`}
                </span>
                <strong>{label}</strong>
              </button>
            );
          })}
        </section>
        <article className="simulation-progress-tab-detail">
          <h3>
            {scope === 'strategy'
              ? `Strategy ${selectedSafeIndex + 1}`
              : `Period ${selectedSafeIndex + 1}`}
          </h3>
          <p>{labels[selectedSafeIndex]}</p>
          <p>Status: {statusText}</p>
          {liveAiRequested ? (
            <p>
              Live AI calls:{' '}
              <strong>{integer.format(progress?.aiCallsByLabel[selectedSafeIndex] ?? 0)}</strong>
            </p>
          ) : (
            <p>Live AI was not requested for this run.</p>
          )}
        </article>
        <div className="form-actions">
          <button
            className="button button-secondary"
            type="button"
            onClick={onClose}
            disabled={isRunning}
          >
            {isRunning ? 'Simulation running...' : 'Close'}
          </button>
        </div>
      </section>
    </div>
  );
}
