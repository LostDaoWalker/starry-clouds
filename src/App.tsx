import { useCallback, useEffect, useRef, useState } from "react";
import { BottomDock } from "./components/BottomDock";
import { InfoBar } from "./components/InfoBar";
import { TabNav } from "./components/TabNav";
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
import { FaceCard } from "./components/FaceCard";
import { GameIcon } from "./components/GameIcon";
import {
  ActionSceneVignette,
  MogFlash,
  useActionScene,
  useMogFlash,
} from "./components/MogFlash";
import { QuestTracker } from "./components/QuestTracker";
import { SpriteActor } from "./components/SpriteActor";
import { StageProgress } from "./components/StageProgress";
import {
  ACTIONS,
  type ActionKey,
  type CombatState,
  type Player,
  type PlayerClass,
  applyAction,
  battleTick,
  BATTLE_TICK_MS,
  canAct,
  catchUpBattles,
  combatPower,
  hpPercent,
  newCombatState,
  regenEnergy,
  stageInfo,
  stageLabel,
} from "./game";
import { loadPlayerClass, savePlayerClass } from "./lib/playerClass";
import { actionSceneUrl, arenaSceneUrl } from "./lib/scenes";
import { ensurePlayer, lastActiveAt, savePlayer, touchActive } from "./lib/supabase";
import "./App.css";

