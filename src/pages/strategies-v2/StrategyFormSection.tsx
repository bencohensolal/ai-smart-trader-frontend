import { ReactElement } from 'react';
import type { InvestmentStrategy, StrategyPerformance } from './types';
import { AccordionSection } from './AccordionSection';
import { GeneralInfoSection } from './sections/GeneralInfoSection';
import { CryptoUniverseSection } from './sections/CryptoUniverseSection';
import { AiParametersSection } from './sections/AiParametersSection';
import { MoneyManagementSection } from './sections/MoneyManagementSection';
import { SafeguardsSection } from './sections/SafeguardsSection';
import { TradingConditionsSection } from './sections/TradingConditionsSection';
import { PromptConfigSection } from './sections/PromptConfigSection';
import { AdvancedSection } from './sections/AdvancedSection';
import { SimulationSection } from './sections/SimulationSection';
import styles from './StrategiesV2.module.css';

interface StrategyFormSectionProps {
  strategy: InvestmentStrategy;
  performance: StrategyPerformance | null;
  backtestRunning: boolean;
  status: { kind: 'success' | 'error'; message: string } | null;
  onChange: (patch: Partial<InvestmentStrategy>) => void;
  onSave: () => void;
  onCancel: () => void;
  onRunBacktest: () => void;
}

export function StrategyFormSection({
  strategy,
  performance,
  backtestRunning,
  status,
  onChange,
  onSave,
  onCancel,
  onRunBacktest,
}: StrategyFormSectionProps): ReactElement {
  const isNew = !strategy.updatedAt || strategy.createdAt === strategy.updatedAt;

  return (
    <div className="panel">
      <h2>{isNew ? 'Create strategy' : `Edit: ${strategy.name}`}</h2>

      {status && (
        <div
          className={status.kind === 'error' ? styles.statusError : styles.statusSuccess}
          role="alert"
        >
          {status.message}
        </div>
      )}

      <AccordionSection title="1. General information" defaultOpen>
        <GeneralInfoSection strategy={strategy} onChange={onChange} />
      </AccordionSection>

      <AccordionSection title="2. Crypto universe">
        <CryptoUniverseSection strategy={strategy} onChange={onChange} />
      </AccordionSection>

      <AccordionSection title="3. AI parameters">
        <AiParametersSection strategy={strategy} onChange={onChange} />
      </AccordionSection>

      <AccordionSection title="4. AI prompts">
        <PromptConfigSection strategy={strategy} onChange={onChange} />
      </AccordionSection>

      <AccordionSection title="5. Money management">
        <MoneyManagementSection strategy={strategy} onChange={onChange} />
      </AccordionSection>

      <AccordionSection title="6. Safeguards">
        <SafeguardsSection strategy={strategy} onChange={onChange} />
      </AccordionSection>

      <AccordionSection title="7. Trading conditions">
        <TradingConditionsSection strategy={strategy} onChange={onChange} />
      </AccordionSection>

      <AccordionSection title="8. Advanced settings">
        <AdvancedSection strategy={strategy} onChange={onChange} />
      </AccordionSection>

      <AccordionSection title="9. Simulation & backtest">
        <SimulationSection
          strategy={strategy}
          performance={performance}
          backtestRunning={backtestRunning}
          onRunBacktest={onRunBacktest}
        />
      </AccordionSection>

      <div className={styles.formActions}>
        <button type="button" className={styles.btnSecondary} onClick={onCancel}>
          Cancel
        </button>
        <button type="button" className={styles.btnPrimary} onClick={onSave}>
          {isNew ? 'Create strategy' : 'Save changes'}
        </button>
      </div>
    </div>
  );
}
