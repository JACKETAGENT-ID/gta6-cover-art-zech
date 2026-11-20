// The cover renderer: three diagonal comic panels, a halftone pass,
// bold outlined lettering and a sunset or neon colour grade.
//
// A panel is { photo, scene, scale, ox, oy }:
//   photo — an HTMLImageElement, or null
//   scene — a key of SCENES from samples.js, used when photo is null
//   scale — zoom factor (1 = cover-fit), ox/oy — pan fractions (-0.5..0.5)

import { SCENES } from './samples.js';

export const GRADES = {
  gold: {
    tint: 'rgba(255, 122, 26, 0.14)',
    sun: '#ffd76a',
    accent: '#ffb400',
    paper: '#fff7e8',
    ink: '#14101c',
    bar: '#ff5e62',
  },
  neon: {
    tint: 'rgba(34, 230, 255, 0.12)',
    sun: '#ff2e88',
    accent: '#22e6ff',
    paper: '#eef6ff',
    ink: '#0b0616',
    bar: '#3b0f66',
  },
};

/** The three panel polygons for a cover of size w×h. Adjacent panels
 *  share one boundary edge, so the cover tiles with no gaps: in the
 *  Zigzag layout the two boundaries lean in opposite directions. */
export function panelShapes(w, h, layout) {
  const slant = layout === 'zigzag' ? w * 0.08 : 0;
  const third = h / 3;
  return [
    [[0, 0], [w, 0], [w, third - slant], [0, third + slant]],
    [[0, third + slant], [w, third - slant], [w, 2 * third + slant], [0, 2 * third - slant]],
    [[0, 2 * third - slant], [w, 2 * third + slant], [w, h], [0, h]],
  ];
}

function tracePoly(ctx, pts) {
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.closePath();
}

function drawPhotoCover(ctx, img, x, y, w, h, scale, ox, oy) {
  const fit = Math.max(w / img.width, h / img.height) * scale;
  const dw = img.width * fit;
  const dh = img.height * fit;
  const dx = x + (w - dw) / 2 + ox * w;
  const dy = y + (h - dh) / 2 + oy * h;
  ctx.drawImage(img, dx, dy, dw, dh);
}

function halftone(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  const step = Math.max(9, w * 0.018);
  for (let yy = y + step / 2; yy < y + h; yy += step) {
    for (let xx = x + step / 2; xx < x + w; xx += step) {
      const r = step * 0.16 * (1 - (yy - y) / h) + step * 0.05;
      ctx.beginPath();
      ctx.arc(xx, yy, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function outlinedText(ctx, text, cx, y, size, fill, stroke) {
  ctx.font = `900 ${size}px "Arial Black", "Helvetica Neue", Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.lineJoin = 'round';
  ctx.lineWidth = Math.max(2, size * 0.09);
  ctx.strokeStyle = stroke;
  ctx.strokeText(text, cx, y);
  ctx.fillStyle = fill;
  ctx.fillText(text, cx, y);
}

/**
 * Paint the whole cover onto ctx at size w×h.
 * opts: { panels, title, subtitle, grade, layout }
 */
export function drawCover(ctx, w, h, opts) {
  const grade = GRADES[opts.grade] ?? GRADES.gold;
  ctx.save();
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = grade.paper;
  ctx.fillRect(0, 0, w, h);

  const shapes = panelShapes(w, h, opts.layout);
  const gutter = Math.max(4, w * 0.006);

  shapes.forEach((pts, i) => {
    const p = opts.panels[i];
    const top = Math.min(...pts.map((q) => q[1]));
    const bottom = Math.max(...pts.map((q) => q[1]));
    const ph = bottom - top;
    ctx.save();
    tracePoly(ctx, pts);
    ctx.clip();
    if (p && p.photo) {
      drawPhotoCover(ctx, p.photo, 0, top, w, ph, p.scale || 1, p.ox || 0, p.oy || 0);
    } else if (p && p.scene && SCENES[p.scene]) {
      SCENES[p.scene].paint(ctx, 0, top, w, ph);
    } else {
      ctx.fillStyle = '#241a33';
      ctx.fillRect(0, top, w, ph);
    }
    // Grade tint + halftone corner on the outer panels.
    ctx.fillStyle = grade.tint;
    ctx.fillRect(0, top, w, ph);
    if (i !== 1) {
      ctx.save();
      ctx.globalAlpha = 0.5;
      halftone(ctx, w * 0.72, top + ph * 0.55, w * 0.28, ph * 0.45, grade.ink);
      ctx.restore();
    }
    ctx.restore();
    // Gutter: paper stripe, then a thin ink edge.
    ctx.strokeStyle = grade.paper;
    ctx.lineWidth = gutter;
    tracePoly(ctx, pts);
    ctx.stroke();
    ctx.strokeStyle = grade.ink;
    ctx.lineWidth = Math.max(1.5, w * 0.002);
    tracePoly(ctx, pts);
    ctx.stroke();
  });

  // Title, tilted a touch, top-left over the first panel.
  const titleSize = Math.round(w * 0.075);
  ctx.save();
  ctx.translate(w * 0.5, h * 0.115);
  ctx.rotate(-0.02);
  outlinedText(ctx, opts.title || 'UNTITLED', 0, 0, titleSize, grade.paper, grade.ink);
  ctx.restore();
  // Accent underline under the title.
  ctx.fillStyle = grade.accent;
  const tw = Math.min(w * 0.6, (opts.title || '').length * titleSize * 0.62);
  ctx.fillRect(w / 2 - tw / 2, h * 0.125, tw, Math.max(3, h * 0.008));

  // Subtitle bar along the bottom.
  const barH = Math.max(28, h * 0.055);
  ctx.fillStyle = grade.bar;
  ctx.fillRect(0, h - barH, w, barH);
  ctx.fillStyle = grade.paper;
  ctx.font = `700 ${Math.round(barH * 0.42)}px Arial, Helvetica, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(opts.subtitle || '', w / 2, h - barH / 2);

  ctx.restore();
}
