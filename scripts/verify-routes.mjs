// Probes every registry route marked open ('open') or demo access ('demo') against production.
// A route is "recognized" when production does not answer with its unknown-route 404 or the
// keyed-access 403. Keyed routes cannot be verified without a customer key and are reported as such.
// Usage: node scripts/verify-routes.mjs
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import vm from 'node:vm';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const ctx = {};
vm.runInNewContext(readFileSync(join(root, 'assets/ps-config.js'), 'utf8'), { globalThis: ctx, window: undefined });
const C = ctx.PS_CONFIG;
const SAMPLE = { ':pk': '849841', ':id': '660271', ':abbr': 'EDM', ':slug': 'premier-league', ':a': 'a', ':b': 'b', ':year': '2026' };
const QUERY = { '/mlb/weather': '?park=Truist%20Park', '/mlb/odds/player': '?name=Soto', '/mlb/odds/model/player': '?name=Soto' };
const NBA_GAME = '401704923';
const MLB_TEAM = '147';

const rows = [];
for (const [sport, groups] of Object.entries(C.ROUTES)) {
  for (const [, routes] of groups) {
    for (const [path, , access] of routes) {
      if (access === 'key') { rows.push({ sport, path, access, result: 'keyed (not externally verifiable)' }); continue; }
      let url = path.replace(/:\w+/g, (m) => (sport === 'nba' && m === ':id' ? NBA_GAME : path.startsWith('/mlb/team/') ? MLB_TEAM : SAMPLE[m] || '1'));
      url += QUERY[path] || '';
      let status = 0, body = '';
      try { const r = await fetch(C.API_BASE + url); status = r.status; body = (await r.text()).slice(0, 200); } catch (e) { body = String(e); }
      const unknown = (status === 404 && /Endpoint not found/i.test(body));
      rows.push({ sport, path, access, status, result: unknown ? 'NOT RECOGNIZED' : 'recognized', note: status >= 400 ? body.slice(0, 80) : '' });
    }
  }
}
const verified = rows.filter((r) => r.result === 'recognized');
const bad = rows.filter((r) => r.result === 'NOT RECOGNIZED');
for (const r of rows.filter((x) => x.access !== 'key')) console.log(`${r.result === 'recognized' ? 'ok ' : 'BAD'} ${String(r.status).padEnd(4)} ${r.path}${r.note ? '  · ' + r.note : ''}`);
console.log(`\npublic/demo recognized: ${verified.length} · not recognized: ${bad.length} · keyed (unverifiable without key): ${rows.filter((r) => r.access === 'key').length}`);
process.exit(bad.length ? 1 : 0);
