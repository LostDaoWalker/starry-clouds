import { GameIcon } from "./GameIcon";
import { ARENA_DAILY_FIGHTS, br, canArenaFight, type Player } from "../game";

type ArenaPanelProps = {
  player: Player;
  onFight: () => void;
  busy: boolean;
};

export function ArenaPanel({ player, onFight, busy }: ArenaPanelProps) {
  const power = br(player);
  const fightsLeft = player.extras.arenaFightsLeft;
  const canFight = canArenaFight(player) && !busy;

  return (
    <section className="meta-panel arena-panel panel panel-stone">
      <div className="meta-panel-banner raid-banner" aria-hidden />
      <header className="meta-panel-header">
        <GameIcon name="fame" size="sm" />
        <h2>ARENA</h2>
      </header>

      <div className="arena-stats">
        <div className="arena-stat">
          <span className="arena-stat-label">Your BR</span>
          <span className="arena-stat-val">{power}</span>
        </div>
        <div className="arena-stat">
          <span className="arena-stat-label">Fights left</span>
          <span className="arena-stat-val">
            {fightsLeft}/{ARENA_DAILY_FIGHTS}
          </span>
        </div>
        <div className="arena-stat">
          <span className="arena-stat-label">Fame</span>
          <span className="arena-stat-val">
            <GameIcon name="fame" size="sm" />
            {player.fame}
          </span>
        </div>
      </div>

      <p className="meta-hint">Daily ranked brawls. Wins earn luster and fame.</p>

      <button type="button" className="meta-action-btn" disabled={!canFight} onClick={onFight}>
        {fightsLeft > 0 ? "FIGHT RIVAL" : "RESETS TOMORROW"}
      </button>
    </section>
  );
}
