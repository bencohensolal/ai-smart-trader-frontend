import { describe, it, expect } from 'vitest';
import { useSimulationSessionTracking } from './useSimulationSessionTracking';

describe('useSimulationSessionTracking', () => {
  it('should export useSimulationSessionTracking function', () => {
    expect(useSimulationSessionTracking).toBeDefined();
    expect(typeof useSimulationSessionTracking).toBe('function');
  });
});
