// PropSports site checks. Usage: node scripts/check.mjs   (exit code 1 on any failure)
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import vm from 'node:vm';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(root, p), 'utf8');
const ctx = {};
vm.runInNewContext(read('assets/ps-config.js'), { globalThis: ctx, window: undefined });
const C = ctx.PS_CONFIG, N = C.COUNTS;
const CAT = JSON.parse(read('assets/catalog.json'));
const CATALOG = CAT.endpoints;
const SITE = C.SITE;
const failures = [];
let checks = 0;
const check = (ok, msg) => { checks++; if (!ok) failures.push(msg); };

/* 1. registry + examples */
const allRoutes = [];
Object.entries(C.ROUTES).forEach(([sport, groups]) => groups.forEach(([, routes]) => routes.forEach((r) => {
  allRoutes.push(r[0]);
  check(r[0].startsWith('/' + sport + '/'), `route ${r[0]} is not under /${sport}/`);
  check(['open', 'demo', 'key'].includes(r[2]), `route ${r[0]} has unknown access ${r[2]}`);
})));
check(new Set(allRoutes).size === allRoutes.length, 'duplicate routes in registry');
check(allRoutes.length === N.DOCUMENTED_ROUTES, 'DOCUMENTED_ROUTES does not match registry');
// Production is canonical: the build writes catalog.json from GET /health + GET /sports after reconciling the registry.
check(CAT.live === true && CAT.registry_matches_production === true, 'catalog.json was not built from production (/health + /sports)');
check(CATALOG === N.DOCUMENTED_ROUTES, `production catalog ${CATALOG} ≠ registry ${N.DOCUMENTED_ROUTES}`);
check(CAT.access && CAT.access.open === N.OPEN && CAT.access.demo === N.DEMO && CAT.access.key === N.KEY, 'access totals differ from production');
for (const [sp, t] of Object.entries(CAT.by_sport || {}))
  check(t.total === N.PER_SPORT[sp] && t.open === N.OPEN_PER_SPORT[sp] && t.demo === N.DEMO_PER_SPORT[sp] && t.key === N.KEY_PER_SPORT[sp], `${sp} counts differ from production`);
const TEAM_CAPS = ['Standings', 'Teams', 'Team profiles', 'Rosters', 'Team schedules'];
const teamsOf = (id) => JSON.stringify(C.SPORTS.find((x) => x.id === id).matrix.teams);
check(teamsOf('mlb') === JSON.stringify(TEAM_CAPS), 'MLB Teams & Standings must list ' + TEAM_CAPS.join(', '));
check(teamsOf('nba') === JSON.stringify(TEAM_CAPS.concat('Team stats')), 'NBA Teams & Standings must list ' + TEAM_CAPS.concat('Team stats').join(', '));
const examples = JSON.parse(read('assets/api-examples.json')).examples;
const ufcRoutes = C.UFC_ROUTES.flatMap(([, r]) => r.map((x) => x[0]));
for (const [id, ex] of Object.entries(examples)) check(allRoutes.includes(ex.path.split('?')[0]) || ufcRoutes.includes(ex.path.split('?')[0]), `example ${id} not in registry`);

/* 2. pricing catalog is exactly the V2 forward-facing set */
const EXPECTED_PRICES = {
  MLB: 'price_1ULUM6F3CaVzg4ORYIP0C8QL', NFL: 'price_1ULUM8F3CaVzg4ORWk5GyS2x', NBA: 'price_1ULUMAF3CaVzg4ORAZ6dhDq2', WNBA: 'price_1ULUMDF3CaVzg4ORWEU2jpul',
  NHL: 'price_1ULUMFF3CaVzg4ORTnhbbiST', TENNIS: 'price_1ULUMHF3CaVzg4ORnDZu5Wtg', SOCCER: 'price_1ULUMJF3CaVzg4ORkXDAXrxA',
  DEVELOPER: 'price_1ULUMYF3CaVzg4ORpHsYNH6v', ALL_SPORTS: 'price_1ULUMaF3CaVzg4ORW37dQT5M', PRO: 'price_1ULUMcF3CaVzg4ORNDzMI20y',
  SCALE: 'price_1ULUMeF3CaVzg4ORfxBoHHbF', ENTERPRISE: 'price_1ULUMgF3CaVzg4OR3CrWZ1FV'
};
check(JSON.stringify(Object.keys(C.PRICE_IDS).sort()) === JSON.stringify(Object.keys(EXPECTED_PRICES).sort()), 'PRICE_IDS keys differ from V2 catalog');
for (const [k, v] of Object.entries(EXPECTED_PRICES)) check(C.PRICE_IDS[k] === v, `PRICE_IDS.${k} is ${C.PRICE_IDS[k]}, expected ${v}`);
check(C.PLANS.map((p) => p.price).join(',') === '29,79,149,299,599,1500', 'plan price ladder is not 29/79/149/299/599/1500');
check(C.PLANS.map((p) => p.limit).join(',') === '50000,100000,200000,500000,2000000,5000000', 'plan limits differ from V2');
const LEGACY_IDS = ['price_1TgVGEF3CaVzg4ORwIgccsLq', 'price_1TgVIFF3CaVzg4ORBLnm7oV3', 'price_1TgVK2F3CaVzg4ORyH92T0n5', 'price_1Tgl7SF3CaVzg4OROnbVwkJn', 'price_1TglBvF3CaVzg4ORiqx6QDne',
  'price_1TglD6F3CaVzg4ORolvfntBE', 'price_1TglEDF3CaVzg4ORkrqBkQSf', 'price_1ULRstF3CaVzg4ORnBtaxsTe', 'price_1ULRtJF3CaVzg4ORV8uFpfCL', 'price_1ULRtLF3CaVzg4ORpVnTLuEg', 'price_1Tnp8AF3CaVzg4OREtKmEdm9'];

