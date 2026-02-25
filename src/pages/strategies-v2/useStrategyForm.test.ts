import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useStrategyForm } from './useStrategyForm';
import { _resetStoreCache } from './strategyStore';

const STORAGE_KEY = 'ai-smart-trader:strategies-v2';

beforeEach(() => {
  localStorage.removeItem(STORAGE_KEY);
  _resetStoreCache();
  vi.restoreAllMocks();
});

describe('useStrategyForm', () => {
  it('starts in list view with one default strategy', () => {
    const { result } = renderHook(() => useStrategyForm());
    expect(result.current.view).toBe('list');
    expect(result.current.listItems).toHaveLength(1);
    expect(result.current.editingStrategy).toBeNull();
  });

  it('handleCreate switches to form view with a new strategy', () => {
    const { result } = renderHook(() => useStrategyForm());
    act(() => {
      result.current.handleCreate();
    });
    expect(result.current.view).toBe('form');
    expect(result.current.editingStrategy).not.toBeNull();
    expect(result.current.editingStrategy?.id).toContain('strat_');
  });

  it('handleSave adds new strategy to list', () => {
    const { result } = renderHook(() => useStrategyForm());
    act(() => {
      result.current.handleCreate();
    });
    act(() => {
      result.current.handleChange({ name: 'Test Strategy' });
    });
    act(() => {
      result.current.handleSave();
    });
    expect(result.current.view).toBe('list');
    expect(result.current.listItems).toHaveLength(2);
    expect(result.current.status?.kind).toBe('success');
  });

  it('handleSave rejects empty name', () => {
    const { result } = renderHook(() => useStrategyForm());
    act(() => {
      result.current.handleCreate();
    });
    act(() => {
      result.current.handleChange({ name: '' });
    });
    act(() => {
      result.current.handleSave();
    });
    expect(result.current.status?.kind).toBe('error');
    expect(result.current.view).toBe('form');
  });

  it('handleSave rejects empty allowedAssets', () => {
    const { result } = renderHook(() => useStrategyForm());
    act(() => {
      result.current.handleCreate();
    });
    act(() => {
      result.current.handleChange({ name: 'Valid', allowedAssets: [] });
    });
    act(() => {
      result.current.handleSave();
    });
    expect(result.current.status?.kind).toBe('error');
  });

  it('handleEdit loads an existing strategy into the form', () => {
    const { result } = renderHook(() => useStrategyForm());
    const firstId = result.current.listItems[0].id;
    act(() => {
      result.current.handleEdit(firstId);
    });
    expect(result.current.view).toBe('form');
    expect(result.current.editingStrategy?.id).toBe(firstId);
  });

  it('handleEdit does nothing for unknown id', () => {
    const { result } = renderHook(() => useStrategyForm());
    act(() => {
      result.current.handleEdit('nonexistent');
    });
    expect(result.current.view).toBe('list');
  });

  it('handleDuplicate creates a copy', () => {
    const { result } = renderHook(() => useStrategyForm());
    const firstId = result.current.listItems[0].id;
    act(() => {
      result.current.handleDuplicate(firstId);
    });
    expect(result.current.listItems).toHaveLength(2);
    expect(result.current.listItems[1].name).toContain('(copy)');
  });

  it('handleDuplicate does nothing for unknown id', () => {
    const { result } = renderHook(() => useStrategyForm());
    act(() => {
      result.current.handleDuplicate('nonexistent');
    });
    expect(result.current.listItems).toHaveLength(1);
  });

  it('handleDelete removes a strategy after confirmation', () => {
    const { result } = renderHook(() => useStrategyForm());
    // Add a second strategy first
    act(() => {
      result.current.handleCreate();
    });
    act(() => {
      result.current.handleChange({ name: 'To Delete' });
    });
    act(() => {
      result.current.handleSave();
    });
    expect(result.current.listItems).toHaveLength(2);

    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const deleteId = result.current.listItems[1].id;
    act(() => {
      result.current.handleDelete(deleteId);
    });
    expect(result.current.listItems).toHaveLength(1);
  });

  it('handleDelete does nothing when user cancels', () => {
    const { result } = renderHook(() => useStrategyForm());
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    const firstId = result.current.listItems[0].id;
    act(() => {
      result.current.handleDelete(firstId);
    });
    expect(result.current.listItems).toHaveLength(1);
  });

  it('handleDelete does nothing for unknown id', () => {
    const { result } = renderHook(() => useStrategyForm());
    act(() => {
      result.current.handleDelete('nonexistent');
    });
    expect(result.current.listItems).toHaveLength(1);
  });

  it('handleToggleActive toggles isActive and leaves others unchanged', () => {
    const { result } = renderHook(() => useStrategyForm());
    // Add a second strategy
    const firstId = result.current.listItems[0].id;
    act(() => {
      result.current.handleDuplicate(firstId);
    });
    expect(result.current.listItems).toHaveLength(2);

    const wasActive0 = result.current.listItems[0].isActive;
    const wasActive1 = result.current.listItems[1].isActive;
    act(() => {
      result.current.handleToggleActive(firstId);
    });
    expect(result.current.listItems[0].isActive).toBe(!wasActive0);
    expect(result.current.listItems[1].isActive).toBe(wasActive1);
  });

  it('handleCancel returns to list view', () => {
    const { result } = renderHook(() => useStrategyForm());
    act(() => {
      result.current.handleCreate();
    });
    expect(result.current.view).toBe('form');
    act(() => {
      result.current.handleCancel();
    });
    expect(result.current.view).toBe('list');
    expect(result.current.editingStrategy).toBeNull();
  });

  it('handleChange updates editing strategy fields', () => {
    const { result } = renderHook(() => useStrategyForm());
    act(() => {
      result.current.handleCreate();
    });
    act(() => {
      result.current.handleChange({ name: 'Updated' });
    });
    expect(result.current.editingStrategy?.name).toBe('Updated');
  });

  it('handleChange with riskLevel triggers risk preset', () => {
    const { result } = renderHook(() => useStrategyForm());
    act(() => {
      result.current.handleCreate();
    });
    act(() => {
      result.current.handleChange({ riskLevel: 'HIGH' });
    });
    expect(result.current.editingStrategy?.riskLevel).toBe('HIGH');
  });

  it('handleChange with same riskLevel does not trigger preset', () => {
    const { result } = renderHook(() => useStrategyForm());
    act(() => {
      result.current.handleCreate();
    });
    const currentRisk = result.current.editingStrategy?.riskLevel;
    act(() => {
      result.current.handleChange({ riskLevel: currentRisk, name: 'Same Risk' });
    });
    expect(result.current.editingStrategy?.name).toBe('Same Risk');
  });

  it('handleChange does nothing when not editing', () => {
    const { result } = renderHook(() => useStrategyForm());
    act(() => {
      result.current.handleChange({ name: 'Should not crash' });
    });
    expect(result.current.editingStrategy).toBeNull();
  });

  it('handleSave does nothing when not editing', () => {
    const { result } = renderHook(() => useStrategyForm());
    act(() => {
      result.current.handleSave();
    });
    expect(result.current.listItems).toHaveLength(1);
  });

  it('handleSave updates existing strategy with multiple strategies', () => {
    const { result } = renderHook(() => useStrategyForm());
    // Add a second strategy first
    const firstId = result.current.listItems[0].id;
    act(() => {
      result.current.handleDuplicate(firstId);
    });
    expect(result.current.listItems).toHaveLength(2);

    // Edit the first strategy
    act(() => {
      result.current.handleEdit(firstId);
    });
    act(() => {
      result.current.handleChange({ name: 'Renamed' });
    });
    act(() => {
      result.current.handleSave();
    });
    expect(result.current.listItems[0].name).toBe('Renamed');
    expect(result.current.listItems).toHaveLength(2);
    expect(result.current.status?.message).toContain('saved');
  });

  it('handleKillSwitch deactivates all strategies', () => {
    const { result } = renderHook(() => useStrategyForm());
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    act(() => {
      result.current.handleKillSwitch();
    });
    expect(result.current.killSwitchActive).toBe(true);
    for (const item of result.current.listItems) {
      expect(item.isActive).toBe(false);
    }
  });

  it('handleKillSwitch does nothing when user cancels', () => {
    const { result } = renderHook(() => useStrategyForm());
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    act(() => {
      result.current.handleKillSwitch();
    });
    expect(result.current.killSwitchActive).toBe(false);
  });

  it('handleRunBacktest sets performance after delay', async () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useStrategyForm());
    act(() => {
      result.current.handleCreate();
    });
    act(() => {
      result.current.handleChange({ name: 'Backtest' });
    });
    act(() => {
      result.current.handleRunBacktest();
    });
    expect(result.current.backtestRunning).toBe(true);
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(result.current.backtestRunning).toBe(false);
    expect(result.current.performance).not.toBeNull();
    vi.useRealTimers();
  });

  it('handleRunBacktest does nothing when not editing', () => {
    const { result } = renderHook(() => useStrategyForm());
    act(() => {
      result.current.handleRunBacktest();
    });
    expect(result.current.backtestRunning).toBe(false);
  });
});