const MAX_LOG = 6;

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
  const [player, setPlayer] = useState<Player | null>(null);
  const [combat, setCombat] = useState<CombatState | null>(null);
  const [playerClass, setPlayerClass] = useState<PlayerClass | null>(loadPlayerClass);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<ActionKey | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [log, setLog] = useState<string[]>(["Auto-battle engaged. Clear stages for loot!"]);
  const [lastStars, setLastStars] = useState(0);
  const combatRef = useRef<CombatState | null>(null);
  combatRef.current = combat;

  const { floaters, spawn: spawnDamage } = useDamageFloaters();
  const { flash: victoryFlash, trigger: triggerVictory } = useVictoryFlash();
  const { hit: enemyHit, trigger: triggerHit } = useHitFlash();
  const { flash: mogFlash, trigger: triggerMog } = useMogFlash();
  const { sceneUrl: actionScene, show: showActionScene } = useActionScene();

  const flashToast = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 1600);
  }, []);

  useEffect(() => {
    ensurePlayer()
      .then((p) => {
        const initialCombat = newCombatState(p.stage);
        const cls = loadPlayerClass();

        if (cls) {
          const offlineMs = Date.now() - lastActiveAt();
          if (offlineMs >= BATTLE_TICK_MS * 2) {
            const result = catchUpBattles(p, initialCombat, cls, offlineMs);
            combatRef.current = result.combat;
            setPlayer(result.player);
            setCombat(result.combat);
            if (result.logs.length > 0) {
              setLog((lines) => [...result.logs, ...lines].slice(0, MAX_LOG));
            }
            void savePlayer(result.player).catch(() => undefined);
          } else {
            setPlayer(p);
            setCombat(initialCombat);
          }
        } else {
          setPlayer(p);
          setCombat(initialCombat);
        }

        touchActive();
      })
      .catch((e: Error) => setError(e.message));
  }, []);

  useEffect(() => {
    if (!player) return;
    const id = window.setInterval(() => {
      setPlayer((current) => (current ? regenEnergy(current) : current));
    }, 1000);
    return () => window.clearInterval(id);
  }, [player?.id]);

  useEffect(() => {
    if (!player || !playerClass || !combat) return;

    const id = window.setInterval(() => {
      setPlayer((current) => {
        if (!current) return current;
        const c = combatRef.current;
        if (!c) return current;

        const result = battleTick(current, c, playerClass);
        combatRef.current = result.combat;
        setCombat(result.combat);
        spawnDamage(result.damage, result.crit);
        if (!result.killed) triggerHit();
        setLog((lines) => [result.log, ...lines].slice(0, MAX_LOG));

        if (result.stageCleared) {
          setLastStars(result.stars);
          triggerVictory();
          if (result.mogVerdict) triggerMog(result.mogVerdict, result.mogDelta);
          void savePlayer(result.player).catch(() => undefined);
        } else if (result.waveCleared) {
          triggerVictory();
          if (result.mogVerdict) triggerMog(result.mogVerdict, result.mogDelta);
        }

        return result.player;
      });
    }, BATTLE_TICK_MS);

    return () => window.clearInterval(id);
  }, [player?.id, playerClass, spawnDamage, triggerVictory, triggerHit]);

  const pickClass = (next: PlayerClass) => {
    savePlayerClass(next);
    setPlayerClass(next);
    setLog((lines) => [`${next.toUpperCase()} joins the campaign!`, ...lines].slice(0, MAX_LOG));
  };

  const act = useCallback(
    async (action: ActionKey) => {
      if (!player || busy) return;
      const refreshed = regenEnergy(player);
      if (!canAct(refreshed, action)) {
        flashToast(
          action === "shop" && refreshed.luster < 10
            ? "Need more luster"
            : "Not enough energy"
        );
        return;
      }

      setBusy(action);
      const next = applyAction(refreshed, action);
      setPlayer(next);
      setLog((lines) =>
        [
          `${ACTIONS[action].label} — BR +${ACTIONS[action].glamour + ACTIONS[action].makeup + ACTIONS[action].fashion}!`,
          ...lines,
        ].slice(0, MAX_LOG)
      );

      try {
        const saved = await savePlayer(next);
        setPlayer(saved);
        flashToast(`${ACTIONS[action].label}!`);
        const scene = actionSceneUrl(action);
        if (scene) showActionScene(scene);
      } catch (e) {
        setPlayer(refreshed);
        flashToast(e instanceof Error ? e.message : "Save failed");
      } finally {
        setBusy(null);
      }
    },
    [player, busy, flashToast, showActionScene]
  );

  const base = import.meta.env.BASE_URL;
  const chapter = player ? stageInfo(regenEnergy(player).stage).chapter : 1;
  const themeStyle = {
    "--arena-bg": `url(${arenaSceneUrl(chapter)})`,
    "--ui-corner": `url(${base}ui/ui-corner.png)`,
    "--ui-parchment": `url(${base}ui/ui-parchment.jpg)`,
    "--ui-stone-bar": `url(${base}ui/ui-stone-bar.jpg)`,
    "--ui-raid-banner": `url(${base}ui/ui-raid-banner.jpg)`,
  } as React.CSSProperties;

  if (error) {
    return (
      <GameFrame style={themeStyle}>
        <main className="pbbg error-screen">
          <p className="error-title">GLAMOUR</p>
          <p className="error-msg">{error}</p>
          <p className="error-hint">Check your connection and Supabase configuration</p>
        </main>
      </GameFrame>
    );
  }

  if (!player || !combat) {
    return (
      <GameFrame style={themeStyle}>
        <main className="pbbg loading-screen">
          <p className="loading-text">PRIMPING…</p>
        </main>
      </GameFrame>
    );
  }

  const live = regenEnergy(player);
  const info = stageInfo(live.stage);
  const power = combatPower(live);
  const enemyHpPct = hpPercent(combat.hp, combat.enemy.maxHp);

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

        <TabNav />

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
          <MogFlash flash={mogFlash} />
          <ActionSceneVignette sceneUrl={actionScene} />
          <HitFlash active={enemyHit} />
          <DamageFloaters floaters={floaters} />

          <QuestTracker
            stage={live.stage}
            power={power}
            wave={combat.wave}
            totalWaves={combat.totalWaves}
          />

          <div className="arena-battle">
            <div className="arena-side arena-player">
              {playerClass && (
                <FaceCard playerClass={playerClass} player={live} compact />
              )}
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

        <footer className="action-row panel panel-stone">
          <nav className="actions">
            {(Object.keys(ACTIONS) as ActionKey[]).map((key) => (
              <button
                key={key}
                type="button"
                className={`action action-${key}`}
                disabled={busy !== null || !canAct(live, key)}
                onClick={() => act(key)}
              >
                <span className="action-ring">
                  <GameIcon name={key} size="lg" />
                </span>
                <span className="action-label">{ACTIONS[key].label}</span>
              </button>
            ))}
          </nav>
        </footer>

        <BottomDock onEnhance={() => act("primp")} />

        {!playerClass && <ClassSelect onPick={pickClass} />}

        {toast && <p className="toast">{toast}</p>}
      </main>
    </GameFrame>
  );
}
