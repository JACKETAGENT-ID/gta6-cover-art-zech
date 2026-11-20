// Loading Screen Comic cover renderer: diagonal comic panels with thick black
// outlines, halftone dots, a red starburst sticker, extra-bold caption lettering
// and a loading bar — drawn entirely on canvas, no network, no game artwork.

export const SIZES = {
  '1080x1080': [1080, 1080],
  '1080x1350': [1080, 1350],
  '1920x1080': [1920, 1080],
};

export const LAYOUTS = { duo: 2, triple: 3, solo: 1 };

export const SAMPLE_FILES = { A: 'boulevard.jpg', B: 'pier.jpg', C: 'rooftop.jpg' };

const YELLOW = '#ffd400';
const RED = '#e63329';
const BLACK = '#111111';
const WHITE = '#ffffff';

/** Fresh default state: three sample photos, duo layout, square size. */
export function defaultState() {
  return {
    size: '1080x1080',
    layout: 'duo',
    caption: 'SUNSET HEIST',
    tagline: 'VICE CITY • 2026',
    loading: 87,
    halftone: true,
    photos: { A: null, B: null, C: null },
    panels: [
      { photo: 'A', zoom: 1, ox: 0, oy: 0 },
      { photo: 'B', zoom: 1, ox: 0, oy: 0 },
      { photo: 'C', zoom: 1, ox: 0, oy: 0 },
    ],
  };
}

/** Diagonal panel polygons per layout, as fractions of width/height. */
function panelPolygons(layout) {
  if (layout === 'solo') return [[[0, 0], [1, 0], [1, 1], [0, 1]]];
  if (layout === 'triple') {
    return [
      [[0, 0], [1, 0], [0.8, 0.38], [0, 0.48]],
      [[0, 0.52], [0.84, 0.42], [1, 0.44], [1, 0.8], [0, 0.9]],
      [[0, 0.94], [1, 0.84], [1, 1], [0, 1]],
    ];
  }
  return [
    [[0, 0], [1, 0], [0.88, 0.58], [0, 0.72]],
    [[0, 0.76], [0.92, 0.62], [1, 0.64], [1, 1], [0, 1]],
  ];
}

/** Bounding box of a polygon, in pixels. */
function polyBox(poly, w, h) {
  const xs = poly.map((p) => p[0] * w);
  const ys = poly.map((p) => p[1] * h);
  const x0 = Math.min(...xs);
  const y0 = Math.min(...ys);
  return { x: x0, y: y0, w: Math.max(...xs) - x0, h: Math.max(...ys) - y0 };
}

function tracePoly(ctx, poly, w, h) {
  ctx.beginPath();
  ctx.moveTo(poly[0][0] * w, poly[0][1] * h);
  for (let i = 1; i < poly.length; i++) ctx.lineTo(poly[i][0] * w, poly[i][1] * h);
  ctx.closePath();
}

/** Draws one photo cover-fit inside a panel polygon, with zoom and pan. */
function drawPanelPhoto(ctx, img, poly, transform, w, h) {
  const box = polyBox(poly, w, h);
  const base = Math.max(box.w / img.naturalWidth, box.h / img.naturalHeight);
  const scale = base * transform.zoom;
  const pw = img.naturalWidth * scale;
  const ph = img.naturalHeight * scale;
  const cx = box.x + box.w / 2 + transform.ox * box.w;
  const cy = box.y + box.h / 2 + transform.oy * box.h;
  ctx.save();
  tracePoly(ctx, poly, w, h);
  ctx.clip();
  ctx.drawImage(img, cx - pw / 2, cy - ph / 2, pw, ph);
  // Warm comic grade: a soft red wash rising from the panel's foot.
  const wash = ctx.createLinearGradient(0, box.y + box.h * 0.55, 0, box.y + box.h);
  wash.addColorStop(0, 'rgba(230, 51, 41, 0)');
  wash.addColorStop(1, 'rgba(230, 51, 41, 0.22)');
  ctx.fillStyle = wash;
  ctx.fillRect(box.x, box.y, box.w, box.h);
  ctx.restore();
}

