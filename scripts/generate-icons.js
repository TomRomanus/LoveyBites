import sharp from 'sharp';
import { readFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const svg = readFileSync(join(root, 'public', 'favicon.svg'));

mkdirSync(join(root, 'public', 'icons'), { recursive: true });

for (const size of [192, 512]) {
  await sharp(svg).resize(size, size).png().toFile(join(root, 'public', 'icons', `icon-${size}.png`));
  console.log(`Generated icon-${size}.png`);
}
