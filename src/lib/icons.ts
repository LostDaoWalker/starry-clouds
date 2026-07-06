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
} as const;

export type IconKey = keyof typeof ICONS;

const ACTION_ICON: Record<ActionKey, IconKey> = {
  primp: "primp",
  shop: "shop",
  strut: "strut",
};

export function actionIcon(action: ActionKey): string {
  return ICONS[ACTION_ICON[action]];
}
