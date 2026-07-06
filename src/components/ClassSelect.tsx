import { CLASSES, type PlayerClass } from "../game";
import { SpriteActor } from "./SpriteActor";

type ClassSelectProps = {
  onPick: (playerClass: PlayerClass) => void;
};

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
            <SpriteActor playerClass={c.key} variant="portrait" />
            <span className="class-name">{c.label}</span>
            <span className="class-tag">{c.tagline}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
