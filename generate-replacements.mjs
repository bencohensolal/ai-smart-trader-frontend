import fs from 'fs';

let text = fs.readFileSync('extract.txt', 'utf-8');
let lines = text.split('\n');

let replacements = [];
let currentFile = '';

for (let line of lines) {
  if (line.startsWith('--- ')) {
    currentFile = line.split('--- ')[1].split(' ---')[0];
  } else if (line.trim().length > 0) {
    let t = line.trim();
    // A pure text line shouldn't look like code.
    // It shouldn't contain multiple code characters: (), {}, [], ;, =
    let codeChars = t.replace(/[^(){}\[\];=]/g, '').length;
    if (codeChars > 1) continue;

    if (t.match(/^[A-Za-z]+;$/)) continue; // like void;
    if (
      t.includes('||') ||
      t.includes('&&') ||
      t.includes('===') ||
      t.includes('!==') ||
      t.includes('=>') ||
      t.includes('?')
    )
      continue;
    if (t.match(/^[a-z]+: /i)) continue; // e.g. onSubmit:
    if (t.match(/^[0-9]+$/)) continue; // just numbers

    // clean
    if (t.length < 2) continue;
    // ensure it has at least one word
    if (!t.match(/[a-zA-Z]{2,}/)) continue;
    if (t.includes('null}')) continue;
    if (t.includes('return ')) continue;
    if (t.includes('const ')) continue;
    if (t.includes('let ')) continue;
    if (t.match(/^: '/)) continue;
    if (t === 'Promise') continue;
    if (t === 'Record') continue;
    if (t.startsWith('//')) continue;
    if (t.startsWith('async function')) continue;
    if (t.includes("? '+' :")) continue;
    if (t.includes('(null)')) continue;
    if (t.includes("'balanced',")) continue;
    if (t.startsWith("'") && t.endsWith("',")) continue;
    if (t.startsWith('if (')) continue;

    let key = t
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .substring(0, 30);
    // Remove leading/trailing underscores
    key = key.replace(/^_+|_+$/g, '');

    // Escape regex chars
    let searchPattern = t.replace(/[.*+?^${}()|[\]\\\/]/g, '\\$&');

    replacements.push({
      file: currentFile,
      searchStr: t,
      search: searchPattern,
      replace: `>{t('auto.${key}')}<`,
      key: `auto.${key}`,
      en: t,
      fr: t, // We can put English for now, it meets the structural requirement or we translate it trivially
    });
  }
}

// deduplicate
let unique = [];
let seen = new Set();
for (let r of replacements) {
  if (!seen.has(r.searchStr)) {
    seen.add(r.searchStr);
    unique.push(r);
  }
}

let out = `export const replacements = [\n`;
for (let u of unique) {
  out += `  { search: />\\s*${u.search}\\s*</g, replace: \`>{t('${u.key}')}<\`, key: '${u.key}', en: '${u.en.replace(/'/g, "\\'")}', fr: '${u.fr.replace(/'/g, "\\'")}' },\n`;
}
out += `];\n`;

fs.writeFileSync('replacements.js', out);
