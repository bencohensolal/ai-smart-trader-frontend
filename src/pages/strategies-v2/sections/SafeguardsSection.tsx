import { ReactElement } from 'react';
import type { InvestmentStrategy } from '../types';
import styles from '../StrategiesV2.module.css';

interface SafeguardsSectionProps {
  strategy: InvestmentStrategy;
  onChange: (patch: Partial<InvestmentStrategy>) => void;
}

export function SafeguardsSection({ strategy, onChange }: SafeguardsSectionProps): ReactElement {
  const num = (field: keyof InvestmentStrategy) => (e: React.ChangeEvent<HTMLInputElement>) =>
    onChange({ [field]: Number(e.target.value) || 0 });

  return (
    <div className={styles.formGrid}>
      <div className={styles.formField}>
        <label className={styles.formLabel}>Max daily trades</label>
        <input
          className={styles.formInput}
          type="number"
          min={1}
          max={100}
          value={strategy.maxDailyTrades}
          onChange={num('maxDailyTrades')}
          aria-label="Max daily trades"
        />
      </div>

      <div className={styles.formField}>
        <label className={styles.formLabel}>Max weekly trades</label>
        <input
          className={styles.formInput}
          type="number"
          min={1}
          max={500}
          value={strategy.maxWeeklyTrades}
          onChange={num('maxWeeklyTrades')}
          aria-label="Max weekly trades"
        />
      </div>

      <div className={styles.formField}>
        <label className={styles.formLabel}>Max drawdown (%)</label>
        <input
          className={styles.formInput}
          type="number"
          min={1}
          max={100}
          step={1}
          value={strategy.maxDrawdownPercent}
          onChange={num('maxDrawdownPercent')}
          aria-label="Max drawdown percent"
        />
        <span className={styles.formHint}>Strategy pauses if drawdown exceeds this</span>
      </div>

      <div className={styles.formField}>
        <label className={styles.formLabel}>Emergency stop-loss (%)</label>
        <input
          className={styles.formInput}
          type="number"
          min={1}
          max={100}
          step={1}
          value={strategy.emergencyStopLossPercent}
          onChange={num('emergencyStopLossPercent')}
          aria-label="Emergency stop-loss"
        />
        <span className={styles.formHint}>Triggers full liquidation — last resort protection</span>
      </div>

      <div className={styles.formField}>
        <label className={styles.formLabel}>Slippage tolerance (%)</label>
        <input
          className={styles.formInput}
          type="number"
          min={0}
          max={10}
          step={0.1}
          value={strategy.slippageTolerancePercent}
          onChange={num('slippageTolerancePercent')}
          aria-label="Slippage tolerance"
        />
      </div>

      <div className={styles.formField}>
        <label className={styles.formLabel}>Max fees / month (%)</label>
        <input
          className={styles.formInput}
          type="number"
          min={0}
          max={50}
          step={0.5}
          value={strategy.maxFeesPercentPerMonth}
          onChange={num('maxFeesPercentPerMonth')}
          aria-label="Max fees per month"
        />
        <span className={styles.formHint}>Block trades if monthly fee budget is exhausted</span>
      </div>
    </div>
  );
}
