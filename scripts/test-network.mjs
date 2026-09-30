// Regression tests for PBEcast deep links and sport status semantics.
// Run: node scripts/test-network.mjs
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
