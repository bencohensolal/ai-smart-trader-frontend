import { useCallback, useEffect, useState } from 'react';
import type { InvestmentStrategy } from './types';
import { buildDefaultStrategy } from './defaults';

const STORAGE_KEY = 'ai-smart-trader:strategies-v2';

/** Read strategies from localStorage */
function readFromStorage(): InvestmentStrategy[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed as InvestmentStrategy[];
      }
    }
  } catch {
    // Corrupted data — fall back to defaults
  }
  return [buildDefaultStrategy()];
}

/** Write strategies to localStorage */
function writeToStorage(strategies: InvestmentStrategy[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(strategies));
}

// ── In-memory listeners for cross-component sync ────────────────────────────
type Listener = () => void;
const listeners = new Set<Listener>();
let currentStrategies: InvestmentStrategy[] | null = null;

function getStrategiesSnapshot(): InvestmentStrategy[] {
  if (!currentStrategies) {
    currentStrategies = readFromStorage();
  }
  return currentStrategies;
}

function notifyListeners(): void {
  for (const listener of listeners) {
    listener();
  }
}

/** Shared hook to access and mutate strategy list across pages */
export function useStrategyStore(): {
  strategies: InvestmentStrategy[];
  setStrategies: (
    updater: InvestmentStrategy[] | ((prev: InvestmentStrategy[]) => InvestmentStrategy[]),
  ) => void;
} {
  const [strategies, setLocal] = useState<InvestmentStrategy[]>(getStrategiesSnapshot);

  // Subscribe to changes from other components
  useEffect(() => {
    const listener = (): void => {
      setLocal(getStrategiesSnapshot());
    };
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const setStrategies = useCallback(
    (updater: InvestmentStrategy[] | ((prev: InvestmentStrategy[]) => InvestmentStrategy[])) => {
      const next = typeof updater === 'function' ? updater(getStrategiesSnapshot()) : updater;
      currentStrategies = next;
      writeToStorage(next);
      notifyListeners();
    },
    [],
  );

  return { strategies, setStrategies };
}

/** Reset in-memory cache — for testing only */
export function _resetStoreCache(): void {
  currentStrategies = null;
  listeners.clear();
}
