import { describe, it, expect } from 'vitest';
import { useStrategyWizardState } from './useStrategyWizardState';

describe('useStrategyWizardState', () => {
  it('should export useStrategyWizardState function', () => {
    expect(useStrategyWizardState).toBeDefined();
    expect(typeof useStrategyWizardState).toBe('function');
  });
});
