import type { DailyKey, GearSlot, Player, PlayerExtras, PlayerGear } from "./types";

export type { DailyKey, GearSlot, PlayerExtras, PlayerGear };

export const ARENA_DAILY_FIGHTS = 5;
export const BLITZ_ENERGY = 5;
export const MAX_GEAR_LEVEL = 10;
export const GEAR_BR_PER_LEVEL = 2;

export const GEAR_SLOTS: {
  key: GearSlot;
  label: string;
  icon: "glamour" | "fashion" | "makeup";
}[] = [
  { key: "wig", label: "WIG", icon: "glamour" },
  { key: "shoes", label: "HEELS", icon: "fashion" },
  { key: "bag", label: "BAG", icon: "makeup" },
];

export const CREW = [
  { id: "hype", name: "Hype Bot", bonus: 6, unlockStage: 3 },
  { id: "stylist", name: "VIP Stylist", bonus: 14, unlockStage: 10 },
  { id: "muse", name: "Dark Muse", bonus: 28, unlockStage: 20 },
] as const;

export type CrewId = (typeof CREW)[number]["id"];

export const DAILY_QUESTS: {
  key: DailyKey;
  label: string;
  goal: number;
  progress: (e: PlayerExtras) => number;
  reward: { luster: number; fame: number };
}[] = [
  {
    key: "arena",
    label: "Win 2 arena fights",
    goal: 2,
    progress: (e) => e.dailyProgress.arenaWins,
    reward: { luster: 25, fame: 5 },
  },
  {
    key: "stage",
    label: "Clear 1 campaign stage",
    goal: 1,
    progress: (e) => e.dailyProgress.stagesCleared,
    reward: { luster: 15, fame: 10 },
  },
  {
    key: "energy",
    label: "Spend 25 energy training",
    goal: 25,
    progress: (e) => e.dailyProgress.energySpent,
    reward: { luster: 20, fame: 0 },
  },
];

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export function defaultExtras(): PlayerExtras {
  return {
    gear: { wig: 0, shoes: 0, bag: 0 },
    crew: null,
    arenaFightsLeft: ARENA_DAILY_FIGHTS,
    dailyReset: todayKey(),
    stageStars: {},
    dailies: { arena: false, stage: false, energy: false },
    dailyProgress: { arenaWins: 0, stagesCleared: 0, energySpent: 0 },
  };
}

export function normalizeExtras(raw: unknown): PlayerExtras {
  const d = defaultExtras();
  if (!raw || typeof raw !== "object") return d;
  const o = raw as Partial<PlayerExtras>;
  return {
    gear: {
      wig: clampInt(o.gear?.wig ?? 0, 0, MAX_GEAR_LEVEL),
      shoes: clampInt(o.gear?.shoes ?? 0, 0, MAX_GEAR_LEVEL),
      bag: clampInt(o.gear?.bag ?? 0, 0, MAX_GEAR_LEVEL),
    },
    crew: typeof o.crew === "string" ? o.crew : null,
    arenaFightsLeft: clampInt(o.arenaFightsLeft ?? ARENA_DAILY_FIGHTS, 0, ARENA_DAILY_FIGHTS),
    dailyReset: typeof o.dailyReset === "string" ? o.dailyReset : todayKey(),
    stageStars: sanitizeStars(o.stageStars),
    dailies: {
      arena: Boolean(o.dailies?.arena),
      stage: Boolean(o.dailies?.stage),
      energy: Boolean(o.dailies?.energy),
    },
    dailyProgress: {
      arenaWins: clampInt(o.dailyProgress?.arenaWins ?? 0, 0, 99),
      stagesCleared: clampInt(o.dailyProgress?.stagesCleared ?? 0, 0, 99),
      energySpent: clampInt(o.dailyProgress?.energySpent ?? 0, 0, 999),
    },
  };
}

function clampInt(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.floor(Number(n) || 0)));
}

function sanitizeStars(raw: unknown): Record<string, number> {
  if (!raw || typeof raw !== "object") return {};
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    const stars = clampInt(Number(v), 0, 3);
    if (stars > 0) out[k] = stars;
  }
  return out;
}

/** Reset daily counters when the calendar day changes. */
export function refreshDailies(player: Player): Player {
  const today = todayKey();
  if (player.extras.dailyReset === today) return player;
  return {
    ...player,
    extras: {
      ...defaultExtras(),
      gear: player.extras.gear,
      crew: player.extras.crew,
      stageStars: player.extras.stageStars,
      dailyReset: today,
    },
  };
}

/** Validate crew unlock and clamp gear after load or save. */
export function sanitizePlayer(player: Player): Player {
  let next = refreshDailies(player);
  const gear = { ...next.extras.gear };
  for (const slot of Object.keys(gear) as GearSlot[]) {
    gear[slot] = clampInt(gear[slot], 0, MAX_GEAR_LEVEL);
  }

  let crew = next.extras.crew;
  if (crew && !unlockedCrew(next.stage).some((c) => c.id === crew)) {
    crew = null;
  }

  if (crew !== next.extras.crew || JSON.stringify(gear) !== JSON.stringify(next.extras.gear)) {
    next = { ...next, extras: { ...next.extras, gear, crew } };
  }
  return next;
}

export function statBr(player: Player): number {
  return player.glamour + player.makeup + player.fashion;
}

export function gearBonus(gear: PlayerGear): number {
  return (gear.wig + gear.shoes + gear.bag) * GEAR_BR_PER_LEVEL;
}

