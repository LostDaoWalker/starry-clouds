import { stageInfo, stageLabel } from "../game";
import { StageProgress } from "./StageProgress";

type StageBannerProps = {
  stage: number;
  autoBattle: boolean;
};

export function StageBanner({ stage, autoBattle }: StageBannerProps) {
  const info = stageInfo(stage);

  return (
    <div className="stage-banner panel panel-ornate">
      <div className="stage-campaign">
        <span className="stage-chapter">{info.chapterName}</span>
        <span className="stage-id">
          {stageLabel(stage)}
          {info.isBoss && <span className="boss-tag">BOSS</span>}
        </span>
        <StageProgress stage={stage} />
      </div>
      <div className="stage-meta">
        {autoBattle && (
          <span className="auto-battle">
            <span className="auto-dot" />
            AUTO
          </span>
        )}
        <div className="stage-cp-pill">
          <span className="stage-cp-label">STAGE</span>
          <span className="stage-cp-value">{info.global}</span>
        </div>
      </div>
    </div>
  );
}
