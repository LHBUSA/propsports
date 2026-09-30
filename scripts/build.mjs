// PropSports static site build.
// Generates index.html, sports/*.html, reference.html and sitemap.xml from assets/ps-config.js.
// Usage: node scripts/build.mjs        (no dependencies; output is committed and served as-is)
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import vm from 'node:vm';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const ctx = {};
vm.runInNewContext(readFileSync(join(root, 'assets/ps-config.js'), 'utf8'), { globalThis: ctx, window: undefined }, { filename: 'ps-config.js' });
const C = ctx.PS_CONFIG;
const N = C.COUNTS;
const SITE = C.SITE;
const VERSION = Date.now().toString(36);
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const fmt = (n) => Number(n).toLocaleString('en-US');
const sportById = Object.fromEntries(C.SPORTS.map((s) => [s.id, s]));
const coreSports = C.SPORTS.filter((s) => s.api);
const coreNames = coreSports.map((s) => s.name);
const listNames = (a) => a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1];

/* ── sport marks (monoline, 24px grid) ───────────────── */
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
const BRAND = `<svg viewBox="0 0 32 32" fill="none" aria-hidden="true"><rect x="1" y="1" width="30" height="30" rx="6" stroke="#4F8CFF" stroke-width="2"/><path d="M13.2 7.5L9 17h5.6l-3 7.5 11-11h-6l3.2-6z" fill="#E9EDF2"/></svg>`;

/* ── hero image (optional; emitted only when files exist) ── */
// The master asset is /hero-sports-network.png (1920×819). Optional compressed
// derivatives in assets/hero/ (hero-sports-network[-mobile].avif|webp) are offered first when present.
// Nothing is emitted when no file exists, so the hero never requests a missing image.
function heroMedia() {
  const master = existsSync(join(root, 'hero-sports-network.png')) ? '/hero-sports-network.png' : null;
  const dir = join(root, 'assets/hero');
  const find = (base) => ['avif', 'webp'].filter((ext) => existsSync(join(dir, `${base}.${ext}`)));
  const desk = find('hero-sports-network'), mob = find('hero-sports-network-mobile');
  const img = master || (desk.length ? `/assets/hero/hero-sports-network.${desk[desk.length - 1]}` : null);
  if (!img) return { html: '', preload: '' };
  const type = { avif: 'image/avif', webp: 'image/webp' };
  const sources = [
    ...mob.map((e) => `<source media="(max-width:700px)" type="${type[e]}" srcset="/assets/hero/hero-sports-network-mobile.${e}">`),
    ...desk.map((e) => `<source type="${type[e]}" srcset="/assets/hero/hero-sports-network.${e}">`)
  ].join('');
  return {
    html: `<div class="hero-media" aria-hidden="true"><picture>${sources}<img src="${img}" alt="" width="1920" height="819" fetchpriority="high" decoding="async"></picture></div>`,
    preload: desk.length ? '' : `<link rel="preload" as="image" href="${img}" media="(min-width:701px)" fetchpriority="high">`
  };
}

