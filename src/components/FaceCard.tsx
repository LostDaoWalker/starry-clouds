import type { Player, PlayerClass } from "../game";
import { combatPower, faceCardTier, statPercent } from "../game";
import { faceCardSceneUrl } from "../lib/scenes";
import { SpriteActor } from "./SpriteActor";

type FaceCardProps = {
  playerClass: PlayerClass;
  player: Player;
  compact?: boolean;
};

const TIER_COLORS: Record<string, string> = {
  C: "#8b8b8b",
  B: "#5dade2",
  A: "#a855f7",
  S: "#ffd000",
  UR: "#ff2d8a",
};

export function FaceCard({ playerClass, player, compact = false }: FaceCardProps) {
  const base = import.meta.env.BASE_URL;
  const tier = faceCardTier(player);
  const br = combatPower(player);
  const scene = faceCardSceneUrl(playerClass);

  return (
    <div className={`face-card face-card-${tier.toLowerCase()} ${compact ? "face-card-compact" : ""}`}>
      <div className="face-card-frame" style={{ backgroundImage: `url(${base}cards/face-card-frame.png)` }}>
        {scene ? (
          <img className="face-card-scene" src={scene} alt="" draggable={false} />
        ) : (
          <SpriteActor playerClass={playerClass} variant="portrait" />
        )}
        <span className="face-card-tier" style={{ color: TIER_COLORS[tier] }}>
          {tier}
        </span>
      </div>
      {!compact && (
        <div className="face-card-stats">
          <StatBar label="GLAM" value={player.glamour} color="var(--gold)" />
          <StatBar label="MU" value={player.makeup} color="var(--pink)" />
          <StatBar label="FIT" value={player.fashion} color="var(--cyan)" />
          <span className="face-card-br">BR {br}</span>
        </div>
      )}
    </div>
  );
}

function StatBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="face-stat">
      <span className="face-stat-label">{label}</span>
      <div className="face-stat-track">
        <div className="face-stat-fill" style={{ width: `${statPercent(value)}%`, background: color }} />
      </div>
      <span className="face-stat-val">{value}</span>
    </div>
  );
}
