import { ReactElement, useState } from 'react';
import type { InvestmentStrategy } from '../types';
import { AI_RESPONSE_FORMAT_REFERENCE, DEFAULT_SYSTEM_PROMPT } from '../defaults';
import styles from '../StrategiesV2.module.css';

interface PromptConfigSectionProps {
  strategy: InvestmentStrategy;
  onChange: (patch: Partial<InvestmentStrategy>) => void;
}

export function PromptConfigSection({
  strategy,
  onChange,
}: PromptConfigSectionProps): ReactElement {
  const [showJsonRef, setShowJsonRef] = useState(false);

  return (
    <div className={styles.formGrid}>
      {/* ── System Prompt ── */}
      <div className={styles.formFieldWide}>
        <label className={styles.formLabel}>System prompt</label>
        <span className={styles.formHint}>
          Defines the AI&apos;s role, personality and hard constraints. Applied to every call.
        </span>
        <textarea
          className={styles.formTextarea}
          value={strategy.systemPrompt}
          onChange={(e) => onChange({ systemPrompt: e.target.value })}
          rows={8}
          aria-label="System prompt"
          style={{ fontFamily: 'monospace', fontSize: '0.82rem', minHeight: '10rem' }}
        />
        <button
          type="button"
          className={styles.btnSecondary}
          style={{ alignSelf: 'flex-start', marginTop: '0.3rem', fontSize: '0.78rem' }}
          onClick={() => onChange({ systemPrompt: DEFAULT_SYSTEM_PROMPT })}
        >
          Reset to default
        </button>
      </div>

      {/* ── Analysis Prompt ── */}
      <div className={styles.formFieldWide}>
        <label className={styles.formLabel}>Analysis prompt</label>
        <span className={styles.formHint}>
          Sent with market data on each AI call. Use {'{{portfolio}}'}, {'{{marketData}}'},{' '}
          {'{{constraints}}'} as placeholders.
        </span>
        <textarea
          className={styles.formTextarea}
          value={strategy.analysisPrompt}
          onChange={(e) => onChange({ analysisPrompt: e.target.value })}
          rows={6}
          aria-label="Analysis prompt template"
          style={{ fontFamily: 'monospace', fontSize: '0.82rem', minHeight: '8rem' }}
        />
      </div>

      {/* ── Custom Instructions ── */}
      <div className={styles.formFieldWide}>
        <label className={styles.formLabel}>Custom instructions (optional)</label>
        <span className={styles.formHint}>
          Extra instructions appended to every AI call. Use this for specific market views,
          exclusion rules, or personal preferences.
        </span>
        <textarea
          className={styles.formTextarea}
          value={strategy.customInstructions}
          onChange={(e) => onChange({ customInstructions: e.target.value })}
          rows={3}
          placeholder="e.g. Never buy DOGE. Focus on DeFi protocols. Prefer limit orders over market orders."
          aria-label="Custom instructions"
          style={{ fontFamily: 'monospace', fontSize: '0.82rem' }}
        />
      </div>

      {/* ── Enforce JSON ── */}
      <div className={styles.formField}>
        <label className={styles.formCheckbox}>
          <input
            type="checkbox"
            checked={strategy.enforceJsonResponse}
            onChange={(e) => onChange({ enforceJsonResponse: e.target.checked })}
          />
          Enforce strict JSON response
        </label>
        <span className={styles.formHint}>
          Reject any AI output that is not valid parseable JSON
        </span>
      </div>

      {/* ── JSON Response Format Reference ── */}
      <div className={styles.formFieldWide}>
        <button
          type="button"
          className={styles.btnSecondary}
          style={{ alignSelf: 'flex-start', fontSize: '0.78rem' }}
          onClick={() => setShowJsonRef(!showJsonRef)}
        >
          {showJsonRef ? 'Hide' : 'Show'} expected JSON response format
        </button>

        {showJsonRef && (
          <pre
            style={{
              marginTop: '0.5rem',
              padding: '1rem',
              background: 'rgba(0,0,0,0.3)',
              borderRadius: '6px',
              fontSize: '0.78rem',
              overflow: 'auto',
              maxHeight: '20rem',
              border: '1px solid var(--color-border, #333)',
              fontFamily: 'monospace',
            }}
          >
            {AI_RESPONSE_FORMAT_REFERENCE}
          </pre>
        )}
      </div>
    </div>
  );
}
