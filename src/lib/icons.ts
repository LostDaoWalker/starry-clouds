import type { ActionKey } from "../game";

const base = import.meta.env.BASE_URL;

export const ICONS = {
  luster: `${base}icons/icon-luster.png`,
  energy: `${base}icons/icon-energy.png`,
  fame: `${base}icons/icon-fame.png`,
  glamour: `${base}icons/icon-glamour.png`,
  makeup: `${base}icons/icon-makeup.png`,
  fashion: `${base}icons/icon-fashion.png`,
  power: `${base}icons/icon-power.png`,
  primp: `${base}icons/icon-primp.png`,
  shop: `${base}icons/icon-shop.png`,
  strut: `${base}icons/icon-strut.png`,
  hero: `${base}icons/icon-hero.png`,
  forge: `${base}icons/icon-forge.png`,
  party: `${base}icons/icon-party.png`,
  guild: `${base}icons/icon-guild.png`,
  star: `${base}icons/icon-star.png`,
  auto: `${base}icons/icon-auto.png`,
  quest: `${base}icons/icon-quest.png`,
  wave: `${base}icons/icon-wave.png`,
  unknown: `${base}icons/icon-unknown-hero.png`,
} as const;

export type IconKey = keyof typeof ICONS;

export type EnemySpriteKey = "minion" | "rival" | "paparazzo" | "critic" | "boss";

export const ENEMY_SPRITES: Record<EnemySpriteKey, string> = {
  minion: `${base}enemies/enemy-minion.png`,
  rival: `${base}enemies/enemy-rival.png`,
  paparazzo: `${base}enemies/enemy-paparazzo.png`,
  critic: `${base}enemies/enemy-critic.png`,
  boss: `${base}enemies/enemy-boss.png`,
};

const ACTION_ICON: Record<ActionKey, IconKey> = {
  primp: "primp",
  shop: "shop",
  strut: "strut",
};

export function actionIcon(action: ActionKey): string {
  return ICONS[ACTION_ICON[action]];
}

export function enemySprite(key: EnemySpriteKey): string {
  return ENEMY_SPRITES[key];
}
