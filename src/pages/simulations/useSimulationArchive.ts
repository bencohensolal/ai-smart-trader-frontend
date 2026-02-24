import { useEffect, useMemo, useState } from 'react';
import { HistoricalSimulationSummary } from '../../api';
import {
  ArchiveStatusFilter,
  deriveArchiveStrategies,
  filterArchiveRuns,
  paginateArchiveRuns,
} from './archive';

type SimulationArchiveState = {
  archiveStatusFilter: ArchiveStatusFilter;
  setArchiveStatusFilter: (next: ArchiveStatusFilter) => void;
  archiveStrategyFilter: string;
  setArchiveStrategyFilter: (next: string) => void;
  archivePageSize: number;
  setArchivePageSize: (next: number) => void;
  archivePage: number;
  setArchivePage: (next: number) => void;
  onPreviousPage: () => void;
  onNextPage: () => void;
  filteredRuns: HistoricalSimulationSummary[];
  archiveStrategies: string[];
  archivePageCount: number;
  safeArchivePage: number;
  pagedRuns: HistoricalSimulationSummary[];
};

export function useSimulationArchive(
  runs: HistoricalSimulationSummary[],
): SimulationArchiveState {
  const [archiveStatusFilter, setArchiveStatusFilter] =
    useState<ArchiveStatusFilter>('all');
  const [archiveStrategyFilter, setArchiveStrategyFilter] = useState('all');
  const [archivePageSize, setArchivePageSize] = useState(50);
  const [archivePage, setArchivePage] = useState(1);

  const filteredRuns = useMemo(() => {
    return filterArchiveRuns(runs, archiveStatusFilter, archiveStrategyFilter);
  }, [archiveStatusFilter, archiveStrategyFilter, runs]);

  useEffect(() => {
    setArchivePage(1);
  }, [archivePageSize, archiveStatusFilter, archiveStrategyFilter]);

  const archiveStrategies = useMemo(() => {
    return deriveArchiveStrategies(runs);
  }, [runs]);

  const {
    pageCount: archivePageCount,
    safePage: safeArchivePage,
    pagedRuns,
  } = useMemo(() => {
    return paginateArchiveRuns(filteredRuns, archivePage, archivePageSize);
  }, [archivePage, archivePageSize, filteredRuns]);

  return {
    archiveStatusFilter,
    setArchiveStatusFilter,
    archiveStrategyFilter,
    setArchiveStrategyFilter,
    archivePageSize,
    setArchivePageSize,
    archivePage,
    setArchivePage,
    onPreviousPage: () => {
      setArchivePage((current) => Math.max(1, current - 1));
    },
    onNextPage: () => {
      setArchivePage((current) => Math.min(archivePageCount, current + 1));
    },
    filteredRuns,
    archiveStrategies,
    archivePageCount,
    safeArchivePage,
    pagedRuns,
  };
}
