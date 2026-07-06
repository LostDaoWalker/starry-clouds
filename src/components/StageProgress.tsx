import { stageInfo, STAGES_PER_CHAPTER } from "../game";

type StageProgressProps = {
  stage: number;
};

export function StageProgress({ stage }: StageProgressProps) {
  const info = stageInfo(stage);

  return (
    <div className="stage-progress" aria-label={`Stage ${info.stageInChapter} of ${STAGES_PER_CHAPTER}`}>
      {Array.from({ length: STAGES_PER_CHAPTER }, (_, i) => {
        const n = i + 1;
        const isBoss = n % 5 === 0;
        const isCurrent = n === info.stageInChapter;
        const isCleared = n < info.stageInChapter;
        return (
          <span
            key={n}
            className={[
              "stage-dot",
              isBoss ? "stage-dot-boss" : "",
              isCurrent ? "stage-dot-current" : "",
              isCleared ? "stage-dot-cleared" : "",
            ]
              .filter(Boolean)
              .join(" ")}
          />
        );
      })}
    </div>
  );
}
