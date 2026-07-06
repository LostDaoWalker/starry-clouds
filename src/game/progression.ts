import { BOSS_EVERY, STAGES_PER_CHAPTER } from "./constants";
import type { StageInfo } from "./types";

export function stageInfo(stage: number): StageInfo {
  const global = Math.max(1, stage);
  const chapter = Math.ceil(global / STAGES_PER_CHAPTER);
  const stageInChapter = ((global - 1) % STAGES_PER_CHAPTER) + 1;
  const chapterName =
    CHAPTER_NAMES[Math.min(chapter - 1, CHAPTER_NAMES.length - 1)] ?? "Unknown";
  const isBoss = stageInChapter % BOSS_EVERY === 0;
  return { global, chapter, stageInChapter, chapterName, isBoss };
}

export function stageLabel(stage: number): string {
  const info = stageInfo(stage);
  return `Ch.${info.chapter}-${info.stageInChapter}`;
}

/** Recommended BR to comfortably clear a stage. */
export function requiredBr(stage: number): number {
  const info = stageInfo(stage);
  const base = info.global * 8;
  return info.isBoss ? Math.floor(base * 1.5) : base;
}

export const CHAPTER_NAMES = [
  "Backstage Alley",
  "Neon Runway",
  "Velvet VIP",
  "Gala Ascension",
  "Eternal Spotlight",
  "Crystal Catwalk",
  "Diamond Dynasty",
  "Starfall Soirée",
] as const;

export const CHAPTER_LORE = [
  "Rumors say the alley hides jealous rivals who never made opening night…",
  "The neon runway burns bright — paparazzi swarms ahead.",
  "VIP velvet ropes guard secrets only icons may pass.",
  "The gala ascends; only the fiercest earn the eternal spotlight.",
  "Beyond the spotlight, crystal catwalks crack under heel.",
  "A dynasty of diamonds demands blood-red lipstick tribute.",
  "Starfall soirée — where fallen angels trade fame for mercy.",
  "The final curtain rises. Slay or be forgotten.",
] as const;

export function chapterLore(chapter: number): string {
  return CHAPTER_LORE[Math.min(chapter - 1, CHAPTER_LORE.length - 1)] ?? CHAPTER_LORE[0];
}
