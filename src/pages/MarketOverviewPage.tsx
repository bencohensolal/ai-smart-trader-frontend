import { useI18n } from '../i18n/i18n';

export function MarketOverviewPage() {
  const { t } = useI18n();
  return (
    <div>
      <h1>{t('auto.market_overview')}</h1>
    </div>
  );
}
