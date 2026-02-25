import { formatIsoDate, parseIsoDate, shiftDateDays } from '../../dateUtils';
import { AdvancedPeriodDraft } from './datePresets';

export function computeMainPeriodPreset(
  periodEnd: string,
  days: number,
): {
  periodStart: string;
  periodEnd: string;
} {
  const anchor = parseIsoDate(periodEnd) ?? new Date();
  const nextEnd = formatIsoDate(anchor);
  const nextStart = formatIsoDate(shiftDateDays(anchor, -(days - 1)));

  return {
    periodStart: nextStart,
    periodEnd: nextEnd,
  };
}

export function computeAdvancedPeriodPreset(
  currentPeriods: AdvancedPeriodDraft[],
  index: number,
  days: number,
  fallbackStart: string,
): AdvancedPeriodDraft[] {
  const next = [...currentPeriods];
  const currentPeriod = next[index];
  if (!currentPeriod) {
    return currentPeriods;
  }

  const anchorStart =
    parseIsoDate(currentPeriod.periodStart) ??
    parseIsoDate(fallbackStart) ??
    /* v8 ignore next */ new Date();

  next[index] = {
    ...currentPeriod,
    periodStart: formatIsoDate(anchorStart),
    periodEnd: formatIsoDate(shiftDateDays(anchorStart, days - 1)),
  };

  return next;
}

export function computeAbComparisonPeriodPreset(
  periodEnd: string,
  days: number,
): {
  periodStart: string;
  periodEnd: string;
} {
  const anchor = parseIsoDate(periodEnd) ?? new Date();
  const nextEnd = formatIsoDate(anchor);
  const nextStart = formatIsoDate(shiftDateDays(anchor, -(days - 1)));

  return {
    periodStart: nextStart,
    periodEnd: nextEnd,
  };
}
