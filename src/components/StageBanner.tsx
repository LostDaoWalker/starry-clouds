import { GameIcon } from "./GameIcon";
import { stageInfo, stageLabel, type StageInfo } from "../game";

type StageBannerProps = {
  stage: number;
  autoBattle: boolean;
};

export function StageBanner({ stage, autoBattle }: StageBannerProps) {
  const info: StageInfo = stageInfo(stage);

  return (
    <div className="stage-banner panel">
      <div className="stage-campaign">
        <span className="stage-chapter">{info.chapterName}</span>
        <span className="stage-id">
          {stageLabel(stage)}
          {info.isBoss && <span className="boss-tag">BOSS</span>}
        </span>
      </div>
      <div className="stage-meta">
        {autoBattle && (
          <span className="auto-battle">
            <span className="auto-dot" />
            AUTO BATTLE
          </span>
        )}
        <span className="stage-stars" aria-label="Campaign progress">
          <GameIcon name="fame" size="sm" />
          {info.global}
        </span>
      </div>
    </div>
  );
}
