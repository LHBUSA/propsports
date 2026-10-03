// Captures real responses from the live PropSports API for the homepage console
// and sport pages. Arrays are trimmed for display; every trim is recorded.
// Usage: node scripts/capture-examples.mjs
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const API = 'https://propsports.proptechusa.ai/v1';
const UFC = 'https://ufc-api.propbetedge.ai';

const EXAMPLES = [
  { id: 'mlb', host: API, path: '/mlb/schedule/today', keep: 1 },
  { id: 'mlb-statcast', host: API, path: '/mlb/statcast/pitchers?limit=2', keep: 2 },
  { id: 'mlb-standings', host: API, path: '/mlb/standings', keep: 1 },
  { id: 'mlb-minors', host: API, path: '/mlb/minors/standings?level=11', keep: 1 },
  { id: 'nfl', host: API, path: '/nfl/schedule', keep: 1 },
  { id: 'nba', host: API, path: '/nba/schedule/today', keep: 1 },
  { id: 'nhl', host: API, path: '/nhl/standings', keep: 2 },
  { id: 'nhl-board', host: API, path: '/nhl/board', keep: 1 },
  { id: 'wnba', host: API, path: '/wnba/today', keep: 1 },
  { id: 'tennis', host: API, path: '/tennis/live', keep: 1 },
  { id: 'soccer', host: API, path: '/soccer/matches?limit=2', keep: 1 },
  { id: 'ufc', host: UFC, path: '/v1/ufc/events?status=upcoming&limit=2', keep: 2 }
];

function trim(value, keep, path, trims) {
  if (Array.isArray(value)) {
    if (value.length > keep) trims.push({ path: path || '$', kept: keep, total: value.length });
    return value.slice(0, keep).map((v, i) => trim(v, keep, `${path}[${i}]`, trims));
  }
  if (value && typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) out[k] = trim(v, keep, path ? `${path}.${k}` : k, trims);
    return out;
  }
  if (typeof value === 'string' && value.length > 160) {
    trims.push({ path, kept: 160, total: value.length, kind: 'string' });
    return value.slice(0, 157) + '...';
  }
  return value;
}

const out = { captured_at: new Date().toISOString(), note: 'Real responses captured from production. Arrays trimmed for display; see trims.', examples: {} };
for (const ex of EXAMPLES) {
  const url = ex.host + ex.path;
  const t0 = performance.now();
  let status = 0, body = null, error = null;
  try {
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    status = res.status;
    body = await res.json();
  } catch (e) { error = String(e && e.message || e); }
  const ms = Math.round(performance.now() - t0);
  const trims = [];
  out.examples[ex.id] = { url, host: ex.host, path: ex.path, status, ms, error, trims, body: body == null ? null : trim(body, ex.keep, '', trims) };
  console.log(`${ex.id.padEnd(14)} ${status} ${String(ms).padStart(5)}ms ${trims.length} trims`);
}
writeFileSync(join(root, 'assets', 'api-examples.json'), JSON.stringify(out, null, 2) + '\n');
