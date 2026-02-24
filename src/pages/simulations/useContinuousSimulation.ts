import { useEffect, useState } from 'react';
import { DashboardData, getDashboard, isUnauthorizedError } from '../../api';

type ContinuousSimulationState = {
  continuousModeEnabled: boolean;
  continuousIntervalMs: number;
  continuousSnapshot: DashboardData | null;
  continuousLoading: boolean;
  continuousError: string;
  continuousUpdatedAt: string;
  setContinuousIntervalMs: (next: number) => void;
  setContinuousModeEnabled: (enabled: boolean) => void;
  handleContinuousEnabledChange: (enabled: boolean) => void;
};

export function useContinuousSimulation(
  selectedStrategyId: string,
  onUnauthorized: () => void,
): ContinuousSimulationState {
  const [continuousModeEnabled, setContinuousModeEnabled] = useState(false);
  const [continuousIntervalMs, setContinuousIntervalMs] = useState(15000);
  const [continuousSnapshot, setContinuousSnapshot] = useState<DashboardData | null>(null);
  const [continuousLoading, setContinuousLoading] = useState(false);
  const [continuousError, setContinuousError] = useState('');
  const [continuousUpdatedAt, setContinuousUpdatedAt] = useState('');

  useEffect(() => {
    if (!continuousModeEnabled || !selectedStrategyId) {
      return;
    }

    let cancelled = false;

    const refreshSnapshot = async (): Promise<void> => {
      try {
        setContinuousLoading(true);
        const snapshot = await getDashboard(selectedStrategyId);
        if (cancelled) {
          return;
        }
        setContinuousSnapshot(snapshot);
        setContinuousUpdatedAt(new Date().toISOString());
        setContinuousError('');
      } catch (error) {
        if (cancelled) {
          return;
        }
        if (isUnauthorizedError(error)) {
          onUnauthorized();
          return;
        }
        setContinuousError(
          error instanceof Error
            ? error.message
            : 'Unable to refresh continuous paper trading mode.',
        );
      } finally {
        if (!cancelled) {
          setContinuousLoading(false);
        }
      }
    };

    void refreshSnapshot();
    const timer = window.setInterval(() => {
      void refreshSnapshot();
    }, continuousIntervalMs);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [continuousIntervalMs, continuousModeEnabled, onUnauthorized, selectedStrategyId]);

  const handleContinuousEnabledChange = (enabled: boolean): void => {
    setContinuousModeEnabled(enabled);
    if (!enabled) {
      setContinuousSnapshot(null);
      setContinuousError('');
    }
  };

  return {
    continuousModeEnabled,
    continuousIntervalMs,
    continuousSnapshot,
    continuousLoading,
    continuousError,
    continuousUpdatedAt,
    setContinuousIntervalMs,
    setContinuousModeEnabled,
    handleContinuousEnabledChange,
  };
}
