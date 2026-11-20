// Editor wiring: uploads, panel selection, drag-to-pan, zoom, caption,
// grade/layout picks and PNG export. Photos live only in memory —
// nothing is uploaded anywhere. Shot modes (?shot=...) are in shots.js.

import { drawCover } from './cover.js';
import { runShot } from './shots.js';

const stage = document.getElementById('stage');
const ctx = stage.getContext('2d');

const state = {
  panels: [
    { photo: null, scene: 'harbor', scale: 1.15, ox: 0, oy: 0 },
    { photo: null, scene: 'casino', scale: 1.15, ox: 0, oy: 0 },
    { photo: null, scene: 'alley', scale: 1.15, ox: 0, oy: 0 },
  ],
  selected: 0,
  title: 'MIDNIGHT HARBOR',
  subtitle: 'Three photos. One cover.',
  grade: 'gold',
  layout: 'zigzag',
};

function render() {
  drawCover(ctx, stage.width, stage.height, {
    panels: state.panels,
    title: state.title,
    subtitle: state.subtitle,
    grade: state.grade,
    layout: state.layout,
  });
  document.querySelectorAll('.thumb').forEach((b, i) => {
    b.classList.toggle('active', i === state.selected);
  });
}

function panelAt(clientX, clientY) {
  const rect = stage.getBoundingClientRect();
  const x = ((clientX - rect.left) / rect.width) * stage.width;
  const y = ((clientY - rect.top) / rect.height) * stage.height;
  const third = stage.height / 3;
  const index = y < third ? 0 : y < 2 * third ? 1 : 2;
  return { index, x, y };
}

// Uploads: read the file locally into an Image, keep it in memory.
document.querySelectorAll('[data-upload]').forEach((input) => {
  input.addEventListener('change', () => {
    const file = input.files && input.files[0];
    if (!file) return;
    const idx = Number(input.dataset.upload);
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      state.panels[idx].photo = img;
      state.panels[idx].scene = null;
      state.selected = idx;
      URL.revokeObjectURL(url);
      render();
    };
    img.src = url;
  });
});

// Sample-scene buttons fill a panel with a runtime-painted scene.
document.querySelectorAll('[data-scene]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const slot = btn.closest('.photo-slot');
    const idx = Number(slot.dataset.panel);
    state.panels[idx].photo = null;
    state.panels[idx].scene = btn.dataset.scene;
    state.selected = idx;
    render();
  });
});

// Panel picker + drag to pan the selected panel's photo.
let drag = null;
stage.addEventListener('pointerdown', (e) => {
  const hit = panelAt(e.clientX, e.clientY);
  state.selected = hit.index;
  drag = { x: e.clientX, y: e.clientY, ox: state.panels[hit.index].ox, oy: state.panels[hit.index].oy };
  stage.setPointerCapture(e.pointerId);
  render();
});
stage.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const rect = stage.getBoundingClientRect();
  const p = state.panels[state.selected];
  p.ox = Math.max(-0.5, Math.min(0.5, drag.ox + (e.clientX - drag.x) / rect.width));
  p.oy = Math.max(-0.5, Math.min(0.5, drag.oy + (e.clientY - drag.y) / rect.height));
  render();
});
stage.addEventListener('pointerup', () => { drag = null; });

document.querySelectorAll('.thumb').forEach((btn) => {
  btn.addEventListener('click', () => {
    state.selected = Number(btn.dataset.panel);
    render();
  });
});

const zoom = document.getElementById('zoom');
zoom.addEventListener('input', () => {
  state.panels[state.selected].scale = Number(zoom.value);
  render();
});

document.getElementById('resetView').addEventListener('click', () => {
  const p = state.panels[state.selected];
  p.scale = 1.15;
  p.ox = 0;
  p.oy = 0;
  zoom.value = '1.15';
  render();
});

document.getElementById('title').addEventListener('input', (e) => {
  state.title = e.target.value.toUpperCase();
  render();
});
document.getElementById('subtitle').addEventListener('input', (e) => {
  state.subtitle = e.target.value;
  render();
});
document.getElementById('grade').addEventListener('change', (e) => {
  state.grade = e.target.value;
  render();
});
document.getElementById('layout').addEventListener('change', (e) => {
  state.layout = e.target.value;
  render();
});

// Export: paint the cover at full size on an offscreen canvas, save PNG.
function exportPNG(sizeLabel) {
  const [w, h] = sizeLabel.split('x').map(Number);
  const off = document.createElement('canvas');
  off.width = w;
  off.height = h;
  drawCover(off.getContext('2d'), w, h, {
    panels: state.panels,
    title: state.title,
    subtitle: state.subtitle,
    grade: state.grade,
    layout: state.layout,
  });
  off.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cover-${w}x${h}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }, 'image/png');
}

document.querySelectorAll('[data-export]').forEach((btn) => {
  btn.addEventListener('click', () => exportPNG(btn.dataset.export));
});

// Shot mode (?shot=cover|cover2|square|editor) renders a fixed frame for
// screenshots; otherwise the editor starts with the three sample scenes.
const shot = new URLSearchParams(location.search).get('shot');
if (shot) {
  runShot(shot, stage, state, render);
} else {
  render();
}
