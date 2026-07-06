# AGENTS.md

## Cursor Cloud specific instructions

GLAMOUR is a single-product repo: a React 19 + Vite 6 one-screen PBBG whose only
backend is a hosted Supabase project (Postgres + anonymous auth + RLS). The
browser talks to Supabase directly; there is no separate backend API. Standard
commands live in `package.json` and `README.md` — reference those rather than
duplicating.

### Running (dev)
- `npm run dev` is the primary dev workflow (Vite on port `5173`, see `vite.config.ts`).
- The app requires a gitignored `.env` (see `.env.example`) with:
  - `VITE_SUPABASE_URL=https://rkqchyduzukazkliucxh.supabase.co`
  - `VITE_SUPABASE_ANON_KEY=<anon/publishable key>` — retrievable via the
    Supabase MCP `get_publishable_keys` for project ref `rkqchyduzukazkliucxh`
    (the anon key is a client-public key that also gets embedded in the built
    frontend, so it is not a secret).
  - Without these vars the app throws `Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY` on load (`src/lib/supabase.ts`).

### Supabase requirement (non-obvious gotcha)
- The app authenticates every player via `supabase.auth.signInAnonymously()`.
  **Anonymous sign-ins must be enabled** on the Supabase project
  (Dashboard → Authentication → Sign In / Providers → Anonymous). If disabled,
  the app renders the error screen `Anonymous sign-ins are disabled` and no
  gameplay/persistence works. This toggle is not editable via SQL or the
  Supabase MCP — it must be set in the dashboard.
- The `public.players` table + RLS policies come from
  `supabase/migrations/20260706000000_glamour_game.sql` and are already applied
  on project `rkqchyduzukazkliucxh`.

### Lint / test / build
- There is **no lint script and no test suite** in this repo.
- `npm run build` runs `tsc -b` (TypeScript typecheck) then `vite build`; treat
  it as the typecheck/CI gate.

### Production server caveat
- `npm start` (`server/index.js`, the Railway prod entrypoint) currently crashes
  under Express 5 with `Missing parameter name at index 1: *` because the
  `app.get("*")` catch-all route is incompatible with path-to-regexp v8. This
  does not affect local development — use `npm run dev`.
