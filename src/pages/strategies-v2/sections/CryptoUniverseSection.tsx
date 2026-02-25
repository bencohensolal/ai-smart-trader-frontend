import { ReactElement } from 'react';
import type { InvestmentStrategy } from '../types';
import { AVAILABLE_ASSETS, BASE_CURRENCIES } from '../defaults';
import styles from '../StrategiesV2.module.css';

interface CryptoUniverseSectionProps {
  strategy: InvestmentStrategy;
  onChange: (patch: Partial<InvestmentStrategy>) => void;
}

export function CryptoUniverseSection({
  strategy,
  onChange,
}: CryptoUniverseSectionProps): ReactElement {
  const toggleAsset = (symbol: string): void => {
    const current = strategy.allowedAssets;
    const next = current.includes(symbol)
      ? current.filter((s) => s !== symbol)
      : [...current, symbol];
    onChange({ allowedAssets: next });
  };

  return (
    <div className={styles.formGrid}>
      <div className={styles.formFieldWide}>
        <label className={styles.formLabel}>Allowed assets *</label>
        <span className={styles.formHint}>Select crypto assets this strategy can trade</span>
        <div className={styles.assetChips}>
          {AVAILABLE_ASSETS.map((symbol) => {
            const selected = strategy.allowedAssets.includes(symbol);
            return (
              <button
                key={symbol}
                type="button"
                className={selected ? styles.assetChipSelected : styles.assetChip}
                onClick={() => toggleAsset(symbol)}
                aria-pressed={selected}
              >
                {symbol}
              </button>
            );
          })}
        </div>
        <span className={styles.formHint}>{strategy.allowedAssets.length} selected</span>
      </div>

      <div className={styles.formField}>
        <label className={styles.formLabel}>Base currency</label>
        <select
          className={styles.formSelect}
          value={strategy.baseCurrency}
          onChange={(e) => onChange({ baseCurrency: e.target.value })}
          aria-label="Base currency"
        >
          {BASE_CURRENCIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.formField}>
        <label className={styles.formLabel}>Max allocation per asset (%)</label>
        <input
          className={styles.formInput}
          type="number"
          min={1}
          max={100}
          value={strategy.maxAssetAllocationPercent}
          onChange={(e) => onChange({ maxAssetAllocationPercent: Number(e.target.value) || 0 })}
          aria-label="Maximum allocation per asset in percent"
        />
        <span className={styles.formHint}>Prevents over-concentration in a single crypto</span>
      </div>
    </div>
  );
}
