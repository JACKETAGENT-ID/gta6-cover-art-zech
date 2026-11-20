// Draws the cover: photo panels in a comic layout, a colour grade, a
// halftone wash, and the caption band with the big title lettering.
// Everything is drawn with the canvas API; the only typefaces are the
// system's own stacks, so the app never downloads a font.

export const DISPLAY_FONT = '"Arial Black", "Noto Sans Display", "Liberation Sans", Arial, sans-serif';
export const LABEL_FONT = '"Arial Narrow", "Liberation Sans", Arial, sans-serif';

export const LAYOUTS = ['triptych', 'stack', 'hero', 'zigzag'];
export const GRADES = ['sunset', 'vice', 'noir', 'gold'];
export const SIZES = {
  square: { w: 1080, h: 1080, label: 'Square 1080 × 1080' },
  portrait: { w: 1080, h: 1350, label: 'Portrait 1080 × 1350' },
  wide: { w: 1920, h: 1080, label: 'Wide 1920 × 1080' },
};

const GRADE_TINTS = {
  sunset: ['rgba(255, 94, 60, 0.28)', 'rgba(190, 30, 120, 0.34)'],
  vice: ['rgba(0, 220, 200, 0.2)', 'rgba(255, 46, 136, 0.3)'],
  noir: ['rgba(20, 20, 30, 0.42)', 'rgba(255, 210, 90, 0.1)'],
  gold: ['rgba(255, 170, 40, 0.3)', 'rgba(120, 60, 0, 0.28)'],
};

/** Splits the canvas into panel rects for a layout, each with a slant. */
function panelRects(layout, w, h) {
  const artH = h * 0.78;
  const gutter = Math.max(6, w * 0.008);
  if (layout === 'stack') {
    const bh = (artH - gutter * 2) / 3;
    return [0, 1, 2].map((i) => ({ x: 0, y: i * (bh + gutter), w, h: bh, slant: 0 }));
  }
  if (layout === 'hero') {
    const left = w * 0.62 - gutter / 2;
    const right = w - left - gutter;
    const rh = (artH - gutter) / 2;
    return [
      { x: 0, y: 0, w: left, h: artH, slant: 0 },
      { x: left + gutter, y: 0, w: right, h: rh, slant: 0 },
      { x: left + gutter, y: rh + gutter, w: right, h: rh, slant: 0 },
    ];
  }
  if (layout === 'zigzag') {
    const bw = (w - gutter * 2) / 3;
    const lean = w * 0.05;
    return [0, 1, 2].map((i) => ({
      x: i * (bw + gutter),
      y: i === 1 ? h * 0.05 : 0,
      w: bw,
      h: artH - (i === 1 ? h * 0.05 : 0),
      slant: i === 0 ? lean : i === 2 ? -lean : 0,
    }));
  }
  const bw = (w - gutter * 2) / 3;
  const lean = w * 0.06;
  return [0, 1, 2].map((i) => ({
    x: i * (bw + gutter),
    y: 0,
    w: bw,
    h: artH,
    slant: i === 0 ? lean : i === 2 ? -lean : 0,
  }));
}

/** The clip path of one panel: a rectangle sheared by its slant. */
function tracePanel(ctx, r) {
  ctx.beginPath();
  ctx.moveTo(r.x + r.slant, r.y);
  ctx.lineTo(r.x + r.w + r.slant, r.y);
  ctx.lineTo(r.x + r.w - r.slant, r.y + r.h);
  ctx.lineTo(r.x - r.slant, r.y + r.h);
  ctx.closePath();
}

/** Draws an image or canvas into a rect, cover-fit, with zoom and pan. */
function drawFitted(ctx, photo, r, zoom, panX, panY) {
  if (!photo) return;
  const iw = photo.naturalWidth || photo.width;
  const ih = photo.naturalHeight || photo.height;
  if (!iw || !ih) return;
  const scale = Math.max(r.w / iw, r.h / ih) * zoom;
  const dw = iw * scale;
  const dh = ih * scale;
  const dx = r.x + (r.w - dw) / 2 + panX * r.w * 0.3;
  const dy = r.y + (r.h - dh) / 2 + panY * r.h * 0.3;
  ctx.drawImage(photo, dx, dy, dw, dh);
}

