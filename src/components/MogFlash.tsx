import { useState } from "react";
import type { MogResult } from "../game";

export function useMogFlash() {
  const [active, setActive] = useState(false);
  const [result, setResult] = useState<MogResult | null>(null);

  const trigger = (mog: MogResult) => {
    setResult(mog);
    setActive(true);
    window.setTimeout(() => {
      setActive(false);
      setResult(null);
    }, 1400);
  };

  return { active, result, trigger };
}

type MogFlashProps = {
  active: boolean;
  result: MogResult | null;
  variant?: "duel" | "crit";
};

export function MogFlash({ active, result, variant = "duel" }: MogFlashProps) {
  if (!active || !result) return null;

  const base = import.meta.env.BASE_URL;

  return (
    <div className={`mog-flash mog-flash-${variant}`} aria-live="polite">
      {variant === "duel" && (
        <div className="mog-duel-scores">
          <span className="mog-you">{result.playerScore}</span>
          <span className="mog-vs">VS</span>
          <span className="mog-them">{result.rivalScore}</span>
        </div>
      )}
      {result.mogged ? (
        <img
          className="mogged-splash"
          src={`${base}ui/mogged-splash.webp`}
          alt="MOGGED"
          draggable={false}
        />
      ) : (
        <span className="mog-fail">OUTSHINED…</span>
      )}
      {variant === "duel" && (
        <p className="mog-rival">vs {result.rivalName}</p>
      )}
    </div>
  );
}
