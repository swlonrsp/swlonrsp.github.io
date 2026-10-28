// Shared by index.html and archive.html.
// maps.json lists councils and the front-page maps (built by work/build_manifest.py).
// The GitHub contents API lists every map in the repository, so a new map shows even before maps.json is rebuilt.

const REPO_API = 'https://api.github.com/repos/swlonrsp/swlonrsp.github.io/contents/';
const SITE_PAGES = ['index.html', 'archive.html'];

async function loadSite() {
  const [manifest, repoFiles] = await Promise.all([
    fetch('maps.json').then(r => r.json()),
    fetch(REPO_API)
      .then(r => (r.ok ? r.json() : null))
      .then(items => items && items.map(i => i.name).filter(n => n.endsWith('.html') && !SITE_PAGES.includes(n)))
      .catch(() => null), // API unavailable: fall back to maps.json alone
  ]);
  return { manifest, repoFiles };
}

function councilFor(file, councils) {
  if (file.includes('episode')) return 'episodes';
  const prefix = file.split('_')[0];
  const c = councils.find(c => c.prefix === prefix);
  return c ? c.id : 'other';
}

function isFrontPage(file) {
  return file.endsWith('_latest.html') || file.includes('episode');
}

// NO2 -> NO₂, PM2.5 -> PM₂.₅
function chemText(s) {
  return s.replace(/NO2/g, 'NO₂').replace(/PM2\.5/g, 'PM₂.₅').replace(/PM10/g, 'PM₁₀');
}

// LBW_Map_NO2_2017_2024_DT_BL.html -> "NO2 2017–2024 (DT, BL)"
function labelFromFile(file) {
  const parts = file.replace(/\.html$/, '').split('_').slice(1).filter(p => p !== 'Map' && p !== 'latest');
  const pollutant = parts.find(p => /^(NO2|PM25|PM10)$/.test(p)) || '';
  const years = parts.filter(p => /^\d{4}$/.test(p));
  const tags = parts.filter(p => /^(DT|BL)$/.test(p));
  return [
    pollutant.replace('PM25', 'PM2.5'),
    years.length ? years.join('–') : '',
    tags.length ? `(${tags.join(', ')})` : '',
  ].filter(Boolean).join(' ') || file;
}

function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'style') node.style.cssText = v;
    else node.setAttribute(k, v);
  }
  node.append(...children.filter(c => c != null));
  return node;
}

function councilSection(council, body, extraClass = '') {
  return el('section', { class: `council ${extraClass}`.trim(), style: `--c:${council.colour};--t:${council.tint}`, 'aria-labelledby': `h-${council.id}` },
    el('header', { class: 'council-head' },
      el('h2', { id: `h-${council.id}` }, council.name),
      council.blurb ? el('span', {}, council.blurb) : null),
    body);
}
