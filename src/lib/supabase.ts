import { createClient } from "@supabase/supabase-js";
import type { Player } from "../game";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY");
}

export const supabase = createClient(url, anonKey);

function normalisePlayer(raw: Record<string, unknown>): Player {
  return {
    id: raw.id as string,
    glamour: raw.glamour as number,
    makeup: raw.makeup as number,
    fashion: raw.fashion as number,
    luster: raw.luster as number,
    energy: raw.energy as number,
    fame: raw.fame as number,
    last_energy_at:
      raw.last_energy_at instanceof Date
        ? (raw.last_energy_at as Date).toISOString()
        : (raw.last_energy_at as string),
  };
}

export async function ensurePlayer(): Promise<Player> {
  const { data: sessionData, error: sessionError } =
    await supabase.auth.getSession();

  if (sessionError) throw sessionError;

  let userId = sessionData.session?.user.id;

  if (!userId) {
    const { data: authData, error: authError } =
      await supabase.auth.signInAnonymously();
    if (authError) {
      if (authError.message.toLowerCase().includes("anonymous")) {
        throw new Error("Anonymous sign-ins are disabled");
      }
      throw authError;
    }
    userId = authData.user?.id;
  }

  if (!userId) throw new Error("Failed to establish player session");

  const { data: existing, error: selectError } = await supabase
    .from("players")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (selectError) throw selectError;
  if (existing) return normalisePlayer(existing);

  const { data: created, error: insertError } = await supabase
    .from("players")
    .insert({ id: userId })
    .select("*")
    .single();

  if (insertError) throw insertError;
  return normalisePlayer(created);
}

export async function savePlayer(player: Player): Promise<Player> {
  const { data, error } = await supabase
    .from("players")
    .update({
      glamour: player.glamour,
      makeup: player.makeup,
      fashion: player.fashion,
      luster: player.luster,
      energy: player.energy,
      fame: player.fame,
      last_energy_at: player.last_energy_at,
    })
    .eq("id", player.id)
    .select("*")
    .single();

  if (error) throw error;
  return normalisePlayer(data);
}
