import fs from 'fs';
import crypto from 'crypto';

const AGENTS_PATH = './AGENTS.md';
const TOKEN_PATH = './.agents-ack';

function hashFile(path) {
  const content = fs.readFileSync(path, 'utf8');
  return crypto.createHash('sha256').update(content).digest('hex');
}

function main() {
  const hash = hashFile(AGENTS_PATH);
  const timestamp = new Date().toISOString();
  fs.writeFileSync(TOKEN_PATH, `${hash}\n${timestamp}\n`);
  console.log(`AGENTS.md acknowledged: ${hash} @ ${timestamp}`);
}

main();
