// Sample scenes drawn live on canvas: three comic-city views the editor loads
// as its built-in photos. No image files are shipped — every pixel comes from
// the code below, so the scenes work offline and cost the entry no assets.
// Each scene is drawn on its own offscreen canvas (960 x 1200) and returned
// as a canvas element, which the cover renderer draws exactly like a photo.

export const SAMPLE_SCENES = {
  boulevard: 'Boulevard — sunset strip',
  pier: 'Pier — ocean drive',
  rooftop: 'Rooftop — night city',
};

/** Deterministic random stream, so a scene looks the same on every load. */
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

function sky(ctx, w, h, stops) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  for (const [at, color] of stops) g.addColorStop(at, color);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

function sunDisc(ctx, cx, cy, r, color) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** Synthwave sun: a disc with horizontal slits cut out of its lower half. */
function synthSun(ctx, cx, cy, r) {
  sunDisc(ctx, cx, cy, r, '#ffd400');
  ctx.save();
  ctx.fillStyle = '#ff7a1a';
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = '#ff5e3a';
  let y = cy + r * 0.08;
  let gap = r * 0.07;
  while (y < cy + r) {
    ctx.fillRect(cx - r, y, r * 2, gap);
    y += gap * 2.4;
    gap *= 1.5;
  }
  ctx.restore();
  ctx.save();
  ctx.strokeStyle = '#111';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

/** A row of dark skyline blocks with lit windows. */
function skyline(ctx, w, baseY, topY, color, rand, lit) {
  ctx.fillStyle = color;
  let x = -20;
  while (x < w + 20) {
    const bw = 60 + rand() * 130;
    const bh = baseY - (topY + rand() * (baseY - topY) * 0.55);
    ctx.fillRect(x, baseY - bh, bw, bh);
    if (lit) {
      for (let wy = baseY - bh + 16; wy < baseY - 14; wy += 26) {
        for (let wx = x + 12; wx < x + bw - 12; wx += 24) {
          if (rand() < 0.42) {
            ctx.fillStyle = '#ffd400';
            ctx.fillRect(wx, wy, 10, 14);
            ctx.fillStyle = color;
          }
        }
      }
    }
    if (rand() < 0.3) {
      ctx.fillRect(x + bw * 0.35, baseY - bh - 26, 8, 26);
    }
    x += bw + 6 + rand() * 22;
  }
}

/** A palm silhouette: curved trunk plus drooping fronds. */
function palm(ctx, x, baseY, s, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 10 * s;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x, baseY);
  ctx.quadraticCurveTo(x + 26 * s, baseY - 90 * s, x + 8 * s, baseY - 170 * s);
  ctx.stroke();
  const topX = x + 8 * s;
  const topY = baseY - 170 * s;
  ctx.lineWidth = 7 * s;
  for (let i = 0; i < 7; i++) {
    const a = Math.PI * (0.08 + (i / 6) * 0.84);
    const len = (52 + ((i * 37) % 26)) * s;
    const ex = topX + Math.cos(a) * len;
    const ey = topY + Math.sin(a) * len * 0.55 + 16 * s;
    ctx.beginPath();
    ctx.moveTo(topX, topY);
    ctx.quadraticCurveTo(topX + Math.cos(a) * len * 0.5, topY - 26 * s, ex, ey);
    ctx.stroke();
  }
  ctx.restore();
}

/** A band of halftone dots growing toward one corner. */
function halftoneBand(ctx, w, h, x0, y0, x1, y1, color) {
  ctx.save();
  ctx.fillStyle = color;
  const gap = 26;
  for (let y = y0; y < y1; y += gap) {
    for (let x = x0; x < x1; x += gap) {
      const t = (x - x0) / Math.max(1, x1 - x0) + (y1 - y) / Math.max(1, y1 - y0);
      const r = Math.max(1.5, 5.5 * t * 0.5);
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

/** Diagonal speed lines, comic style. */
function speedLines(ctx, w, h, color, n) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    ctx.lineWidth = 5 + i;
    const y = h * (0.06 + i * 0.03);
    ctx.beginPath();
    ctx.moveTo(w * 0.04, y);
    ctx.lineTo(w * (0.14 + i * 0.014), y - h * 0.014);
    ctx.stroke();
  }
  ctx.restore();
}

function gull(ctx, x, y, s, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 4 * s;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x - 14 * s, y);
  ctx.quadraticCurveTo(x - 5 * s, y - 9 * s, x, y);
  ctx.quadraticCurveTo(x + 5 * s, y - 9 * s, x + 14 * s, y);
  ctx.stroke();
  ctx.restore();
}

