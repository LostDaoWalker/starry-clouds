import type { SceneKey } from "../game";

const base = import.meta.env.BASE_URL;

export const SCENES: Record<SceneKey, string> = {
  shopping: `${base}scenes/shopping.webp`,
  runway: `${base}scenes/runway.webp`,
  vip: `${base}scenes/vip.webp`,
  gala: `${base}scenes/gala.webp`,
};

export function sceneUrl(key: SceneKey): string {
  return SCENES[key];
}
