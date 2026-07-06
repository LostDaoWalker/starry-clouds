import { GameIcon } from "./GameIcon";
import { stageInfo, stageLabel } from "../game";

type QuestTrackerProps = {
  stage: number;
  power: number;
  wave: number;
  totalWaves: number;
};

export function QuestTracker({ stage, power, wave, totalWaves }: QuestTrackerProps) {
  const info = stageInfo(stage);

  return (
    <aside className="quest-tracker panel panel-ornate">
      <p className="quest-title">
        <GameIcon name="quest" size="sm" />
        QUEST
      </p>
      <p className="quest-objective">
        Clear <strong>{stageLabel(stage)}</strong>
      </p>
      <p className="quest-detail">
        Wave {wave}/{totalWaves}
        {info.isBoss ? " · BOSS" : ""}
      </p>
      <p className="quest-br">BR {power}</p>
    </aside>
  );
}
