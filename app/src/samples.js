// Sample scenes, drawn procedurally at run time: each one paints a full
// Vice City style backdrop onto an offscreen canvas, so the editor always
// has three photos to work with even before the user uploads their own.
// No image files are involved: every line, building and palm is code.
// The drawings are deterministic: the same scene name always paints the
// same picture, which keeps screenshots reproducible.

/** A tiny seeded random generator, so a scene never changes between runs. */
function seeded(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Fills `ctx` with a vertical gradient between the given colour stops. */
function skyGradient(ctx, w, h, stops) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  for (const [at, colour] of stops) g.addColorStop(at, colour);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

/** A synthwave sun: a disc with horizontal slits cut out of its lower half. */
function slitSun(ctx, cx, cy, r, top, bottom) {
  const g = ctx.createLinearGradient(0, cy - r, 0, cy + r);
  g.addColorStop(0, top);
  g.addColorStop(1, bottom);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,0)';
  const bg = ctx.createLinearGradient(0, cy, 0, cy + r);
  void bg;
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = '#1a0b2e';
  let y = cy + r * 0.05;
  let gap = r * 0.07;
  while (y < cy + r) {
    ctx.fillRect(cx - r, y, r * 2, gap);
    y += gap * 2.4;
    gap *= 1.5;
  }
  ctx.restore();
}

/** A row of dark buildings with a few lit windows, along the horizon. */
function skyline(ctx, w, baseY, topY, rand, lit) {
  let x = -w * 0.02;
  while (x < w * 1.02) {
    const bw = w * (0.05 + rand() * 0.09);
    const bh = baseY - (topY + rand() * (baseY - topY) * 0.55);
    ctx.fillStyle = '#12081f';
    ctx.fillRect(x, bh, bw, baseY - bh);
    if (rand() < 0.7) {
      ctx.fillStyle = '#12081f';
      ctx.fillRect(x + bw * 0.2, bh - h2(bw), bw * 0.6, h2(bw));
    }
    ctx.fillStyle = lit;
    const rows = Math.floor((baseY - bh) / (w * 0.035));
    const cols = Math.floor(bw / (w * 0.03));
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (rand() < 0.34) {
          ctx.fillRect(x + w * 0.012 + c * w * 0.03, bh + w * 0.014 + r * w * 0.035, w * 0.013, w * 0.018);
        }
      }
    }
    x += bw + w * 0.012;
  }
  function h2(bw) { return bw * (0.25 + rand() * 0.3); }
}

/** A palm silhouette: curved trunk plus a fan of drooping fronds. */
function palm(ctx, x, y, s, lean, colour) {
  ctx.strokeStyle = colour;
  ctx.fillStyle = colour;
  ctx.lineWidth = s * 0.09;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(x + lean * s, y - s * 0.55, x + lean * s * 1.4, y - s);
  ctx.stroke();
  const topX = x + lean * s * 1.4;
  const topY = y - s;
  for (let i = 0; i < 7; i++) {
    const a = (-0.15 - i * 0.22) * Math.PI + (lean > 0 ? 0.35 : -0.35);
    const len = s * (0.55 + (i % 3) * 0.12);
    ctx.lineWidth = s * 0.05;
    ctx.beginPath();
    ctx.moveTo(topX, topY);
    ctx.quadraticCurveTo(
      topX + Math.cos(a) * len * 0.6,
      topY + Math.sin(a) * len * 0.4 - s * 0.18,
      topX + Math.cos(a) * len,
      topY + Math.sin(a) * len + s * 0.22,
    );
    ctx.stroke();
  }
}

/** A few gulls: two short arcs each, high in the sky. */
function gulls(ctx, w, h, rand, colour) {
  ctx.strokeStyle = colour;
  ctx.lineWidth = Math.max(2, w * 0.003);
  ctx.lineCap = 'round';
  for (let i = 0; i < 5; i++) {
    const gx = w * (0.12 + rand() * 0.7);
    const gy = h * (0.08 + rand() * 0.2);
    const s = w * (0.012 + rand() * 0.012);
    ctx.beginPath();
    ctx.moveTo(gx - s, gy);
    ctx.quadraticCurveTo(gx - s * 0.4, gy - s * 0.7, gx, gy);
    ctx.quadraticCurveTo(gx + s * 0.4, gy - s * 0.7, gx + s, gy);
    ctx.stroke();
  }
}

