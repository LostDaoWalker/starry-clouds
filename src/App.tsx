import { useCallback, useEffect, useState } from "react";
import { ArenaPanel } from "./components/ArenaPanel";
import { BottomDock } from "./components/BottomDock";
import { CrewPanel } from "./components/CrewPanel";
import { GearPanel } from "./components/GearPanel";
import { InfoBar } from "./components/InfoBar";
import { QuestPanel } from "./components/QuestPanel";
import { TabNav, type GameTab } from "./components/TabNav";
import { ClassSelect } from "./components/ClassSelect";
import {
  DamageFloaters,
  HitFlash,
  VictoryFlash,
  useDamageFloaters,
  useHitFlash,
  useVictoryFlash,
} from "./components/DamageFloater";
import { EnemyActor } from "./components/EnemyActor";
import { GameIcon } from "./components/GameIcon";
import { QuestTracker } from "./components/QuestTracker";
import { SpriteActor } from "./components/SpriteActor";
import { StageProgress } from "./components/StageProgress";
import {
  blitzableStages,
  BATTLE_TICK_MS,
  br,
  hpPercent,
  pendingDailyClaims,
  stageInfo,
  stageLabel,
  type PlayerClass,
} from "./game";
import { useGameSession } from "./hooks/useGameSession";
import { loadPlayerClass, savePlayerClass } from "./lib/playerClass";
import "./App.css";

function GameFrame({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div className="game-shell">
      <div className="game-frame" style={style}>
        {children}
      </div>
    </div>
  );
}

