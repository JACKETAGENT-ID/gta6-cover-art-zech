// Fixed scenes for screenshots: ?shot=editor shows the page with sample photos
// loaded; ?shot=cover shows the cover alone. `photo` picks the sample for slot A,
// `photo2`/`photo3` the others; `caption`, `tagline`, `layout` and `size` set the
// cover. window.__shotReady is set once painted.
function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

export async function runShot(shot, query, app) {
  if (shot === 'cover') document.body.classList.add('shot-cover');
  const caption = query.get('caption');
  if (caption) app.setCaption(caption);
  const tagline = query.get('tagline');
  if (tagline) app.setTagline(tagline);
  const layout = query.get('layout');
  if (layout) app.setLayout(layout);
  const size = query.get('size');
  if (size) app.setSize(size);
  await app.fonts();
  await app.loadAllSamples();
  app.buildPanelTabs();
  app.syncPanelControls();
  // Swap in the requested samples for slots A/B/C.
  const picks = { A: query.get('photo'), B: query.get('photo2'), C: query.get('photo3') };
  for (const [slot, name] of Object.entries(picks)) {
    if (!name) continue;
    app.state.photos[slot] = await loadImage(`samples/${name}.jpg`);
  }
  app.redraw();
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
