import { Dispatch, SetStateAction, useEffect } from 'react';
import {
  AdvancedBacktestingComparisonResult,
  AdvancedBacktestingResult,
  AdvancedBacktestingRunSession,
  getAdvancedBacktestingRunSession,
  getHistoricalSimulationRunSession,
  HistoricalSimulationRunSession,
  HistoricalSimulationSummary,
  isUnauthorizedError,
} from '../../api';

const integer = new Intl.NumberFormat('fr-FR');

type StatusKind = 'success' | 'error';

type UseSimulationSessionTrackingParams = {
  runSession: HistoricalSimulationRunSession | null;
  setRunSession: Dispatch<SetStateAction<HistoricalSimulationRunSession | null>>;
  setRuns: Dispatch<SetStateAction<HistoricalSimulationSummary[]>>;
  setRunning: Dispatch<SetStateAction<boolean>>;
  setShowRunProgressModal: Dispatch<SetStateAction<boolean>>;
  advancedRunSession: AdvancedBacktestingRunSession | null;
  setAdvancedRunSession: Dispatch<SetStateAction<AdvancedBacktestingRunSession | null>>;
  setAdvancedBacktestResult: Dispatch<SetStateAction<AdvancedBacktestingResult | null>>;
  setAdvancedBacktestComparisonResult: Dispatch<
    SetStateAction<AdvancedBacktestingComparisonResult | null>
  >;
  advancedProgressLiveAiRequested: boolean;
  setStatusKind: Dispatch<SetStateAction<StatusKind>>;
  setStatus: Dispatch<SetStateAction<string>>;
  onUnauthorized: () => void;
};

export function useSimulationSessionTracking({
  runSession,
  setRunSession,
  setRuns,
  setRunning,
  setShowRunProgressModal,
  advancedRunSession,
  setAdvancedRunSession,
  setAdvancedBacktestResult,
  setAdvancedBacktestComparisonResult,
  advancedProgressLiveAiRequested,
  setStatusKind,
  setStatus,
  onUnauthorized,
}: UseSimulationSessionTrackingParams): void {
  useEffect(() => {
    const sessionId = advancedRunSession?.progress.sessionId ?? '';
    const sessionStatus = advancedRunSession?.progress.status;
    if (!sessionId || sessionStatus === 'completed' || sessionStatus === 'failed') {
      return;
    }

    let cancelled = false;
    const pollSession = async (): Promise<void> => {
      try {
        const payload = await getAdvancedBacktestingRunSession(sessionId);
        if (cancelled) {
          return;
        }
        const session = payload.session;
        setAdvancedRunSession(session);

        if (session.progress.status === 'completed') {
          const aiCallsByTab = session.progress.aiCallsByLabel;
          const totalLiveAiCalls = aiCallsByTab.reduce((sum, value) => {
            return sum + value;
          }, 0);
          if (session.result?.kind === 'multi_period') {
            setAdvancedBacktestResult(session.result.backtest);
            setStatusKind('success');
            setStatus(
              advancedProgressLiveAiRequested
                ? `Advanced backtesting completed. Live AI calls: ${integer.format(totalLiveAiCalls)}.`
                : 'Advanced backtesting completed.',
            );
          } else if (session.result?.kind === 'comparison') {
            setAdvancedBacktestComparisonResult(session.result.comparison);
            setStatusKind('success');
            setStatus(
              advancedProgressLiveAiRequested
                ? `A/B testing comparison completed. Live AI calls: ${integer.format(totalLiveAiCalls)}.`
                : 'A/B testing comparison completed.',
            );
          } else {
            setStatusKind('error');
            setStatus('Advanced simulation completed without usable result.');
          }
          return;
        }

        if (session.progress.status === 'failed') {
          setStatusKind('error');
          setStatus(
            session.progress.errorMessage
              ? `Advanced simulation failed: ${session.progress.errorMessage}`
              : 'Advanced simulation failed.',
          );
        }
      } catch (error) {
        if (cancelled) {
          return;
        }
        if (isUnauthorizedError(error)) {
          onUnauthorized();
          return;
        }
        setStatusKind('error');
        setStatus(
          error instanceof Error
            ? `Advanced simulation tracking failed: ${error.message}`
            : 'Advanced simulation tracking failed.',
        );
        setAdvancedRunSession((current) => {
          if (!current) {
            return null;
          }
          return {
            ...current,
            progress: {
              ...current.progress,
              status: 'failed',
              errorMessage: error instanceof Error ? error.message : 'tracking-failed',
            },
          };
        });
      }
    };

    void pollSession();
    const timer = window.setInterval(() => {
      void pollSession();
    }, 1200);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [
    advancedProgressLiveAiRequested,
    advancedRunSession?.progress.sessionId,
    advancedRunSession?.progress.status,
    onUnauthorized,
    setAdvancedBacktestComparisonResult,
    setAdvancedBacktestResult,
    setAdvancedRunSession,
    setStatus,
    setStatusKind,
  ]);

  useEffect(() => {
    const sessionId = runSession?.progress.sessionId ?? '';
    const sessionStatus = runSession?.progress.status;
    if (!sessionId || sessionStatus === 'completed' || sessionStatus === 'failed') {
      return;
    }

    let cancelled = false;
    const pollSession = async (): Promise<void> => {
      try {
        const payload = await getHistoricalSimulationRunSession(sessionId);
        if (cancelled) {
          return;
        }
        const session = payload.session;
        setRunSession(session);

        if (session.progress.status === 'completed') {
          if (session.result) {
            const completedRun = session.result.run;
            setRuns((current) => [
              completedRun,
              ...current.filter((row) => row.id !== completedRun.id),
            ]);
            setStatusKind('success');
            setStatus('Simulation completed and archived.');
          } else {
            setStatusKind('error');
            setStatus('Simulation completed without a usable result.');
          }
          setRunning(false);
          setShowRunProgressModal(false);
          setRunSession(null);
          return;
        }

        if (session.progress.status === 'failed') {
          setRunning(false);
          setStatusKind('error');
          setStatus(
            session.progress.errorMessage
              ? `Simulation failed: ${session.progress.errorMessage}`
              : 'Simulation failed.',
          );
        }
      } catch (error) {
        if (cancelled) {
          return;
        }
        if (isUnauthorizedError(error)) {
          onUnauthorized();
          return;
        }
        setRunning(false);
        setStatusKind('error');
        setStatus(
          error instanceof Error
            ? `Simulation tracking failed: ${error.message}`
            : 'Simulation tracking failed.',
        );
        setRunSession((current) => {
          if (!current) {
            return null;
          }
          return {
            ...current,
            progress: {
              ...current.progress,
              status: 'failed',
              errorMessage: error instanceof Error ? error.message : 'tracking-failed',
            },
          };
        });
      }
    };

    void pollSession();
    const timer = window.setInterval(() => {
      void pollSession();
    }, 1200);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [
    onUnauthorized,
    runSession?.progress.sessionId,
    runSession?.progress.status,
    setRunSession,
    setRuns,
    setRunning,
    setShowRunProgressModal,
    setStatus,
    setStatusKind,
  ]);
}
