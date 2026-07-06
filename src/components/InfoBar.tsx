import { GameIcon } from "./GameIcon";
import type { PlayerClass } from "../game";
import { SpriteActor } from "./SpriteActor";

type InfoBarProps = {
  playerClass: PlayerClass | null;
  stage: number;
  power: number;
  luster: number;
  energy: number;
  fame: number;
};

export function InfoBar({
  playerClass,
  stage,
  power,
  luster,
  energy,
  fame,
}: InfoBarProps) {
  return (
    <header className="info-bar panel panel-stone">
      <div className="info-portrait">
        <div className="info-portrait-frame">
          {playerClass ? (
            <SpriteActor playerClass={playerClass} variant="portrait" />
          ) : (
            <GameIcon name="unknown" size="md" />
          )}
        </div>
        <span className="info-level">Lv.{stage}</span>
      </div>

      <div className="info-stats">
        <div className="info-stat-row">
          <span className="info-label">HP</span>
          <div className="info-bar-track">
            <div className="info-bar-fill info-bar-hp" style={{ width: "100%" }} />
          </div>
        </div>
        <div className="info-stat-row">
          <span className="info-label">ENG</span>
          <div className="info-bar-track">
            <div className="info-bar-fill info-bar-eng" style={{ width: `${energy}%` }} />
          </div>
          <span className="info-val">{energy}</span>
        </div>
        <div className="info-currencies">
          <span className="info-currency">
            <GameIcon name="luster" size="sm" />
            {luster}
          </span>
          <span className="info-currency">
            <GameIcon name="fame" size="sm" />
            {fame}
          </span>
          <span className="info-br">
            <GameIcon name="power" size="sm" />
            {power}
          </span>
        </div>
      </div>
    </header>
  );
}
