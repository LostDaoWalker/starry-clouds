import { useCallback, useEffect, useState } from "react";
import {
  ACTIONS,
  type ActionKey,
  type Player,
  applyAction,
  blockReason,
  canAct,
  regenEnergy,
  statPercent,
} from "../shared/game.js";
import { fetchPlayer, sendAction } from "./lib/api";
import "./App.css";

type StatKey = "glamour" | "makeup" | "fashion";

const STATS: { key: StatKey; label: string; color: string }[] = [
  { key: "glamour", label: "GLAMOUR", color: "var(--pink)" },
  { key: "makeup", label: "MAKEUP", color: "var(--cyan)" },
  { key: "fashion", label: "FASHION", color: "var(--gold)" },
];

function StatBar({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="stat">
      <div className="stat-head">
        <span className="stat-label">{label}</span>
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
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<ActionKey | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    fetchPlayer()
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

  const flash = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 1400);
  }, []);

  const act = useCallback(
    async (action: ActionKey) => {
      if (!player || busy) return;
      const refreshed = regenEnergy(player);
      if (!canAct(refreshed, action)) {
        flash(blockReason(refreshed, action) ?? "Not enough energy");
        return;
      }

      setBusy(action);
      const next = applyAction(refreshed, action);
      setPlayer(next);

      try {
        const saved = await sendAction(action);
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
      <main className="screen error-screen">
        <p className="error-title">GLAMOUR</p>
        <p className="error-msg">{error}</p>
        <p className="error-hint">Is the game server running?</p>
      </main>
    );
  }

  if (!player) {
    return (
      <main className="screen loading-screen">
        <p className="loading-text">PRIMPING…</p>
      </main>
    );
  }

  const live = regenEnergy(player);

  return (
    <main className="screen">
      <figure className="hero">
        <img src="/hero.png" alt="Your glamorous avatar" />
      </figure>

      <section className="hud">
        <header className="hud-top">
          <h1>GLAMOUR</h1>
          <div className="currencies">
            <span className="luster">✦ {live.luster}</span>
            <span className="energy">⚡ {live.energy}</span>
            <span className="fame">★ {live.fame}</span>
          </div>
        </header>

        <div className="stats">
          {STATS.map((s) => (
            <StatBar
              key={s.key}
              label={s.label}
              value={live[s.key]}
              color={s.color}
            />
          ))}
        </div>

        <nav className="actions">
          {(Object.keys(ACTIONS) as ActionKey[]).map((key) => (
            <button
              key={key}
              type="button"
              className={`action action-${key}`}
              disabled={busy !== null || !canAct(live, key)}
              onClick={() => act(key)}
            >
              {ACTIONS[key].label}
            </button>
          ))}
        </nav>
      </section>

      {toast && <p className="toast">{toast}</p>}
    </main>
  );
}
