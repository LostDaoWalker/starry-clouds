import type { PlayerClass } from "../game";

const CLASS_KEY = "glamour_class";

export function loadPlayerClass(): PlayerClass | null {
  const raw = localStorage.getItem(CLASS_KEY);
  if (raw === "diva" || raw === "model" || raw === "dancer" || raw === "streamer") {
    return raw;
  }
  return null;
}

export function savePlayerClass(playerClass: PlayerClass) {
  localStorage.setItem(CLASS_KEY, playerClass);
}
