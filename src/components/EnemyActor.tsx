import type { Enemy } from "../game";
import { enemySprite } from "../lib/icons";

type EnemyActorProps = {
  enemy: Enemy;
  hit?: boolean;
};

export function EnemyActor({ enemy, hit }: EnemyActorProps) {
  return (
    <div className={`enemy-actor-wrap ${enemy.isBoss ? "enemy-actor-boss" : ""} ${hit ? "enemy-hit" : ""}`}>
      <div className="enemy-aura" aria-hidden />
      <div className="enemy-frame">
        <img className="enemy-sprite" src={enemySprite(enemy.sprite)} alt="" draggable={false} />
      </div>
      <div className="enemy-platform" aria-hidden />
    </div>
  );
}
