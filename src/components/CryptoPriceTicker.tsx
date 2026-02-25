import { useEffect, useState } from 'react';
import { STRATEGY_SYMBOLS, StrategySymbol } from '../api';
import { formatAmountFromEur } from '../currency';
import { getCryptoSpotPrice } from '../api';
import { useI18n } from '../i18n/i18n';

interface CryptoPriceTickerProps {
  initialSymbol?: string;
}

export function CryptoPriceTicker({ initialSymbol }: CryptoPriceTickerProps) {
  const { t } = useI18n();
  const [symbol, setSymbol] = useState<StrategySymbol>(
    (initialSymbol as StrategySymbol) || STRATEGY_SYMBOLS[0],
  );
  const [price, setPrice] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    getCryptoSpotPrice(symbol)
      .then((p) => {
        if (active) setPrice(p);
      })
      .catch(() => {
        if (active) setError(t('cryptoPriceTicker.error'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [symbol]);

  return (
    <div className="crypto-price-ticker">
      <div className="crypto-switcher">
        {STRATEGY_SYMBOLS.map((s) => (
          <button
            key={s}
            className={s === symbol ? 'active' : ''}
            onClick={() => setSymbol(s)}
            aria-label={t('cryptoPriceTicker.switch', { symbol: s })}
          >
            {s}
          </button>
        ))}
      </div>
      <div className="crypto-price">
        {loading ? (
          <span>{t('cryptoPriceTicker.loading')}</span>
        ) : error ? (
          <span style={{ color: 'red' }}>{error}</span>
        ) : price !== null ? (
          <span>{t('cryptoPriceTicker.price', { symbol, price: formatAmountFromEur(price) })}</span>
        ) : null}
      </div>
    </div>
  );
}
