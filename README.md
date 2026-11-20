# Loading Screen Comic — GTA-Style Cover Maker

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/JACKETAGENT-ID/gta6-cover-art-zech/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/JACKETAGENT-ID/gta6-cover-art-zech/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

Turn your photo into a comic-book loading-screen cover: diagonal panels with
thick black outlines, halftone dots, a red starburst sticker, extra-bold
caption lettering and a loading bar — exported as a PNG to share.

## How it works

1. **Add photos** — pick up to three photos from your machine (slots A, B, C),
   or use the built-in comic city samples, drawn live on canvas by the app.
   Photos are read locally and never uploaded.
2. **Pick a layout** — Duo Diagonal (hero + street), Triple Strip (three
   slashes) or Solo Hero (one big frame). Each panel takes any of your photos.
3. **Crop & position** — drag the photo right on the preview, or use the zoom
   and move sliders per panel.
4. **Write the words** — caption, tagline and loading percentage, with a
   halftone toggle.
5. **Export** — one click saves a PNG at 1080×1080, 1080×1350 or 1920×1080.

## Design

"Loading-Screen Comic": flat yellow/red/black comic colours, halftone dots,
diagonal gutters, extra-bold system-font display lettering with a black outline
and red drop shadow, plus a loading bar in the footer strip. Everything is
original — no Rockstar logo, artwork or font. Lettering uses the machine's own
heavy sans (Arial Black / Liberation Sans Bold) and the sample scenes are
drawn at runtime on canvas, so the app ships no font or image files at all.

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

Static files only — `app/index.html` opens in desktop Chrome with no network
request. Build the hand-in with:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## Layout

- `app/index.html` — editor page
- `app/style.css` — comic editor styling
- `app/src/cover.js` — the cover renderer (panels, halftone, lettering, footer)
- `app/src/samples.js` — three comic city scenes drawn live on canvas
- `app/src/main.js` — editor wiring, drag-to-pan, export
- `app/src/shots.js` — fixed scenes for screenshots (`?shot=`)
- `screenshots/` — cover + editor screenshots
- `main.ts` — hands `app/` and `screenshots/` in and writes `dossier.json`
- `serve.ts` — tiny static server for local trying

## License

MIT — see [LICENSE](LICENSE).
