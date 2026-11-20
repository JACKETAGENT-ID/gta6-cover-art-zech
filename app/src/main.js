// The editor: wires the controls on index.html to the renderer. The
// page holds one live preview canvas plus three photo slots. A slot
// holds either a photo the user uploaded or one of the runtime-drawn
// scenes; the preview redraws on every change, and Export paints the
// same cover at full post size and downloads it as a PNG.

import { SCENES, sceneCanvas } from './samples.js';
import { SIZES, LAYOUTS, GRADES, drawCover, coverSize } from './cover.js';
import { readShotParams, renderCoverShot } from './shots.js';

const shot = readShotParams();
// A cover shot takes over the whole page; the editor never starts.
if (renderCoverShot(shot)) {
  // Nothing else to do: the cover is already on screen.
} else {

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

function blankSlot() {
  return { image: null, zoom: 1, panX: 0, panY: 0, scene: null };
}

const state = {
  slots: [blankSlot(), blankSlot(), blankSlot()],
  active: 0,
  layout: 'stack',
  grade: 'sunset',
  size: 'square',
  kicker: 'VICE CITY',
  title: 'Sunset Heist',
  place: 'Ocean Drive',
};

function slotImage(slot) {
  return slot.image;
}

function refreshPreview() {
  const canvas = $('#preview');
  const box = canvas.parentElement.getBoundingClientRect();
  const scale = Math.min(box.width / 1080, (box.height || 600) / 1080);
  const pw = Math.max(320, Math.floor(1080 * Math.max(0.3, scale)));
  const ph = Math.floor(pw * (state.size === 'portrait' ? 1350 / 1080 : state.size === 'wide' ? 1080 / 1920 : 1));
  canvas.width = pw;
  canvas.height = ph;
  drawCover(canvas, {
    photos: state.slots.map(slotImage),
    layout: state.layout,
    grade: state.grade,
    kicker: state.kicker,
    title: state.title,
    place: state.place,
  });
  syncSlotCards();
}

function syncSlotCards() {
  $$('.slot-card').forEach((card, i) => {
    const slot = state.slots[i];
    const thumb = card.querySelector('.slot-thumb');
    thumb.innerHTML = '';
    if (slot.image) {
      const c = document.createElement('canvas');
      c.width = 200;
      c.height = 150;
      const tctx = c.getContext('2d');
      const iw = slot.image.naturalWidth || slot.image.width;
      const ih = slot.image.naturalHeight || slot.image.height;
      const s = Math.max(200 / iw, 150 / ih);
      tctx.drawImage(slot.image, (200 - iw * s) / 2, (150 - ih * s) / 2, iw * s, ih * s);
      thumb.appendChild(c);
    } else {
      thumb.textContent = `Slot ${i + 1} · empty`;
    }
    card.classList.toggle('active', i === state.active);
    const label = slot.scene ? SCENES.find((s) => s.id === slot.scene)?.label || 'Photo' : slot.image ? 'Photo' : 'Empty';
    card.querySelector('.slot-name').textContent = `Slot ${i + 1} — ${label}`;
  });
  const slot = state.slots[state.active];
  $('#zoom').value = slot.zoom;
  $('#pan-x').value = slot.panX;
  $('#pan-y').value = slot.panY;
}

function loadSceneInto(slotIndex, sceneId) {
  const slot = state.slots[slotIndex];
  slot.image = sceneCanvas(sceneId, 900, 675);
  slot.scene = sceneId;
  slot.zoom = 1;
  slot.panX = 0;
  slot.panY = 0;
  refreshPreview();
}

function loadUpload(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = () => {
      const slot = state.slots[state.active];
      slot.image = img;
      slot.scene = null;
      slot.zoom = 1;
      slot.panX = 0;
      slot.panY = 0;
      refreshPreview();
    };
    img.src = reader.result;
  };
  reader.readAsDataURL(file);
}

function exportPng() {
  const { w, h } = coverSize(state.size);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  drawCover(canvas, {
    photos: state.slots.map(slotImage),
    layout: state.layout,
    grade: state.grade,
    kicker: state.kicker,
    title: state.title,
    place: state.place,
  });
  canvas.toBlob((blob) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `gta6-cover-${state.size}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  }, 'image/png');
}

function buildPickers() {
  const mk = (el, items, current, onPick) => {
    el.innerHTML = '';
    for (const item of items) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'pick' + (item.id === current ? ' on' : '');
      b.textContent = item.label;
      b.title = item.hint || item.label;
      b.addEventListener('click', () => {
        onPick(item.id);
        el.querySelectorAll('.pick').forEach((p) => p.classList.remove('on'));
        b.classList.add('on');
      });
      el.appendChild(b);
    }
  };
  mk($('#layout-picks'), LAYOUTS, state.layout, (id) => { state.layout = id; refreshPreview(); });
  mk($('#grade-picks'), GRADES, state.grade, (id) => { state.grade = id; refreshPreview(); });
  mk($('#size-picks'), SIZES, state.size, (id) => { state.size = id; refreshPreview(); });
  const scenes = $('#scene-picks');
  scenes.innerHTML = '';
  for (const scene of SCENES) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'pick';
    b.textContent = scene.label;
    b.title = scene.hint;
    b.addEventListener('click', () => loadSceneInto(state.active, scene.id));
    scenes.appendChild(b);
  }
}

function wire() {
  $$('.slot-card').forEach((card, i) => {
    card.addEventListener('click', () => { state.active = i; refreshPreview(); });
  });
  $('#upload').addEventListener('change', (e) => loadUpload(e.target.files[0]));
  $('#upload-btn').addEventListener('click', () => $('#upload').click());
  $('#zoom').addEventListener('input', (e) => { state.slots[state.active].zoom = Number(e.target.value); refreshPreview(); });
  $('#pan-x').addEventListener('input', (e) => { state.slots[state.active].panX = Number(e.target.value); refreshPreview(); });
  $('#pan-y').addEventListener('input', (e) => { state.slots[state.active].panY = Number(e.target.value); refreshPreview(); });
  $('#kicker').addEventListener('input', (e) => { state.kicker = e.target.value; refreshPreview(); });
  $('#title').addEventListener('input', (e) => { state.title = e.target.value; refreshPreview(); });
  $('#place').addEventListener('input', (e) => { state.place = e.target.value; refreshPreview(); });
  $('#export').addEventListener('click', exportPng);
  $('#fill-samples').addEventListener('click', () => {
    state.slots.forEach((_, i) => loadSceneInto(i, SCENES[i % SCENES.length].id));
  });
  $('#clear-slots').addEventListener('click', () => {
    state.slots = [blankSlot(), blankSlot(), blankSlot()];
    refreshPreview();
  });
  window.addEventListener('resize', refreshPreview);
}

// An editor shot opens pre-filled from its query, so the screenshot
// shows the caption and grade the maker asked for.
if (shot.shot === 'editor') {
  if (shot.caption) state.title = shot.caption;
  if (shot.kicker) state.kicker = shot.kicker;
  if (shot.place) state.place = shot.place;
  if (shot.layout) state.layout = shot.layout;
  if (shot.grade) state.grade = shot.grade;
  if (shot.size) state.size = shot.size;
  const setVal = (id, v) => { const el = document.getElementById(id); if (el) el.value = v; };
  setVal('kicker', state.kicker);
  setVal('title', state.title);
  setVal('place', state.place);
}
buildPickers();
wire();
// Start with one scene in every slot so the first paint already shows
// the comic look; the user can replace any slot with their own photo.
state.slots.forEach((_, i) => loadSceneInto(i, SCENES[i % SCENES.length].id));
refreshPreview();
}
