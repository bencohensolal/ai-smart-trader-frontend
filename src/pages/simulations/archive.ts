import { HistoricalSimulationSummary } from '../../api';

export type ArchiveStatusFilter = 'all' | 'completed' | 'failed';
type ArchiveAiUsageTranslationKey =
  | 'simulations.archive.aiUsage.unknown'
  | 'simulations.archive.aiUsage.none'
  | 'simulations.archive.aiUsage.local'
  | 'simulations.archive.aiUsage.live';

type ArchiveTranslate = (
  key: ArchiveAiUsageTranslationKey,
  params?: Record<string, string | number>,
) => string;

export function formatSimulationBatch(
  run: HistoricalSimulationSummary,
): string {
  if (!run.groupId || !run.groupType) {
    return 'Single run';
  }

  const shortId = run.groupId.replace('sim-group-', '');
  const prefix =
    run.groupType === 'multi_strategy' ? 'Strategy batch' : 'Period batch';
  return `${prefix}: ${shortId}`;
}

export function formatSimulationAiUsage(
  run: HistoricalSimulationSummary,
  translate: ArchiveTranslate,
): string {
  if (!run.aiUsage) {
    return translate('simulations.archive.aiUsage.unknown');
  }
  if (run.aiUsage.decisionMode !== 'ai_assisted') {
    return translate('simulations.archive.aiUsage.none');
  }
  if (!run.aiUsage.liveEnabled) {
    return translate('simulations.archive.aiUsage.local');
  }

  return translate('simulations.archive.aiUsage.live', {
    count: run.aiUsage.remoteCalls,
  });
}

export function filterArchiveRuns(
  runs: HistoricalSimulationSummary[],
  statusFilter: ArchiveStatusFilter,
  strategyFilter: string,
): HistoricalSimulationSummary[] {
  return runs.filter((run) => {
    if (statusFilter !== 'all' && run.status !== statusFilter) {
      return false;
    }
    if (strategyFilter !== 'all' && run.strategyName !== strategyFilter) {
      return false;
    }
    return true;
  });
}

export function deriveArchiveStrategies(
  runs: HistoricalSimulationSummary[],
): string[] {
  return Array.from(new Set(runs.map((run) => run.strategyName))).sort(
    (left, right) => left.localeCompare(right),
  );
}

export function paginateArchiveRuns(
  runs: HistoricalSimulationSummary[],
  page: number,
  pageSize: number,
): {
  pageCount: number;
  safePage: number;
  pagedRuns: HistoricalSimulationSummary[];
} {
  const pageCount = Math.max(1, Math.ceil(runs.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const start = (safePage - 1) * pageSize;

  return {
    pageCount,
    safePage,
    pagedRuns: runs.slice(start, start + pageSize),
  };
}