/** Halftone dots inside a diagonal band, radius growing toward the corner. */
function drawHalftone(ctx, w, h) {
  const band = [[0.62, 0], [1, 0], [1, 0.34], [0.78, 0.42]];
  ctx.save();
  tracePoly(ctx, band, w, h);
  ctx.clip();
  const gap = Math.max(18, w * 0.022);
  for (let y = 0; y < h * 0.42; y += gap) {
    for (let x = w * 0.6; x < w; x += gap) {
      const t = (x / w + (h * 0.42 - y) / h) / 1.6;
      const r = Math.max(1.5, gap * 0.32 * (0.4 + t));
      ctx.fillStyle = 'rgba(17, 17, 17, 0.85)';
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

/** Diagonal speed lines in the top-left corner. */
function drawSpeedLines(ctx, w, h) {
  ctx.save();
  ctx.strokeStyle = BLACK;
  ctx.lineCap = 'round';
  const n = 5;
  for (let i = 0; i < n; i++) {
    const y = h * (0.05 + i * 0.028);
    const len = w * (0.1 + i * 0.012);
    ctx.lineWidth = Math.max(5, w * 0.006);
    ctx.beginPath();
    ctx.moveTo(w * 0.04, y);
    ctx.lineTo(w * 0.04 + len, y - h * 0.012);
    ctx.stroke();
  }
  ctx.restore();
}

/** Red starburst sticker with a word in it. */
function drawStarburst(ctx, w, h, word) {
  const cx = w * 0.85;
  const cy = h * 0.13;
  const r = w * 0.085;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-0.12);
  ctx.beginPath();
  const spikes = 12;
  for (let i = 0; i < spikes * 2; i++) {
    const a = (Math.PI * i) / spikes - Math.PI / 2;
    const rad = i % 2 === 0 ? r : r * 0.72;
    const x = Math.cos(a) * rad;
    const y = Math.sin(a) * rad;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = RED;
  ctx.fill();
  ctx.lineWidth = Math.max(5, w * 0.007);
  ctx.strokeStyle = BLACK;
  ctx.lineJoin = 'round';
  ctx.stroke();
  ctx.fillStyle = WHITE;
  ctx.font = `${Math.round(r * 0.52)}px Bangers, 'Anton', sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(word, 0, r * 0.05);
  ctx.restore();
}

/** Wraps text to at most two lines that fit maxWidth. */
function wrapCaption(ctx, text, maxWidth) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines = [];
  let line = '';
  for (const word of words) {
    const next = line ? line + ' ' + word : word;
    if (ctx.measureText(next).width <= maxWidth || !line) line = next;
    else {
      lines.push(line);
      line = word;
    }
    if (lines.length === 2) break;
  }
  if (line && lines.length < 2) lines.push(line);
  return lines;
}

/** The big caption: yellow fill, thick black outline, red drop shadow. */
function drawCaption(ctx, caption, w, h) {
  const text = (caption || 'YOUR STORY').trim().toUpperCase();
  let size = Math.round(w * 0.145);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.lineJoin = 'round';
  let lines = [];
  while (size > 28) {
    ctx.font = `${size}px Bangers, 'Anton', sans-serif`;
    lines = wrapCaption(ctx, text, w * 0.8);
    const widest = Math.max(...lines.map((l) => ctx.measureText(l).width));
    // Leave room for the thick outline and the slight tilt.
    if (lines.length <= 2 && widest + size * 0.4 <= w * 0.88) break;
    size -= 5;
  }
  const lineH = size * 0.92;
  const blockH = lines.length * lineH;
  const stripTop = h - h * 0.062;
  const blockTop = stripTop - h * 0.015 - blockH;
  ctx.save();
  ctx.translate(w / 2, blockTop + blockH / 2);
  ctx.rotate(-0.045);
  ctx.translate(-w / 2, -(blockTop + blockH / 2));
  lines.forEach((line, i) => {
    const y = blockTop + i * lineH + lineH * 0.78;
    ctx.font = `${size}px Bangers, 'Anton', sans-serif`;
    ctx.fillStyle = RED;
    ctx.fillText(line, w / 2 + w * 0.012, y + size * 0.1);
    ctx.lineWidth = Math.max(6, size * 0.17);
    ctx.strokeStyle = BLACK;
    ctx.strokeText(line, w / 2, y);
    ctx.fillStyle = YELLOW;
    ctx.fillText(line, w / 2, y);
  });
  ctx.restore();
}

/** Bottom black strip: tagline left, loading bar right. */
function drawFooter(ctx, tagline, loading, w, h) {
  const stripH = h * 0.062;
  const y = h - stripH;
  ctx.fillStyle = BLACK;
  ctx.fillRect(0, y, w, stripH);
  ctx.fillStyle = WHITE;
  ctx.font = `${Math.round(stripH * 0.42)}px Anton, sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText((tagline || '').trim().toUpperCase(), w * 0.03, y + stripH / 2);
  const label = `LOADING ${loading}%`;
  ctx.font = `${Math.round(stripH * 0.4)}px Anton, sans-serif`;
  const labelW = ctx.measureText(label).width;
  const barW = w * 0.16;
  const barH = stripH * 0.42;
  const barX = w - w * 0.03 - barW;
  const barY = y + (stripH - barH) / 2;
  ctx.strokeStyle = WHITE;
  ctx.lineWidth = Math.max(2, stripH * 0.05);
  ctx.strokeRect(barX, barY, barW, barH);
  ctx.fillStyle = YELLOW;
  ctx.fillRect(barX + 2, barY + 2, (barW - 4) * (loading / 100), barH - 4);
  ctx.fillStyle = WHITE;
  ctx.textAlign = 'right';
  ctx.fillText(label, barX - w * 0.015, y + stripH / 2);
  void labelW;
}

/**
 * Draws the whole cover onto `canvas` (which must already be sized to the
 * export size). `state` holds photos (Image objects or null), per-panel
 * transforms, caption, tagline, layout and size.
 */
export function drawCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const outline = Math.max(7, w * 0.013);
  ctx.fillStyle = YELLOW;
  ctx.fillRect(0, 0, w, h);
  const polys = panelPolygons(state.layout);
  const count = LAYOUTS[state.layout];
  for (let i = 0; i < count; i++) {
    const panel = state.panels[i];
    const img = panel ? state.photos[panel.photo] : null;
    if (img) {
      drawPanelPhoto(ctx, img, polys[i], panel, w, h);
    } else {
      ctx.save();
      tracePoly(ctx, polys[i], w, h);
      ctx.fillStyle = '#2b2b2b';
      ctx.fill();
      ctx.restore();
    }
    ctx.save();
    tracePoly(ctx, polys[i], w, h);
    ctx.lineWidth = outline;
    ctx.strokeStyle = BLACK;
    ctx.lineJoin = 'miter';
    ctx.stroke();
    ctx.restore();
  }
  if (state.halftone) drawHalftone(ctx, w, h);
  drawSpeedLines(ctx, w, h);
  drawStarburst(ctx, w, h, 'NEW!');
  drawCaption(ctx, state.caption, w, h);
  drawFooter(ctx, state.tagline, state.loading, w, h);
}
