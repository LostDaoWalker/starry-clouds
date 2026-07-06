# GLAMOUR

A one-screen persistent browser game. Play as a glamorous anime-manhwa heroine chasing makeup, fashion, and fame.

<img src="public/hero.png" alt="GLAMOUR mockup" width="640" />

## Play

- **PRIMP** — spend energy to boost makeup and glamour
- **SHOP** — spend luster for fashion
- **STRUT** — spend energy to earn luster and fame (needs high stats)

Energy regenerates over time. Progress persists via Supabase.

## Stack

- **Frontend** — React + Vite, single screen, dead-minimal UI
- **Backend** — Express API (`server/`) that owns all game logic and persistence
- **Database** — Railway Postgres (accessed via `DATABASE_URL`)
- **Hosting** — Railway

Player identity is an anonymous, unguessable id stored in an `HttpOnly` cookie —
no login. The browser only sends action names; the server validates energy/luster
and writes stats under a row lock, so state can't be forged from the client.

## Setup

### 1. Local dev

Needs a reachable Postgres. Either add a Railway Postgres and use its connection
string, or run Postgres locally.

```bash
cp .env.example .env   # set DATABASE_URL
npm install
npm run dev            # Express API on :3000 + Vite (proxying /api) on :5173
```

The `players` table is created automatically on server startup.

### 2. Railway

1. Connect this repo to [Railway](https://railway.app)
2. Add a **Postgres** database to the project — Railway injects `DATABASE_URL`
   into the app service automatically.
3. Railway reads `railway.toml` — builds with `npm run build`, starts with `npm start`
   (the Express server serves the built frontend and the API on `$PORT`).

## Environment

| Variable | Description |
|---|---|
| `DATABASE_URL` | Postgres connection string (Railway provides this). Append `?sslmode=require` for the public proxy. |
| `PORT` | Set by Railway automatically |
