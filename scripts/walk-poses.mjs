/** Walk-cycle pose descriptions for 16-frame generation (2 strides). */

export const CHROMA = `Single character image, ONE frame only, NOT a sprite sheet, NOT multiple poses.

CRITICAL BACKGROUND: SOLID FLAT UNIFORM CHROMA KEY GREEN screen background, exact color #00FF00 pure neon green. Background must be completely uniform with ZERO gradients, ZERO shadows, ZERO floor, ZERO paint splatters, ZERO halftone dots, ZERO texture on background.

CRITICAL: Character must contain NO green clothing, NO green hair, NO green makeup, NO green accessories. No green spill on character edges.

Full body side-view facing right. Keep the exact same character design, outfit, scale, and vertical position as the reference image. Only change the limb positions for this walk pose. Painterly cyber-glam anime-manhwa game sprite style. No text, no UI.`;

export const POSES = [
  "Walk frame 1/16: left foot forward heel contact, right foot back on toe, left arm back right arm forward",
  "Walk frame 2/16: left foot flat planted, knees slightly bent, weight lowering over left leg",
  "Walk frame 3/16: left leg straightening, right foot lifting off ground behind, arms mid-swing",
  "Walk frame 4/16: passing pose, right foot rising passing left ankle, legs closer together",
  "Walk frame 5/16: passing pose, right foot at left knee height, body upright over supporting left leg",
  "Walk frame 6/16: right foot swinging forward descending, left leg pushing off toe",
  "Walk frame 7/16: right foot forward heel about to contact, left foot back on toe",
  "Walk frame 8/16: right foot flat planted contact, knees slightly bent, weight lowering over right leg",
  "Walk frame 9/16: right leg straightening, left foot lifting off ground behind, arms mid-swing",
  "Walk frame 10/16: passing pose, left foot rising passing right ankle, legs closer together",
  "Walk frame 11/16: passing pose, left foot at right knee height, body upright over supporting right leg",
  "Walk frame 12/16: left foot swinging forward descending, right leg pushing off toe",
  "Walk frame 13/16: left foot forward heel about to contact, right foot back on toe",
  "Walk frame 14/16: left foot flat planted contact, knees slightly bent, weight lowering over left leg",
  "Walk frame 15/16: left leg straightening, right foot lifting off ground behind, arms mid-swing",
  "Walk frame 16/16: passing pose, right foot rising passing left ankle, legs closer together, ready to loop",
];

export const CLASSES = {
  diva: "GLAMOUR Diva class — glamorous heroine with dark hair magenta highlights, pink faux-fur stole over black leather outfit, gold chains, black heels.",
  model: "GLAMOUR Model class — statuesque heroine with sleek platinum blonde hair, avant-garde black and white asymmetric designer blazer dress, silver heels.",
  dancer: "GLAMOUR Dancer class — energetic heroine with high ponytail pink streaks, sequined magenta crop top and skirt, gold jewelry, dance heels.",
  streamer: "GLAMOUR Streamer class — trendy heroine with pink-purple ombré hair, cat-ear RGB headphones (cyan and pink glow only, no green), black neon-trim hoodie, shorts, sneakers.",
};

export function framePrompt(classKey, frameIndex) {
  return `${CHROMA}\n\nCharacter: ${CLASSES[classKey]}\n\n${POSES[frameIndex]}`;
}
