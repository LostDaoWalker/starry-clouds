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

## Hosting (Fly.io)

The app deploys to [Fly.io](https://fly.io) as a static SPA. Game data lives in Supabase (no Fly Postgres).

**Live URL (after deploy):** https://starry-clouds.fly.dev

### One-time setup

1. Create a Fly.io access token: [fly.io/user/personal_access_tokens](https://fly.io/user/personal_access_tokens)
2. Add it to GitHub repo secrets as `FLY_API_TOKEN`:
   - Repo → Settings → Secrets and variables → Actions → New repository secret
3. Push to `master` or run the **Deploy to Fly.io** workflow manually

### Manual deploy

```bash
export FLY_API_TOKEN=your_token
./scripts/fly-deploy.sh
```

### Requirements

- Supabase anonymous sign-ins enabled (Authentication → Providers → Anonymous)
- `fly.toml` embeds the public Supabase URL and anon key at build time


## Environment

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase publishable/anon key |
| `PORT` | Set by Railway automatically |
