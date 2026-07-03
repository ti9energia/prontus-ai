/**
 * Process Mari's photoreal assets into optimized, web-ready PNGs.
 *
 * Mirrors scripts/process-assets.mjs: the raw renders live in a local folder on
 * the owner's machine (not in git — they're 1–2 MB each); this script resizes +
 * compresses them (sharp) into public/assets/mari/, which IS committed.
 *
 * Source names are tolerated loosely — the owner's exports arrived as
 * `mari-avatar.png.png` / `favicon.png` etc., so each asset tries a few
 * candidate filenames. Run: `node scripts/process-mari.mjs` (override the
 * source dir with MARI_SRC=/path).
 */
import sharp from 'sharp';
import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const SRC = process.env.MARI_SRC || 'C:/Users/engen/OneDrive/Desktop/mari';
const OUT = 'public/assets/mari';

/** First existing candidate under SRC, or null. */
function pick(candidates) {
  for (const c of candidates) {
    const p = join(SRC, c);
    if (existsSync(p)) return p;
  }
  return null;
}

const JOBS = [
  {
    name: 'mari-avatar.png',
    from: ['mari-avatar.png', 'mari-avatar.png.png', 'avatar.png'],
    // Square portrait for chat/dock/FAB/console (shown up to ~200px in the
    // owner "meeting" portrait, so 512 keeps it crisp on retina).
    apply: (img) => img.resize(512, 512, { fit: 'cover', position: 'attention' }),
  },
  {
    name: 'mari-full.png',
    from: ['mari-full.png', 'mari-full.png.png', 'full.png'],
    // Full body for landing/onboarding/empty states — cap width, keep aspect.
    apply: (img) => img.resize({ width: 768, withoutEnlargement: true }),
  },
  {
    name: 'mari-favicon.png',
    from: ['mari-favicon.png', 'favicon.png'],
    apply: (img) => img.resize(64, 64, { fit: 'cover', position: 'attention' }),
  },
  {
    name: 'mari-referencia.png',
    from: ['mari-referencia.png', 'referencia.png', 'reference.png'],
    optional: true, // design reference only — skip silently if absent
    apply: (img) => img.resize({ width: 768, withoutEnlargement: true }),
  },
];

mkdirSync(OUT, { recursive: true });

let done = 0;
for (const job of JOBS) {
  const src = pick(job.from);
  if (!src) {
    if (job.optional) {
      console.log(`· skip   ${job.name} (source not found — optional)`);
      continue;
    }
    console.error(`✗ MISSING ${job.name} — looked for: ${job.from.join(', ')} in ${SRC}`);
    process.exitCode = 1;
    continue;
  }
  const out = join(OUT, job.name);
  await job
    .apply(sharp(src))
    .png({ compressionLevel: 9, quality: 90, effort: 10 })
    .toFile(out);
  const meta = await sharp(out).metadata();
  console.log(`✓ ${job.name.padEnd(20)} ${meta.width}×${meta.height}  ←  ${src.split(/[\\/]/).pop()}`);
  done += 1;
}

console.log(`\nDone: ${done}/${JOBS.length} assets → ${OUT}/`);
