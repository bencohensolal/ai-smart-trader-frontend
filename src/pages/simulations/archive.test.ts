import { describe, it, expect } from 'vitest';
import {
  formatSimulationBatch,
  formatSimulationAiUsage,
  filterArchiveRuns,
  deriveArchiveStrategies,
  paginateArchiveRuns,
} from './archive';
import type { HistoricalSimulationSummary } from '../../api';

describe('archive', () => {
  const mockRun: HistoricalSimulationSummary = {
    id: 'sim-1',
    strategyId: 'strat-1',
    strategyName: 'Test Strategy',
    periodStart: '2024-01-01',
    periodEnd: '2024-12-31',
    createdAt: '2024-01-01T00:00:00Z',
    status: 'completed',
    totalInvestedEur: 1000,
    finalValueEur: 1200,
    netProfitEur: 200,
    returnPct: 20,
    totalFeesEur: 10,
    operationsCount: 50,
    winRatePct: 75,
  };

  describe('formatSimulationBatch', () => {
    it('should return "Single run" for run without group', () => {
      expect(formatSimulationBatch(mockRun)).toBe('Single run');
    });

    it('should format multi_strategy batch', () => {
      const run = { ...mockRun, groupId: 'sim-group-abc123', groupType: 'multi_strategy' as const };
      expect(formatSimulationBatch(run)).toBe('Strategy batch: abc123');
    });

    it('should format multi_period batch', () => {
      const run = { ...mockRun, groupId: 'sim-group-xyz789', groupType: 'multi_period' as const };
      expect(formatSimulationBatch(run)).toBe('Period batch: xyz789');
    });

    it('should handle group without groupType', () => {
      const run = { ...mockRun, groupId: 'sim-group-abc' };
      expect(formatSimulationBatch(run)).toBe('Single run');
    });
  });

  describe('formatSimulationAiUsage', () => {
    const translate = (key: string, params?: Record<string, string | number>) => {
      if (key === 'simulations.archive.aiUsage.unknown') return 'Unknown';
      if (key === 'simulations.archive.aiUsage.none') return 'None';
      if (key === 'simulations.archive.aiUsage.local') return 'Local';
      if (key === 'simulations.archive.aiUsage.live') return `Live (${params?.count} calls)`;
      return '';
    };

    it('should return "Unknown" when no AI usage info', () => {
      expect(formatSimulationAiUsage(mockRun, translate)).toBe('Unknown');
    });

    it('should return "None" for non-AI decision mode', () => {
      const run = {
        ...mockRun,
        aiUsage: {
          decisionMode: 'allocation_only' as const,
          liveEnabled: false,
          remoteCalls: 0,
        },
      };
      expect(formatSimulationAiUsage(run, translate)).toBe('None');
    });

    it('should return "Local" for AI without live calls', () => {
      const run = {
        ...mockRun,
        aiUsage: {
          decisionMode: 'ai_assisted' as const,
          liveEnabled: false,
          remoteCalls: 0,
        },
      };
      expect(formatSimulationAiUsage(run, translate)).toBe('Local');
    });

    it('should return "Live" with call count for live AI', () => {
      const run = {
        ...mockRun,
        aiUsage: {
          decisionMode: 'ai_assisted' as const,
          liveEnabled: true,
          remoteCalls: 42,
        },
      };
      expect(formatSimulationAiUsage(run, translate)).toBe('Live (42 calls)');
    });
  });

  describe('filterArchiveRuns', () => {
    const runs: HistoricalSimulationSummary[] = [
      { ...mockRun, id: '1', status: 'completed', strategyName: 'Strategy A' },
      { ...mockRun, id: '2', status: 'completed', strategyName: 'Strategy B' },
      { ...mockRun, id: '3', status: 'failed', strategyName: 'Strategy A' },
      { ...mockRun, id: '4', status: 'failed', strategyName: 'Strategy C' },
    ];

    it('should return all runs with "all" status and "all" strategy', () => {
      expect(filterArchiveRuns(runs, 'all', 'all')).toHaveLength(4);
    });

    it('should filter by completed status', () => {
      const filtered = filterArchiveRuns(runs, 'completed', 'all');
      expect(filtered).toHaveLength(2);
      expect(filtered.every((r) => r.status === 'completed')).toBe(true);
    });

    it('should filter by failed status', () => {
      const filtered = filterArchiveRuns(runs, 'failed', 'all');
      expect(filtered).toHaveLength(2);
      expect(filtered.every((r) => r.status === 'failed')).toBe(true);
    });

    it('should filter by strategy name', () => {
      const filtered = filterArchiveRuns(runs, 'all', 'Strategy A');
      expect(filtered).toHaveLength(2);
      expect(filtered.every((r) => r.strategyName === 'Strategy A')).toBe(true);
    });

    it('should filter by status and strategy', () => {
      const filtered = filterArchiveRuns(runs, 'completed', 'Strategy A');
      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('1');
    });

    it('should return empty array when no match', () => {
      const filtered = filterArchiveRuns(runs, 'completed', 'Nonexistent');
      expect(filtered).toHaveLength(0);
    });
  });

  describe('deriveArchiveStrategies', () => {
    it('should return empty array for empty input', () => {
      expect(deriveArchiveStrategies([])).toEqual([]);
    });

    it('should return unique strategy names', () => {
      const runs: HistoricalSimulationSummary[] = [
        { ...mockRun, strategyName: 'Strategy B' },
        { ...mockRun, strategyName: 'Strategy A' },
        { ...mockRun, strategyName: 'Strategy B' },
        { ...mockRun, strategyName: 'Strategy C' },
      ];
      expect(deriveArchiveStrategies(runs)).toEqual(['Strategy A', 'Strategy B', 'Strategy C']);
    });

    it('should sort strategy names alphabetically', () => {
      const runs: HistoricalSimulationSummary[] = [
        { ...mockRun, strategyName: 'Zebra' },
        { ...mockRun, strategyName: 'Alpha' },
        { ...mockRun, strategyName: 'Beta' },
      ];
      expect(deriveArchiveStrategies(runs)).toEqual(['Alpha', 'Beta', 'Zebra']);
    });
  });

  describe('paginateArchiveRuns', () => {
    const createRuns = (count: number): HistoricalSimulationSummary[] =>
      Array.from({ length: count }, (_, i) => ({ ...mockRun, id: `sim-${i}` }));

    it('should paginate runs correctly on first page', () => {
      const runs = createRuns(10);
      const result = paginateArchiveRuns(runs, 1, 5);
      expect(result.pageCount).toBe(2);
      expect(result.safePage).toBe(1);
      expect(result.pagedRuns).toHaveLength(5);
      expect(result.pagedRuns[0].id).toBe('sim-0');
      expect(result.pagedRuns[4].id).toBe('sim-4');
    });

    it('should paginate runs correctly on second page', () => {
      const runs = createRuns(10);
      const result = paginateArchiveRuns(runs, 2, 5);
      expect(result.pageCount).toBe(2);
      expect(result.safePage).toBe(2);
      expect(result.pagedRuns).toHaveLength(5);
      expect(result.pagedRuns[0].id).toBe('sim-5');
      expect(result.pagedRuns[4].id).toBe('sim-9');
    });

    it('should handle partial last page', () => {
      const runs = createRuns(12);
      const result = paginateArchiveRuns(runs, 3, 5);
      expect(result.pageCount).toBe(3);
      expect(result.safePage).toBe(3);
      expect(result.pagedRuns).toHaveLength(2);
    });

    it('should clamp to last page when page exceeds count', () => {
      const runs = createRuns(10);
      const result = paginateArchiveRuns(runs, 99, 5);
      expect(result.pageCount).toBe(2);
      expect(result.safePage).toBe(2);
      expect(result.pagedRuns).toHaveLength(5);
    });

    it('should handle empty runs', () => {
      const result = paginateArchiveRuns([], 1, 5);
      expect(result.pageCount).toBe(1);
      expect(result.safePage).toBe(1);
      expect(result.pagedRuns).toHaveLength(0);
    });

    it('should handle single page', () => {
      const runs = createRuns(3);
      const result = paginateArchiveRuns(runs, 1, 5);
      expect(result.pageCount).toBe(1);
      expect(result.safePage).toBe(1);
      expect(result.pagedRuns).toHaveLength(3);
    });
  });
});
