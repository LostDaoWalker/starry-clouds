import {
  BATTLE_TICK_MS,
  ENERGY_REGEN_AMOUNT,
  ENERGY_REGEN_MS,
  MAX_AFK_TICKS,
  MAX_ENERGY,
} from "./game/constants";
import { br, onCampaignStageClear, trackEnergySpent } from "./game/meta";
import { stageInfo, stageLabel } from "./game/progression";
import type {
  BattleTickResult,
  CombatState,
  Enemy,
  EnemySprite,
  Player,
  PlayerClass,
} from "./game/types";

export type {
  BattleTickResult,
  CombatState,
  DailyKey,
  Enemy,
  EnemySprite,
  GearSlot,
  Player,
  PlayerClass,
  PlayerExtras,
  StageInfo,
} from "./game/types";

export type { CrewId } from "./game/meta";

export {
  BATTLE_TICK_MS,
  BOSS_EVERY,
  ENERGY_REGEN_AMOUNT,
  ENERGY_REGEN_MS,
  MAX_AFK_TICKS,
  MAX_ENERGY,
  STAGES_PER_CHAPTER,
} from "./game/constants";

export {
  ARENA_DAILY_FIGHTS,
  BLITZ_ENERGY,
  CREW,
  DAILY_QUESTS,
  GEAR_BR_PER_LEVEL,
  GEAR_SLOTS,
  MAX_GEAR_LEVEL,
  arenaFight,
  assignCrew,
  bestStarsForStage,
  blitzableStages,
  blitzStage,
  br,
  canArenaFight,
  canBlitz,
  canClaimDaily,
  canUpgradeGear,
  claimDaily,
  crewBonus,
  defaultExtras,
  gearBonus,
  gearUpgradeCost,
  normalizeExtras,
  onCampaignStageClear,
  pendingDailyClaims,
  refreshDailies,
  sanitizePlayer,
  statBr,
  trackEnergySpent,
  unlockedCrew,
  upgradeGear,
} from "./game/meta";

export {
  CHAPTER_LORE,
  CHAPTER_NAMES,
  chapterLore,
  requiredBr,
  stageInfo,
  stageLabel,
} from "./game/progression";

export const CLASSES: {
  key: PlayerClass;
  label: string;
  tagline: string;
}[] = [
  { key: "diva", label: "DIVA", tagline: "Crit queen — burst damage" },
  { key: "model", label: "MODEL", tagline: "Steady DPS — pierce armor" },
  { key: "dancer", label: "DANCER", tagline: "Double-hit rhythm" },
  { key: "streamer", label: "STREAMER", tagline: "Bonus loot on kills" },
];

export const ACTIONS = {
  primp: {
    label: "ENHANCE",
    energy: 15,
    glamour: 3,
    makeup: 6,
    fashion: 0,
    luster: 0,
    fame: 0,
  },
  shop: {
    label: "OUTFIT",
    energy: 10,
    glamour: 0,
    makeup: 0,
    fashion: 10,
    luster: -10,
    fame: 0,
  },
  strut: {
    label: "SPOTLIGHT",
    energy: 20,
    glamour: 0,
    makeup: 0,
    fashion: 0,
    luster: 12,
    fame: 8,
  },
} as const;

export type ActionKey = keyof typeof ACTIONS;

const ENEMY_PREFIXES = [
  "Rogue",
  "Shadow",
  "Bitter",
  "Jealous",
  "Petty",
  "Savage",
  "Cursed",
  "Fallen",
];

const ENEMY_TYPES = [
  "Stagehand",
  "Critic",
  "Paparazzo",
  "Rival",
  "Hater",
  "Gatekeeper",
  "Saboteur",
  "Usurper",
];

const BOSS_TITLES = [
  "Wardrobe Tyrant",
  "Critique Witch",
  "Paparazzo King",
  "Icon Slayer",
  "The Algorithm",
  "Mirror Queen",
  "Velvet Overlord",
  "Spotlight Devourer",
];

