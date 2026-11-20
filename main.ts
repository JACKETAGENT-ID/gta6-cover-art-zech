// Hands this entry in: copies the app and its screenshots into the
// output folder and writes the dossier the judge reads, using the
// vendored make.fun library. Node 22, standard library only, no
// network, no install step.
//
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
//
// Outside the grader MAKEFUN_OUTPUT_DIR stands in for /output. Run it
// twice and the two outputs are byte for byte the same.

import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// The gate's caps, repeated here so a bad build fails loudly instead
// of shipping an entry the scorer would refuse.
const CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
};

function countTree(dir) {
  let files = 0;
  let bytes = 0;
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) {
      const sub = countTree(p);
      files += sub.files;
      bytes += sub.bytes;
    } else {
      files += 1;
      bytes += st.size;
    }
  }
  return { files, bytes };
}

function copyTree(src, dst) {
  mkdirSync(dst, { recursive: true });
  cpSync(src, dst, { recursive: true });
}

function fail(msg) {
  throw new Error(`main.ts: ${msg}`);
}

// Start from a clean output folder so stale files can never leak in.
rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

const appDir = join(repoRoot, 'app');
if (!existsSync(join(appDir, 'index.html'))) fail('app/index.html is missing');
const appStats = countTree(appDir);
if (appStats.files > CAPS.app_max_files) fail(`app/ holds ${appStats.files} files, over the 993 cap`);
if (appStats.bytes > CAPS.app_max_bytes) fail(`app/ is ${appStats.bytes} bytes, over the 48 MiB cap`);
copyTree(appDir, join(outDir, 'app'));

const shotsDir = join(repoRoot, 'screenshots');
const shotNames = existsSync(shotsDir) ? readdirSync(shotsDir).filter((n) => !n.startsWith('.')) : [];
if (shotNames.length < 3 || shotNames.length > CAPS.screenshots.max) {
  fail(`screenshots/ holds ${shotNames.length} images, need 3 or 4`);
}
for (const name of shotNames) {
  if (statSync(join(shotsDir, name)).size > CAPS.screenshots.max_bytes) {
    fail(`screenshots/${name} is over the 256 KiB cap`);
  }
}
copyTree(shotsDir, join(outDir, 'screenshots'));

writeFileSync(join(outDir, 'dossier.json'), buildDossier(outDir, CAPS));
