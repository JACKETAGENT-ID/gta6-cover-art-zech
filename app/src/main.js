// Wires the Loading Screen Comic editor: photo slots, panel controls, caption,
// size and export. The preview canvas is always rendered at the exact export
// size, so what you see is what the PNG will be. A `?shot=` query sets up a
// fixed scene for a screenshot instead (./shots.js).
import { drawCover, defaultState, SIZES, LAYOUTS, SAMPLE_FILES } from './cover.js';
import { runShot } from './shots.js';

const $ = (id) => document.getElementById(id);
const preview = $('preview');
const status = $('status');
const state = defaultState();
let activePanel = 0;
let fontsReady = false;

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function redraw() {
  const [w, h] = SIZES[state.size];
  if (preview.width !== w || preview.height !== h) {
    preview.width = w;
    preview.height = h;
  }
  drawCover(preview, state);
}

function refreshThumbs() {
  for (const slot of ['A', 'B', 'C']) {
    const img = document.querySelector(`.slot[data-slot="${slot}"] .thumb`);
    const photo = state.photos[slot];
    if (photo) img.src = photo.src;
  }
}

function buildPanelTabs() {
  const tabs = $('panelTabs');
  tabs.textContent = '';
  const count = LAYOUTS[state.layout];
  if (activePanel >= count) activePanel = 0;
  for (let i = 0; i < count; i++) {
    const tab = document.createElement('button');
    tab.type = 'button';
    tab.className = 'panel-tab';
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-selected', String(i === activePanel));
    tab.textContent = `Panel ${i + 1}`;
    tab.addEventListener('click', () => {
      activePanel = i;
      syncPanelControls();
      buildPanelTabs();
    });
    tabs.appendChild(tab);
  }
}

function syncPanelControls() {
  const panel = state.panels[activePanel];
  $('panelPhoto').value = panel.photo;
  $('zoom').value = panel.zoom;
  $('ox').value = panel.ox;
  $('oy').value = panel.oy;
}

function bindPanelControl(id, apply) {
  $(id).addEventListener('input', (e) => {
    apply(state.panels[activePanel], Number(e.target.value));
    redraw();
  });
}

async function loadSample(slot) {
  const img = await loadImage(`samples/${SAMPLE_FILES[slot]}`);
  state.photos[slot] = img;
  refreshThumbs();
  redraw();
}

async function loadAllSamples() {
  await Promise.all(['A', 'B', 'C'].map(loadSample));
}

/** Public handle the screenshot scenes use. */
export const app = {
  state,
  redraw,
  loadSample,
  loadAllSamples,
  buildPanelTabs,
  syncPanelControls,
  setCaption(text) {
    state.caption = text;
    $('caption').value = text;
  },
  setTagline(text) {
    state.tagline = text;
    $('tagline').value = text;
  },
  setLayout(layout) {
    state.layout = layout;
    $('layout').value = layout;
    buildPanelTabs();
    syncPanelControls();
  },
  setSize(size) {
    state.size = size;
    $('size').value = size;
  },
  async fonts() {
    if (!fontsReady) {
      try {
        await Promise.all([
          document.fonts.load('80px Bangers'),
          document.fonts.load('40px Anton'),
          document.fonts.ready,
        ]);
      } catch {
        // System fallback fonts still draw the cover.
      }
      fontsReady = true;
    }
  },
};

document.querySelectorAll('input[data-photo]').forEach((input) => {
  input.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    state.photos[input.dataset.photo] = await loadImage(URL.createObjectURL(file));
    refreshThumbs();
    redraw();
  });
});
document.querySelectorAll('.sample-btn').forEach((btn) => {
  btn.addEventListener('click', () => loadSample(btn.dataset.sample));
});
$('layout').addEventListener('change', (e) => app.setLayout(e.target.value));
$('panelPhoto').addEventListener('change', (e) => {
  state.panels[activePanel].photo = e.target.value;
  redraw();
});
bindPanelControl('zoom', (p, v) => { p.zoom = v; });
bindPanelControl('ox', (p, v) => { p.ox = v; });
bindPanelControl('oy', (p, v) => { p.oy = v; });
$('caption').addEventListener('input', (e) => { state.caption = e.target.value; redraw(); });
$('tagline').addEventListener('input', (e) => { state.tagline = e.target.value; redraw(); });
$('loading').addEventListener('input', (e) => { state.loading = Number(e.target.value); redraw(); });
$('halftone').addEventListener('change', (e) => { state.halftone = e.target.checked; redraw(); });
$('size').addEventListener('change', (e) => { app.setSize(e.target.value); redraw(); });

// Drag the preview to pan the active panel's photo.
let drag = null;
preview.addEventListener('pointerdown', (e) => {
  drag = { x: e.clientX, y: e.clientY };
  preview.classList.add('dragging');
  preview.setPointerCapture(e.pointerId);
});
preview.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const rect = preview.getBoundingClientRect();
  const panel = state.panels[activePanel];
  panel.ox = Math.max(-0.45, Math.min(0.45, panel.ox + ((e.clientX - drag.x) / rect.width) * 1.4));
  panel.oy = Math.max(-0.45, Math.min(0.45, panel.oy + ((e.clientY - drag.y) / rect.height) * 1.4));
  drag = { x: e.clientX, y: e.clientY };
  syncPanelControls();
  redraw();
});
preview.addEventListener('pointerup', () => {
  drag = null;
  preview.classList.remove('dragging');
});

$('export').addEventListener('click', () => {
  const [w, h] = SIZES[state.size];
  const off = document.createElement('canvas');
  off.width = w;
  off.height = h;
  drawCover(off, state);
  off.toBlob((blob) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `cover-${w}x${h}.png`;
    a.click();
    status.textContent = `Saved cover-${w}x${h}.png`;
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  }, 'image/png');
});

const shot = new URLSearchParams(location.search).get('shot');
if (shot) {
  runShot(shot, new URLSearchParams(location.search), app);
} else {
  buildPanelTabs();
  syncPanelControls();
  await app.fonts();
  await loadAllSamples();
  redraw();
}
