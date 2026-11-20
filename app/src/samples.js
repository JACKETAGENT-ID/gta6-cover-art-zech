// Three sample scenes, painted procedurally at runtime on a canvas.
// No image files, no network: every shape below is drawn with code.
// Each painter receives (ctx, x, y, w, h) — the panel rectangle to fill.

function sky(ctx, x, y, w, h, stops) {
  const g = ctx.createLinearGradient(x, y, x, y + h);
  stops.forEach(([at, color]) => g.addColorStop(at, color));
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, h);
}

function sunDisc(ctx, cx, cy, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
}

function block(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

function litWindows(ctx, x, y, w, h, cols, rows, lit) {
  const cw = w / cols;
  const ch = h / rows;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (((r * 7 + c * 3) % 5) < 3) {
        ctx.fillStyle = lit;
        ctx.fillRect(x + c * cw + cw * 0.2, y + r * ch + ch * 0.25, cw * 0.6, ch * 0.5);
      }
    }
  }
}

function gull(ctx, cx, cy, s) {
  ctx.strokeStyle = '#241a33';
  ctx.lineWidth = Math.max(1.5, s * 0.08);
  ctx.beginPath();
  ctx.moveTo(cx - s, cy);
  ctx.quadraticCurveTo(cx - s * 0.4, cy - s * 0.6, cx, cy);
  ctx.quadraticCurveTo(cx + s * 0.4, cy - s * 0.6, cx + s, cy);
  ctx.stroke();
}

/** A speedboat chase at sunset: harbour water, a pier and a low sun. */
export function harborChase(ctx, x, y, w, h) {
  sky(ctx, x, y, w, h, [[0, '#ff9a3d'], [0.55, '#ff5e62'], [1, '#7b2d8b']]);
  sunDisc(ctx, x + w * 0.68, y + h * 0.34, h * 0.16, '#ffd76a');
  // Sun glitter on the water.
  ctx.fillStyle = 'rgba(255, 215, 106, 0.55)';
  for (let i = 0; i < 6; i++) {
    const yy = y + h * (0.58 + i * 0.06);
    ctx.fillRect(x + w * (0.6 - i * 0.02), yy, w * (0.16 + i * 0.04), h * 0.012);
  }
  // Sea.
  const sea = ctx.createLinearGradient(x, y + h * 0.55, x, y + h);
  sea.addColorStop(0, '#b23a6e');
  sea.addColorStop(1, '#241a33');
  ctx.fillStyle = sea;
  ctx.fillRect(x, y + h * 0.55, w, h * 0.45);
  // Pier on the left.
  block(ctx, x, y + h * 0.42, w * 0.2, h * 0.1, '#1c1426');
  for (let i = 0; i < 4; i++) block(ctx, x + w * (0.02 + i * 0.05), y + h * 0.5, w * 0.015, h * 0.16, '#1c1426');
  // Speedboat: hull, cabin, wake.
  const bx = x + w * 0.42;
  const by = y + h * 0.66;
  ctx.fillStyle = '#fff7e8';
  ctx.beginPath();
  ctx.moveTo(bx, by);
  ctx.lineTo(bx + w * 0.3, by);
  ctx.lineTo(bx + w * 0.26, by + h * 0.09);
  ctx.lineTo(bx + w * 0.04, by + h * 0.09);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#ff5e62';
  ctx.fillRect(bx + w * 0.1, by - h * 0.07, w * 0.12, h * 0.07);
  ctx.fillStyle = 'rgba(255, 247, 232, 0.8)';
  ctx.beginPath();
  ctx.moveTo(bx + w * 0.3, by + h * 0.05);
  ctx.lineTo(bx + w * 0.52, by + h * 0.02);
  ctx.lineTo(bx + w * 0.52, by + h * 0.12);
  ctx.lineTo(bx + w * 0.3, by + h * 0.1);
  ctx.closePath();
  ctx.fill();
  gull(ctx, x + w * 0.2, y + h * 0.2, w * 0.03);
  gull(ctx, x + w * 0.3, y + h * 0.14, w * 0.022);
}

/** A neon casino strip at dusk: towers, glowing signs, wet street. */
export function casinoRow(ctx, x, y, w, h) {
  sky(ctx, x, y, w, h, [[0, '#12082e'], [0.6, '#3b0f66'], [1, '#0e7490']]);
  sunDisc(ctx, x + w * 0.24, y + h * 0.3, h * 0.1, '#ff2e88');
  // Towers.
  const towers = [
    [0.02, 0.34, 0.2, 0.62, '#1c1030'],
    [0.26, 0.2, 0.22, 0.76, '#241640'],
    [0.52, 0.3, 0.2, 0.66, '#1c1030'],
    [0.76, 0.42, 0.22, 0.54, '#2a1848'],
  ];
  for (const [fx, fy, fw, fh, color] of towers) {
    block(ctx, x + w * fx, y + h * fy, w * fw, h * fh, color);
    litWindows(ctx, x + w * fx, y + h * fy, w * fw, h * fh, 4, 7, '#ffd76a');
  }
  // Neon sign bars.
  ctx.fillStyle = '#22e6ff';
  ctx.fillRect(x + w * 0.28, y + h * 0.24, w * 0.18, h * 0.035);
  ctx.fillStyle = '#ff2e88';
  ctx.fillRect(x + w * 0.54, y + h * 0.34, w * 0.16, h * 0.035);
  ctx.fillStyle = '#ffb400';
  ctx.fillRect(x + w * 0.04, y + h * 0.38, w * 0.16, h * 0.035);
  // Street with neon reflections.
  const street = ctx.createLinearGradient(x, y + h * 0.9, x, y + h);
  street.addColorStop(0, '#0b0616');
  street.addColorStop(1, '#12082e');
  ctx.fillStyle = street;
  ctx.fillRect(x, y + h * 0.9, w, h * 0.1);
  ctx.fillStyle = 'rgba(34, 230, 255, 0.5)';
  ctx.fillRect(x + w * 0.3, y + h * 0.93, w * 0.12, h * 0.05);
  ctx.fillStyle = 'rgba(255, 46, 136, 0.5)';
  ctx.fillRect(x + w * 0.56, y + h * 0.93, w * 0.1, h * 0.05);
  // Palm silhouettes.
  ctx.strokeStyle = '#0b0616';
  ctx.lineWidth = Math.max(2, w * 0.006);
  for (const px of [0.12, 0.88]) {
    ctx.beginPath();
    ctx.moveTo(x + w * px, y + h * 0.95);
    ctx.quadraticCurveTo(x + w * (px + 0.02), y + h * 0.7, x + w * (px - 0.01), y + h * 0.55);
    ctx.stroke();
    for (let a = 0; a < 5; a++) {
      const ang = Math.PI * (0.05 + a * 0.18);
      ctx.beginPath();
      ctx.moveTo(x + w * (px - 0.01), y + h * 0.55);
      ctx.quadraticCurveTo(
        x + w * (px - 0.01) + Math.cos(ang) * w * 0.09,
        y + h * 0.55 - Math.sin(ang) * h * 0.08,
        x + w * (px - 0.01) + Math.cos(ang) * w * 0.13,
        y + h * 0.55 - Math.sin(ang) * h * 0.02,
      );
      ctx.stroke();
    }
  }
}

