// Persistence layer for GLAMOUR. Owns the Postgres connection and is the single
// authority for player state: every read applies energy regen and every action
// runs inside a row-locked transaction so stats can never be forged or
// double-spent by the client.

import crypto from "node:crypto";
import pg from "pg";
import {
  applyAction,
  blockReason,
  canAct,
  regenEnergy,
} from "../shared/game.js";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const pool = new pg.Pool({
  connectionString,
  ssl: /sslmode=(require|verify-full)/.test(connectionString)
    ? { rejectUnauthorized: false }
    : false,
});

const COLUMNS = "id, glamour, makeup, fashion, luster, energy, fame, last_energy_at";

export async function initSchema() {
  await pool.query(`
    create table if not exists players (
      id uuid primary key,
      glamour integer not null default 5 check (glamour >= 0),
      makeup integer not null default 5 check (makeup >= 0),
      fashion integer not null default 5 check (fashion >= 0),
      luster integer not null default 20 check (luster >= 0),
      energy integer not null default 100 check (energy >= 0 and energy <= 100),
      fame integer not null default 0 check (fame >= 0),
      last_energy_at timestamptz not null default now(),
      created_at timestamptz not null default now()
    );
  `);
}

async function tx(fn) {
  const client = await pool.connect();
  try {
    await client.query("begin");
    const result = await fn(client);
    await client.query("commit");
    return result;
  } catch (err) {
    await client.query("rollback");
    throw err;
  } finally {
    client.release();
  }
}

async function lockPlayer(client, id) {
  const { rows } = await client.query(
    `select ${COLUMNS} from players where id = $1 for update`,
    [id]
  );
  return rows[0] ?? null;
}

async function save(client, player) {
  const { rows } = await client.query(
    `update players
       set glamour = $2, makeup = $3, fashion = $4, luster = $5,
           energy = $6, fame = $7, last_energy_at = $8
     where id = $1
     returning ${COLUMNS}`,
    [
      player.id,
      player.glamour,
      player.makeup,
      player.fashion,
      player.luster,
      player.energy,
      player.fame,
      player.last_energy_at,
    ]
  );
  return rows[0];
}

async function createPlayer() {
  const { rows } = await pool.query(
    `insert into players (id) values ($1) returning ${COLUMNS}`,
    [crypto.randomUUID()]
  );
  return rows[0];
}

// Loads the player for an existing session id, applying (and persisting) energy
// regen. Returns null when the id is unknown so the caller can mint a new one.
export function loadPlayer(id) {
  return tx(async (client) => {
    const current = await lockPlayer(client, id);
    if (!current) return null;
    const regenerated = regenEnergy(current);
    return regenerated === current ? current : save(client, regenerated);
  });
}

export function newPlayer() {
  return createPlayer();
}

// Authoritatively resolves an action: regen is applied first, the action is
// validated server-side, and the result is persisted under a row lock.
export function performAction(id, action) {
  return tx(async (client) => {
    const current = await lockPlayer(client, id);
    if (!current) return { ok: false, code: "no_session" };

    const regenerated = regenEnergy(current);
    if (!canAct(regenerated, action)) {
      const player =
        regenerated === current ? current : await save(client, regenerated);
      return {
        ok: false,
        code: "blocked",
        reason: blockReason(regenerated, action),
        player,
      };
    }

    const player = await save(client, applyAction(regenerated, action));
    return { ok: true, player };
  });
}
