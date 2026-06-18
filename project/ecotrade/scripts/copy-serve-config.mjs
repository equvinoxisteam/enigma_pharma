import { copyFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const distDir = join(root, 'dist');
const config = join(root, 'serve.json');
const target = join(distDir, 'serve.json');

if (!existsSync(config)) {
  console.error('copy-serve-config: serve.json not found at', config);
  process.exit(1);
}

if (!existsSync(distDir)) {
  console.error('copy-serve-config: dist/ not found — run npm run build first');
  process.exit(1);
}

copyFileSync(config, target);
console.log('copy-serve-config: copied serve.json to dist/serve.json');
