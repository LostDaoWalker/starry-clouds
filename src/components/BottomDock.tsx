import { GameIcon } from "./GameIcon";
import type { PlayerClass } from "../game";
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
          <span className="hero-portrait-empty">?</span>
        )}
      </div>
      <div className="hero-portrait-meta">
        <span className="hero-portrait-lv">Lv.{stage}</span>
        <span className="hero-portrait-br">{power}</span>
      </div>
    </div>
  );
}

type BottomDockProps = {
  onEnhance: () => void;
};

const DOCK = [
  { key: "hero", label: "HERO", icon: "glamour" as const },
  { key: "forge", label: "FORGE", icon: "fashion" as const },
  { key: "party", label: "PARTY", icon: "fame" as const },
  { key: "guild", label: "GUILD", icon: "power" as const },
  { key: "shop", label: "SHOP", icon: "shop" as const },
];

export function BottomDock({ onEnhance }: BottomDockProps) {
  return (
    <nav className="bottom-dock" aria-label="Game systems">
      {DOCK.map((item) => (
        <button
          key={item.key}
          type="button"
          className={`dock-btn dock-${item.key}`}
          onClick={item.key === "hero" ? onEnhance : undefined}
          title={item.label}
        >
          <GameIcon name={item.icon} size="sm" />
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  );
}
