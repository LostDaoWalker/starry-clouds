import { createClient } from "@supabase/supabase-js";
import { normalizeExtras, sanitizePlayer, type Player } from "../game";

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

function rowToPlayer(raw: Record<string, unknown>): Player {
  return sanitizePlayer({
    id: raw.id as string,
    glamour: Number(raw.glamour ?? 0),
    makeup: Number(raw.makeup ?? 0),
    fashion: Number(raw.fashion ?? 0),
    luster: Number(raw.luster ?? 0),
    energy: Number(raw.energy ?? 100),
    fame: Number(raw.fame ?? 0),
    stage: Number(raw.stage ?? 1),
    last_energy_at:
      raw.last_energy_at instanceof Date
        ? (raw.last_energy_at as Date).toISOString()
        : String(raw.last_energy_at ?? new Date().toISOString()),
    extras: normalizeExtras(raw.extras),
  });
}

export async function ensurePlayer(): Promise<Player> {
  const { data, error } = await supabase.rpc("get_or_create_player", {
    p_id: playerId(),
  });

  if (error) throw error;

  const player = rowToPlayer(data as Record<string, unknown>);

  // Persist if daily reset or sanitization changed stored state
  const stored = data as Record<string, unknown>;
  const storedReset = (stored.extras as { dailyReset?: string } | null)?.dailyReset;
  if (storedReset !== player.extras.dailyReset) {
    return savePlayer(player);
  }

  return player;
}

export async function savePlayer(player: Player): Promise<Player> {
  touchActive();
  const clean = sanitizePlayer(player);
  const { data, error } = await supabase.rpc("save_player_row", {
    p_id: clean.id,
    p_glamour: clean.glamour,
    p_makeup: clean.makeup,
    p_fashion: clean.fashion,
    p_luster: clean.luster,
    p_energy: clean.energy,
    p_fame: clean.fame,
    p_last_energy_at: clean.last_energy_at,
    p_stage: clean.stage,
    p_extras: clean.extras,
  });

  if (error) throw error;
  return rowToPlayer(data as Record<string, unknown>);
}
