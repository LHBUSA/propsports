// PropSports site checks. Usage: node scripts/check.mjs   (exit code 1 on any failure)
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import vm from 'node:vm';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(root, p), 'utf8');
const ctx = {};
vm.runInNewContext(read('assets/ps-config.js'), { globalThis: ctx, window: undefined });
const C = ctx.PS_CONFIG, N = C.COUNTS;
const failures = [];
let checks = 0;
const check = (ok, msg) => { checks++; if (!ok) failures.push(msg); };

/* 1. registry integrity */
const allRoutes = [];
Object.entries(C.ROUTES).forEach(([sport, groups]) => groups.forEach(([, routes]) => routes.forEach((r) => {
  allRoutes.push(r[0]);
  check(r[0].startsWith('/' + sport + '/'), `route ${r[0]} is not under /${sport}/`);
  check(['pub', 'demo', 'key'].includes(r[2]), `route ${r[0]} has unknown access ${r[2]}`);
})));
check(new Set(allRoutes).size === allRoutes.length, 'duplicate routes in registry');
check(allRoutes.length === N.ENDPOINTS, `ENDPOINTS ${N.ENDPOINTS} != registry ${allRoutes.length}`);
check(C.SPORTS.filter((s) => s.api).every((s) => C.ROUTES[s.id]), 'every API sport needs routes');

/* 2. examples map to registry routes */
const examples = JSON.parse(read('assets/api-examples.json')).examples;
const ufcRoutes = C.UFC_ROUTES.flatMap(([, r]) => r.map((x) => x[0]));
for (const [id, ex] of Object.entries(examples)) {
  const bare = ex.path.split('?')[0];
  check(allRoutes.includes(bare) || ufcRoutes.includes(bare), `example ${id} path ${bare} not in registry`);
}
C.SPORTS.forEach((s) => s.examples.forEach((id) => check(examples[id], `sport ${s.id} references missing example ${id}`)));

/* 3. generated pages exist, canonicals and sitemap */
const generated = ['index.html', 'reference.html', ...C.SPORTS.map((s) => `sports/${s.id}.html`)];
const sitemap = read('sitemap.xml');
generated.forEach((f) => {
  check(existsSync(join(root, f)), `missing ${f}`);
  if (!existsSync(join(root, f))) return;
  const html = read(f);
  const path = f === 'index.html' ? '/' : '/' + f.replace(/\.html$/, '');
  check(html.includes(`<link rel="canonical" href="${C.SITE}${path}">`), `${f} canonical should be ${path}`);
  check(sitemap.includes(`<loc>${C.SITE}${path}</loc>`), `sitemap missing ${path}`);
  check(/<title>[^<]{10,}<\/title>/.test(html) && /<meta name="description" content="[^"]{50,}"/.test(html), `${f} needs title and description`);
});

/* 4. stale / contradictory copy across every HTML page */
const htmlFiles = readdirSync(root).filter((f) => f.endsWith('.html')).concat(readdirSync(join(root, 'sports')).map((f) => 'sports/' + f));
const STALE = [/\b59\s+endpoints/i, /\bfour sports\b/i, /\ball four\b/i, /\b4 sports\b/i, /\bWINBA\b/, /\b106\s+(API\s+)?endpoints/i, /all 106\b/i, /\b106\+?\s*<\/?[a-z]/i];
htmlFiles.forEach((f) => {
  const text = read(f).replace(/<script[\s\S]*?<\/script>/g, '');
  STALE.forEach((re) => { const m = text.match(re); check(!m, `${f}: stale copy "${m && m[0]}"`); });
});
const allowedCounts = new Set([N.ENDPOINTS, N.PUBLIC_ENDPOINTS, N.UFC_ENDPOINTS_LISTED, ...Object.values(N.PER_SPORT)]);
generated.forEach((f) => {
  const text = read(f).replace(/<[^>]+>/g, ' ');
  for (const m of text.matchAll(/(\d[\d,]*)\s+(?:[A-Za-z]+\s+)?endpoints/g)) {
    check(allowedCounts.has(Number(m[1].replace(/,/g, ''))), `${f}: endpoint count "${m[0]}" not derived from registry`);
  }
});

/* 5. internal links and anchors resolve */
const fileFor = (p) => {
  const clean = p.replace(/^\//, '');
  if (clean === '') return 'index.html';
  for (const c of [clean, clean + '.html', clean + '/index.html']) if (existsSync(join(root, c)) && !c.endsWith('/')) return c;
  return null;
};
generated.forEach((f) => {
  const html = read(f);
  for (const [, href] of html.matchAll(/href="(\/[^"]*|#[^"]*)"/g)) {
    const [path, hash] = href.startsWith('#') ? ['/' + f.replace(/(index)?\.html$/, ''), href.slice(1)] : href.split('#');
    const target = fileFor(path.split('?')[0]);
    check(target, `${f}: broken link ${href}`);
    if (target && hash) check(new RegExp(`id="${hash}"`).test(read(target)), `${f}: missing anchor #${hash} in ${target}`);
  }
});

/* 6. scripts compile */
['assets/ps-config.js', 'assets/ps.js', 'assets/ps-live.js'].forEach((f) => {
  try { new vm.Script(read(f), { filename: f }); check(true); } catch (e) { check(false, `${f}: ${e.message}`); }
});
generated.forEach((f) => {
  [...read(f).matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)].forEach(([, js], i) => {
    try { new vm.Script(js); check(true); } catch (e) { check(false, `${f} inline script ${i}: ${e.message}`); }
  });
});

/* 7. checkout wiring */
const planTiers = C.PLANS.map((p) => p.checkout).filter((t) => t !== 'choose');
planTiers.concat(C.SPORTS.filter((s) => s.api).map((s) => s.id.toUpperCase())).forEach((t) => check(C.PRICE_IDS[t], `no Stripe price for ${t}`));
generated.forEach((f) => {
  for (const [, t] of read(f).matchAll(/data-checkout="([A-Z]+)"/g)) check(C.PRICE_IDS[t], `${f}: checkout tier ${t} has no price`);
});

console.log(`${checks} checks · ${failures.length} failures`);
failures.forEach((m) => console.log('  ✗ ' + m));
process.exit(failures.length ? 1 : 0);
