import fs from 'fs';
import crypto from 'crypto';

const AGENTS_PATH = './AGENTS.md';
const TOKEN_PATH = './.agents-ack';

function hashFile(path) {
  const content = fs.readFileSync(path, 'utf8');
  return crypto.createHash('sha256').update(content).digest('hex');
}

function main() {
  if (!fs.existsSync(TOKEN_PATH)) {
    console.error('Missing .agents-ack. Run: npm run agents:ack');
    process.exit(1);
  }
  const [tokenHash] = fs.readFileSync(TOKEN_PATH, 'utf8').split('\n');
  const currentHash = hashFile(AGENTS_PATH);
  if (tokenHash !== currentHash) {
    console.error('AGENTS.md has changed. Run: npm run agents:ack');
    process.exit(1);
  }
  process.exit(0);
}

main();
