# AGENTS.md

## Cursor Cloud specific instructions

Starry Clouds ("Cloud Blossom Sect") is a single deployable web service: a React + Three.js SPA (`src/`, built by Vite) served by a minimal Node HTTP server (`server/index.js`) that also exposes the JSON API (`/api/register`, `/api/login`, `/api/me`, `/api/logout`, `/api/train`, `/api/pve`, `/api/pvp`). Standard commands live in `package.json` and `README.md`.

Non-obvious caveats:

- End-to-end testing requires the built server, not the Vite dev server. The frontend calls the API via same-origin relative paths (`fetch('/api/...')`) and there is no Vite dev proxy, so `npm run dev` (port 5173) serves only the UI and all `/api/*` calls 404. To test the full product, run `npm run build` then `npm start`, and open the server (default port `4173`, overridable via `PORT`).
- Storage works with zero external dependencies: when `DATABASE_URL` is unset, the server persists to a local JSON file at `data/game.json` (gitignored). Set `DATABASE_URL` only to exercise the Postgres-backed path.
- Lint has no npm script; run it with `npx eslint .`.
- After changing frontend code, rebuild (`npm run build`) before restarting `npm start` — the server serves the prebuilt `dist/` (falling back to `public/` only when `dist/` is absent), so it does not hot-reload source changes.
