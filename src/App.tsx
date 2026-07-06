import { useCallback, useEffect, useRef, useState } from "react";
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
import { SpriteActor } from "./components/SpriteActor";
import { StageBanner } from "./components/StageBanner";
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
  statPercent,
} from "./game";
import { loadPlayerClass, savePlayerClass } from "./lib/playerClass";
import { ensurePlayer, lastActiveAt, savePlayer, touchActive } from "./lib/supabase";
import "./App.css";

type StatKey = "glamour" | "makeup" | "fashion";

const STATS: {
  key: StatKey;
  label: string;
  color: string;
  icon: "glamour" | "makeup" | "fashion";
}[] = [
  { key: "glamour", label: "GLAMOUR", color: "var(--pink)", icon: "glamour" },
  { key: "makeup", label: "MAKEUP", color: "var(--cyan)", icon: "makeup" },
  { key: "fashion", label: "FASHION", color: "var(--gold)", icon: "fashion" },
];

const MAX_LOG = 8;

function StatBar({
  label,
  value,
  color,
  icon,
}: {
  label: string;
  value: number;
  color: string;
  icon: "glamour" | "makeup" | "fashion";
}) {
  return (
    <div className="stat">
      <div className="stat-head">
        <span className="stat-label">
          <GameIcon name={icon} size="sm" />
          {label}
        </span>
        <span className="stat-value">{value}</span>
      </div>
      <div className="stat-track">
        <div
          className="stat-fill"
          style={{ width: `${statPercent(value)}%`, background: color }}
        />
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

        if (result.killed) {
          setLastStars(result.stars);
          triggerVictory();
          void savePlayer(result.player).catch(() => undefined);
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
        [`${ACTIONS[action].label} — power +${ACTIONS[action].glamour + ACTIONS[action].makeup + ACTIONS[action].fashion}!`, ...lines].slice(0, MAX_LOG)
      );

      try {
        const saved = await savePlayer(next);
        setPlayer(saved);
        flashToast(`${ACTIONS[action].label}!`);
      } catch (e) {
        setPlayer(refreshed);
        flashToast(e instanceof Error ? e.message : "Save failed");
      } finally {
        setBusy(null);
      }
    },
    [player, busy, flashToast]
  );

  if (error) {
    return (
      <main className="pbbg error-screen">
        <p className="error-title">GLAMOUR</p>
        <p className="error-msg">{error}</p>
        <p className="error-hint">Check your connection and Supabase configuration</p>
      </main>
    );
  }

  if (!player || !combat) {
    return (
      <main className="pbbg loading-screen">
        <p className="loading-text">PRIMPING…</p>
      </main>
    );
  }

  const live = regenEnergy(player);
  const info = stageInfo(live.stage);
  const power = combatPower(live);
  const classLabel = playerClass?.toUpperCase() ?? "???";
  const enemyHpPct = hpPercent(combat.hp, combat.enemy.maxHp);

  const base = import.meta.env.BASE_URL;
  const themeStyle = {
    "--arena-bg": `url(${base}ui/arena-bg.jpg)`,
    "--ui-corner": `url(${base}ui/ui-corner.png)`,
  } as React.CSSProperties;

  return (
    <main className={`pbbg pbbg-ch-${(info.chapter - 1) % 4}`} style={themeStyle}>
      <header className="top-bar panel panel-ornate">
        <div className="brand">
          <h1>GLAMOUR</h1>
          <span className="zone">{info.chapterName}</span>
        </div>
        <div className="currencies">
          <span className="currency-pill luster">
            <GameIcon name="luster" size="sm" />
            <span className="currency-val">{live.luster}</span>
          </span>
          <span className="currency-pill energy">
            <GameIcon name="energy" size="sm" />
            <span className="currency-val">{live.energy}</span>
          </span>
          <span className="currency-pill fame">
            <GameIcon name="fame" size="sm" />
            <span className="currency-val">{live.fame}</span>
          </span>
        </div>
      </header>

      <StageBanner stage={live.stage} autoBattle={!!playerClass} />

      <section className={`arena panel panel-ornate ${combat.enemy.isBoss ? "arena-boss-fight" : ""}`}>
        <div className="arena-bg" aria-hidden />
        <div className="arena-overlay" aria-hidden />
        {combat.enemy.isBoss && <div className="boss-warning">⚠ BOSS FIGHT</div>}

        <VictoryFlash active={victoryFlash} />
        <HitFlash active={enemyHit} />
        <DamageFloaters floaters={floaters} />

        <div className="arena-side arena-player">
          <div className="fighter-card">
            <p className="arena-label">{classLabel}</p>
            <div className="cp-badge">
              <GameIcon name="power" size="sm" />
              <span>{power}</span>
            </div>
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
              {"★".repeat(lastStars)}
              {"☆".repeat(3 - lastStars)}
            </span>
          )}
        </div>

        <div className={`arena-side arena-enemy ${combat.enemy.isBoss ? "arena-boss" : ""}`}>
          <div className="fighter-card fighter-card-enemy">
            <p className="arena-label">{combat.enemy.name}</p>
            <div className="cp-badge cp-badge-enemy">
              <span>{combat.enemy.power}</span>
            </div>
            <div className="hp-bar hp-enemy hp-ornate">
              <div className="hp-fill hp-fill-enemy" style={{ width: `${enemyHpPct}%` }} />
              <span className="hp-text">
                {combat.hp}/{combat.enemy.maxHp}
              </span>
            </div>
          </div>
          <EnemyActor enemy={combat.enemy} hit={enemyHit} />
        </div>
      </section>

      <section className="mid-row">
        <div className="stats panel panel-ornate">
          <p className="panel-subtitle">HERO STATS</p>
          {STATS.map((s) => (
            <StatBar
              key={s.key}
              label={s.label}
              value={live[s.key]}
              color={s.color}
              icon={s.icon}
            />
          ))}
        </div>

        <div className="combat-log panel panel-ornate">
          <p className="log-title">BATTLE LOG</p>
          <ul>
            {log.map((line, i) => (
              <li key={`${i}-${line}`} className={line.includes("cleared") ? "log-victory" : ""}>
                {line}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <footer className="bottom-bar panel panel-ornate">
        <p className="skill-bar-title">HERO SKILLS</p>
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
        <p className="idle-hint">
          Auto-battle every {BATTLE_TICK_MS / 1000}s · Boss every {5} stages · AFK progress saved
        </p>
      </footer>

      {!playerClass && <ClassSelect onPick={pickClass} />}

      {toast && <p className="toast">{toast}</p>}
    </main>
  );
}
