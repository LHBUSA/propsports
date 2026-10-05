/* PropSports live network: polls public feeds, renders the operations table, metrics,
   sport rail, sportswire and (on sport pages) a single-sport live preview.
   Depends on ps-config.js and ps-network.js (cast links + status semantics). */
(function () {
  var C = window.PS_CONFIG, NET = window.PS_NETWORK, API = C.API_BASE, REFRESH = C.REFRESH_SECONDS * 1000;
  var SOCCER_ORIGIN = 'https://soccer.propbetedge.ai';
  var NAME = {}, COLOR = {};
  C.SPORTS.forEach(function (s) { NAME[s.id] = s.name; COLOR[s.id] = s.color; });

  var previewEl = document.querySelector('[data-live-preview]');
  var PREVIEW_SPORT = previewEl ? previewEl.getAttribute('data-live-preview') : null;
  var state = { sport: 'all', games: [], feeds: {}, fetchedAt: {}, health: null, status: {} };

  /* ── helpers ───────────────────────────────────────── */
  function safe(v) { return v == null ? '' : String(v); }
  function esc(v) { return safe(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'); }
  function arr(v) { return Array.isArray(v) ? v : []; }
  function num(v) { return v == null || v === '' || isNaN(Number(v)) ? null : Number(v); }
  function lastName(n) { n = safe(n).trim(); return n ? n.split(' ').pop() : ''; }
  function ordinal(n) { n = Number(n); if (!n) return ''; var s = ['th', 'st', 'nd', 'rd'], v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); }
  function isDateOnly(v) { return /^\d{4}-\d{2}-\d{2}$/.test(safe(v)); }
  function parseStart(v) {
    if (!v) return null;
    var s = safe(v);
    if (/^\d{8}$/.test(s)) return new Date(+s.slice(0, 4), +s.slice(4, 6) - 1, +s.slice(6, 8));
    if (isDateOnly(s)) { var p = s.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
    var d = new Date(s); return isNaN(d.getTime()) ? null : d;
  }
  function timeLabel(v) {
    var d = parseStart(v); if (!d) return '';
    if (isDateOnly(v)) return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }
  function dayDiff(v) {
    var d = parseStart(v); if (!d) return null;
    var t = new Date(); t.setHours(0, 0, 0, 0); var x = new Date(d.getTime()); x.setHours(0, 0, 0, 0);
    return Math.round((x - t) / 864e5);
  }
  function dayLabel(v) {
    var n = dayDiff(v), d = parseStart(v); if (n == null) return '';
    if (n === 0) return 'Today'; if (n === 1) return 'Tomorrow'; if (n === -1) return 'Yesterday';
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' });
  }
  function shortDay(v) {
    var n = dayDiff(v), d = parseStart(v); if (!d) return '';
    if (n === 0) return 'today'; if (n === 1) return 'tomorrow';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
  function stateFrom(value) {
    var x = safe(value).toLowerCase();
    if (x === 'live' || x === 'in' || x === 'crit' || x === 'in_progress' || x === 'in_play' || x === 'inplay' || x === 'paused' || x === 'ht' || x.indexOf('progress') >= 0 || x.indexOf('halftime') >= 0) return 'Live';
    if (x === 'final' || x === 'post' || x === 'completed' || x === 'finished' || x === 'retired' || x === 'off' || x === 'ft') return 'Final';
    return 'Preview';
  }
  function periodLabel(p, reg) { p = Number(p) || 0; if (!p) return ''; return p > reg ? (p - reg > 1 ? (p - reg) + 'OT' : 'OT') : 'Q' + p; }
  function recordOf(records) { var r = arr(records).filter(function (x) { return x && x.type === 'total'; })[0] || arr(records)[0]; return r && r.summary || ''; }
  function espnLogo(league, abbr) { return abbr ? 'https://a.espncdn.com/i/teamlogos/' + league + '/500/' + String(abbr).toLowerCase() + '.png' : ''; }
  function soccerCrest(c) {
    var u = c && (typeof c === 'object' ? c.url : c) || '';
    if (!u) return '';
    if (/^https?:\/\//i.test(u)) return u;
    if (u.charAt(0) === '/') return SOCCER_ORIGIN + u;
    return SOCCER_ORIGIN + '/' + String(u).replace(/^\.\//, '');
  }
  function fetchJSON(url, noStore) {
    return fetch(url, { headers: { Accept: 'application/json' }, cache: noStore ? 'no-store' : 'default' }).then(function (r) {
      return r.json().catch(function () { return null; }).then(function (j) { return { ok: r.ok && !(j && j.error), status: r.status, body: j }; });
    }).catch(function () { return { ok: false, status: 0, body: null }; });
  }

  /* ── adapters: one normalized event model per feed; eventId is the source's own identifier ── */
  function addMLB(all, d) {
    arr(d && d.games).forEach(function (g) {
      var st = stateFrom(g.status && g.status.abstractGameState || 'Preview');
      var away = g.teams && g.teams.away || {}, home = g.teams && g.teams.home || {};
      var at = away.team || {}, ht = home.team || {}, l = g.linescore || {};
      var pp = away.probablePitcher && away.probablePitcher.fullName || '', hp = home.probablePitcher && home.probablePitcher.fullName || '';
      var detailed = g.status && g.status.detailedState || '';
      var rec = function (s) { var r = s.leagueRecord; return r && r.wins != null ? r.wins + '-' + r.losses : ''; };
      var o = { sport: 'mlb', eventId: g.gamePk, state: st, away: at.shortName || at.name || '', home: ht.shortName || ht.name || '', aAb: at.abbreviation || '', hAb: ht.abbreviation || '',
        awayLogo: at.id ? 'https://www.mlbstatic.com/team-logos/' + at.id + '.svg' : '', homeLogo: ht.id ? 'https://www.mlbstatic.com/team-logos/' + ht.id + '.svg' : '',
        aRec: rec(away), hRec: rec(home), aS: away.score, hS: home.score, start: g.gameDate, venue: g.venue && g.venue.name || '',
        comp: [g.seriesDescription || 'MLB', g.gamesInSeries > 1 && g.seriesGameNumber ? 'Gm ' + g.seriesGameNumber : ''].filter(Boolean).join(' · ') };
      var note = /delay|postpon|suspend|cancel/i.test(detailed) ? detailed : '';
      if (st === 'Live') {
        var half = safe(l.inningState || l.inningHalf).toLowerCase(), inn = l.currentInningOrdinal || ordinal(l.currentInning);
        o.clock = half === 'middle' ? 'Mid ' + inn : (half === 'end' ? 'End ' + inn : ((l.isTopInning ? '▲ ' : '▼ ') + inn));
        if (half !== 'middle' && half !== 'end') {
          var off = l.offense || {};
          o.bases = [!!off.first, !!off.second, !!off.third];
          o.outs = num(l.outs);
          o.sub = [l.balls != null && l.strikes != null ? l.balls + '-' + l.strikes : '', off.batter && off.batter.fullName ? 'AB ' + lastName(off.batter.fullName) : ''].filter(Boolean).join(' · ');
        }
        if (note) o.sub = note;
      } else if (st === 'Final') {
        o.clock = 'Final' + (Number(l.currentInning) > Number(l.scheduledInnings || 9) ? '/' + l.currentInning : '');
      } else {
        o.clock = timeLabel(g.gameDate); o.sub = note || (pp && hp ? lastName(pp) + ' vs ' + lastName(hp) : 'Probables TBD');
      }
      all.push(o);
    });
  }
  function addNFL(all, d) {
    arr(d && d.games).forEach(function (g) {
      var away = g.teams && g.teams.away || {}, home = g.teams && g.teams.home || {}, s = g.status || {}, st = stateFrom(s.semantics);
      var o = { sport: 'nfl', eventId: g.id, state: st, away: away.short_name || away.abbreviation || '', home: home.short_name || home.abbreviation || '', aAb: away.abbreviation || '', hAb: home.abbreviation || '',
        awayLogo: away.logo || '', homeLogo: home.logo || '', aRec: recordOf(away.records), hRec: recordOf(home.records),
        aS: away.score, hS: home.score, start: g.date, venue: g.venue && g.venue.name || '',
        comp: [g.season && g.season.type === 3 ? 'Postseason' : (g.season && g.season.type === 1 ? 'Preseason' : ''), g.week ? 'Week ' + g.week : ''].filter(Boolean).join(' · ') || 'NFL' };
      if (st === 'Live') { o.clock = /half/i.test(s.detail || s.short_detail || '') ? 'Half' : [periodLabel(s.period, 4), s.clock].filter(Boolean).join(' '); o.sub = [away.possession ? away.abbreviation + ' ball' : (home.possession ? home.abbreviation + ' ball' : ''), arr(g.broadcast).join(', ')].filter(Boolean).join(' · '); }
      else if (st === 'Final') o.clock = /final\/\w+/i.test(s.short_detail || '') ? s.short_detail : (Number(s.period) > 4 ? 'Final/OT' : 'Final');
      else { o.clock = timeLabel(g.date); o.sub = arr(g.broadcast).join(', '); }
      all.push(o);
    });
  }
  function addNBA(all, d) {
    arr(d && d.games).forEach(function (g) {
      var st = stateFrom(g.statusState || g.status);
      var o = { sport: 'nba', eventId: g.id, state: st, away: g.awayAbbr || g.away || '', home: g.homeAbbr || g.home || '', aAb: g.awayAbbr || '', hAb: g.homeAbbr || '',
        awayLogo: g.awayLogo || espnLogo('nba', g.awayAbbr), homeLogo: g.homeLogo || espnLogo('nba', g.homeAbbr), aS: g.awayScore, hS: g.homeScore, start: g.date, comp: 'NBA' };
      if (st === 'Live') o.clock = [periodLabel(g.period, 4), g.clock].filter(Boolean).join(' ');
      else if (st === 'Final') o.clock = Number(g.period) > 4 ? 'Final/OT' : 'Final';
      else o.clock = timeLabel(g.date);
      all.push(o);
    });
  }
  function addWNBA(all, d) {
    var data = d && d.data || {}, slate = data.slate || {};
    arr(slate.games).forEach(function (g) {
      var s = g.status || {}, st = stateFrom(s.state), away = g.away || {}, home = g.home || {};
      var o = { sport: 'wnba', eventId: g.game_id, state: st, away: away.short_name || away.abbr || '', home: home.short_name || home.abbr || '', aAb: away.abbr || '', hAb: home.abbr || '',
        awayLogo: espnLogo('wnba', away.abbr), homeLogo: espnLogo('wnba', home.abbr), aRec: away.record || '', hRec: home.record || '',
        aS: away.score, hS: home.score, start: g.start_utc, comp: [g.season && g.season.label || 'WNBA', slate.kind === 'NEXT' ? 'Next slate' : ''].filter(Boolean).join(' · ') };
      if (st === 'Live') o.clock = /half/i.test(s.detail || '') ? 'Half' : [periodLabel(s.period, 4), s.clock].filter(Boolean).join(' ');
      else if (st === 'Final') o.clock = Number(s.period) > 4 ? 'Final/OT' : 'Final';
      else o.clock = timeLabel(g.start_utc);
      all.push(o);
    });
  }
  function addNHL(all, d) {
    arr(d && d.games).forEach(function (g) {
      var away = g.teams && g.teams.away || {}, home = g.teams && g.teams.home || {}, s = g.status || {}, st = stateFrom(s.semantics || s);
      var types = { 1: 'Preseason', 2: 'Regular Season', 3: 'Playoffs' };
      var o = { sport: 'nhl', eventId: g.id, state: st, away: away.name || away.abbrev || '', home: home.name || home.abbrev || '', aAb: away.abbrev || '', hAb: home.abbrev || '',
        awayLogo: away.logo || '', homeLogo: home.logo || '', aS: away.score, hS: home.score, start: g.start_time_utc, venue: g.venue || '', comp: types[g.game_type] || 'NHL' };
      var per = s.period_type && s.period_type !== 'REG' ? s.period_type : ordinal(s.period);
      var sog = away.sog != null && home.sog != null ? 'SOG ' + away.sog + '–' + home.sog : '';
      if (st === 'Live') { o.clock = s.in_intermission ? 'INT ' + per : [per, s.clock].filter(Boolean).join(' '); o.sub = sog; }
      else if (st === 'Final') { o.clock = 'Final' + (s.last_period_type && s.last_period_type !== 'REG' ? '/' + s.last_period_type : ''); o.sub = sog; }
      else o.clock = timeLabel(g.start_time_utc);
      all.push(o);
    });
  }
  function tennisSide(side) {
    var ps = side && side.players ? side.players : [];
    if (ps.length === 1) { var p = ps[0] || {}; return { name: p.name || p.last_name || 'TBD', short: p.last_name || p.name || 'TBD', code: p.nationality || '', photo: p.photo && p.photo.thumb || '' }; }
    var n = ps.map(function (p) { return p && (p.last_name || p.name) || ''; }).filter(Boolean).join(' / ');
    return { name: n || 'TBD', short: n || 'TBD', code: ps.length ? 'DBL' : '', photo: '' };
  }
  function addTennis(all, d) {
    var data = d && d.data || {}, live = arr(data.live), now = new Date();
    var upcoming = arr(data.upcoming).filter(function (g) {
      return NET.currentUpcoming(g && g.scheduled_at) && NET.isLocalDay(g && g.scheduled_at, now);
    });
    var matches = live.concat(upcoming.slice(0, 12));
    matches.forEach(function (g) {
      var st = stateFrom(g.status), A = tennisSide(g.sides && g.sides.A), B = tennisSide(g.sides && g.sides.B), t = g.tournament || {};
      var o = { sport: 'tennis', eventId: g.id, state: st, tennis: true, away: A.name, home: B.name, aAb: A.short, hAb: B.short, aRec: A.code, hRec: B.code, awayLogo: A.photo, homeLogo: B.photo, face: true,
        sets: arr(g.sets).map(function (x) { return { a: num(x.A), b: num(x.B), w: x.winner }; }), start: g.scheduled_at, winner: g.winner_side,
        comp: [t.tournament || t.name || 'Tennis', t.level || safe(g.tour).toUpperCase()].filter(Boolean).join(' · '), venue: g.court || '', score: g.score || '' };
      if (st === 'Live') { var lv = g.live || {}; o.point = lv.point || null; o.server = lv.server || ''; o.clock = 'Set ' + (o.sets.length || 1); o.sub = [g.round || '', lv.point ? 'Pt ' + (lv.point.A || '0') + '–' + (lv.point.B || '0') : ''].filter(Boolean).join(' · '); }
      else if (st === 'Final') o.clock = 'Final';
      else { o.clock = timeLabel(g.scheduled_at) || 'TBD'; o.sub = g.round || ''; }
      all.push(o);
    });
  }
  function addSoccer(all, d) {
    var win = NET.localDayWindow(), now = Date.now();
    arr(d && d.data).forEach(function (g) {
      if (!NET.inWindow(g.kickoff_at, win) || !NET.unknownIsCurrent(g.status, g.kickoff_at, now)) return;
      var raw = safe(g.status).toLowerCase(), st = stateFrom(g.status), sc = g.score || {}, h = g.home || {}, a = g.away || {};
      var o = { sport: 'soccer', eventId: g.id, state: st, away: a.short_name || a.name || '', home: h.short_name || h.name || '', aAb: a.short_name || a.name || '', hAb: h.short_name || h.name || '',
        awayLogo: soccerCrest(a.crest), homeLogo: soccerCrest(h.crest), aS: sc.away, hS: sc.home, start: g.kickoff_at,
        comp: g.competition && g.competition.name || 'Soccer' };
      var md = g.matchday ? 'Matchday ' + g.matchday : safe(g.round);
      if (st === 'Live') { var min = g.minute || g.clock || sc.minute; o.clock = raw === 'ht' || raw.indexOf('half') >= 0 ? 'HT' : (min ? min + "'" : 'Live'); o.sub = md; }
      else if (st === 'Final') { o.clock = 'FT'; o.sub = md; }
      else { o.clock = timeLabel(g.kickoff_at); o.sub = raw === 'unknown' && Date.parse(g.kickoff_at) < now ? 'Status pending' : md; }
      all.push(o);
    });
  }
  function addUFC(all, d) {
    var e = arr(d && d.data)[0]; if (!e) return;
    var name = e.name || e.event_name || 'Upcoming UFC event', date = e.event_date || e.date || null;
    var n = dayDiff(date);
    all.push({ sport: 'ufc', eventId: e.id, state: 'Preview', event: true, away: '', home: name, aAb: 'UFC', hAb: name, start: date,
      comp: /^UFC \d+/.test(name) ? 'Numbered event' : (/fight night/i.test(name) ? 'Fight Night' : 'Next event'),
      clock: timeLabel(date) || 'Date TBA', sub: n == null ? '' : (n <= 0 ? 'Fight day' : (n === 1 ? 'Tomorrow' : 'In ' + n + ' days')),
      venue: [e.venue, [e.city, e.region || e.country].filter(Boolean).join(', ')].filter(Boolean).join(' · ') });
  }

  var FEEDS = [
    { sport: 'mlb', url: function () { return API + '/mlb/schedule/today'; }, add: addMLB },
    { sport: 'nfl', url: function () { return API + '/nfl/schedule'; }, add: addNFL },
    { sport: 'nba', url: function () { return API + '/nba/schedule/today'; }, add: addNBA },
    { sport: 'wnba', url: function () { return API + '/wnba/today'; }, add: addWNBA },
    { sport: 'nhl', url: function () { return API + '/nhl/schedule/today'; }, add: addNHL },
    { sport: 'tennis', url: function () { return API + '/tennis/today'; }, add: addTennis },
    { sport: 'soccer', url: function () { var w = NET.localDayWindow(); return API + '/soccer/matches?from=' + encodeURIComponent(w.from) + '&to=' + encodeURIComponent(w.to) + '&order=asc&limit=40'; }, add: addSoccer },
    { sport: 'ufc', url: function () { return C.UFC_BASE + '/v1/ufc/events?status=upcoming&limit=2'; }, add: addUFC }
  ];
  if (PREVIEW_SPORT) FEEDS = FEEDS.filter(function (f) { return f.sport === PREVIEW_SPORT; });

  /* ── rendering ─────────────────────────────────────── */
  var RANK = { Live: 0, Preview: 1, Final: 2 };
  function byState(a, b) { return (RANK[a.state] - RANK[b.state]) || String(a.start || '').localeCompare(String(b.start || '')); }
  function hasScore(g) { return num(g.aS) != null && num(g.hS) != null && g.state !== 'Preview'; }
  function matchup(g) { return g.event ? g.home : (g.away + (g.tennis ? ' vs ' : ' at ') + g.home); }
  function castFor(g) {
    var url = NET.castUrl(g.sport, g.eventId, g.state);
    return url ? { url: url, label: NET.castLabel(g.sport), action: NET.castAction(g.state, g.sport) } : null;
  }
  function castAttrs(g, cast, surface) {
    return ' href="' + esc(cast.url) + '" target="_blank" rel="noopener" data-cast="' + esc(g.sport) + '" data-event="' + esc(g.eventId) + '" data-state="' + esc(g.state) + '" data-surface="' + surface + '"';
  }
  function img(src, label, face) {
    var fb = esc(safe(label).slice(0, 3).toUpperCase());
    if (!src) return '<span class="ph">' + fb + '</span>';
    return '<img src="' + esc(src) + '" alt="" loading="lazy"' + (face ? ' class="face"' : '') + ' data-fb="' + fb + '" onerror="var s=document.createElement(\'span\');s.className=\'ph\';s.textContent=this.getAttribute(\'data-fb\');this.replaceWith(s)">';
  }
  function eventCell(g) {
    if (g.event) return '<div class="ev card-ev">' + '<span class="ph">UFC</span><span class="tm lead">' + esc(g.home) + '</span></div>';
    var a = num(g.aS), h = num(g.hS), sc = hasScore(g);
    var aL = sc && a > h, hL = sc && h > a;
    if (g.tennis) {
      var sets = function (k) {
        var cells = g.sets.map(function (s, i) {
          var v = s[k], o = s[k === 'a' ? 'b' : 'a'], won = s.w ? s.w === (k === 'a' ? 'A' : 'B') : (v != null && o != null && v > o && (i < g.sets.length - 1 || g.state === 'Final'));
          return '<span' + (won ? ' class="w"' : '') + '>' + (v == null ? '-' : v) + '</span>';
        }).join('');
        if (g.state === 'Live' && g.point) cells += '<span class="pt">' + esc(g.point[k === 'a' ? 'A' : 'B'] || '0') + '</span>';
        return '<span class="sets">' + cells + '</span>';
      };
      var started = g.sets.length && g.state !== 'Preview';
      var wA = g.state === 'Final' && g.winner === 'A', wB = g.state === 'Final' && g.winner === 'B';
      return '<div class="ev">' +
        img(g.awayLogo, g.aRec || g.aAb, true) + '<span class="tm' + (wA ? ' lead' : '') + '">' + esc(g.away) + (g.aRec ? '<small>' + esc(g.aRec) + '</small>' : '') + (g.state === 'Live' && g.server === 'A' ? '<i class="sv" title="Serving"></i>' : '') + '</span>' + (started ? sets('a') : '<span></span>') +
        img(g.homeLogo, g.hRec || g.hAb, true) + '<span class="tm' + (wB ? ' lead' : '') + '">' + esc(g.home) + (g.hRec ? '<small>' + esc(g.hRec) + '</small>' : '') + (g.state === 'Live' && g.server === 'B' ? '<i class="sv" title="Serving"></i>' : '') + '</span>' + (started ? sets('b') : '<span></span>') +
        '</div>';
    }
    return '<div class="ev">' +
      img(g.awayLogo, g.aAb || g.away) + '<span class="tm' + (aL ? ' lead' : '') + '">' + esc(g.away) + (g.aRec ? '<small>' + esc(g.aRec) + '</small>' : '') + '</span>' + '<span class="s' + (aL ? ' lead' : '') + '">' + (sc ? esc(g.aS) : '') + '</span>' +
      img(g.homeLogo, g.hAb || g.home) + '<span class="tm' + (hL ? ' lead' : '') + '">' + esc(g.home) + (g.hRec ? '<small>' + esc(g.hRec) + '</small>' : '') + '</span>' + '<span class="s' + (hL ? ' lead' : '') + '">' + (sc ? esc(g.hS) : '') + '</span>' +
      '</div>';
  }
  function telemetry(g) {
    var bits = '';
    if (g.bases) bits += '<span class="bases" role="img" aria-label="Runners: ' + ['first', 'second', 'third'].filter(function (_, i) { return g.bases[i]; }).join(', ') + (g.bases.some(Boolean) ? '' : 'none') + '">' + g.bases.map(function (b) { return '<i' + (b ? ' class="on"' : '') + '></i>'; }).join('') + '</span>';
    if (g.outs != null) bits += '<span class="outs" role="img" aria-label="' + g.outs + ' out">' + [0, 1, 2].map(function (i) { return '<i' + (i < g.outs ? ' class="on"' : '') + '></i>'; }).join('') + '</span>';
    return bits;
  }
  function stateLabel(g) { return g.state === 'Live' ? 'Live' : (g.state === 'Final' ? 'Final' : (g.event ? 'Next event' : (dayLabel(g.start) === 'Today' ? 'Today' : 'Next'))); }
  function row(g) {
    var cls = g.state === 'Live' ? 'st-live' : (g.state === 'Final' ? 'st-final' : 'st-next');
    var when = g.state === 'Preview' && !g.event && dayLabel(g.start) !== 'Today' ? dayLabel(g.start) + ' ' : '';
    var cast = castFor(g);
    var ev = eventCell(g);
    return '<tr class="' + (g.state === 'Live' ? 'is-live' : '') + (cast ? ' has-cast' : '') + '" data-sport="' + g.sport + '" style="--c:' + COLOR[g.sport] + '">' +
      '<td class="c-sport"><span class="sport-tag" style="--c:' + COLOR[g.sport] + '">' + NAME[g.sport].toUpperCase() + '</span></td>' +
      '<td class="c-comp" title="' + esc(g.comp) + '">' + esc(g.comp) + '</td>' +
      '<td class="c-event">' + (cast ? '<a class="ev-link" tabindex="-1"' + castAttrs(g, cast, 'scoreboard') + '>' + ev + '</a>' : ev) + '</td>' +
      '<td class="c-state"><span class="st ' + cls + '">' + stateLabel(g) + '</span></td>' +
      '<td class="c-clock"><span class="clk">' + esc(when + (g.clock || '')) + '</span>' + telemetry(g) + (g.sub ? '<span class="sub">' + esc(g.sub) + '</span>' : '') + '</td>' +
      '<td class="c-venue" title="' + esc(g.venue) + '">' + esc(g.venue || '—') + '</td>' +
      '<td class="c-age" data-age="' + g.sport + '"></td>' +
      '<td class="c-cast">' + (cast ? '<a class="cast"' + castAttrs(g, cast, 'scoreboard') + ' aria-label="' + esc(cast.action + ': ' + matchup(g) + ' in ' + cast.label) + '"><span class="cast-k">' + esc(cast.label) + '</span><span class="cast-a">' + esc(cast.action) + ' <span aria-hidden="true">→</span></span></a>' : '') + '</td></tr>';
  }
  function patch(tbody, rows) {
    var prev = tbody._rows;
    if (prev && prev.length === rows.length && tbody.children.length === rows.length) {
      for (var i = 0; i < rows.length; i++) if (prev[i] !== rows[i]) tbody.children[i].outerHTML = rows[i];
    } else tbody.innerHTML = rows.join('');
    tbody._rows = rows;
  }
  function ageText(sport) {
    var t = state.fetchedAt[sport]; if (!t) return '—';
    var s = Math.max(0, Math.round((Date.now() - t) / 1000));
    return s < 60 ? s + 's ago' : Math.floor(s / 60) + 'm ago';
  }
  function tickAges() { document.querySelectorAll('[data-age]').forEach(function (el) { el.textContent = ageText(el.getAttribute('data-age')); }); }
  function seasonLabel(year) { year = Number(year); return year ? (year - 1) + '–' + String(year).slice(2) + ' season' : ''; }

  /* intentional empty states: seasonal idle is never presented as a failure */
  function emptyState(sport) {
    var st = state.status[sport] || {}, f = state.feeds[sport] || {}, name = NAME[sport];
    if (st.tone === 'bad') return '<div class="ops-state bad"><b>' + esc(name) + ' feed ' + (st.kind === 'unavailable' ? 'unavailable' : 'degraded') + '</b><p>The upstream source is not responding right now' + (f.status ? ' (HTTP ' + f.status + ')' : '') + '. Other sports are unaffected.</p></div>';
    if (st.kind === 'seasonal') return '<div class="ops-state idle"><span class="ops-state-k">' + esc(name) + (st.season ? ' · ' + esc(seasonLabel(st.season)) : '') + '</span><b>' + esc(st.text.split(' · ')[0]) + '</b><p>No games on today’s slate.' + (st.text.indexOf('Next') >= 0 ? ' ' + esc(st.text.split(' · ')[1]) + '.' : '') + ' PropSports ' + esc(name) + ' data populates as games are scheduled.</p></div>';
    return '<div class="ops-state idle"><b>No ' + esc(name) + ' games today</b><p>The feed is healthy; nothing is scheduled on the current slate.</p></div>';
  }
  function renderTable() {
    var tbody = document.getElementById('ops-body'); if (!tbody) return;
    var list = (state.sport === 'all' ? state.games : state.games.filter(function (g) { return g.sport === state.sport; })).slice().sort(byState);
    var max = state.sport === 'all' ? 14 : 40, shown = list.slice(0, max);
    var foot = document.getElementById('ops-count');
    if (foot) foot.textContent = list.length ? 'Showing ' + shown.length + ' of ' + list.length + (state.sport === 'all' ? ' events · live first' : ' ' + NAME[state.sport] + ' events') : '';
    if (!shown.length) {
      tbody._rows = null;
      tbody.innerHTML = '<tr><td class="ops-empty" colspan="8">' + (state.sport === 'all' ? '<div class="ops-state idle"><b>No events on the current slate</b></div>' : emptyState(state.sport)) + '</td></tr>';
      return;
    }
    patch(tbody, shown.map(row));
    tickAges();
  }
  function renderTabs(counts, liveBy) {
    document.querySelectorAll('.ops-tab').forEach(function (t) {
      var s = t.getAttribute('data-sport'), n = t.querySelector('.n'), st = state.status[s];
      if (n) n.textContent = s === 'all' ? state.games.length : (counts[s] || 0);
      t.classList.toggle('has-live', s === 'all' ? state.games.some(function (g) { return g.state === 'Live'; }) : !!liveBy[s]);
      t.classList.toggle('is-bad', !!(st && st.tone === 'bad'));
      t.classList.toggle('is-idle', !!(st && st.kind === 'seasonal'));
      if (st && s !== 'all') t.setAttribute('title', NAME[s] + ': ' + st.text);
    });
  }
  function setMetric(id, html) { var el = document.getElementById(id); if (el) el.innerHTML = html; }
  function renderMetrics() {
    var statuses = FEEDS.map(function (f) { return state.status[f.sport]; }).filter(Boolean);
    var sum = NET.networkSummary(statuses);
    var live = state.games.filter(function (g) { return g.state === 'Live'; }).length;
    var today = state.games.filter(function (g) { return g.state === 'Live' || g.isToday; }).length;
    var parts = [sum.active + ' active'];
    if (sum.seasonal) parts.push(sum.seasonal + ' between seasons');
    if (sum.failing) parts.push('<span class="bad">' + sum.failing + ' degraded</span>');
    setMetric('m-online', sum.total + '<small>sports</small>');
    setMetric('m-online-detail', parts.join(' · '));
    setMetric('m-live', String(live));
    var lm = document.getElementById('m-live'); if (lm) lm.parentNode.classList.toggle('live', live > 0);
    setMetric('m-today', String(today));
    var h = state.health;
    setMetric('m-health', h ? (h.ok ? '<span class="ok">OK</span><small>' + h.ms + ' ms · v' + esc(h.version || '?') + '</small>' : '<span class="bad">Unreachable</span><small>HTTP ' + (h.status || 'error') + '</small>') : '—');
  }
  function renderRail() {
    document.querySelectorAll('[data-rail]').forEach(function (el) {
      var st = state.status[el.getAttribute('data-rail')];
      if (!st) return;
      el.className = 'rail-state ' + ({ live: 'live', ok: 'ok', idle: 'idle', bad: 'bad' })[st.tone];
      el.textContent = st.text;
    });
  }
  function renderWire() {
    var track = document.getElementById('wire-track'); if (!track) return;
    var items = [], seen = {};
    state.games.slice().sort(byState).forEach(function (g) {
      if (items.length >= 24) return;
      var k = g.sport + g.away + g.home; if (seen[k]) return; seen[k] = 1;
      var sc = hasScore(g), a = num(g.aS), h = num(g.hS);
      var st = g.state === 'Live' ? (g.clock || 'Live') : (g.state === 'Final' ? (g.clock || 'Final') : [dayLabel(g.start) !== 'Today' ? dayLabel(g.start) : '', g.event ? '' : timeLabel(g.start)].filter(Boolean).join(' '));
      var body = g.event ? '<b>' + esc(g.home) + '</b>'
        : g.tennis ? '<b>' + esc(g.aAb) + '</b> v <b>' + esc(g.hAb) + '</b>' + (g.state === 'Live' && g.score ? ' <span class="sc">' + esc(g.score) + '</span>' : '')
        : '<b>' + esc(g.aAb || g.away) + '</b>' + (sc ? ' <span class="sc' + (a < h ? ' dim' : '') + '">' + esc(g.aS) + '</span>' : '') + (sc ? ' ' : ' @ ') + '<b>' + esc(g.hAb || g.home) + '</b>' + (sc ? ' <span class="sc' + (h < a ? ' dim' : '') + '">' + esc(g.hS) + '</span>' : '');
      items.push('<span class="wi' + (g.state === 'Live' ? ' live' : '') + '">' + (g.state === 'Live' ? '<i class="dot"></i>' : '') + '<span class="sp">' + NAME[g.sport].toUpperCase() + '</span>' + body + '<span class="st">' + esc(st) + '</span></span>');
    });
    if (!items.length) return;
    var html = items.join('');
    if (track._html === html) return;
    track._html = html;
    track.innerHTML = html + html;
    track.style.setProperty('--wire-dur', Math.max(40, Math.round(track.scrollWidth / 2 / 55)) + 's');
  }

  /* ── sport-page live preview: one real featured event ── */
  function renderPreview() {
    if (!previewEl) return;
    var sport = PREVIEW_SPORT, games = state.games.filter(function (g) { return g.sport === sport; });
    var pick = games.filter(function (g) { return g.state === 'Live'; })[0]
      || games.filter(function (g) { return g.state === 'Preview'; }).sort(byState)[0]
      || games.filter(function (g) { return g.state === 'Final'; }).sort(function (a, b) { return String(b.start || '').localeCompare(String(a.start || '')); })[0];
    var body = previewEl.querySelector('[data-preview-body]'), meta = previewEl.querySelector('[data-preview-meta]');
    var st = state.status[sport] || {};
    if (meta) meta.innerHTML = '<i class="pv-dot ' + (st.tone || 'ok') + '"></i>' + esc(st.text || 'Connecting…') + ' · synced ' + new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit' });
    if (!body) return;
    if (!pick) { var html = emptyState(sport); if (body._html !== html) { body._html = html; body.innerHTML = html; } return; }
    var cast = castFor(pick);
    var html2 = '<div class="pv-card" style="--c:' + COLOR[sport] + '">' +
      '<div class="pv-top"><span class="sport-tag" style="--c:' + COLOR[sport] + '">' + NAME[sport].toUpperCase() + '</span><span class="pv-comp">' + esc(pick.comp) + '</span><span class="st ' + (pick.state === 'Live' ? 'st-live' : pick.state === 'Final' ? 'st-final' : 'st-next') + '">' + stateLabel(pick) + '</span></div>' +
      '<div class="pv-ev">' + eventCell(pick) + '</div>' +
      '<div class="pv-clock"><span class="clk">' + esc((pick.state === 'Preview' && !pick.event && dayLabel(pick.start) !== 'Today' ? dayLabel(pick.start) + ' ' : '') + (pick.clock || '')) + '</span>' + telemetry(pick) + (pick.sub ? '<span class="sub">' + esc(pick.sub) + '</span>' : '') + (pick.venue ? '<span class="sub">' + esc(pick.venue) + '</span>' : '') + '</div>' +
      (cast ? '<div class="pv-flow"><span>PropSports API</span><i aria-hidden="true">→</i><span>' + esc(cast.label) + '</span></div><a class="btn btn-primary pv-cta"' + castAttrs(pick, cast, 'sport_page') + ' aria-label="' + esc(cast.action + ': ' + matchup(pick) + ' in ' + cast.label) + '">' + esc(cast.action) + ' <span aria-hidden="true">→</span></a>' : '') +
      '</div>';
    if (body._html !== html2) { body._html = html2; body.innerHTML = html2; }
  }

  function render() {
    var counts = {}, liveBy = {};
    state.games.forEach(function (g) { counts[g.sport] = (counts[g.sport] || 0) + 1; if (g.state === 'Live') liveBy[g.sport] = 1; });
    renderTable(); renderTabs(counts, liveBy); renderMetrics(); renderRail(); renderWire(); renderPreview();
  }

  /* ── polling ───────────────────────────────────────── */
  var busy = false;
  function load() {
    if (busy) return; busy = true;
    var sync = document.getElementById('ops-sync'); if (sync) sync.classList.add('busy');
    var t0 = performance.now();
    var health = PREVIEW_SPORT ? Promise.resolve() : fetchJSON(API + '/health', true).then(function (r) {
      state.health = { ok: r.ok && r.body && r.body.status === 'live', ms: Math.round(performance.now() - t0), status: r.status, version: r.body && r.body.version };
    });
    var feeds = FEEDS.map(function (f) {
      return fetchJSON(f.url()).then(function (r) { state.feeds[f.sport] = r; state.fetchedAt[f.sport] = Date.now(); return r; });
    });
    Promise.all([health].concat(feeds)).then(function () {
      var all = [];
      FEEDS.forEach(function (f) {
        var r = state.feeds[f.sport], mine = [];
        if (r && r.ok) { try { f.add(mine, r.body); } catch (e) {} }
        mine.forEach(function (g) { g.isToday = g.state === 'Live' || dayDiff(g.start) === 0; });
        state.status[f.sport] = NET.sportStatus(r, mine, new Date(), shortDay);
        all = all.concat(mine);
      });
      state.games = all;
      render();
      var up = document.getElementById('ops-updated');
      if (up) up.textContent = 'Synced ' + new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit' });
    }).then(function () { busy = false; if (sync) sync.classList.remove('busy'); });
  }

  /* analytics: which sport's live demo drives interest (no PII) */
  document.addEventListener('click', function (e) {
    var a = e.target.closest('[data-cast]');
    if (!a || typeof window.gtag !== 'function') return;
    window.gtag('event', 'propsports_cast_open', { sport: a.getAttribute('data-cast'), event_id: a.getAttribute('data-event'), event_state: a.getAttribute('data-state'), source_surface: a.getAttribute('data-surface') });
  });

  document.querySelectorAll('.ops-tab').forEach(function (t) {
    t.addEventListener('click', function () {
      state.sport = t.getAttribute('data-sport');
      document.querySelectorAll('.ops-tab').forEach(function (x) { x.setAttribute('aria-selected', String(x === t)); });
      var tb = document.getElementById('ops-body'); if (tb) tb._rows = null;
      render();
    });
  });
  var refresh = document.getElementById('ops-refresh');
  if (refresh) refresh.addEventListener('click', load);

  load();
  setInterval(load, REFRESH);
  setInterval(tickAges, 1000);
})();
