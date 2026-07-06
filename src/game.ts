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

export const MAX_ENERGY = 100;
export const ENERGY_REGEN_MS = 30_000;
export const ENERGY_REGEN_AMOUNT = 5;

export const ACTIONS = {
  primp: {
    label: "PRIMP",
    energy: 15,
    glamour: 2,
    makeup: 8,
    fashion: 0,
    luster: 0,
    fame: 0,
  },
  shop: {
    label: "SHOP",
    energy: 10,
    glamour: 0,
    makeup: 0,
    fashion: 12,
    luster: -8,
    fame: 0,
  },
  strut: {
    label: "STRUT",
    energy: 25,
    glamour: 0,
    makeup: 0,
    fashion: 0,
    luster: 15,
    fame: 10,
  },
} as const;

export type ActionKey = keyof typeof ACTIONS;

export function regenEnergy(player: Player, now = Date.now()): Player {
  const elapsed = now - new Date(player.last_energy_at).getTime();
  const ticks = Math.floor(elapsed / ENERGY_REGEN_MS);
  if (ticks <= 0 || player.energy >= MAX_ENERGY) return player;

  const gained = Math.min(ticks * ENERGY_REGEN_AMOUNT, MAX_ENERGY - player.energy);
  const consumedMs = ticks * ENERGY_REGEN_MS;

  return {
    ...player,
    energy: player.energy + gained,
    last_energy_at: new Date(
      new Date(player.last_energy_at).getTime() + consumedMs
    ).toISOString(),
  };
}

export function canAct(player: Player, action: ActionKey): boolean {
  const cost = ACTIONS[action];
  if (player.energy < cost.energy) return false;
  if (cost.luster < 0 && player.luster < Math.abs(cost.luster)) return false;
  return true;
}

export function applyAction(player: Player, action: ActionKey): Player {
  const cost = ACTIONS[action];
  return {
    ...player,
    glamour: player.glamour + cost.glamour,
    makeup: player.makeup + cost.makeup,
    fashion: player.fashion + cost.fashion,
    luster: player.luster + cost.luster,
    fame: player.fame + cost.fame,
    energy: player.energy - cost.energy,
  };
}

export function statPercent(value: number): number {
  return Math.min(100, Math.round((value / 100) * 100));
}
