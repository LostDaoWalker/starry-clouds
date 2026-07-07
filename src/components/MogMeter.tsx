import type { Enemy, MogTier, Player } from "../game";
import { MOG_TIER_LABEL, combatPower, enemyFaceRating, mogTier } from "../game";

type MogMeterProps = {
  player: Player;
  enemy: Enemy;
};

const TIER_CLASS: Record<MogTier, string> = {
  mogged: "mog-tier-mogged",
  mid: "mog-tier-mid",
  serve: "mog-tier-serve",
};

export function MogMeter({ player, enemy }: MogMeterProps) {
  const yours = combatPower(player);
  const theirs = enemyFaceRating(enemy);
  const tier = mogTier(yours, enemy);
  const max = Math.max(yours, theirs, 1);
  const youPct = Math.round((yours / max) * 100);
  const themPct = Math.round((theirs / max) * 100);

  return (
    <div className={`mog-meter ${TIER_CLASS[tier]}`} aria-label="Face rating comparison">
      <div className="mog-meter-head">
        <span className="mog-meter-label">MOG CHECK</span>
        <span className={`mog-tier-badge ${TIER_CLASS[tier]}`}>{MOG_TIER_LABEL[tier]}</span>
      </div>
      <div className="mog-bar-row">
        <span className="mog-bar-name">YOU</span>
        <div className="mog-bar-track">
          <div className="mog-bar-fill mog-bar-you" style={{ width: `${youPct}%` }} />
        </div>
        <span className="mog-bar-val">{yours}</span>
      </div>
      <div className="mog-bar-row">
        <span className="mog-bar-name">{enemy.isBoss ? "BOSS" : "FOE"}</span>
        <div className="mog-bar-track">
          <div className="mog-bar-fill mog-bar-them" style={{ width: `${themPct}%` }} />
        </div>
        <span className="mog-bar-val">{theirs}</span>
      </div>
    </div>
  );
}
