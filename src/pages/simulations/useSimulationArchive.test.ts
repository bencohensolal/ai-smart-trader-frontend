import { describe, it, expect } from 'vitest';
import { useSimulationArchive } from './useSimulationArchive';

describe('useSimulationArchive', () => {
  it('should export useSimulationArchive function', () => {
    expect(useSimulationArchive).toBeDefined();
    expect(typeof useSimulationArchive).toBe('function');
  });
});
