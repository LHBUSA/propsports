/* PropSports network semantics — shared by the site and scripts/test-network.mjs.
   1. PBEcast deep links: canonical production routes for the exact event (never a guessed fallback).
      Contracts: LHBUSA/propbetedge-news-site src/live-cast-routes.js (MLB/NFL/NBA/WNBA/NHL),
      LHBUSA/tennis src/lib/routes.js (/pbecast/:id, /matches/:id), LHBUSA/soccer router (/pbecast/<uuid>).
   2. Sport status: service health and league lifecycle are independent dimensions.
      A healthy feed in a season that has not started is NOT down. */
(function (root) {
  var NUMERIC_ID = /^\d{6,12}$/;
  var UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  var CAST = {
    mlb: { id: NUMERIC_ID, label: 'MLB PBEcast', url: function (id) { return 'https://mlb.propbetedge.ai/pbecast?game=' + id; }, home: 'https://mlb.propbetedge.ai/pbecast' },
    nfl: { id: NUMERIC_ID, label: 'NFL PBEcast', url: function (id) { return 'https://nfl.propbetedge.ai/?event=' + id + '#pbecast'; }, home: 'https://nfl.propbetedge.ai/#pbecast' },
    nba: { id: NUMERIC_ID, label: 'NBACast', url: function (id) { return 'https://nba.propbetedge.ai/#nbacast/' + id; }, home: 'https://nba.propbetedge.ai/#nbacast' },
    wnba: { id: NUMERIC_ID, label: 'WNBACast', url: function (id) { return 'https://wnba.propbetedge.ai/cast/' + id; }, home: 'https://wnba.propbetedge.ai/cast' },
    nhl: { id: NUMERIC_ID, label: 'NHL PBEcast', url: function (id) { return 'https://nhl.propbetedge.ai/#/cast/' + id; }, home: 'https://nhl.propbetedge.ai/#/cast' },
    // Tennis PBEcast renders live matches and replays; upcoming matches have an exact match page instead.
    tennis: { id: UUID, label: 'Tennis PBEcast', url: function (id, state) { return state === 'Preview' ? 'https://tennis.propbetedge.ai/matches/' + id : 'https://tennis.propbetedge.ai/pbecast/' + id; }, home: 'https://tennis.propbetedge.ai/pbecast' },
    soccer: { id: UUID, label: 'Soccer PBEcast', url: function (id) { return 'https://soccer.propbetedge.ai/pbecast/' + id; }, home: 'https://soccer.propbetedge.ai/pbecast' }
    // UFC: the UFC site resolves events only by a name+date slug the API does not supply, so no exact-event link.
  };

  function castUrl(sport, eventId, state) {
    var c = CAST[String(sport || '').toLowerCase()];
    var id = eventId == null ? '' : String(eventId).trim();
    if (!c || !c.id.test(id)) return null;
    return c.url(encodeURIComponent(id), state);
  }
  function castLabel(sport) { var c = CAST[String(sport || '').toLowerCase()]; return c ? c.label : null; }
  function castHome(sport) { var c = CAST[String(sport || '').toLowerCase()]; return c ? c.home : null; }
  function castAction(state, sport) {
    if (state === 'Live') return 'Open live cast';
    if (state === 'Final') return 'Watch replay';
    return String(sport).toLowerCase() === 'tennis' ? 'Open match preview' : 'Open preview';
  }

  /* ── status ──────────────────────────────────────────── */
  // feed: { ok, status, body }  games: normalized events for the sport  now: Date
  var SEASONAL = { preseason: 'Preseason', season_not_started: 'Season not started', offseason: 'Offseason' };
  function sportStatus(feed, games, now, fmtDay) {
    games = games || [];
    fmtDay = fmtDay || function (d) { return d; };
    var meta = feed && feed.body && feed.body.meta || {};
    if (!feed || !feed.ok) {
      var unavailable = !feed || !feed.status || feed.status === 0;
      return { kind: unavailable ? 'unavailable' : 'degraded', tone: 'bad', text: unavailable ? 'Feed unavailable' : 'Feed degraded', lifecycle: meta.lifecycle || null };
    }
    var live = games.filter(function (g) { return g.state === 'Live'; }).length;
    if (live) return { kind: 'live', tone: 'live', text: live + ' live now', lifecycle: meta.lifecycle || 'active' };
    var today = games.filter(function (g) { return g.isToday; }).length;
    if (today) return { kind: 'today', tone: 'ok', text: today + ' on today’s slate', lifecycle: meta.lifecycle || 'active' };
    var next = games.filter(function (g) { return g.state === 'Preview'; }).sort(function (a, b) { return String(a.start || '').localeCompare(String(b.start || '')); })[0];
    var lc = meta.lifecycle;
    var nextSlate = meta.next_slate && meta.next_slate.date;
    if (SEASONAL[lc]) {
      var when = nextSlate ? fmtDay(nextSlate) : (next ? fmtDay(next.start) : null);
      return { kind: 'seasonal', tone: 'idle', lifecycle: lc, text: SEASONAL[lc] + (when ? ' · Next ' + when : ''), season: meta.season || null };
    }
    if (next) return { kind: 'next', tone: 'ok', text: 'Next · ' + fmtDay(next.start), lifecycle: lc || 'active' };
    return { kind: 'no_games', tone: 'idle', text: 'No games today', lifecycle: lc || 'active' };
  }
  function currentUpcoming(start, now) {
    var at = Date.parse(start || '');
    var t = now == null ? Date.now() : Number(now);
    return Number.isFinite(at) && Number.isFinite(t) && at >= t - 6 * 3600e3;
  }

  /* ── calendar day ───────────────────────────────────── */
  // The viewer's browser-local calendar day as an absolute UTC window. Soccer's `date=` is a UTC
  // day, so a local-day slate must be requested with timestamp `from`/`to` (never hard-code a zone).
  function localDayWindow(now) {
    var n = now == null ? new Date() : new Date(now);
    var start = new Date(n.getFullYear(), n.getMonth(), n.getDate(), 0, 0, 0, 0);
    var next = new Date(n.getFullYear(), n.getMonth(), n.getDate() + 1, 0, 0, 0, 0);
    return { from: start.toISOString(), to: new Date(next.getTime() - 1).toISOString() };
  }
  function inWindow(start, win) {
    var at = Date.parse(start || '');
    return Number.isFinite(at) && at >= Date.parse(win.from) && at <= Date.parse(win.to);
  }
  // Canonical soccer status `unknown` carries no evidence of state. Keep it while kickoff is ahead or
  // within a short grace period; a materially old unknown fixture is dropped, never shown as NEXT/LIVE/FINAL.
  var UNKNOWN_GRACE_MS = 3 * 3600e3;
  function unknownIsCurrent(status, start, now) {
    if (String(status || '').toLowerCase() !== 'unknown') return true;
    var at = Date.parse(start || ''), t = now == null ? Date.now() : Number(now);
    return Number.isFinite(at) && Number.isFinite(t) && at >= t - UNKNOWN_GRACE_MS;
  }

  function networkSummary(statuses) {
    var s = { total: statuses.length, active: 0, seasonal: 0, failing: 0 };
    statuses.forEach(function (x) {
      if (x.tone === 'bad') s.failing++;
      else if (x.kind === 'seasonal') s.seasonal++;
      else s.active++;
    });
    return s;
  }

  var api = { castUrl: castUrl, castLabel: castLabel, castHome: castHome, castAction: castAction, sportStatus: sportStatus, networkSummary: networkSummary, currentUpcoming: currentUpcoming, localDayWindow: localDayWindow, inWindow: inWindow, unknownIsCurrent: unknownIsCurrent, CAST_SPORTS: Object.keys(CAST) };
  root.PS_NETWORK = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