const RIVAL_SPRITES: EnemySprite[] = ["rival", "paparazzo", "critic"];

function rivalSpriteForStage(stage: number): EnemySprite {
  return RIVAL_SPRITES[stage % RIVAL_SPRITES.length];
}

export function enemyForStage(stage: number): Enemy {
  const info = stageInfo(stage);
  const scale = info.global;
  const bossMult = info.isBoss ? 4 : 1;

  const name = info.isBoss
    ? BOSS_TITLES[Math.min(info.chapter - 1, BOSS_TITLES.length - 1)]
    : `${ENEMY_PREFIXES[scale % ENEMY_PREFIXES.length]} ${ENEMY_TYPES[scale % ENEMY_TYPES.length]}`;

  return {
    name,
    maxHp: Math.floor((40 + scale * 22) * bossMult),
    power: Math.floor((8 + scale * 6) * (info.isBoss ? 2 : 1)),
    isBoss: info.isBoss,
    sprite: info.isBoss ? "boss" : rivalSpriteForStage(scale),
  };
}

export function wavesForStage(stage: number): number {
  const info = stageInfo(stage);
  if (info.isBoss) return 3;
  if (info.global <= 8) return 2;
  return 3;
}

export function enemyForWave(stage: number, wave: number, totalWaves: number): Enemy {
  const base = enemyForStage(stage);
  const isFinal = wave === totalWaves;

  if (!isFinal) {
    const scale = 0.4 + wave * 0.12;
    return {
      name: `Minion ${wave}`,
      maxHp: Math.max(15, Math.floor((base.maxHp * scale) / totalWaves)),
      power: Math.max(4, Math.floor(base.power * scale * 0.65)),
      isBoss: false,
      sprite: "minion",
    };
  }

  return base;
}

export function newCombatState(stage: number): CombatState {
  const totalWaves = wavesForStage(stage);
  const enemy = enemyForWave(stage, 1, totalWaves);
  return { enemy, hp: enemy.maxHp, wave: 1, totalWaves, stage };
}

function classCritChance(playerClass: PlayerClass): number {
  if (playerClass === "diva") return 0.25;
  if (playerClass === "model") return 0.1;
  return 0.05;
}

function rollDamage(power: number, enemyPower: number, crit: boolean): number {
  const ratio = power / Math.max(1, power + enemyPower);
  const base = Math.max(1, Math.floor(power * ratio * 0.35));
  const variance = 0.85 + Math.random() * 0.3;
  return Math.max(1, Math.floor(base * variance * (crit ? 2 : 1)));
}

function killLoot(player: Player, enemy: Enemy, playerClass: PlayerClass) {
  const power = br(player);
  const lusterBase = Math.max(2, Math.floor(power / 8) + Math.floor(enemy.maxHp / 40));
  const fameBase = enemy.isBoss ? 5 : 1;
  const lusterBonus = playerClass === "streamer" ? 3 : 0;
  return {
    luster: lusterBase + lusterBonus,
    fame: fameBase + (enemy.isBoss ? Math.floor(player.stage / 10) : 0),
  };
}

function starsForKill(power: number, enemy: Enemy): number {
  const ratio = power / Math.max(1, enemy.power);
  if (ratio >= 1.5) return 3;
  if (ratio >= 1.0) return 2;
  return 1;
}

