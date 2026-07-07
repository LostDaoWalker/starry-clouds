import { CLASSES, type PlayerClass } from "../game";
import { FaceCard } from "./FaceCard";

type ClassSelectProps = {
  onPick: (playerClass: PlayerClass) => void;
};

const PREVIEW_STATS = { glamour: 12, makeup: 18, fashion: 8, luster: 20, energy: 80, fame: 5, stage: 1, last_energy_at: new Date().toISOString() };

export function ClassSelect({ onPick }: ClassSelectProps) {
  return (
    <div className="class-select">
      <p className="class-select-title">CHOOSE YOUR ICON</p>
      <div className="class-grid">
        {CLASSES.map((c) => (
          <button
            key={c.key}
            type="button"
            className="class-card"
            onClick={() => onPick(c.key)}
          >
            <FaceCard
              playerClass={c.key}
              player={{ id: "preview", ...PREVIEW_STATS }}
              compact
            />
            <span className="class-name">{c.label}</span>
            <span className="class-tag">{c.tagline}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
