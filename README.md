# Starry Clouds

A tiny wholesome xianxia webgame with React, Three.js, shadcn-style UI pieces, and a very simple Node server.

## Play Locally

```powershell
npm install
npm run build
npm start
```

Open `http://localhost:4173`.

For live editing:

```powershell
npm run dev
```

## What You Can Do

- Register or log in as a cute cultivator.
- Walk around the jade cloud sect with WASD or arrow keys.
- Gather glowing herbs in the Three.js hub.
- Meditate, do gentle spirit quests, and spar with other accounts.
- Climb the tiny leaderboard.

## Deploy On Render

1. Push this project to GitHub.
2. In Render, create a new **Web Service** from the repo.
3. Use these settings:

```text
Build Command: npm install && npm run build
Start Command: npm start
```

Render will provide `PORT`, and the included server uses it automatically.

There is also a `render.yaml` file, so Render can detect the service setup.

## Assets

Generated image assets live in `public/assets/`. The latest black-and-jade backdrop is:

- `public/assets/jade-moon-sect.png`

The original generated file remains under `C:\Users\J\.codex\generated_images\...`.
