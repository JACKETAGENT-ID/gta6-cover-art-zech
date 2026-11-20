// Hands this entry in (Node 22, standard library only): it stages a copy
// of the app and its screenshots under the output folder, then writes the
// dossier the judge reads, using the vendored make.fun library.
// Run it outside the grader with MAKEFUN_OUTPUT_DIR standing in for
// /output, e.g. `mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts`.
// It runs twice in grading and must write identical bytes both times.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outputDir, { recursive: true });
cpSync(join(repoRoot, 'app'), join(outputDir, 'app'), { recursive: true });
mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
const shotsDir = join(repoRoot, 'screenshots');
if (existsSync(shotsDir)) {
  cpSync(shotsDir, join(outputDir, 'screenshots'), { recursive: true });
}

// The caps mirror the scorer's own limits: at most four screenshots of
// 256 KiB each, an app/ of at most 993 files and 48 MiB, and a dossier
// text of at most 160 KiB. Exceeding one refuses the entry outright.
writeFileSync(
  join(outputDir, 'dossier.json'),
  buildDossier(outputDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
    app_path_max_bytes: 1000,
  }),
);
