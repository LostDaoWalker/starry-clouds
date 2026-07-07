import type { ActionKey } from "../game";

const base = import.meta.env.BASE_URL;

const CHAPTER_SCENES = [
  "scene-arena-ch1.png",
  "scene-catwalk.png",
  "scene-shopping.png",
  "arena-bg.jpg",
] as const;

export function arenaSceneUrl(chapter: number): string {
  const file = CHAPTER_SCENES[(Math.max(1, chapter) - 1) % CHAPTER_SCENES.length];
  return `${base}ui/${file}`;
}

export function actionSceneUrl(action: ActionKey): string | null {
  if (action === "shop") return `${base}ui/scene-shopping.png`;
  if (action === "strut") return `${base}ui/scene-catwalk.png`;
  return null;
}

export function faceCardSceneUrl(playerClass: string): string | null {
  if (playerClass === "diva") return `${base}cards/diva-shop.png`;
  if (playerClass === "model") return `${base}cards/model-catwalk.png`;
  return null;
}

export const moggedSplashUrl = `${base}ui/mogged-splash.png`;
