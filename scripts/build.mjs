// PropSports static site build — no dependencies; output is committed and served as-is.
//   node scripts/build.mjs
// Generates: index.html, pricing.html, reference.html, sports/*.html, site.webmanifest, robots.txt,
// sitemap.xml, assets/catalog.json. Normalizes <head> SEO/brand tags and factual copy on legacy pages.
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import vm from 'node:vm';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(root, p), 'utf8');
const ctx = {};
vm.runInNewContext(read('assets/ps-config.js'), { globalThis: ctx, window: undefined }, { filename: 'ps-config.js' });
const C = ctx.PS_CONFIG;
const N = C.COUNTS;
const SITE = C.SITE;
const VERSION = Date.now().toString(36);
const TODAY = new Date().toISOString().slice(0, 10);

// Counts come from production: GET /health (totals) and GET /sports (every route with its access level).
// The registry in ps-config.js supplies descriptions only; the build fails if it disagrees with production.
const getJSON = (p) => fetch(C.API_BASE + p, { headers: { Accept: 'application/json' } }).then((r) => r.ok ? r.json() : null).catch(() => null);
const [health, sportsCatalog] = await Promise.all([getJSON('/health'), getJSON('/sports')]);
const live = !!(health && sportsCatalog && sportsCatalog.sports);
if (live) {
  const drift = [];
  const registry = new Map();
  for (const [sport, groups] of Object.entries(C.ROUTES)) for (const [, routes] of groups) for (const [p, , a] of routes) registry.set(p, { sport, access: a });
  for (const [sport, s] of Object.entries(sportsCatalog.sports)) for (const p of s.routes) {
    const mine = registry.get(p);
    if (!mine) drift.push(`missing from registry: ${p} (${s.access[p]})`);
    else if (mine.access !== s.access[p]) drift.push(`access differs: ${p} registry=${mine.access} production=${s.access[p]}`);
    registry.delete(p);
  }
  for (const p of registry.keys()) drift.push(`not in production catalog: ${p}`);
  const t = sportsCatalog.totals;
  if (Number(health.endpoints) !== t.total) drift.push(`/health endpoints ${health.endpoints} ≠ /sports total ${t.total}`);
  if (t.total !== N.DOCUMENTED_ROUTES || t.open !== N.OPEN || t.demo !== N.DEMO || t.key !== N.KEY) drift.push(`totals differ: production ${t.total}/${t.open}/${t.demo}/${t.key}, registry ${N.DOCUMENTED_ROUTES}/${N.OPEN}/${N.DEMO}/${N.KEY}`);
  if (drift.length && !process.env.PS_ALLOW_DRIFT) { console.error('Registry does not match production (GET /sports):\n  ' + drift.join('\n  ')); process.exit(1); }
  if (drift.length) console.warn('WARNING (PS_ALLOW_DRIFT): ' + drift.join('; '));
} else console.warn('WARNING: production catalog unreachable; using the offline fallback count.');
const CATALOG = live ? Number(health.endpoints) : C.CATALOG_ENDPOINTS_FALLBACK;
const API_VERSION = live ? health.version : null;
writeFileSync(join(root, 'assets/catalog.json'), JSON.stringify({
  endpoints: CATALOG, api_version: API_VERSION,
  access: live ? { open: sportsCatalog.totals.open, demo: sportsCatalog.totals.demo, key: sportsCatalog.totals.key } : { open: N.OPEN, demo: N.DEMO, key: N.KEY },
  by_sport: live ? sportsCatalog.totals.sports : null,
  source: [`${C.API_BASE}/health`, `${C.API_BASE}/sports`], fetched_at: new Date().toISOString(), live, registry_matches_production: live
}, null, 2) + '\n');

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const fmt = (n) => Number(n).toLocaleString('en-US');
const sportById = Object.fromEntries(C.SPORTS.map((s) => [s.id, s]));
const coreSports = C.SPORTS.filter((s) => s.api);
const coreNames = coreSports.map((s) => s.name);
const listNames = (a) => a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1];
const endpoints = (cls = '') => `<span data-ps-endpoints${cls ? ` class="${cls}"` : ''}>${fmt(CATALOG)}</span>`;
const OG_IMAGE = `${SITE}/assets/social/propsports-og.jpg`;
const OG_ALT = 'PropSports API — live sports data infrastructure for MLB, NFL, NBA, WNBA, NHL, tennis, soccer and UFC';
const ORG_ID = 'https://proptechusa.ai/#organization';
const BRAND_ID = `${SITE}/#brand`;
const SITE_ID = `${SITE}/#website`;
const API_ID = `${SITE}/#api`;

/* ── marks ───────────────────────────────────────────── */
const MARK_PATHS = {
  mlb: '<circle cx="12" cy="12" r="9"/><path d="M7.4 5.1c1.9 1.9 2.9 4.3 2.9 6.9s-1 5-2.9 6.9M16.6 5.1c-1.9 1.9-2.9 4.3-2.9 6.9s1 5 2.9 6.9"/>',
  nfl: '<ellipse cx="12" cy="12" rx="10" ry="5.8" transform="rotate(-40 12 12)"/><path d="M9 15l6-6M9.9 12.6l1.5 1.5M11.3 11.2l1.5 1.5M12.7 9.8l1.5 1.5"/>',
  nba: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3v18M5.6 5.6c2.7 2.7 2.7 10.1 0 12.8M18.4 5.6c-2.7 2.7-2.7 10.1 0 12.8"/>',
  wnba: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3v18M5.6 5.6c2.7 2.7 2.7 10.1 0 12.8M18.4 5.6c-2.7 2.7-2.7 10.1 0 12.8"/>',
  nhl: '<ellipse cx="12" cy="9" rx="8" ry="3.2"/><path d="M4 9v5.2c0 1.8 3.6 3.2 8 3.2s8-1.4 8-3.2V9"/>',
  tennis: '<circle cx="12" cy="12" r="9"/><path d="M5.3 5.7c3.4 3.3 3.4 9.3 0 12.6M18.7 5.7c-3.4 3.3-3.4 9.3 0 12.6"/>',
  soccer: '<circle cx="12" cy="12" r="9"/><path d="M12 7.6l4 2.9-1.5 4.6h-5L8 10.5zM12 7.6V3.2M16 10.5l4.2-1.3M14.5 15.1l2.6 3.7M9.5 15.1l-2.6 3.7M8 10.5L3.8 9.2"/>',
  ufc: '<path d="M8.3 3h7.4L21 8.3v7.4L15.7 21H8.3L3 15.7V8.3z"/><path d="M9.6 7h4.8L17 9.6v4.8L14.4 17H9.6L7 14.4V9.6z" opacity=".45"/>'
};
const mark = (id) => `<span class="mk" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${MARK_PATHS[id]}</svg></span>`;
const BRAND_MARK = '<svg class="brand-mark" viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="7" fill="#D73B1A"/><polygon points="10,6 6,17 13,17 9,26 26,13 18,13 22,6" fill="#fff"/></svg>';
const brand = (tag = true) => `${BRAND_MARK}<span class="brand-word">PropSports</span>${tag ? '<span class="brand-tag">API</span>' : ''}`;
const tag = (id) => `<span class="sport-tag" style="--c:${sportById[id].color}">${sportById[id].name.toUpperCase()}</span>`;
const A = C.ACCESS;
// "65 public routes · 7 demo-key routes · 79 API-key routes" (zero tiers omitted)
const accessSummary = (open, demo, key) => [[open, 'open'], [demo, 'demo'], [key, 'key']].filter(([n]) => n > 0).map(([n, a]) => `${fmt(n)} ${A[a].short}`).join(' · ');
const sportAccess = (id) => accessSummary(N.OPEN_PER_SPORT[id], N.DEMO_PER_SPORT[id], N.KEY_PER_SPORT[id]);

/* ── hero picture (master PNG untouched; derivatives preferred) ── */
function heroMedia() {
  const has = (f) => existsSync(join(root, f));
  if (!has('hero-sports-network.png')) return { html: '', preload: '' };
  const src = [];
  if (has('assets/hero/hero-sports-network-mobile.avif')) src.push('<source media="(max-width:900px)" type="image/avif" srcset="/assets/hero/hero-sports-network-mobile.avif">');
  if (has('assets/hero/hero-sports-network-mobile.webp')) src.push('<source media="(max-width:900px)" type="image/webp" srcset="/assets/hero/hero-sports-network-mobile.webp">');
  if (has('assets/hero/hero-sports-network.avif')) src.push('<source type="image/avif" srcset="/assets/hero/hero-sports-network.avif">');
  if (has('assets/hero/hero-sports-network.webp')) src.push('<source type="image/webp" srcset="/assets/hero/hero-sports-network.webp">');
  const alt = 'Seven sport panels — baseball, football, basketball, hockey, a fight cage, tennis and soccer — above a glowing globe linked by data lines';
  const preload = has('assets/hero/hero-sports-network.avif')
    ? '<link rel="preload" as="image" type="image/avif" href="/assets/hero/hero-sports-network.avif" media="(min-width:901px)" fetchpriority="high">\n<link rel="preload" as="image" type="image/avif" href="/assets/hero/hero-sports-network-mobile.avif" media="(max-width:900px)" fetchpriority="high">\n'
    : '';
  return { html: `<div class="hero-media"><picture>${src.join('')}<img src="/hero-sports-network.png" alt="${alt}" width="1920" height="819" fetchpriority="high" decoding="async"></picture></div>`, preload };
}

/* ── structured data ─────────────────────────────────── */
const ORG = {
  '@type': 'Organization', '@id': ORG_ID, name: 'PropTechUSA.ai', url: 'https://proptechusa.ai',
  logo: { '@type': 'ImageObject', url: `${SITE}/assets/brand/icon-512.png`, width: 512, height: 512 },
  brand: { '@id': BRAND_ID }, email: 'sales@proptechusa.ai', telephone: '+1-888-784-3881'
};
const BRAND = { '@type': 'Brand', '@id': BRAND_ID, name: 'PropSports', logo: `${SITE}/assets/brand/icon-512.png` };
const WEBSITE = { '@type': 'WebSite', '@id': SITE_ID, url: `${SITE}/`, name: 'PropSports API', inLanguage: 'en-US', publisher: { '@id': ORG_ID } };
const planOffer = (p) => ({ '@type': 'Offer', name: `PropSports API ${p.name}`, price: String(p.price), priceCurrency: 'USD', url: `${SITE}/pricing`,
  priceSpecification: { '@type': 'UnitPriceSpecification', price: String(p.price), priceCurrency: 'USD', unitText: 'MONTH' } });
const APP = {
  '@type': 'SoftwareApplication', '@id': API_ID, name: 'PropSports API', applicationCategory: 'DeveloperApplication', operatingSystem: 'Any',
  url: `${SITE}/`, publisher: { '@id': ORG_ID }, brand: { '@id': BRAND_ID }, image: OG_IMAGE,
  description: `Developer API for live sports data across ${listNames(coreNames)}: schedules, live scores, play-by-play, players, teams, advanced statistics and model output.`,
  featureList: ['Live scores and game state', 'Schedules and standings', 'Play-by-play and game detail', 'Player and team data', 'MLB Statcast tables', 'MLB Poisson model output', 'WNBA WinBA and Player DNA'],
  offers: { '@type': 'AggregateOffer', priceCurrency: 'USD', lowPrice: String(Math.min(...C.PLANS.map((p) => p.price))), highPrice: String(Math.max(...C.PLANS.map((p) => p.price))), offerCount: C.PLANS.length, offers: C.PLANS.map(planOffer) }
};
const crumbs = (items) => ({ '@type': 'BreadcrumbList', itemListElement: items.map(([name, path], i) => ({ '@type': 'ListItem', position: i + 1, name, item: `${SITE}${path}` })) });
const webpage = (path, title, description, extra = {}) => ({ '@type': 'WebPage', '@id': `${SITE}${path}#webpage`, url: `${SITE}${path}`, name: title, description, isPartOf: { '@id': SITE_ID }, publisher: { '@id': ORG_ID }, inLanguage: 'en-US', ...extra });
const ldScript = (graph) => `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(/</g, '\\u003c')}</script>`;

