import { useCallback, useState } from 'react';
import type { InvestmentStrategy, RiskLevel, StrategyListItem, StrategyPerformance } from './types';
import { buildEmptyStrategy, getDefaultsByRisk } from './defaults';
import { useStrategyStore } from './strategyStore';

type PageView = 'list' | 'form';

/** Minimal unique id generator (production would use uuid) */
function generateId(): string {
  return `strat_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function toListItem(s: InvestmentStrategy): StrategyListItem {
  return {
    id: s.id,
    name: s.name,
    riskLevel: s.riskLevel,
    monthlyBudget: s.monthlyBudget,
    maxCapitalExposure: s.maxCapitalExposure,
    isActive: s.isActive,
    mode: s.mode,
    simulatedRoiPercent: null,
    maxDrawdownPercent: s.maxDrawdownPercent,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
  };
}

export function useStrategyForm() {
  const [view, setView] = useState<PageView>('list');
  const { strategies, setStrategies } = useStrategyStore();
  const [editingStrategy, setEditingStrategy] = useState<InvestmentStrategy | null>(null);
  const [performance, setPerformance] = useState<StrategyPerformance | null>(null);
  const [backtestRunning, setBacktestRunning] = useState(false);
  const [status, setStatus] = useState<{ kind: 'success' | 'error'; message: string } | null>(null);
  const [killSwitchActive, setKillSwitchActive] = useState(false);

  // ── List items derived from full strategies ────────────────────────────
  const listItems: StrategyListItem[] = strategies.map(toListItem);

  // ── Create new strategy ────────────────────────────────────────────────
  const handleCreate = useCallback(() => {
    const defaults = buildEmptyStrategy();
    const now = new Date().toISOString();
    const newStrategy: InvestmentStrategy = {
      ...defaults,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    };
    setEditingStrategy(newStrategy);
    setPerformance(null);
    setStatus(null);
    setView('form');
  }, []);

  // ── Edit existing strategy ─────────────────────────────────────────────
  const handleEdit = useCallback(
    (id: string) => {
      const found = strategies.find((s) => s.id === id);
      if (found) {
        setEditingStrategy({ ...found });
        setPerformance(null);
        setStatus(null);
        setView('form');
      }
    },
    [strategies],
  );

  // ── Duplicate strategy ─────────────────────────────────────────────────
  const handleDuplicate = useCallback(
    (id: string) => {
      const found = strategies.find((s) => s.id === id);
      if (found) {
        const now = new Date().toISOString();
        const copy: InvestmentStrategy = {
          ...found,
          id: generateId(),
          name: `${found.name} (copy)`,
          isActive: false,
          createdAt: now,
          updatedAt: now,
        };
        setStrategies((prev) => [...prev, copy]);
        setStatus({ kind: 'success', message: `Strategy "${copy.name}" duplicated` });
      }
    },
    [strategies],
  );

  // ── Delete strategy ────────────────────────────────────────────────────
  const handleDelete = useCallback(
    (id: string) => {
      const found = strategies.find((s) => s.id === id);
      if (!found) return;
      const confirmed = window.confirm(`Delete strategy "${found.name}"?`);
      if (!confirmed) return;
      setStrategies((prev) => prev.filter((s) => s.id !== id));
      setStatus({ kind: 'success', message: `Strategy "${found.name}" deleted` });
    },
    [strategies],
  );

  // ── Toggle active/inactive ─────────────────────────────────────────────
  const handleToggleActive = useCallback((id: string) => {
    setStrategies((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        return { ...s, isActive: !s.isActive, updatedAt: new Date().toISOString() };
      }),
    );
  }, []);

  // ── Apply risk preset to editing strategy ──────────────────────────────
  const handleRiskChange = useCallback(
    (riskLevel: RiskLevel) => {
      /* c8 ignore next */
      if (!editingStrategy) return;
      const defaults = getDefaultsByRisk(riskLevel);
      setEditingStrategy((prev) => {
        /* c8 ignore next */
        if (!prev) return prev;
        return {
          ...prev,
          ...defaults,
          // Preserve identity fields
          id: prev.id,
          name: prev.name,
          description: prev.description,
          createdAt: prev.createdAt,
          updatedAt: prev.updatedAt,
        };
      });
    },
    [editingStrategy],
  );

  // ── Update editing strategy field(s) ───────────────────────────────────
  const handleChange = useCallback(
    (patch: Partial<InvestmentStrategy>) => {
      setEditingStrategy((prev) => {
        if (!prev) return prev;
        const updated = { ...prev, ...patch };
        // If risk level changed, apply preset
        if (patch.riskLevel && patch.riskLevel !== prev.riskLevel) {
          handleRiskChange(patch.riskLevel);
          return prev; // handleRiskChange will update
        }
        return updated;
      });
    },
    [handleRiskChange],
  );

  // ── Save (create or update) ────────────────────────────────────────────
  const handleSave = useCallback(() => {
    if (!editingStrategy) return;
    if (!editingStrategy.name.trim()) {
      setStatus({ kind: 'error', message: 'Strategy name is required' });
      return;
    }
    if (editingStrategy.allowedAssets.length === 0) {
      setStatus({ kind: 'error', message: 'Select at least one allowed asset' });
      return;
    }

    const now = new Date().toISOString();
    const updated = { ...editingStrategy, updatedAt: now };
    const exists = strategies.some((s) => s.id === updated.id);

    if (exists) {
      setStrategies((prev) =>
        prev.map((s) => {
          if (s.id !== updated.id) return s;
          return updated;
        }),
      );
      setStatus({ kind: 'success', message: `Strategy "${updated.name}" saved` });
    } else {
      setStrategies((prev) => [...prev, updated]);
      setStatus({ kind: 'success', message: `Strategy "${updated.name}" created` });
    }

    setEditingStrategy(null);
    setView('list');
  }, [editingStrategy, strategies]);

  // ── Cancel editing ─────────────────────────────────────────────────────
  const handleCancel = useCallback(() => {
    setEditingStrategy(null);
    setPerformance(null);
    setStatus(null);
    setView('list');
  }, []);

  // ── Kill switch ────────────────────────────────────────────────────────
  const handleKillSwitch = useCallback(() => {
    const confirmed = window.confirm('EMERGENCY: Deactivate ALL strategies immediately?');
    if (!confirmed) return;
    setStrategies((prev) =>
      prev.map((s) => ({ ...s, isActive: false, updatedAt: new Date().toISOString() })),
    );
    setKillSwitchActive(true);
    setStatus({ kind: 'error', message: 'Kill switch activated — all strategies deactivated' });
  }, []);

  // ── Run backtest (stub — actual implementation calls backend) ──────────
  const handleRunBacktest = useCallback(() => {
    if (!editingStrategy) return;
    setBacktestRunning(true);
    // Simulate async backtest call
    setTimeout(() => {
      setPerformance({
        strategyId: editingStrategy.id,
        totalReturnPercent: Math.random() * 40 - 10,
        monthlyReturnPercent: Math.random() * 8 - 2,
        maxDrawdownPercent: Math.random() * 20 + 5,
        winRate: Math.random() * 0.4 + 0.4,
        totalTrades: Math.floor(Math.random() * 100) + 10,
        aiReliabilityScore: Math.random() * 0.3 + 0.6,
        sharpeRatio: Math.random() * 2 + 0.5,
      });
      setBacktestRunning(false);
    }, 1500);
  }, [editingStrategy]);

  return {
    view,
    listItems,
    editingStrategy,
    performance,
    backtestRunning,
    status,
    killSwitchActive,
    handleCreate,
    handleEdit,
    handleDuplicate,
    handleDelete,
    handleToggleActive,
    handleChange,
    handleSave,
    handleCancel,
    handleKillSwitch,
    handleRunBacktest,
  };
}
