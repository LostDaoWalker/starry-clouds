export type Player = {
  id: string;
  glamour: number;
  makeup: number;
  fashion: number;
  luster: number;
  energy: number;
  fame: number;
  last_energy_at: string;
};

export type ActionDef = {
  label: string;
  energy: number;
  glamour: number;
  makeup: number;
  fashion: number;
  luster: number;
  fame: number;
};

export const MAX_ENERGY: number;
export const ENERGY_REGEN_MS: number;
export const ENERGY_REGEN_AMOUNT: number;

export const ACTIONS: {
  primp: ActionDef;
  shop: ActionDef;
  strut: ActionDef;
};

export type ActionKey = keyof typeof ACTIONS;

export function isActionKey(value: unknown): value is ActionKey;
export function regenEnergy(player: Player, now?: number): Player;
export function canAct(player: Player, action: ActionKey): boolean;
export function blockReason(player: Player, action: ActionKey): string | null;
export function applyAction(player: Player, action: ActionKey): Player;
export function statPercent(value: number): number;