export function battleTick(
  player: Player,
  combat: CombatState,
  playerClass: PlayerClass
): BattleTickResult {
  const power = br(player);
  const crit = Math.random() < classCritChance(playerClass);
  const doubleHit = playerClass === "dancer" && Math.random() < 0.3;

  let damage = rollDamage(power, combat.enemy.power, crit);
  if (playerClass === "model") {
    damage = Math.floor(damage * 1.15);
  }
  if (doubleHit) {
    damage += rollDamage(power, combat.enemy.power, false);
  }

  let hp = Math.max(0, combat.hp - damage);
  const killed = hp <= 0;

  let nextPlayer = player;
  let nextCombat: CombatState = { ...combat, hp };
  let stars = 0;
  let waveCleared = false;
  let stageCleared = false;
  let log = "";

  if (killed) {
    if (combat.wave < combat.totalWaves) {
      const nextWave = combat.wave + 1;
      const enemy = enemyForWave(combat.stage, nextWave, combat.totalWaves);
      nextCombat = {
        enemy,
        hp: enemy.maxHp,
        wave: nextWave,
        totalWaves: combat.totalWaves,
        stage: combat.stage,
      };
      nextPlayer = { ...player, luster: player.luster + 1 };
      waveCleared = true;
      log = `Wave ${combat.wave} cleared — ${enemy.name} enters!`;
    } else {
      const clearedStage = player.stage;
      const loot = killLoot(player, combat.enemy, playerClass);
      stars = starsForKill(power, combat.enemy);
      nextPlayer = onCampaignStageClear(
        {
          ...player,
          luster: player.luster + loot.luster,
          fame: player.fame + loot.fame,
          stage: player.stage + 1,
        },
        clearedStage,
        stars
      );
      nextCombat = newCombatState(nextPlayer.stage);
      stageCleared = true;
      const bossTag = combat.enemy.isBoss ? " BOSS DOWN!" : "";
      log = `★${stars} ${stageLabel(clearedStage)} cleared${bossTag} +✦${loot.luster} +★${loot.fame}`;
    }
  } else {
    const verbs = crit ? ["CRIT", "SLAY", "DEVASTATE"] : ["hit", "strike", "slash"];
    const verb = verbs[Math.floor(Math.random() * verbs.length)];
    log = `${verb} ${combat.enemy.name} for ${damage}${doubleHit ? " x2" : ""} (${hp}/${combat.enemy.maxHp})`;
  }

  return {
    player: nextPlayer,
    combat: nextCombat,
    damage,
    crit,
    doubleHit,
    killed,
    waveCleared,
    stageCleared,
    stars,
    log,
  };
}

export function catchUpBattles(
  player: Player,
  combat: CombatState,
  playerClass: PlayerClass,
  offlineMs: number
): { player: Player; combat: CombatState; logs: string[]; totalDamage: number } {
  const ticks = Math.min(MAX_AFK_TICKS, Math.floor(offlineMs / BATTLE_TICK_MS));
  if (ticks <= 0) {
    return { player, combat, logs: [], totalDamage: 0 };
  }

  let p = player;
  let c = combat;
  const logs: string[] = [];
  let totalDamage = 0;

  for (let i = 0; i < ticks; i++) {
    const result = battleTick(p, c, playerClass);
    p = result.player;
    c = result.combat;
    totalDamage += result.damage;
    if (result.killed) {
      logs.push(result.log);
    }
  }

  if (logs.length > 0) {
    logs.unshift(`AFK: ${ticks} auto-battles while away`);
  }

  return { player: p, combat: c, logs, totalDamage };
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

export function applyAction(player: Player, action: ActionKey): Player | null {
  if (!canAct(player, action)) return null;
  const cost = ACTIONS[action];
  const next = {
    ...player,
    glamour: player.glamour + cost.glamour,
    makeup: player.makeup + cost.makeup,
    fashion: player.fashion + cost.fashion,
    luster: player.luster + cost.luster,
    fame: player.fame + cost.fame,
    energy: player.energy - cost.energy,
  };
  return trackEnergySpent(next, cost.energy);
}

export function actionBrGain(action: ActionKey): number {
  const cost = ACTIONS[action];
  return cost.glamour + cost.makeup + cost.fashion;
}

export function hpPercent(hp: number, maxHp: number): number {
  return Math.min(100, Math.max(0, Math.round((hp / maxHp) * 100)));
}