/* 3. pages */
const PAGES = readdirSync(root).filter((f) => f.endsWith('.html')).concat(readdirSync(join(root, 'sports')).map((f) => 'sports/' + f));
const PROPDATA = new Set(['propdata-core.html', 'propdata-pro.html']);
const expectPath = (f) => f === 'index.html' ? '/' : '/' + f.replace(/\.html$/, '');
const allText = (html) => html.replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<style[\s\S]*?<\/style>/g, ' ');
const sitemap = read('sitemap.xml');
for (const f of PAGES) {
  const html = read(f);
  const noindex = /<meta[^>]+name="robots"[^>]+noindex/i.test(html);
  const count = (re) => (html.match(re) || []).length;
  check(count(/<title>/g) === 1, `${f}: expected one <title>`);
  check(count(/<meta\s+name="description"/gi) === 1, `${f}: expected one meta description`);
  check(count(/rel="canonical"/g) === 1, `${f}: expected one canonical`);
  check(html.includes(`<link rel="canonical" href="${SITE}${expectPath(f)}">`), `${f}: canonical should be ${SITE}${expectPath(f)}`);
  check(/<meta name="viewport"/.test(html), `${f}: missing viewport`);
  for (const t of ['og:type', 'og:site_name', 'og:title', 'og:description', 'og:url', 'og:image', 'og:image:width', 'og:image:height', 'og:image:alt', 'og:locale', 'twitter:card', 'twitter:title', 'twitter:description', 'twitter:image', 'twitter:image:alt'])
    check(count(new RegExp(`(?:property|name)="${t}"`, 'g')) === 1, `${f}: expected exactly one ${t}`);
  check(html.includes(`content="${SITE}/assets/social/propsports-og.jpg"`), `${f}: og:image must be the absolute social card`);
  check(html.includes('rel="manifest" href="/site.webmanifest"') && html.includes('/assets/brand/favicon.svg') && html.includes('apple-touch-icon'), `${f}: brand icons/manifest missing`);
  check(!/rel="icon"[^>]*href="data:/.test(html), `${f}: inline data-URI favicon remains`);
  for (const [, js] of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) { try { JSON.parse(js); check(true); } catch (e) { check(false, `${f}: JSON-LD does not parse`); } }
  if (!noindex) {
    check(count(/<h1\b/g) === 1, `${f}: expected exactly one <h1> (found ${count(/<h1\b/g)})`);
    check(sitemap.includes(`<loc>${SITE}${expectPath(f)}</loc>`) || f.startsWith('index.html.bak'), `${f}: missing from sitemap`);
  } else check(f === 'dashboard.html', `${f}: unexpected noindex`);
  // stale copy
  const text = allText(html);
  for (const re of [/\bfour sports\b/i, /\ball four\b/i, /\b4 sports\b/i, /\bWINBA\b/, /\b6[x×] daily\b/i, /\b(31|47|59|125) endpoints\b/i])
    { const m = text.match(re); check(!m, `${f}: stale copy "${m && m[0]}"`); }
  // RapidAPI is gone everywhere (text and links); empty coverage cells are never labelled "Not offered";
  // access is only ever "Open without key", "Demo access" or "API key required".
  { const m = html.match(/rapidapi/i); check(!m, `${f}: RapidAPI reference remains`); }
  for (const re of [/Not offered/i, /\bPublic \(no key\)/i, /\bPublic routes\b/, /\d+ public\b/, /class="acc acc-pub"/, /\bDemo key<\/em>/])
    { const m = html.match(re); check(!m, `${f}: ambiguous access wording "${m && m[0]}"`); }
  for (const m of text.matchAll(/(\d[\d,]*)(?:<\/?(?:b|span|strong|em)[^>]*>)?\s+(?:catalog\s+)?endpoints/gi)) {
    if (/^0\d$/.test(m[1])) continue; // section index labels such as "02 Endpoints"
    const n = Number(m[1].replace(/,/g, ''));
    const ctxt = text.slice(Math.max(0, m.index - 90), m.index);
    const sportPage = /^(mlb|nfl|nba|nhl)\.html$/.test(f) ? f.slice(0, 3) : null;
    check(n === CATALOG || n === N.OPEN || (sportPage && n === N.PER_SPORT[sportPage]) || /parcels|PropData/i.test(ctxt) || PROPDATA.has(f),
      `${f}: endpoint count "${m[0]}" is neither the live catalog (${CATALOG}) nor a documented count`);
  }
  if (!PROPDATA.has(f)) {
    // MLB Edge and PropData are separate products with their own tiers and prices.
    const scrubbed = html.replace(/PropData (?:Core|Pro)[\s\S]{0,240}?\$\d[\d,]*\/mo/g, '');
    const rules = [/\$19(?![\d,])/, /\$249\b/, /\bBasic — \$/, /\bUltra — \$/, /All sports \$49/i, /\$49\/mo/];
    if (f !== 'mlb-edge.html') rules.push(/doCheckout\('(?:BASIC|ULTRA)'\)/);
    for (const re of rules) { const m = scrubbed.match(re); check(!m, `${f}: stale PropSports pricing "${m && m[0]}"`); }
    for (const id of LEGACY_IDS) check(!html.includes(id), `${f}: legacy price ID ${id} is still offered`);
  }
  // images
  for (const [tagHtml] of html.matchAll(/<img\b[^>]*>/g)) {
    check(/\balt="[^"]*"/.test(tagHtml), `${f}: <img> without alt: ${tagHtml.slice(0, 80)}`);
    if (!PAGES_LEGACY_OK(f)) check(/\bwidth="\d+"/.test(tagHtml) && /\bheight="\d+"/.test(tagHtml), `${f}: <img> without width/height: ${tagHtml.slice(0, 80)}`);
  }
}
function PAGES_LEGACY_OK(f) { return !(f === 'index.html' || f === 'pricing.html' || f === 'reference.html' || f.startsWith('sports/')); }

/* 4. internal links and anchors resolve (all pages) */
const fileFor = (p) => {
  const clean = decodeURIComponent(p).replace(/^\//, '');
  if (clean === '') return 'index.html';
  for (const c of [clean, clean + '.html', clean + '/index.html']) if (existsSync(join(root, c)) && statSync(join(root, c)).isFile()) return c;
  return null;
};
for (const f of PAGES) {
  const html = read(f);
  for (const [, href] of html.matchAll(/href="(\/[^"]*|#[^"]+)"/g)) {
    if (href.startsWith('//')) continue;
    const [path, hash] = href.startsWith('#') ? [expectPath(f), href.slice(1)] : href.split('#');
    const target = fileFor(path.split('?')[0]);
    check(target, `${f}: broken internal link ${href}`);
    if (target && hash && target.endsWith('.html')) check(new RegExp(`id="${hash}"`).test(read(target)), `${f}: missing anchor #${hash} in ${target}`);
  }
}

/* 5. scripts compile */
for (const f of ['assets/ps-config.js', 'assets/ps.js', 'assets/ps-network.js', 'assets/ps-live.js']) { try { new vm.Script(read(f)); check(true); } catch (e) { check(false, `${f}: ${e.message}`); } }
for (const f of ['index.html', 'pricing.html', 'reference.html', ...C.SPORTS.map((s) => `sports/${s.id}.html`)])
  [...read(f).matchAll(/<script(?![^>]*\b(?:src|type)=)[^>]*>([\s\S]*?)<\/script>/g)].forEach(([, js], i) => { try { new vm.Script(js); check(true); } catch (e) { check(false, `${f} inline script ${i}: ${e.message}`); } });

/* 6. checkout wiring on generated pages (MLB Edge tiers only once the billing Worker accepts them) */
const EDGE_TIERS = C.EDGE.checkoutReady ? C.EDGE.plans.map((p) => p.id) : [];
for (const f of ['index.html', 'pricing.html', 'mlb-edge.html', ...C.SPORTS.map((s) => `sports/${s.id}.html`)]) {
  for (const [, t] of read(f).matchAll(/data-checkout="([A-Za-z_]+)"/g)) check(t === 'single' || t === 'developer' || EXPECTED_PRICES[t] || EDGE_TIERS.includes(t), `${f}: checkout tier ${t} has no live price`);
}
check(!/doCheckout\(|price_1TgV(?:ox|pY|qW)/.test(read('mlb-edge.html')) || C.EDGE.checkoutReady, 'mlb-edge: Edge prices offered before the billing Worker accepts them');

const idx = read('index.html');
/* 6b. every production route is documented; live features are wired */
const ref = read('reference.html');
for (const r of allRoutes) check(ref.includes(`<code>${r}</code>`), `reference: route ${r} is not documented`);
check((ref.match(/<li><span class="method">GET<\/span>/g) || []).length === N.DOCUMENTED_ROUTES, 'reference: listed route count differs from the catalog');
for (const s of C.SPORTS) {
  const html = read(`sports/${s.id}.html`);
  check(html.includes(`data-live-preview="${s.id}"`), `sports/${s.id}: live preview missing`);
  check(html.indexOf('/assets/ps-network.js') > 0 && html.indexOf('/assets/ps-network.js') < html.indexOf('/assets/ps-live.js'), `sports/${s.id}: ps-network.js must load before ps-live.js`);
  if (s.api) for (const [, routes] of C.ROUTES[s.id]) for (const [p] of routes) check(html.includes(`<code>${p}</code>`), `sports/${s.id}: route ${p} missing`);
}
{
  const th = (idx.match(/<table class="ops-table">[\s\S]*?<\/thead>/) || [''])[0];
  check((th.match(/<th\b/g) || []).length === 8 && /c-cast/.test(th), 'index: live table needs the PBEcast column');
  check(idx.indexOf('/assets/ps-network.js') > 0 && idx.indexOf('/assets/ps-network.js') < idx.indexOf('/assets/ps-live.js'), 'index: ps-network.js must load before ps-live.js');
  check(idx.includes('id="m-online-detail"'), 'index: network status detail missing');
}
check((idx.match(/data-dev-sport/g) || []).length === 3, 'index: Developer needs exactly three sport selectors');
check(/<select id="single-sport">(?:<option value="(?:MLB|NFL|NBA|WNBA|NHL|TENNIS|SOCCER)">[^<]+<\/option>){7}<\/select>/.test(idx), 'index: single-sport selector must offer the 7 core sports');

/* 7. brand, social, manifest, robots, sitemap */
for (const a of ['assets/brand/propsports-mark.svg', 'assets/brand/propsports-logo.svg', 'assets/brand/favicon.svg', 'assets/brand/favicon-32x32.png', 'assets/brand/favicon-16x16.png', 'assets/brand/apple-touch-icon.png', 'assets/brand/icon-192.png', 'assets/brand/icon-512.png', 'assets/social/propsports-og.jpg', 'favicon.ico', 'hero-sports-network.png', 'assets/media/CREDITS.md'])
  check(existsSync(join(root, a)), `missing asset ${a}`);
const pngSize = (p) => { const b = readFileSync(join(root, p)); return [b.readUInt32BE(16), b.readUInt32BE(20)]; };
check(pngSize('assets/brand/apple-touch-icon.png').join('x') === '180x180', 'apple-touch-icon must be 180x180');
check(pngSize('assets/brand/icon-192.png').join('x') === '192x192' && pngSize('assets/brand/icon-512.png').join('x') === '512x512', 'manifest icons must be 192/512');
const og = readFileSync(join(root, 'assets/social/propsports-og.jpg'));
let ogDims = null;
for (let i = 2; i < og.length - 9;) { if (og[i] !== 0xFF) break; const m = og[i + 1], len = og.readUInt16BE(i + 2); if (m >= 0xC0 && m <= 0xC2) { ogDims = [og.readUInt16BE(i + 7), og.readUInt16BE(i + 5)]; break; } i += 2 + len; }
check(ogDims && ogDims.join('x') === '1200x630', `social card must be 1200x630 (got ${ogDims})`);
try { const mf = JSON.parse(read('site.webmanifest')); check(mf.name === 'PropSports API' && mf.short_name === 'PropSports' && mf.start_url === '/' && mf.display === 'standalone' && mf.icons.length >= 2, 'manifest fields'); } catch (e) { check(false, 'manifest does not parse'); }
const robots = read('robots.txt');
check(robots.includes(`Sitemap: ${SITE}/sitemap.xml`) && /User-agent: \*/.test(robots) && !/Disallow: \/\s*$/m.test(robots) && !/Disallow: \/assets/.test(robots), 'robots.txt');
check(/^<\?xml[^>]+\?>\s*<urlset[^>]*>[\s\S]*<\/urlset>\s*$/.test(sitemap), 'sitemap is not well-formed');
for (const [, loc] of sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)) {
  check(!loc.endsWith('.html'), `sitemap lists .html URL ${loc}`);
  check(fileFor(loc.replace(SITE, '') || '/'), `sitemap URL has no page: ${loc}`);
}

console.log(`${checks} checks · ${failures.length} failures`);
failures.forEach((m) => console.log('  ✗ ' + m));
process.exit(failures.length ? 1 : 0);
