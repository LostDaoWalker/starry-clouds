import { GameIcon } from "./GameIcon";

const DOCK = [
  { key: "hero", label: "HERO", icon: "hero" as const },
  { key: "forge", label: "FORGE", icon: "forge" as const },
  { key: "party", label: "PARTY", icon: "party" as const },
  { key: "guild", label: "GUILD", icon: "guild" as const },
  { key: "shop", label: "SHOP", icon: "shop" as const },
] as const;

type DockKey = (typeof DOCK)[number]["key"];

type BottomDockProps = {
  onEnhance: () => void;
  onForge: () => void;
  onParty: () => void;
  onShop: () => void;
};

export function BottomDock({ onEnhance, onForge, onParty, onShop }: BottomDockProps) {
  const handlers: Partial<Record<DockKey, () => void>> = {
    hero: onEnhance,
    forge: onForge,
    party: onParty,
    shop: onShop,
  };

  return (
    <nav className="bottom-dock" aria-label="Game systems">
      {DOCK.map((item) => (
        <button
          key={item.key}
          type="button"
          className={`dock-btn dock-${item.key}`}
          onClick={handlers[item.key]}
          title={item.label}
        >
          <GameIcon name={item.icon} size="sm" />
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  );
}
