export type PlayerClass = "diva" | "model" | "dancer" | "streamer";

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

export const CLASSES: {
  key: PlayerClass;
  label: string;
  tagline: string;
}[] = [
  { key: "diva", label: "DIVA", tagline: "Drama damage + fame crits" },
  { key: "model", label: "MODEL", tagline: "Precision strikes + fashion armor" },
  { key: "dancer", label: "DANCER", tagline: "Speed ticks + dodge procs" },
  { key: "streamer", label: "STREAMER", tagline: "Idle hype + luster drip" },
];

export const MAX_ENERGY = 100;
export const ENERGY_REGEN_MS = 30_000;
export const ENERGY_REGEN_AMOUNT = 5;
export const IDLE_TICK_MS = 3_000;

export const ZONES = [
  { minFame: 0, name: "Backstage Alley", enemy: "Dusty Stagehand" },
  { minFame: 25, name: "Neon Runway", enemy: "Paparazzi Goblin" },
  { minFame: 75, name: "Velvet VIP Lounge", enemy: "Critique Witch" },
  { minFame: 150, name: "Gala Ascension", enemy: "Icon Slayer" },
  { minFame: 300, name: "Eternal Spotlight", enemy: "The Algorithm" },
] as const;

export type Zone = (typeof ZONES)[number];

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

export function combatPower(player: Player): number {
  return player.glamour + player.makeup + player.fashion;
}

export function zoneForFame(fame: number): Zone {
  let zone: Zone = ZONES[0];
  for (const z of ZONES) {
    if (fame >= z.minFame) zone = z;
  }
  return zone;
}

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

export type IdleTickResult = {
  player: Player;
  log: string;
};

export function idleTick(player: Player, playerClass: PlayerClass): IdleTickResult {
  const zone = zoneForFame(player.fame);
  const power = combatPower(player);
  const classBonus =
    playerClass === "streamer" ? 2 : playerClass === "dancer" ? 1 : 0;

  const lusterGain = Math.max(1, Math.floor(power / 12) + classBonus);
  const fameGain = power >= zone.minFame + 20 ? 1 : 0;
  const verbs = ["SLAYS", "STUNS", "OUTSHINES", "HUMBLES", "READS"];
  const verb = verbs[Math.floor(Math.random() * verbs.length)];

  const next: Player = {
    ...player,
    luster: player.luster + lusterGain,
    fame: player.fame + fameGain,
  };

  return {
    player: next,
    log: `You ${verb} ${zone.enemy} for ✦${lusterGain}${fameGain ? ` and ★${fameGain}` : ""}!`,
  };
}

export function statPercent(value: number): number {
  return Math.min(100, Math.round(value));
}
