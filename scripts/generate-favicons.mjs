import sharp from 'sharp';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const source = join(root, 'public', 'Aura_logo_BG.png');
const publicDir = join(root, 'public');
const appDir = join(root, 'app');

async function writePng(outPath, size) {
  await sharp(source)
    .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(outPath);
  console.log('wrote', outPath);
}

async function main() {
  await writePng(join(publicDir, 'favicon-32.png'), 32);
  await writePng(join(publicDir, 'favicon-192.png'), 192);
  await writePng(join(publicDir, 'apple-touch-icon.png'), 180);
  await writePng(join(publicDir, 'icon-192.png'), 192);
  await writePng(join(publicDir, 'icon-512.png'), 512);
  await writePng(join(appDir, 'icon.png'), 512);
  await writePng(join(appDir, 'apple-icon.png'), 180);
  await sharp(source)
    .resize(32, 32, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(join(publicDir, 'favicon.ico'));
  console.log('wrote favicon.ico (png)');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
