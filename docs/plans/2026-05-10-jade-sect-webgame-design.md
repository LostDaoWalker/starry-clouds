# Jade Sect Webgame Design

## Direction

Build a brutally simple, wholesome xianxia webgame with a black-and-green cute style. The first screen should feel like the game, not a landing page.

## Approach

- React renders the main shell, account panels, action buttons, leaderboard, and sect log.
- Three.js renders a small playable jade platform with a player sprite, glowing herbs, and friendly online-style spirits.
- The Node server keeps basic accounts, sessions, progression, leaderboard data, and gentle PvE/PvP actions.
- Static assets live in `public/assets/` so the same build works locally and on Render.

## Hosting

Render runs `npm install && npm run build`, then `npm start`. The server reads Render's `PORT` environment variable automatically.

## Success

The game is tiny, cute, readable, deployable, and playable in a browser with no complex setup.
