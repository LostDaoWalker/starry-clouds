# AGENTS.md

## Cursor Cloud specific instructions

GLAMOUR is a single-product repo: a React 19 + Vite 6 one-screen PBBG backed by
an Express API (`server/`) over **Railway Postgres**. Standard commands live in
`package.json` and `README.md` — reference those rather than duplicating.

### Architecture (non-obvious)
- The browser does **not** talk to the database directly and there is no auth
  provider. The Express API (`server/index.js` + `server/db.js`) is the sole
  authority: it applies energy regen, validates each action, and persists under
  a `SELECT ... FOR UPDATE` row lock. The client only POSTs an action name.
- Player identity is an unguessable UUID in an `HttpOnly` `glamour_pid` cookie.
- Core game rules live once in `shared/game.js` (plain ESM, typed by
  `shared/game.d.ts`) and are imported by both the client (`src/`) and the
  server. Keep that module pure (no DOM, no Node, no network).

### Running (dev)
- `npm run dev` runs the API (`node --watch server/index.js`, port `3000`) and
  Vite (port `5173`, proxying `/api` → `:3000`) together via `concurrently`.
- Requires a gitignored `.env` with `DATABASE_URL` (see `.env.example`). The API
  throws `DATABASE_URL is not set` on startup if it is missing, and `dev:api`
  uses `--env-file=.env` so that file must exist for local dev.
- A Postgres must be reachable at `DATABASE_URL`. Options: a Railway Postgres
  connection string, or a local Postgres (`sudo pg_ctlcluster 16 main start`
  after installing `postgresql`). The `players` table is auto-created on startup.
- `npm start` (`node server/index.js`, the Railway prod entrypoint) does **not**
  load `.env`; it expects `DATABASE_URL`/`PORT` from the environment (Railway
  injects them). To run the prod path locally, build first (`npm run build`) then
  `node --env-file=.env server/index.js`.

### Lint / test / build
- There is **no lint script and no test suite** in this repo.
- `npm run build` runs `tsc -b` (TypeScript typecheck) then `vite build`; treat
  it as the typecheck/CI gate. The server is plain JS and is not type-checked.
