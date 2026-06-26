import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const staircaseDest = join(root, 'public', 'staircase');
const occtDest = join(root, 'public', 'occt');

const postModule = resolve(root, '../../../staircase/web/staircase-module-post.js');
const buildDir = resolve(root, '../../../staircase/build/staircase');
const occtDist = join(root, 'node_modules', 'occt-import-js', 'dist');
const occtJs = join(occtDist, 'occt-import-js.js');
const occtWasm = join(occtDist, 'occt-import-js.wasm');

mkdirSync(staircaseDest, { recursive: true });
mkdirSync(occtDest, { recursive: true });

let staircaseAvailable = false;

if (existsSync(postModule)) {
  cpSync(postModule, join(staircaseDest, 'staircase-module-post.js'));
  console.log('Copied staircase-module-post.js');
}

if (existsSync(join(buildDir, 'staircase.js'))) {
  for (const file of ['staircase.js', 'staircase.wasm', 'staircase.worker.js']) {
    const src = join(buildDir, file);
    if (existsSync(src)) {
      cpSync(src, join(staircaseDest, file));
      console.log(`Copied ${file}`);
    }
  }
  staircaseAvailable = true;
} else {
  console.warn('Staircase WASM build not found — STEP preview will use OCCT until you run `make` in staircase/');
}

writeFileSync(
  join(staircaseDest, 'manifest.json'),
  JSON.stringify({ available: staircaseAvailable }, null, 2)
);

if (existsSync(occtJs)) {
  cpSync(occtJs, join(occtDest, 'occt-import-js.js'));
  console.log('Copied occt-import-js.js');
} else {
  console.warn('occt-import-js.js not found in node_modules');
}

if (existsSync(occtWasm)) {
  cpSync(occtWasm, join(occtDest, 'occt-import-js.wasm'));
  console.log('Copied occt-import-js.wasm');
} else {
  console.warn('occt-import-js.wasm not found in node_modules');
}
