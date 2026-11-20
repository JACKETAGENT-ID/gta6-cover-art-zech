// Sample scenes for the cover maker, drawn live on canvas at run time.
// Nothing here is a photo file: every pixel is procedural, so the three
// "photos" below are original drawings the app paints when asked. Each
// painter works on any canvas size and is deterministic: the same scene
// id always paints the same picture, because the random numbers come
// from a small seeded generator instead of Math.random().

export const SCENES = [
  { id: 'dockside', label: 'Dockside Dawn', hint: 'Cranes and containers at first light' },
  { id: 'downtown', label: 'Neon Downtown', hint: 'Towers, searchlights and a big moon' },
  { id: 'getaway', label: 'Getaway', hint: 'A chase down the coast road' },
];

// A tiny seeded generator (mulberry32). One seed per scene keeps every
// drawing stable between loads, screenshots and exports.
function seeded(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function sky(ctx, w, h, stops) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  for (const [at, color] of stops) g.addColorStop(at, color);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

function disc(ctx, x, y, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

// A synthwave sun: a solid disc with horizontal slits cut out of its
// lower half, so the sky shows through in stripes.
function slitSun(ctx, x, y, r, color, skyColor) {
  disc(ctx, x, y, r, color);
  ctx.fillStyle = skyColor;
  let gap = r * 0.08;
  let yy = y + r * 0.05;
  let thick = r * 0.05;
  while (yy < y + r) {
    ctx.fillRect(x - r - 2, yy, r * 2 + 4, thick);
    yy += gap + thick;
    thick *= 1.35;
    gap *= 1.25;
  }
}

function gulls(ctx, rand, w, h, n, yTop, yBottom, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(2, w * 0.004);
  ctx.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const x = rand() * w;
    const y = yTop + rand() * (yBottom - yTop);
    const s = w * (0.012 + rand() * 0.02);
    ctx.beginPath();
    ctx.moveTo(x - s, y);
    ctx.quadraticCurveTo(x - s * 0.4, y - s * 0.7, x, y);
    ctx.quadraticCurveTo(x + s * 0.4, y - s * 0.7, x + s, y);
    ctx.stroke();
  }
}

// A field of halftone dots, denser toward the bottom of the band.
function halftone(ctx, rand, x, y, w, h, color, maxR) {
  ctx.fillStyle = color;
  const step = Math.max(9, w * 0.018);
  for (let yy = y + step / 2; yy < y + h; yy += step) {
    const t = (yy - y) / h;
    for (let xx = x + step / 2; xx < x + w; xx += step) {
      const r = maxR * (0.25 + 0.75 * t) * (0.7 + rand() * 0.6);
      ctx.beginPath();
      ctx.arc(xx, yy, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function towerBlock(ctx, x, yBase, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, yBase - h, w, h);
}

function litWindows(ctx, rand, x, yBase, w, h, cols, rows, lit) {
  const cw = w / cols;
  const ch = h / rows;
  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      if (rand() > lit) continue;
      ctx.fillStyle = rand() > 0.75 ? '#ffd166' : '#ffe9a8';
      ctx.fillRect(x + c * cw + cw * 0.22, yBase - h + r * ch + ch * 0.25, cw * 0.56, ch * 0.5);
    }
  }
}

function palm(ctx, x, yBase, s, color) {
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = Math.max(3, s * 0.05);
  ctx.beginPath();
  ctx.moveTo(x, yBase);
  ctx.quadraticCurveTo(x + s * 0.08, yBase - s * 0.55, x + s * 0.02, yBase - s);
  ctx.stroke();
  const topX = x + s * 0.02;
  const topY = yBase - s;
  for (let i = 0; i < 6; i++) {
    const a = (-0.15 - i * 0.28) * Math.PI;
    const len = s * (0.42 + (i % 2) * 0.1);
    ctx.beginPath();
    ctx.moveTo(topX, topY);
    ctx.quadraticCurveTo(
      topX + Math.cos(a) * len * 0.6, topY + Math.sin(a) * len * 0.5 - s * 0.08,
      topX + Math.cos(a) * len, topY + Math.sin(a) * len * 0.85,
    );
    ctx.stroke();
  }
  disc(ctx, topX - s * 0.03, topY + s * 0.05, s * 0.05, color);
  disc(ctx, topX + s * 0.05, topY + s * 0.06, s * 0.045, color);
}

// ---- Scene 1: Dockside Dawn -------------------------------------------
function paintDockside(ctx, w, h) {
  const rand = seeded(20261120);
  sky(ctx, w, h, [[0, '#2b1055'], [0.42, '#7597de'], [0.62, '#ff9a5a'], [0.78, '#ff5e62'], [1, '#1d1b3a']]);
  slitSun(ctx, w * 0.5, h * 0.52, h * 0.2, '#ffd166', '#ff5e62');
  halftone(ctx, rand, 0, 0, w, h * 0.3, 'rgba(255,255,255,0.16)', Math.max(2, w * 0.006));
  gulls(ctx, rand, w, h, 7, h * 0.08, h * 0.3, 'rgba(20,16,40,0.85)');
  // Far cranes.
  ctx.strokeStyle = '#241a3d';
  ctx.fillStyle = '#241a3d';
  ctx.lineWidth = Math.max(4, w * 0.008);
  const horizon = h * 0.66;
  for (const [cx, s] of [[w * 0.16, 1], [w * 0.82, 0.85]]) {
    const top = horizon - h * 0.34 * s;
    ctx.beginPath();
    ctx.moveTo(cx - w * 0.012, horizon);
    ctx.lineTo(cx - w * 0.012, top);
    ctx.moveTo(cx + w * 0.012, horizon);
    ctx.lineTo(cx + w * 0.012, top);
    ctx.moveTo(cx - w * 0.09, top + h * 0.05 * s);
    ctx.lineTo(cx + w * 0.13, top - h * 0.03 * s);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - w * 0.09, top + h * 0.05 * s);
    ctx.lineTo(cx + w * 0.02, top + h * 0.02 * s);
    ctx.lineTo(cx + w * 0.02, top + h * 0.07 * s);
    ctx.closePath();
    ctx.fill();
  }
  // Container stacks.
  const palette = ['#ff5e62', '#2ec4b6', '#ffd166', '#e07a5f', '#4cc9f0'];
  let cx = w * 0.03;
  while (cx < w * 0.97) {
    const bw = w * (0.09 + rand() * 0.06);
    const rows = 1 + Math.floor(rand() * 3);
    for (let r = 0; r < rows; r++) {
      ctx.fillStyle = palette[Math.floor(rand() * palette.length)];
      ctx.fillRect(cx, horizon - (r + 1) * h * 0.055, bw, h * 0.05);
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.fillRect(cx, horizon - (r + 1) * h * 0.055, bw, h * 0.012);
    }
    cx += bw + w * 0.015;
  }
  // Water with a sun reflection.
  const wg = ctx.createLinearGradient(0, horizon, 0, h);
  wg.addColorStop(0, '#3a2b5c');
  wg.addColorStop(1, '#120e26');
  ctx.fillStyle = wg;
  ctx.fillRect(0, horizon, w, h - horizon);
  for (let i = 0; i < 26; i++) {
    const y = horizon + (h - horizon) * (i / 26) + rand() * 4;
    const ww = w * (0.1 + rand() * 0.3) * (1 - i / 40);
    ctx.fillStyle = `rgba(255, 209, 102, ${0.5 - i * 0.015})`;
    ctx.fillRect(w * 0.5 - ww / 2, y, ww, Math.max(2, h * 0.006));
  }
}

// ---- Scene 2: Neon Downtown -------------------------------------------
function paintDowntown(ctx, w, h) {
  const rand = seeded(770031);
  sky(ctx, w, h, [[0, '#070b1e'], [0.55, '#141b3d'], [0.8, '#3b2a63'], [1, '#120e26']]);
  // Stars.
  for (let i = 0; i < 90; i++) {
    ctx.fillStyle = `rgba(255,255,255,${0.25 + rand() * 0.6})`;
    const r = rand() * 1.8 + 0.6;
    ctx.beginPath();
    ctx.arc(rand() * w, rand() * h * 0.45, r, 0, Math.PI * 2);
    ctx.fill();
  }
  // Moon + halo.
  const mx = w * 0.76;
  const my = h * 0.2;
  const halo = ctx.createRadialGradient(mx, my, 0, mx, my, h * 0.22);
  halo.addColorStop(0, 'rgba(255, 240, 200, 0.5)');
  halo.addColorStop(1, 'rgba(255, 240, 200, 0)');
  ctx.fillStyle = halo;
  ctx.fillRect(mx - h * 0.22, my - h * 0.22, h * 0.44, h * 0.44);
  disc(ctx, mx, my, h * 0.085, '#ffefc4');
  ctx.fillStyle = 'rgba(190,170,130,0.55)';
  disc(ctx, mx - h * 0.03, my - h * 0.02, h * 0.016, 'rgba(190,170,130,0.55)');
  disc(ctx, mx + h * 0.025, my + h * 0.03, h * 0.011, 'rgba(190,170,130,0.55)');
  // Searchlights.
  const baseY = h * 0.86;
  for (const [bx, tilt] of [[w * 0.2, -0.5], [w * 0.34, -0.28]]) {
    const grad = ctx.createLinearGradient(bx, baseY, bx + Math.sin(tilt) * h * 0.9, baseY - Math.cos(tilt) * h * 0.9);
    grad.addColorStop(0, 'rgba(255, 244, 200, 0.34)');
    grad.addColorStop(1, 'rgba(255, 244, 200, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(bx, baseY);
    ctx.lineTo(bx + Math.sin(tilt) * h * 0.9 - w * 0.03, baseY - Math.cos(tilt) * h * 0.9);
    ctx.lineTo(bx + Math.sin(tilt) * h * 0.9 + w * 0.03, baseY - Math.cos(tilt) * h * 0.9);
    ctx.closePath();
    ctx.fill();
  }
  // Towers with lit windows.
  const towers = [
    [0.02, 0.62, 0.16, 0.62], [0.2, 0.5, 0.14, 0.74], [0.36, 0.58, 0.18, 0.66],
    [0.56, 0.44, 0.13, 0.8], [0.71, 0.56, 0.15, 0.68], [0.88, 0.48, 0.12, 0.76],
  ];
  for (const [fx, fh, fw, lit] of towers) {
    const x = w * fx;
    const tw = w * fw;
    const th = h * fh;
    towerBlock(ctx, x, baseY, tw, th, '#0b1026');
    ctx.fillStyle = '#0b1026';
    ctx.fillRect(x - tw * 0.06, baseY - th - h * 0.02, tw * 1.12, h * 0.02);
    litWindows(ctx, rand, x, baseY, tw, th, 5, Math.max(6, Math.floor(th / (h * 0.045))), lit);
  }
  // Rooftop: water tower + antenna.
  ctx.fillStyle = '#0b1026';
  ctx.fillRect(0, baseY, w, h - baseY);
  const wx = w * 0.6;
  ctx.fillRect(wx, baseY - h * 0.1, w * 0.05, h * 0.1);
  ctx.beginPath();
  ctx.moveTo(wx - w * 0.008, baseY - h * 0.1);
  ctx.lineTo(wx + w * 0.025, baseY - h * 0.14);
  ctx.lineTo(wx + w * 0.058, baseY - h * 0.1);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#0b1026';
  ctx.lineWidth = Math.max(3, w * 0.005);
  ctx.beginPath();
  ctx.moveTo(w * 0.72, baseY);
  ctx.lineTo(w * 0.72, baseY - h * 0.16);
  ctx.stroke();
  disc(ctx, w * 0.72, baseY - h * 0.17, Math.max(3, w * 0.006), '#ff5e62');
  halftone(ctx, rand, 0, h * 0.4, w, h * 0.12, 'rgba(255, 94, 98, 0.25)', Math.max(2, w * 0.005));
}

// ---- Scene 3: Getaway --------------------------------------------------
function paintGetaway(ctx, w, h) {
  const rand = seeded(99173);
  sky(ctx, w, h, [[0, '#ff9a5a'], [0.45, '#ff5e62'], [0.7, '#8338ec'], [1, '#1d1b3a']]);
  slitSun(ctx, w * 0.68, h * 0.34, h * 0.17, '#ffe9a8', '#ff5e62');
  gulls(ctx, rand, w, h, 5, h * 0.06, h * 0.22, 'rgba(20,16,40,0.8)');
  // Far skyline.
  ctx.fillStyle = '#2a1b4d';
  let x = -w * 0.02;
  while (x < w) {
    const bw = w * (0.06 + rand() * 0.09);
    const bh = h * (0.1 + rand() * 0.16);
    ctx.fillRect(x, h * 0.62 - bh, bw, bh);
    x += bw + w * 0.01;
  }
  // Road in perspective.
  const horizon = h * 0.62;
  ctx.fillStyle = '#171226';
  ctx.beginPath();
  ctx.moveTo(w * 0.42, horizon);
  ctx.lineTo(w * 0.58, horizon);
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.closePath();
  ctx.fill();
  // Lane dashes.
  ctx.fillStyle = '#ffd166';
  for (let i = 0; i < 7; i++) {
    const t = i / 7;
    const y = horizon + (h - horizon) * t * t;
    const next = horizon + (h - horizon) * ((i + 1) / 7) * ((i + 1) / 7);
    const cx = w * 0.5;
    const spread = w * 0.02 + t * w * 0.05;
    ctx.fillRect(cx - spread / 2, y, spread, Math.max(2, (next - y) * 0.45));
  }
  // Headlight cones from the car.
  const carX = w * 0.5;
  const carY = h * 0.86;
  for (const dir of [-1, 1]) {
    const grad = ctx.createLinearGradient(carX + dir * w * 0.05, carY, carX + dir * w * 0.34, carY + h * 0.06);
    grad.addColorStop(0, 'rgba(255, 240, 180, 0.5)');
    grad.addColorStop(1, 'rgba(255, 240, 180, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(carX + dir * w * 0.05, carY - h * 0.01);
    ctx.lineTo(carX + dir * w * 0.34, carY + h * 0.03);
    ctx.lineTo(carX + dir * w * 0.34, carY + h * 0.08);
    ctx.lineTo(carX + dir * w * 0.05, carY + h * 0.015);
    ctx.closePath();
    ctx.fill();
  }
  // The getaway car, side view.
  ctx.fillStyle = '#0d0a1a';
  ctx.beginPath();
  ctx.moveTo(carX - w * 0.17, carY + h * 0.045);
  ctx.lineTo(carX - w * 0.17, carY + h * 0.005);
  ctx.lineTo(carX - w * 0.1, carY - h * 0.01);
  ctx.lineTo(carX - w * 0.04, carY - h * 0.045);
  ctx.lineTo(carX + w * 0.07, carY - h * 0.045);
  ctx.lineTo(carX + w * 0.13, carY - h * 0.008);
  ctx.lineTo(carX + w * 0.17, carY + h * 0.005);
  ctx.lineTo(carX + w * 0.17, carY + h * 0.045);
  ctx.closePath();
  ctx.fill();
  // Windows, wheels, neon underglow.
  ctx.fillStyle = '#7ee8fa';
  ctx.beginPath();
  ctx.moveTo(carX - w * 0.085, carY - h * 0.012);
  ctx.lineTo(carX - w * 0.045, carY - h * 0.038);
  ctx.lineTo(carX + w * 0.06, carY - h * 0.038);
  ctx.lineTo(carX + w * 0.105, carY - h * 0.012);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#ff2e88';
  ctx.fillRect(carX - w * 0.17, carY + h * 0.045, w * 0.34, h * 0.008);
  for (const wx of [carX - w * 0.105, carX + w * 0.105]) {
    disc(ctx, wx, carY + h * 0.045, h * 0.028, '#0d0a1a');
    ctx.strokeStyle = '#e8e8e8';
    ctx.lineWidth = Math.max(2, h * 0.004);
    ctx.beginPath();
    ctx.arc(wx, carY + h * 0.045, h * 0.014, 0, Math.PI * 2);
    ctx.stroke();
  }
  // Speed lines.
  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.lineWidth = Math.max(2, h * 0.004);
  for (let i = 0; i < 9; i++) {
    const y = h * (0.68 + rand() * 0.2);
    const x0 = rand() * w * 0.3;
    const len = w * (0.08 + rand() * 0.16);
    ctx.beginPath();
    ctx.moveTo(x0, y);
    ctx.lineTo(x0 + len, y);
    ctx.stroke();
  }
  // Palms framing the road.
  palm(ctx, w * 0.07, h * 0.99, h * 0.3, '#0d0a1a');
  palm(ctx, w * 0.93, h * 0.99, h * 0.24, '#0d0a1a');
  // Neon billboard.
  ctx.fillStyle = '#ff2e88';
  ctx.fillRect(w * 0.78, h * 0.42, w * 0.16, h * 0.09);
  ctx.strokeStyle = '#ffe9a8';
  ctx.lineWidth = Math.max(2, w * 0.003);
  ctx.strokeRect(w * 0.79, h * 0.435, w * 0.14, h * 0.06);
  ctx.fillStyle = '#ffe9a8';
  ctx.font = `900 ${Math.round(h * 0.035)}px "Arial Black", "Noto Sans Display", "Liberation Sans", Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('VICE CITY', w * 0.86, h * 0.465);
}

// Paint one scene onto any canvas (its own size is used).
export function paintScene(canvas, id) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  if (id === 'dockside') paintDockside(ctx, w, h);
  else if (id === 'downtown') paintDowntown(ctx, w, h);
  else if (id === 'getaway') paintGetaway(ctx, w, h);
  else paintDockside(ctx, w, h);
  return canvas;
}

// A fresh canvas holding one scene, at the requested pixel size.
export function sceneCanvas(id, w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return paintScene(c, id);
}
