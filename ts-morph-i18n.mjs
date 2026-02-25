import { Project, SyntaxKind } from 'ts-morph';
import * as fs from 'fs';

const project = new Project({
  tsConfigFilePath: './tsconfig.json',
});

const enPath = './src/i18n/en.ts';
const frPath = './src/i18n/fr.ts';
let enContent = fs.readFileSync(enPath, 'utf-8');
let frContent = fs.readFileSync(frPath, 'utf-8');

let addedKeys = new Map();

function addKey(text) {
  const key =
    text
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .substring(0, 30) +
    '_' +
    Math.random().toString(36).substring(2, 6);

  // Add to mapping
  addedKeys.set(key, text.trim());
  return key;
}

for (const sourceFile of project.getSourceFiles('src/**/*.{tsx,ts}')) {
  let modified = false;
  let hasI18n = sourceFile
    .getImportDeclarations()
    .some((imp) => imp.getModuleSpecifierValue().includes('i18n/i18n'));
  let usesI18nHook = false;

  // Traverse the AST to find JSX text and literal strings in specific contexts (like label={""})
  sourceFile.forEachDescendant((node) => {
    if (node.getKind() === SyntaxKind.JsxText) {
      const text = node.getText();
      if (/[a-zA-Z]/.test(text) && text.trim().length > 0) {
        const trimmed = text.trim();
        const key = addKey(trimmed);
        node.replaceWithText(`{t('${key}')}`);
        modified = true;
        usesI18nHook = true;
      }
    }
  });

  if (modified) {
    // Find main component to inject `const { t } = useI18n();`
    const functions = sourceFile.getFunctions();
    for (const func of functions) {
      if (func.isExported() && func.getName() && func.getName().match(/^[A-Z]/)) {
        // Check if it already has useI18n
        if (!func.getBodyText().includes('useI18n')) {
          func.insertStatements(0, 'const { t } = useI18n();');
        }
      }
    }

    if (!hasI18n) {
      const depth =
        sourceFile.getFilePath().split('/').length -
        project.getCompilerOptions().rootDir?.split('/').length -
        1;
      const relativePath = depth > 0 ? '../'.repeat(depth) + 'i18n/i18n' : './i18n/i18n';
      sourceFile.addImportDeclaration({
        namedImports: ['useI18n'],
        moduleSpecifier: '../i18n/i18n', // We will simplify and fix this with exact path
      });
    }

    sourceFile.saveSync();
  }
}
