// Screenshot mode: when the page opens with ?shot=cover (or editor),
// the app paints exactly what the screenshots must show, so the maker
// can capture it with headless Chromium. A cover shot draws the same
// canvas the Export button writes, at the chosen post size; an editor
// shot just hands its parameters to the editor so it opens pre-filled.

import { sceneCanvas } from './samples.js';
import { drawCover, coverSize } from './cover.js';

export function readShotParams() {
  const q = new URLSearchParams(location.search);
  return {
    shot: q.get('shot') || '',
    photo: q.get('photo') || 'dockside',
    caption: q.get('caption') || '',
    kicker: q.get('kicker') || '',
    place: q.get('place') || '',
    layout: q.get('layout') || '',
    grade: q.get('grade') || '',
    size: q.get('size') || '',
  };
}

// Render a full-page cover and take over the document. Returns true
// when a shot was rendered (the editor must not start after that).
export function renderCoverShot(p) {
  if (p.shot !== 'cover') return false;
  const { w, h } = coverSize(p.size || 'square');
  document.body.innerHTML = '';
  document.body.style.margin = '0';
  document.body.style.background = '#14082b';
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  canvas.style.display = 'block';
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  canvas.style.objectFit = 'contain';
  document.body.appendChild(canvas);
  const photos = [
    sceneCanvas(p.photo || 'dockside', 900, 675),
    sceneCanvas('downtown', 900, 675),
    sceneCanvas('getaway', 900, 675),
  ];
  drawCover(canvas, {
    photos,
    layout: p.layout || 'stack',
    grade: p.grade || 'sunset',
    kicker: p.kicker || 'VICE CITY',
    title: p.caption || 'Sunset Heist',
    place: p.place || 'Ocean Drive',
  });
  document.title = 'shot-cover';
  return true;
}
