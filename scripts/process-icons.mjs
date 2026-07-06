#!/usr/bin/env node
/**
 * Optimize GLAMOUR UI icons: key black backgrounds, trim, resize.
 *
 * Usage: npm run icons:process
 */

import { readdir, stat } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";

const INPUT = "public/icons";
const SIZE = 128;
const BLACK_THRESHOLD = 28;

function keyBlack(rgba, width, height) {
  for (let i = 0; i < width * height; i++) {
    const px = i * 4;
    const r = rgba[px];
    const g = rgba[px + 1];
    const b = rgba[px + 2];
    if (r <= BLACK_THRESHOLD && g <= BLACK_THRESHOLD && b <= BLACK_THRESHOLD) {
      rgba[px + 3] = 0;
    }
  }
}

async function processIcon(filePath) {
  const { data, info } = await sharp(filePath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const rgba = Buffer.from(data);
  keyBlack(rgba, info.width, info.height);

  const trimmed = await sharp(rgba, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .trim({ threshold: 1 })
    .png()
    .toBuffer();

  const meta = await sharp(trimmed).metadata();
  const maxDim = Math.max(meta.width, meta.height);
  const pad = Math.max(0, Math.floor((maxDim - meta.width) / 2));
  const padY = Math.max(0, Math.floor((maxDim - meta.height) / 2));

  await sharp(trimmed)
    .extend({
      top: padY,
      bottom: maxDim - meta.height - padY,
      left: pad,
      right: maxDim - meta.width - pad,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .resize(SIZE, SIZE, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9, palette: true })
    .toFile(filePath);

  const out = await stat(filePath);
  console.log(`✓ ${filePath} → ${SIZE}×${SIZE} (${(out.size / 1024).toFixed(1)} KB)`);
}

async function main() {
  const files = (await readdir(INPUT))
    .filter((f) => f.startsWith("icon-") && f.endsWith(".png"))
    .sort();

  if (files.length === 0) {
    console.error(`No icon-*.png files in ${INPUT}`);
    process.exit(1);
  }

  for (const file of files) {
    await processIcon(join(INPUT, file));
  }

  console.log(`\nProcessed ${files.length} icon(s)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
