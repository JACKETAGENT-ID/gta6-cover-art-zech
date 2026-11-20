// The cover renderer: turns photo slots, a layout, a grade and a
// caption into one GTA-style poster on a canvas, ready to export as a
// PNG. Panels are clipped polygons with white gutters and hard black
// outlines, the comic-book look this maker is built around. Nothing
// here touches the network; every pixel comes from the photos the
// user loaded (or the runtime-drawn scenes) plus code below.

export const SIZES = [
  { id: 'square', label: 'Square · 1080 × 1080', w: 1080, h: 1080 },
  { id: 'portrait', label: 'Portrait · 1080 × 1350', w: 1080, h: 1350 },
  { id: 'wide', label: 'Wide · 1920 × 1080', w: 1920, h: 1080 },
];

export const LAYOUTS = [
  { id: 'stack', label: 'Stack', hint: 'Three diagonal panels' },
  { id: 'hero', label: 'Hero', hint: 'One big panel, two small' },
  { id: 'strip', label: 'Strip', hint: 'Three horizontal bands' },
  { id: 'solo', label: 'Solo', hint: 'One photo, full bleed' },
];

export const GRADES = [
  { id: 'sunset', label: 'Sunset', hint: 'Warm Vice City dusk' },
  { id: 'noir', label: 'Noir', hint: 'Hard shadows, cold night' },
  { id: 'acid', label: 'Acid', hint: 'Teal and magenta pop' },
  { id: 'mono', label: 'Mono', hint: 'Newsprint black and white' },
];

const DISPLAY = '"Arial Black", "Noto Sans Display", "Liberation Sans", Arial, sans-serif';
const SANS = '"Noto Sans Display", "Liberation Sans", Arial, sans-serif';

function sizeById(id) {
  return SIZES.find((s) => s.id === id) || SIZES[0];
}

// Shrink a bold display line until it fits, then draw it once.
function drawFitted(ctx, text, cx, y, maxW, px, font, fill, stroke) {
  let size = px;
  ctx.font = `900 ${size}px ${font}`;
  while (size > 18 && ctx.measureText(text).width > maxW) {
    size -= 2;
    ctx.font = `900 ${size}px ${font}`;
  }
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  if (stroke) {
    ctx.lineWidth = Math.max(2, size * 0.09);
    ctx.strokeStyle = stroke;
    ctx.lineJoin = 'round';
    ctx.strokeText(text, cx, y);
  }
  ctx.fillStyle = fill;
  ctx.fillText(text, cx, y);
  return size;
}

// Draw one photo into a rectangle, cover-fit, with the slot's zoom and
// pan applied. A clip path (panel shape) may be passed in. `photo` is
// either a slot object ({ image, zoom, panX, panY }) or a bare image /
// canvas, as the screenshot scenes pass.
function paintPhoto(ctx, photo, x, y, w, h, clip) {
  const img = photo && (photo.image || photo);
  if (!img || !(img.naturalWidth || img.width)) {
    ctx.fillStyle = '#2b1055';
    ctx.fillRect(x, y, w, h);
    return;
  }
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const zoom = ((photo && photo.zoom) || 1) * Math.max(w / iw, h / ih);
  const dw = iw * zoom;
  const dh = ih * zoom;
  const dx = x + (w - dw) / 2 + ((photo && photo.panX) || 0) * w * 0.25;
  const dy = y + (h - dh) / 2 + ((photo && photo.panY) || 0) * h * 0.25;
  ctx.save();
  if (clip) {
    ctx.beginPath();
    clip(ctx);
    ctx.clip();
  } else {
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();
  }
  ctx.drawImage(img, dx, dy, dw, dh);
  ctx.restore();
}

// A slanted rectangle: corners pushed sideways by `slant` pixels.
function slantRect(x, y, w, h, slant) {
  return (ctx) => {
    ctx.moveTo(x + slant, y);
    ctx.lineTo(x + w + slant, y);
    ctx.lineTo(x + w - slant, y + h);
    ctx.lineTo(x - slant, y + h);
    ctx.closePath();
  };
}

function outline(ctx, clip, width, color) {
  ctx.save();
  ctx.beginPath();
  clip(ctx);
  ctx.lineWidth = width;
  ctx.strokeStyle = color;
  ctx.stroke();
  ctx.restore();
}

