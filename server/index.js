import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { isActionKey } from "../shared/game.js";
import { initSchema, loadPlayer, newPlayer, performAction } from "./db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, "../dist");
const indexHtml = path.join(distDir, "index.html");

const COOKIE = "glamour_pid";
const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 365 * 24 * 60 * 60 * 1000,
};

function sessionId(req) {
  const raw = req.headers.cookie;
  if (!raw) return null;
  for (const part of raw.split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (name === COOKIE) return decodeURIComponent(rest.join("="));
  }
  return null;
}

const app = express();
app.use(express.json());

app.get("/api/player", async (req, res, next) => {
  try {
    const id = sessionId(req);
    let player = id ? await loadPlayer(id) : null;
    if (!player) {
      player = await newPlayer();
      res.cookie(COOKIE, player.id, COOKIE_OPTIONS);
    }
    res.json(player);
  } catch (err) {
    next(err);
  }
});

app.post("/api/action", async (req, res, next) => {
  try {
    const id = sessionId(req);
    if (!id) return res.status(401).json({ error: "No player session" });

    const action = req.body?.action;
    if (!isActionKey(action)) {
      return res.status(400).json({ error: "Unknown action" });
    }

    const result = await performAction(id, action);
    if (result.code === "no_session") {
      return res.status(401).json({ error: "No player session" });
    }
    if (result.code === "blocked") {
      return res.status(409).json({ error: result.reason, player: result.player });
    }
    res.json(result.player);
  } catch (err) {
    next(err);
  }
});

app.use(express.static(distDir));

// SPA fallback: non-API GET routes return the built index.html; anything else
// (e.g. an unknown /api/* path) gets a JSON 404.
app.use((req, res) => {
  if (req.method === "GET" && !req.path.startsWith("/api/")) {
    return res.sendFile(indexHtml);
  }
  res.status(404).json({ error: "Not found" });
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

const port = Number(process.env.PORT) || 3000;

initSchema()
  .then(() => {
    app.listen(port, "0.0.0.0", () => {
      console.log(`GLAMOUR running on port ${port}`);
    });
  })
  .catch((err) => {
    console.error("Failed to initialize database", err);
    process.exit(1);
  });
