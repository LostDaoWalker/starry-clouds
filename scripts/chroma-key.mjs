#!/usr/bin/env node
/**
 * Chroma-key pipeline for GLAMOUR walk-cycle sprites.
 *
 * 1. Remove solid #00FF00 green screen backgrounds
 * 2. Split horizontal sprite sheets into per-frame PNGs
 * 3. Emit a manifest JSON per class
 *
 * Usage:
 *   npm run sprites:process
 *   node scripts/chroma-key.mjs --input public/sprites/raw --output public/sprites/walk --frames 16
 */

import { mkdir, readdir, writeFile, unlink } from "node:fs/promises";
import { basename, join } from "node:path";
import sharp from "sharp";

const KEY = { r: 0, g: 255, b: 0 };
const DEFAULT_TOLERANCE = 90;
const DEFAULT_SPILL = 0.35;

function parseArgs(argv) {
  const opts = {
    input: "public/sprites/raw",
    output: "public/sprites/walk",
    frames: 16,
    tolerance: DEFAULT_TOLERANCE,
    spill: DEFAULT_SPILL,
  };

  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--input") opts.input = argv[++i];
    else if (arg === "--output") opts.output = argv[++i];
    else if (arg === "--frames") opts.frames = Number(argv[++i]);
    else if (arg === "--tolerance") opts.tolerance = Number(argv[++i]);
    else if (arg === "--spill") opts.spill = Number(argv[++i]);
    else if (arg === "--help") {
      console.log(`Usage: node scripts/chroma-key.mjs [options]

Options:
  --input <dir>       Source chroma-key sprite sheets (default: public/sprites/raw)
  --output <dir>      Processed transparent frames (default: public/sprites/walk)
  --frames <n>        Frames per horizontal sheet (default: 16)
  --tolerance <0-255> Green distance cutoff (default: ${DEFAULT_TOLERANCE})
  --spill <0-1>       Desaturate green spill on edges (default: ${DEFAULT_SPILL})
`);
      process.exit(0);
    }
  }

  return opts;
}

function colorDistance(r, g, b) {
  const dr = r - KEY.r;
  const dg = g - KEY.g;
  const db = b - KEY.b;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

function isGreenDominant(r, g, b, tolerance) {
  if (g < 80) return false;
  if (g <= r || g <= b) return false;
  return colorDistance(r, g, b) <= tolerance;
}

function applyChromaKey(rgba, width, height, tolerance, spill) {
  for (let i = 0; i < width * height; i++) {
    const px = i * 4;
    const r = rgba[px];
    const g = rgba[px + 1];
    const b = rgba[px + 2];

    if (isGreenDominant(r, g, b, tolerance)) {
      rgba[px + 3] = 0;
      continue;
    }

    if (g > r && g > b && spill > 0) {
      const greenness = Math.min(1, (g - Math.max(r, b)) / 128);
      rgba[px + 1] = Math.round(g * (1 - greenness * spill));
    }
  }
}

function extractFrame(rgba, sheetWidth, sheetHeight, left, frameWidth) {
  const frame = Buffer.alloc(frameWidth * sheetHeight * 4);

  for (let y = 0; y < sheetHeight; y++) {
    for (let x = 0; x < frameWidth; x++) {
      const src = ((y * sheetWidth) + (left + x)) * 4;
      const dst = ((y * frameWidth) + x) * 4;
      frame[dst] = rgba[src];
      frame[dst + 1] = rgba[src + 1];
      frame[dst + 2] = rgba[src + 2];
      frame[dst + 3] = rgba[src + 3];
    }
  }

  return frame;
}

async function normalizeFrames(outDir, frames) {
  const maxWidth = Math.max(...frames.map((f) => f.width));
  const maxHeight = Math.max(...frames.map((f) => f.height));

  for (const frame of frames) {
    const framePath = join(outDir, frame.file);
    const padded = await sharp(framePath)
      .extend({
        top: Math.floor((maxHeight - frame.height) / 2),
        bottom: Math.ceil((maxHeight - frame.height) / 2),
        left: Math.floor((maxWidth - frame.width) / 2),
        right: Math.ceil((maxWidth - frame.width) / 2),
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png()
      .toBuffer();

    await sharp(padded).toFile(framePath);
    frame.width = maxWidth;
    frame.height = maxHeight;
  }

  return { width: maxWidth, height: maxHeight };
}

async function processSheet(filePath, opts) {
  const className = basename(filePath)
    .replace(/-walk(-cycle)?/i, "")
    .replace(/\.[^.]+$/, "");
  const outDir = join(opts.output, className);
  await mkdir(outDir, { recursive: true });

  for (const entry of await readdir(outDir)) {
    if (/^frame-\d+\.png$/i.test(entry)) {
      await unlink(join(outDir, entry));
    }
  }

  const { data, info } = await sharp(filePath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const rgba = Buffer.from(data);
  applyChromaKey(rgba, info.width, info.height, opts.tolerance, opts.spill);

  const frameWidth = Math.floor(info.width / opts.frames);
  const frames = [];

  for (let i = 0; i < opts.frames; i++) {
    const left = i * frameWidth;
    const framePath = join(outDir, `frame-${String(i).padStart(2, "0")}.png`);
    const frame = extractFrame(rgba, info.width, info.height, left, frameWidth);

    await sharp(frame, {
      raw: { width: frameWidth, height: info.height, channels: 4 },
    })
      .trim({ threshold: 1 })
      .png()
      .toFile(framePath);

    const trimmed = await sharp(framePath).metadata();
    frames.push({
      file: `frame-${String(i).padStart(2, "0")}.png`,
      width: trimmed.width,
      height: trimmed.height,
    });
  }

  const canvas = await normalizeFrames(outDir, frames);

  const manifest = {
    class: className,
    frameCount: opts.frames,
    source: basename(filePath),
    canvas,
    frames,
  };

  await writeFile(join(outDir, "manifest.json"), JSON.stringify(manifest, null, 2));
  console.log(`✓ ${className}: ${opts.frames} frames → ${outDir}`);
  return manifest;
}

async function main() {
  const opts = parseArgs(process.argv);
  await mkdir(opts.input, { recursive: true });
  await mkdir(opts.output, { recursive: true });

  const entries = await readdir(opts.input);
  const sheets = entries
    .filter((f) => /\.(png|jpe?g|webp)$/i.test(f))
    .map((f) => join(opts.input, f));

  if (sheets.length === 0) {
    console.error(`No sprite sheets found in ${opts.input}`);
    process.exit(1);
  }

  const manifests = [];
  for (const sheet of sheets) {
    manifests.push(await processSheet(sheet, opts));
  }

  await writeFile(
    join(opts.output, "index.json"),
    JSON.stringify({ classes: manifests }, null, 2)
  );

  console.log(`\nProcessed ${manifests.length} sheet(s) → ${opts.output}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
