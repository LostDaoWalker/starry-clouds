import pg from "pg";

const { Pool } = pg;

let pool;

export function getPool() {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL environment variable is not set");
    }
    pool = new Pool({
      connectionString,
      ssl:
        process.env.NODE_ENV === "production"
          ? { rejectUnauthorized: false }
          : false,
    });
  }
  return pool;
}

export async function initDb() {
  const db = getPool();
  await db.query(`
    CREATE TABLE IF NOT EXISTS players (
      id          TEXT        PRIMARY KEY,
      glamour     INTEGER     NOT NULL DEFAULT 5,
      makeup      INTEGER     NOT NULL DEFAULT 5,
      fashion     INTEGER     NOT NULL DEFAULT 5,
      luster      INTEGER     NOT NULL DEFAULT 20,
      energy      INTEGER     NOT NULL DEFAULT 100,
      fame        INTEGER     NOT NULL DEFAULT 0,
      last_energy_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  console.log("Database initialised");
}
