// Wires the editor: three photo slots (upload your own photo or paint in
// a built-in scene), layout, grade and size pickers, caption fields, zoom
// and pan for the active photo, and PNG export. A `?shot=` query instead
// stages a fixed scene for a screenshot (see ./shots.js).
import { drawCoverArt, LAYOUTS, GRADES, SIZES } from './cover.js';
import { makeScene, SCENE_NAMES, SCENE_LABELS } from './samples.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const layoutPick = document.getElementById('layout');
const gradePick = document.getElementById('grade');
const sizePick = document.getElementById('size');
const kickerInput = document.getElementById('kicker');
const titleInput = document.getElementById('title');
const placeInput = document.getElementById('place');
const zoomInput = document.getElementById('zoom');
const panXInput = document.getElementById('panx');
const panYInput = document.getElementById('pany');
const exportButton = document.getElementById('export');
const statusLine = document.getElementById('status');

const sceneCache = new Map();
function sceneCanvas(name) {
  if (!sceneCache.has(name)) sceneCache.set(name, makeScene(name));
  return sceneCache.get(name);
}

const slots = SCENE_NAMES.map((name) => ({ kind: 'scene', scene: name, img: sceneCanvas(name) }));
const zooms = [1, 1, 1];
const pans = [[0, 0], [0, 0], [0, 0]];
let activeSlot = 0;

function currentPhotos() {
  return slots.map((slot) => slot.img);
}

function redraw() {
  const size = SIZES[sizePick.value] ?? SIZES.square;
  canvas.width = size.w;
  canvas.height = size.h;
  drawCoverArt(canvas, currentPhotos(), {
    layout: layoutPick.value,
    grade: gradePick.value,
    kicker: kickerInput.value,
    title: titleInput.value,
    place: placeInput.value,
    zooms: [...zooms],
    pans: pans.map((p) => [...p]),
  });
  const active = document.querySelector('.slot.active');
  if (active) active.classList.remove('active');
  const next = document.querySelector(`.slot[data-slot="${activeSlot}"]`);
  if (next) next.classList.add('active');
  zoomInput.value = String(zooms[activeSlot]);
  panXInput.value = String(pans[activeSlot][0]);
  panYInput.value = String(pans[activeSlot][1]);
}

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function fillPick(select, names, labels) {
  for (const name of names) {
    const option = document.createElement('option');
    option.value = name;
    option.textContent = labels ? labels[name] : name;
    select.appendChild(option);
  }
}

document.querySelectorAll('.slot').forEach((button) => {
  const index = Number(button.dataset.slot);
  button.addEventListener('click', () => {
    activeSlot = index;
    redraw();
  });
  const picker = button.querySelector('.scene-pick');
  fillPick(picker, SCENE_NAMES, SCENE_LABELS);
  picker.value = slots[index].scene;
  picker.addEventListener('change', () => {
    slots[index] = { kind: 'scene', scene: picker.value, img: sceneCanvas(picker.value) };
    activeSlot = index;
    redraw();
  });
  const upload = button.querySelector('.upload');
  upload.addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    slots[index] = { kind: 'upload', scene: null, img: await loadImage(URL.createObjectURL(file)) };
    activeSlot = index;
    statusLine.textContent = `Photo ${index + 1} loaded: ${file.name}`;
    redraw();
  });
});

layoutPick.addEventListener('change', redraw);
gradePick.addEventListener('change', redraw);
sizePick.addEventListener('change', redraw);
kickerInput.addEventListener('input', redraw);
titleInput.addEventListener('input', redraw);
placeInput.addEventListener('input', redraw);
zoomInput.addEventListener('input', () => {
  zooms[activeSlot] = Number(zoomInput.value);
  redraw();
});
panXInput.addEventListener('input', () => {
  pans[activeSlot][0] = Number(panXInput.value);
  redraw();
});
panYInput.addEventListener('input', () => {
  pans[activeSlot][1] = Number(panYInput.value);
  redraw();
});

exportButton.addEventListener('click', () => {
  const size = SIZES[sizePick.value] ?? SIZES.square;
  canvas.toBlob((blob) => {
    if (!blob) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `cover-${size.w}x${size.h}.png`;
    a.click();
    statusLine.textContent = `Saved cover-${size.w}x${size.h}.png`;
  }, 'image/png');
});

/** Applies a shot's options (from ?shot=) onto the editor state. */
export function applyShotOptions(opts) {
  if (opts.layout && LAYOUTS.includes(opts.layout)) layoutPick.value = opts.layout;
  if (opts.grade && GRADES.includes(opts.grade)) gradePick.value = opts.grade;
  if (opts.size && SIZES[opts.size]) sizePick.value = opts.size;
  if (opts.kicker !== undefined) kickerInput.value = opts.kicker;
  if (opts.title !== undefined) titleInput.value = opts.title;
  if (opts.place !== undefined) placeInput.value = opts.place;
  if (Array.isArray(opts.scenes)) {
    opts.scenes.forEach((name, i) => {
      if (SCENE_NAMES.includes(name)) {
        slots[i] = { kind: 'scene', scene: name, img: sceneCanvas(name) };
        const picker = document.querySelector(`.slot[data-slot="${i}"] .scene-pick`);
        if (picker) picker.value = name;
      }
    });
  }
  if (typeof opts.zoom === 'number') zooms[0] = zooms[1] = zooms[2] = opts.zoom;
  redraw();
}

const query = new URLSearchParams(location.search);
const shot = query.get('shot');
if (shot) {
  runShot(shot, query, applyShotOptions);
} else {
  redraw();
}