/* ── head (single source for SEO/brand tags) ─────────── */
function seoTags({ title, description, path, ogTitle }) {
  const url = `${SITE}${path}`;
  const t = ogTitle || title;
  return `<link rel="canonical" href="${url}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="PropSports API">
<meta property="og:locale" content="en_US">
<meta property="og:title" content="${esc(t)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${OG_IMAGE}">
<meta property="og:image:secure_url" content="${OG_IMAGE}">
<meta property="og:image:type" content="image/jpeg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${esc(OG_ALT)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(t)}">
<meta name="twitter:description" content="${esc(description)}">
<meta name="twitter:image" content="${OG_IMAGE}">
<meta name="twitter:image:alt" content="${esc(OG_ALT)}">
<meta name="theme-color" content="#07090C">
<link rel="icon" href="/favicon.ico" sizes="48x48">
<link rel="icon" type="image/svg+xml" href="/assets/brand/favicon.svg">
<link rel="icon" type="image/png" sizes="32x32" href="/assets/brand/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/assets/brand/favicon-16x16.png">
<link rel="apple-touch-icon" sizes="180x180" href="/assets/brand/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">`;
}
function head({ title, description, path, graph, extra = '' }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta name="robots" content="index,follow,max-image-preview:large">
${seoTags({ title, description, path })}
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wght@600;700;800&family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600;700&family=Barlow+Condensed:wght@600&display=swap">
<link rel="stylesheet" href="/assets/ps.css?v=${VERSION}">
${extra}${ldScript(graph)}
<script defer src="https://www.proptechusa.ai/network-analytics.js" data-proptech-surface="propsports"></script>
</head>
<body>`;
}

/* ── shell ───────────────────────────────────────────── */
const chevron = '<svg viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M2 3.5l3 3 3-3"/></svg>';
const PORTAL = 'https://billing.stripe.com/p/login/cNi3cv2vY7em3lr4oj7wA00';
function nav(current = '') {
  const sportLinks = C.SPORTS.map((s) => `<a href="/sports/${s.id}" style="--c:${s.color}">${mark(s.id)}<strong>${s.name}</strong><span>${esc(s.status)}</span></a>`).join('');
  return `<a class="sr-only" href="#main">Skip to content</a>
<header class="nav dark">
  <div class="wrap nav-in">
    <a class="brand" href="/" aria-label="PropSports API home">${brand()}</a>
    <nav class="nav-links" aria-label="Primary">
      <div class="dd"><button type="button" aria-expanded="false" aria-haspopup="true">Products ${chevron}</button>
        <div class="dd-menu">
          <a href="/#platform"><strong>Core Sports API</strong><span>${N.PER_SPORT ? coreSports.length : ''} core sports on one API key</span></a>
          <a href="/#live"><strong>Live Sports Data</strong><span>Schedules, scores and live game state</span></a>
          <a href="/#depth"><strong>Advanced Analytics</strong><span>Statcast, play-by-play, shot and event coordinates</span></a>
          <a href="/#intelligence"><strong>Model Intelligence</strong><span>Model output and DNA systems where available</span></a>
          <a href="/sports/ufc"><strong>UFC Intelligence</strong><span>Dedicated combat-sports platform</span></a>
        </div>
      </div>
      <div class="dd"><button type="button" aria-expanded="false" aria-haspopup="true">Sports ${chevron}</button>
        <div class="dd-menu dd-sports">${sportLinks}<a class="dd-foot" href="/#network"><strong>Compare all eight sports</strong><span>Coverage and access by sport</span></a></div>
      </div>
      <a href="/reference"${current === 'reference' ? ' aria-current="page"' : ''}>API Reference</a>
      <a href="/#live">Live Network</a>
      <a href="/pricing"${current === 'pricing' ? ' aria-current="page"' : ''}>Pricing</a>
      <a href="/docs">Docs</a>
    </nav>
    <div class="nav-cta">
      <a class="btn btn-ghost btn-sm" href="${PORTAL}" target="_blank" rel="noopener">Manage plan</a>
      <a class="btn btn-primary btn-sm" href="/pricing">Get API Key <span aria-hidden="true">→</span></a>
      <button class="nav-burger" type="button" aria-label="Open menu" aria-expanded="false"><span></span></button>
    </div>
  </div>
</header>
<div class="drawer dark" aria-label="Menu">
  <p class="drawer-h">SPORTS</p>
  <div class="drawer-sports">${C.SPORTS.map((s) => `<a href="/sports/${s.id}" style="--c:${s.color}">${mark(s.id)}${s.name}</a>`).join('')}</div>
  <p class="drawer-h">PLATFORM</p>
  <a href="/#live">Live Network</a><a href="/#network">Sports Network</a><a href="/#console">API Console</a><a href="/reference">API Reference</a><a href="/docs">Docs</a><a href="/pricing">Pricing</a>
  <p class="drawer-h">ACCOUNT</p>
  <a href="${PORTAL}" target="_blank" rel="noopener">Manage subscription</a>
  <a class="btn btn-primary" href="/pricing">Get API Key →</a>
</div>`;
}
function footer() {
  return `<footer class="foot dark">
  <div class="wrap">
    <div class="foot-grid">
      <div>
        <a class="brand" href="/" aria-label="PropSports API home">${brand()}</a>
        <p>Live sports data infrastructure from PropTechUSA.ai — ${coreSports.length} core API sports, ${endpoints()} documented API routes and a dedicated UFC intelligence platform.</p>
      </div>
      <div><p class="foot-h">PLATFORM</p><a href="/#live">Live network</a><a href="/#network">Sports network</a><a href="/reference">API reference</a><a href="/docs">Documentation</a><a href="/pricing">Pricing</a><a href="/live">PropSports powering PropBetEdge</a></div>
      <div><p class="foot-h">SPORT APIS</p>${C.SPORTS.map((s) => `<a href="/sports/${s.id}">${s.name} ${s.api ? 'API' : 'Intelligence'}</a>`).join('')}</div>
      <div><p class="foot-h">SPORT GUIDES</p><a href="/mlb">MLB API guide</a><a href="/nfl">NFL API guide</a><a href="/nba">NBA API guide</a><a href="/nhl">NHL API guide</a><a href="/mlb-edge">MLB Edge Suite</a><a href="https://ufc.proptechusa.ai" target="_blank" rel="noopener">UFC Intelligence platform</a></div>
      <div><p class="foot-h">COMPANY</p><a href="https://proptechusa.ai" target="_blank" rel="noopener">PropTechUSA.ai</a><a href="https://propbetedge.ai" target="_blank" rel="noopener">PropBetEdge.ai</a><a href="https://propdata.proptechusa.ai" target="_blank" rel="noopener">PropData API</a><a href="mailto:sales@proptechusa.ai">sales@proptechusa.ai</a><a href="tel:18887843881">1-888-784-3881</a></div>
    </div>
    <div class="foot-bottom"><span>© 2026 PropTechUSA.ai · Built on Cloudflare Workers</span><span><a href="/terms">Terms</a> · <a href="/privacy">Privacy</a> · <a href="${PORTAL}" target="_blank" rel="noopener">Manage subscription</a></span></div>
  </div>
</footer>`;
}
const scripts = (live) => `<script src="/assets/ps-config.js?v=${VERSION}"></script>
<script src="/assets/ps.js?v=${VERSION}" defer></script>
${live ? `<script src="/assets/ps-network.js?v=${VERSION}" defer></script>\n<script src="/assets/ps-live.js?v=${VERSION}" defer></script>\n` : ''}</body>
</html>
`;
const wire = `<div class="wire dark" aria-label="PropSports sportswire">
  <div class="wire-label"><i></i><span>SPORTSWIRE</span></div>
  <div class="wire-view"><div class="wire-track" id="wire-track"><span class="wi"><span class="sp">NETWORK</span>Connecting to live feeds…</span></div></div>
</div>`;

/* ── fragments ───────────────────────────────────────── */
function endpointGroups(groups) {
  return `<div class="ep-groups">${groups.map(([name, routes]) => `
  <div class="ep-group"><h3>${esc(name)} <span class="ep-n">${routes.length}</span></h3><ul class="ep-list">${routes.map(([p, d]) => `
    <li><span class="method">GET</span><div><code>${esc(p)}</code><span>${esc(d)}</span></div></li>`).join('')}
  </ul></div>`).join('')}</div>`;
}
const EXAMPLES = JSON.parse(read('assets/api-examples.json')).examples;
function consoleBlock(tabs, first) {
  return `<div class="console dark" data-console data-first="${first}">
  <div class="con-nav" role="tablist" aria-label="Example requests">${tabs.map(({ id, sport, label, path }) => `
    <button type="button" role="tab" data-ex="${id}" aria-selected="${id === first}" style="--c:${sportById[sport].color}">${mark(sport)}<strong>${esc(label)}</strong><span class="p">${esc(path)}</span></button>`).join('')}
  </div>
  <div class="con-main">
    <div class="con-req"><span class="method">GET</span><div class="con-path">Loading example…</div>
      <div class="con-actions"><button type="button" data-act="copy">Copy curl</button><button type="button" data-act="json">Copy JSON</button><button type="button" class="run" data-act="run" hidden>Run live</button></div></div>
    <div class="con-desc"></div>
    <div class="con-status"></div>
    <pre class="con-body" tabindex="0" aria-label="Response body"></pre>
  </div>
</div>`;
}
// Every listed capability maps to a production route; an empty category is a plain dash.
const capList = (items) => items.length ? items.map((c) => `<span class="cap">${esc(c)}</span>`).join('') : '<span class="cap-none" title="No routes in this category">—</span>';
const perAccess = (a, id) => N[a.toUpperCase() + '_PER_SPORT'][id];
const ufcAccess = (a) => C.UFC_ROUTES.reduce((n, [, routes]) => n + routes.filter(([, , access]) => access === a).length, 0);
function matrix() {
  const rows = C.SPORTS.map((s) => {
    const m = s.matrix;
    return `<tr style="--c:${s.color}"><th scope="row"><a href="/sports/${s.id}">${mark(s.id)}${s.name}</a><small>/${s.api ? s.id : 'v1/ufc'}</small></th>
      <td>${capList(m.live)}</td><td>${capList(m.pbp)}</td><td>${capList(m.players)}</td><td>${capList(m.teams)}</td><td>${capList(m.adv)}</td><td>${capList(m.models)}</td></tr>`;
  }).join('\n');
  return `<p class="scroll-hint">Scroll sideways for every column →</p>
<div class="matrix-wrap"><table class="matrix">
  <thead><tr><th scope="col">SPORT</th><th scope="col">SCHEDULE &amp; LIVE</th><th scope="col">PLAY-BY-PLAY &amp; GAME</th><th scope="col">PLAYERS</th><th scope="col">TEAMS &amp; STANDINGS</th><th scope="col">ADVANCED</th><th scope="col">MODELS &amp; DNA</th></tr></thead>
  <tbody>${rows}</tbody>
</table></div>`;
}
const allMarks = () => coreSports.map((s) => `<span style="--c:${s.color};display:contents">${mark(s.id)}</span>`).join('');
const planBy = (id) => C.PLANS.find((p) => p.id === id);
function plans() {
  const P = C.PLANS;
  const first = coreSports[0];
  const sportOptions = (blank) => (blank ? `<option value="">${blank}</option>` : '') + coreSports.map((s) => `<option value="${blank ? s.id : s.id.toUpperCase()}">${s.name}</option>`).join('');
  const cards = P.map((p) => {
    const cta = p.checkout === 'single' ? 'Get Single Sport' : p.id === 'ENTERPRISE' ? 'Start Enterprise' : `Get ${p.name}`;
    const feats = [`<li><span><b class="num">${fmt(p.limit)}</b> requests / day</span></li>`, `<li><span>${esc(p.sports)}</span></li>`];
    if (p.checkout === 'single') feats.push(`<li><span><b data-single-count>${N.PER_SPORT[first.id]} ${first.name} routes</b> for your sport</span></li>`);
    else if (p.checkout === 'developer') feats.push('<li><span>Every documented route for each chosen sport</span></li>');
    else feats.push(`<li><span>All <b>${endpoints()}</b> documented routes</span></li>`);
    p.feats.forEach((f) => feats.push(`<li><span>${esc(f)}</span></li>`));
    feats.push('<li><span>API key emailed after checkout</span></li>', '<li><span>Cancel anytime in the Stripe portal</span></li>');
    let picker = '';
    if (p.checkout === 'single') picker = `<div class="plan-select"><label for="single-sport">Choose your sport</label><select id="single-sport">${sportOptions('')}</select></div>`;
    if (p.checkout === 'developer') picker = `<fieldset class="plan-select dev-pick"><legend>Choose up to ${C.DEVELOPER_MAX_SPORTS} sports</legend>
        <label class="sr-only" for="dev-sport-1">Primary sport (required)</label><select id="dev-sport-1" data-dev-sport required aria-describedby="dev-error">${sportOptions('Primary sport (required)')}</select>
        <label class="sr-only" for="dev-sport-2">Second sport (optional)</label><select id="dev-sport-2" data-dev-sport>${sportOptions('Second sport (optional)')}</select>
        <label class="sr-only" for="dev-sport-3">Third sport (optional)</label><select id="dev-sport-3" data-dev-sport>${sportOptions('Third sport (optional)')}</select>
        <p class="dev-error" id="dev-error" role="alert" hidden>Choose at least one sport to continue.</p></fieldset>`;
    const dataCheckout = p.checkout === 'single' ? 'data-checkout="single" data-select="single-sport"' : p.checkout === 'developer' ? 'data-checkout="developer"' : `data-checkout="${p.checkout}"`;
    return `<article class="plan${p.featured ? ' featured' : ''}" id="plan-${p.id.toLowerCase()}" aria-labelledby="plan-${p.id}-h">
      ${p.badge ? `<span class="plan-badge">${esc(p.badge)}</span>` : ''}<div class="plan-top"><h3 id="plan-${p.id}-h">${esc(p.name)}</h3>${p.tag ? `<span class="plan-tag">${esc(p.tag)}</span>` : ''}</div>
      <div class="plan-price"><span class="cur">$</span><span>${fmt(p.price)}</span><span class="per">/mo</span></div>
      <p class="plan-lede">${esc(p.lede)}</p>
      ${picker}
      <button type="button" class="btn ${p.featured ? 'btn-primary' : 'btn-line'}" ${dataCheckout}>${cta}</button>
      <ul class="plan-feats">${feats.join('')}</ul>
      ${p.checkout === 'single' || p.checkout === 'developer' ? '' : `<div class="plan-marks" aria-hidden="true">${allMarks()}</div>`}
    </article>`;
  }).join('\n');
  const perSport = coreSports.map((s) => N.PER_SPORT[s.id]);
  const row = (label, fn) => `<tr><th scope="row">${label}</th>${P.map((p) => `<td>${fn(p)}</td>`).join('')}</tr>`;
  const compare = `<details class="compare"><summary>Compare every plan side by side</summary><div class="compare-scroll"><table>
    <thead><tr><th scope="col">Plan</th>${P.map((p) => `<th scope="col">${esc(p.name)}</th>`).join('')}</tr></thead>
    <tbody>
      ${row('Price', (p) => `$${fmt(p.price)}/mo`)}
      ${row('Sports', (p) => esc(p.sports))}
      ${row('Requests / day', (p) => fmt(p.limit))}
      ${row('Endpoints', (p) => p.checkout === 'single' ? `${Math.min(...perSport)}–${Math.max(...perSport)} documented routes` : p.checkout === 'developer' ? 'All documented routes for chosen sports' : `All ${endpoints()} documented routes`)}
      ${row('Support', (p) => ({ PRO: 'Priority support', ENTERPRISE: 'Priority integration support' }[p.id] || 'Email support'))}
      ${row('API key', () => 'Emailed after Stripe checkout')}
      ${row('Billing', () => 'Monthly · cancel in the Stripe portal')}
    </tbody></table></div></details>`;
  const notes = `<div class="plan-foot">
    <span>UFC Intelligence is separate and billed on <a class="link" href="https://ufc.proptechusa.ai" target="_blank" rel="noopener">its own platform</a></span>
    <span><a class="link" href="${PORTAL}" target="_blank" rel="noopener">Manage an existing subscription</a></span>
    <span>Questions: <a class="link" href="mailto:sales@proptechusa.ai">sales@proptechusa.ai</a> · <a class="link" href="tel:18887843881">1-888-784-3881</a></span>
  </div>`;
  return `<div class="plans">${cards}</div>${compare}${notes}`;
}

/* ── homepage ────────────────────────────────────────── */
const HOME_TITLE = 'PropSports API — Live Sports Data for MLB, NFL, NBA, NHL & More';
const HOME_DESC = `Developer API for live scores, schedules, play-by-play and player data across ${coreSports.length} core sports, plus UFC intelligence. ${C.REFRESH_SECONDS}-second live feeds. Plans from $${planBy('SINGLE').price}/mo.`;
function home() {
  const hero = heroMedia();
  const tabs = ['mlb', 'nfl', 'nba', 'nhl', 'wnba', 'tennis', 'soccer', 'ufc'].map((id) => ({ id, sport: id, label: sportById[id].name, path: EXAMPLES[id].path.split('?')[0] }));
  const depth = [
    ['mlb', 'Owned Statcast intelligence', 'Batter and pitcher Statcast tables, game environment and a Poisson model that prices props from owned data.', ['/mlb/statcast/batters', '/mlb/statcast/pitchers', '/mlb/weather/all', '/mlb/odds/model']],
    ['nfl', 'Drive and play-by-play intelligence', 'Normalized game detail with every play, drive history, game leaders and the win-probability series.', ['/nfl/game/:id/plays', '/nfl/game/:id/drives', '/nfl/game/:id/leaders', '/nfl/game/:id/winprob']],
    ['nba', 'Shot coordinates and lineups', 'Play-by-play with court coordinates, shot charts, estimated on-court lineups and TS% / USG% box scores.', ['/nba/game/:id/shotchart', '/nba/game/:id/plays', '/nba/game/:id/lineup', '/nba/game/:id/boxscore']],
    ['tennis', 'Point-level live match state', 'Live point score and server, order of play, tournament editions, rankings and head-to-head records.', ['/tennis/live', '/tennis/today', '/tennis/rankings', '/tennis/h2h/:a/:b']]
  ];
  const layers = [
    ['Player intelligence', 'Profiles, game logs and advanced metrics, plus DNA systems that describe how a player or fighter produces.', ['mlb', 'nba', 'wnba', 'nhl', 'soccer', 'ufc']],
    ['Game intelligence', 'Live state, lineups, play-by-play, shot and event coordinates, drives, live casts and line deployment.', ['mlb', 'nfl', 'nba', 'wnba', 'nhl', 'soccer']],
    ['Model outputs', 'MLB Poisson model prices and the WNBA WinBA index — published as their own routes, never blended into raw data.', ['mlb', 'wnba']],
    ['Historical context', 'Standings, rosters, rankings, tournament editions, fight history, game logs, MiLB careers and a daily NHL archive.', ['mlb', 'nfl', 'nba', 'nhl', 'wnba', 'tennis', 'soccer', 'ufc']],
    ['Live state', `Live endpoints on every core sport; NFL, NHL and NBA live routes cache for 2–10 seconds. The live network panel re-polls every ${C.REFRESH_SECONDS} seconds.`, ['mlb', 'nfl', 'nba', 'wnba', 'nhl', 'tennis', 'soccer']]
  ];
  const tiers = [
    ['SPORT SOURCES', 'Upstream feeds', ['MLB StatsAPI', 'ESPN APIs', 'stats.nba.com', 'NHL APIs', 'Open-Meteo', 'DraftKings · FanDuel props', 'Platform-native sources']],
    ['INGEST · NORMALIZE', 'Adapters and workers', ['NFL scoreboard adapter', 'NHL play normalizer', 'NBA box-score math', 'WNBA ingest · 1 min', 'Tennis live poller · 1 min', 'Soccer ingest · 1 min', 'UFC weigh-ins · 1 min', 'NHL archive · daily']],
    ['DATA LAYER', 'Storage', ['Supabase Postgres', 'Workers KV', 'R2 object storage']],
    ['INTELLIGENCE', 'Sport-specific', ['MLB Poisson model', 'Statcast tables', 'NHL shot geometry', 'NHL line deployment', 'WinBA', 'Player DNA', 'Soccer DNA', 'Fight DNA']],
    ['CLOUDFLARE EDGE API', 'propsports-api Worker', ['API-key auth', 'Per-key daily limits', 'Gateway allowlist', 'Per-route caching', 'Source health canaries']],
    ['YOUR APPLICATION', 'REST · JSON', ['CORS enabled', 'GET only', 'PropBetEdge sport sites']]
  ];
  const rules = [
    ['Never fabricate unavailable fields', 'NHL goalie routes report GSAx as unavailable instead of estimating it.'],
    ['Null means unavailable', 'A score that does not exist yet is null — never zero.'],
    ['Volatile data exposes its freshness', 'Timestamps and per-route cache lifetimes ship with responses; the live panel shows refresh age per feed.'],
    ['Normalize source differences', 'NFL and NHL are normalized into one shape per sport, and NHL responses list their source URLs.'],
    ['Keep sport-specific semantics', 'Innings, periods, sets and rounds stay native; tennis keeps point score and server.'],
    ['Frequency is not probability', 'WinBA is labelled association with winning, not causation.'],
    ['Model output stays distinguishable', 'Model prices live under /mlb/odds/model, apart from sportsbook props; NHL shots are marked raw-features-only.'],
    ['Version proprietary models', 'DNA systems and indexes report their versions, e.g. winba/1.0.1 and soccer-dna/1.1.0.'],
    ['No hidden fallbacks', 'When an upstream source fails, the route returns the error instead of silently serving substitute data.'],
    ['Say what a metric is not', 'Fight DNA is documented as not a pick, price or probability.']
  ];
  const graph = [ORG, BRAND, WEBSITE, APP, webpage('/', HOME_TITLE, HOME_DESC, { about: { '@id': API_ID }, primaryImageOfPage: { '@type': 'ImageObject', url: OG_IMAGE, width: 1200, height: 630 } })];

  return `${head({ title: HOME_TITLE, description: HOME_DESC, path: '/', graph, extra: hero.preload })}
${wire}
${nav()}
<main id="main">
<section class="hero dark${hero.html ? ' has-media' : ''}" aria-labelledby="hero-h">
  ${hero.html}
  <div class="wrap hero-in">
    <div class="hero-copy">
      <p class="eyebrow">PROPSPORTS API</p>
      <h1 id="hero-h">One sports data layer.<span>Every game underneath it.</span></h1>
      <p class="hero-lead">Live schedules, scores, players, teams, play-by-play, advanced analytics and proprietary intelligence across the PropSports network — ${coreSports.length} sports on one API key, plus a dedicated UFC intelligence platform.</p>
      <div class="hero-actions">
        <a class="btn btn-primary" href="/pricing">Get API Key <span aria-hidden="true">→</span></a>
        <a class="btn btn-line" href="#console">Explore the API</a>
        <a class="link arrow" href="#live">View the live network</a>
      </div>
    </div>
  </div>
</section>

<nav class="rail dark" aria-label="Sports">
  <div class="wrap"><div class="rail-in">${C.SPORTS.map((s) => `
    <a href="/sports/${s.id}" style="--c:${s.color}"><span class="rail-top"><span class="rail-name">${s.name}</span>${mark(s.id)}</span><span class="rail-state" data-rail="${s.id}">—</span></a>`).join('')}
  </div></div>
</nav>

<section class="sec" id="live" aria-labelledby="live-h">
  <div class="wrap">
    <div class="sec-head">
      <div><p class="label"><b>01</b> Live network</p><h2 id="live-h">Every game on the network, live.</h2><p class="sec-lead">Real-time events flowing through PropSports, read from the same open routes customers call, with every event linked to its live PBEcast — refreshed every ${C.REFRESH_SECONDS} seconds.</p></div>
      <div class="sec-aside"><a class="link" href="${C.API_BASE}/health" target="_blank" rel="noopener">API health endpoint</a></div>
    </div>
    <dl class="metrics">
      <div class="metric"><dt>Sports online</dt><dd id="m-online">—</dd><p class="metric-sub" id="m-online-detail"></p></div>
      <div class="metric"><dt>Live events</dt><dd id="m-live">—</dd></div>
      <div class="metric"><dt>Events today</dt><dd id="m-today">—</dd></div>
      <div class="metric"><dt>Refresh interval</dt><dd>${C.REFRESH_SECONDS}<small>s</small></dd></div>
      <div class="metric"><dt>API health</dt><dd id="m-health">—</dd></div>
    </dl>
    <div class="ops">
      <div class="ops-bar">
        <div class="ops-tabs" role="tablist" aria-label="Filter by sport">
          <button type="button" class="ops-tab" role="tab" data-sport="all" aria-selected="true">All <span class="n"></span></button>${C.SPORTS.map((s) => `<button type="button" class="ops-tab" role="tab" data-sport="${s.id}" aria-selected="false">${s.name} <span class="n"></span></button>`).join('')}
        </div>
        <div class="ops-sync" id="ops-sync"><i></i><span id="ops-updated">Connecting…</span><button type="button" id="ops-refresh">Refresh</button></div>
      </div>
      <table class="ops-table">
        <thead><tr><th class="c-sport" scope="col">Sport</th><th scope="col">Competition</th><th scope="col">Event</th><th scope="col">Status</th><th scope="col">Clock / time</th><th class="col-venue" scope="col">Venue</th><th class="c-age" scope="col">Age</th><th class="c-cast" scope="col"><span class="sr-only">Live cast</span></th></tr></thead>
        <tbody id="ops-body">${'<tr class="skel"><td></td><td></td><td></td><td></td><td></td><td class="c-venue"></td><td></td><td class="c-cast"></td></tr>'.repeat(5)}</tbody>
      </table>
      <div class="ops-foot"><span id="ops-count"></span><span>Open PropSports routes · PBEcast links open the exact event · UFC via ufc-api.propbetedge.ai</span></div>
    </div>
  </div>
</section>

<section class="sec white" id="why" aria-labelledby="why-h">
  <div class="wrap">
    <div class="sec-head"><div><p class="label"><b>02</b> Why PropSports</p><h2 id="why-h">Built like infrastructure. Priced like a tool.</h2><p class="sec-lead">One key, one normalized network, and sport-specific depth where each sport actually needs it.</p></div></div>
    <div class="why">
      <article class="why-card"><div class="why-num num">${C.REFRESH_SECONDS}<small>s</small></div><h3>Live network refresh</h3><p>The live network panel re-polls every open feed every ${C.REFRESH_SECONDS} seconds, so scores and states stay current.</p><p class="why-meta">NFL, NHL and NBA live routes cache for 2–10&nbsp;s</p></article>
      <article class="why-card"><div class="why-num num">${endpoints()}</div><h3>Documented API routes</h3><p>Every route in the production catalog is documented sport by sport, with its access level, in the <a class="link" href="/reference">API reference</a>.</p><p class="why-meta">${accessSummary(N.OPEN, N.DEMO, N.KEY)}</p></article>
      <article class="why-card"><div class="why-num num">${coreSports.length}</div><h3>Core sports on one API key</h3><p>${listNames(coreNames)} behind a single <code>X-API-Key</code> header.</p><div class="why-marks" aria-hidden="true">${allMarks()}</div></article>
      <article class="why-card"><div class="why-num num">${C.SPORTS.length}</div><h3>Sport intelligence platforms</h3><p>The core API plus dedicated live platforms behind WNBA, tennis and soccer, and a separate UFC intelligence platform.</p><p class="why-meta">UFC runs on its own host and keys</p></article>
      <article class="why-card wide">
        <div class="why-img"><img src="/assets/media/sport-mlb.webp" alt="A baseball kicking up infield dirt under stadium lights" width="720" height="480" loading="lazy" decoding="async"></div>
        <div class="why-body"><h3 style="margin-top:0">Owned data and first-party models</h3><p>Statcast tables in our own database, the MLB Poisson model, the WNBA WinBA index and DNA systems — each published as its own route family, separate from raw feeds.</p><p class="why-meta">Model output is never blended into raw data</p><a class="link arrow" style="margin-top:14px" href="/sports/mlb">Explore the MLB API</a></div>
      </article>
    </div>
  </div>
</section>

<section class="sec alt" id="network" aria-labelledby="network-h">
  <div class="wrap">
    <div class="sec-head">
      <div><p class="label"><b>03</b> Sports network</p><h2 id="network-h">Eight sports. One network.</h2><p class="sec-lead">Seven sports run through the PropSports API on one key. UFC runs on a dedicated fight-intelligence platform.</p></div>
      <div class="sec-aside"><a class="link arrow" href="#platform">Compare coverage</a></div>
    </div>
    <div class="net">${C.SPORTS.map((s) => `
      <a class="net-card" href="/sports/${s.id}" style="--c:${s.color}">
        <div class="net-media"><img src="${s.media}" alt="${esc(s.alt)}" width="720" height="480" loading="lazy" decoding="async"><span class="net-status">${esc(s.status)}</span><span class="net-name">${mark(s.id)}${s.name}</span></div>
        <div class="net-body"><p>${esc(s.line)}</p><div class="net-foot"><span>${s.api ? `${N.PER_SPORT[s.id]} documented routes` : 'Separate host and keys'}</span><span class="arrow">${s.name} ${s.api ? 'API' : 'platform'}</span></div></div>
      </a>`).join('')}
    </div>
    <p class="credit">Photography: NHL — Tony Schnagl / Pexels; UFC — Haribhagirath / Wikimedia Commons (CC0). Court artwork and sport panels © PropSports. <a href="/assets/media/CREDITS.md">Media credits</a></p>
  </div>
</section>

<section class="sec white" id="platform" aria-labelledby="platform-h">
  <div class="wrap">
    <div class="sec-head"><div><p class="label"><b>04</b> Coverage</p><h2 id="platform-h">One network. Deep sport-specific data.</h2><p class="sec-lead">What each sport exposes today, read from the production route catalog. Every entry maps to a documented route — all ${endpoints()} are listed on the sport pages and in the <a class="link" href="/reference">API reference</a>.</p></div></div>
    ${matrix()}
    <p class="matrix-note">WNBA, tennis and soccer are served through an allowlisted gateway to their dedicated platforms. UFC runs on its own host and keys and is not part of PropSports API plans.</p>
  </div>
</section>

<section class="sec" id="console" aria-labelledby="console-h">
  <div class="wrap">
    <div class="sec-head">
      <div><p class="label"><b>05</b> API</p><h2 id="console-h">Real requests. Real responses.</h2><p class="sec-lead">Each response was captured from production and is shown with its status and latency. Routes open without a key re-run live from your browser.</p></div>
      <div class="sec-aside"><a class="link arrow" href="/reference">Full API reference</a></div>
    </div>
    ${consoleBlock(tabs, 'mlb')}
    <div class="api-notes"><span>Base URL <code>${C.API_BASE}</code></span><span>Auth <code>X-API-Key: &lt;key&gt;</code> or <code>?key=</code></span><span>Format <code>application/json</code></span></div>
  </div>
</section>

<section class="sec alt" id="depth" aria-labelledby="depth-h">
  <div class="wrap">
    <div class="sec-head"><div><p class="label"><b>06</b> Depth</p><h2 id="depth-h">Deeper than generic sports data.</h2><p class="sec-lead">Scores are the floor. Each sport goes further in the direction that sport actually needs.</p></div></div>
    <figure class="band">
      <picture><source media="(max-width:700px)" srcset="/assets/media/editorial-nhl-lines-m.webp"><img src="/assets/media/editorial-nhl-lines.webp" alt="Hockey players lined up on the ice with their sticks down" width="1400" height="612" loading="lazy" decoding="async"></picture>
      <figcaption class="band-copy"><h3>Game intelligence, not just scores.</h3><p>Live casts, shot geometry and line deployment for hockey — and the same depth, sport by sport.</p></figcaption>
    </figure>
    <div class="cols">${depth.map(([id, h, p, routes]) => `
      <article class="col">${tag(id)}<h3>${esc(h)}</h3><p>${esc(p)}</p><ul>${routes.map((r) => `<li><em>GET</em>${esc(r)}</li>`).join('')}</ul><a class="link arrow" href="/sports/${id}">${sportById[id].name} API details</a></article>`).join('')}
    </div>
  </div>
</section>

<section class="sec dark" id="intelligence" aria-labelledby="intel-h">
  <div class="wrap">
    <div class="sec-head"><div><p class="label"><b>07</b> Intelligence</p><h2 id="intel-h">Raw sports data is only layer one.</h2><p class="sec-lead">Capabilities vary by sport. The tags show where each layer exists today.</p></div></div>
    <div class="layers">${layers.map(([h, p, sports], i) => `
      <div class="layer"><span class="layer-n">L${i + 1}</span><h3>${esc(h)}</h3><p>${esc(p)}</p><div class="layer-sports">${sports.map(tag).join('')}</div></div>`).join('')}
    </div>
  </div>
</section>

<section class="sec white" id="infrastructure" aria-labelledby="infra-h">
  <div class="wrap">
    <div class="sec-head"><div><p class="label"><b>08</b> Infrastructure</p><h2 id="infra-h">Built as infrastructure.</h2><p class="sec-lead">How data moves today. Core sports are served by the PropSports edge worker; WNBA, tennis and soccer pass through a gateway to dedicated platforms; UFC runs on its own host.</p></div></div>
    <div class="topo">
      <div class="tiers">${tiers.map(([n, s, nodes]) => `
        <div class="tier"><div class="tier-name">${n}<small>${esc(s)}</small></div><div class="tier-body">${nodes.map((x) => `<span class="node"><i></i>${esc(x)}</span>`).join('')}</div></div>`).join('')}
      </div>
      <dl class="topo-notes">
        <dt>AUTHENTICATION</dt><dd><code>X-API-Key</code> header or <code>?key=</code>. Keys are issued at checkout and stored in Workers KV with their sports and daily limit.</dd>
        <dt>RATE LIMITS</dt><dd>Per-key daily counters in KV, ${fmt(Math.min(...C.PLANS.map((p) => p.limit)))}–${fmt(Math.max(...C.PLANS.map((p) => p.limit)))} requests/day by plan. The demo key shares ${C.DEMO_LIMIT.replace(', shared', '')}.</dd>
        <dt>CACHING</dt><dd>Cache lifetimes are set per route: NFL live 2–3 s, NHL live 5–8 s, NBA live 10 s, Statcast 15 min.</dd>
        <dt>GATEWAY</dt><dd>GET-only allowlist for WNBA, tennis and soccer with a 10 s upstream timeout. Your key is stripped before forwarding.</dd>
        <dt>SCHEDULED JOBS</dt><dd>Cron-triggered Workers: WNBA, tennis and soccer ingest every minute, UFC weigh-ins every minute, NHL archive daily.</dd>
        <dt>HEALTH</dt><dd><code>/health</code>, <code>/health/nfl-sources</code> and <code>/health/nhl-sources</code> probe upstream shape.</dd>
      </dl>
    </div>
  </div>
</section>

<section class="sec" id="trust" aria-labelledby="trust-h">
  <div class="wrap">
    <div class="sec-head"><div><p class="label"><b>09</b> Data trust</p><h2 id="trust-h">Rules the data follows.</h2><p class="sec-lead">Infrastructure is only useful if you can tell what a value means and where it came from.</p></div></div>
    <div class="rules">${rules.map(([h, p]) => `<div class="rule"><div><strong>${esc(h)}</strong><span>${esc(p)}</span></div></div>`).join('')}</div>
  </div>
</section>

<section class="sec alt" id="pricing" aria-labelledby="pricing-h">
  <div class="wrap">
    <div class="sec-head">
      <div><p class="label"><b>10</b> Pricing</p><h2 id="pricing-h">Flat monthly plans. No per-call fees.</h2><p class="sec-lead">From one sport to every core sport at enterprise volume. Every all-sports plan includes the full catalog on one API key.</p></div>
      <div class="sec-aside"><a class="link arrow" href="/pricing">Pricing details</a></div>
    </div>
    ${plans()}
  </div>
</section>

<section class="sec white" aria-labelledby="more-h">
  <div class="wrap">
    <div class="sec-head"><div><p class="label">Also from PropTechUSA</p><h2 id="more-h">More from the network.</h2></div></div>
    <div class="related">
      <a href="/mlb-edge"><strong>MLB Edge Suite →</strong><span>Premium MLB signals built on the PropSports MLB dataset.</span></a>
      <a href="https://ufc.proptechusa.ai" target="_blank" rel="noopener"><strong>UFC Intelligence platform ↗</strong><span>Fight DNA, round statistics, weigh-ins and card intelligence.</span></a>
      <a href="https://propdata.proptechusa.ai" target="_blank" rel="noopener"><strong>PropData API ↗</strong><span>Real-estate data infrastructure from the same team.</span></a>
    </div>
  </div>
</section>
</main>
${footer()}
${scripts(true)}`;
}

/* ── pricing page ────────────────────────────────────── */
const PRICING_TITLE = `PropSports API Pricing — Plans from $${planBy('SINGLE').price}/mo`;
const PRICING_DESC = `PropSports API plans: one sport $${planBy('SINGLE').price}/mo, up to three sports $${planBy('DEVELOPER').price}/mo, all ${coreSports.length} core sports $${planBy('ALL_SPORTS').price}/mo, up to ${fmt(Math.max(...C.PLANS.map((p) => p.limit)))} requests a day. Key emailed at checkout.`;
function pricingPage() {
  const faq = [
    ['How do I get my API key?', 'Choose a plan and complete Stripe checkout. Your key is created automatically and emailed to you.'],
    ['Can I cancel?', 'Yes. Manage or cancel your subscription any time in the Stripe customer portal.'],
    ['How do I get access?', 'Choose the sport or plan you need. Your API key is emailed after checkout.'],
    ['Is UFC included?', 'No. UFC Intelligence runs on its own platform with its own keys and billing.'],
    ['What does Single Sport include?', `Every documented route for the one sport you choose, at ${fmt(planBy('SINGLE').limit)} requests a day.`],
    ['How does Developer work?', `Pick up to ${C.DEVELOPER_MAX_SPORTS} sports before checkout — one required, two optional — with ${fmt(planBy('DEVELOPER').limit)} requests a day.`],
    ['Which plans cover every sport?', `All Sports, Pro, Scale and Enterprise include all ${coreSports.length} core sports; they differ by daily request limit and support.`],
    ['I subscribed before these plans launched. Does my price change?', 'No. Existing subscriptions keep their original plan and price.']
  ];
  const graph = [ORG, BRAND, WEBSITE, APP, crumbs([['PropSports API', '/'], ['Pricing', '/pricing']]), webpage('/pricing', PRICING_TITLE, PRICING_DESC, { about: { '@id': API_ID } })];
  return `${head({ title: PRICING_TITLE, description: PRICING_DESC, path: '/pricing', graph })}
${nav('pricing')}
<main id="main">
<section class="sp-hero dark" style="--c:var(--accent)">
  <div class="sp-hero-media"><img src="/assets/media/sport-nfl.webp" alt="" width="720" height="480" decoding="async"></div>
  <div class="wrap sp-hero-in">
    <nav class="crumbs" aria-label="Breadcrumb"><a href="/">PropSports</a> / Pricing</nav>
    <div class="sp-hero-copy"><p class="eyebrow">PRICING</p><h1>Flat monthly plans. No per-call fees.</h1><p class="hero-lead">One sport for $${planBy('SINGLE').price}/mo, up to three for $${planBy('DEVELOPER').price}/mo, or all ${coreSports.length} core sports for $${planBy('ALL_SPORTS').price}/mo. Your API key arrives by email the moment checkout completes.</p></div>
    <div class="sp-facts">
      <div><span>Core sports</span><b>${coreSports.length}</b></div>
      <div><span>Documented routes</span><b>${endpoints()}</b></div>
      <div><span>Daily limits</span><b>${fmt(Math.min(...C.PLANS.map((p) => p.limit)))} – ${fmt(Math.max(...C.PLANS.map((p) => p.limit)))}</b></div>
      <div><span>Billing</span><b>Stripe · monthly</b></div>
    </div>
  </div>
</section>
<section class="sec alt" aria-labelledby="plans-h">
  <div class="wrap">
    <div class="sec-head"><div><p class="label">Plans</p><h2 id="plans-h">Choose your plan.</h2></div></div>
    ${plans()}
  </div>
</section>
<section class="sec white" aria-labelledby="faq-h">
  <div class="wrap split">
    <div><p class="label">FAQ</p><h2 id="faq-h">Plan questions.</h2></div>
    <ul class="facts-list">${faq.map(([q, a]) => `<li><h3 style="font:700 17px var(--display);color:var(--ink);letter-spacing:-.01em">${esc(q)}</h3><p style="margin-top:4px">${esc(a)}</p></li>`).join('')}</ul>
  </div>
</section>
</main>
${footer()}
${scripts(false)}`;
}

/* ── sport pages ─────────────────────────────────────── */
const SPORT_TITLES = {
  mlb: 'MLB API — Live Games, Statcast & Model Output | PropSports',
  nfl: 'NFL API — Scoreboards, Play-by-Play & Drives | PropSports',
  nba: 'NBA API — Play-by-Play, Shot Charts & Box Scores | PropSports',
  wnba: 'WNBA API — Games, Players, WinBA & Player DNA | PropSports',
  nhl: 'NHL API — Live Cast, Shot Geometry & Standings | PropSports',
  tennis: 'Tennis API — Live ATP & WTA Scores & Rankings | PropSports',
  soccer: 'Soccer API — Fixtures, Live Matches & Tables | PropSports',
  ufc: 'UFC API — Fight DNA & Round Statistics | PropSports'
};
const NOTES = {
  mlb: ['Model prices come from the PropBetEdge odds engine and are served from a separate route family.', 'Park factor is a field on /mlb/weather; indoor parks return none.', 'Minor-league routes cover Triple-A, Double-A, High-A, Single-A and Rookie; player careers share MLB player IDs where the source provides them.'],
  nfl: ['Win probability is the ESPN series, passed through — not a PropSports model.'],
  nba: ['Lineups are reconstructed from starters and substitutions and are estimates.', 'The hustle box depends on stats.nba.com access and may return available:false.', 'Win probability is the ESPN series, passed through.', 'Standings, teams, rosters, team schedules and team stats come from the PropBetEdge NBA data layer.'],
  wnba: ['WinBA measures association with winning, not causation.', 'Player DNA covers the current season; /wnba/dna/meta lists which fields are proxies.'],
  nhl: ['Shot routes return raw geometry marked raw-features-only — no xG probabilities.', 'Goalie routes report GSAx as unavailable rather than estimating it.', 'Deployment is derived from shift charts for completed games.'],
  tennis: ['WTA rankings are the default; ATP rankings (?tour=atp) come from a secondary source and can lag.', 'The Tennis DNA route is access-gated by the upstream platform.', 'No tennis model output is offered.'],
  soccer: ['Competitions include the Premier League, Bundesliga, UEFA Champions League, UEFA Nations League and MLS.', 'Soccer model picks exist on the soccer platform but are not exposed through the PropSports gateway.'],
  ufc: ['UFC uses its own host and API keys; it is not part of PropSports API plans.', 'Fight DNA describes style and output — it is not a pick, price or probability.', 'No live in-fight scoring or public prediction routes are offered.']
};
function sportPage(s) {
  const groups = s.api ? C.ROUTES[s.id] : C.UFC_ROUTES;
  const host = s.api ? C.API_BASE : C.UFC_BASE;
  const total = s.api ? N.PER_SPORT[s.id] : N.UFC_ENDPOINTS_LISTED;
  const path = `/sports/${s.id}`;
  const title = SPORT_TITLES[s.id];
  const description = s.summary.length > 158 ? s.summary.slice(0, 155).replace(/\s+\S*$/, '') + '…' : s.summary;
  const m = s.matrix;
  const story = C.STORY[s.id];
  const capCols = [['Schedule & live', m.live], ['Play-by-play & game', m.pbp], ['Players', m.players], ['Teams & standings', m.teams], ['Advanced', m.adv], ['Models & DNA', m.models]].filter(([, v]) => v.length);
  const tabs = s.examples.map((id) => ({ id, sport: s.id, label: EXAMPLES[id].path.split('?')[0].replace('/v1/ufc', ''), path: EXAMPLES[id].path.split('?')[0] }));
  const cta = s.api
    ? `<button type="button" class="btn btn-primary" data-checkout="${s.id.toUpperCase()}">Get ${s.name} API key — $${planBy('SINGLE').price}/mo</button><a class="btn btn-line" href="/pricing">Compare all plans</a>`
    : `<a class="btn btn-primary" href="${s.platform}" target="_blank" rel="noopener">Open UFC platform ↗</a><a class="btn btn-line" href="${s.platform}/docs" target="_blank" rel="noopener">UFC developer docs ↗</a>`;
  const links = [
    s.deep ? `<a class="link arrow" href="${s.deep}">${s.name} API guide and examples</a>` : '',
    s.platform ? `<a class="link" href="${s.platform}" target="_blank" rel="noopener">Dedicated ${s.name} platform ↗</a>` : '',
    s.api ? `<a class="link arrow" href="/reference#${s.id}">${s.name} routes in the API reference</a>` : ''
  ].filter(Boolean).join(' · ');
  const appNode = s.api
    ? { '@type': 'SoftwareApplication', '@id': `${SITE}${path}#api`, name: `PropSports ${s.name} API`, applicationCategory: 'DeveloperApplication', operatingSystem: 'Any', url: `${SITE}${path}`, description, publisher: { '@id': ORG_ID }, brand: { '@id': BRAND_ID }, isAccessibleForFree: false,
        offers: { '@type': 'Offer', name: `Single Sport — ${s.name}`, price: String(planBy('SINGLE').price), priceCurrency: 'USD', url: `${SITE}/pricing`, priceSpecification: { '@type': 'UnitPriceSpecification', price: String(planBy('SINGLE').price), priceCurrency: 'USD', unitText: 'MONTH' } } }
    : null;
  const graph = [ORG, BRAND, WEBSITE, crumbs([['PropSports API', '/'], ['Sports', '/#network'], [`${s.name} ${s.api ? 'API' : 'Intelligence'}`, path]]), webpage(path, title, description, s.api ? { about: { '@id': `${SITE}${path}#api` } } : {}), ...(appNode ? [appNode] : [])];
  const castName = { mlb: 'MLB PBEcast', nfl: 'NFL PBEcast', nba: 'NBACast', wnba: 'WNBACast', nhl: 'NHL PBEcast', tennis: 'Tennis PBEcast', soccer: 'Soccer PBEcast' }[s.id];
  let n = 0;
  const sec = () => String(++n).padStart(2, '0');

  return `${head({ title, description, path, graph })}
${nav()}
<main id="main" style="--c:${s.color}">
<section class="sp-hero dark">
  <div class="sp-hero-media"><img src="${s.media}" alt="" width="720" height="480" decoding="async"></div>
  <div class="wrap sp-hero-in">
    <nav class="crumbs" aria-label="Breadcrumb"><a href="/">PropSports</a> / <a href="/#network">Sports</a> / ${s.name}</nav>
    <div class="sp-hero-copy">
      <p class="eyebrow" style="gap:12px">${s.name.toUpperCase()} ${s.api ? 'API' : 'INTELLIGENCE API'}</p>
      <h1>${esc(s.headline)}</h1>
      <p class="hero-lead">${esc(s.summary)}</p>
      <div class="hero-actions">${cta}</div>
    </div>
    <div class="sp-facts">
      <div><span>Documented routes</span><b>${total}</b></div>
      <div><span>Base path</span><b class="mono">${s.api ? '/' + s.id : '/v1/ufc'}</b></div>
      <div><span>Host</span><b class="mono">${esc(host.replace('https://', ''))}</b></div>
      <div><span>Live cache</span><b>${esc(s.cache)}</b></div>
    </div>
  </div>
</section>
<section class="sec white" aria-labelledby="story-h">
  <div class="wrap">
    <div class="story">
      <div class="story-lead"><p class="label"><b>${sec()}</b> Why ${s.name}</p><h2 id="story-h">${esc(story.value)}</h2>
        <div class="story-uses"><p class="story-k">Built for</p><ul>${story.uses.map(([h, p]) => `<li><strong>${esc(h)}</strong><span>${esc(p)}</span></li>`).join('')}</ul></div></div>
      <div class="story-points">${story.points.map(([h, p]) => `<article><h3>${esc(h)}</h3><p>${esc(p)}</p></article>`).join('')}</div>
    </div>
  </div>
</section>
<section class="sec" id="live" aria-labelledby="pv-h">
  <div class="wrap">
    <div class="sec-head"><div><p class="label"><b>${sec()}</b> Live now</p><h2 id="pv-h">${s.name} on the network, right now.</h2><p class="sec-lead">A real event read from the same ${s.api ? 'open route customers call' : 'UFC platform feed'}, refreshed every ${C.REFRESH_SECONDS} seconds.${castName ? ` Open it in ${castName} for the full live cast.` : ''}</p></div></div>
    <div class="pv" data-live-preview="${s.id}" aria-live="polite">
      <div class="pv-meta" data-preview-meta><i class="pv-dot"></i>Connecting…</div>
      <div class="pv-body" data-preview-body><div class="pv-card pv-skel"><span></span><span></span><span></span></div></div>
    </div>
  </div>
</section>
<section class="sec alt" aria-labelledby="cap-h">
  <div class="wrap">
    <div class="sec-head"><div><p class="label"><b>${sec()}</b> Capabilities</p><h2 id="cap-h">What the ${s.name} API covers.</h2></div></div>
    <div class="caps">${capCols.map(([h, items]) => `
      <div><h3>${esc(h)}</h3><ul>${items.map((c) => `<li>${esc(c)}</li>`).join('')}</ul></div>`).join('')}
    </div>
  </div>
</section>
<section class="sec" id="endpoints" aria-labelledby="ep-h">
  <div class="wrap">
    <div class="sec-head"><div><p class="label"><b>${sec()}</b> Endpoints</p><h2 id="ep-h">${total} documented ${s.name} routes.</h2><p class="sec-lead">Every ${s.name} route in the ${s.api ? 'production catalog' : 'UFC platform'}, all <code>GET</code> on <code>${esc(host)}</code>.</p></div></div>
    ${endpointGroups(groups)}
  </div>
</section>
<section class="sec alt" aria-labelledby="ex-h">
  <div class="wrap">
    <div class="sec-head"><div><p class="label"><b>${sec()}</b> Example</p><h2 id="ex-h">Example request and response.</h2><p class="sec-lead">Captured from production.</p></div></div>
    ${consoleBlock(tabs, tabs[0].id)}
  </div>
</section>
<section class="sec white" aria-labelledby="notes-h">
  <div class="wrap split">
    <div><p class="label"><b>${sec()}</b> Data notes</p><h2 id="notes-h">Depth and availability.</h2><p class="sec-lead">Where the data comes from, and what it deliberately does not claim.</p></div>
    <ul class="facts-list">
      <li><b>SOURCES</b>${esc(s.sources)}</li>
      <li><b>ACCESS</b>${s.api ? `Single Sport ($${planBy('SINGLE').price}/mo), Developer (up to ${C.DEVELOPER_MAX_SPORTS} sports, $${planBy('DEVELOPER').price}/mo) or any all-sports plan from $${planBy('ALL_SPORTS').price}/mo. Every plan that covers ${s.name} includes all ${total} routes.` : 'Keys and billing are handled on the UFC platform.'}</li>
      ${NOTES[s.id].map((x) => `<li><b>NOTE</b>${esc(x)}</li>`).join('\n      ')}
    </ul>
  </div>
</section>
<section class="sec" aria-labelledby="cta-h">
  <div class="wrap">
    <div class="cta-band"><div><h2 id="cta-h" style="font:700 24px var(--display);color:var(--ink);letter-spacing:-.02em">${s.api ? `Build on ${s.name} data` : 'Build on UFC intelligence'}</h2><p>${links}</p></div><div class="acts">${cta}</div></div>
    <p class="label" style="margin-top:48px">Other sports</p>
    <nav class="sport-strip" aria-label="Other sports">${C.SPORTS.map((o) => `<a href="/sports/${o.id}" style="--c:${o.color}"${o.id === s.id ? ' aria-current="page"' : ''}>${o.name}${mark(o.id)}</a>`).join('')}</nav>
  </div>
</section>
</main>
${footer()}
${scripts(true)}`;
}