function drawBoulevard(ctx, w, h, rand) {
  sky(ctx, w, h, [[0, '#2b1a5e'], [0.45, '#c22a6e'], [0.75, '#ff7a1a'], [1, '#ffd400']]);
  synthSun(ctx, w * 0.5, h * 0.42, w * 0.22);
  halftoneBand(ctx, w, h, w * 0.66, 0, w, h * 0.3, 'rgba(17,17,17,0.5)');
  speedLines(ctx, w, h, '#111', 4);
  skyline(ctx, w, h * 0.72, h * 0.34, '#1d1040', rand, true);
  gull(ctx, w * 0.2, h * 0.2, 1, '#111');
  gull(ctx, w * 0.3, h * 0.15, 0.7, '#111');
  palm(ctx, w * 0.12, h * 0.98, 1.1, '#12082b');
  palm(ctx, w * 0.88, h * 0.98, 0.9, '#12082b');
  // The boulevard: dark asphalt with a perspective centre line.
  ctx.fillStyle = '#171226';
  ctx.beginPath();
  ctx.moveTo(0, h);
  ctx.lineTo(w * 0.34, h * 0.72);
  ctx.lineTo(w * 0.66, h * 0.72);
  ctx.lineTo(w, h);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#ffd400';
  ctx.lineWidth = 8;
  ctx.setLineDash([34, 26]);
  ctx.beginPath();
  ctx.moveTo(w * 0.5, h * 0.74);
  ctx.lineTo(w * 0.5, h);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(w * 0.34, h * 0.72);
  ctx.lineTo(0, h);
  ctx.moveTo(w * 0.66, h * 0.72);
  ctx.lineTo(w, h);
  ctx.stroke();
}

