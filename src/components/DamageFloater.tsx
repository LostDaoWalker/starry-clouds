import { useState } from "react";

type Floater = {
  id: number;
  value: number;
  crit: boolean;
  x: number;
  y: number;
};

let floaterId = 0;

export function useDamageFloaters() {
  const [floaters, setFloaters] = useState<Floater[]>([]);

  const spawn = (damage: number, crit: boolean) => {
    const id = ++floaterId;
    const x = 52 + Math.random() * 22;
    const y = 22 + Math.random() * 18;
    setFloaters((f) => [...f, { id, value: damage, crit, x, y }]);
    window.setTimeout(() => {
      setFloaters((f) => f.filter((x) => x.id !== id));
    }, 950);
  };

  return { floaters, spawn };
}

export function DamageFloaters({ floaters }: { floaters: Floater[] }) {
  return (
    <div className="damage-floaters" aria-hidden>
      {floaters.map((f) => (
        <span
          key={f.id}
          className={`damage-num ${f.crit ? "damage-crit" : ""}`}
          style={{ left: `${f.x}%`, top: `${f.y}%` }}
        >
          {f.crit ? "CRIT! " : ""}-{f.value}
        </span>
      ))}
    </div>
  );
}

export function useVictoryFlash() {
  const [flash, setFlash] = useState(false);

  const trigger = () => {
    setFlash(true);
    window.setTimeout(() => setFlash(false), 700);
  };

  return { flash, trigger };
}

export function VictoryFlash({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <div className="victory-flash" aria-hidden>
      <span className="victory-text">VICTORY!</span>
    </div>
  );
}

export function useHitFlash() {
  const [hit, setHit] = useState(false);

  const trigger = () => {
    setHit(true);
    window.setTimeout(() => setHit(false), 220);
  };

  return { hit, trigger };
}

export function HitFlash({ active }: { active: boolean }) {
  if (!active) return null;
  return <div className="hit-flash" aria-hidden />;
}
