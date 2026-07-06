import { createClient } from "@supabase/supabase-js";
import type { Player } from "../game";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY");
}

export const supabase = createClient(url, anonKey);

const PLAYER_ID_KEY = "glamour_player_id";
const LAST_ACTIVE_KEY = "glamour_last_active";

function playerId(): string {
  let id = localStorage.getItem(PLAYER_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(PLAYER_ID_KEY, id);
  }
  return id;
}

export function lastActiveAt(): number {
  const raw = localStorage.getItem(LAST_ACTIVE_KEY);
  return raw ? Number(raw) : Date.now();
}

export function touchActive(): void {
  localStorage.setItem(LAST_ACTIVE_KEY, String(Date.now()));
}

function normalisePlayer(raw: Record<string, unknown>): Player {
  return {
    id: raw.id as string,
    glamour: raw.glamour as number,
    makeup: raw.makeup as number,
    fashion: raw.fashion as number,
    luster: raw.luster as number,
    energy: raw.energy as number,
    fame: raw.fame as number,
    stage: (raw.stage as number) ?? 1,
    last_energy_at:
      raw.last_energy_at instanceof Date
        ? (raw.last_energy_at as Date).toISOString()
        : (raw.last_energy_at as string),
  };
}

export async function ensurePlayer(): Promise<Player> {
  const { data, error } = await supabase.rpc("get_or_create_player", {
    p_id: playerId(),
  });

  if (error) throw error;
  return normalisePlayer(data as Record<string, unknown>);
}

export async function savePlayer(player: Player): Promise<Player> {
  touchActive();
  const { data, error } = await supabase.rpc("save_player_row", {
    p_id: player.id,
    p_glamour: player.glamour,
    p_makeup: player.makeup,
    p_fashion: player.fashion,
    p_luster: player.luster,
    p_energy: player.energy,
    p_fame: player.fame,
    p_last_energy_at: player.last_energy_at,
    p_stage: player.stage,
  });

  if (error) throw error;
  return normalisePlayer(data as Record<string, unknown>);
}
