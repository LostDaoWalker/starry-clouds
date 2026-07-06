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
- **Database** — Supabase (Postgres + anonymous auth + RLS)
- **Hosting** — Railway

## Setup

### 1. Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Enable **Anonymous sign-ins**: Authentication → Providers → Anonymous
3. Run the migration in `supabase/migrations/20260706000000_glamour_game.sql` via the SQL Editor
4. Copy your project URL and anon key from Settings → API

### 2. Local dev

```bash
cp .env.example .env   # fill in Supabase values
npm install
npm run dev
```

### 3. Railway

1. Connect this repo to [Railway](https://railway.app)
2. Set environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Railway reads `railway.toml` — builds with `npm run build`, starts with `npm start`

## Environment

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase publishable/anon key |
| `PORT` | Set by Railway automatically |