export function crewBonus(crewId: string | null, stage: number): number {
  if (!crewId) return 0;
  const c = CREW.find((x) => x.id === crewId);
  if (!c || stage < c.unlockStage) return 0;
  return c.bonus;
}

/** Total battle rating — stats + gear + crew. */
export function br(player: Player): number {
  return statBr(player) + gearBonus(player.extras.gear) + crewBonus(player.extras.crew, player.stage);
}

export function gearUpgradeCost(level: number): number {
  return 12 + level * 8;
}

export function canUpgradeGear(player: Player, slot: GearSlot): boolean {
  const level = player.extras.gear[slot];
  if (level >= MAX_GEAR_LEVEL) return false;
  return player.luster >= gearUpgradeCost(level);
}

export function upgradeGear(player: Player, slot: GearSlot): Player | null {
  const level = player.extras.gear[slot];
  if (!canUpgradeGear(player, slot)) return null;
  const cost = gearUpgradeCost(level);
  return {
    ...player,
    luster: player.luster - cost,
    extras: {
      ...player.extras,
      gear: { ...player.extras.gear, [slot]: level + 1 },
    },
  };
}

export function unlockedCrew(stage: number) {
  return CREW.filter((c) => stage >= c.unlockStage);
}

export function assignCrew(player: Player, crewId: CrewId | null): Player | null {
  if (crewId && !unlockedCrew(player.stage).some((c) => c.id === crewId)) return null;
  if (player.extras.crew === crewId) return null;
  return { ...player, extras: { ...player.extras, crew: crewId } };
}

/** Record stars and count toward the daily "clear a stage" quest. */
export function onCampaignStageClear(player: Player, clearedStage: number, stars: number): Player {
  const key = String(clearedStage);
  const prevStars = player.extras.stageStars[key] ?? 0;
  return {
    ...player,
    extras: {
      ...player.extras,
      stageStars: { ...player.extras.stageStars, [key]: Math.max(prevStars, stars) },
      dailyProgress: {
        ...player.extras.dailyProgress,
        stagesCleared: player.extras.dailyProgress.stagesCleared + 1,
      },
    },
  };
}

export function bestStarsForStage(extras: PlayerExtras, stage: number): number {
  return extras.stageStars[String(stage)] ?? 0;
}

export function canBlitz(player: Player, stage: number): boolean {
  return (
    bestStarsForStage(player.extras, stage) >= 3 &&
    player.energy >= BLITZ_ENERGY &&
    stage < player.stage
  );
}

export function blitzStage(player: Player, stage: number): { player: Player; log: string } | null {
  if (!canBlitz(player, stage)) return null;
  const luster = 8 + Math.floor(stage * 1.5);
  return {
    player: {
      ...player,
      energy: player.energy - BLITZ_ENERGY,
      luster: player.luster + luster,
    },
    log: `Blitz ${stage} — +✦${luster}`,
  };
}

export function canArenaFight(player: Player): boolean {
  return player.extras.arenaFightsLeft > 0;
}

export function arenaFight(player: Player): { player: Player; won: boolean; log: string } | null {
  if (!canArenaFight(player)) return null;

  const power = br(player);
  const foeBr = Math.floor(power * (0.88 + Math.random() * 0.24));
  const winChance = power / (power + foeBr);
  const won = Math.random() < winChance;
  const fameGain = won ? 4 + Math.floor(foeBr / 10) : 1;
  const lusterGain = won ? 6 + Math.floor(foeBr / 15) : 0;

  const next: Player = {
    ...player,
    fame: player.fame + fameGain,
    luster: player.luster + lusterGain,
    extras: {
      ...player.extras,
      arenaFightsLeft: player.extras.arenaFightsLeft - 1,
      dailyProgress: {
        ...player.extras.dailyProgress,
        arenaWins: player.extras.dailyProgress.arenaWins + (won ? 1 : 0),
      },
    },
  };

  const log = won
    ? `Arena win vs BR ${foeBr} — +★${fameGain} +✦${lusterGain}`
    : `Arena loss vs BR ${foeBr} — +★${fameGain}`;

  return { player: next, won, log };
}

export function trackEnergySpent(player: Player, amount: number): Player {
  if (amount <= 0) return player;
  return {
    ...player,
    extras: {
      ...player.extras,
      dailyProgress: {
        ...player.extras.dailyProgress,
        energySpent: player.extras.dailyProgress.energySpent + amount,
      },
    },
  };
}

export function canClaimDaily(player: Player, key: DailyKey): boolean {
  if (player.extras.dailies[key]) return false;
  const q = DAILY_QUESTS.find((x) => x.key === key)!;
  return q.progress(player.extras) >= q.goal;
}

export function claimDaily(player: Player, key: DailyKey): Player | null {
  if (!canClaimDaily(player, key)) return null;
  const q = DAILY_QUESTS.find((x) => x.key === key)!;
  return {
    ...player,
    luster: player.luster + q.reward.luster,
    fame: player.fame + q.reward.fame,
    extras: {
      ...player.extras,
      dailies: { ...player.extras.dailies, [key]: true },
    },
  };
}

export function blitzableStages(player: Player): number[] {
  const out: number[] = [];
  for (let s = 1; s < player.stage; s++) {
    if (bestStarsForStage(player.extras, s) >= 3) out.push(s);
  }
  return out.slice(-5);
}

export function pendingDailyClaims(player: Player): number {
  return DAILY_QUESTS.filter((q) => canClaimDaily(player, q.key)).length;
}
