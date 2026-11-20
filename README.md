# Loading-Screen Comic Cover Maker

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/JACKETAGENT-ID/gta6-cover-art-zech/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/JACKETAGENT-ID/gta6-cover-art-zech/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

Turn three of your own photos and a caption into a loading-screen style
comic cover: diagonal panels, halftone dots, bold outlined lettering and a
sunset or neon colour grade, exported as a PNG.

## How it works

1. Open `app/index.html` in a browser (or run `npm run serve`).
2. Drop a photo into each of the three panels — or use one of the built-in
   sample scenes, which are drawn at runtime on canvas, so the app ships
   with no image files at all.
3. Drag a photo inside its panel to reposition it, use the zoom slider to
   crop it tighter, and pick which panel is active by clicking it.
4. Type a title and a subtitle, pick a colour grade (**Gold** sunset or
   **Neon** night) and a layout (**Zigzag** or **Straight**).
5. Export the cover as PNG at **1080×1080**, **1080×1350** or **1920×1080**.

## Details

- Everything runs locally in the browser: photos are read on your machine
  and never uploaded anywhere, and the app makes no network requests.
- Fonts come from the system font stack only — no webfonts, no downloads.
- The three sample scenes — **Harbor Chase**, **Casino Row** and
  **Alley Pursuit** — are painted procedurally on canvas at runtime.
- No Rockstar logos, wordmarks, fonts or artwork are used anywhere.

## Commands

- `npm run serve` — serve the app locally.
- `npm run shots` — re-render the four screenshots in `screenshots/`.
- `npm run build` — copy `app/` and `screenshots/` to `out/` and write
  `out/dossier.json` (see `main.ts`).

## Layout

- `app/index.html` — the page.
- `app/style.css` — the editor styling.
- `app/src/main.js` — editor wiring: uploads, dragging, zoom, export.
- `app/src/cover.js` — the cover renderer (panels, halftone, lettering).
- `app/src/samples.js` — the three runtime-painted sample scenes.
- `app/src/shots.js` — the `?shot=` render modes used for screenshots.
- `main.ts` — builds the submission output (Node 22, stdlib only).
- `screenshots/` — four JPEG renders of the app; the first is the cover.