/** Scene one: a speedboat tearing across the harbour at dusk. */
function harborScene(ctx, w, h) {
  const rand = seeded(4107);
  skyGradient(ctx, w, h, [[0, '#2a1052'], [0.45, '#7a1e6e'], [0.62, '#ff7a3c'], [0.72, '#ffb347']]);
  slitSun(ctx, w * 0.68, h * 0.58, w * 0.16, '#ffe259', '#ff5e62');
  skyline(ctx, w, h * 0.66, h * 0.34, rand, '#ffd166');
  gulls(ctx, w, h, rand, '#241031');
  const water = ctx.createLinearGradient(0, h * 0.66, 0, h);
  water.addColorStop(0, '#3a1c5c');
  water.addColorStop(0.25, '#1c1038');
  water.addColorStop(1, '#0a0618');
  ctx.fillStyle = water;
  ctx.fillRect(0, h * 0.66, w, h * 0.34);
  ctx.fillStyle = 'rgba(255, 122, 60, 0.35)';
  for (let i = 0; i < 26; i++) {
    const y = h * (0.68 + rand() * 0.3);
    const ww = w * (0.05 + rand() * 0.22) * (1 - (y - h * 0.66) / (h * 0.34));
    ctx.fillRect(w * 0.68 - ww / 2, y, ww, h * 0.006);
  }
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  for (let i = 0; i < 60; i++) {
    ctx.fillRect(rand() * w, h * (0.67 + rand() * 0.31), w * 0.02, h * 0.002);
  }
  const by = h * 0.8;
  const bs = w * 0.34;
  ctx.fillStyle = '#f4f1e8';
  ctx.beginPath();
  ctx.moveTo(w * 0.2, by);
  ctx.lineTo(w * 0.2 + bs * 0.55, by - h * 0.055);
  ctx.lineTo(w * 0.2 + bs, by - h * 0.02);
  ctx.lineTo(w * 0.2 + bs * 0.92, by + h * 0.035);
  ctx.lineTo(w * 0.2 + bs * 0.08, by + h * 0.035);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#14101f';
  ctx.beginPath();
  ctx.moveTo(w * 0.2 + bs * 0.52, by - h * 0.055);
  ctx.lineTo(w * 0.2 + bs * 0.72, by - h * 0.075);
  ctx.lineTo(w * 0.2 + bs * 0.86, by - h * 0.02);
  ctx.lineTo(w * 0.2 + bs * 0.6, by - h * 0.02);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#ff2e88';
  ctx.fillRect(w * 0.2 + bs * 0.1, by + h * 0.012, bs * 0.8, h * 0.012);
  ctx.strokeStyle = 'rgba(255,255,255,0.85)';
  ctx.lineWidth = h * 0.008;
  ctx.lineCap = 'round';
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(w * 0.2 + bs * (0.05 + i * 0.06), by + h * 0.05 + i * h * 0.02);
    ctx.quadraticCurveTo(w * (0.12 + i * 0.05), by + h * (0.1 + i * 0.03), w * (0.02 + i * 0.04), by + h * (0.16 + i * 0.03));
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  for (let i = 0; i < 40; i++) {
    const px = w * (0.08 + rand() * 0.3);
    const py = by + h * (0.04 + rand() * 0.1);
    ctx.fillRect(px, py, w * 0.006, w * 0.006);
  }
}

