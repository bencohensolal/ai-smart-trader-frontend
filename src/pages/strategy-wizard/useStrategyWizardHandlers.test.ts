import { describe, it, expect } from 'vitest';
import { useStrategyWizardHandlers } from './useStrategyWizardHandlers';

describe('useStrategyWizardHandlers', () => {
  it('should export useStrategyWizardHandlers function', () => {
    expect(useStrategyWizardHandlers).toBeDefined();
    expect(typeof useStrategyWizardHandlers).toBe('function');
  });
});