/** A narrow alley pursuit: brick walls, a glowing doorway, wet cobbles. */
export function alleyPursuit(ctx, x, y, w, h) {
  sky(ctx, x, y, w, h, [[0, '#2a0a3d'], [1, '#ff5e62']]);
  // Left and right wall planes in perspective.
  ctx.fillStyle = '#3a1c40';
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + w * 0.34, y + h * 0.12);
  ctx.lineTo(x + w * 0.34, y + h);
  ctx.lineTo(x, y + h);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#2c1233';
  ctx.beginPath();
  ctx.moveTo(x + w, y);
  ctx.lineTo(x + w * 0.62, y + h * 0.12);
  ctx.lineTo(x + w * 0.62, y + h);
  ctx.lineTo(x + w, y + h);
  ctx.closePath();
  ctx.fill();
  // Brick courses on the left wall.
  ctx.strokeStyle = 'rgba(255, 247, 232, 0.16)';
  ctx.lineWidth = 1;
  for (let i = 1; i < 8; i++) {
    ctx.beginPath();
    ctx.moveTo(x, y + h * (i / 8));
    ctx.lineTo(x + w * 0.34, y + h * (0.12 + (i / 8) * 0.88));
    ctx.stroke();
  }
  // Glowing doorway at the far end.
  const dg = ctx.createLinearGradient(x + w * 0.42, y, x + w * 0.42, y + h * 0.6);
  dg.addColorStop(0, '#ffd76a');
  dg.addColorStop(1, '#ff9a3d');
  ctx.fillStyle = dg;
  ctx.fillRect(x + w * 0.42, y + h * 0.18, w * 0.14, h * 0.42);
  ctx.fillStyle = '#14101c';
  ctx.fillRect(x + w * 0.44, y + h * 0.22, w * 0.1, h * 0.38);
  ctx.fillStyle = '#ffd76a';
  ctx.beginPath();
  ctx.arc(x + w * 0.49, y + h * 0.34, w * 0.018, 0, Math.PI * 2);
  ctx.fill();
  // Hanging wires.
  ctx.strokeStyle = '#14101c';
  ctx.lineWidth = Math.max(1.5, w * 0.003);
  ctx.beginPath();
  ctx.moveTo(x, y + h * 0.16);
  ctx.quadraticCurveTo(x + w * 0.5, y + h * 0.3, x + w, y + h * 0.14);
  ctx.stroke();
  // Wet cobbles with a doorway reflection.
  ctx.fillStyle = '#1c1426';
  ctx.fillRect(x, y + h * 0.6, w, h * 0.4);
  ctx.fillStyle = 'rgba(255, 215, 106, 0.35)';
  ctx.fillRect(x + w * 0.43, y + h * 0.62, w * 0.12, h * 0.2);
  ctx.fillStyle = 'rgba(255, 247, 232, 0.25)';
  for (let i = 0; i < 5; i++) ctx.fillRect(x + w * (0.1 + i * 0.16), y + h * (0.7 + (i % 2) * 0.08), w * 0.08, h * 0.015);
  // A running figure, pure silhouette.
  ctx.fillStyle = '#0b0616';
  ctx.beginPath();
  ctx.arc(x + w * 0.6, y + h * 0.52, w * 0.02, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(x + w * 0.585, y + h * 0.54, w * 0.03, h * 0.12);
  ctx.strokeStyle = '#0b0616';
  ctx.lineWidth = Math.max(2, w * 0.008);
  ctx.beginPath();
  ctx.moveTo(x + w * 0.6, y + h * 0.66);
  ctx.lineTo(x + w * 0.55, y + h * 0.8);
  ctx.moveTo(x + w * 0.6, y + h * 0.66);
  ctx.lineTo(x + w * 0.68, y + h * 0.76);
  ctx.stroke();
}

/** Scene painters by key, in panel order. */
export const SCENES = {
  harbor: { name: 'Harbor Chase', paint: harborChase },
  casino: { name: 'Casino Row', paint: casinoRow },
  alley: { name: 'Alley Pursuit', paint: alleyPursuit },
};
