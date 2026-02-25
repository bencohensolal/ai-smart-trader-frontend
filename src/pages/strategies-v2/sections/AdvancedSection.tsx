import { ReactElement, useState } from 'react';
import type { InvestmentStrategy } from '../types';
import { AVAILABLE_ASSETS } from '../defaults';
import styles from '../StrategiesV2.module.css';

interface AdvancedSectionProps {
  strategy: InvestmentStrategy;
  onChange: (patch: Partial<InvestmentStrategy>) => void;
}

export function AdvancedSection({ strategy, onChange }: AdvancedSectionProps): ReactElement {
  const [newBlacklist, setNewBlacklist] = useState('');
  const [newWhitelist, setNewWhitelist] = useState('');

  const num = (field: keyof InvestmentStrategy) => (e: React.ChangeEvent<HTMLInputElement>) =>
    onChange({ [field]: Number(e.target.value) || 0 });

  const addToList = (
    field: 'blacklistAssets' | 'whitelistAssets',
    value: string,
    reset: () => void,
  ): void => {
    const symbol = value.trim().toUpperCase();
    if (!symbol) return;
    const current = strategy[field];
    if (!current.includes(symbol)) {
      onChange({ [field]: [...current, symbol] });
    }
    reset();
  };

  const removeFromList = (field: 'blacklistAssets' | 'whitelistAssets', symbol: string): void => {
    onChange({ [field]: strategy[field].filter((s) => s !== symbol) });
  };

  return (
    <div className={styles.formGrid}>
      <div className={styles.formField}>
        <label className={styles.formLabel}>Cooldown after trade (minutes)</label>
        <input
          className={styles.formInput}
          type="number"
          min={0}
          max={1440}
          value={strategy.cooldownAfterTradeMinutes}
          onChange={num('cooldownAfterTradeMinutes')}
          aria-label="Cooldown after trade"
        />
        <span className={styles.formHint}>Wait time between consecutive trades</span>
      </div>

      <div className={styles.formField}>
        <label className={styles.formCheckbox}>
          <input
            type="checkbox"
            checked={strategy.volatilityFilterEnabled}
            onChange={(e) => onChange({ volatilityFilterEnabled: e.target.checked })}
          />
          Volatility filter
        </label>
        <span className={styles.formHint}>Block trades during extreme market volatility</span>
      </div>

      <div className={styles.formField}>
        <label className={styles.formLabel}>Min market volume (USD)</label>
        <input
          className={styles.formInput}
          type="number"
          min={0}
          step={1000}
          value={strategy.minimumMarketVolume}
          onChange={num('minimumMarketVolume')}
          aria-label="Minimum market volume"
        />
      </div>

      <div className={styles.formField}>
        <label className={styles.formLabel}>Rebalance frequency (days)</label>
        <input
          className={styles.formInput}
          type="number"
          min={1}
          max={90}
          value={strategy.rebalanceFrequencyDays}
          onChange={num('rebalanceFrequencyDays')}
          aria-label="Rebalance frequency"
        />
      </div>

      <div className={styles.formFieldWide}>
        <label className={styles.formLabel}>Blacklisted assets</label>
        <span className={styles.formHint}>These assets will never be traded</span>
        <div className={styles.assetChips}>
          {strategy.blacklistAssets.map((s) => (
            <button
              key={s}
              type="button"
              className={styles.assetChip}
              onClick={() => removeFromList('blacklistAssets', s)}
            >
              {s} ✕
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
          <select
            className={styles.formSelect}
            value={newBlacklist}
            onChange={(e) => setNewBlacklist(e.target.value)}
          >
            <option value="">Add asset...</option>
            {AVAILABLE_ASSETS.filter((a) => !strategy.blacklistAssets.includes(a)).map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
          <button
            type="button"
            className={styles.btnSecondary}
            onClick={() => addToList('blacklistAssets', newBlacklist, () => setNewBlacklist(''))}
          >
            Add
          </button>
        </div>
      </div>

      <div className={styles.formFieldWide}>
        <label className={styles.formLabel}>Whitelisted assets (override)</label>
        <span className={styles.formHint}>If set, only these assets can be traded</span>
        <div className={styles.assetChips}>
          {strategy.whitelistAssets.map((s) => (
            <button
              key={s}
              type="button"
              className={styles.assetChip}
              onClick={() => removeFromList('whitelistAssets', s)}
            >
              {s} ✕
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
          <select
            className={styles.formSelect}
            value={newWhitelist}
            onChange={(e) => setNewWhitelist(e.target.value)}
          >
            <option value="">Add asset...</option>
            {AVAILABLE_ASSETS.filter((a) => !strategy.whitelistAssets.includes(a)).map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
          <button
            type="button"
            className={styles.btnSecondary}
            onClick={() => addToList('whitelistAssets', newWhitelist, () => setNewWhitelist(''))}
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}
