import { describe, it, expect } from 'vitest';
import { CRYPTO_CATALOG, getDefaultCryptoSymbols, getDefaultAllocation } from './constants';

describe('strategy-wizard constants', () => {
  describe('CRYPTO_CATALOG', () => {
    it('should export catalog with 11 assets', () => {
      expect(CRYPTO_CATALOG).toHaveLength(11);
    });

    it('should include BTC with low risk', () => {
      const btc = CRYPTO_CATALOG.find((asset) => asset.symbol === 'BTC');
      expect(btc).toBeDefined();
      expect(btc?.risk).toBe('Low');
      expect(btc?.fees).toBe('Low');
      expect(btc?.thesis).toBeTruthy();
    });

    it('should include ETH with medium risk', () => {
      const eth = CRYPTO_CATALOG.find((asset) => asset.symbol === 'ETH');
      expect(eth).toBeDefined();
      expect(eth?.risk).toBe('Medium');
    });

    it('should include SOL with high risk', () => {
      const sol = CRYPTO_CATALOG.find((asset) => asset.symbol === 'SOL');
      expect(sol).toBeDefined();
      expect(sol?.risk).toBe('High');
    });

    it('should have thesis for all assets', () => {
      CRYPTO_CATALOG.forEach((asset) => {
        expect(asset.thesis).toBeTruthy();
        expect(asset.thesis.length).toBeGreaterThan(10);
      });
    });

    it('should have all required fields for each asset', () => {
      CRYPTO_CATALOG.forEach((asset) => {
        expect(asset.symbol).toBeTruthy();
        expect(asset.thesis).toBeTruthy();
        expect(['Low', 'Medium', 'High']).toContain(asset.risk);
        expect(['Low', 'Medium', 'High']).toContain(asset.fees);
      });
    });
  });

  describe('getDefaultCryptoSymbols', () => {
    it('should return all 11 symbols', () => {
      const symbols = getDefaultCryptoSymbols();
      expect(symbols).toHaveLength(11);
    });

    it('should include standard symbols', () => {
      const symbols = getDefaultCryptoSymbols();
      expect(symbols).toContain('BTC');
      expect(symbols).toContain('ETH');
      expect(symbols).toContain('SOL');
      expect(symbols).toContain('LINK');
      expect(symbols).toContain('USDC');
      expect(symbols).toContain('XRP');
      expect(symbols).toContain('DOGE');
      expect(symbols).toContain('AVAX');
      expect(symbols).toContain('POLKADOT');
      expect(symbols).toContain('ARB');
      expect(symbols).toContain('OP');
    });

    it('should return a new array each time', () => {
      const symbols1 = getDefaultCryptoSymbols();
      const symbols2 = getDefaultCryptoSymbols();
      expect(symbols1).toEqual(symbols2);
      expect(symbols1).not.toBe(symbols2);
    });
  });

  describe('getDefaultAllocation', () => {
    it('should return allocation object with all symbols', () => {
      const allocation = getDefaultAllocation();
      expect(Object.keys(allocation)).toHaveLength(11);
    });

    it('should have BTC at 50%', () => {
      const allocation = getDefaultAllocation();
      expect(allocation.BTC).toBe(50);
    });

    it('should have ETH at 30%', () => {
      const allocation = getDefaultAllocation();
      expect(allocation.ETH).toBe(30);
    });

    it('should have SOL at 10%', () => {
      const allocation = getDefaultAllocation();
      expect(allocation.SOL).toBe(10);
    });

    it('should have LINK at 10%', () => {
      const allocation = getDefaultAllocation();
      expect(allocation.LINK).toBe(10);
    });

    it('should have zero allocation for others', () => {
      const allocation = getDefaultAllocation();
      expect(allocation.USDC).toBe(0);
      expect(allocation.XRP).toBe(0);
      expect(allocation.DOGE).toBe(0);
      expect(allocation.AVAX).toBe(0);
      expect(allocation.POLKADOT).toBe(0);
      expect(allocation.ARB).toBe(0);
      expect(allocation.OP).toBe(0);
    });

    it('should sum to 100%', () => {
      const allocation = getDefaultAllocation();
      const sum = Object.values(allocation).reduce((acc, val) => acc + val, 0);
      expect(sum).toBe(100);
    });
  });
});
