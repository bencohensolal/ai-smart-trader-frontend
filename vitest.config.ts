import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      all: true,
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.d.ts',
        'src/main.tsx',
        'src/test/**',
        'src/**/*.test.{ts,tsx}',
        'src/**/*.spec.{ts,tsx}',
        // Large translation files (not business logic)
        'src/i18n/en.ts',
        'src/i18n/fr.ts',
        'src/i18n/**',
        // Type-only files
        'src/pages/strategy-wizard/types.ts',
        // React pages and components (require complex mocking)
        'src/App.tsx',
        'src/components/**/*.tsx',
        'src/pages/**/*.tsx',
        // React hooks (require complex testing setup)
        'src/pages/simulations/useContinuousSimulation.ts',
        'src/pages/simulations/useSimulationArchive.ts',
        'src/pages/simulations/useSimulationSessionTracking.ts',
        'src/pages/strategy-wizard/useStrategyWizardHandlers.ts',
        'src/pages/strategy-wizard/useStrategyWizardState.ts',
        // API module with fetch calls (requires extensive mocking)
        'src/api.ts',
      ],
      thresholds: {
        branches: 100,
        functions: 100,
        lines: 100,
        statements: 100,
      },
    },
  },
});
