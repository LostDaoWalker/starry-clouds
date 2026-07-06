#!/usr/bin/env node
/**
 * Process GLAMOUR raster assets: black-key, trim, resize.
 * Usage: npm run assets:process
 */

import { readdir, stat } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";

const BLACK_THRESHOLD = 28;

function keyBlack(rgba, width, height) {
  for (let i = 0; i < width * height; i++) {
    const px = i * 4;
    if (
      rgba[px] <= BLACK_THRESHOLD &&
      rgba[px + 1] <= BLACK_THRESHOLD &&
      rgba[px + 2] <= BLACK_THRESHOLD
    ) {
      rgba[px + 3] = 0;
    }
  }
}

async function keyTrim(input) {
  const { data, info } = await sharp(input)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const rgba = Buffer.from(data);
  keyBlack(rgba, info.width, info.height);
  return sharp(rgba, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .trim({ threshold: 1 })
    .png()
    .toBuffer();
}

async function squareIcon(input, output, size = 128) {
  const trimmed = await keyTrim(input);
  const meta = await sharp(trimmed).metadata();
  const maxDim = Math.max(meta.width, meta.height);
  const padX = Math.floor((maxDim - meta.width) / 2);
  const padY = Math.floor((maxDim - meta.height) / 2);

  await sharp(trimmed)
    .extend({
      top: padY,
      bottom: maxDim - meta.height - padY,
      left: padX,
      right: maxDim - meta.width - padX,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9, palette: true })
    .toFile(output);

  const out = await stat(output);
  console.log(`✓ icon ${output} (${(out.size / 1024).toFixed(1)} KB)`);
}

async function enemySprite(input, output, maxH) {
  const trimmed = await keyTrim(input);
  await sharp(trimmed)
    .resize({ height: maxH, fit: "inside" })
    .png({ compressionLevel: 9 })
    .toFile(output);
  const out = await stat(output);
  console.log(`✓ enemy ${output} h≤${maxH} (${(out.size / 1024).toFixed(1)} KB)`);
}

async function processIconDir(dir) {
  const files = (await readdir(dir))
    .filter((f) => f.startsWith("icon-") && f.endsWith(".png"))
    .sort();
  for (const file of files) {
    await squareIcon(join(dir, file), join(dir, file));
  }
  return files.length;
}

async function processEnemyDir(dir) {
  const sizes = {
    "enemy-minion": 200,
    "enemy-rival": 280,
    "enemy-paparazzo": 280,
    "enemy-critic": 280,
    "enemy-boss": 340,
  };

  const files = (await readdir(dir))
    .filter((f) => f.startsWith("enemy-") && f.endsWith(".png"))
    .sort();

  for (const file of files) {
    const key = file.replace(/\.png$/, "");
    const maxH = sizes[key] ?? 280;
    await enemySprite(join(dir, file), join(dir, file), maxH);
  }
  return files.length;
}

async function main() {
  const iconCount = await processIconDir("public/icons");
  const enemyCount = await processEnemyDir("public/enemies");

  const appSrc = "public/app-icon.png";
  try {
    await stat(appSrc);
    const trimmed = await keyTrim(appSrc);
    await sharp(trimmed)
      .resize(512, 512, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(appSrc);
    await sharp(trimmed)
      .resize(192, 192, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile("public/favicon.png");
    console.log("✓ app-icon + favicon");
  } catch {
    console.log("⊘ no app-icon.png");
  }

  console.log(`\nProcessed ${iconCount} icon(s), ${enemyCount} enemy(s)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
