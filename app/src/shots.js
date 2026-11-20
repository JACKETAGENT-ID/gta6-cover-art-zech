// Fixed render modes for screenshots, driven by ?shot= in the URL.
//   ?shot=cover   landscape cover, Gold grade, Zigzag layout
//   ?shot=cover2  landscape cover, Neon grade, Straight layout
//   ?shot=square  square cover, Gold grade, Zigzag layout
//   ?shot=editor  the editor itself, sample scenes loaded in all panels
// Cover modes hide the editor chrome (body.shot-cover) and size the stage
// canvas to the shot frame; drawing is synchronous so a headless
// screenshot taken after load captures the finished render.

import { drawCover } from './cover.js';

function coverPanels(scenes) {
  return scenes.map((scene) => ({ photo: null, scene, scale: 1.15, ox: 0, oy: 0 }));
}

function paintCover(stage, w, h, opts) {
  document.body.classList.add('shot-cover');
  stage.width = w;
  stage.height = h;
  drawCover(stage.getContext('2d'), w, h, opts);
}

export function runShot(mode, stage, state, render) {
  if (mode === 'cover') {
    paintCover(stage, 1280, 720, {
      panels: coverPanels(['harbor', 'casino', 'alley']),
      title: 'MIDNIGHT HARBOR',
      subtitle: 'Three photos. One cover.',
      grade: 'gold',
      layout: 'zigzag',
    });
    return;
  }
  if (mode === 'cover2') {
    paintCover(stage, 1280, 720, {
      panels: coverPanels(['alley', 'casino', 'harbor']),
      title: 'NEON PURSUIT',
      subtitle: 'Down the alley, under the signs.',
      grade: 'neon',
      layout: 'straight',
    });
    return;
  }
  if (mode === 'square') {
    paintCover(stage, 1024, 1024, {
      panels: coverPanels(['casino', 'harbor', 'alley']),
      title: 'CASINO ROW',
      subtitle: 'Three photos. One cover.',
      grade: 'gold',
      layout: 'zigzag',
    });
    return;
  }
  if (mode === 'editor') {
    state.panels = coverPanels(['harbor', 'casino', 'alley']);
    state.title = 'MIDNIGHT HARBOR';
    state.subtitle = 'Three photos. One cover.';
    state.grade = 'gold';
    state.layout = 'zigzag';
    render();
    return;
  }
  // Unknown mode: fall back to the plain editor.
  render();
}
