import { GameIcon } from "./GameIcon";
import { CREW, type CrewId, type Player } from "../game";

type CrewPanelProps = {
  player: Player;
  onAssign: (crewId: CrewId | null) => void;
  onClose: () => void;
};

export function CrewPanel({ player, onAssign, onClose }: CrewPanelProps) {
  return (
    <div className="modal-overlay" role="dialog" aria-label="Party crew">
      <div className="modal-panel panel panel-stone">
        <header className="modal-header">
          <GameIcon name="party" size="sm" />
          <h2>PARTY</h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </header>
        <p className="meta-hint">Companions add passive BR when deployed.</p>

        <ul className="crew-list">
          <li className="crew-row">
            <button
              type="button"
              className={`crew-pick ${player.extras.crew === null ? "crew-active" : ""}`}
              onClick={() => onAssign(null)}
            >
              <span className="crew-name">Solo</span>
              <span className="crew-bonus">—</span>
            </button>
          </li>
          {CREW.map((c: (typeof CREW)[number]) => {
            const locked = player.stage < c.unlockStage;
            const selected = player.extras.crew === c.id;
            return (
              <li key={c.id} className={`crew-row ${locked ? "crew-locked" : ""}`}>
                <button
                  type="button"
                  className={`crew-pick ${selected ? "crew-active" : ""}`}
                  disabled={locked}
                  onClick={() => onAssign(c.id)}
                >
                  <span className="crew-name">{c.name}</span>
                  <span className="crew-bonus">+{c.bonus} BR</span>
                  {locked && <span className="crew-lock">Unlocks at stage {c.unlockStage}</span>}
                </button>
              </li>
            );
          })}
        </ul>

        <p className="crew-active-label">
          Active:{" "}
          {player.extras.crew
            ? (CREW.find((c: (typeof CREW)[number]) => c.id === player.extras.crew)?.name ?? "—")
            : "Solo"}
        </p>
      </div>
    </div>
  );
}
