import type { Player, PlayerClass } from "../game";
import { cardRarity, statPercent } from "../game";
import { SpriteActor } from "./SpriteActor";

type FaceCardProps = {
  playerClass: PlayerClass;
  player: Player;
  compact?: boolean;
};

const RARITY_CLASS: Record<string, string> = {
  N: "rarity-n",
  R: "rarity-r",
  SR: "rarity-sr",
  UR: "rarity-ur",
};

export function FaceCard({ playerClass, player, compact = false }: FaceCardProps) {
  const power = player.glamour + player.makeup + player.fashion;
  const rarity = cardRarity(power);

  return (
    <article className={`face-card ${RARITY_CLASS[rarity]} ${compact ? "face-card-compact" : ""}`}>
      <div className="face-card-rarity">{rarity}</div>
      <div className="face-card-portrait">
        <SpriteActor playerClass={playerClass} variant="portrait" />
      </div>
      <div className="face-card-stats">
        <StatBar label="GLAM" value={player.glamour} color="gold" />
        <StatBar label="MU" value={player.makeup} color="pink" />
        <StatBar label="FIT" value={player.fashion} color="cyan" />
      </div>
      {!compact && <p className="face-card-br">BR {power}</p>}
    </article>
  );
}

function StatBar({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: "gold" | "pink" | "cyan";
}) {
  return (
    <div className="face-stat">
      <span className={`face-stat-label face-stat-${color}`}>{label}</span>
      <div className="face-stat-track">
        <div
          className={`face-stat-fill face-stat-fill-${color}`}
          style={{ width: `${statPercent(value)}%` }}
        />
      </div>
      <span className="face-stat-val">{value}</span>
    </div>
  );
}
