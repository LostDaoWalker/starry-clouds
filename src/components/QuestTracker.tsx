import { GameIcon } from "./GameIcon";
import { chapterLore, requiredBr, stageInfo, stageLabel } from "../game";

type QuestTrackerProps = {
  stage: number;
  power: number;
  wave: number;
  totalWaves: number;
};

export function QuestTracker({ stage, power, wave, totalWaves }: QuestTrackerProps) {
  const info = stageInfo(stage);
  const lore = chapterLore(info.chapter);
  const need = requiredBr(stage);

  return (
    <aside className="quest-tracker panel panel-parchment">
      <p className="quest-title">
        <GameIcon name="quest" size="sm" />
        CAMPAIGN
      </p>
      <p className="quest-objective">
        Clear <strong>{stageLabel(stage)}</strong>
      </p>
      <p className="quest-lore">{lore}</p>
      <p className="quest-detail">
        Wave {wave}/{totalWaves}
        {info.isBoss ? " · BOSS" : ""}
      </p>
      <p className="quest-br">
        BR {power}/{need}
        {power >= need ? " · Ready" : " · Train up"}
      </p>
    </aside>
  );
}
