import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Player } from "../game";

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (client) return client;

  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY");
  }

  client = createClient(url, key);
  return client;
}

export async function ensurePlayer(): Promise<Player> {
  const supabase = getSupabase();

  const { data: sessionData, error: sessionError } =
    await supabase.auth.getSession();
  if (sessionError) throw sessionError;

  let userId = sessionData.session?.user.id;

  if (!userId) {
    const { data: authData, error: authError } =
      await supabase.auth.signInAnonymously();
    if (authError) throw authError;
    userId = authData.user?.id;
  }

  if (!userId) throw new Error("Could not establish anonymous session");

  const { data: existing, error: fetchError } = await supabase
    .from("players")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (fetchError) throw fetchError;
  if (existing) return existing as Player;

  const fresh: Player = {
    id: userId,
    glamour: 5,
    makeup: 5,
    fashion: 5,
    luster: 20,
    energy: 100,
    fame: 0,
    last_energy_at: new Date().toISOString(),
  };

  const { data: created, error: insertError } = await supabase
    .from("players")
    .insert(fresh)
    .select()
    .single();

  if (insertError) throw insertError;
  return created as Player;
}

export async function savePlayer(player: Player): Promise<Player> {
  const supabase = getSupabase();

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
    .select()
    .single();

  if (error) throw error;
  return data as Player;
}
