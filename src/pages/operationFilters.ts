import { OperationOutcomeFilter, OperationSideFilter } from '../api';

type OperationLike = {
  side: 'BUY' | 'SELL';
  status: 'FILLED' | 'REJECTED' | 'PENDING';
};

export function normalizeOperationSideFilter(
  value: string | null | undefined,
): OperationSideFilter {
  if (value === 'buy' || value === 'sell' || value === 'all') {
    return value;
  }
  return 'all';
}

export function normalizeOperationOutcomeFilter(
  value: string | null | undefined,
): OperationOutcomeFilter {
  if (value === 'successful' || value === 'failed' || value === 'all') {
    return value;
  }
  return 'successful';
}

export function matchesOperationFilters(
  operation: OperationLike,
  filters: {
    side: OperationSideFilter;
    outcome: OperationOutcomeFilter;
  },
): boolean {
  const matchesSide =
    filters.side === 'all' || operation.side === filters.side.toUpperCase();
  if (!matchesSide) {
    return false;
  }

  if (filters.outcome === 'all') {
    return true;
  }
  if (filters.outcome === 'successful') {
    return operation.status === 'FILLED';
  }
  return operation.status === 'REJECTED';
}

export function buildOperationFiltersQueryString(filters: {
  side: OperationSideFilter;
  outcome: OperationOutcomeFilter;
}): string {
  const query = new URLSearchParams();
  query.set('side', filters.side);
  query.set('outcome', filters.outcome);
  return query.toString();
}