/* ── MLB Edge Suite (separate specialist product built on PropSports MLB data) ── */
const EDGE_TITLE = 'MLB Edge Suite — Five Pregame MLB Signal APIs | PropSports';
const EDGE_DESC = 'MLB Edge Suite: Almost Bomb streaks, pitcher punishment scores, lucky home runs, ball-flight conditions and a composite MLB intelligence layer on one key.';
const EDGE_SIGNALS = [
  ['Streak detector', ['Inferno · 4+ days', 'Hot · 3 days', 'Warming · 2 days']],
  ['Fade signal', ['70+ getting hit hard', '50+ leaking', 'Under 30 cruising']],
  ['Regression', ['Gift · 30+', 'Lucky · 15+', 'Monitor']],
  ['Atmospheric', ['Air density ranked', 'Extra carry in feet', 'Temperature vs park normal']],
  ['Composite', ['Umpire grades A–F', 'HR score 0–100', 'Park, wind and temperature']]
];
const EDGE_FOUNDATION = [
  ['/mlb/statcast/batters', 'Exit velocity, barrel %, xBA / xSLG / xwOBA'],
  ['/mlb/statcast/pitchers', 'Pitcher contact quality and strikeout trends'],
  ['/mlb/weather/all', 'Wind, temperature and park factor per game'],
  ['/mlb/umpires', 'Umpire crews for every game'],
  ['/mlb/odds/model', 'PropBetEdge Poisson model prices']
];
function edgePage() {
  const E = C.EDGE, path = '/mlb-edge', mlb = sportById.mlb;
  const ready = !!E.checkoutReady;
  const mail = (subject) => `mailto:sales@proptechusa.ai?subject=${encodeURIComponent(subject)}`;
  const planCta = (p) => ready
    ? `<button type="button" class="btn ${p.featured ? 'btn-primary' : 'btn-line'}" data-checkout="${p.id}">Subscribe — $${p.price}/mo</button>`
    : `<a class="btn ${p.featured ? 'btn-primary' : 'btn-line'}" href="${mail(`MLB Edge Suite ${p.name} access`)}">Request ${p.name} access</a>`;
  const heroCta = ready
    ? `<button type="button" class="btn btn-primary" data-checkout="${E.plans[0].id}">Get MLB Edge — $${E.plans[0].price}/mo</button>`
    : `<a class="btn btn-primary" href="${mail('MLB Edge Suite access')}">Request MLB Edge access <span aria-hidden="true">→</span></a>`;
  const graph = [ORG, BRAND, WEBSITE, crumbs([['PropSports API', '/'], ['MLB Edge Suite', path]]),
    webpage(path, EDGE_TITLE, EDGE_DESC, { about: { '@type': 'Service', name: 'MLB Edge Suite', provider: { '@id': ORG_ID },
      offers: E.plans.map((p) => ({ '@type': 'Offer', name: `MLB Edge Suite ${p.name}`, price: String(p.price), priceCurrency: 'USD', availability: ready ? 'https://schema.org/InStock' : 'https://schema.org/PreOrder' })) } })];
  return `${head({ title: EDGE_TITLE, description: EDGE_DESC, path, graph })}
${nav()}
<main id="main" style="--c:${mlb.color}">
<section class="sp-hero dark">
  <div class="sp-hero-media"><img src="${mlb.media}" alt="" width="720" height="480" decoding="async"></div>
  <div class="wrap sp-hero-in">
    <nav class="crumbs" aria-label="Breadcrumb"><a href="/">PropSports</a> / <a href="/sports/mlb">MLB</a> / MLB Edge Suite</nav>
    <div class="sp-hero-copy">
      <p class="eyebrow">MLB EDGE SUITE</p>
      <h1>Five MLB edge signals before first pitch.</h1>
      <p class="hero-lead">Almost Bombs, Pitcher Intelligence, Lucky Bombs, Ball Flight and MLB Intelligence — pregame signals built on the PropSports MLB dataset, for builders, analysts, apps and media products.</p>
      <div class="hero-actions">${heroCta}<a class="btn btn-line" href="/sports/mlb">Explore the MLB API</a></div>
    </div>
    <div class="sp-facts">
      <div><span>Signal APIs</span><b>${E.products.length}</b></div>
      <div><span>Plans from</span><b>$${Math.min(...E.plans.map((p) => p.price))}/mo</b></div>
      <div><span>Daily requests</span><b>${fmt(Math.min(...E.plans.map((p) => p.limit)))} – ${fmt(Math.max(...E.plans.map((p) => p.limit)))}</b></div>
      <div><span>Built on</span><b>PropSports MLB</b></div>
      <div><span>Access</span><b>${ready ? 'Stripe checkout · key by email' : 'Provisioned by our team'}</b></div>
    </div>
  </div>
</section>
${ready ? '' : `<div class="notice"><div class="wrap"><p><b>Direct checkout for MLB Edge is being re-enabled.</b> Request access and our team provisions your key and billing directly. The MLB data underneath — Statcast, weather, umpires and model prices — is available now on any PropSports plan that includes MLB.</p></div></div>`}
<section class="sec white" aria-labelledby="edge-h">
  <div class="wrap">
    <div class="sec-head"><div><p class="label"><b>01</b> The suite</p><h2 id="edge-h">Each signal covers a different blind spot.</h2><p class="sec-lead">Hard contact that did not clear the wall, pitchers getting hit hard, home runs to fade, ball-flight conditions and an all-in-one game environment layer.</p></div></div>
    <div class="edge-grid">${E.products.map(([h, p], i) => `
      <article class="edge-card"><span class="edge-n">${String(i + 1).padStart(2, '0')} · ${esc(EDGE_SIGNALS[i][0])}</span><h3>${esc(h)}</h3><p>${esc(p)}</p><ul class="edge-tiers">${EDGE_SIGNALS[i][1].map((t) => `<li>${esc(t)}</li>`).join('')}</ul></article>`).join('')}
    </div>
  </div>
</section>
<section class="sec alt" aria-labelledby="found-h">
  <div class="wrap split">
    <div><p class="label"><b>02</b> Foundation</p><h2 id="found-h">Built on the PropSports MLB dataset.</h2><p class="sec-lead">MLB Edge signals are derived from the same owned Statcast tables, game environment and model output the <a class="link" href="/sports/mlb">MLB API</a> serves — ${N.PER_SPORT.mlb} documented MLB routes.</p></div>
    <ul class="ep-list edge-found">${EDGE_FOUNDATION.map(([r, d]) => `<li><span class="method">GET</span><div><code>${esc(r)}</code><span>${esc(d)}</span></div></li>`).join('')}</ul>
  </div>
</section>
<section class="sec" id="pricing" aria-labelledby="edge-price-h">
  <div class="wrap">
    <div class="sec-head"><div><p class="label"><b>03</b> Plans</p><h2 id="edge-price-h">Start small. Scale when it works.</h2><p class="sec-lead">All five MLB Edge signal APIs on every plan. MLB Edge is billed separately from PropSports API plans.</p></div></div>
    <div class="plans edge-plans">${E.plans.map((p) => `
      <article class="plan${p.featured ? ' featured' : ''}" aria-labelledby="${p.id}-h">${p.featured ? '<span class="plan-badge">Most popular</span>' : ''}
        <div class="plan-top"><h3 id="${p.id}-h">${esc(p.name)}</h3></div>
        <div class="plan-price"><span class="cur">$</span><span>${fmt(p.price)}</span><span class="per">/mo</span></div>
        ${planCta(p)}
        <ul class="plan-feats"><li><span>All ${E.products.length} MLB Edge signal APIs</span></li><li><span><b class="num">${fmt(p.limit)}</b> requests / day</span></li><li><span>One API key</span></li><li><span>Cancel anytime</span></li></ul>
      </article>`).join('')}
      <article class="plan" aria-labelledby="EDGE_ENT-h">
        <div class="plan-top"><h3 id="EDGE_ENT-h">Enterprise</h3><span class="plan-tag">Custom</span></div>
        <div class="plan-price"><span style="font-size:34px">Let’s talk</span></div>
        <a class="btn btn-line" href="${mail('MLB Edge Suite Enterprise')}">Contact sales</a>
        <ul class="plan-feats"><li><span>White-label and resale discussion</span></li><li><span>Volume beyond ${fmt(Math.max(...E.plans.map((p) => p.limit)))} requests / day</span></li><li><span>Priority support</span></li></ul>
      </article>
    </div>
    <div class="plan-foot"><span>Questions: <a class="link" href="mailto:sales@proptechusa.ai">sales@proptechusa.ai</a> · <a class="link" href="tel:18887843881">1-888-784-3881</a></span><span><a class="link" href="${PORTAL}" target="_blank" rel="noopener">Manage an existing subscription</a></span></div>
  </div>
</section>
<section class="sec white" aria-labelledby="edge-cta-h">
  <div class="wrap">
    <div class="cta-band"><div><h2 id="edge-cta-h" style="font:700 24px var(--display);color:var(--ink);letter-spacing:-.02em">Need the raw MLB data today?</h2><p>The PropSports MLB API includes Statcast, game environment, standings, teams, minor leagues and model prices — $${planBy('SINGLE').price}/mo.</p></div><div class="acts"><button type="button" class="btn btn-primary" data-checkout="MLB">Get MLB API key — $${planBy('SINGLE').price}/mo</button><a class="btn btn-line" href="/sports/mlb">MLB API details</a></div></div>
  </div>
</section>
</main>
${footer()}
${scripts(false)}`;
}

