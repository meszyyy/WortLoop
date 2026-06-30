// Rasterizes public/logo-icon.svg into the PWA icon set + favicon.
// Run with: node scripts/generate-icons.mjs
// Icons are flattened onto the dark brand background so they stay full-bleed
// (no transparent corners) and work as `maskable` icons.

import sharp from 'sharp';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const SVG = fileURLToPath(new URL('../public/logo-icon.svg', import.meta.url));
const ICONS_DIR = fileURLToPath(new URL('../public/icons/', import.meta.url));
const PUBLIC_DIR = fileURLToPath(new URL('../public/', import.meta.url));
const BG = '#0b0f0a';
const SIZES = [72, 96, 128, 144, 152, 192, 384, 512];

const svg = await readFile(SVG);

const render = (size) =>
  sharp(svg, { density: 384 })
    .resize(size, size, { fit: 'contain', background: BG })
    .flatten({ background: BG })
    .png();

for (const size of SIZES) {
  await render(size).toFile(`${ICONS_DIR}icon-${size}x${size}.png`);
  console.log(`icon-${size}x${size}.png`);
}

await render(48).toFile(`${PUBLIC_DIR}favicon.png`);
console.log('favicon.png');
console.log('Done.');
