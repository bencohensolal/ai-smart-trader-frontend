# Testing Strategy

## Current Status

This project has a comprehensive testing infrastructure set up with Vitest and React Testing Library.

### Test Coverage Goal: 100%

The project is configured to require 100% test coverage for:

- Branches
- Functions
- Lines
- Statements

### Tests Generated

An automated test generation script (`generate-tests.mjs`) has been created that generates stub tests for all source files without existing tests.

To regenerate all stub tests:

```bash
node generate-tests.mjs
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run quality checks (format, lint, tests)
npm run quality:check
```

### Test Files Structure

- `src/**/*.test.ts` - Unit tests for TypeScript modules
- `src/**/*.test.tsx` - Tests for React components
- `src/test/setup.ts` - Global test setup with mocks

### Key Test Utilities

- **Vitest** - Fast unit test framework
- **@testing-library/react** - React component testing
- **@testing-library/jest-dom** - Custom matchers
- **jsdom** - Browser environment simulation

### Writing Quality Tests

For 100% coverage, each file needs tests that:

1. **Import and execute all exports**
2. **Test all branches** (if/else, switch, ternary)
3. **Test all functions** with various inputs
4. **Cover error handling** paths
5. **Mock external dependencies** (API calls, localStorage, etc.)

### Mock Strategy

Common mocks are set up in `src/test/setup.ts`:

- `localStorage` - Mocked globally
- `fetch` - Mocked with vi.fn()

Component tests should mock:

- `react-router-dom` - useNavigate, useLocation, useParams
- `../i18n/i18n` - useI18n hook
- API calls - Mock responses

### Example Quality Test

```typescript
import { describe, it, expect, vi } from 'vitest';
import { myFunction } from './myModule';

describe('myModule', () => {
  it('should handle success case', () => {
    const result = myFunction('valid');
    expect(result).toBe('expected');
  });

  it('should handle error case', () => {
    expect(() => myFunction(null)).toThrow();
  });

  it('should cover all branches', () => {
    expect(myFunction('a')).toBe('resultA');
    expect(myFunction('b')).toBe('resultB');
  });
});
```

### Next Steps for 100% Coverage

1. Review generated stub tests
2. Replace stubs with real assertions
3. Add test cases for all code paths
4. Mock complex dependencies properly
5. Test edge cases and error handling
6. Verify coverage report shows 100%

### Coverage Report

After running tests, view detailed coverage:

```bash
open coverage/index.html
```

## Test Quality Standards

All tests must:

- ✅ Have clear, descriptive names
- ✅ Test one concept per test case
- ✅ Be independent (no test interdependencies)
- ✅ Clean up after themselves
- ✅ Use proper assertions
- ✅ Mock external dependencies
- ✅ Cover happy paths AND error cases
