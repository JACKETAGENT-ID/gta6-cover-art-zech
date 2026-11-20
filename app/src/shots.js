// Fixed scenes for screenshots: ?shot=editor shows the page with photos
// loaded; ?shot=cover shows the cover alone. Query parameters pick the
// scenes, layout, grade, size and caption. window.__shotReady is set once
// the cover has been painted, so a screenshot tool can wait on it.
export function runShot(shot, query, apply) {
  const scenes = (query.get('scenes') ?? 'harbor,casino,alley').split(',').map((s) => s.trim());
  apply({
    scenes,
    layout: query.get('layout') ?? undefined,
    grade: query.get('grade') ?? undefined,
    size: query.get('size') ?? undefined,
    kicker: query.get('kicker') ?? undefined,
    title: query.get('title') ?? undefined,
    place: query.get('place') ?? undefined,
    zoom: query.get('zoom') === null ? undefined : Number(query.get('zoom')),
  });
  if (shot === 'cover') document.body.classList.add('shot-cover');
  if (shot === 'editor') document.body.classList.add('shot-editor');
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
