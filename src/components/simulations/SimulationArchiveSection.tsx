import { ReactElement } from 'react';
import { HistoricalSimulationSummary } from '../../api';
import { formatAmountFromEur } from '../../currency';
import { useI18n } from '../../i18n/i18n';
import {
  ArchiveStatusFilter,
  formatSimulationAiUsage,
  formatSimulationBatch,
} from '../../pages/simulations/archive';

type SimulationArchiveSectionProps = {
  loadingRuns: boolean;
  runs: HistoricalSimulationSummary[];
  archiveStatusFilter: ArchiveStatusFilter;
  archiveStrategyFilter: string;
  archivePageSize: number;
  archiveStrategies: string[];
  filteredRunsCount: number;
  safeArchivePage: number;
  archivePageCount: number;
  pagedRuns: HistoricalSimulationSummary[];
  onDeleteAllRuns: () => void;
  onArchiveStatusFilterChange: (next: ArchiveStatusFilter) => void;
  onArchiveStrategyFilterChange: (next: string) => void;
  onArchivePageSizeChange: (next: number) => void;
  onPreviousPage: () => void;
  onNextPage: () => void;
  onOpenRun: (run: HistoricalSimulationSummary) => void;
  onDeleteRun: (run: HistoricalSimulationSummary) => void;
};

export function SimulationArchiveSection({
  loadingRuns,
  runs,
  archiveStatusFilter,
  archiveStrategyFilter,
  archivePageSize,
  archiveStrategies,
  filteredRunsCount,
  safeArchivePage,
  archivePageCount,
  pagedRuns,
  onDeleteAllRuns,
  onArchiveStatusFilterChange,
  onArchiveStrategyFilterChange,
  onArchivePageSizeChange,
  onPreviousPage,
  onNextPage,
  onOpenRun,
  onDeleteRun,
}: SimulationArchiveSectionProps): ReactElement {
  const { t } = useI18n();

  return (
    <section className="panel">
      <div className="simulations-archive-head">
        <h2>{t('auto.simulation_archives')}</h2>
        <button
          className="simulations-archive-clear"
          type="button"
          onClick={onDeleteAllRuns}
          disabled={loadingRuns || runs.length === 0}
        >
          {t('simulations.archive.deleteAll.cta')}
        </button>
      </div>
      {loadingRuns ? (
        <p>{t('auto.loading')}</p>
      ) : runs.length === 0 ? (
        <p>{t('auto.no_archived_simulation_yet')}</p>
      ) : (
        <>
          <section className="controls-panel">
            <label className="field">
              <span>{t('auto.status')}</span>
              <select
                value={archiveStatusFilter}
                onChange={(event) => {
                  const next = event.target.value;
                  if (next === 'all' || next === 'completed' || next === 'failed') {
                    onArchiveStatusFilterChange(next);
                  }
                }}
              >
                <option value="all">{t('auto.all')}</option>
                <option value="completed">{t('auto.completed')}</option>
                <option value="failed">{t('auto.failed')}</option>
              </select>
            </label>
            <label className="field">
              <span>{t('auto.strategy')}</span>
              <select
                value={archiveStrategyFilter}
                onChange={(event) => {
                  onArchiveStrategyFilterChange(event.target.value);
                }}
              >
                <option value="all">{t('auto.all')}</option>
                {archiveStrategies.map((strategyName) => {
                  return (
                    <option key={strategyName} value={strategyName}>
                      {strategyName}
                    </option>
                  );
                })}
              </select>
            </label>
            <label className="field">
              <span>{t('auto.rows_page')}</span>
              <select
                value={String(archivePageSize)}
                onChange={(event) => {
                  const next = Number(event.target.value);
                  if (next === 50 || next === 100 || next === 200) {
                    onArchivePageSizeChange(next);
                  }
                }}
              >
                <option value="50">50</option>
                <option value="100">100</option>
                <option value="200">200</option>
              </select>
            </label>
          </section>

          <p>
            {filteredRunsCount} filtered simulation(s) · page {safeArchivePage}/{archivePageCount}
          </p>

          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>{t('auto.execution_date')}</th>
                  <th>{t('auto.strategy')}</th>
                  <th>{t('auto.period')}</th>
                  <th>{t('auto.status')}</th>
                  <th>{t('auto.invested')}</th>
                  <th>{t('auto.final_value')}</th>
                  <th>{t('auto.pnl')}</th>
                  <th>{t('simulations.archive.aiUsage')}</th>
                  <th>{t('auto.batch')}</th>
                  <th>{t('auto.operations')}</th>
                  <th>{t('auto.action')}</th>
                </tr>
              </thead>
              <tbody>
                {pagedRuns.map((run) => {
                  const statusBadge =
                    run.status === 'failed'
                      ? '❌ Failed'
                      : run.status === 'completed'
                        ? '✅ Completed'
                        : '⏳ Unknown';
                  return (
                    <tr key={run.id}>
                      <td>{run.createdAt}</td>
                      <td>{run.strategyName}</td>
                      <td>
                        {run.periodStart} → {run.periodEnd}
                      </td>
                      <td>{statusBadge}</td>
                      <td>{formatAmountFromEur(run.totalInvestedEur)}</td>
                      <td>{formatAmountFromEur(run.finalValueEur)}</td>
                      <td>{formatAmountFromEur(run.netProfitEur)}</td>
                      <td>{formatSimulationAiUsage(run, t)}</td>
                      <td>{formatSimulationBatch(run)}</td>
                      <td>{run.operationsCount}</td>
                      <td>
                        <div className="table-actions">
                          <button
                            className="button button-secondary button-small"
                            type="button"
                            onClick={() => {
                              onOpenRun(run);
                            }}
                          >
                            {t('auto.view_details')}
                          </button>
                          <button
                            className="button button-danger button-small"
                            type="button"
                            onClick={() => {
                              onDeleteRun(run);
                            }}
                          >
                            {t('auto.delete')}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {pagedRuns.length === 0 ? (
                  <tr>
                    <td colSpan={11}>{t('auto.no_simulations_for_these_filte')}</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          <div className="list-pagination">
            <button
              className="button button-secondary button-small"
              type="button"
              onClick={onPreviousPage}
              disabled={safeArchivePage <= 1}
            >
              {t('auto.previous')}
            </button>
            <span>
              Page {safeArchivePage} / {archivePageCount}
            </span>
            <button
              className="button button-secondary button-small"
              type="button"
              onClick={onNextPage}
              disabled={safeArchivePage >= archivePageCount}
            >
              {t('auto.next')}
            </button>
          </div>
        </>
      )}
    </section>
  );
}
