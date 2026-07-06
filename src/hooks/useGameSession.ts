import { useCallback, useEffect, useRef, useState } from "react";
import {
  ACTIONS,
  type ActionKey,
  applyAction,
  arenaFight,
  assignCrew,
  battleTick,
  blitzStage,
  BATTLE_TICK_MS,
  canAct,
  catchUpBattles,
  claimDaily,
  type BattleTickResult,
  type CombatState,
  type CrewId,
  type DailyKey,
  type GearSlot,
  type Player,
  type PlayerClass,
  newCombatState,
  regenEnergy,
  upgradeGear,
} from "../game";
import { ensurePlayer, lastActiveAt, savePlayer, touchActive } from "../lib/supabase";
import { loadPlayerClass } from "../lib/playerClass";

const MAX_LOG = 6;

type MutateOpts = {
  log?: string;
  toast?: string;
};

export function useGameSession(flashToast: (msg: string) => void) {
  const [player, setPlayer] = useState<Player | null>(null);
  const [combat, setCombat] = useState<CombatState | null>(null);
  const [busy, setBusy] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [log, setLog] = useState<string[]>(["Campaign auto-battle online."]);
  const combatRef = useRef<CombatState | null>(null);
  combatRef.current = combat;

  const pushLog = useCallback((line: string) => {
    setLog((lines) => [line, ...lines].slice(0, MAX_LOG));
  }, []);

  const mutate = useCallback(
    async (updater: (p: Player) => Player | null, opts: MutateOpts = {}) => {
      if (!player || busy) return null;
      const refreshed = regenEnergy(player);
      const next = updater(refreshed);
      if (!next) return null;

      setPlayer(next);
      if (opts.log) pushLog(opts.log);

      setBusy(true);
      try {
        const saved = await savePlayer(next);
        setPlayer(saved);
        if (opts.toast) flashToast(opts.toast);
        return saved;
      } catch (e) {
        setPlayer(refreshed);
        flashToast(e instanceof Error ? e.message : "Save failed");
        return null;
      } finally {
        setBusy(false);
      }
    },
    [player, busy, pushLog, flashToast]
  );

  useEffect(() => {
    ensurePlayer()
      .then(async (p) => {
        const initialCombat = newCombatState(p.stage);
        const cls = loadPlayerClass();

        if (cls) {
          const offlineMs = Date.now() - lastActiveAt();
          if (offlineMs >= BATTLE_TICK_MS * 2) {
            const result = catchUpBattles(p, initialCombat, cls, offlineMs);
            combatRef.current = result.combat;
            setPlayer(result.player);
            setCombat(result.combat);
            if (result.logs.length > 0) {
              setLog((lines) => [...result.logs, ...lines].slice(0, MAX_LOG));
            }
            await savePlayer(result.player).catch(() => undefined);
          } else {
            setPlayer(p);
            setCombat(initialCombat);
          }
        } else {
          setPlayer(p);
          setCombat(initialCombat);
        }

        touchActive();
      })
      .catch((e: Error) => setLoadError(e.message));
  }, []);

  useEffect(() => {
    if (!player) return;
    const id = window.setInterval(() => {
      setPlayer((current: Player | null) => (current ? regenEnergy(current) : current));
    }, 1000);
    return () => window.clearInterval(id);
  }, [player?.id]);

  const tick = useCallback(
    (playerClass: PlayerClass): BattleTickResult | null => {
      const c = combatRef.current;
      if (!player || !c) return null;

      const result = battleTick(regenEnergy(player), c, playerClass);
      combatRef.current = result.combat;
      setCombat(result.combat);
      setPlayer(result.player);
      pushLog(result.log);

      if (result.stageCleared) {
        void savePlayer(result.player).catch(() => undefined);
      }

      return result;
    },
    [player, pushLog]
  );

  const train = useCallback(
    async (action: ActionKey) => {
      if (!player || busy) return;
      const refreshed = regenEnergy(player);
      if (!canAct(refreshed, action)) {
        flashToast(
          action === "shop" && refreshed.luster < 10 ? "Need more luster" : "Not enough energy"
        );
        return;
      }
      await mutate((p) => applyAction(p, action), {
        log: `${ACTIONS[action].label} — +${ACTIONS[action].glamour + ACTIONS[action].makeup + ACTIONS[action].fashion} BR`,
        toast: `${ACTIONS[action].label}!`,
      });
    },
    [player, busy, mutate, flashToast]
  );

  const fightArena = useCallback(async () => {
    if (!player || busy) return;
    const refreshed = regenEnergy(player);
    const result = arenaFight(refreshed);
    if (!result) {
      flashToast("No arena fights left today");
      return;
    }
    setPlayer(result.player);
    pushLog(result.log);
    setBusy(true);
    try {
      const saved = await savePlayer(result.player);
      setPlayer(saved);
      flashToast(result.won ? "Arena victory!" : "Arena loss");
    } catch (e) {
      setPlayer(refreshed);
      flashToast(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }, [player, busy, pushLog, flashToast]);

  const claimQuest = useCallback(
    (key: DailyKey) =>
      mutate((p) => claimDaily(p, key), {
        log: "Daily quest reward claimed",
        toast: "Reward claimed!",
      }),
    [mutate]
  );

  const blitz = useCallback(
    async (stage: number) => {
      if (!player || busy) return;
      const refreshed = regenEnergy(player);
      const result = blitzStage(refreshed, stage);
      if (!result) {
        flashToast("Cannot blitz this stage");
        return;
      }
      await mutate(() => result.player, { log: result.log, toast: "Blitz complete!" });
    },
    [player, busy, mutate, flashToast]
  );

  const forge = useCallback(
    (slot: GearSlot) =>
      mutate((p) => upgradeGear(p, slot), {
        log: `Forged ${slot}`,
        toast: "Gear upgraded!",
      }),
    [mutate]
  );

  const pickCrew = useCallback(
    (crewId: CrewId | null) =>
      mutate((p) => assignCrew(p, crewId), {
        toast: crewId ? "Crew assigned" : "Flying solo",
      }),
    [mutate]
  );

  const live = player ? regenEnergy(player) : null;

  return {
    player,
    live,
    combat,
    busy,
    log,
    loadError,
    tick,
    train,
    fightArena,
    claimQuest,
    blitz,
    forge,
    pickCrew,
  };
}
