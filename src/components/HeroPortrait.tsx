import type { PlayerClass } from "../game";
import { GameIcon } from "./GameIcon";
import { SpriteActor } from "./SpriteActor";

type HeroPortraitProps = {
  playerClass: PlayerClass | null;
  power: number;
  stage: number;
};

export function HeroPortrait({ playerClass, power, stage }: HeroPortraitProps) {
  return (
    <div className="hero-portrait panel panel-ornate">
      <div className="hero-portrait-frame">
        {playerClass ? (
          <SpriteActor playerClass={playerClass} variant="portrait" />
        ) : (
          <GameIcon name="unknown" size="md" />
        )}
      </div>
      <div className="hero-portrait-meta">
        <span className="hero-portrait-lv">Lv.{stage}</span>
        <span className="hero-portrait-br">{power}</span>
      </div>
    </div>
  );
}
