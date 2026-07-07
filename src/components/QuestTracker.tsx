import { GameIcon } from "./GameIcon";
import { chapterLore, stageInfo, stageLabel } from "../game";

type QuestTrackerProps = {
  stage: number;
  power: number;
  wave: number;
  totalWaves: number;
};

export function QuestTracker({ stage, power, wave, totalWaves }: QuestTrackerProps) {
  const info = stageInfo(stage);
  const lore = chapterLore(info.chapter);

  return (
    <aside className="quest-tracker panel panel-parchment">
      <p className="quest-title">
        <GameIcon name="quest" size="sm" />
        ACTIVE QUEST
      </p>
      <p className="quest-objective">
        Mog rivals at <strong>{stageLabel(stage)}</strong>
      </p>
      <p className="quest-lore">{lore}</p>
      <p className="quest-detail">
        Wave {wave}/{totalWaves}
        {info.isBoss ? " · RAID BOSS" : ""}
      </p>
      <p className="quest-br">Face Card ~{Math.max(1, info.global * 8)} · Yours {power}</p>
    </aside>
  );
}
