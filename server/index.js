import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { randomUUID } from "crypto";
import { getPool, initDb } from "./db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = Number(process.env.PORT) || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "../dist")));

// GET /api/player?id=<uuid>  — fetch or create a player row
app.get("/api/player", async (req, res) => {
  try {
    const db = getPool();
    let { id } = req.query;

    if (id) {
      const { rows } = await db.query("SELECT * FROM players WHERE id = $1", [
        id,
      ]);
      if (rows.length > 0) {
        return res.json(rows[0]);
      }
    }

    // No id supplied, or id not found — create a fresh player
    const newId = id || randomUUID();
    const { rows } = await db.query(
      `INSERT INTO players (id, glamour, makeup, fashion, luster, energy, fame, last_energy_at)
       VALUES ($1, 5, 5, 5, 20, 100, 0, NOW())
       RETURNING *`,
      [newId]
    );
    return res.status(201).json(rows[0]);
  } catch (err) {
    console.error("GET /api/player error:", err);
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/player  — update an existing player row
app.post("/api/player", async (req, res) => {
  try {
    const db = getPool();
    const { id, glamour, makeup, fashion, luster, energy, fame, last_energy_at } =
      req.body;

    if (!id) return res.status(400).json({ error: "id is required" });

    const { rows } = await db.query(
      `UPDATE players
       SET glamour = $2, makeup = $3, fashion = $4, luster = $5,
           energy = $6, fame = $7, last_energy_at = $8
       WHERE id = $1
       RETURNING *`,
      [id, glamour, makeup, fashion, luster, energy, fame, last_energy_at]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Player not found" });
    }
    return res.json(rows[0]);
  } catch (err) {
    console.error("POST /api/player error:", err);
    return res.status(500).json({ error: err.message });
  }
});

// SPA fallback — must come after API routes
app.get("/*splat", (_req, res) => {
  res.sendFile(path.join(__dirname, "../dist/index.html"));
});

initDb()
  .then(() => {
    app.listen(port, "0.0.0.0", () => {
      console.log(`GLAMOUR running on port ${port}`);
    });
  })
  .catch((err) => {
    console.error("Failed to initialise database:", err);
    process.exit(1);
  });
