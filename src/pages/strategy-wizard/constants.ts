import { CryptoCatalogAsset } from './types';

export const CRYPTO_CATALOG: CryptoCatalogAsset[] = [
  {
    symbol: 'BTC',
    thesis: 'Bitcoin - Most liquid reference asset, often used as a portfolio anchor.',
    risk: 'Low',
    fees: 'Low',
  },
  {
    symbol: 'ETH',
    thesis: 'Ethereum - Smart-contract leader with a broad ecosystem and strong liquidity.',
    risk: 'Medium',
    fees: 'Low',
  },
  {
    symbol: 'SOL',
    thesis: 'Solana - High-performance blockchain with strong momentum and larger swings.',
    risk: 'High',
    fees: 'Low',
  },
  {
    symbol: 'LINK',
    thesis: 'Chainlink - Core oracle infrastructure used by many protocols.',
    risk: 'Medium',
    fees: 'Low',
  },
  {
    symbol: 'USDC',
    thesis: 'USD Coin - Stablecoin used to keep a stable cash reserve and reduce volatility.',
    risk: 'Low',
    fees: 'Low',
  },
  {
    symbol: 'XRP',
    thesis:
      'XRP - Cross-border payments asset with moderate-to-high volatility depending on market cycle.',
    risk: 'Medium',
    fees: 'Low',
  },
  {
    symbol: 'DOGE',
    thesis: 'Dogecoin - Speculative asset driven by retail liquidity and fast price moves.',
    risk: 'High',
    fees: 'Low',
  },
  {
    symbol: 'AVAX',
    thesis: 'Avalanche - Performance-oriented ecosystem and DeFi apps, sensitive to momentum.',
    risk: 'High',
    fees: 'Low',
  },
  {
    symbol: 'POLKADOT',
    thesis:
      'Polkadot - Interoperable multi-chain network with a mid profile between growth and stability.',
    risk: 'Medium',
    fees: 'Low',
  },
  {
    symbol: 'ARB',
    thesis:
      'Arbitrum - Ethereum layer-2 ecosystem token exposed to fast scaling-segment rotations.',
    risk: 'High',
    fees: 'Low',
  },
  {
    symbol: 'OP',
    thesis:
      'Optimism - Ethereum layer-2 token focused on scalability, correlated with altcoin cycles.',
    risk: 'High',
    fees: 'Low',
  },
];

const DEFAULT_CRYPTO_SYMBOLS = [
  'BTC',
  'ETH',
  'SOL',
  'LINK',
  'USDC',
  'XRP',
  'DOGE',
  'AVAX',
  'POLKADOT',
  'ARB',
  'OP',
] as const;

export function getDefaultCryptoSymbols(): string[] {
  return [...DEFAULT_CRYPTO_SYMBOLS];
}

export function getDefaultAllocation(): Record<string, number> {
  return {
    BTC: 50,
    ETH: 30,
    SOL: 10,
    LINK: 10,
    USDC: 0,
    XRP: 0,
    DOGE: 0,
    AVAX: 0,
    POLKADOT: 0,
    ARB: 0,
    OP: 0,
  };
}