/* ── API reference ───────────────────────────────────── */
const REF_TITLE = 'PropSports API Reference — Routes by Sport';
const REF_DESC = `Every documented PropSports API route across ${listNames(coreNames)}, grouped by sport with descriptions and base URL.`;
function reference() {
  const graph = [ORG, BRAND, WEBSITE, crumbs([['PropSports API', '/'], ['API Reference', '/reference']]),
    { '@type': 'TechArticle', '@id': `${SITE}/reference#article`, headline: 'PropSports API Reference', description: REF_DESC, url: `${SITE}/reference`, inLanguage: 'en-US', isPartOf: { '@id': SITE_ID }, publisher: { '@id': ORG_ID }, about: { '@id': API_ID }, image: OG_IMAGE }];
  const summary = `<div class="ref-sum-wrap"><table class="ref-sum">
      <thead><tr><th scope="col">Sport</th><th scope="col">Routes</th></tr></thead>
      <tbody>${coreSports.map((s) => `<tr style="--c:${s.color}"><th scope="row"><a href="#${s.id}">${mark(s.id)}${s.name}</a></th><td class="num"><b>${N.PER_SPORT[s.id]}</b></td></tr>`).join('')}</tbody>
      <tfoot><tr><th scope="row">All sports</th><td class="num"><b>${endpoints()}</b></td></tr></tfoot>
    </table></div>`;
  return `${head({ title: REF_TITLE, description: REF_DESC, path: '/reference', graph })}
${nav('reference')}
<main id="main">
<section class="sp-hero dark" style="--c:var(--accent)">
  <div class="wrap sp-hero-in">
    <nav class="crumbs" aria-label="Breadcrumb"><a href="/">PropSports</a> / API Reference</nav>
    <div class="sp-hero-copy"><p class="eyebrow">API REFERENCE</p><h1>Every route, by sport.</h1><p class="hero-lead">All ${endpoints()} routes in the PropSports production catalog, grouped by sport with descriptions and examples. Walkthroughs live in the <a class="link" href="/docs">documentation</a>.</p></div>
    <div class="sp-facts">
      <div><span>Documented routes</span><b>${endpoints()}</b></div>
      <div><span>Base URL</span><b class="mono">${esc(C.API_BASE.replace('https://', ''))}</b></div>
      <div><span>Auth</span><b class="mono">X-API-Key or ?key=</b></div>
      <div><span>Machine-readable</span><b class="mono"><a href="${C.API_BASE}/sports" target="_blank" rel="noopener">GET /sports</a></b></div>
    </div>
  </div>
</section>
<section class="sec white" id="catalog" aria-labelledby="ref-catalog">
  <div class="wrap">
    <div class="sec-head"><div><p class="label">Catalog</p><h2 id="ref-catalog">${endpoints()} routes across ${coreSports.length} sports.</h2><p class="sec-lead">Counts come from production: <a class="link" href="${C.API_BASE}/health" target="_blank" rel="noopener">GET /health</a> totals and <a class="link" href="${C.API_BASE}/sports" target="_blank" rel="noopener">GET /sports</a>. Prefixes <code>/v1/</code> and <code>/api/</code> are accepted.</p></div></div>
    ${summary}
  </div>
</section>
${coreSports.map((s, i) => `<section class="sec${i % 2 ? '' : ' alt'}" id="${s.id}" aria-labelledby="ref-${s.id}">
  <div class="wrap">
    <div class="sec-head"><div>${tag(s.id)}<h2 id="ref-${s.id}">${s.name} · ${N.PER_SPORT[s.id]} documented routes</h2><p class="sec-lead"><a class="link" href="/sports/${s.id}">${s.name} API overview →</a></p></div></div>
    ${endpointGroups(C.ROUTES[s.id])}
  </div>
</section>`).join('\n')}
<section class="sec white" id="ufc" aria-labelledby="ref-ufc"><div class="wrap"><div class="cta-band"><div><h2 id="ref-ufc" style="font:700 24px var(--display);color:var(--ink);letter-spacing:-.02em">UFC Intelligence API</h2><p>UFC routes are served from ufc-api.propbetedge.ai with their own keys and are not counted in the PropSports catalog. <a class="link" href="/sports/ufc">UFC overview →</a></p></div><div class="acts"><a class="btn btn-line" href="https://ufc.proptechusa.ai/docs" target="_blank" rel="noopener">UFC developer docs ↗</a></div></div></div></section>
</main>
${footer()}
${scripts(false)}`;
}