// Halftone dots across a band, for the newsprint feel.
function dots(ctx, x, y, w, h, color, gap, maxR) {
  ctx.fillStyle = color;
  for (let yy = y + gap / 2; yy < y + h; yy += gap) {
    for (let xx = x + gap / 2; xx < x + w; xx += gap) {
      const r = maxR * (0.4 + 0.6 * ((yy - y) / h));
      ctx.beginPath();
      ctx.arc(xx, yy, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

// Panel rectangles for each layout, inside the photo area. Every panel
// also carries its slant, so the gutters run diagonally.
function panelBoxes(layout, area) {
  const { x, y, w, h } = area;
  const slant = Math.round(w * 0.035);
  if (layout === 'solo') {
    return [{ x, y, w, h, slant: 0 }];
  }
  if (layout === 'hero') {
    const big = Math.round(w * 0.58);
    const gap = Math.round(w * 0.018);
    return [
      { x, y, w: big, h, slant },
      { x: x + big + gap, y, w: w - big - gap, h: Math.round(h * 0.485), slant },
      { x: x + big + gap, y: y + Math.round(h * 0.515), w: w - big - gap, h: h - Math.round(h * 0.515), slant },
    ];
  }
  if (layout === 'strip') {
    const third = Math.round(h / 3);
    const gap = Math.round(h * 0.02);
    return [
      { x, y, w, h: third, slant },
      { x, y: y + third + gap, w, h: third, slant },
      { x, y: y + (third + gap) * 2, w, h: h - (third + gap) * 2, slant },
    ];
  }
  // stack: three diagonal columns.
  const third = Math.round(w / 3);
  const gap = Math.round(w * 0.018);
  return [
    { x, y, w: third, h, slant },
    { x: x + third + gap, y, w: third, h, slant },
    { x: x + (third + gap) * 2, y, w: w - (third + gap) * 2, h, slant },
  ];
}

// A colour grade is a translucent wash plus, for some grades, a second
// pass over the whole photo area.
function gradeWash(ctx, grade, area) {
  const { x, y, w, h } = area;
  if (grade === 'sunset') {
    const g = ctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, 'rgba(255, 94, 98, 0.10)');
    g.addColorStop(0.6, 'rgba(255, 154, 90, 0.12)');
    g.addColorStop(1, 'rgba(131, 56, 236, 0.16)');
    ctx.fillStyle = g;
    ctx.fillRect(x, y, w, h);
  } else if (grade === 'noir') {
    const g = ctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, 'rgba(10, 14, 40, 0.12)');
    g.addColorStop(1, 'rgba(0, 0, 0, 0.34)');
    ctx.fillStyle = g;
    ctx.fillRect(x, y, w, h);
  } else if (grade === 'acid') {
    ctx.fillStyle = 'rgba(46, 196, 182, 0.10)';
    ctx.fillRect(x, y, w, h);
    const g = ctx.createLinearGradient(x, 0, x + w, 0);
    g.addColorStop(0, 'rgba(255, 46, 136, 0.10)');
    g.addColorStop(1, 'rgba(255, 46, 136, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(x, y, w, h);
  }
  // Mono is painted by the caller with a filter; the wash stays clear.
}

function captionBand(ctx, area, kicker, title, place, grade) {
  const { x, y, w, h } = area;
  const band = grade === 'mono' ? '#111111' : '#14082b';
  ctx.fillStyle = band;
  ctx.fillRect(x, y, w, h);
  // A thin neon rule above the band.
  ctx.fillStyle = grade === 'acid' ? '#2ec4b6' : grade === 'mono' ? '#ffffff' : '#ff2e88';
  ctx.fillRect(x, y, w, Math.max(4, h * 0.03));
  const cx = x + w / 2;
  const kick = (kicker || '').toUpperCase();
  if (kick) {
    ctx.font = `700 ${Math.round(h * 0.16)}px ${SANS}`;
    ctx.textAlign = 'center';
    ctx.fillStyle = grade === 'mono' ? '#dddddd' : '#ffd166';
    ctx.fillText(kick, cx, y + h * 0.24);
  }
  const titleText = (title || 'UNTITLED').toUpperCase();
  const titleY = y + h * (kick ? 0.62 : 0.52);
  drawFitted(ctx, titleText, cx, titleY, w * 0.92, Math.round(h * 0.42), DISPLAY, '#ffffff', '#000000');
  const placeText = (place || '').toUpperCase();
  if (placeText) {
    ctx.font = `700 ${Math.round(h * 0.13)}px ${SANS}`;
    ctx.textAlign = 'center';
    ctx.fillStyle = grade === 'mono' ? '#bbbbbb' : '#7ee8fa';
    ctx.fillText(placeText, cx, y + h * 0.88);
  }
}

// The main entry: draw the whole cover onto `canvas` (sized by the
// caller to the chosen export size).
export function drawCover(canvas, opts) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;
  const photos = opts.photos || [];
  const layout = opts.layout || 'stack';
  const grade = opts.grade || 'sunset';
  ctx.save();
  if (grade === 'mono') ctx.filter = 'grayscale(1) contrast(1.08)';
  // Paper: off-white comic page behind the panels.
  ctx.fillStyle = '#f4efe4';
  ctx.fillRect(0, 0, W, H);
  const bandH = Math.round(H * 0.22);
  const photoArea = { x: 0, y: 0, w: W, h: H - bandH };
  const boxes = panelBoxes(layout, photoArea);
  const gutter = Math.max(6, Math.round(W * 0.012));
  boxes.forEach((box, i) => {
    const photo = photos[i % Math.max(1, photos.length)] || null;
    const clip = slantRect(box.x, box.y, box.w, box.h, box.slant);
    paintPhoto(ctx, photo, box.x, box.y, box.w, box.h, clip);
    outline(ctx, clip, gutter * 0.5, '#ffffff');
    outline(ctx, clip, Math.max(3, gutter * 0.28), '#111111');
  });
  // Halftone speckle over the photo area's top corner.
  dots(ctx, W * 0.68, 0, W * 0.3, H * 0.1, 'rgba(255,255,255,0.35)', Math.max(10, W * 0.014), Math.max(2, W * 0.004));
  gradeWash(ctx, grade, photoArea);
  ctx.restore();
  captionBand(ctx, { x: 0, y: H - bandH, w: W, h: bandH }, opts.kicker, opts.title, opts.place, grade);
  return canvas;
}

export function coverSize(sizeId) {
  const s = sizeById(sizeId);
  return { w: s.w, h: s.h };
}
