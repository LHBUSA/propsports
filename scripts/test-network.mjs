// Regression tests for PBEcast deep links and sport status semantics.
// Run: node scripts/test-network.mjs
process.env.TZ = 'America/Chicago'; // soccer local-day regression is pinned to a real viewer zone
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const N = require('../assets/ps-network.js');

let passed = 0;
const t = (name, fn) => { fn(); passed++; console.log('ok', name); };

/* ── deep links: exact production contracts ── */
t('MLB game → mlb PBEcast', () => assert.equal(N.castUrl('mlb', 823326, 'Live'), 'https://mlb.propbetedge.ai/pbecast?game=823326'));
t('NFL event → nfl PBEcast', () => assert.equal(N.castUrl('nfl', '401772510', 'Live'), 'https://nfl.propbetedge.ai/?event=401772510#pbecast'));
t('NBA event → NBACast', () => assert.equal(N.castUrl('nba', '401810001', 'Final'), 'https://nba.propbetedge.ai/#nbacast/401810001'));
t('WNBA event → WNBACast', () => assert.equal(N.castUrl('wnba', '401857189', 'Live'), 'https://wnba.propbetedge.ai/cast/401857189'));
t('NHL game → NHL PBEcast', () => assert.equal(N.castUrl('nhl', '2026020001', 'Live'), 'https://nhl.propbetedge.ai/#/cast/2026020001'));
const TENNIS = '03403c79-e9e7-586f-ae76-b52655725ff1', SOCCER = '061cc27f-1b38-5491-b0a8-d4aec2cfcc35';
t('Tennis live/final → PBEcast', () => { assert.equal(N.castUrl('tennis', TENNIS, 'Live'), `https://tennis.propbetedge.ai/pbecast/${TENNIS}`); assert.equal(N.castUrl('tennis', TENNIS, 'Final'), `https://tennis.propbetedge.ai/pbecast/${TENNIS}`); });
t('Tennis upcoming → exact match page', () => assert.equal(N.castUrl('tennis', TENNIS, 'Preview'), `https://tennis.propbetedge.ai/matches/${TENNIS}`));
t('Soccer match → soccer PBEcast', () => assert.equal(N.castUrl('soccer', SOCCER, 'Preview'), `https://soccer.propbetedge.ai/pbecast/${SOCCER}`));
t('missing / malformed IDs are not clickable', () => {
  for (const [s, id] of [['mlb', null], ['mlb', ''], ['mlb', 'abc'], ['nfl', '12'], ['nba', 'undefined'], ['nhl', '2026-02-0001'], ['tennis', '12345678'], ['soccer', 'not-a-uuid'], ['wnba', '401857189; drop']])
    assert.equal(N.castUrl(s, id, 'Live'), null, `${s} ${id}`);
});
t('UFC and unknown sports never get a guessed link', () => { assert.equal(N.castUrl('ufc', '845c3b2c-c201-4873-91eb-f5115d65b549', 'Preview'), null); assert.equal(N.castUrl('cricket', '123456', 'Live'), null); });
t('labels and actions', () => {
  assert.equal(N.castLabel('nba'), 'NBACast'); assert.equal(N.castLabel('wnba'), 'WNBACast'); assert.equal(N.castLabel('mlb'), 'MLB PBEcast');
  assert.equal(N.castAction('Live', 'mlb'), 'Open live cast'); assert.equal(N.castAction('Final', 'nhl'), 'Watch replay'); assert.equal(N.castAction('Preview', 'soccer'), 'Open preview'); assert.equal(N.castAction('Preview', 'tennis'), 'Open match preview');
});

t('currentUpcoming suppresses stale tennis fixtures but keeps the reconciliation window', () => {
  const now = Date.parse('2026-10-02T13:00:00Z');
  assert.equal(N.currentUpcoming('2026-09-30T15:00:00Z', now), false);
  assert.equal(N.currentUpcoming('2026-10-02T08:00:00Z', now), true);
  assert.equal(N.currentUpcoming('2026-10-02T06:00:00Z', now), false);
  assert.equal(N.currentUpcoming('2026-10-03T02:00:00Z', now), true);
  assert.equal(N.currentUpcoming(null, now), false);
});

