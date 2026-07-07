import { GameIcon } from "./GameIcon";
import type { Player } from "../game";
import { statPercent } from "../game";

type FaceCardProps = {
  player: Player;
};

const STATS = [
  { key: "glamour" as const, label: "GLAMOUR", icon: "glamour" as const, bar: "glamour" },
  { key: "makeup" as const, label: "MAKEUP", icon: "makeup" as const, bar: "makeup" },
  { key: "fashion" as const, label: "FASHION", icon: "fashion" as const, bar: "fashion" },
];

export function FaceCard({ player }: FaceCardProps) {
  return (
    <aside className="face-card panel" aria-label="Face card stats">
      <div className="face-card-frame" aria-hidden />
      <p className="face-card-title">FACE CARD</p>
      <ul className="face-card-stats">
        {STATS.map((s) => (
          <li key={s.key} className="face-stat-row">
            <span className="face-stat-label">
              <GameIcon name={s.icon} size="sm" />
              {s.label}
            </span>
            <span className="face-stat-val">{player[s.key]}</span>
            <div className="face-stat-track">
              <div
                className={`face-stat-fill face-stat-${s.bar}`}
                style={{ width: `${statPercent(player[s.key])}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </aside>
  );
}