/* ── legacy pages: owned <head> block + factual corrections ── */
const LEGACY = {
  'docs.html': { path: '/docs', crumbs: [['PropSports API', '/'], ['Documentation', '/docs']] },
  'mlb.html': { path: '/mlb', crumbs: [['PropSports API', '/'], ['MLB API guide', '/mlb']] },
  'nfl.html': { path: '/nfl', crumbs: [['PropSports API', '/'], ['NFL API guide', '/nfl']] },
  'nba.html': { path: '/nba', crumbs: [['PropSports API', '/'], ['NBA API guide', '/nba']] },
  'nhl.html': { path: '/nhl', crumbs: [['PropSports API', '/'], ['NHL API guide', '/nhl']] },
  'live.html': { path: '/live', crumbs: [['PropSports API', '/'], ['Powering PropBetEdge', '/live']] },
  'terms.html': { path: '/terms', crumbs: [['PropSports API', '/'], ['Terms', '/terms']] },
  'privacy.html': { path: '/privacy', crumbs: [['PropSports API', '/'], ['Privacy', '/privacy']] },
  'propdata-core.html': { path: '/propdata-core', crumbs: [['PropSports API', '/'], ['PropData Core', '/propdata-core']] },
  'propdata-pro.html': { path: '/propdata-pro', crumbs: [['PropSports API', '/'], ['PropData Pro', '/propdata-pro']] },
  'dashboard.html': { path: '/dashboard', noindex: true }
};
const SEVEN = 'MLB · NFL · NBA · WNBA · NHL · Tennis · Soccer';
const FIXES = [
  [/\b(?:31|47|59|106|125)(\s+)(endpoints|Endpoints)\b/g, (m, sp, word) => `${CATALOG}${sp}${word}`],
  [/MLB · NFL · NBA · NHL<\/strong> one platform/g, `${SEVEN}</strong> one platform`],
  [/<li>MLB · NFL · NBA · NHL<\/li>/g, `<li>${SEVEN}</li>`],
  [/(<span class="pck">✓<\/span>) MLB · NFL · NBA · NHL<\/li>/g, `$1 ${SEVEN}</li>`],
  [/upgrade to MLB, NFL, NBA, and NHL on one (API )?key/g, 'upgrade to all seven core sports on one $1key'],
  [/unlock MLB, NFL, NBA, and NHL on one API key/g, 'unlock all seven core sports on one API key'],
  [/Basic unlocks MLB, NFL, NBA, and NHL for \$49\/mo/g, 'Basic unlocks all seven core sports for $49/mo'],
  [/MLB, NFL, NBA, and NHL APIs with flat monthly pricing/g, 'MLB, NFL, NBA, WNBA, NHL, tennis and soccer APIs with flat monthly pricing'],
  [/Real-time MLB, NFL, NBA and NHL data/g, 'Real-time MLB, NFL, NBA, WNBA, NHL, tennis and soccer data'],
  [/API endpoints for MLB, NFL, NBA, and NHL data/g, 'API endpoints for MLB, NFL, NBA, WNBA, NHL, tennis and soccer data'],
  [/Updated 6× daily\./g, 'Refreshed by the PropBetEdge odds engine.'],
  [/<li>(?:<span class="pck">✓<\/span> )?(?:3 API keys|10 API keys|Priority email \(24hr\)|Priority email support|Historical \/ backtest data|Email \+ Slack \(4hr\)|Email \+ Slack support|99\.5% uptime target|Dedicated Slack \+ 1hr support path)<\/li>\s*/g, ''],
  [/<div class="eyebrow">v4\.2 &mdash; Updated June 2026<\/div>/g, '<div class="eyebrow">API v6.0</div>'],
  [/<h2>Overview<\/h2>/, `<h1 style="font-family:'Syne',sans-serif;font-size:28px;font-weight:800;letter-spacing:-0.5px;color:var(--ink);margin-bottom:10px;">PropSports API documentation</h1>`]
];

