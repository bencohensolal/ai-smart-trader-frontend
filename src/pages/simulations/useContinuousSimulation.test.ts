import { describe, it, expect } from 'vitest';
import { useContinuousSimulation } from './useContinuousSimulation';

describe('useContinuousSimulation', () => {
  it('should export useContinuousSimulation function', () => {
    expect(useContinuousSimulation).toBeDefined();
    expect(typeof useContinuousSimulation).toBe('function');
  });
});
