import type { ActionKey, Player } from "../../shared/game.js";

async function readError(res: Response, fallback: string): Promise<string> {
  try {
    const body = (await res.json()) as { error?: string };
    return body.error ?? fallback;
  } catch {
    return fallback;
  }
}

export async function fetchPlayer(): Promise<Player> {
  const res = await fetch("/api/player", { credentials: "same-origin" });
  if (!res.ok) throw new Error(await readError(res, "Could not load player"));
  return (await res.json()) as Player;
}

export async function sendAction(action: ActionKey): Promise<Player> {
  const res = await fetch("/api/action", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({ action }),
  });
  if (!res.ok) throw new Error(await readError(res, "Action failed"));
  return (await res.json()) as Player;
}