t('soccer slate = viewer-local calendar day as a UTC window (2026-10-03 16:37 CDT)', () => {
  const now = new Date(2026, 9, 3, 16, 37); // local wall clock in America/Chicago
  assert.equal(now.toISOString(), '2026-10-03T21:37:00.000Z');
  const w = N.localDayWindow(now);
  assert.deepEqual(w, { from: '2026-10-03T05:00:00.000Z', to: '2026-10-04T04:59:59.999Z' });
  const expect = { '2026-10-03T00:00:00+00:00': false, '2026-10-03T02:00:00+00:00': false, '2026-10-03T20:00:00+00:00': true, '2026-10-03T22:30:00+00:00': true, '2026-10-04T00:45:00+00:00': true };
  for (const [k, inc] of Object.entries(expect)) assert.equal(N.inWindow(k, w), inc, k);
  // every included kickoff is on the viewer's local today: no "Yesterday" row, no late-evening drop
  const day = (v) => { const d = new Date(v); return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`; };
  for (const k of Object.keys(expect)) assert.equal(N.inWindow(k, w), day(k) === day(now), k);
  // window boundaries are inclusive of local midnight, exclusive of next local midnight
  assert.equal(N.inWindow('2026-10-03T05:00:00Z', w), true); assert.equal(N.inWindow('2026-10-04T05:00:00Z', w), false);
  assert.equal(N.inWindow(null, w), false);
});
t('soccer local window follows DST and is never hard-coded to one offset', () => {
  assert.deepEqual(N.localDayWindow(new Date(2026, 11, 15, 12)), { from: '2026-12-15T06:00:00.000Z', to: '2026-12-16T05:59:59.999Z' });
  assert.deepEqual(N.localDayWindow(new Date(2026, 10, 1, 12)), { from: '2026-11-01T05:00:00.000Z', to: '2026-11-02T05:59:59.999Z' }); // 25h fall-back day
});
t('stale unknown soccer fixtures never masquerade as NEXT', () => {
  const now = Date.parse('2026-10-03T21:37:00Z');
  assert.equal(N.unknownIsCurrent('unknown', '2026-10-03T00:00:00+00:00', now), false);
  assert.equal(N.unknownIsCurrent('unknown', '2026-10-03T02:00:00+00:00', now), false);
  assert.equal(N.unknownIsCurrent('unknown', '2026-10-03T20:00:00Z', now), true);  // short grace
  assert.equal(N.unknownIsCurrent('unknown', '2026-10-04T00:45:00Z', now), true);  // future stays pending
  assert.equal(N.unknownIsCurrent('unknown', null, now), false);
  for (const st of ['finished', 'live', 'scheduled']) assert.equal(N.unknownIsCurrent(st, '2026-10-01T00:00:00Z', now), true, st);
});

/* ── status semantics ── */
const ok = (meta) => ({ ok: true, status: 200, body: meta ? { meta } : {} });
const g = (state, extra = {}) => ({ state, start: '2026-10-01T23:00Z', isToday: false, ...extra });
const fmt = (d) => `D(${d})`;
t('healthy + live events → LIVE', () => assert.deepEqual([N.sportStatus(ok(), [g('Live'), g('Preview', { isToday: true })]).kind, N.sportStatus(ok(), [g('Live')]).text], ['live', '1 live now']));
t('healthy + games today → TODAY', () => assert.equal(N.sportStatus(ok(), [g('Preview', { isToday: true }), g('Final', { isToday: true })]).kind, 'today'));
t('healthy + future games → NEXT', () => { const s = N.sportStatus(ok(), [g('Preview')], null, fmt); assert.equal(s.kind, 'next'); assert.equal(s.text, 'Next · D(2026-10-01T23:00Z)'); });
t('healthy + zero games + active season → NO GAMES TODAY', () => { const s = N.sportStatus(ok({ lifecycle: 'active' }), []); assert.equal(s.kind, 'no_games'); assert.equal(s.text, 'No games today'); assert.notEqual(s.tone, 'bad'); });
t('healthy + season not started → SEASON NOT STARTED (never down)', () => { const s = N.sportStatus(ok({ service: 'healthy', lifecycle: 'season_not_started' }), []); assert.equal(s.kind, 'seasonal'); assert.equal(s.text, 'Season not started'); assert.notEqual(s.tone, 'bad'); });
t('healthy + preseason with verified next slate → PRESEASON · NEXT', () => { const s = N.sportStatus(ok({ service: 'healthy', lifecycle: 'preseason', season: 2027, next_slate: { date: '20261003' } }), [], null, fmt); assert.equal(s.text, 'Preseason · Next D(20261003)'); assert.equal(s.tone, 'idle'); assert.equal(s.season, 2027); });
t('healthy + offseason → OFFSEASON', () => { const s = N.sportStatus(ok({ lifecycle: 'offseason' }), []); assert.equal(s.text, 'Offseason'); assert.notEqual(s.tone, 'bad'); });
t('upstream failure → DEGRADED (red), unreachable → UNAVAILABLE', () => {
  const d = N.sportStatus({ ok: false, status: 503, body: { meta: { service: 'upstream_degraded' } } }, []); assert.equal(d.kind, 'degraded'); assert.equal(d.tone, 'bad'); assert.equal(d.text, 'Feed degraded');
  const u = N.sportStatus({ ok: false, status: 0, body: null }, []); assert.equal(u.kind, 'unavailable'); assert.equal(u.text, 'Feed unavailable');
});
t('season_not_started is never classified as a failure', () => { for (const lc of ['season_not_started', 'preseason', 'offseason']) assert.notEqual(N.sportStatus(ok({ lifecycle: lc }), []).tone, 'bad'); });
t('network summary separates active, seasonal and failing', () => {
  const s = N.networkSummary([N.sportStatus(ok(), [g('Live')]), N.sportStatus(ok({ lifecycle: 'preseason' }), []), N.sportStatus({ ok: false, status: 500 }, []), N.sportStatus(ok(), [g('Preview')])]);
  assert.deepEqual(s, { total: 4, active: 2, seasonal: 1, failing: 1 });
});
console.log(`${passed} passed`);
