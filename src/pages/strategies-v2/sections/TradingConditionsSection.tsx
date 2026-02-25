import { ReactElement } from 'react';
import type { InvestmentStrategy } from '../types';
import styles from '../StrategiesV2.module.css';

interface TradingConditionsSectionProps {
  strategy: InvestmentStrategy;
  onChange: (patch: Partial<InvestmentStrategy>) => void;
}

export function TradingConditionsSection({
  strategy,
  onChange,
}: TradingConditionsSectionProps): ReactElement {
  const num = (field: keyof InvestmentStrategy) => (e: React.ChangeEvent<HTMLInputElement>) =>
    onChange({ [field]: Number(e.target.value) || 0 });

  return (
    <div className={styles.formGrid}>
      {/* ── Buy Conditions ── */}
      <div className={styles.formFieldWide}>
        <strong>Buy conditions</strong>
      </div>

      <div className={styles.formField}>
        <label className={styles.formLabel}>Required confidence to buy (0-1)</label>
        <input
          className={styles.formInput}
          type="number"
          min={0}
          max={1}
          step={0.05}
          value={strategy.requiredConfidenceToBuy}
          onChange={num('requiredConfidenceToBuy')}
          aria-label="Required confidence to buy"
        />
      </div>

      <div className={styles.formField}>
        <label className={styles.formLabel}>Required risk/reward ratio</label>
        <input
          className={styles.formInput}
          type="number"
          min={0.1}
          max={20}
          step={0.1}
          value={strategy.requiredRiskRewardRatio}
          onChange={num('requiredRiskRewardRatio')}
          aria-label="Required risk reward ratio"
        />
        <span className={styles.formHint}>Higher = only take high-reward trades</span>
      </div>

      <div className={styles.formField}>
        <label className={styles.formLabel}>Max position per asset (%)</label>
        <input
          className={styles.formInput}
          type="number"
          min={1}
          max={100}
          value={strategy.maxPositionPerAssetPercent}
          onChange={num('maxPositionPerAssetPercent')}
          aria-label="Max position per asset"
        />
      </div>

      <div className={styles.formField}>
        <label className={styles.formCheckbox}>
          <input
            type="checkbox"
            checked={strategy.allowAveragingDown}
            onChange={(e) => onChange({ allowAveragingDown: e.target.checked })}
          />
          Allow averaging down
        </label>
        <span className={styles.formHint}>Buy more of a losing position to lower avg price</span>
      </div>

      {/* ── Sell Conditions ── */}
      <div className={styles.formFieldWide}>
        <strong>Sell conditions</strong>
      </div>

      <div className={styles.formField}>
        <label className={styles.formLabel}>Take profit (%)</label>
        <input
          className={styles.formInput}
          type="number"
          min={0.1}
          max={1000}
          step={0.5}
          value={strategy.takeProfitPercent}
          onChange={num('takeProfitPercent')}
          aria-label="Take profit percent"
        />
      </div>

      <div className={styles.formField}>
        <label className={styles.formLabel}>Stop-loss (%)</label>
        <input
          className={styles.formInput}
          type="number"
          min={0.1}
          max={100}
          step={0.5}
          value={strategy.stopLossPercent}
          onChange={num('stopLossPercent')}
          aria-label="Stop-loss percent"
        />
      </div>

      <div className={styles.formField}>
        <label className={styles.formLabel}>Trailing stop (%)</label>
        <input
          className={styles.formInput}
          type="number"
          min={0}
          max={100}
          step={0.5}
          value={strategy.trailingStopPercent}
          onChange={num('trailingStopPercent')}
          aria-label="Trailing stop percent"
        />
        <span className={styles.formHint}>0 = disabled</span>
      </div>

      <div className={styles.formField}>
        <label className={styles.formLabel}>Force sell after (days)</label>
        <input
          className={styles.formInput}
          type="number"
          min={0}
          max={365}
          value={strategy.forceSellAfterDays}
          onChange={num('forceSellAfterDays')}
          aria-label="Force sell after days"
        />
        <span className={styles.formHint}>0 = no forced sell</span>
      </div>

      <div className={styles.formField}>
        <label className={styles.formLabel}>Sell if confidence drops below</label>
        <input
          className={styles.formInput}
          type="number"
          min={0}
          max={1}
          step={0.05}
          value={strategy.sellIfConfidenceDropsBelow}
          onChange={num('sellIfConfidenceDropsBelow')}
          aria-label="Sell if confidence drops below"
        />
      </div>
    </div>
  );
}
