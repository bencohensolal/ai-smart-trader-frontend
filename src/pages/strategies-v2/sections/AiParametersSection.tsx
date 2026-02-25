import { ReactElement } from 'react';
import type { InvestmentStrategy } from '../types';
import { AI_MODELS } from '../defaults';
import styles from '../StrategiesV2.module.css';

interface AiParametersSectionProps {
  strategy: InvestmentStrategy;
  onChange: (patch: Partial<InvestmentStrategy>) => void;
}

export function AiParametersSection({
  strategy,
  onChange,
}: AiParametersSectionProps): ReactElement {
  const num = (field: keyof InvestmentStrategy) => (e: React.ChangeEvent<HTMLInputElement>) =>
    onChange({ [field]: Number(e.target.value) || 0 });

  return (
    <div className={styles.formGrid}>
      <div className={styles.formField}>
        <label className={styles.formLabel}>AI model</label>
        <select
          className={styles.formSelect}
          value={strategy.aiModel}
          onChange={(e) => onChange({ aiModel: e.target.value })}
          aria-label="AI model"
        >
          {AI_MODELS.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.formField}>
        <label className={styles.formLabel}>Temperature (0-2)</label>
        <input
          className={styles.formInput}
          type="number"
          min={0}
          max={2}
          step={0.1}
          value={strategy.aiTemperature}
          onChange={num('aiTemperature')}
          aria-label="AI temperature"
        />
        <span className={styles.formHint}>Lower = more deterministic, higher = more creative</span>
      </div>

      <div className={styles.formField}>
        <label className={styles.formLabel}>Max tokens per call</label>
        <input
          className={styles.formInput}
          type="number"
          min={100}
          max={128000}
          step={100}
          value={strategy.aiMaxTokens}
          onChange={num('aiMaxTokens')}
          aria-label="Max tokens"
        />
      </div>

      <div className={styles.formField}>
        <label className={styles.formLabel}>AI calls per day</label>
        <input
          className={styles.formInput}
          type="number"
          min={1}
          max={48}
          value={strategy.aiCallFrequencyPerDay}
          onChange={num('aiCallFrequencyPerDay')}
          aria-label="AI calls per day"
        />
      </div>

      <div className={styles.formField}>
        <label className={styles.formLabel}>Min confidence threshold (0-1)</label>
        <input
          className={styles.formInput}
          type="number"
          min={0}
          max={1}
          step={0.05}
          value={strategy.minConfidenceThreshold}
          onChange={num('minConfidenceThreshold')}
          aria-label="Minimum confidence"
        />
        <span className={styles.formHint}>AI responses below this confidence are rejected</span>
      </div>

      <div className={styles.formField}>
        <label className={styles.formLabel}>Min expected return (%)</label>
        <input
          className={styles.formInput}
          type="number"
          min={0}
          max={100}
          step={0.5}
          value={strategy.minExpectedReturnPercent}
          onChange={num('minExpectedReturnPercent')}
          aria-label="Min expected return"
        />
      </div>

      <div className={styles.formField}>
        <label className={styles.formLabel}>Prediction timeframe (days)</label>
        <input
          className={styles.formInput}
          type="number"
          min={1}
          max={365}
          value={strategy.predictionTimeframeDays}
          onChange={num('predictionTimeframeDays')}
          aria-label="Prediction timeframe"
        />
      </div>
    </div>
  );
}
