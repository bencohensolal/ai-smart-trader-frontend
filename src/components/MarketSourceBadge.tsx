import { useEffect, useState } from 'react';
import { getMarketStatus, MarketDataSource } from '../api';
import { useI18n } from '../i18n/i18n';

const SOURCE_CONFIG: Record<MarketDataSource, { label: string; className: string }> = {
  kraken: { label: 'Kraken', className: 'market-source-badge--kraken' },
  coingecko: { label: 'CoinGecko', className: 'market-source-badge--coingecko' },
};

export function MarketSourceBadge(): JSX.Element | null {
  const { t } = useI18n();
  const [source, setSource] = useState<MarketDataSource | null>(null);

  useEffect(() => {
    let active = true;
    getMarketStatus()
      .then((status) => {
        if (active) {
          setSource(status.source);
        }
      })
      .catch(() => {
        // Silently ignore when market status is unavailable.
      });
    return () => {
      active = false;
    };
  }, []);

  if (!source) {
    return null;
  }

  const config = SOURCE_CONFIG[source];

  return (
    <span
      className={`market-source-badge ${config.className}`}
      title={t('marketSource.tooltip', { source: config.label })}
      aria-label={t('marketSource.tooltip', { source: config.label })}
    >
      {t('marketSource.label', { source: config.label })}
    </span>
  );
}
