import { useState } from "react";

type Floater = {
  id: number;
  value: number;
  crit: boolean;
  side: "player" | "enemy";
};

let floaterId = 0;

export function useDamageFloaters() {
  const [floaters, setFloaters] = useState<Floater[]>([]);

  const spawn = (damage: number, crit: boolean, side: Floater["side"] = "enemy") => {
    const id = ++floaterId;
    setFloaters((f) => [...f, { id, value: damage, crit, side }]);
    window.setTimeout(() => {
      setFloaters((f) => f.filter((x) => x.id !== id));
    }, 900);
  };

  return { floaters, spawn };
}

export function DamageFloaters({ floaters }: { floaters: Floater[] }) {
  return (
    <div className="damage-floaters" aria-hidden>
      {floaters.map((f) => (
        <span
          key={f.id}
          className={`damage-num damage-${f.side} ${f.crit ? "damage-crit" : ""}`}
        >
          {f.crit ? "CRIT " : ""}-{f.value}
        </span>
      ))}
    </div>
  );
}

export function useVictoryFlash() {
  const [flash, setFlash] = useState(false);

  const trigger = () => {
    setFlash(true);
    window.setTimeout(() => setFlash(false), 600);
  };

  return { flash, trigger };
}

export function VictoryFlash({ active }: { active: boolean }) {
  if (!active) return null;
  return <div className="victory-flash" aria-hidden />;
}
