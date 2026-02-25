import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC_DIR = path.join(__dirname, 'src');

// Regex to find things like >Some text<
// It needs to avoid matching >< or > < or >{...}<
const jsxTextRegex = />([^<>{]+)</g;

// Also look for quotes in JSX attributes? Like placeholder="Some text"
// Not strictly needed right now unless we want 100%. The prompt says 100%.
const attrRegex = /(placeholder|title|label)="([^"]*[a-zA-Z][^"]*)"/g;

function isEnglish(text) {
  return /[a-zA-Z]/.test(text) && text.trim().length > 0;
}

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  let changed = false;
  let matches = [];

  // we only want to process if there's no complex nesting, or we can just run regex
  // Let's print out what we would extract to see if it's safe.
  let newContent = content.replace(jsxTextRegex, (match, text) => {
    let trimmed = text.trim();
    if (isEnglish(trimmed)) {
      matches.push(trimmed);
      // we won't replace automatically yet, let's just log
    }
    return match;
  });

  if (matches.length > 0) {
    console.log(`\n--- ${filePath} ---`);
    matches.forEach((m) => console.log(`  ${m}`));
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walkDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      processFile(fullPath);
    }
  }
}

walkDir(path.join(SRC_DIR, 'components'));
walkDir(path.join(SRC_DIR, 'pages'));
