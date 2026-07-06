import { GameIcon } from "./GameIcon";
import {
  GEAR_SLOTS,
  MAX_GEAR_LEVEL,
  canUpgradeGear,
  gearUpgradeCost,
  type GearSlot,
  type Player,
} from "../game";

type GearPanelProps = {
  player: Player;
  onUpgrade: (slot: GearSlot) => void;
  onClose: () => void;
  busy: boolean;
};

export function GearPanel({ player, onUpgrade, onClose, busy }: GearPanelProps) {
  return (
    <div className="modal-overlay" role="dialog" aria-label="Forge gear">
      <div className="modal-panel panel panel-stone">
        <header className="modal-header">
          <GameIcon name="forge" size="sm" />
          <h2>FORGE</h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </header>
        <p className="meta-hint">Each upgrade adds passive BR.</p>

        <ul className="gear-list">
          {GEAR_SLOTS.map((slot: (typeof GEAR_SLOTS)[number]) => {
            const level = player.extras.gear[slot.key];
            const maxed = level >= MAX_GEAR_LEVEL;
            const cost = gearUpgradeCost(level);
            const canUp = canUpgradeGear(player, slot.key) && !busy;
            return (
              <li key={slot.key} className="gear-row">
                <GameIcon name={slot.icon} size="md" />
                <div className="gear-info">
                  <span className="gear-name">{slot.label}</span>
                  <span className="gear-level">
                    Lv.{level}/{MAX_GEAR_LEVEL}
                  </span>
                </div>
                <button
                  type="button"
                  className="gear-upgrade-btn"
                  disabled={maxed || !canUp}
                  onClick={() => onUpgrade(slot.key)}
                >
                  {maxed ? (
                    "MAX"
                  ) : (
                    <>
                      <GameIcon name="luster" size="sm" />
                      {cost}
                    </>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