/* ── legacy pricing → PropSports 2026 V2 (idempotent) ── */
const LEGACY_PRICE_PAGES = { 'mlb.html': 'MLB', 'nfl.html': 'NFL', 'nba.html': 'NBA', 'nhl.html': 'NHL', 'live.html': null };
function v2Panel(sportId) {
  const sport = sportId ? sportById[sportId.toLowerCase()] : null;
  const single = planBy('SINGLE'), dev = planBy('DEVELOPER'), all = planBy('ALL_SPORTS');
  const card = (p) => `<div style="background:#fff;border:1px solid ${p.featured ? '#D73B1A' : '#EAE7DF'};border-radius:12px;padding:18px 18px 16px;${p.featured ? 'box-shadow:0 18px 40px -20px rgba(215,59,26,.5);' : ''}">
        <div style="font:700 11px/1 system-ui,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:${p.featured ? '#D73B1A' : '#6A7280'}">${esc(p.name)}${p.badge ? ` · ${esc(p.badge)}` : ''}</div>
        <div style="margin-top:10px;font:700 32px/1 system-ui,sans-serif;color:#12151B">$${fmt(p.price)}<span style="font:500 13px system-ui,sans-serif;color:#6A7280">/mo</span></div>
        <div style="margin-top:8px;font:400 13.5px/1.45 system-ui,sans-serif;color:#454C57">${esc(p.sports)}<br>${fmt(p.limit)} requests/day</div></div>`;
  const cta = sport
    ? `<button type="button" onclick="doCheckout('${sportId}')" style="cursor:pointer;border:0;border-radius:8px;background:#D73B1A;color:#fff;font:600 15px system-ui,sans-serif;padding:14px 20px">Get ${sport.name} API key — $${single.price}/mo →</button>`
    : `<button type="button" onclick="doCheckout('ALL_SPORTS')" style="cursor:pointer;border:0;border-radius:8px;background:#D73B1A;color:#fff;font:600 15px system-ui,sans-serif;padding:14px 20px">Get All Sports — $${all.price}/mo →</button>`;
  return `<!-- ps:pricing -->
<section id="pricing" style="padding:80px 20px;background:#F5F3EE;border-top:1px solid #EAE7DF;border-bottom:1px solid #EAE7DF">
  <div style="max-width:1160px;margin:0 auto">
    <p style="font:700 12px/1 system-ui,sans-serif;letter-spacing:.16em;text-transform:uppercase;color:#D73B1A;margin:0">PropSports API pricing</p>
    <h2 style="margin:14px 0 0;font:700 clamp(28px,3.4vw,40px)/1.1 system-ui,sans-serif;letter-spacing:-.02em;color:#12151B">${sport ? `Start with ${sport.name} for $${single.price}/mo.` : `Plans from $${single.price}/mo.`}</h2>
    <p style="margin:12px 0 0;max-width:640px;font:400 17px/1.6 system-ui,sans-serif;color:#454C57">One sport $${single.price}/mo · up to three sports $${dev.price}/mo · all ${coreSports.length} core sports $${all.price}/mo. Pro, Scale and Enterprise add production volume. API key emailed after checkout; cancel anytime.</p>
    <div style="margin-top:28px;display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:12px">${C.PLANS.map(card).join('')}</div>
    <div style="margin-top:24px;display:flex;flex-wrap:wrap;align-items:center;gap:12px 20px">${cta}<a href="/pricing" style="font:600 15px system-ui,sans-serif;color:#12151B;text-decoration:underline;text-underline-offset:3px">Compare all plans, including Developer →</a></div>
  </div>
</section>
<!-- /ps:pricing -->`;
}
function replacePricingSection(file, html, panel) {
  const marked = html.match(/<!-- ps:pricing -->[\s\S]*?<!-- \/ps:pricing -->/);
  if (marked) return html.replace(marked[0], panel);
  let start = html.search(/<section\b[^>]*\bid="pricing"[^>]*>/);
  if (start < 0 && file === 'mlb.html') start = html.indexOf('<div class="pricing-section"');
  if (start < 0 && file === 'live.html') start = html.lastIndexOf('<section', html.indexOf('Choose one sport or unlock all seven'));
  if (start < 0) throw new Error('pricing section not found in ' + file);
  const tag = html.slice(start + 1).match(/^[a-z]+/)[0];
  const re = new RegExp('<' + tag + '\\b|</' + tag + '>', 'g');
  re.lastIndex = start;
  let depth = 0, end = -1, m;
  while ((m = re.exec(html))) {
    depth += m[0].startsWith('</') ? -1 : 1;
    if (depth === 0) { end = m.index + m[0].length; break; }
  }
  if (end < 0) throw new Error('unbalanced pricing block in ' + file);
  return html.slice(0, start) + panel + html.slice(end);
}
const docsRateTable = () => `<table class="param-table">
        <thead><tr><th>Plan</th><th>Daily Requests</th><th>Sports</th><th>Price</th></tr></thead>
        <tbody>
          <tr><td>Demo</td><td>20 req/hr (global cap)</td><td>MLB only</td><td>$0</td></tr>
${C.PLANS.map((p) => `          <tr><td>${esc(p.name)}</td><td>${fmt(p.limit)}</td><td>${esc(p.sports)}</td><td>$${fmt(p.price)}/mo</td></tr>`).join('\n')}
        </tbody>
      </table>`;
