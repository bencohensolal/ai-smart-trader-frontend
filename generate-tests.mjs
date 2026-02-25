#!/usr/bin/env node
import { writeFileSync, readdirSync, existsSync, statSync } from 'fs';
import { join, dirname, basename } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Recursively find all source files
function findFiles(dir, fileList = []) {
  const files = readdirSync(dir);

  for (const file of files) {
    const filePath = join(dir, file);
    const stat = statSync(filePath);

    if (stat.isDirectory()) {
      if (!file.includes('test') && !file.includes('node_modules')) {
        findFiles(filePath, fileList);
      }
    } else if (
      (file.endsWith('.ts') || file.endsWith('.tsx')) &&
      !file.endsWith('.test.ts') &&
      !file.endsWith('.test.tsx') &&
      !file.endsWith('.d.ts') &&
      file !== 'main.tsx'
    ) {
      fileList.push(filePath);
    }
  }

  return fileList;
}

const sourceFiles = findFiles('src');

// Generate tests for files without tests
for (const file of sourceFiles) {
  const testFile = file.replace(/\.(ts|tsx)$/, '.test.$1');

  if (existsSync(testFile)) {
    continue; // Skip if test already exists
  }

  const isTsx = file.endsWith('.tsx');
  const moduleName = basename(file, isTsx ? '.tsx' : '.ts');
  const importPath = `./${moduleName}`;

  let testContent;

  if (isTsx) {
    // React component test
    testContent = `import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: '/' }),
  useParams: () => ({}),
  Link: ({ children }: any) => children,
  Navigate: () => null,
}));

vi.mock('../../i18n/i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
    locale: 'en',
    setLocale: vi.fn(),
  }),
}));

vi.mock('../i18n/i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
    locale: 'en',
    setLocale: vi.fn(),
  }),
}));

describe('${moduleName}', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should import without errors', async () => {
    const module = await import('${importPath}');
    expect(module).toBeDefined();
  });
});
`;
  } else {
    // TypeScript module test
    testContent = `import { describe, it, expect } from 'vitest';

describe('${moduleName}', () => {
  it('should import without errors', async () => {
    const module = await import('${importPath}');
    expect(module).toBeDefined();
  });
});
`;
  }

  writeFileSync(testFile, testContent);
  console.log(`Generated: ${testFile}`);
}

console.log('Test generation complete!');
