import { ReactElement } from 'react';
import type { InvestmentStrategy, StrategyPerformance } from '../types';
import styles from '../StrategiesV2.module.css';

interface SimulationSectionProps {
  strategy: InvestmentStrategy;
  performance: StrategyPerformance | null;
  onRunBacktest: () => void;
  backtestRunning: boolean;
}

export function SimulationSection({
  strategy,
  performance,
  onRunBacktest,
  backtestRunning,
}: SimulationSectionProps): ReactElement {
  return (
    <div className={styles.formGrid}>
      <div className={styles.formFieldWide}>
        <p className={styles.formHint}>
          Run a simple backtest to estimate performance. Results are indicative only — past
          performance does not guarantee future results. AI is never certain.
        </p>
        <button
          type="button"
          className={styles.btnPrimary}
          onClick={onRunBacktest}
          disabled={backtestRunning || !strategy.name.trim()}
          aria-label="Run backtest simulation"
        >
          {backtestRunning ? 'Running...' : 'Run backtest'}
        </button>
      </div>

      {performance && (
        <>
          <div className={styles.formField}>
            <label className={styles.formLabel}>Total return</label>
            <strong>
              {performance.totalReturnPercent >= 0 ? '+' : ''}
              {performance.totalReturnPercent.toFixed(2)}%
            </strong>
          </div>

          <div className={styles.formField}>
            <label className={styles.formLabel}>Monthly return</label>
            <strong>
              {performance.monthlyReturnPercent >= 0 ? '+' : ''}
              {performance.monthlyReturnPercent.toFixed(2)}%
            </strong>
          </div>

          <div className={styles.formField}>
            <label className={styles.formLabel}>Max drawdown</label>
            <strong>{performance.maxDrawdownPercent.toFixed(2)}%</strong>
          </div>

          <div className={styles.formField}>
            <label className={styles.formLabel}>Win rate</label>
            <strong>{(performance.winRate * 100).toFixed(1)}%</strong>
          </div>

          <div className={styles.formField}>
            <label className={styles.formLabel}>Total trades</label>
            <strong>{performance.totalTrades}</strong>
          </div>

          <div className={styles.formField}>
            <label className={styles.formLabel}>AI reliability score</label>
            <strong>{(performance.aiReliabilityScore * 100).toFixed(0)}/100</strong>
          </div>

          {performance.sharpeRatio !== null && (
            <div className={styles.formField}>
              <label className={styles.formLabel}>Sharpe ratio</label>
              <strong>{performance.sharpeRatio.toFixed(2)}</strong>
            </div>
          )}
        </>
      )}
    </div>
  );
}