/** Scene two: a casino marquee glowing over the strip at night. */
function casinoScene(ctx, w, h) {
  const rand = seeded(9021);
  skyGradient(ctx, w, h, [[0, '#12082e'], [0.5, '#3d1160'], [0.78, '#a4138c'], [1, '#ff5e62']]);
  ctx.fillStyle = '#ffe9a8';
  ctx.beginPath();
  ctx.arc(w * 0.82, h * 0.16, w * 0.06, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255, 233, 168, 0.25)';
  ctx.beginPath();
  ctx.arc(w * 0.82, h * 0.16, w * 0.1, 0, Math.PI * 2);
  ctx.fill();
  for (let i = 0; i < 70; i++) {
    ctx.fillStyle = `rgba(255,255,255,${0.25 + rand() * 0.6})`;
    ctx.fillRect(rand() * w, rand() * h * 0.5, w * 0.004, w * 0.004);
  }
  const tx = w * 0.3;
  const tw = w * 0.4;
  const ty = h * 0.3;
  ctx.fillStyle = '#1b0b33';
  ctx.fillRect(tx, ty, tw, h * 0.42);
  ctx.fillStyle = '#241243';
  ctx.fillRect(tx + tw * 0.1, ty - h * 0.06, tw * 0.8, h * 0.06);
  ctx.fillStyle = '#ffd166';
  const rows = 6;
  const cols = 8;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (rand() < 0.55) {
        ctx.fillRect(tx + tw * 0.08 + c * tw * 0.11, ty + h * 0.1 + r * h * 0.05, w * 0.018, h * 0.028);
      }
    }
  }
  ctx.fillStyle = '#ff2e88';
  roundRect(ctx, tx - tw * 0.06, ty + h * 0.08, tw * 1.12, h * 0.13, w * 0.02);
  ctx.fill();
  ctx.fillStyle = '#fff3c4';
  ctx.font = `900 ${Math.round(w * 0.075)}px "Arial Black", "Liberation Sans", Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('CASINO', tx + tw / 2, ty + h * 0.145);
  ctx.fillStyle = '#ffe9a8';
  for (let i = 0; i < 26; i++) {
    const a = (i / 26) * Math.PI * 2;
    const bx = tx + tw / 2 + Math.cos(a) * tw * 0.58;
    const by = ty + h * 0.145 + Math.sin(a) * h * 0.085;
    ctx.beginPath();
    ctx.arc(bx, by, w * 0.008, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#0d0518';
  ctx.fillRect(0, h * 0.72, w, h * 0.28);
  ctx.fillStyle = 'rgba(255, 46, 136, 0.3)';
  ctx.fillRect(0, h * 0.72, w, h * 0.012);
  for (let i = 0; i < 12; i++) {
    const lx = rand() * w;
    ctx.fillStyle = `rgba(${180 + Math.floor(rand() * 75)}, 40, 140, 0.5)`;
    ctx.fillRect(lx, h * 0.74, w * 0.01, h * 0.2);
  }
  ctx.fillStyle = '#160a26';
  ctx.beginPath();
  ctx.moveTo(w * 0.62, h);
  ctx.lineTo(w * 0.66, h * 0.86);
  ctx.lineTo(w * 0.86, h * 0.86);
  ctx.lineTo(w * 0.92, h);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#ffe259';
  ctx.fillRect(w * 0.68, h * 0.88, w * 0.05, h * 0.03);
  ctx.fillRect(w * 0.76, h * 0.88, w * 0.05, h * 0.03);
  ctx.fillStyle = 'rgba(255, 226, 89, 0.35)';
  ctx.beginPath();
  ctx.moveTo(w * 0.66, h * 0.92);
  ctx.lineTo(w * 0.7, h);
  ctx.lineTo(w * 0.78, h);
  ctx.lineTo(w * 0.78, h * 0.92);
  ctx.closePath();
  ctx.fill();
  palm(ctx, w * 0.06, h * 0.74, w * 0.2, 0.4, '#0d0518');
  palm(ctx, w * 0.94, h * 0.74, w * 0.17, -0.5, '#0d0518');
  ctx.strokeStyle = 'rgba(255, 209, 102, 0.8)';
  ctx.lineWidth = w * 0.004;
  for (let i = 0; i < 9; i++) {
    const sx = w * (0.1 + i * 0.1);
    const sy = h * (0.06 + Math.sin(i * 1.2) * h * 0.015);
    ctx.beginPath();
    ctx.arc(sx, sy, w * 0.008, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Scene three: a rain-slick alley, a doorway glowing at its far end. */
function alleyScene(ctx, w, h) {
  const rand = seeded(5513);
  skyGradient(ctx, w, h, [[0, '#0b0b1e'], [0.55, '#1d1440'], [1, '#3a1c5c']]);
  ctx.fillStyle = '#2a1844';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(w * 0.42, 0);
  ctx.lineTo(w * 0.46, h * 0.62);
  ctx.lineTo(0, h * 0.78);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#1c1030';
  ctx.beginPath();
  ctx.moveTo(w, 0);
  ctx.lineTo(w * 0.58, 0);
  ctx.lineTo(w * 0.54, h * 0.62);
  ctx.lineTo(w, h * 0.78);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.45)';
  ctx.lineWidth = w * 0.004;
  for (let i = 0; i < 9; i++) {
    const y = h * (0.06 + i * 0.07);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w * 0.44, h * 0.6 - (h * 0.6 - y) * 0.35);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(w, y);
    ctx.lineTo(w * 0.56, h * 0.6 - (h * 0.6 - y) * 0.35);
    ctx.stroke();
  }
  const dx = w * 0.5;
  const dy = h * 0.62;
  const glow = ctx.createRadialGradient(dx, dy, 0, dx, dy, w * 0.22);
  glow.addColorStop(0, 'rgba(255, 190, 90, 0.95)');
  glow.addColorStop(0.4, 'rgba(255, 140, 60, 0.4)');
  glow.addColorStop(1, 'rgba(255, 140, 60, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(dx - w * 0.22, dy - w * 0.22, w * 0.44, w * 0.44);
  ctx.fillStyle = '#3a2410';
  ctx.fillRect(dx - w * 0.035, dy - h * 0.14, w * 0.07, h * 0.14);
  ctx.fillStyle = '#ffbe5a';
  ctx.fillRect(dx - w * 0.026, dy - h * 0.13, w * 0.052, h * 0.13);
  ctx.strokeStyle = '#3a2410';
  ctx.lineWidth = w * 0.006;
  ctx.strokeRect(dx - w * 0.026, dy - h * 0.13, w * 0.052, h * 0.13);
  ctx.beginPath();
  ctx.moveTo(dx, dy - h * 0.13);
  ctx.lineTo(dx, dy);
  ctx.stroke();
  ctx.strokeStyle = '#0a0616';
  ctx.lineWidth = w * 0.008;
  for (let i = 0; i < 4; i++) {
    const y = h * (0.16 + i * 0.11);
    ctx.beginPath();
    ctx.moveTo(w * 0.6, y);
    ctx.lineTo(w * 0.72, y + h * 0.05);
    ctx.lineTo(w * 0.6, y + h * 0.1);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(w * 0.72, y + h * 0.05);
    ctx.lineTo(w * 0.86, y);
    ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(255, 46, 136, 0.9)';
  ctx.lineWidth = w * 0.01;
  ctx.beginPath();
  ctx.arc(w * 0.78, h * 0.2, w * 0.05, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = 'rgba(255, 46, 136, 0.25)';
  ctx.beginPath();
  ctx.arc(w * 0.78, h * 0.2, w * 0.05, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#120a24';
  ctx.fillRect(0, h * 0.78, w, h * 0.22);
  ctx.fillStyle = 'rgba(255, 190, 90, 0.4)';
  ctx.beginPath();
  ctx.ellipse(dx, h * 0.86, w * 0.09, h * 0.03, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255, 46, 136, 0.35)';
  ctx.beginPath();
  ctx.ellipse(w * 0.78, h * 0.9, w * 0.06, h * 0.02, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(180, 200, 255, 0.55)';
  ctx.lineWidth = w * 0.002;
  for (let i = 0; i < 90; i++) {
    const rx = rand() * w;
    const ry = rand() * h;
    const len = h * (0.02 + rand() * 0.02);
    ctx.beginPath();
    ctx.moveTo(rx, ry);
    ctx.lineTo(rx - w * 0.008, ry + len);
    ctx.stroke();
  }
  ctx.fillStyle = '#0a0616';
  ctx.fillRect(w * 0.08, h * 0.82, w * 0.16, h * 0.12);
  ctx.fillStyle = '#1d1440';
  ctx.fillRect(w * 0.08, h * 0.82, w * 0.16, h * 0.02);
  ctx.strokeStyle = '#0a0616';
  ctx.lineWidth = w * 0.004;
  ctx.beginPath();
  ctx.moveTo(w * 0.12, h * 0.78);
  ctx.lineTo(w * 0.3, h * 0.6);
  ctx.stroke();
  ctx.fillStyle = '#ffe259';
  ctx.beginPath();
  ctx.arc(w * 0.3, h * 0.59, w * 0.012, 0, Math.PI * 2);
  ctx.fill();
}

const PAINTERS = { harbor: harborScene, casino: casinoScene, alley: alleyScene };

export const SCENE_NAMES = ['harbor', 'casino', 'alley'];

export const SCENE_LABELS = {
  harbor: 'Harbor Chase',
  casino: 'Casino Row',
  alley: 'Alley Pursuit',
};

/** Paints a named scene onto a fresh canvas and returns it. */
export function makeScene(name, w = 1080, h = 1080) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  const paint = PAINTERS[name] ?? PAINTERS.harbor;
  paint(ctx, w, h);
  return canvas;
}
