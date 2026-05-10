# Starry Clouds Asset Workflow

Use the built-in image generation path first. Keep final project assets in `public/assets/` and keep the original generated files unchanged under `C:\Users\J\.codex\generated_images\...`.

## Art Direction

- Adorable, wholesome xianxia browser RPG.
- Soft 2D game illustration, moe-friendly, polished, readable at small web sizes.
- Palette: pastel jade, peach blossom pink, soft gold, warm cream, sky blue.
- Avoid dark fantasy, scary enemies, harsh contrast, clutter, text, logos, and watermarks.

## Generated Assets

- `public/assets/cloud-blossom-world.png`: wide cloud sect world art.
- `public/assets/cultivator-hero-key.png`: source player sprite on chroma key.
- `public/assets/cultivator-hero.png`: transparent player sprite.
- `public/assets/peach-spirit-key.png`: source PvE spirit sprite on chroma key.
- `public/assets/peach-spirit.png`: transparent PvE spirit sprite.
- `public/assets/reward-items-key.png`: source reward item sheet on chroma key.
- `public/assets/reward-items.png`: transparent reward item sheet.
- `public/assets/jade-moon-sect.png`: black-and-jade moonlit sect backdrop for the Three.js hub and hero.

## Prompts

### Jade Moon Sect Backdrop

```text
Use case: stylized-concept
Asset type: webgame hero and in-game world backdrop
Primary request: adorable wholesome xianxia MMORPG-style cloud sect world for a brutally simple browser game
Scene/backdrop: floating black jade platforms above soft mist, glowing emerald spirit rivers, tiny pagoda rooftops, peach blossoms, lanterns, friendly magical clouds
Subject: a cozy cultivation village hub, no foreground characters, readable as a cute game environment
Style/medium: polished cute 2D game illustration, moe-friendly, soft cel shading, adorable and wholesome
Composition/framing: wide landscape composition, center path leading into the sect, enough open space for UI overlay
Lighting/mood: gentle moonlit glow, magical, cozy, positive
Color palette: deep black, jade green, emerald glow, soft mint, small peach blossom accents
Constraints: no text, no watermark, no logo, no scary elements, no dark horror, simple readable shapes
```

### World Background

```text
Use case: stylized-concept
Asset type: web RPG background hero / world art
Primary request: adorable wholesome xianxia cloud sect village for a simple browser RPG
Scene/backdrop: floating jade platforms above soft clouds, peach blossom trees, tiny pagoda roofs, warm sunrise sky
Subject: a cozy magical cultivation village, no characters in foreground
Style/medium: polished cute game illustration, soft painterly 2D, moe-friendly, wholesome, readable at web sizes
Composition/framing: wide landscape composition, clear center vista, useful negative space near left side for UI copy
Lighting/mood: gentle morning glow, peaceful, optimistic
Color palette: pastel jade, petal pink, soft gold, sky blue, clean whites
Constraints: no text, no watermark, no logo, no scary elements, no dark fantasy, keep shapes simple and readable
```

### Player Sprite Source

```text
Use case: stylized-concept
Asset type: player character sprite source
Primary request: adorable chibi xianxia cultivator hero for a wholesome browser RPG
Scene/backdrop: perfectly flat solid #00ff00 chroma-key background for background removal
Subject: one full-body chibi cultivator, peach blossom sword, jade sash, small cloud boots, cheerful brave expression
Style/medium: polished cute 2D game sprite, soft cel shading, clean silhouette, moe-friendly, adorable and wholesome
Composition/framing: centered full body, front three-quarter view, generous padding, no cropped parts
Lighting/mood: bright soft game lighting
Color palette: petal pink, jade green, warm cream, small gold accents
Constraints: background must be uniform #00ff00 with no shadows, gradients, texture, floor plane, or lighting variation; do not use #00ff00 in the subject; no text, no watermark, no extra characters
```

### PvE Spirit Source

```text
Use case: stylized-concept
Asset type: PvE enemy sprite source
Primary request: adorable harmless spirit creature enemy for a wholesome xianxia RPG
Scene/backdrop: perfectly flat solid #00ff00 chroma-key background for background removal
Subject: one tiny peach blossom cloud spirit, round soft body, leaf ears, little glowing forehead charm, playful expression, non-threatening
Style/medium: polished cute 2D game sprite, soft cel shading, clean silhouette, moe-friendly, adorable and wholesome
Composition/framing: centered full body, front three-quarter view, generous padding
Lighting/mood: bright soft game lighting, friendly
Color palette: pale lavender, petal pink, jade green, warm cream highlights
Constraints: background must be uniform #00ff00 with no shadows, gradients, texture, floor plane, or lighting variation; do not use #00ff00 in the subject; no text, no watermark, no extra characters
```

### Reward Items Source

```text
Use case: stylized-concept
Asset type: item and reward sprite sheet source
Primary request: adorable xianxia reward items for a wholesome browser RPG
Scene/backdrop: perfectly flat solid #ff00ff chroma-key background for background removal
Subject: four separate game item icons arranged in a clean 2x2 grid with generous spacing: jade ingot, peach blossom talisman, tiny cloud elixir bottle, golden sect badge
Style/medium: polished cute 2D game item sprites, soft cel shading, clean silhouettes, moe-friendly
Composition/framing: centered 2x2 grid, each icon isolated with equal padding, no overlap
Lighting/mood: bright soft game lighting, collectible and cheerful
Color palette: jade green, petal pink, soft gold, cream, sky blue
Constraints: background must be uniform #ff00ff with no shadows, gradients, texture, floor plane, or lighting variation; do not use #ff00ff in the items; no text, no watermark
```

## Cutout Step

Preferred helper:

```powershell
py C:\Users\J\.codex\skills\.system\imagegen\scripts\remove_chroma_key.py --input public\assets\cultivator-hero-key.png --out public\assets\cultivator-hero.png --auto-key border --soft-matte --transparent-threshold 12 --opaque-threshold 220 --despill
```

If Python is unavailable, use Windows image handling to remove strong green or magenta key pixels, then save the result as a PNG with alpha. Keep the `*-key.png` source files so cleaner cutouts can be regenerated later.