const termsRows = () => `<tbody>
        <tr>
          <td>Demo</td>
          <td>MLB only (eval)</td>
          <td>20 req/hr global cap</td>
          <td>$0/mo</td>
        </tr>
${C.PLANS.map((p) => `        <tr>
          <td>${esc(p.name)}</td>
          <td>${p.checkout === 'single' ? '1 sport — MLB, NFL, NBA, WNBA, NHL, Tennis or Soccer' : p.checkout === 'developer' ? 'Up to 3 sports from the 7 core sports' : 'MLB + NFL + NBA + WNBA + NHL + Tennis + Soccer'}</td>
          <td>${fmt(p.limit)} req/day</td>
          <td>$${fmt(p.price)}/mo</td>
        </tr>`).join('\n')}
      </tbody>`;
function legacyPricing(file, html) {
  if (file in LEGACY_PRICE_PAGES) {
    html = replacePricingSection(file, html, v2Panel(LEGACY_PRICE_PAGES[file]));
    html = html.replace(/((?:var|const|let)\s+PRICE_IDS\s*=\s*)\{[\s\S]*?\}/, (m, decl) => decl + JSON.stringify(C.PRICE_IDS));
    html = html.replace(/doCheckout\('BASIC'\)/g, "doCheckout('ALL_SPORTS')").replace(/doCheckout\('ULTRA'\)/g, "doCheckout('SCALE')")
      .replace(/\bBASIC:'/g, "ALL_SPORTS:'").replace(/\bULTRA:'/g, "SCALE:'")
      .replace(/tier === 'BASIC'/g, "tier === 'ALL_SPORTS'").replace(/tier === 'ULTRA'/g, "tier === 'SCALE'")
      .replace(/Get Basic — \$49\/mo/g, () => `Get All Sports — $${planBy('ALL_SPORTS').price}/mo`)
      .replace(/Start Basic — \$49\/mo/g, () => `Start All Sports — $${planBy('ALL_SPORTS').price}/mo`)
      .replace(/Pro — \$99\/mo/g, () => `Pro — $${planBy('PRO').price}/mo`)
      .replace(/(Get|Upgrade) Ultra — \$249\/mo/g, (m, verb) => `${verb} Scale — $${planBy('SCALE').price}/mo`)
      .replace(/All sports basic/g, 'All sports')
      .replace(/\$19(?![\d,])/g, () => `$${planBy('SINGLE').price}`)
      .replace(/\$49(?![\d,])/g, () => `$${planBy('ALL_SPORTS').price}`)
      .replace(/"price":"19"/g, () => `"price":"${planBy('SINGLE').price}"`)
      .replace(/>47<\/div>(\s*<div class="hc-text">Endpoints)/g, (m, rest) => `>${CATALOG}</div>${rest}`)
      .replace(/href="#plans"/g, 'href="#pricing"');
  }
  if (file === 'docs.html') {
    const sub = (from, to) => { html = html.split(from).join(to); };
    html = html.replace(/<title>[\s\S]*?<\/title>/, () => `<title>PropSports API Documentation — ${CATALOG} Endpoints, ${coreSports.length} Sports</title>`)
      .replace(/<meta\s+name="description"\s+content="[^"]*">/, () => `<meta name="description" content="PropSports API documentation: authentication, rate limits and code examples for ${CATALOG} endpoints across ${listNames(coreNames.map((n) => n === 'Tennis' || n === 'Soccer' ? n.toLowerCase() : n))}.">`);
    sub('From $19/mo · All sports $49/mo', `From $${planBy('SINGLE').price}/mo · All sports $${planBy('ALL_SPORTS').price}/mo`);
    sub('&#9889; PropSports API — From $49/mo', `&#9889; PropSports API — From $${planBy('SINGLE').price}/mo`);
    html = html.replace(/<table class="param-table">\s*<thead><tr><th>Plan<\/th><th>Daily Requests<\/th>[\s\S]*?<\/table>/, () => docsRateTable());
    sub('Daily limits reset at midnight UTC.', 'Daily counters roll over on the US Eastern calendar date.');
    sub('Subscribe at Basic $49/mo for your own key with 50K req/day.', `Plans start at $${planBy('SINGLE').price}/mo for one sport (${fmt(planBy('SINGLE').limit)} req/day); all ${coreSports.length} core sports from $${planBy('ALL_SPORTS').price}/mo.`);
    sub('Subscribe to Basic at $49/mo. Key in your inbox in 60 seconds. Cancel anytime.', `Plans from $${planBy('SINGLE').price}/mo; all ${coreSports.length} core sports from $${planBy('ALL_SPORTS').price}/mo. Key in your inbox after checkout. Cancel anytime.`);
    sub('Get API Key &mdash; From $49/mo &rarr;', `Get API Key &mdash; From $${planBy('SINGLE').price}/mo &rarr;`);
  }
  if (file === 'terms.html') {
    html = html.replace(/(<table class="plan-table">[\s\S]*?<\/thead>\s*)<tbody>[\s\S]*?<\/tbody>/, (m, head) => head + termsRows());
  }
  // internal links to canonical clean URLs
  html = html.replace(/href="\/index\.html"/g, 'href="/"').replace(/href="\/([a-z0-9-]+)\.html(#[^"]*)?"/g, (m, name, hash) => `href="/${name}${hash || ''}"`);
  return html;
}

