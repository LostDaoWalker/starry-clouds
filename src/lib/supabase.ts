import type { Player } from "../game";

const PLAYER_ID_KEY = "glamour_player_id";

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
  const storedId = localStorage.getItem(PLAYER_ID_KEY);
  const url = storedId ? `/api/player?id=${storedId}` : "/api/player";

  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      (body as { error?: string }).error ?? `Server error ${res.status}`
    );
  }

  const raw = (await res.json()) as Record<string, unknown>;
  const player = normalisePlayer(raw);
  localStorage.setItem(PLAYER_ID_KEY, player.id);
  return player;
}

export async function savePlayer(player: Player): Promise<Player> {
  const res = await fetch("/api/player", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(player),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      (body as { error?: string }).error ?? `Server error ${res.status}`
    );
  }

  const raw = (await res.json()) as Record<string, unknown>;
  return normalisePlayer(raw);
}
