// main.ts — The Meridian Vault, handed in (Node 22, standard library only).
//
// The game lives in game/ as plain static files a desktop browser plays
// offline, and the screenshots live in screenshots/. This program copies
// both into the grader's output directory and writes dossier.json, the
// summary the judge reads, with the vendored make.fun library.
//
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Refuse to hand in an incomplete entry: the game must exist, and so
// must its screenshots. Failing here is kinder than failing at the gate.
if (!existsSync(join(here, 'game', 'index.html'))) {
  throw new Error('game/index.html is missing — the entry is incomplete.');
}
if (!existsSync(join(here, 'screenshots')) || !existsSync(join(here, 'screenshots', '1-start.jpg'))) {
  throw new Error('screenshots/ is missing its cover — take the screenshots first.');
}

// Start from an empty output directory so a stale file from an earlier
// run can never ride along into the entry. Only the contents are
// removed, never the directory itself: the grader mounts the output
// directory, and removing a mount point fails (EPERM) — that is what
// failed round 1.
mkdirSync(out, { recursive: true });
for (const entry of readdirSync(out)) {
  rmSync(join(out, entry), { recursive: true, force: true });
}

cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

// The caps are the scorer's own: the dossier text is capped at 160 KiB,
// screenshots at 4 files of 256 KiB, game/ at 993 files and 48 MiB with
// no path over 1000 bytes. An entry over any of them is refused here
// instead of at the gate. The dossier is deterministic: the same game
// and screenshots always produce the same bytes, so the grader's two
// runs agree.
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);
