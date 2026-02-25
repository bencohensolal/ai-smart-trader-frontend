import { ReactElement } from 'react';
import type { InvestmentStrategy, RiskLevel, StrategyMode } from '../types';
import styles from '../StrategiesV2.module.css';

interface GeneralInfoSectionProps {
  strategy: InvestmentStrategy;
  onChange: (patch: Partial<InvestmentStrategy>) => void;
}

const RISK_LEVELS: { value: RiskLevel; label: string; desc: string }[] = [
  { value: 'LOW', label: 'Low', desc: 'Conservative, capital preservation first' },
  { value: 'MEDIUM', label: 'Medium', desc: 'Balanced growth with moderate risk' },
  { value: 'HIGH', label: 'High', desc: 'Aggressive, maximizing returns' },
  { value: 'CUSTOM', label: 'Custom', desc: 'Fine-tuned parameters' },
];

const MODES: { value: StrategyMode; label: string }[] = [
  { value: 'simulation', label: 'Simulation (paper trading)' },
  { value: 'live', label: 'Live (real trades)' },
];

export function GeneralInfoSection({ strategy, onChange }: GeneralInfoSectionProps): ReactElement {
  return (
    <div className={styles.formGrid}>
      <div className={styles.formField}>
        <label className={styles.formLabel}>Strategy name *</label>
        <input
          className={styles.formInput}
          type="text"
          value={strategy.name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="e.g. Conservative BTC/ETH"
          maxLength={100}
          required
          aria-label="Strategy name"
        />
      </div>

      <div className={styles.formField}>
        <label className={styles.formLabel}>Risk level</label>
        <select
          className={styles.formSelect}
          value={strategy.riskLevel}
          onChange={(e) => onChange({ riskLevel: e.target.value as RiskLevel })}
          aria-label="Risk level"
        >
          {RISK_LEVELS.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label} — {r.desc}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.formField}>
        <label className={styles.formLabel}>Mode</label>
        <select
          className={styles.formSelect}
          value={strategy.mode}
          onChange={(e) => onChange({ mode: e.target.value as StrategyMode })}
          aria-label="Operating mode"
        >
          {MODES.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
        <span className={styles.formHint}>
          Start in simulation mode. Switch to live only when confident.
        </span>
      </div>

      <div className={styles.formFieldWide}>
        <label className={styles.formLabel}>Description</label>
        <textarea
          className={styles.formTextarea}
          value={strategy.description}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="Describe your strategy goals and approach..."
          maxLength={500}
          rows={3}
          aria-label="Strategy description"
        />
      </div>
    </div>
  );
}
