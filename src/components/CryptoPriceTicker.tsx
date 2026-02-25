import { useEffect, useState } from 'react';
import { STRATEGY_SYMBOLS, StrategySymbol } from '../api';
import { formatAmountFromEur } from '../currency';
import { getCryptoSpotPrice } from '../api';

interface CryptoPriceTickerProps {
  initialSymbol?: string;
}

export function CryptoPriceTicker({ initialSymbol }: CryptoPriceTickerProps) {
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
        if (active) setError('Erreur de récupération du cours');
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
            aria-label={`Voir le cours de ${s}`}
          >
            {s}
          </button>
        ))}
      </div>
      <div className="crypto-price">
        {loading ? (
          <span>Chargement…</span>
        ) : error ? (
          <span style={{ color: 'red' }}>{error}</span>
        ) : price !== null ? (
          <span>
            {symbol} : <strong>{formatAmountFromEur(price)}</strong>
          </span>
        ) : null}
      </div>
    </div>
  );
}