function drawPier(ctx, w, h, rand) {
  sky(ctx, w, h, [[0, '#0e5f7a'], [0.5, '#37b6c9'], [0.8, '#ffd9a0'], [1, '#ff9d5c']]);
  sunDisc(ctx, w * 0.72, h * 0.3, w * 0.13, '#fff3c4');
  ctx.save();
  ctx.strokeStyle = '#111';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(w * 0.72, h * 0.3, w * 0.13, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
  gull(ctx, w * 0.22, h * 0.16, 1, '#111');
  gull(ctx, w * 0.34, h * 0.22, 0.7, '#111');
  gull(ctx, w * 0.14, h * 0.28, 0.55, '#111');
  skyline(ctx, w, h * 0.58, h * 0.4, '#14324a', rand, false);
  // The sea: stacked wave strokes.
  for (let i = 0; i < 9; i++) {
    const y = h * (0.6 + i * 0.045);
    ctx.strokeStyle = i % 2 ? 'rgba(255,255,255,0.55)' : 'rgba(14,95,122,0.6)';
    ctx.lineWidth = 7;
    ctx.beginPath();
    for (let x = 0; x <= w; x += 24) {
      const yy = y + Math.sin((x / w) * Math.PI * 3 + i) * 7;
      if (x === 0) ctx.moveTo(x, yy);
      else ctx.lineTo(x, yy);
    }
    ctx.stroke();
  }
  // The pier deck, boards in perspective toward the horizon.
  ctx.fillStyle = '#7a4a21';
  ctx.beginPath();
  ctx.moveTo(w * 0.3, h * 0.62);
  ctx.lineTo(w * 0.7, h * 0.62);
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#4a2c10';
  ctx.lineWidth = 4;
  for (let i = 0; i < 8; i++) {
    const t = i / 7;
    const y = h * (0.62 + t * 0.38);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }
  ctx.strokeStyle = '#4a2c10';
  ctx.beginPath();
  ctx.moveTo(w * 0.3, h * 0.62);
  ctx.lineTo(0, h);
  ctx.moveTo(w * 0.7, h * 0.62);
  ctx.lineTo(w, h);
  ctx.stroke();
  ctx.fillStyle = '#5d3a17';
  for (const [px, ph] of [[0.3, 0.62], [0.7, 0.62]]) {
    ctx.fillRect(w * px - 14, h * ph - 60, 28, 60);
  }
  ctx.fillStyle = '#ffd400';
  ctx.beginPath();
  ctx.arc(w * 0.5, h * 0.56, 10, 0, Math.PI * 2);
  ctx.fill();
}

function drawRooftop(ctx, w, h, rand) {
  sky(ctx, w, h, [[0, '#0b0b2e'], [0.55, '#3b1d5e'], [0.85, '#c22a6e'], [1, '#ff7a1a']]);
  for (let i = 0; i < 90; i++) {
    const x = rand() * w;
    const y = rand() * h * 0.5;
    const r = 1 + rand() * 2.4;
    ctx.fillStyle = `rgba(255,255,255,${0.35 + rand() * 0.6})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  sunDisc(ctx, w * 0.78, h * 0.2, w * 0.11, '#fff3c4');
  ctx.save();
  ctx.strokeStyle = '#111';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(w * 0.78, h * 0.2, w * 0.11, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
  skyline(ctx, w, h * 0.66, h * 0.42, '#160b33', rand, true);
  halftoneBand(ctx, w, h, 0, h * 0.1, w * 0.3, h * 0.34, 'rgba(255,255,255,0.35)');
  // The rooftop in the foreground: ledge, water tower, antenna.
  ctx.fillStyle = '#0d071f';
  ctx.fillRect(0, h * 0.66, w, h * 0.34);
  ctx.fillStyle = '#1d1040';
  ctx.fillRect(w * 0.1, h * 0.5, w * 0.16, h * 0.16);
  ctx.beginPath();
  ctx.moveTo(w * 0.08, h * 0.5);
  ctx.lineTo(w * 0.18, h * 0.44);
  ctx.lineTo(w * 0.28, h * 0.5);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#ffd400';
  for (let wy = h * 0.53; wy < h * 0.63; wy += 22) {
    for (let wx = w * 0.12; wx < w * 0.24; wx += 22) {
      if (rand() < 0.5) ctx.fillRect(wx, wy, 8, 11);
    }
  }
  ctx.strokeStyle = '#0d071f';
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(w * 0.78, h * 0.66);
  ctx.lineTo(w * 0.78, h * 0.34);
  ctx.stroke();
  ctx.strokeStyle = '#0d071f';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(w * 0.78, h * 0.4);
  ctx.lineTo(w * 0.7, h * 0.46);
  ctx.moveTo(w * 0.78, h * 0.4);
  ctx.lineTo(w * 0.86, h * 0.46);
  ctx.stroke();
  ctx.fillStyle = '#e63329';
  ctx.beginPath();
  ctx.arc(w * 0.78, h * 0.33, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(w * 0.78, h * 0.33, 14, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.8)';
  ctx.lineWidth = 4;
  for (let i = 0; i < 5; i++) {
    const y = h * (0.7 + i * 0.05);
    ctx.beginPath();
    ctx.moveTo(w * (0.42 + (i % 2) * 0.05), y);
    ctx.lineTo(w * (0.58 - (i % 2) * 0.05), y);
    ctx.stroke();
  }
}

const DRAWERS = { boulevard: drawBoulevard, pier: drawPier, rooftop: drawRooftop };
const SEEDS = { boulevard: 20261120, pier: 777, rooftop: 4242 };

/**
 * Draws one named sample scene and returns its canvas, ready to drop into a
 * panel exactly like an uploaded photo. Unknown names fall back to boulevard.
 */
export function makeSampleScene(name) {
  const key = DRAWERS[name] ? name : 'boulevard';
  const canvas = makeCanvas(960, 1200);
  const ctx = canvas.getContext('2d');
  DRAWERS[key](ctx, canvas.width, canvas.height, rng(SEEDS[key]));
  return canvas;
}