/** A halftone dot field fading across the top corner of the art area. */
function halftone(ctx, w, h, colour) {
  const step = Math.max(10, w * 0.014);
  ctx.fillStyle = colour;
  for (let y = step / 2; y < h * 0.3; y += step) {
    for (let x = step / 2; x < w * 0.42; x += step) {
      const fade = 1 - (x / (w * 0.42)) * 0.7 - (y / (h * 0.3)) * 0.5;
      if (fade <= 0.05) continue;
      const r = step * 0.22 * fade + 0.6;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

/** A jagged starburst badge, e.g. for the year, in the top corner. */
function burst(ctx, cx, cy, r, points, colour) {
  ctx.fillStyle = colour;
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const a = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
    const rr = i % 2 === 0 ? r : r * 0.62;
    const px = cx + Math.cos(a) * rr;
    const py = cy + Math.sin(a) * rr;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#111';
  ctx.lineWidth = Math.max(3, r * 0.08);
  ctx.stroke();
}

/** Fits a title to one line inside maxWidth, shrinking the size as needed. */
function fitTitle(ctx, text, maxWidth, startSize) {
  let size = startSize;
  ctx.font = `900 ${size}px ${DISPLAY_FONT}`;
  while (size > 18 && ctx.measureText(text).width > maxWidth) {
    size -= 4;
    ctx.font = `900 ${size}px ${DISPLAY_FONT}`;
  }
  return size;
}

/**
 * Draws the whole cover onto `canvas`.
 * photos: an array of three images/canvases (or nulls), one per panel.
 * opts: { layout, grade, size, kicker, title, place, zooms, pans }.
 */
export function drawCoverArt(canvas, photos, opts) {
  const w = canvas.width;
  const h = canvas.height;
  const ctx = canvas.getContext('2d');
  const layout = LAYOUTS.includes(opts.layout) ? opts.layout : 'triptych';
  const grade = GRADES.includes(opts.grade) ? opts.grade : 'sunset';
  const zooms = opts.zooms ?? [1, 1, 1];
  const pans = opts.pans ?? [[0, 0], [0, 0], [0, 0]];
  const artH = h * 0.78;

  ctx.fillStyle = '#0d0518';
  ctx.fillRect(0, 0, w, h);

  const rects = panelRects(layout, w, h);
  rects.forEach((r, i) => {
    ctx.save();
    tracePanel(ctx, r);
    ctx.clip();
    ctx.fillStyle = '#241536';
    ctx.fillRect(r.x - w * 0.06, r.y, r.w + w * 0.12, r.h);
    drawFitted(ctx, photos[i], r, zooms[i] ?? 1, pans[i]?.[0] ?? 0, pans[i]?.[1] ?? 0);
    const [top, bottom] = GRADE_TINTS[grade];
    const tint = ctx.createLinearGradient(0, r.y, 0, r.y + r.h);
    tint.addColorStop(0, top);
    tint.addColorStop(1, bottom);
    ctx.fillStyle = tint;
    ctx.fillRect(r.x - w * 0.06, r.y, r.w + w * 0.12, r.h);
    ctx.restore();
    ctx.save();
    tracePanel(ctx, r);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = Math.max(4, w * 0.006);
    ctx.stroke();
    ctx.strokeStyle = '#111111';
    ctx.lineWidth = Math.max(2, w * 0.003);
    ctx.stroke();
    ctx.restore();
  });

  ctx.save();
  ctx.globalAlpha = 0.5;
  halftone(ctx, w, h, '#ffffff');
  ctx.restore();

  const bandY = artH;
  const bandH = h - artH;
  const band = ctx.createLinearGradient(0, bandY, 0, h);
  band.addColorStop(0, '#ffd166');
  band.addColorStop(1, '#ff5e62');
  ctx.fillStyle = band;
  ctx.fillRect(0, bandY, w, bandH);
  ctx.fillStyle = '#111111';
  ctx.fillRect(0, bandY, w, Math.max(4, h * 0.006));

  const pad = w * 0.045;
  const kicker = (opts.kicker ?? '').trim().toUpperCase();
  const title = (opts.title ?? '').trim().toUpperCase();
  const place = (opts.place ?? '').trim().toUpperCase();

  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  if (kicker) {
    const ks = Math.max(14, h * 0.026);
    ctx.font = `700 ${ks}px ${LABEL_FONT}`;
    ctx.fillStyle = '#7a1030';
    const spaced = kicker.split('').join('  ');
    ctx.fillText(spaced, pad, bandY + bandH * 0.3);
  }
  if (title) {
    const size = fitTitle(ctx, title, w - pad * 2, h * 0.085);
    ctx.save();
    ctx.translate(pad, bandY + bandH * 0.72);
    ctx.transform(1, 0, -0.06, 1, 0, 0);
    ctx.font = `900 ${size}px ${DISPLAY_FONT}`;
    ctx.lineWidth = Math.max(3, size * 0.09);
    ctx.strokeStyle = '#111111';
    ctx.strokeText(title, 0, 0);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(title, 0, 0);
    ctx.restore();
  }
  if (place) {
    const ps = Math.max(13, h * 0.022);
    ctx.font = `700 ${ps}px ${LABEL_FONT}`;
    ctx.fillStyle = '#5c0d24';
    ctx.textAlign = 'right';
    ctx.fillText(place, w - pad, bandY + bandH * 0.3);
    ctx.textAlign = 'left';
  }

  const br = Math.max(26, w * 0.042);
  burst(ctx, w - br * 1.15, br * 1.15, br, 12, '#ffe259');
  ctx.fillStyle = '#111111';
  ctx.font = `900 ${Math.round(br * 0.34)}px ${DISPLAY_FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('2026', w - br * 1.15, br * 1.18);
  ctx.textBaseline = 'alphabetic';
}
