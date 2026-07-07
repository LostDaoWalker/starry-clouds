import { CLASSES, type PlayerClass } from "../game";
import { FaceCard } from "./FaceCard";

type ClassSelectProps = {
  onPick: (playerClass: PlayerClass) => void;
};

const PREVIEW_STATS = {
  diva: { glamour: 12, makeup: 18, fashion: 8, luster: 20, energy: 80, fame: 5, stage: 1, last_energy_at: new Date().toISOString() },
  model: { glamour: 10, makeup: 10, fashion: 16, luster: 20, energy: 80, fame: 5, stage: 1, last_energy_at: new Date().toISOString() },
  dancer: { glamour: 14, makeup: 12, fashion: 12, luster: 20, energy: 80, fame: 5, stage: 1, last_energy_at: new Date().toISOString() },
  streamer: { glamour: 8, makeup: 14, fashion: 10, luster: 25, energy: 80, fame: 8, stage: 1, last_energy_at: new Date().toISOString() },
} as const;

export function ClassSelect({ onPick }: ClassSelectProps) {
  return (
    <div className="class-select">
      <p className="class-select-title">PICK YOUR FACE CARD</p>
      <p className="class-select-sub">Strut. Shop. Mog.</p>
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
              player={{ id: "preview", ...PREVIEW_STATS[c.key] }}
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
