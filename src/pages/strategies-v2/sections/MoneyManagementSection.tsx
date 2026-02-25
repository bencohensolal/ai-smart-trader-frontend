import { ReactElement } from 'react';
import type { InvestmentStrategy } from '../types';
import styles from '../StrategiesV2.module.css';

interface MoneyManagementSectionProps {
  strategy: InvestmentStrategy;
  onChange: (patch: Partial<InvestmentStrategy>) => void;
}

export function MoneyManagementSection({
  strategy,
  onChange,
}: MoneyManagementSectionProps): ReactElement {
  const num = (field: keyof InvestmentStrategy) => (e: React.ChangeEvent<HTMLInputElement>) =>
    onChange({ [field]: Number(e.target.value) || 0 });

  return (
    <div className={styles.formGrid}>
      <div className={styles.formField}>
        <label className={styles.formLabel}>Monthly budget (EUR)</label>
        <input
          className={styles.formInput}
          type="number"
          min={10}
          step={10}
          value={strategy.monthlyBudget}
          onChange={num('monthlyBudget')}
          aria-label="Monthly budget"
        />
        <span className={styles.formHint}>Maximum amount invested per month</span>
      </div>

      <div className={styles.formField}>
        <label className={styles.formLabel}>Max capital exposure (EUR)</label>
        <input
          className={styles.formInput}
          type="number"
          min={10}
          step={100}
          value={strategy.maxCapitalExposure}
          onChange={num('maxCapitalExposure')}
          aria-label="Max capital exposure"
        />
        <span className={styles.formHint}>Total portfolio value ceiling</span>
      </div>

      <div className={styles.formField}>
        <label className={styles.formLabel}>Max single trade (EUR)</label>
        <input
          className={styles.formInput}
          type="number"
          min={1}
          step={10}
          value={strategy.maxSingleTradeAmount}
          onChange={num('maxSingleTradeAmount')}
          aria-label="Max single trade amount"
        />
      </div>

      <div className={styles.formField}>
        <label className={styles.formLabel}>Min cash reserve (%)</label>
        <input
          className={styles.formInput}
          type="number"
          min={0}
          max={100}
          step={5}
          value={strategy.minCashReservePercent}
          onChange={num('minCashReservePercent')}
          aria-label="Minimum cash reserve percent"
        />
        <span className={styles.formHint}>Always keep this % of portfolio in cash</span>
      </div>
    </div>
  );
}
