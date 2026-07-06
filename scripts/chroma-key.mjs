#!/usr/bin/env node
/**
 * Chroma-key pipeline for GLAMOUR walk-cycle sprites.
 *
 * Expects individual frame PNGs per class:
 *   public/sprites/raw/{class}/frame-00.png … frame-15.png
 *
 * 1. Remove solid #00FF00 green screen backgrounds
 * 2. Trim transparent padding per frame
 * 3. Normalize all frames to a shared canvas
 * 4. Emit manifest JSON per class
 *
 * Usage:
 *   npm run sprites:process
 *   node scripts/chroma-key.mjs --input public/sprites/raw --output public/sprites/walk
 */

import { mkdir, readdir, writeFile, unlink, stat } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";

const KEY = { r: 0, g: 255, b: 0 };
const DEFAULT_TOLERANCE = 90;
const DEFAULT_SPILL = 0.35;
const FRAME_RE = /^frame-(\d+)\.png$/i;

function parseArgs(argv) {
  const opts = {
    input: "public/sprites/raw",
    output: "public/sprites/walk",
    tolerance: DEFAULT_TOLERANCE,
    spill: DEFAULT_SPILL,
  };

  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--input") opts.input = argv[++i];
    else if (arg === "--output") opts.output = argv[++i];
    else if (arg === "--tolerance") opts.tolerance = Number(argv[++i]);
    else if (arg === "--spill") opts.spill = Number(argv[++i]);
    else if (arg === "--help") {
      console.log(`Usage: node scripts/chroma-key.mjs [options]

Options:
  --input <dir>       Source frames root (default: public/sprites/raw)
  --output <dir>      Processed transparent frames (default: public/sprites/walk)
  --tolerance <0-255> Green distance cutoff (default: ${DEFAULT_TOLERANCE})
  --spill <0-1>       Desaturate green spill on edges (default: ${DEFAULT_SPILL})

Input layout:
  {input}/{class}/frame-00.png
  {input}/{class}/frame-01.png
  ...
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

async function processFrame(filePath, outPath, opts) {
  const { data, info } = await sharp(filePath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const rgba = Buffer.from(data);
  applyChromaKey(rgba, info.width, info.height, opts.tolerance, opts.spill);

  await sharp(rgba, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .trim({ threshold: 1 })
    .png()
    .toFile(outPath);

  const trimmed = await sharp(outPath).metadata();
  return { width: trimmed.width, height: trimmed.height };
}

async function processClass(className, classDir, opts) {
  const outDir = join(opts.output, className);
  await mkdir(outDir, { recursive: true });

  for (const entry of await readdir(outDir)) {
    if (FRAME_RE.test(entry)) {
      await unlink(join(outDir, entry));
    }
  }

  const entries = (await readdir(classDir))
    .filter((f) => FRAME_RE.test(f))
    .sort((a, b) => {
      const ai = Number(a.match(FRAME_RE)[1]);
      const bi = Number(b.match(FRAME_RE)[1]);
      return ai - bi;
    });

  if (entries.length === 0) {
    throw new Error(`No frames found in ${classDir}`);
  }

  const frames = [];
  for (const entry of entries) {
    const outFile = entry;
    const outPath = join(outDir, outFile);
    const { width, height } = await processFrame(join(classDir, entry), outPath, opts);
    frames.push({ file: outFile, width, height });
  }

  const canvas = await normalizeFrames(outDir, frames);

  const manifest = {
    class: className,
    frameCount: frames.length,
    source: `${className}/`,
    canvas,
    frames,
  };

  await writeFile(join(outDir, "manifest.json"), JSON.stringify(manifest, null, 2));
  console.log(`✓ ${className}: ${frames.length} frames → ${outDir}`);
  return manifest;
}

async function isDirectory(path) {
  try {
    return (await stat(path)).isDirectory();
  } catch {
    return false;
  }
}

async function main() {
  const opts = parseArgs(process.argv);
  await mkdir(opts.input, { recursive: true });
  await mkdir(opts.output, { recursive: true });

  const entries = await readdir(opts.input);
  const classDirs = [];

  for (const entry of entries) {
    const fullPath = join(opts.input, entry);
    if (await isDirectory(fullPath)) {
      classDirs.push({ name: entry, path: fullPath });
    }
  }

  if (classDirs.length === 0) {
    console.error(`No class frame directories found in ${opts.input}`);
    console.error(`Expected: ${opts.input}/{class}/frame-00.png`);
    process.exit(1);
  }

  classDirs.sort((a, b) => a.name.localeCompare(b.name));

  const manifests = [];
  for (const { name, path } of classDirs) {
    manifests.push(await processClass(name, path, opts));
  }

  await writeFile(
    join(opts.output, "index.json"),
    JSON.stringify({ classes: manifests }, null, 2)
  );

  console.log(`\nProcessed ${manifests.length} class(es) → ${opts.output}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
