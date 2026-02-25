import { ReactElement } from 'react';
import { Layout } from '../components/Layout';
import { useI18n } from '../i18n/i18n';
import { useStrategyForm } from './strategies-v2/useStrategyForm';
import { StrategyListSection } from './strategies-v2/StrategyListSection';
import { StrategyFormSection } from './strategies-v2/StrategyFormSection';
import styles from './strategies-v2/StrategiesV2.module.css';

export function StrategiesV2Page(): ReactElement {
  const { t } = useI18n();
  const {
    view,
    listItems,
    editingStrategy,
    performance,
    backtestRunning,
    status,
    killSwitchActive,
    handleCreate,
    handleEdit,
    handleDuplicate,
    handleDelete,
    handleToggleActive,
    handleChange,
    handleSave,
    handleCancel,
    handleKillSwitch,
    handleRunBacktest,
  } = useStrategyForm();

  return (
    <Layout title={t('page.strategiesV2.title')} subtitle={t('page.strategiesV2.subtitle')}>
      <div className={styles.pageContainer}>
        {/* ── Kill switch (always visible) ── */}
        <div
          className={styles.killSwitch}
          role="button"
          tabIndex={0}
          onClick={handleKillSwitch}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleKillSwitch();
            }
          }}
          aria-label="Emergency kill switch — deactivate all strategies"
        >
          <span>🛑</span>
          <span className={styles.killSwitchLabel}>
            Kill switch {killSwitchActive ? '(activated)' : ''}
          </span>
        </div>

        {/* ── Status messages ── */}
        {view === 'list' && status && (
          <div
            className={status.kind === 'error' ? styles.statusError : styles.statusSuccess}
            role="alert"
          >
            {status.message}
          </div>
        )}

        {/* ── List view ── */}
        {view === 'list' && (
          <>
            <div className={styles.headerActions}>
              <button
                className={styles.btnPrimary}
                onClick={handleCreate}
                aria-label="Create a new investment strategy"
              >
                + New strategy
              </button>
            </div>

            <StrategyListSection
              strategies={listItems}
              loading={false}
              onEdit={handleEdit}
              onDuplicate={handleDuplicate}
              onDelete={handleDelete}
              onToggleActive={handleToggleActive}
              onCreate={handleCreate}
            />
          </>
        )}

        {/* ── Form view ── */}
        {view === 'form' && editingStrategy && (
          <StrategyFormSection
            strategy={editingStrategy}
            performance={performance}
            backtestRunning={backtestRunning}
            status={status}
            onChange={handleChange}
            onSave={handleSave}
            onCancel={handleCancel}
            onRunBacktest={handleRunBacktest}
          />
        )}
      </div>
    </Layout>
  );
}
