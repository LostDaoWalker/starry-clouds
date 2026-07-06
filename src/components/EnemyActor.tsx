import type { Enemy } from "../game";

const base = import.meta.env.BASE_URL;

type EnemyActorProps = {
  enemy: Enemy;
  hit?: boolean;
};

export function EnemyActor({ enemy, hit }: EnemyActorProps) {
  const src = enemy.isBoss
    ? `${base}enemies/enemy-boss.png`
    : `${base}enemies/enemy-rival.png`;

  return (
    <div className={`enemy-actor-wrap ${enemy.isBoss ? "enemy-actor-boss" : ""} ${hit ? "enemy-hit" : ""}`}>
      <div className="enemy-aura" aria-hidden />
      <div className="enemy-frame">
        <img className="enemy-sprite" src={src} alt="" draggable={false} />
      </div>
      <div className="enemy-platform" aria-hidden />
    </div>
  );
}
