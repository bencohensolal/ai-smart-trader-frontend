import { ReactElement } from 'react';
import type { StrategyListItem, RiskLevel } from './types';
import styles from './StrategiesV2.module.css';

interface StrategyListSectionProps {
  strategies: StrategyListItem[];
  loading: boolean;
  onEdit: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleActive: (id: string) => void;
  onCreate: () => void;
}

const RISK_CLASS: Record<RiskLevel, string> = {
  LOW: styles.riskLow,
  MEDIUM: styles.riskMedium,
  HIGH: styles.riskHigh,
  CUSTOM: styles.riskCustom,
};

function formatRoi(roi: number | null): ReactElement {
  if (roi === null) {
    return <span className={styles.roiNa}>N/A</span>;
  }
  const cls = roi >= 0 ? styles.roiPositive : styles.roiNegative;
  return (
    <span className={cls}>
      {roi >= 0 ? '+' : ''}
      {roi.toFixed(1)}%
    </span>
  );
}

export function StrategyListSection({
  strategies,
  loading,
  onEdit,
  onDuplicate,
  onDelete,
  onToggleActive,
  onCreate,
}: StrategyListSectionProps): ReactElement {
  if (loading) {
    return (
      <div className="panel">
        <p>Loading strategies...</p>
      </div>
    );
  }

  if (strategies.length === 0) {
    return (
      <div className={`panel ${styles.emptyState}`}>
        <p>No strategy created yet.</p>
        <button
          className={styles.btnPrimary}
          onClick={onCreate}
          aria-label="Create my first investment strategy"
        >
          Create my first strategy
        </button>
      </div>
    );
  }

  return (
    <div className="panel">
      <table className={styles.strategyTable}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Risk</th>
            <th>Budget / mo</th>
            <th>Exposure</th>
            <th>Status</th>
            <th>Mode</th>
            <th>Simulated ROI</th>
            <th>Max DD</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {strategies.map((s) => (
            <tr key={s.id}>
              <td>
                <strong>{s.name}</strong>
              </td>
              <td>
                <span className={`${styles.riskBadge} ${RISK_CLASS[s.riskLevel]}`}>
                  {s.riskLevel}
                </span>
              </td>
              <td>{s.monthlyBudget.toLocaleString()} €</td>
              <td>{s.maxCapitalExposure.toLocaleString()} €</td>
              <td>
                <span className={s.isActive ? styles.statusActive : styles.statusInactive}>
                  {s.isActive ? '● Active' : '○ Inactive'}
                </span>
              </td>
              <td>
                <span
                  className={`${styles.modeBadge} ${s.mode === 'simulation' ? styles.modeSim : styles.modeLive}`}
                >
                  {s.mode}
                </span>
              </td>
              <td>{formatRoi(s.simulatedRoiPercent)}</td>
              <td>{s.maxDrawdownPercent.toFixed(1)}%</td>
              <td>
                <div className={styles.actionButtons}>
                  <button
                    className={styles.btnIcon}
                    onClick={() => onEdit(s.id)}
                    aria-label={`Edit ${s.name}`}
                    title="Edit"
                  >
                    ✏️
                  </button>
                  <button
                    className={styles.btnIcon}
                    onClick={() => onDuplicate(s.id)}
                    aria-label={`Duplicate ${s.name}`}
                    title="Duplicate"
                  >
                    📋
                  </button>
                  <button
                    className={`${styles.btnToggle} ${s.isActive ? styles.btnToggleActive : ''}`}
                    onClick={() => onToggleActive(s.id)}
                    aria-label={s.isActive ? `Deactivate ${s.name}` : `Activate ${s.name}`}
                    title={s.isActive ? 'Deactivate' : 'Activate'}
                  >
                    {s.isActive ? '⏸' : '▶'}
                  </button>
                  <button
                    className={styles.btnDelete}
                    onClick={() => onDelete(s.id)}
                    aria-label={`Delete ${s.name}`}
                    title="Delete"
                  >
                    🗑
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
