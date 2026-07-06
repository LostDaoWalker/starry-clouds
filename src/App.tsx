import { useCallback, useEffect, useState } from "react";
import { ClassSelect } from "./components/ClassSelect";
import { GameIcon } from "./components/GameIcon";
import { SpriteActor } from "./components/SpriteActor";
import {
  ACTIONS,
  type ActionKey,
  type Player,
  type PlayerClass,
  applyAction,
  canAct,
  combatPower,
  idleTick,
  regenEnergy,
  statPercent,
  zoneForFame,
  IDLE_TICK_MS,
} from "./game";
import { loadPlayerClass, savePlayerClass } from "./lib/playerClass";
import { ensurePlayer, savePlayer } from "./lib/supabase";
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

const MAX_LOG = 5;

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
  const [playerClass, setPlayerClass] = useState<PlayerClass | null>(loadPlayerClass);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<ActionKey | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [log, setLog] = useState<string[]>(["Welcome to the runway raid."]);

  useEffect(() => {
    ensurePlayer()
      .then(setPlayer)
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
    if (!player || !playerClass) return;

    const id = window.setInterval(() => {
      setPlayer((current) => {
        if (!current) return current;
        const { player: next, log: line } = idleTick(current, playerClass);
        setLog((lines) => [line, ...lines].slice(0, MAX_LOG));
        void savePlayer(next).catch(() => undefined);
        return next;
      });
    }, IDLE_TICK_MS);

    return () => window.clearInterval(id);
  }, [player?.id, playerClass]);

  const flash = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 1400);
  }, []);

  const pickClass = (next: PlayerClass) => {
    savePlayerClass(next);
    setPlayerClass(next);
    setLog((lines) => [`${next.toUpperCase()} enters the arena!`, ...lines].slice(0, MAX_LOG));
  };

  const act = useCallback(
    async (action: ActionKey) => {
      if (!player || busy) return;
      const refreshed = regenEnergy(player);
      if (!canAct(refreshed, action)) {
        flash(
          action === "shop" && refreshed.luster < 8
            ? "Need more luster"
            : "Not enough energy"
        );
        return;
      }

      setBusy(action);
      const next = applyAction(refreshed, action);
      setPlayer(next);
      setLog((lines) =>
        [`${ACTIONS[action].label} — power rises!`, ...lines].slice(0, MAX_LOG)
      );

      try {
        const saved = await savePlayer(next);
        setPlayer(saved);
        flash(`${ACTIONS[action].label}!`);
      } catch (e) {
        setPlayer(refreshed);
        flash(e instanceof Error ? e.message : "Save failed");
      } finally {
        setBusy(null);
      }
    },
    [player, busy, flash]
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

  if (!player) {
    return (
      <main className="pbbg loading-screen">
        <p className="loading-text">PRIMPING…</p>
      </main>
    );
  }

  const live = regenEnergy(player);
  const zone = zoneForFame(live.fame);
  const power = combatPower(live);
  const classLabel = playerClass?.toUpperCase() ?? "???";

  return (
    <main className="pbbg">
      <header className="top-bar panel">
        <div className="brand">
          <h1>GLAMOUR</h1>
          <span className="zone">{zone.name}</span>
        </div>
        <div className="currencies">
          <span className="currency luster">
            <GameIcon name="luster" size="sm" />
            {live.luster}
          </span>
          <span className="currency energy">
            <GameIcon name="energy" size="sm" />
            {live.energy}
          </span>
          <span className="currency fame">
            <GameIcon name="fame" size="sm" />
            {live.fame}
          </span>
        </div>
      </header>

      <section className="arena panel">
        <div className="arena-side arena-player">
          <p className="arena-label">{classLabel}</p>
          <p className="arena-power">
            <GameIcon name="power" size="sm" />
            PWR {power}
          </p>
          {playerClass && <SpriteActor playerClass={playerClass} />}
        </div>

        <div className="arena-vs">VS</div>

        <div className="arena-side arena-enemy">
          <p className="arena-label">{zone.enemy}</p>
          <div className="enemy-silhouette" aria-hidden />
          <div className="enemy-hp">
            <div
              className="enemy-hp-fill"
              style={{ width: `${Math.max(8, 100 - statPercent(live.fame % 100))}%` }}
            />
          </div>
        </div>
      </section>

      <section className="mid-row">
        <div className="stats panel">
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

        <div className="combat-log panel">
          <p className="log-title">COMBAT LOG</p>
          <ul>
            {log.map((line, i) => (
              <li key={`${i}-${line}`}>{line}</li>
            ))}
          </ul>
        </div>
      </section>

      <footer className="bottom-bar panel">
        <nav className="actions">
          {(Object.keys(ACTIONS) as ActionKey[]).map((key) => (
            <button
              key={key}
              type="button"
              className={`action action-${key}`}
              disabled={busy !== null || !canAct(live, key)}
              onClick={() => act(key)}
            >
              <GameIcon name={key} size="lg" />
              {ACTIONS[key].label}
            </button>
          ))}
        </nav>
        <p className="idle-hint">Auto-raid every {IDLE_TICK_MS / 1000}s · one screen · no scroll</p>
      </footer>

      {!playerClass && <ClassSelect onPick={pickClass} />}

      {toast && <p className="toast">{toast}</p>}
    </main>
  );
}
