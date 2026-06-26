// One-off: turn the source brand PNGs into optimized app icons.
// The favicon symbol is transparent, so we trim it tight and re-center it on a
// square canvas — transparent for the favicon/in-app mark, dark-bg for apple/PWA.
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';

const SRC = 'C:/Users/engen/OneDrive/Documents/aureon';
mkdirSync('public/brand', { recursive: true });

const symbolBuf = await sharp(`${SRC}/Favicon.png`).trim().toBuffer();

async function make(size, out, bg) {
  const inner = await sharp(symbolBuf)
    .resize(Math.round(size * 0.8), Math.round(size * 0.8), {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .toBuffer();
  await sharp({
    create: { width: size, height: size, channels: 4, background: bg ?? { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([{ input: inner, gravity: 'centre' }])
    .png({ compressionLevel: 9 })
    .toFile(out);
}

await make(256, 'src/app/icon.png', null); // transparent favicon
await make(180, 'src/app/apple-icon.png', '#0b0e14'); // apple needs an opaque bg
await make(512, 'public/brand/icon-512.png', '#0b0e14'); // PWA maskable
await make(512, 'public/brand/symbol.png', null); // transparent mark for in-app Logo

console.log('icons written: src/app/icon.png, apple-icon.png, public/brand/{icon-512,symbol}.png');
