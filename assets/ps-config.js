/* PropSports site configuration — the single source of truth.
   Counts on every page are derived from ROUTES below; do not hardcode them in HTML.
   Route registry audited against propsports-api-worker (index.js, propsports-entry.js,
   nhl-intelligence/src, sports-expansion/gateway.js) on 2026-09-30.
   Loaded by browsers (window.PS_CONFIG) and by scripts/build.mjs (vm). */
(function (root) {
  var API_BASE = 'https://propsports-api.sales-fd3.workers.dev';
  var UFC_BASE = 'https://ufc-api.propbetedge.ai';

  // [path, description, access] — access: 'pub' (no key), 'demo' (demo or any key), 'key' (sport entitlement)
  var ROUTES = {
    mlb: [
      ['Schedule & live', [
        ['/mlb/schedule', 'Schedule by date with probable pitchers, venue and linescore', 'pub'],
        ['/mlb/schedule/today', "Today's slate", 'pub'],
        ['/mlb/games/live', 'Games currently in progress', 'pub'],
        ['/mlb/lineups', 'Posted lineups and probable pitchers', 'pub']]],
      ['Game detail', [
        ['/mlb/game/:pk/linescore', 'Inning-by-inning linescore', 'pub'],
        ['/mlb/game/:pk/boxscore', 'Full box score', 'pub'],
        ['/mlb/game/:pk/plays', 'Most recent plays (?limit)', 'pub']]],
      ['Players', [
        ['/mlb/player/:id/stats', 'Season stats', 'demo'],
        ['/mlb/player/:id/gamelog', 'Game log', 'demo']]],
      ['Statcast', [
        ['/mlb/statcast/batters', 'Exit velocity, barrel %, xBA / xSLG / xwOBA, last-7 and handedness splits', 'pub'],
        ['/mlb/statcast/pitchers', 'Pitcher Statcast table with pagination', 'pub']]],
      ['Game environment', [
        ['/mlb/weather', 'Wind, temperature and park factor for one park', 'pub'],
        ['/mlb/weather/all', 'Weather for every game on the slate', 'pub'],
        ['/mlb/umpires', 'Umpire crews by game', 'pub']]],
      ['Market data', [
        ['/mlb/odds', 'Game lines: spread, total, moneyline', 'pub'],
        ['/mlb/odds/hr', 'Home-run props, best book across DraftKings and FanDuel', 'pub'],
        ['/mlb/odds/totalbases', 'Total-bases props', 'pub'],
        ['/mlb/odds/hits', 'Hits props', 'pub'],
        ['/mlb/odds/strikeouts', 'Pitcher strikeout props', 'pub'],
        ['/mlb/odds/rbi', 'RBI props', 'pub'],
        ['/mlb/odds/all', 'All prop markets combined', 'pub'],
        ['/mlb/odds/player', 'One player across prop markets (?name)', 'pub']]],
      ['Model output', [
        ['/mlb/odds/model', 'PropBetEdge Poisson model prices (?market, ?player, ?direction)', 'pub'],
        ['/mlb/odds/model/top', 'Top model OVER plays', 'pub'],
        ['/mlb/odds/model/player', 'One player across model markets (?name)', 'pub']]]
    ],
    nfl: [
      ['Schedule & live', [
        ['/nfl/schedule', 'Normalized scoreboard for the current slate (?date, ?week)', 'pub'],
        ['/nfl/scoreboard', 'Scoreboard by date or week', 'key'],
        ['/nfl/games/live', 'Games in progress', 'pub'],
        ['/nfl/odds', 'Game odds', 'pub']]],
      ['Teams & standings', [
        ['/nfl/standings', 'Current standings', 'key'],
        ['/nfl/teams', 'Team directory', 'key'],
        ['/nfl/team/:id', 'Team profile', 'key'],
        ['/nfl/team/:id/roster', 'Current roster', 'key'],
        ['/nfl/team/:id/schedule', 'Team schedule', 'key']]],
      ['Game detail', [
        ['/nfl/game/:id', 'Normalized game detail', 'key'],
        ['/nfl/game/:id/boxscore', 'Player box score', 'key'],
        ['/nfl/game/:id/plays', 'Play-by-play', 'key'],
        ['/nfl/game/:id/drives', 'Drive history and current drive', 'key'],
        ['/nfl/game/:id/leaders', 'Game leaders', 'key'],
        ['/nfl/game/:id/winprob', 'Win-probability series (ESPN source, last 200 points)', 'key']]]
    ],
    nba: [
      ['Schedule & live', [
        ['/nba/schedule', 'Scoreboard by date (playoffs, then regular season)', 'pub'],
        ['/nba/schedule/today', "Today's slate", 'pub'],
        ['/nba/games/live', 'Games in progress', 'pub']]],
      ['Game detail', [
        ['/nba/game/:id/summary', 'Game summary with header', 'pub'],
        ['/nba/game/:id/boxscore', 'Normalized box score with computed TS% and USG%', 'pub'],
        ['/nba/game/:id/plays', 'Play-by-play with court coordinates and event category', 'pub'],
        ['/nba/game/:id/shotchart', 'Made and missed shots with x/y coordinates', 'pub'],
        ['/nba/game/:id/lineup', 'On-court five reconstructed from starters and substitutions (estimated)', 'pub'],
        ['/nba/game/:id/winprob', 'Win-probability series (ESPN source)', 'pub'],
        ['/nba/game/:id/hustle', 'Hustle box when the source allows it (may return available:false)', 'pub']]],
      ['Players & markets', [
        ['/nba/leaders', 'League leaders (?stat, ?season)', 'key'],
        ['/nba/player/:id/stats', 'Year-over-year player stats', 'key'],
        ['/nba/odds', 'Game lines', 'key']]]
    ],
    nhl: [
      ['Schedule & live', [
        ['/nhl/board', 'Slate with season phase, calendar and next puck drop', 'pub'],
        ['/nhl/schedule', 'Normalized schedule', 'pub'],
        ['/nhl/schedule/today', "Today's slate", 'pub'],
        ['/nhl/scoreboard', 'Scoreboard', 'pub'],
        ['/nhl/games/live', 'Games in progress', 'pub']]],
      ['Standings & leaders', [
        ['/nhl/standings', 'Standings (flags prior-season final before opening night)', 'pub'],
        ['/nhl/leaders', 'Skater leaders (?category, ?season, ?limit)', 'pub'],
        ['/nhl/goalies/leaders', 'Goalie leaders', 'pub']]],
      ['Game detail', [
        ['/nhl/game/:id', 'Game landing and header', 'key'],
        ['/nhl/game/:id/boxscore', 'Box score', 'key'],
        ['/nhl/game/:id/plays', 'Normalized play-by-play', 'key'],
        ['/nhl/game/:id/cast', 'Live cast: manpower, goalies in net, totals', 'key'],
        ['/nhl/game/:id/shots', 'Shot geometry — raw features, not xG probabilities', 'key'],
        ['/nhl/game/:id/goalies', 'Confirmed or projected starters, rest and recent form', 'key'],
        ['/nhl/game/:id/deployment', 'Lines and pairs derived from shift charts (final games)', 'key']]],
      ['Players & teams', [
        ['/nhl/player/:id', 'Player profile', 'key'],
        ['/nhl/player/:id/stats', 'Player stats', 'key'],
        ['/nhl/player/:id/game-log', 'Game log', 'key'],
        ['/nhl/goalie/:id/edge', 'NHL Edge goalie detail', 'key'],
        ['/nhl/team/:abbr/roster', 'Roster', 'key'],
        ['/nhl/team/:abbr/stats', 'Team stats', 'key'],
        ['/nhl/team/:abbr/schedule', 'Team schedule', 'key'],
        ['/nhl/team/:abbr/deployment', "Deployment from the team's last completed game", 'key'],
        ['/nhl/odds', 'Game lines', 'key']]]
    ],
    wnba: [
      ['Schedule & live', [
        ['/wnba/today', "Today's slate (or the next slate)", 'pub'],
        ['/wnba/schedule', 'Schedule', 'pub'],
        ['/wnba/season', 'Season context', 'key'],
        ['/wnba/games/:id', 'Game detail', 'key'],
        ['/wnba/games/:id/live', 'Live game state', 'key'],
        ['/wnba/games/:id/events', 'Play-by-play events', 'key'],
        ['/wnba/games/:id/boxscore', 'Box score', 'key'],
        ['/wnba/games/:id/shots', 'Shot events', 'key'],
        ['/wnba/matchups/:id', 'Matchup detail', 'key']]],
      ['Teams & standings', [
        ['/wnba/standings', 'Standings', 'key'],
        ['/wnba/playoffs', 'Playoff picture', 'key'],
        ['/wnba/teams', 'Teams', 'key'],
        ['/wnba/teams/:id', 'Team profile', 'key'],
        ['/wnba/teams/:id/roster', 'Roster', 'key']]],
      ['Players', [
        ['/wnba/players', 'Players', 'key'],
        ['/wnba/players/:id', 'Player profile', 'key'],
        ['/wnba/players/:id/gamelog', 'Game log', 'key'],
        ['/wnba/injuries', 'Injury report', 'key'],
        ['/wnba/transactions', 'Transactions', 'key']]],
      ['Stats & intelligence', [
        ['/wnba/stats/players', 'Player statistics', 'key'],
        ['/wnba/stats/teams', 'Team statistics', 'key'],
        ['/wnba/stats/winba', 'WinBA winning-impact index (association with winning, not causal)', 'key'],
        ['/wnba/dna/meta', 'Player DNA method, version and field availability', 'key'],
        ['/wnba/dna/index', 'Player DNA index', 'key'],
        ['/wnba/dna/players/:id', 'Player DNA profile', 'key']]]
    ],
    tennis: [
      ['Matches & live', [
        ['/tennis/today', "Today's order of play across tournaments", 'pub'],
        ['/tennis/live', 'Live matches with point score, server and set detail', 'pub'],
        ['/tennis/matches/:id', 'Match detail', 'key']]],
      ['Tournaments', [
        ['/tennis/tournaments', 'Tournaments', 'key'],
        ['/tennis/tournaments/:slug/:year', 'Tournament edition', 'key']]],
      ['Players & rankings', [
        ['/tennis/players', 'Players', 'key'],
        ['/tennis/players/:slug', 'Player profile', 'key'],
        ['/tennis/players/:slug/dna', 'Tennis DNA snapshot (access-gated upstream)', 'key'],
        ['/tennis/rankings', 'WTA rankings by default; ATP with ?tour=atp', 'key'],
        ['/tennis/h2h/:a/:b', 'Head-to-head record', 'key']]]
    ],
    soccer: [
      ['Matches & live', [
        ['/soccer/matches', 'Fixtures and results (?date, ?competition, ?limit)', 'pub'],
        ['/soccer/live', 'Live and recently finished matches', 'pub'],
        ['/soccer/matches/:id', 'Match detail', 'key'],
        ['/soccer/matches/:id/cast', 'Match cast', 'key']]],
      ['Competitions', [
        ['/soccer/competitions', 'Competitions and seasons', 'key'],
        ['/soccer/competitions/:slug', 'Competition detail', 'key'],
        ['/soccer/table', 'League table', 'key'],
        ['/soccer/coverage', 'Coverage counts: matches, events, lineups', 'key']]],
      ['Players, teams & DNA', [
        ['/soccer/players', 'Players', 'key'],
        ['/soccer/players/:slug', 'Player profile', 'key'],
        ['/soccer/players/:slug/dna', 'Player DNA', 'key'],
        ['/soccer/teams/:slug', 'Team profile', 'key'],
        ['/soccer/teams/:slug/dna', 'Team DNA', 'key']]]
    ]
  };

  // UFC runs on its own host and is not counted in the PropSports API route total.
  var UFC_ROUTES = [
    ['Events & cards', [
      ['/v1/ufc/events', 'Events (?status=upcoming)', 'pub'],
      ['/v1/ufc/events/:id/card', 'Fight card', 'pub'],
      ['/v1/ufc/events/:id/weigh-ins', 'Event weigh-ins', 'pub'],
      ['/v1/ufc/weigh-ins', 'Weigh-in results', 'pub'],
      ['/v1/ufc/results', 'Results', 'pub'],
      ['/v1/ufc/rankings', 'Official rankings snapshot', 'pub']]],
    ['Fighters & bouts', [
      ['/v1/ufc/fighters', 'Fighters', 'pub'],
      ['/v1/ufc/fighters/:id', 'Fighter profile', 'pub'],
      ['/v1/ufc/fighters/:id/history', 'Fight history and career stats', 'pub'],
      ['/v1/ufc/bouts/:id/stats', 'Round-by-round bout statistics', 'pub']]],
    ['Fight DNA & intelligence', [
      ['/v1/ufc/dna/metrics', 'Fight DNA metric definitions', 'pub'],
      ['/v1/ufc/fighters/:id/dna', 'Fighter DNA (not a pick, price or probability)', 'key'],
      ['/v1/ufc/events/:id/intelligence', 'Card intelligence', 'key'],
      ['/v1/ufc/bouts/:id/ledger', 'Fight state ledger checkpoints', 'key']]]
  ];

  var SPORTS = [
    { id: 'mlb', status: 'PropSports API', line: 'Pitch-level Statcast, live games and the MLB Poisson model.', media: '/assets/media/sport-mlb.webp', alt: 'A baseball kicking up infield dirt under stadium lights', name: 'MLB', long: 'Major League Baseball', color: '#E2574C', api: true,
      deep: '/mlb', platform: null, examples: ['mlb', 'mlb-statcast'],
      headline: 'Schedules, live games, Statcast and model output.',
      summary: 'MLB is the deepest dataset on the network: live game state, owned Statcast tables for batters and pitchers, game environment (weather, park factor, umpires), market data and the PropBetEdge Poisson model.',
      sources: 'MLB StatsAPI, Supabase Statcast tables, Open-Meteo, DraftKings and FanDuel props',
      cache: 'Statcast 15 min · odds 2–5 min',
      matrix: { live: ['Schedule & slate', 'Live games', 'Lineups & probables'], pbp: ['Plays', 'Box score', 'Linescore'], players: ['Season stats', 'Game logs'], teams: [], adv: ['Statcast batters & pitchers', 'Weather & park factor', 'Umpire crews'], models: ['Poisson model prices'] } },
    { id: 'nfl', status: 'PropSports API', line: 'Normalized scoreboards, drives, play-by-play and standings.', media: '/assets/media/sport-nfl.webp', alt: 'A football spinning through spray under green stadium lights', name: 'NFL', long: 'National Football League', color: '#5FAE63', api: true,
      deep: '/nfl', platform: null, examples: ['nfl'],
      headline: 'Normalized scoreboards, drives and play-by-play.',
      summary: 'A normalized NFL layer: scoreboards by date or week, standings, team directory and rosters, and per-game detail down to plays, drives, leaders and the win-probability series.',
      sources: 'ESPN site and core APIs, normalized by the PropSports NFL adapter',
      cache: 'Live 2–3 s',
      matrix: { live: ['Scoreboard by date or week', 'Live games', 'Game odds'], pbp: ['Play-by-play', 'Drives', 'Box score', 'Game leaders'], players: ['Rosters', 'Player box stats'], teams: ['Standings', 'Teams & schedules'], adv: ['Win-probability series'], models: [] } },
    { id: 'nba', status: 'PropSports API', line: 'Play-by-play with coordinates, shot charts and TS% / USG%.', media: '/assets/media/sport-nba.webp', alt: 'An empty basketball court under arena lights', name: 'NBA', long: 'National Basketball Association', color: '#E8843C', api: true,
      deep: '/nba', platform: null, examples: ['nba'],
      headline: 'Shot coordinates, lineups and advanced box scores.',
      summary: 'Game-level NBA detail: play-by-play with court coordinates, shot charts, reconstructed on-court lineups and box scores with computed TS% and USG%.',
      sources: 'ESPN game summaries and stats.nba.com',
      cache: 'Live 10 s',
      matrix: { live: ['Schedule & slate', 'Live games'], pbp: ['Plays with coordinates', 'Shot chart', 'Box score'], players: ['Player stats', 'League leaders'], teams: [], adv: ['TS% & USG%', 'Estimated lineups', 'Win-probability series'], models: [] } },
    { id: 'wnba', status: 'API + live platform', line: 'Live game state, WinBA and Player DNA from the WNBA platform.', media: '/assets/media/sport-wnba.webp', alt: 'A lit basketball arena floor seen from the baseline', name: 'WNBA', long: "Women's National Basketball Association", color: '#E0708F', api: true,
      deep: null, platform: 'https://wnba.propbetedge.ai', examples: ['wnba'],
      headline: 'Games, players, WinBA and Player DNA.',
      summary: 'Served through the PropSports gateway from the dedicated WNBA platform: live game state and events, box scores and shots, teams, rosters, standings, player game logs, WinBA and Player DNA.',
      sources: 'Dedicated WNBA platform (wnba-api.propbetedge.ai); live ingest every minute',
      cache: 'Upstream cache headers',
      matrix: { live: ['Today & schedule', 'Live game state'], pbp: ['Game events', 'Shots', 'Box score'], players: ['Profiles & game logs', 'Injuries & transactions'], teams: ['Standings & playoffs', 'Rosters'], adv: ['Player & team stats'], models: ['WinBA index', 'Player DNA'] } },
    { id: 'nhl', status: 'PropSports API', line: 'Live cast, shot geometry, goalie starters and line deployment.', media: '/assets/media/sport-nhl.webp', alt: 'Hockey players and a goalie at the crease under rink lights', name: 'NHL', long: 'National Hockey League', color: '#5AA9E6', api: true,
      deep: '/nhl', platform: null, examples: ['nhl', 'nhl-board'],
      headline: 'Live cast, shot geometry and line deployment.',
      summary: 'NHL slate, standings and leaders are public; keyed routes add play-by-play, live cast, shot geometry, goalie starters and line deployment derived from shift charts. Shot data is raw geometry — no xG or GSAx is claimed.',
      sources: 'api-web.nhle.com and api.nhle.com; daily archive to Supabase',
      cache: 'Live 5–8 s · standings 15 min',
      matrix: { live: ['Board, schedule & scoreboard', 'Live games'], pbp: ['Play-by-play', 'Live cast', 'Box score'], players: ['Profiles, stats & game logs', 'Leaders', 'Goalie Edge detail'], teams: ['Standings', 'Rosters, stats & schedules'], adv: ['Shot geometry (raw)', 'Goalie starters', 'Line deployment'], models: [] } },
    { id: 'tennis', status: 'API + live platform', line: 'Point-level live scores, rankings and head-to-head records.', media: '/assets/media/sport-tennis.webp', alt: 'A tennis ball hitting a clay court in a burst of dust', name: 'Tennis', long: 'ATP and WTA tennis', color: '#C9D84E', api: true,
      deep: null, platform: 'https://tennis.propbetedge.ai', examples: ['tennis'],
      headline: 'Live point score, tournaments, rankings and H2H.',
      summary: 'Served through the PropSports gateway from the dedicated tennis platform: live matches with point score and server, order of play, tournaments, player profiles, rankings and head-to-head records.',
      sources: 'Dedicated tennis platform (tennis-api.propbetedge.ai); live polling every minute',
      cache: 'Upstream cache headers',
      matrix: { live: ["Today's order of play", 'Live point score & server'], pbp: ['Match detail'], players: ['Profiles', 'Head-to-head'], teams: ['WTA & ATP rankings', 'Tournaments'], adv: [], models: [], gated: ['Tennis DNA (access-gated)'] } },
    { id: 'soccer', status: 'API + live platform', line: 'Fixtures, live matches, league tables and player DNA.', media: '/assets/media/sport-soccer.webp', alt: 'A soccer ball splashing across wet grass under floodlights', name: 'Soccer', long: 'Club and international soccer', color: '#3FC093', api: true,
      deep: null, platform: 'https://soccer.propbetedge.ai', examples: ['soccer'],
      headline: 'Fixtures, live matches, tables and DNA.',
      summary: 'Served through the PropSports gateway from the dedicated soccer platform: fixtures and live matches, match cast, competitions, league tables, players and teams, plus player and team DNA.',
      sources: 'Dedicated soccer platform (soccer.propbetedge.ai); live snapshot every minute',
      cache: 'Upstream cache headers',
      matrix: { live: ['Fixtures & results', 'Live matches'], pbp: ['Match cast', 'Match detail'], players: ['Players & profiles'], teams: ['League tables', 'Competitions', 'Team profiles'], adv: ['Coverage counts'], models: ['Player DNA', 'Team DNA'] } },
    { id: 'ufc', status: 'Fight Intelligence', line: 'Fight DNA, round statistics, weigh-ins and card intelligence.', media: '/assets/media/sport-ufc.webp', alt: 'A crowded arena around a lit fighting cage', name: 'UFC', long: 'UFC and combat sports', color: '#D8483F', api: false,
      deep: null, platform: 'https://ufc.proptechusa.ai', examples: ['ufc'],
      headline: 'Fight DNA, round statistics and card intelligence.',
      summary: 'UFC runs on the dedicated combat-sports intelligence platform, not through the PropSports API key: events and cards, weigh-ins, fighter history, round-by-round bout statistics, rankings, Fight DNA and card intelligence.',
      sources: 'Dedicated UFC platform (ufc-api.propbetedge.ai); weigh-in ingest every minute',
      cache: 'Platform-managed',
      matrix: { live: ['Events & cards', 'Weigh-ins', 'Results'], pbp: ['Round statistics'], players: ['Fighter profiles', 'Fight history'], teams: ['Official rankings'], adv: ['Fight state ledger'], models: ['Fight DNA', 'Card intelligence'] } }
  ];

  // PropSports 2026 V2 forward-facing plans (billing catalog 2026-09-30-pricing-v2).
  // Legacy prices stay grandfathered in the billing Worker and are never offered here.
  var PLANS = [
    { id: 'SINGLE', name: 'Single Sport', price: 29, per: 'mo', limit: 50000, sports: 'One selected sport', checkout: 'single',
      lede: 'One core sport, full commercial API surface.', feats: ['Full API surface for your selected sport'] },
    { id: 'DEVELOPER', name: 'Developer', price: 79, per: 'mo', limit: 100000, sports: 'Up to 3 selected sports', checkout: 'developer',
      lede: 'Pick up to three sports for multi-sport apps.', feats: ['Built for multi-sport apps'] },
    { id: 'ALL_SPORTS', name: 'All Sports', price: 149, per: 'mo', limit: 200000, sports: 'All 7 core sports', checkout: 'ALL_SPORTS', featured: true, badge: 'Best value',
      lede: 'Every core sport on one API key.', feats: ['One API key, one bill'] },
    { id: 'PRO', name: 'Pro', price: 299, per: 'mo', limit: 500000, sports: 'All 7 core sports', checkout: 'PRO', tag: 'Production',
      lede: 'Serious production workloads.', feats: ['Priority support', 'Built for production workloads'] },
    { id: 'SCALE', name: 'Scale', price: 599, per: 'mo', limit: 2000000, sports: 'All 7 core sports', checkout: 'SCALE', tag: 'High volume',
      lede: 'High-volume infrastructure.', feats: ['Built for high-volume production', 'Higher-concurrency positioning'] },
    { id: 'ENTERPRISE', name: 'Enterprise', price: 1500, per: 'mo', limit: 5000000, sports: 'All 7 core sports', checkout: 'ENTERPRISE',
      lede: 'Production terms and priority integration.', feats: ['Priority integration support', 'Production terms', 'Custom licensing where source rights permit'] }
  ];

  // Forward-facing Stripe price IDs only (production, 2026 V2).
  var PRICE_IDS = {
    MLB: 'price_1ULUM6F3CaVzg4ORYIP0C8QL',
    NFL: 'price_1ULUM8F3CaVzg4ORWk5GyS2x',
    NBA: 'price_1ULUMAF3CaVzg4ORAZ6dhDq2',
    WNBA: 'price_1ULUMDF3CaVzg4ORWEU2jpul',
    NHL: 'price_1ULUMFF3CaVzg4ORTnhbbiST',
    TENNIS: 'price_1ULUMHF3CaVzg4ORnDZu5Wtg',
    SOCCER: 'price_1ULUMJF3CaVzg4ORkXDAXrxA',

    DEVELOPER: 'price_1ULUMYF3CaVzg4ORpHsYNH6v',
    ALL_SPORTS: 'price_1ULUMaF3CaVzg4ORW37dQT5M',
    PRO: 'price_1ULUMcF3CaVzg4ORNDzMI20y',
    SCALE: 'price_1ULUMeF3CaVzg4ORfxBoHHbF',
    ENTERPRISE: 'price_1ULUMgF3CaVzg4OR3CrWZ1FV'
  };
  var DEVELOPER_MAX_SPORTS = 3;

  function count(list) { return list.reduce(function (n, g) { return n + g[1].length; }, 0); }
  function countPub(list) { return list.reduce(function (n, g) { return n + g[1].filter(function (r) { return r[2] === 'pub'; }).length; }, 0); }
  var perSport = {}, pubPerSport = {}, total = 0, pub = 0;
  Object.keys(ROUTES).forEach(function (s) { perSport[s] = count(ROUTES[s]); pubPerSport[s] = countPub(ROUTES[s]); total += perSport[s]; pub += pubPerSport[s]; });

  root.PS_CONFIG = {
    API_BASE: API_BASE, UFC_BASE: UFC_BASE,
    DEMO_KEY: 'psa_demo_propsports2026', DEMO_LIMIT: '20 requests/hour, shared',
    CHECKOUT_URL: 'https://propsports-stripe.sales-fd3.workers.dev/create-checkout',
    SITE: 'https://propsports.proptechusa.ai',
    REFRESH_SECONDS: 15,
    // Endpoint count shown on the site = the live API catalog (GET /health "endpoints").
    // Build fetches it; pages re-read it at runtime. This is only the offline fallback.
    CATALOG_ENDPOINTS_FALLBACK: 106,
    SPORTS: SPORTS, ROUTES: ROUTES, UFC_ROUTES: UFC_ROUTES, PLANS: PLANS, PRICE_IDS: PRICE_IDS, DEVELOPER_MAX_SPORTS: DEVELOPER_MAX_SPORTS,
    COUNTS: {
      SPORT_PLATFORMS: SPORTS.length,
      CORE_API_SPORTS: SPORTS.filter(function (s) { return s.api; }).length,
      DOCUMENTED_ROUTES: total, PUBLIC_ENDPOINTS: pub, PER_SPORT: perSport, PUBLIC_PER_SPORT: pubPerSport,
      UFC_ENDPOINTS_LISTED: count(UFC_ROUTES)
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
