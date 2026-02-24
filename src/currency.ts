export type DisplayCurrency = 'EUR' | 'USD' | 'GBP' | 'CHF';

const DISPLAY_CURRENCY_STORAGE_KEY = 'ai-smart-trader.display-currency';

const EUR_CONVERSION_RATES: Record<DisplayCurrency, number> = {
  EUR: 1,
  USD: 1.09,
  GBP: 0.86,
  CHF: 0.95,
};

const formatterCache = new Map<string, Intl.NumberFormat>();

export function getStoredDisplayCurrency(): DisplayCurrency {
  const raw = localStorage.getItem(DISPLAY_CURRENCY_STORAGE_KEY);
  if (raw === 'USD' || raw === 'GBP' || raw === 'CHF' || raw === 'EUR') {
    return raw;
  }
  return 'EUR';
}

export function applyDisplayCurrency(currency: DisplayCurrency): void {
  localStorage.setItem(DISPLAY_CURRENCY_STORAGE_KEY, currency);
}

export function convertEurToDisplayCurrency(
  amountEur: number,
  currency: DisplayCurrency,
): number {
  return amountEur * EUR_CONVERSION_RATES[currency];
}

export function formatAmountFromEur(
  amountEur: number,
  input?: {
    locale?: string;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  },
): string {
  const currency = getStoredDisplayCurrency();
  const convertedAmount = convertEurToDisplayCurrency(amountEur, currency);
  const locale = input?.locale ?? 'fr-FR';
  const key = `${locale}-${currency}-${input?.minimumFractionDigits ?? ''}-${input?.maximumFractionDigits ?? ''}`;
  const formatter =
    formatterCache.get(key) ??
    new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: input?.minimumFractionDigits,
      maximumFractionDigits: input?.maximumFractionDigits,
    });
  formatterCache.set(key, formatter);
  return formatter.format(convertedAmount);
}