/* ── legacy copy: RapidAPI removed, catalog and access wording from production (idempotent) ── */
const docsCatalog = () => `<!-- ps:catalog -->
    <div class="doc-section" id="catalog">
      <h2>Route catalog</h2>
      <p>The production catalog has <strong>${CATALOG} documented routes</strong> across ${listNames(coreNames)}. Every route is listed with its access level in the <a href="/reference" style="color:var(--red);">API reference</a>, and machine-readably at <code>GET /sports</code>. <code>GET /health</code> reports the same totals.</p>
      <table class="param-table">
        <thead><tr><th>Sport</th><th>Routes</th><th>Public</th><th>Demo key</th><th>API key</th></tr></thead>
        <tbody>
${coreSports.map((s) => `          <tr><td><a href="/reference#${s.id}" style="color:var(--red);">${s.name}</a></td><td>${N.PER_SPORT[s.id]}</td><td>${perAccess('open', s.id)}</td><td>${perAccess('demo', s.id)}</td><td>${perAccess('key', s.id)}</td></tr>`).join('\n')}
          <tr><td><strong>All sports</strong></td><td><strong>${CATALOG}</strong></td><td>${N.OPEN}</td><td>${N.DEMO}</td><td>${N.KEY}</td></tr>
        </tbody>
      </table>
      <table class="param-table">
        <thead><tr><th>Access level</th><th>What it means</th></tr></thead>
        <tbody>
${['open', 'demo', 'key'].map((a) => `          <tr><td>${A[a].label}</td><td>${esc(ACCESS_HELP[a])}</td></tr>`).join('\n')}
        </tbody>
      </table>
    </div>
<!-- /ps:catalog -->`;
const whatsNew = () => `<div class="alert alert-gold">&#9889; <strong>New in v${API_VERSION || '6.1'}:</strong> MLB standings, teams, team profiles, rosters and team schedules; NBA standings, teams, team profiles, rosters, team schedules and team stats; affiliated minor leagues from Triple-A to Rookie. ${CATALOG} documented routes.</div>`;
function legacyCopy(file, html) {
  const sub = (from, to) => { html = html.split(from).join(to); };
  if (file === 'docs.html') {
    // marketplace listings are gone; the direct API key is the only way to buy
    html = html.replace(/\s*<div class="nav-dd-divider"><\/div>\s*<a href="https:\/\/rapidapi\.com[^"]*"[^>]*class="nav-dd-item">[\s\S]*?<\/a>/, '');
    sub('<a href="#rapidapi" class="sb-link">RapidAPI</a>', '<a href="#catalog" class="sb-link">Route catalog</a>');
    html = html.replace(/<!-- RAPIDAPI -->\s*<div class="doc-section" id="rapidapi">[\s\S]*?<\/div>\s*(?=<!-- ═)/, '<!-- CATALOG -->\n' + docsCatalog() + '\n\n    ')
      .replace(/<!-- ps:catalog -->[\s\S]*?<!-- \/ps:catalog -->/, () => docsCatalog());
    html = html.replace(/<div class="alert alert-gold">&#9889; <strong>New in v[\d.]+:<\/strong>[\s\S]*?<\/div>/, () => whatsNew());
    if (API_VERSION) html = html.replace(/<div class="eyebrow">API v[\d.]+<\/div>/, `<div class="eyebrow">API v${API_VERSION}</div>`);
    sub('<span class="resp-chip green">MLB &middot; NFL &middot; NBA &middot; NHL</span>', '<span class="resp-chip green">MLB &middot; NFL &middot; NBA &middot; WNBA &middot; NHL &middot; Tennis &middot; Soccer</span>');
    html = html.replace(/<span class="key">"error"<\/span>:\s*<span class="str">"Active paid RapidAPI subscription required\."<\/span>,\s*<span class="key">"hint"<\/span>:\s*<span class="str">"Subscribe at rapidapi\.com[^"]*"<\/span>,/,
      '<span class="key">"error"</span>:   <span class="str">"Invalid API key."</span>,\n  <span class="key">"hint"</span>:    <span class="str">"Get a key at propsports.proptechusa.ai/pricing.html"</span>,');
    html = html.replace(/\s*<tr><td class="pn">402<\/td><td>No active paid subscription \(RapidAPI callers\)<\/td><\/tr>/, '');
    html = html.replace(/<a href="https:\/\/rapidapi\.com[^"]*" target="_blank" rel="noopener" class="btn-outline">Also on RapidAPI &#8599;<\/a>/, '<a href="/reference" class="btn-outline">Full API reference &rarr;</a>');
    html = html.replace(/\s*<li><a href="https:\/\/rapidapi\.com\/team[^"]*"[^>]*>RapidAPI Hub &#8599;<\/a><\/li>\s*<li><a href="https:\/\/rapidapi\.com[^"]*"[^>]*>API Listing &#8599;<\/a><\/li>/, '\n          <li><a href="/reference">API Reference</a></li>');
    sub('Real-time MLB, NFL, NBA &amp; NHL. Owned Statcast.', 'Real-time MLB, NFL, NBA, WNBA, NHL, tennis &amp; soccer. Owned Statcast.');
  }
  if (file === 'live.html') html = html.replace(/<li><a href="https:\/\/rapidapi\.com[^"]*"[^>]*>RapidAPI ↗<\/a><\/li>/, '<li><a href="/reference">API Reference</a></li>');
  if (file === 'mlb.html') {
    // the MLB guide quotes the MLB route count; keep it equal to the production catalog
    html = html.replace(/\b\d+ endpoints from \$/g, () => `${N.PER_SPORT.mlb} endpoints from $`).replace(/(id="ep-count">)\d+ endpoints</, (m, a) => `${a}${N.PER_SPORT.mlb} endpoints<`);
    sub('<th>RapidAPI Others</th>', '<th>API marketplaces</th>');
    sub('Other API pricing based on RapidAPI listed plans as of June 2026.', 'Marketplace pricing based on public API-marketplace listings as of June 2026.');
  }
  if (file === 'propdata-core.html' || file === 'propdata-pro.html') {
    html = html.replace(/RapidAPI separately:/g, 'Bought as separate APIs:');
    html = html.replace(/\s*<div class="rapid-note">\s*<div[^>]*>[^<]*<\/div>\s*<div class="rapid-note-body">[\s\S]*?<\/div>\s*<\/div>/, '');
    html = html.replace(/ No RapidAPI \.?/g, ' Direct billing.').replace(/No RapidAPI/g, 'Direct billing');
  }
  return html;
}

function patchLegacy(file, meta) {
  let html = read(file);
  for (const [re, to] of FIXES) html = html.replace(re, to);
  html = legacyPricing(file, html);
  html = legacyCopy(file, html);
  html = html.replace(/<!-- ps:seo -->[\s\S]*?<!-- \/ps:seo -->\s*/g, '')
    .replace(/<link\b[^>]*\brel=["'](?:canonical|icon|shortcut icon|apple-touch-icon|manifest|mask-icon)["'][^>]*>\s*/gi, '')
    .replace(/<meta\b[^>]*\b(?:property|name)=["'](?:og:[^"']*|twitter:[^"']*|theme-color)["'][^>]*>\s*/gi, '');
  if (!/<meta\s+name="description"/i.test(html)) html = html.replace(/<\/title>/, (m) => m + '\n<meta name="description" content="Your PropSports API key and quick-start guide.">');
  const title = (html.match(/<title>([\s\S]*?)<\/title>/) || [])[1].trim();
  const description = (html.match(/<meta\s+name="description"\s+content="([^"]*)"/i) || [])[1] || '';
  const hasLd = /application\/ld\+json/.test(html);
  const ld = !meta.noindex && !hasLd ? '\n' + ldScript([crumbs(meta.crumbs), webpage(meta.path, title, description)]) : '';
  const robots = meta.noindex ? '' : '';
  const block = `<!-- ps:seo -->\n${seoTags({ title: title.replace(/&amp;/g, '&'), description: description.replace(/&amp;/g, '&'), path: meta.path })}${ld}${robots}\n<!-- /ps:seo -->\n`;
  html = html.replace(/<\/title>\s*/, (m) => m + block);
  writeFileSync(join(root, file), html);
}

/* ── write ───────────────────────────────────────────── */
mkdirSync(join(root, 'sports'), { recursive: true });
const out = [];
const write = (rel, html) => { writeFileSync(join(root, rel), html); out.push(rel); };
write('index.html', home());
write('pricing.html', pricingPage());
write('reference.html', reference());
write('mlb-edge.html', edgePage());
C.SPORTS.forEach((s) => write(`sports/${s.id}.html`, sportPage(s)));
for (const [file, meta] of Object.entries(LEGACY)) { patchLegacy(file, meta); out.push(file + ' (head + copy)'); }

write('site.webmanifest', JSON.stringify({
  name: 'PropSports API', short_name: 'PropSports', description: 'Live sports data infrastructure.',
  start_url: '/', scope: '/', display: 'standalone', background_color: '#07090C', theme_color: '#07090C',
  icons: [
    { src: '/assets/brand/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
    { src: '/assets/brand/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    { src: '/assets/brand/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
  ]
}, null, 2) + '\n');
write('robots.txt', `User-agent: *
Allow: /
Disallow: /dashboard
Disallow: /scripts/
Disallow: /index.html.bak_20260411_221818

Sitemap: ${SITE}/sitemap.xml
`);
const PAGES = [['/', 'daily', '1.0'], ['/pricing', 'weekly', '0.9'], ['/reference', 'weekly', '0.9'], ['/docs', 'weekly', '0.8'],
  ...C.SPORTS.map((s) => [`/sports/${s.id}`, 'weekly', '0.8']),
  ['/mlb', 'weekly', '0.7'], ['/nfl', 'weekly', '0.7'], ['/nba', 'weekly', '0.7'], ['/nhl', 'weekly', '0.7'],
  ['/live', 'monthly', '0.6'], ['/mlb-edge', 'monthly', '0.6'], ['/propdata-core', 'monthly', '0.4'], ['/propdata-pro', 'monthly', '0.4'],
  ['/terms', 'yearly', '0.2'], ['/privacy', 'yearly', '0.2']];
write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${PAGES.map(([p, f, pr]) => `  <url><loc>${SITE}${p}</loc><lastmod>${TODAY}</lastmod><changefreq>${f}</changefreq><priority>${pr}</priority></url>`).join('\n')}
</urlset>
`);
console.log(`built ${out.length} files · catalog ${CATALOG} endpoints (${live ? 'production /health + /sports v' + API_VERSION : 'offline fallback'}) · registry ${N.DOCUMENTED_ROUTES} (${accessSummary(N.OPEN, N.DEMO, N.KEY)}) · sitemap ${PAGES.length} URLs`);
