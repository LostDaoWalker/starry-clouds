export type GearSlot = "wig" | "shoes" | "bag";

export type PlayerGear = Record<GearSlot, number>;

export type DailyKey = "arena" | "stage" | "energy";

export type PlayerExtras = {
  gear: PlayerGear;
  crew: string | null;
  arenaFightsLeft: number;
  dailyReset: string;
  stageStars: Record<string, number>;
  dailies: Record<DailyKey, boolean>;
  dailyProgress: { arenaWins: number; stagesCleared: number; energySpent: number };
};

export type Player = {
  id: string;
  glamour: number;
  makeup: number;
  fashion: number;
  luster: number;
  energy: number;
  fame: number;
  stage: number;
  last_energy_at: string;
  extras: PlayerExtras;
};

export type PlayerClass = "diva" | "model" | "dancer" | "streamer";

export type StageInfo = {
  global: number;
  chapter: number;
  stageInChapter: number;
  chapterName: string;
  isBoss: boolean;
};

export type EnemySprite = "minion" | "rival" | "paparazzo" | "critic" | "boss";

export type Enemy = {
  name: string;
  maxHp: number;
  power: number;
  isBoss: boolean;
  sprite: EnemySprite;
};

export type CombatState = {
  enemy: Enemy;
  hp: number;
  wave: number;
  totalWaves: number;
  stage: number;
};

export type BattleTickResult = {
  player: Player;
  combat: CombatState;
  damage: number;
  crit: boolean;
  doubleHit: boolean;
  killed: boolean;
  waveCleared: boolean;
  stageCleared: boolean;
  stars: number;
  log: string;
};
