import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useStrategyStore, _resetStoreCache } from './strategyStore';
import { buildDefaultStrategy } from './defaults';

const STORAGE_KEY = 'ai-smart-trader:strategies-v2';

beforeEach(() => {
  localStorage.removeItem(STORAGE_KEY);
  _resetStoreCache();
});

describe('useStrategyStore', () => {
  it('returns default strategy when localStorage is empty', () => {
    const { result } = renderHook(() => useStrategyStore());
    expect(result.current.strategies).toHaveLength(1);
    expect(result.current.strategies[0].id).toBe('default_balanced_btc_eth');
  });

  it('reads strategies from localStorage', () => {
    const strategy = { ...buildDefaultStrategy(), id: 'stored-1', name: 'Stored' };
    localStorage.setItem(STORAGE_KEY, JSON.stringify([strategy]));
    const { result } = renderHook(() => useStrategyStore());
    expect(result.current.strategies).toHaveLength(1);
    expect(result.current.strategies[0].name).toBe('Stored');
  });

  it('falls back to defaults on corrupted localStorage', () => {
    localStorage.setItem(STORAGE_KEY, 'not-valid-json');
    const { result } = renderHook(() => useStrategyStore());
    expect(result.current.strategies).toHaveLength(1);
    expect(result.current.strategies[0].id).toBe('default_balanced_btc_eth');
  });

  it('falls back to defaults on empty array in localStorage', () => {
    localStorage.setItem(STORAGE_KEY, '[]');
    const { result } = renderHook(() => useStrategyStore());
    expect(result.current.strategies).toHaveLength(1);
  });

  it('setStrategies with array persists to localStorage', () => {
    const { result } = renderHook(() => useStrategyStore());
    const newStrategy = { ...buildDefaultStrategy(), id: 'new-1', name: 'New' };
    act(() => {
      result.current.setStrategies([newStrategy]);
    });
    expect(result.current.strategies).toHaveLength(1);
    expect(result.current.strategies[0].name).toBe('New');
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
    expect(stored).toHaveLength(1);
    expect(stored[0].name).toBe('New');
  });

  it('setStrategies with updater function works', () => {
    const { result } = renderHook(() => useStrategyStore());
    const extra = { ...buildDefaultStrategy(), id: 'extra-1', name: 'Extra' };
    act(() => {
      result.current.setStrategies((prev) => [...prev, extra]);
    });
    expect(result.current.strategies).toHaveLength(2);
    expect(result.current.strategies[1].name).toBe('Extra');
  });

  it('syncs between two hook instances via listeners', () => {
    const { result: hook1 } = renderHook(() => useStrategyStore());
    const { result: hook2 } = renderHook(() => useStrategyStore());
    const newStrategy = { ...buildDefaultStrategy(), id: 'sync-1', name: 'Synced' };
    act(() => {
      hook1.current.setStrategies([newStrategy]);
    });
    expect(hook2.current.strategies).toHaveLength(1);
    expect(hook2.current.strategies[0].name).toBe('Synced');
  });

  it('cleans up listener on unmount', () => {
    const { result, unmount } = renderHook(() => useStrategyStore());
    expect(result.current.strategies).toHaveLength(1);
    unmount();
    // After unmount, setting strategies should not crash
    const { result: hook2 } = renderHook(() => useStrategyStore());
    act(() => {
      hook2.current.setStrategies([
        { ...buildDefaultStrategy(), id: 'after-unmount', name: 'After' },
      ]);
    });
    expect(hook2.current.strategies[0].name).toBe('After');
  });
});