/* ── shared shell ────────────────────────────────────── */
function head({ title, description, path, extra = '' }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${SITE}${path}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="PropSports API">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${SITE}${path}">
<meta name="twitter:card" content="summary">
<meta name="theme-color" content="#07090C">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600&family=Barlow+Condensed:wght@600&display=swap">
<link rel="stylesheet" href="/assets/ps.css?v=${VERSION}">
${extra}<script defer src="https://www.proptechusa.ai/network-analytics.js" data-proptech-surface="propsports"></script>
</head>
<body>`;
}

const chevron = '<svg viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 3.5l3 3 3-3"/></svg>';
function nav(current = '') {
  const sportLinks = C.SPORTS.map((s) => `<a href="/sports/${s.id}" style="--c:${s.color}">${mark(s.id)}<strong>${s.name}</strong></a>`).join('');
  return `<a class="sr-only" href="#main">Skip to content</a>
<header class="nav" id="top">
  <div class="wrap nav-in">
    <a class="brand" href="/" aria-label="PropSports home">${BRAND}PropSports<small>API</small></a>
    <nav class="nav-links" aria-label="Primary">
      <div class="dd"><button type="button" aria-expanded="false" aria-haspopup="true">Products ${chevron}</button>
        <div class="dd-menu">
          <a href="/#platform"><strong>Core Sports API</strong><span>${N.CORE_API_SPORTS} sports and ${N.ENDPOINTS} endpoints on one key</span></a>
          <a href="/#live"><strong>Live Sports Data</strong><span>Schedules, scores and live game state</span></a>
          <a href="/#depth"><strong>Advanced Analytics</strong><span>Statcast, play-by-play, shot and event coordinates</span></a>
          <a href="/#intelligence"><strong>Model Intelligence</strong><span>Model output and DNA systems where available</span></a>
          <a href="/sports/ufc"><strong>UFC Intelligence</strong><span>Dedicated combat-sports platform</span></a>
        </div>
      </div>
      <div class="dd"><button type="button" aria-expanded="false" aria-haspopup="true">Sports ${chevron}</button>
        <div class="dd-menu dd-sports">${sportLinks}<a class="dd-foot" href="/#platform"><strong>Compare coverage</strong><span>Sport-by-sport matrix</span></a></div>
      </div>
      <a href="/reference"${current === 'reference' ? ' aria-current="page"' : ''}>API Reference</a>
      <a href="/#live">Live Network</a>
      <a href="/#pricing">Pricing</a>
      <a href="/docs">Docs</a>
    </nav>
    <div class="nav-cta">
      <a class="btn btn-ghost btn-sm" href="https://billing.stripe.com/p/login/cNi3cv2vY7em3lr4oj7wA00" target="_blank" rel="noopener">Sign in</a>
      <a class="btn btn-primary btn-sm" href="/#pricing">Get API Key <span aria-hidden="true">→</span></a>
      <button class="nav-burger" type="button" aria-label="Menu" aria-expanded="false"><span></span></button>
    </div>
  </div>
</header>
<div class="drawer" aria-label="Menu">
  <h4>SPORTS</h4>
  <div class="drawer-sports">${C.SPORTS.map((s) => `<a href="/sports/${s.id}" style="--c:${s.color}">${mark(s.id)}${s.name}</a>`).join('')}</div>
  <h4>PLATFORM</h4>
  <a href="/#live">Live Network</a><a href="/#platform">Coverage</a><a href="/#console">API Console</a><a href="/reference">API Reference</a><a href="/docs">Docs</a><a href="/#pricing">Pricing</a>
  <h4>ACCOUNT</h4>
  <a href="https://billing.stripe.com/p/login/cNi3cv2vY7em3lr4oj7wA00" target="_blank" rel="noopener">Manage subscription</a>
  <a class="btn btn-primary" href="/#pricing">Get API Key →</a>
</div>`;
}

function footer() {
  return `<footer class="foot">
  <div class="wrap">
    <div class="foot-grid">
      <div>
        <a class="brand" href="/">${BRAND}PropSports<small>API</small></a>
        <p>Real-time sports infrastructure from PropTechUSA.ai. ${N.CORE_API_SPORTS} core API sports, ${N.ENDPOINTS} endpoints and a dedicated UFC intelligence platform.</p>
      </div>
      <div><h4>PLATFORM</h4><a href="/#live">Live Network</a><a href="/#platform">Coverage</a><a href="/#console">API Console</a><a href="/reference">API Reference</a><a href="/docs">Docs</a><a href="/#pricing">Pricing</a></div>
      <div><h4>SPORTS</h4>${C.SPORTS.map((s) => `<a href="/sports/${s.id}">${s.name}</a>`).join('')}</div>
      <div><h4>PRODUCTS</h4><a href="/mlb-edge">MLB Edge Suite</a><a href="https://ufc.proptechusa.ai" target="_blank" rel="noopener">UFC Intelligence</a><a href="https://rapidapi.com/proptechusa/api/propsports-api" target="_blank" rel="noopener">RapidAPI listing</a><a href="https://propdata.proptechusa.ai" target="_blank" rel="noopener">PropData (real estate)</a><a href="/live">Powering PropBetEdge</a></div>
      <div><h4>COMPANY</h4><a href="https://proptechusa.ai" target="_blank" rel="noopener">PropTechUSA.ai</a><a href="https://propbetedge.ai" target="_blank" rel="noopener">PropBetEdge.ai</a><a href="mailto:sales@proptechusa.ai">sales@proptechusa.ai</a><a href="tel:18887843881">1-888-784-3881</a><a href="https://billing.stripe.com/p/login/cNi3cv2vY7em3lr4oj7wA00" target="_blank" rel="noopener">Manage subscription</a></div>
    </div>
    <div class="foot-bottom"><span>© 2026 PropTechUSA.ai · Built on Cloudflare Workers</span><span><a href="/terms" style="display:inline">Terms</a> · <a href="/privacy" style="display:inline">Privacy</a></span></div>
  </div>
</footer>`;
}

const scripts = (live) => `<script src="/assets/ps-config.js?v=${VERSION}"></script>
<script src="/assets/ps.js?v=${VERSION}" defer></script>
${live ? `<script src="/assets/ps-live.js?v=${VERSION}" defer></script>\n` : ''}</body>
</html>
`;

const wire = `<div class="wire" aria-label="PropSports sportswire">
  <div class="wire-label"><i></i><span>SPORTSWIRE</span></div>
  <div class="wire-view"><div class="wire-track" id="wire-track"><span class="wi"><span class="sp">NETWORK</span>Connecting to live feeds…</span></div></div>
</div>`;

/* ── shared fragments ────────────────────────────────── */
const accessLabel = { pub: 'Public', demo: 'Demo key', key: 'API key' };
function endpointGroups(groups, host) {
  return `<div class="ep-groups">${groups.map(([name, routes]) => `
  <div class="ep-group"><h3>${esc(name.toUpperCase())}</h3><ul class="ep-list">${routes.map(([p, d, a]) => `
    <li><span class="method">GET</span><div><code>${esc(p)}</code><span>${esc(d)} · <em style="font-style:normal;color:${a === 'pub' ? 'var(--ok)' : a === 'demo' ? 'var(--warn)' : 'var(--steel)'}">${accessLabel[a]}</em></span></div></li>`).join('')}
  </ul></div>`).join('')}</div>`;
}

function consoleBlock(tabs, first) {
  return `<div class="console" data-console data-first="${first}">
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

const EXAMPLE_PATHS = JSON.parse(readFileSync(join(root, 'assets/api-examples.json'), 'utf8')).examples;

/* ── homepage ────────────────────────────────────────── */
function capList(items, gated = []) {
  if (!items.length && !gated.length) return '<span class="cap na">Not offered</span>';
  return items.map((c) => `<span class="cap">${esc(c)}</span>`).join('') + gated.map((c) => `<span class="cap na">${esc(c)}</span>`).join('');
}
function matrix() {
  const rows = C.SPORTS.map((s) => {
    const m = s.matrix;
    const access = s.api
      ? `<span class="via${s.platform ? '' : ' core'}">${s.platform ? 'Gateway → dedicated platform' : 'Core API'}</span><br><span class="cap">${N.PER_SPORT[s.id]} endpoints</span><span class="cap">${N.PUBLIC_PER_SPORT[s.id]} public</span>`
      : `<span class="via">Separate host</span><br><span class="cap">${N.UFC_ENDPOINTS_LISTED} documented routes</span><span class="cap na">Own API keys</span>`;
    return `<tr style="--c:${s.color}"><th scope="row"><a href="/sports/${s.id}">${mark(s.id)}${s.name}</a><small>/${s.api ? s.id : 'v1/ufc'}</small></th>
      <td>${capList(m.live)}</td><td>${capList(m.pbp)}</td><td>${capList(m.players)}</td><td>${capList(m.teams)}</td><td>${capList(m.adv)}</td><td>${capList(m.models, m.gated || [])}</td><td>${access}</td></tr>`;
  }).join('\n');
  return `<p class="scroll-hint">Scroll horizontally for all columns →</p>
<div class="matrix-wrap"><table class="matrix">
  <thead><tr><th>SPORT</th><th>SCHEDULE &amp; LIVE</th><th>PLAY-BY-PLAY &amp; GAME</th><th>PLAYERS</th><th>TEAMS &amp; STANDINGS</th><th>ADVANCED</th><th>MODELS &amp; DNA</th><th>ACCESS</th></tr></thead>
  <tbody>${rows}</tbody>
</table></div>`;
}

function pricing() {
  const P = C.PLANS;
  const perSportCounts = coreSports.map((s) => N.PER_SPORT[s.id]);
  const cell = (fn) => P.map((p) => `<td${p.featured ? ' class="featured"' : ''}>${fn(p)}</td>`).join('');
  const select = `<label class="sr-only" for="single-sport">Sport</label><select id="single-sport">${coreSports.map((s) => `<option value="${s.id.toUpperCase()}">${s.name} only</option>`).join('')}</select>`;
  return `<div class="price-wrap"><table class="price">
  <thead><tr><th><span class="plan">PLAN</span></th>${P.map((p) => `<th${p.featured ? ' class="featured"' : ''}><div class="plan">${esc(p.name.toUpperCase())}</div><div class="plan-price num">$${fmt(p.price)}<small>/${p.per}</small></div><div class="plan-note">${esc(p.note)}</div></th>`).join('')}</tr></thead>
  <tbody>
    <tr><th>Sports</th>${cell((p) => esc(p.sports))}</tr>
    <tr><th>Requests / day</th>${cell((p) => `<span class="num">${fmt(p.limit)}</span>`)}</tr>
    <tr><th>Endpoints</th>${cell((p) => p.id === 'single' ? `${Math.min(...perSportCounts)}–${Math.max(...perSportCounts)} for the chosen sport` : `All ${N.ENDPOINTS}`)}</tr>
    <tr><th>API key</th>${cell(() => 'Emailed after checkout')}</tr>
    <tr><th>Billing</th>${cell(() => 'Stripe · manage or cancel in portal')}</tr>
  </tbody>
  <tfoot><tr><td></td>${P.map((p) => `<td${p.featured ? ' class="featured"' : ''}>${p.checkout === 'choose' ? select + `<button type="button" class="btn btn-line" data-checkout="choose" data-select="single-sport">Get key</button>` : `<button type="button" class="btn ${p.featured ? 'btn-primary' : 'btn-line'}" data-checkout="${p.checkout}">${p.id === 'ENTERPRISE' ? 'Start Enterprise' : 'Get ' + esc(p.name)}</button>`}</td>`).join('')}</tr></tfoot>
</table></div>
<div class="price-notes">
  <span>Evaluate first: <code>${C.DEMO_KEY}</code> — MLB, ${C.DEMO_LIMIT}.</span>
  <span>${N.PUBLIC_ENDPOINTS} endpoints answer without a key.</span>
  <span>UFC Intelligence is billed on <a class="link" href="https://ufc.proptechusa.ai" target="_blank" rel="noopener">its own platform</a>.</span>
  <span><a class="link" href="https://billing.stripe.com/p/login/cNi3cv2vY7em3lr4oj7wA00" target="_blank" rel="noopener">Manage an existing subscription</a></span>
  <span>Also on <a class="link" href="https://rapidapi.com/proptechusa/api/propsports-api" target="_blank" rel="noopener">RapidAPI</a> · <a class="link" href="mailto:sales@proptechusa.ai">sales@proptechusa.ai</a> · <a class="link" href="tel:18887843881">1-888-784-3881</a></span>
</div>`;
}

const tag = (id) => `<span class="sport-tag" style="--c:${sportById[id].color}">${sportById[id].name.toUpperCase()}</span>`;

function home() {
  const hero = heroMedia();
  const consoleTabs = ['mlb', 'nfl', 'nba', 'nhl', 'wnba', 'tennis', 'soccer', 'ufc'].map((id) => ({ id, sport: id, label: sportById[id].name, path: EXAMPLE_PATHS[id].path.split('?')[0] }));
  const title = 'PropSports API — Real-Time Sports Data & Analytics APIs';
  const description = `Real-time sports data infrastructure: live scores, schedules, play-by-play, players, teams, advanced stats and model output across ${listNames(coreNames)}, plus a dedicated combat-sports intelligence platform.`;
  const depth = [
    ['mlb', 'Owned Statcast intelligence', 'Batter and pitcher Statcast tables, game environment and a Poisson model that prices props from owned data.', ['/mlb/statcast/batters', '/mlb/statcast/pitchers', '/mlb/weather/all', '/mlb/odds/model']],
    ['nfl', 'Drive and play-by-play intelligence', 'Normalized game detail with every play, drive history, game leaders and the win-probability series.', ['/nfl/game/:id/plays', '/nfl/game/:id/drives', '/nfl/game/:id/leaders', '/nfl/game/:id/winprob']],
    ['nba', 'Shot coordinates and lineup reconstruction', 'Play-by-play with court coordinates, shot charts, estimated on-court lineups and TS% / USG% box scores.', ['/nba/game/:id/shotchart', '/nba/game/:id/plays', '/nba/game/:id/lineup', '/nba/game/:id/boxscore']],
    ['tennis', 'Point-level live match state', 'Live point score and server, order of play, tournament editions, rankings and head-to-head records.', ['/tennis/live', '/tennis/today', '/tennis/rankings', '/tennis/h2h/:a/:b']]
  ];
  const layers = [
    ['Player intelligence', 'Profiles, game logs and advanced metrics, plus DNA systems that describe how a player or fighter produces.', ['mlb', 'nba', 'wnba', 'nhl', 'soccer', 'ufc']],
    ['Game intelligence', 'Live state, lineups, play-by-play, shot and event coordinates, drives, live casts and line deployment.', ['mlb', 'nfl', 'nba', 'wnba', 'nhl', 'soccer']],
    ['Model outputs', 'MLB Poisson model prices and the WNBA WinBA index — published as their own routes, never blended into raw data.', ['mlb', 'wnba']],
    ['Historical context', 'Standings, rankings, tournament editions, fight history, game logs and a daily NHL archive.', ['nfl', 'nhl', 'wnba', 'tennis', 'soccer', 'ufc']],
    ['Live state', `Live endpoints on every core sport; NFL, NHL and NBA live routes cache for 2–10 seconds. The network panel above re-polls every ${C.REFRESH_SECONDS} seconds.`, ['mlb', 'nfl', 'nba', 'wnba', 'nhl', 'tennis', 'soccer']]
  ];
  const tiers = [
    ['SPORT SOURCES', 'Upstream feeds', ['MLB StatsAPI', 'ESPN APIs', 'stats.nba.com', 'NHL APIs', 'Open-Meteo', 'DraftKings · FanDuel props', 'Platform-native sources']],
    ['INGEST · NORMALIZE', 'Adapters and workers', ['NFL scoreboard adapter', 'NHL play normalizer', 'NBA box-score math', 'WNBA ingest · 1 min', 'Tennis live poller · 1 min', 'Soccer ingest · 1 min', 'UFC weigh-ins · 1 min', 'NHL archive · daily']],
    ['DATA LAYER', 'Storage', ['Supabase Postgres', 'Workers KV', 'R2 object storage']],
    ['INTELLIGENCE', 'Sport-specific', ['MLB Poisson model', 'Statcast tables', 'NHL shot geometry', 'NHL line deployment', 'WinBA', 'Player DNA', 'Soccer DNA', 'Fight DNA']],
    ['CLOUDFLARE EDGE API', 'propsports-api Worker', ['API-key auth', 'Per-key daily limits', 'Gateway allowlist', 'Per-route caching', 'Source health canaries']],
    ['CUSTOMER APPLICATIONS', 'Your product', ['REST · JSON', 'CORS enabled', 'PropBetEdge sport sites']]
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

  return `${head({ title, description, path: '/', extra: hero.preload ? hero.preload + '\n' : '' })}
${wire}
${nav()}
<main id="main">
<section class="hero${hero.html ? ' has-media' : ''}">
  ${hero.html}<div class="hero-grid" aria-hidden="true"></div>
  <div class="wrap hero-in">
    <div class="hero-copy">
      <div class="eyebrow">PROPSPORTS API</div>
      <h1>One sports data layer.<span>Every game underneath it.</span></h1>
      <p class="hero-lead">Live schedules, scores, players, teams, play-by-play, advanced analytics and proprietary intelligence across the PropSports network — ${N.CORE_API_SPORTS} sports on one API key, plus a dedicated UFC intelligence platform.</p>
      <div class="hero-actions">
        <a class="btn btn-primary" href="#pricing">Get API Key <span aria-hidden="true">→</span></a>
        <a class="btn btn-line" href="#console">Explore API</a>
        <a class="link arrow" href="#live">View live network</a>
      </div>
    </div>
  </div>
</section>

<nav class="rail" aria-label="Sports">
  <div class="wrap"><div class="rail-in">${C.SPORTS.map((s) => `
    <a href="/sports/${s.id}" style="--c:${s.color}"><span class="rail-top"><span class="rail-name">${s.name}</span>${mark(s.id)}</span><span class="rail-state" data-rail="${s.id}">—</span></a>`).join('')}
  </div></div>
</nav>

<section class="sec" id="live" aria-labelledby="live-h">
  <div class="wrap">
    <div class="sec-head">
      <div><div class="label"><b>01</b> / LIVE NETWORK</div><h2 id="live-h">Live network</h2><p class="sec-lead">Real-time events flowing through PropSports, read from the same public endpoints customers call.</p></div>
      <div class="sec-aside"><a class="link" href="${C.API_BASE}/health" target="_blank" rel="noopener">GET /health</a></div>
    </div>
    <dl class="metrics">
      <div class="metric"><dt>SPORTS ONLINE</dt><dd id="m-online">—</dd></div>
      <div class="metric"><dt>LIVE EVENTS</dt><dd id="m-live">—</dd></div>
      <div class="metric"><dt>EVENTS TODAY</dt><dd id="m-today">—</dd></div>
      <div class="metric"><dt>REFRESH INTERVAL</dt><dd>${C.REFRESH_SECONDS}<small>s</small></dd></div>
      <div class="metric"><dt>API HEALTH</dt><dd id="m-health">—</dd></div>
    </dl>
    <div class="ops">
      <div class="ops-bar">
        <div class="ops-tabs" role="tablist" aria-label="Filter by sport">
          <button type="button" class="ops-tab" role="tab" data-sport="all" aria-selected="true">ALL <span class="n"></span></button>${C.SPORTS.map((s) => `<button type="button" class="ops-tab" role="tab" data-sport="${s.id}" aria-selected="false">${s.name.toUpperCase()} <span class="n"></span></button>`).join('')}
        </div>
        <div class="ops-sync" id="ops-sync"><i></i><span id="ops-updated">Connecting…</span><button type="button" id="ops-refresh">Refresh</button></div>
      </div>
      <table class="ops-table">
        <thead><tr><th class="c-sport">SPORT</th><th>COMPETITION</th><th>EVENT</th><th>STATUS</th><th>CLOCK / TIME</th><th class="col-venue">VENUE</th><th class="c-age">AGE</th></tr></thead>
        <tbody id="ops-body">${'<tr class="skel"><td></td><td></td><td></td><td></td><td></td><td class="c-venue"></td><td></td></tr>'.repeat(5)}</tbody>
      </table>
      <div class="ops-foot"><span id="ops-count"></span><span>Public PropSports endpoints · UFC via ufc-api.propbetedge.ai</span></div>
    </div>
  </div>
</section>

<section class="sec alt" id="platform" aria-labelledby="platform-h">
  <div class="wrap">
    <div class="sec-head">
      <div><div class="label"><b>02</b> / COVERAGE</div><h2 id="platform-h">One network. Deep sport-specific data.</h2><p class="sec-lead">What each sport exposes today. Every entry maps to a route in the API registry — the full list is on each sport page and in the <a class="link" href="/reference">API reference</a>.</p></div>
    </div>
    ${matrix()}
    <p class="matrix-note">WNBA, tennis and soccer are served through an allowlisted gateway to their dedicated platforms. UFC runs on its own host and keys and is not counted in the ${N.ENDPOINTS} PropSports endpoints.</p>
  </div>
</section>

<section class="sec" id="console" aria-labelledby="console-h">
  <div class="wrap">
    <div class="sec-head">
      <div><div class="label"><b>03</b> / API</div><h2 id="console-h">Real requests. Real responses.</h2><p class="sec-lead">Each response was captured from production and is shown with its status and latency. Public routes can be re-run live from your browser.</p></div>
      <div class="sec-aside"><a class="link arrow" href="/reference">Full API reference</a></div>
    </div>
    ${consoleBlock(consoleTabs, 'mlb')}
    <div class="price-notes"><span>Base URL <code>${C.API_BASE}</code></span><span>Auth <code>X-API-Key: &lt;key&gt;</code> or <code>?key=</code></span><span>Format <code>application/json</code></span></div>
  </div>
</section>

<section class="sec alt" id="depth" aria-labelledby="depth-h">
  <div class="wrap">
    <div class="sec-head"><div><div class="label"><b>04</b> / DEPTH</div><h2 id="depth-h">Deeper than generic sports data.</h2><p class="sec-lead">Scores are the floor. Each sport goes further in the direction that sport actually needs.</p></div></div>
    <div class="cols">${depth.map(([id, h, p, routes]) => `
      <div class="col">${tag(id)}<h3>${esc(h)}</h3><p>${esc(p)}</p><ul>${routes.map((r) => `<li><em>GET</em>${esc(r)}</li>`).join('')}</ul><a class="link arrow" href="/sports/${id}">${sportById[id].name} API</a></div>`).join('')}
    </div>
  </div>
</section>

<section class="sec" id="intelligence" aria-labelledby="intel-h">
  <div class="wrap">
    <div class="sec-head"><div><div class="label"><b>05</b> / INTELLIGENCE</div><h2 id="intel-h">Raw sports data is only layer one.</h2><p class="sec-lead">Capabilities vary by sport. The tags show where each layer exists today.</p></div></div>
    <div class="layers">${layers.map(([h, p, sports], i) => `
      <div class="layer"><span class="layer-n">L${i + 1}</span><h3>${esc(h)}</h3><p>${esc(p)}</p><div class="layer-sports">${sports.map(tag).join('')}</div></div>`).join('')}
    </div>
  </div>
</section>

<section class="sec alt" id="infrastructure" aria-labelledby="infra-h">
  <div class="wrap">
    <div class="sec-head"><div><div class="label"><b>06</b> / INFRASTRUCTURE</div><h2 id="infra-h">Built as infrastructure.</h2><p class="sec-lead">How data moves today. Core sports are served by the PropSports edge worker; WNBA, tennis and soccer pass through a gateway to dedicated platforms; UFC runs on its own host.</p></div></div>
    <div class="topo">
      <div class="tiers">${tiers.map(([n, s, nodes]) => `
        <div class="tier"><div class="tier-name">${n}<small>${esc(s)}</small></div><div class="tier-body">${nodes.map((x) => `<span class="node"><i></i>${esc(x)}</span>`).join('')}</div></div>`).join('')}
      </div>
      <dl class="topo-notes">
        <dt>AUTHENTICATION</dt><dd><code>X-API-Key</code> header or <code>?key=</code>. Keys are issued at checkout and stored in Workers KV with their sports and daily limit.</dd>
        <dt>RATE LIMITS</dt><dd>Per-key daily counters in KV, ${fmt(Math.min(...C.PLANS.map((p) => p.limit)))}–${fmt(Math.max(...C.PLANS.map((p) => p.limit)))} requests/day by plan. The demo key shares ${C.DEMO_LIMIT.replace(' (shared)', '')}.</dd>
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
    <div class="sec-head"><div><div class="label"><b>07</b> / DATA TRUST</div><h2 id="trust-h">Rules the data follows.</h2><p class="sec-lead">Infrastructure is only useful if you can tell what a value means and where it came from.</p></div></div>
    <div class="rules">${rules.map(([h, p]) => `<div class="rule"><div><strong>${esc(h)}</strong><span>${esc(p)}</span></div></div>`).join('')}</div>
  </div>
</section>

<section class="sec alt" id="pricing" aria-labelledby="pricing-h">
  <div class="wrap">
    <div class="proof" style="margin-bottom:56px">
      <div><b>${N.ENDPOINTS}</b><span>API ENDPOINTS</span></div>
      <div><b>${N.CORE_API_SPORTS}</b><span>CORE API SPORTS</span></div>
      <div><b>${N.SPORT_PLATFORMS}</b><span>SPORT PLATFORMS</span></div>
      <div><b>${N.PUBLIC_ENDPOINTS}</b><span>PUBLIC ENDPOINTS</span></div>
      <div><b>${C.REFRESH_SECONDS}s</b><span>LIVE NETWORK REFRESH</span></div>
    </div>
    <div class="sec-head">
      <div><div class="label"><b>08</b> / PRICING</div><h2 id="pricing-h">Flat monthly plans. No per-call fees.</h2><p class="sec-lead">Plans differ by sports and daily request limit. Every all-sports plan includes all ${N.ENDPOINTS} endpoints.</p></div>
    </div>
    ${pricing()}
  </div>
</section>

<section class="sec" aria-labelledby="more-h">
  <div class="wrap">
    <div class="label" id="more-h">ALSO FROM PROPTECHUSA</div>
    <div class="related" style="margin-top:18px">
      <a href="/mlb-edge"><strong>MLB Edge Suite →</strong><span>Premium MLB signals built on the PropSports MLB dataset.</span></a>
      <a href="https://ufc.proptechusa.ai" target="_blank" rel="noopener"><strong>UFC Intelligence API ↗</strong><span>Fight DNA, round statistics, weigh-ins and card intelligence.</span></a>
      <a href="https://propdata.proptechusa.ai" target="_blank" rel="noopener"><strong>PropData API ↗</strong><span>Real-estate data infrastructure from the same team.</span></a>
    </div>
  </div>
</section>
</main>
${footer()}
${scripts(true)}`;
}

/* ── sport pages ─────────────────────────────────────── */
const SPORT_TITLES = {
  mlb: 'MLB API — Schedules, Live Games, Statcast & Model Output',
  nfl: 'NFL API — Scoreboards, Play-by-Play, Drives & Standings',
  nba: 'NBA API — Play-by-Play, Shot Charts, Lineups & Box Scores',
  wnba: 'WNBA API — Games, Players, WinBA & Player DNA',
  nhl: 'NHL API — Live Cast, Shot Geometry, Standings & Players',
  tennis: 'Tennis API — Live ATP & WTA Matches, Rankings & H2H',
  soccer: 'Soccer API — Fixtures, Live Matches, Tables & DNA',
  ufc: 'UFC API — Fight DNA, Round Statistics & Card Intelligence'
};
const NOTES = {
  mlb: ['Model prices come from the PropBetEdge odds engine and are served from a separate route family.', 'Park factor is a field on /mlb/weather; indoor parks return none.', 'Player routes accept the demo key under a shared 20 requests/hour cap.'],
  nfl: ['Only /nfl/schedule, /nfl/games/live and /nfl/odds are public; every other route needs an NFL-entitled key.', 'Win probability is the ESPN series, passed through — not a PropSports model.'],
  nba: ['Lineups are reconstructed from starters and substitutions and are estimates.', 'The hustle box depends on stats.nba.com access and may return available:false.', 'Win probability is the ESPN series, passed through.'],
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
  const pub = s.api ? N.PUBLIC_PER_SPORT[s.id] : groups.reduce((n, g) => n + g[1].filter((r) => r[2] === 'pub').length, 0);
  const title = `${SPORT_TITLES[s.id]} | PropSports`;
  const description = `${s.summary}`.slice(0, 300);
  const m = s.matrix;
  const capCols = [['Schedule & live', m.live], ['Play-by-play & game', m.pbp], ['Players', m.players], ['Teams & standings', m.teams], ['Advanced', m.adv], ['Models & DNA', m.models.concat(m.gated || [])]].filter(([, v]) => v.length);
  const tabs = s.examples.map((id) => ({ id, sport: s.id, label: EXAMPLE_PATHS[id].path.split('?')[0].replace('/v1/ufc', ''), path: EXAMPLE_PATHS[id].path.split('?')[0] }));
  const cta = s.api
    ? `<button type="button" class="btn btn-primary" data-checkout="${s.id.toUpperCase()}">Get ${s.name} key — $${C.PLANS[0].price}/mo</button><a class="btn btn-line" href="/#pricing">All-sports plans</a>`
    : `<a class="btn btn-primary" href="${s.platform}" target="_blank" rel="noopener">Open UFC platform ↗</a><a class="btn btn-line" href="${s.platform}/docs" target="_blank" rel="noopener">UFC developer docs ↗</a>`;
  const links = [
    s.deep ? `<a class="link arrow" href="${s.deep}">Full ${s.name} reference &amp; examples</a>` : '',
    s.platform ? `<a class="link" href="${s.platform}" target="_blank" rel="noopener">Dedicated ${s.name} platform ↗</a>` : '',
    s.api ? `<a class="link arrow" href="/reference#${s.id}">${s.name} routes in the API reference</a>` : ''
  ].filter(Boolean).join('<span style="color:var(--line-3)"> · </span>');

  return `${head({ title, description, path: `/sports/${s.id}` })}
${nav()}
<main id="main" style="--c:${s.color}">
<section class="sp-hero">
  <div class="wrap sp-hero-in">
    <div class="crumbs"><a href="/">PropSports</a> / <a href="/#platform">Sports</a> / ${s.name}</div>
    <div class="sp-hero-copy">
      <div class="eyebrow" style="gap:12px">${mark(s.id)}${s.name.toUpperCase()} ${s.api ? 'API' : 'INTELLIGENCE API'}</div>
      <h1>${esc(s.headline)}</h1>
      <p class="hero-lead">${esc(s.summary)}</p>
      <div class="hero-actions">${cta}</div>
    </div>
    <div class="sp-facts">
      <div><span>ENDPOINTS</span><b class="num">${total}</b></div>
      <div><span>PUBLIC (NO KEY)</span><b class="num">${pub}</b></div>
      <div><span>BASE</span><b>${s.api ? '/' + s.id : '/v1/ufc'}</b></div>
      <div><span>HOST</span><b>${esc(host.replace('https://', ''))}</b></div>
      <div><span>SERVED VIA</span><b>${s.api ? (s.platform ? 'Gateway → dedicated platform' : 'Core API worker') : 'Separate host'}</b></div>
      <div><span>LIVE CACHE</span><b>${esc(s.cache)}</b></div>
    </div>
  </div>
</section>

<section class="sec">
  <div class="wrap">
    <div class="sec-head"><div><div class="label"><b>01</b> / CAPABILITIES</div><h2>What the ${s.name} API covers</h2></div></div>
    <div class="caps">${capCols.map(([h, items]) => `
      <div><h3>${esc(h.toUpperCase())}</h3><ul>${items.map((c) => `<li>${esc(c)}</li>`).join('')}</ul></div>`).join('')}
    </div>
  </div>
</section>

<section class="sec alt" id="endpoints">
  <div class="wrap">
    <div class="sec-head"><div><div class="label"><b>02</b> / ENDPOINTS</div><h2>${total} ${s.name} endpoints</h2><p class="sec-lead">All routes are <code>GET</code> on <code>${esc(host)}</code>. Public routes need no key; the rest take <code>X-API-Key</code> or <code>?key=</code>.</p></div></div>
    ${endpointGroups(groups, host)}
  </div>
</section>

<section class="sec">
  <div class="wrap">
    <div class="sec-head"><div><div class="label"><b>03</b> / EXAMPLE</div><h2>Example request and response</h2><p class="sec-lead">Captured from production. Public routes can be re-run live.</p></div></div>
    ${consoleBlock(tabs, tabs[0].id)}
  </div>
</section>

<section class="sec alt">
  <div class="wrap split">
    <div><div class="label"><b>04</b> / DATA NOTES</div><h2 style="margin-top:14px;font:600 26px/1.2 var(--sans);color:#fff;letter-spacing:-.02em">Depth and availability</h2><p class="sec-lead">What the data is, where it comes from, and what it deliberately does not claim.</p></div>
    <ul class="facts-list">
      <li><b>SOURCES</b>${esc(s.sources)}</li>
      <li><b>ACCESS</b>${s.api ? `Included in the ${s.name}-only plan ($${C.PLANS[0].price}/mo) and every all-sports plan.` : 'Keys and billing are handled on the UFC platform.'}</li>
      ${NOTES[s.id].map((n) => `<li><b>NOTE</b>${esc(n)}</li>`).join('\n      ')}
    </ul>
  </div>
</section>

<section class="sec">
  <div class="wrap">
    <div class="cta-band"><div><h3>${s.api ? `Build on ${s.name} data` : 'Build on UFC intelligence'}</h3><p>${links}</p></div><div class="acts">${cta}</div></div>
    <div class="label" style="margin-top:48px">OTHER SPORTS</div>
    <div class="rail" style="margin-top:12px;border:1px solid var(--line);background:none"><div class="rail-in">${C.SPORTS.map((o) => `<a href="/sports/${o.id}" style="--c:${o.color}${o.id === s.id ? ';background:var(--bg-2)' : ''}"${o.id === s.id ? ' aria-current="page"' : ''}><span class="rail-top"><span class="rail-name">${o.name}</span>${mark(o.id)}</span></a>`).join('')}</div></div>
  </div>
</section>
</main>
${footer()}
${scripts(false)}`;
}

/* ── API reference ───────────────────────────────────── */
function reference() {
  const title = 'API Reference — PropSports API';
  const description = `Every PropSports API endpoint: ${N.ENDPOINTS} GET routes across ${listNames(coreNames)}, with access level and authentication.`;
  return `${head({ title, description, path: '/reference' })}
${nav('reference')}
<main id="main">
<section class="sp-hero" style="--c:var(--blue)">
  <div class="wrap sp-hero-in">
    <div class="crumbs"><a href="/">PropSports</a> / API Reference</div>
    <div class="sp-hero-copy"><div class="eyebrow">API REFERENCE</div><h1>${N.ENDPOINTS} endpoints. One key.</h1><p class="hero-lead">Every route the PropSports API serves, grouped by sport, with its access level. Request and response walkthroughs live in the <a class="link" href="/docs">docs</a>.</p></div>
    <div class="sp-facts">
      <div><span>BASE URL</span><b>${esc(C.API_BASE.replace('https://', ''))}</b></div>
      <div><span>AUTH</span><b>X-API-Key or ?key=</b></div>
      <div><span>METHOD</span><b>GET · JSON</b></div>
      <div><span>PUBLIC ROUTES</span><b class="num">${N.PUBLIC_ENDPOINTS}</b></div>
      <div><span>DEMO KEY</span><b>${C.DEMO_KEY}</b></div>
      <div><span>PREFIXES</span><b>/v1/ and /api/ accepted</b></div>
    </div>
  </div>
</section>
${coreSports.map((s, i) => `<section class="sec${i % 2 ? ' alt' : ''}" id="${s.id}">
  <div class="wrap">
    <div class="sec-head"><div><div class="label" style="--c:${s.color}">${tag(s.id)}</div><h2>${s.name} · ${N.PER_SPORT[s.id]} endpoints</h2><p class="sec-lead">${N.PUBLIC_PER_SPORT[s.id]} public. <a class="link" href="/sports/${s.id}">${s.name} overview →</a></p></div></div>
    ${endpointGroups(C.ROUTES[s.id], C.API_BASE)}
  </div>
</section>`).join('\n')}
<section class="sec" id="ufc"><div class="wrap"><div class="cta-band"><div><h3>UFC Intelligence API</h3><p>UFC routes are served from ufc-api.propbetedge.ai with their own keys. <a class="link" href="/sports/ufc">UFC overview →</a></p></div><div class="acts"><a class="btn btn-line" href="https://ufc.proptechusa.ai/docs" target="_blank" rel="noopener">UFC docs ↗</a></div></div></div></section>
</main>
${footer()}
${scripts(false)}`;
}

/* ── write ───────────────────────────────────────────── */
mkdirSync(join(root, 'sports'), { recursive: true });
const out = [];
const write = (rel, html) => { writeFileSync(join(root, rel), html); out.push(rel); };
write('index.html', home());
C.SPORTS.forEach((s) => write(`sports/${s.id}.html`, sportPage(s)));
write('reference.html', reference());

const urls = [['/', 'daily', '1.0'], ['/reference', 'weekly', '0.9'], ...C.SPORTS.map((s) => [`/sports/${s.id}`, 'weekly', '0.9']),
  ['/docs', 'weekly', '0.8'], ['/pricing', 'monthly', '0.8'], ['/mlb', 'weekly', '0.7'], ['/nfl', 'weekly', '0.7'], ['/nba', 'weekly', '0.7'], ['/nhl', 'weekly', '0.7'], ['/mlb-edge', 'monthly', '0.6'], ['/live', 'monthly', '0.5']];
writeFileSync(join(root, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(([p, f, pr]) => `  <url><loc>${SITE}${p}</loc><changefreq>${f}</changefreq><priority>${pr}</priority></url>`).join('\n')}
</urlset>
`);
out.push('sitemap.xml');
console.log(`built ${out.length} files · ${N.ENDPOINTS} endpoints (${N.PUBLIC_ENDPOINTS} public) · ${N.CORE_API_SPORTS} core sports · ${N.SPORT_PLATFORMS} platforms · hero image: ${heroMedia().html ? 'yes' : 'none'}`);