export default function App() {
  const [playerClass, setPlayerClass] = useState<PlayerClass | null>(loadPlayerClass);
  const [toast, setToast] = useState<string | null>(null);
  const [lastStars, setLastStars] = useState(0);
  const [tab, setTab] = useState<GameTab>("home");
  const [showForge, setShowForge] = useState(false);
  const [showParty, setShowParty] = useState(false);

  const flashToast = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 1600);
  }, []);

  const {
    live,
    combat,
    busy,
    log,
    loadError,
    tick,
    train,
    fightArena,
    claimQuest,
    blitz,
    forge,
    pickCrew,
  } = useGameSession(flashToast);

  const { floaters, spawn: spawnDamage } = useDamageFloaters();
  const { flash: victoryFlash, trigger: triggerVictory } = useVictoryFlash();
  const { hit: enemyHit, trigger: triggerHit } = useHitFlash();

  useEffect(() => {
    if (!live || !playerClass || !combat || tab !== "home") return;

    const id = window.setInterval(() => {
      const result = tick(playerClass);
      if (!result) return;

      spawnDamage(result.damage, result.crit);
      if (!result.killed) triggerHit();

      if (result.stageCleared) {
        setLastStars(result.stars);
        triggerVictory();
      } else if (result.waveCleared) {
        triggerVictory();
      }
    }, BATTLE_TICK_MS);

    return () => window.clearInterval(id);
  }, [live?.id, live?.stage, playerClass, tab, tick, spawnDamage, triggerVictory, triggerHit, combat]);

  const pickClass = (next: PlayerClass) => {
    savePlayerClass(next);
    setPlayerClass(next);
  };

  const handleCrew = async (crewId: Parameters<typeof pickCrew>[0]) => {
    const saved = await pickCrew(crewId);
    if (saved) setShowParty(false);
  };

  const base = import.meta.env.BASE_URL;
  const themeStyle = {
    "--arena-bg": `url(${base}ui/arena-bg.jpg)`,
    "--ui-corner": `url(${base}ui/ui-corner.png)`,
    "--ui-parchment": `url(${base}ui/ui-parchment.jpg)`,
    "--ui-stone-bar": `url(${base}ui/ui-stone-bar.jpg)`,
    "--ui-raid-banner": `url(${base}ui/ui-raid-banner.jpg)`,
  } as React.CSSProperties;

  if (loadError) {
    return (
      <GameFrame style={themeStyle}>
        <main className="pbbg error-screen">
          <p className="error-title">GLAMOUR</p>
          <p className="error-msg">{loadError}</p>
          <p className="error-hint">Check your connection and Supabase configuration</p>
        </main>
      </GameFrame>
    );
  }

  if (!live || !combat) {
    return (
      <GameFrame style={themeStyle}>
        <main className="pbbg loading-screen">
          <p className="loading-text">PRIMPING…</p>
        </main>
      </GameFrame>
    );
  }

  const info = stageInfo(live.stage);
  const power = br(live);
  const classLabel = playerClass?.toUpperCase() ?? "???";
  const enemyHpPct = hpPercent(combat.hp, combat.enemy.maxHp);
  const questBadge = pendingDailyClaims(live);

  return (
    <GameFrame style={themeStyle}>
      <main className={`pbbg pbbg-ch-${(info.chapter - 1) % 4}`}>
        <InfoBar
          playerClass={playerClass}
          stage={live.stage}
          power={power}
          luster={live.luster}
          energy={live.energy}
          fame={live.fame}
        />

        <TabNav
          active={tab}
          onChange={setTab}
          questBadge={questBadge}
          arenaFights={live.extras.arenaFightsLeft}
        />

        {tab === "home" && (
          <section className={`arena panel panel-stone ${combat.enemy.isBoss ? "arena-boss-fight" : ""}`}>
            <div className="arena-bg" aria-hidden />
            <div className="arena-overlay" aria-hidden />

            <div className="arena-hud-top">
              <div className="stage-chip">
                <span className="stage-chapter">{info.chapterName}</span>
                <span className="stage-id">
                  {stageLabel(live.stage)}
                  {info.isBoss && <span className="boss-tag">BOSS</span>}
                </span>
                <StageProgress stage={live.stage} />
              </div>
              <span className="auto-battle">
                <GameIcon name="auto" size="sm" />
                AUTO
              </span>
            </div>

            <div className="wave-banner">
              <GameIcon name="wave" size="sm" />
              WAVE {combat.wave}/{combat.totalWaves}
            </div>

            {combat.enemy.isBoss && (
              <div className="boss-warning">
                <span>RAID BOSS</span>
              </div>
            )}

            <VictoryFlash active={victoryFlash} />
            <HitFlash active={enemyHit} />
            <DamageFloaters floaters={floaters} />

            <QuestTracker stage={live.stage} power={power} wave={combat.wave} totalWaves={combat.totalWaves} />

            <div className="arena-battle">
              <div className="arena-side arena-player">
                <div className="fighter-card">
                  <p className="arena-label">{classLabel}</p>
                  <div className="hp-bar hp-player hp-ornate">
                    <div className="hp-fill hp-fill-player" style={{ width: "100%" }} />
                  </div>
                </div>
                <div className="hero-actor-wrap">
                  <div className="hero-aura" aria-hidden />
                  {playerClass && <SpriteActor playerClass={playerClass} />}
                  <div className="hero-platform" aria-hidden />
                </div>
              </div>

              <div className="arena-center">
                <span className="arena-vs">VS</span>
                {lastStars > 0 && (
                  <span className="star-rating" aria-label={`${lastStars} stars`}>
                    <GameIcon name="star" size="sm" />
                    {"★".repeat(lastStars)}
                    {"☆".repeat(3 - lastStars)}
                  </span>
                )}
              </div>

              <div className={`arena-side arena-enemy ${combat.enemy.isBoss ? "arena-boss" : ""}`}>
                <div className="fighter-card fighter-card-enemy">
                  <p className="arena-label">{combat.enemy.name}</p>
                  <div className="hp-bar hp-enemy hp-ornate">
                    <div className="hp-fill hp-fill-enemy" style={{ width: `${enemyHpPct}%` }} />
                    <span className="hp-text">
                      {combat.hp}/{combat.enemy.maxHp}
                    </span>
                  </div>
                </div>
                <EnemyActor enemy={combat.enemy} hit={enemyHit} />
              </div>
            </div>
          </section>
        )}

        {tab === "quest" && (
          <QuestPanel
            player={live}
            blitzStages={blitzableStages(live)}
            onClaim={claimQuest}
            onBlitz={blitz}
            busy={busy}
          />
        )}

        {tab === "raid" && <ArenaPanel player={live} onFight={fightArena} busy={busy} />}

        <section className="combat-log panel panel-parchment">
          <p className="log-title">CHRONICLE</p>
          <ul>
            {log.map((line, i) => (
              <li key={`${i}-${line}`} className={line.includes("cleared") ? "log-victory" : ""}>
                {line}
              </li>
            ))}
          </ul>
        </section>

        {tab === "home" && (
          <footer className="action-row panel panel-stone">
            <nav className="actions">
              <button type="button" className="action action-primp" disabled={busy} onClick={() => train("primp")}>
                <span className="action-ring">
                  <GameIcon name="primp" size="lg" />
                </span>
                <span className="action-label">ENHANCE</span>
              </button>
              <button type="button" className="action action-shop" disabled={busy} onClick={() => train("shop")}>
                <span className="action-ring">
                  <GameIcon name="shop" size="lg" />
                </span>
                <span className="action-label">OUTFIT</span>
              </button>
              <button type="button" className="action action-strut" disabled={busy} onClick={() => train("strut")}>
                <span className="action-ring">
                  <GameIcon name="strut" size="lg" />
                </span>
                <span className="action-label">SPOTLIGHT</span>
              </button>
            </nav>
          </footer>
        )}

        <BottomDock
          onEnhance={() => train("primp")}
          onForge={() => setShowForge(true)}
          onParty={() => setShowParty(true)}
          onShop={() => train("shop")}
        />

        {showForge && (
          <GearPanel player={live} onUpgrade={forge} onClose={() => setShowForge(false)} busy={busy} />
        )}

        {showParty && <CrewPanel player={live} onAssign={handleCrew} onClose={() => setShowParty(false)} />}

        {!playerClass && <ClassSelect onPick={pickClass} />}

        {toast && <p className="toast">{toast}</p>}
      </main>
    </GameFrame>
  );
}
