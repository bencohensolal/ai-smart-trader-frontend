import { ReactElement, ReactNode } from 'react';
import styles from '../StrategyWizardPage.module.css';
import { SafeguardsDefaults, StrategyType } from './types';
import { useI18n } from '../../i18n/i18n';

type TooltipComponentProps = {
  children: ReactNode;
  content: string;
  enabled?: boolean;
};

type ExecutionConfigurationSectionProps = {
  strategyType: StrategyType;
  safeguards: SafeguardsDefaults;
  tooltipsEnabled: boolean;
  onSafeguardsChange: (next: SafeguardsDefaults) => void;
  TooltipComponent: (props: TooltipComponentProps) => ReactElement;
};

export function ExecutionConfigurationSection({
  strategyType,
  safeguards,
  tooltipsEnabled,
  onSafeguardsChange,
  TooltipComponent,
}: ExecutionConfigurationSectionProps): ReactElement {
  const { t } = useI18n();
  return (
    <div className={styles.configSubsection}>
      <h3>{t('auto.execution_cadence')}</h3>
      <div className={styles.safeguardsGrid}>
        <div className={styles.formGroup}>
          <TooltipComponent
            enabled={tooltipsEnabled}
            content="Number of times per day the strategy evaluates whether to buy, sell, or skip. Higher values react faster but can increase churn and fees."
          >
            <label>{t('auto.decision_checks_per_day')}</label>
          </TooltipComponent>
          <input
            type="number"
            min="1"
            max="24"
            step="1"
            value={safeguards.decisionChecksPerDay}
            aria-label="Decision checks per day"
            onChange={(event) =>
              onSafeguardsChange({
                ...safeguards,
                decisionChecksPerDay: Math.max(
                  1,
                  Math.min(24, parseInt(event.target.value || '1', 10) || 1),
                ),
              })
            }
          />
        </div>

        {strategyType === 'ai_assisted' ? (
          <div className={styles.formGroup}>
            <TooltipComponent
              enabled={tooltipsEnabled}
              content="Minimum confidence required for AI recommendations to be executed. If AI confidence is below this threshold, the cycle is skipped with no trade."
            >
              <label>Minimum AI confidence to execute (%)</label>
            </TooltipComponent>
            <input
              type="number"
              min="0"
              max="100"
              step="1"
              value={safeguards.minAiConfidencePctForExecution}
              aria-label="Minimum AI confidence to execute in percentage"
              onChange={(event) =>
                onSafeguardsChange({
                  ...safeguards,
                  minAiConfidencePctForExecution: Math.max(
                    0,
                    Math.min(100, parseInt(event.target.value || '0', 10) || 0),
                  ),
                })
              }
            />
          </div>
        ) : null}
      </div>
      <small className={styles.configSubsectionHint}>
        Tip: keep checks low for stability, and increase only if you want more reactive execution.
      </small>
    </div>
  );
}
