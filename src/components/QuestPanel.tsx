import { GameIcon } from "./GameIcon";
import {
  BLITZ_ENERGY,
  DAILY_QUESTS,
  canBlitz,
  canClaimDaily,
  stageLabel,
  type DailyKey,
  type Player,
} from "../game";

type QuestPanelProps = {
  player: Player;
  blitzStages: number[];
  onClaim: (key: DailyKey) => void;
  onBlitz: (stage: number) => void;
  busy: boolean;
};

export function QuestPanel({ player, blitzStages, onClaim, onBlitz, busy }: QuestPanelProps) {
  return (
    <section className="meta-panel quest-panel panel panel-parchment">
      <header className="meta-panel-header quest-header">
        <GameIcon name="quest" size="sm" />
        <h2>DAILY QUESTS</h2>
      </header>

      <ul className="daily-list">
        {DAILY_QUESTS.map((q: (typeof DAILY_QUESTS)[number]) => {
          const progress = q.progress(player.extras);
          const claimed = player.extras.dailies[q.key];
          const ready = canClaimDaily(player, q.key);
          return (
            <li key={q.key} className={`daily-row ${claimed ? "daily-done" : ""}`}>
              <div className="daily-info">
                <span className="daily-label">{q.label}</span>
                <span className="daily-progress">
                  {Math.min(progress, q.goal)}/{q.goal}
                </span>
              </div>
              <div className="daily-reward">
                {q.reward.luster > 0 && (
                  <span>
                    <GameIcon name="luster" size="sm" />
                    {q.reward.luster}
                  </span>
                )}
                {q.reward.fame > 0 && (
                  <span>
                    <GameIcon name="fame" size="sm" />
                    {q.reward.fame}
                  </span>
                )}
              </div>
              {claimed ? (
                <span className="daily-claimed">✓</span>
              ) : (
                <button
                  type="button"
                  className="daily-claim-btn"
                  disabled={!ready || busy}
                  onClick={() => onClaim(q.key)}
                >
                  {ready ? "CLAIM" : "…"}
                </button>
              )}
            </li>
          );
        })}
      </ul>

      <header className="meta-panel-header quest-header blitz-header">
        <GameIcon name="wave" size="sm" />
        <h2>BLITZ</h2>
      </header>

      {blitzStages.length === 0 ? (
        <p className="meta-hint">Earn 3★ on cleared stages to unlock blitz farming.</p>
      ) : (
        <ul className="blitz-list">
          {blitzStages.map((stage) => (
            <li key={stage} className="blitz-row">
              <span className="blitz-stage">{stageLabel(stage)}</span>
              <span className="blitz-cost">
                <GameIcon name="energy" size="sm" />
                {BLITZ_ENERGY}
              </span>
              <button
                type="button"
                className="blitz-btn"
                disabled={!canBlitz(player, stage) || busy}
                onClick={() => onBlitz(stage)}
              >
                BLITZ
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
