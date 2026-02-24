import { ReactElement, ReactNode } from 'react';
import { Layout } from '../../components/Layout';
import styles from '../StrategyWizardPage.module.css';

type WizardStepLayoutProps = {
  title: string;
  progressPct: number;
  progressAriaLabel: string;
  heading: string;
  description?: string;
  children: ReactNode;
};

export function WizardStepLayout({
  title,
  progressPct,
  progressAriaLabel,
  heading,
  description,
  children,
}: WizardStepLayoutProps): ReactElement {
  return (
    <Layout title={title}>
      <div className={styles.wizardContainer}>
        <div
          className={styles.progressBar}
          role="progressbar"
          aria-valuenow={progressPct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={progressAriaLabel}
        >
          <div className={styles.progressStep} style={{ width: `${progressPct}%` }} />
        </div>

        <div className={styles.wizardContent}>
          <h2>{heading}</h2>
          {description ? <p>{description}</p> : null}
          {children}
        </div>
      </div>
    </Layout>
  );
}
