// Regenerates every derived brand icon from the one committed source asset
// (public/brand/symbol.png — transparent, so it composites cleanly onto any
// background). Portable: no external/local paths — safe to re-run by anyone
// who clones the repo, e.g. after the source mark itself is redesigned.
//
// Maskable icons (Android "adaptive icon" masking — circle/squircle/rounded
// square cropping) need real safe-zone padding, not just a relabeled "any"
// icon: this glyph's tips nearly touch the source canvas edges, so a naive
// reuse gets clipped by the mask. We scale the glyph to ~62% and composite it
// centered on an opaque background-color canvas, well inside the ~80% safe
// zone the spec recommends (https://www.w3.org/TR/appmanifest/#purpose-member).
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';

const SRC = 'public/brand/symbol.png';
const BG = '#090b0f'; // matches manifest.ts background_color / theme dark bg

mkdirSync('public/brand', { recursive: true });

async function solid(size, out, { scale = 1, bg = BG } = {}) {
  const glyphSize = Math.round(size * scale);
  const glyph = await sharp(SRC)
    .resize(glyphSize, glyphSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();
  await sharp({ create: { width: size, height: size, channels: 4, background: bg } })
    .composite([{ input: glyph, gravity: 'center' }])
    .png({ compressionLevel: 9 })
    .toFile(out);
  console.log('wrote', out);
}

async function transparent(size, out, scale = 0.8) {
  const glyphSize = Math.round(size * scale);
  const glyph = await sharp(SRC)
    .resize(glyphSize, glyphSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();
  await sharp({ create: { width: size, height: size, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: glyph, gravity: 'center' }])
    .png({ compressionLevel: 9 })
    .toFile(out);
  console.log('wrote', out);
}

// Favicon + Apple touch icon (Next.js metadata convention picks these up automatically).
await transparent(256, 'src/app/icon.png', 0.8);
await solid(180, 'src/app/apple-icon.png', { scale: 0.8 });

// PWA manifest icons — "any" (full-bleed, browser decides how much to crop) …
await solid(512, 'public/brand/icon-512.png', { scale: 0.86 });
await solid(192, 'public/brand/icon-192.png', { scale: 0.86 });
// … and "maskable" (real safe-zone padding for adaptive-icon masking).
await solid(512, 'public/brand/icon-maskable-512.png', { scale: 0.62 });
await solid(192, 'public/brand/icon-maskable-192.png', { scale: 0.62 });

console.log('done — public/brand/{icon-192,icon-512,icon-maskable-192,icon-maskable-512,symbol}.png, src/app/{icon,apple-icon}.png');
