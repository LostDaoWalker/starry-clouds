import type { Player } from "../game";

export type GearSlot = "wig" | "shoes" | "bag";

export type PlayerGear = Record<GearSlot, number>;

export type PlayerExtras = {
  gear: PlayerGear;
  crew: string | null;
  arenaFightsLeft: number;
  dailyReset: string;
  stageStars: Record<string, number>;
  dailies: { arena: boolean; stage: boolean; energy: boolean };
  dailyProgress: { arenaWins: number; stagesCleared: number; energySpent: number };
};

export const ARENA_DAILY_FIGHTS = 5;
export const BLITZ_ENERGY = 5;
export const MAX_GEAR_LEVEL = 10;

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
  { id: "hype", name: "Hype Bot", bonus: 6, unlockStage: 3, tag: "Pockie crew" },
  { id: "stylist", name: "VIP Stylist", bonus: 14, unlockStage: 10, tag: "LoA angel" },
  { id: "muse", name: "Dark Muse", bonus: 28, unlockStage: 20, tag: "SAO partner" },
] as const;

export type CrewId = (typeof CREW)[number]["id"];

export const DAILY_QUESTS = [
  {
    key: "arena" as const,
    label: "Win 2 arena fights",
    goal: 2,
    progress: (e: PlayerExtras) => e.dailyProgress.arenaWins,
    reward: { luster: 25, fame: 5 },
  },
  {
    key: "stage" as const,
    label: "Clear 1 campaign stage",
    goal: 1,
    progress: (e: PlayerExtras) => e.dailyProgress.stagesCleared,
    reward: { luster: 15, fame: 10 },
  },
  {
    key: "energy" as const,
    label: "Spend 25 energy training",
    goal: 25,
    progress: (e: PlayerExtras) => e.dailyProgress.energySpent,
    reward: { luster: 20, fame: 0 },
  },
];

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
      wig: Number(o.gear?.wig ?? 0),
      shoes: Number(o.gear?.shoes ?? 0),
      bag: Number(o.gear?.bag ?? 0),
    },
    crew: typeof o.crew === "string" ? o.crew : null,
    arenaFightsLeft: Number(o.arenaFightsLeft ?? ARENA_DAILY_FIGHTS),
    dailyReset: typeof o.dailyReset === "string" ? o.dailyReset : todayKey(),
    stageStars: (o.stageStars as Record<string, number>) ?? {},
    dailies: { ...d.dailies, ...o.dailies },
    dailyProgress: { ...d.dailyProgress, ...o.dailyProgress },
  };
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

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

export function gearBonus(gear: PlayerGear): number {
  return (gear.wig + gear.shoes + gear.bag) * 2;
}

export function crewBonus(crewId: string | null, stage: number): number {
  if (!crewId) return 0;
  const c = CREW.find((x) => x.id === crewId);
  if (!c || stage < c.unlockStage) return 0;
  return c.bonus;
}

export function totalPower(player: Player): number {
  return (
    player.glamour +
    player.makeup +
    player.fashion +
    gearBonus(player.extras.gear) +
    crewBonus(player.extras.crew, player.stage)
  );
}

export function gearUpgradeCost(level: number): number {
  return 12 + level * 8;
}

export function canUpgradeGear(player: Player, slot: GearSlot): boolean {
  const level = player.extras.gear[slot];
  if (level >= MAX_GEAR_LEVEL) return false;
  return player.luster >= gearUpgradeCost(level);
}

export function upgradeGear(player: Player, slot: GearSlot): Player {
  const level = player.extras.gear[slot];
  if (!canUpgradeGear(player, slot)) return player;
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

export function assignCrew(player: Player, crewId: CrewId | null): Player {
  if (crewId && !unlockedCrew(player.stage).some((c) => c.id === crewId)) return player;
  return { ...player, extras: { ...player.extras, crew: crewId } };
}

export function recordStageStars(player: Player, stage: number, stars: number): Player {
  const key = String(stage);
  const prev = player.extras.stageStars[key] ?? 0;
  if (stars <= prev) return player;
  return {
    ...player,
    extras: {
      ...player.extras,
      stageStars: { ...player.extras.stageStars, [key]: stars },
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
    log: `Blitz Ch.${Math.ceil(stage / 10)} — +✦${luster} (LoA farm)`,
  };
}

export function canArenaFight(player: Player): boolean {
  return player.extras.arenaFightsLeft > 0;
}

export function arenaFight(player: Player): {
  player: Player;
  won: boolean;
  log: string;
} {
  if (!canArenaFight(player)) {
    return { player, won: false, log: "No arena fights left today" };
  }

  const power = totalPower(player);
  const foeBr = Math.floor(power * (0.88 + Math.random() * 0.24));
  const winChance = power / (power + foeBr);
  const won = Math.random() < winChance;
  const fameGain = won ? 4 + Math.floor(foeBr / 10) : 1;
  const lusterGain = won ? 6 + Math.floor(foeBr / 15) : 0;

  let next = {
    ...player,
    fame: player.fame + fameGain,
    luster: player.luster + lusterGain,
    extras: {
      ...player.extras,
      arenaFightsLeft: player.extras.arenaFightsLeft - 1,
      dailyProgress: {
        ...player.extras.dailyProgress,
        arenaWins: won
          ? player.extras.dailyProgress.arenaWins + 1
          : player.extras.dailyProgress.arenaWins,
      },
    },
  };

  const log = won
    ? `Arena WIN vs BR ${foeBr}! +★${fameGain} +✦${lusterGain}`
    : `Arena loss vs BR ${foeBr}. +★${fameGain} consolation`;

  return { player: next, won, log };
}

export function trackEnergySpent(player: Player, amount: number): Player {
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

export function canClaimDaily(
  player: Player,
  key: (typeof DAILY_QUESTS)[number]["key"]
): boolean {
  if (player.extras.dailies[key]) return false;
  const q = DAILY_QUESTS.find((x) => x.key === key)!;
  return q.progress(player.extras) >= q.goal;
}

export function claimDaily(
  player: Player,
  key: (typeof DAILY_QUESTS)[number]["key"]
): Player | null {
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
