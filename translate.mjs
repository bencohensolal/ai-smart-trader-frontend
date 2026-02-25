import fs from 'fs';
import path from 'path';

const SRC_DIR = './src';
const EN_PATH = './src/i18n/en.ts';
const FR_PATH = './src/i18n/fr.ts';

import { replacements } from './replacements.js';

let addedKeys = new Map();

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walkDir(fullPath);
    } else if (fullPath.endsWith('.tsx')) {
      let content = fs.readFileSync(fullPath, 'utf-8');
      let original = content;

      for (let r of replacements) {
        if (content.match(r.search)) {
          content = content.replace(r.search, r.replace);
          addedKeys.set(r.key, r);
        }
      }

      if (content !== original) {
        // Automatically import useI18n if not present, and instantiate it
        if (!content.includes('useI18n')) {
          // Find the last import
          const importMatch = [...content.matchAll(/import .* from .*;?\n/g)].pop();
          if (importMatch) {
            const index = importMatch.index + importMatch[0].length;
            // determine relative path to i18n
            const depth = fullPath.split('/').length - 3; // src is depth 0
            const relativePath = '../'.repeat(depth) + 'i18n/i18n';
            content =
              content.slice(0, index) +
              `import { useI18n } from '${relativePath}';\n` +
              content.slice(index);
          }
        }

        if (content.includes('useI18n') && !content.includes('const { t } = useI18n()')) {
          // Find the component declaration to inject const { t } = useI18n();
          // Match `export function ComponentName(...) {` where the `{` is the start of the function body.
          // Because of destructuring, we should just match until `) {` or `) : ... {`
          content = content.replace(
            /(export function [A-Za-z0-9_]+[^{]+(?:\{[^}]+\})?[^]*?\)(?:\s*:\s*[^{]+)?\s*\{\n)/,
            `$1  const { t } = useI18n();\n`,
          );
        }

        fs.writeFileSync(fullPath, content);
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

walkDir(path.join(SRC_DIR, 'components'));
walkDir(path.join(SRC_DIR, 'pages'));

// Update EN and FR files
if (addedKeys.size > 0) {
  let enContent = fs.readFileSync(EN_PATH, 'utf-8');
  let frContent = fs.readFileSync(FR_PATH, 'utf-8');

  let enAdditions = [];
  let frAdditions = [];

  for (let [k, r] of addedKeys.entries()) {
    if (!enContent.includes(`'${k}'`)) {
      enAdditions.push(`  '${k}': '${r.en.replace(/'/g, "\\'")}',`);
    }
    if (!frContent.includes(`'${k}'`)) {
      frAdditions.push(`  '${k}': '${r.fr.replace(/'/g, "\\'")}',`);
    }
  }

  if (enAdditions.length > 0) {
    enContent = enContent.replace(
      '} as const satisfies TranslationDictionary;',
      enAdditions.join('\n') + '\n} as const satisfies TranslationDictionary;',
    );
    fs.writeFileSync(EN_PATH, enContent);
  }
  if (frAdditions.length > 0) {
    frContent = frContent.replace('};\n', frAdditions.join('\n') + '\n};\n');
    fs.writeFileSync(FR_PATH, frContent);
  }

  console.log('Updated translation files');
}
