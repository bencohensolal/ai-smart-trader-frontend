export type AdvancedPeriodDraft = {
  periodStart: string;
  periodEnd: string;
};

export function resolveDefaultPeriodStart(): string {
  const now = new Date();
  now.setUTCMonth(now.getUTCMonth() - 6);
  return now.toISOString().slice(0, 10);
}

export function resolveDefaultPeriodEnd(): string {
  return new Date().toISOString().slice(0, 10);
}

export function buildDefaultAdvancedPeriods(): AdvancedPeriodDraft[] {
  return [
    {
      periodStart: resolveDateOffsetDays(-720),
      periodEnd: resolveDateOffsetDays(-540),
    },
    {
      periodStart: resolveDateOffsetDays(-539),
      periodEnd: resolveDateOffsetDays(-360),
    },
    {
      periodStart: resolveDateOffsetDays(-359),
      periodEnd: resolveDateOffsetDays(-180),
    },
  ];
}

function resolveDateOffsetDays(offsetDays: number): string {
  const now = new Date();
  now.setUTCDate(now.getUTCDate() + offsetDays);
  return now.toISOString().slice(0, 10);
}
