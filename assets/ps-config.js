/* PropSports site configuration — the single source of truth for copy and route descriptions.
   Route paths and access levels mirror the production catalog (GET /sports, counted by GET /health).
   scripts/build.mjs refuses to build when this registry and production disagree.
   Loaded by browsers (window.PS_CONFIG) and by scripts/build.mjs (vm). */
(function (root) {
  var API_BASE = 'https://propsports.proptechusa.ai/v1';
  var UFC_BASE = 'https://ufc-api.propbetedge.ai';

  // Internal route classification for build/runtime behavior only. The public site
  // deliberately does not publish access-tier maps or shared/demo credentials.
  var ACCESS = {
    open: { label: 'Public', short: 'public routes', css: 'acc-open' },
    key: { label: 'API key', short: 'API-key routes', css: 'acc-key' }
  };

  // [path, description, access] — access is retained internally for plan behavior;
  // the customer-facing catalog publishes routes and sport depth, not auth internals.
  var ROUTES = {
    mlb: [
      ['Schedule & live', [
        ['/mlb/schedule', 'Schedule by date with probable pitchers, venue and linescore', 'open'],
        ['/mlb/schedule/today', "Today's slate", 'open'],
        ['/mlb/games/live', 'Games currently in progress', 'open'],
        ['/mlb/lineups', 'Posted lineups and probable pitchers', 'open']]],
      ['Game detail', [
        ['/mlb/game/:pk/linescore', 'Inning-by-inning linescore', 'open'],
        ['/mlb/game/:pk/boxscore', 'Full box score', 'open'],
        ['/mlb/game/:pk/plays', 'Most recent plays (?limit)', 'open']]],
      ['Players', [
        ['/mlb/player/:id/stats', 'Season stats', 'open'],
        ['/mlb/player/:id/gamelog', 'Game log', 'open']]],
      ['Teams & standings', [
        ['/mlb/standings', 'League and division standings with records (?season)', 'open'],
        ['/mlb/teams', 'All 30 clubs with league, division and venue', 'open'],
        ['/mlb/team/:id', 'Team profile', 'open'],
        ['/mlb/team/:id/roster', 'Active roster', 'open'],
        ['/mlb/team/:id/schedule', 'Team schedule and results', 'open']]],
      ['Statcast', [
        ['/mlb/statcast/batters', 'Exit velocity, barrel %, xBA / xSLG / xwOBA, last-7 and handedness splits', 'open'],
        ['/mlb/statcast/pitchers', 'Pitcher Statcast table with pagination', 'open']]],
      ['Game environment', [
        ['/mlb/weather', 'Wind, temperature and park factor for one park', 'open'],
        ['/mlb/weather/all', 'Weather for every game on the slate', 'open'],
        ['/mlb/umpires', 'Umpire crews by game', 'open']]],
      ['Market data', [
        ['/mlb/odds', 'Game lines: spread, total, moneyline', 'open'],
        ['/mlb/odds/hr', 'Home-run props, best book across DraftKings and FanDuel', 'open'],
        ['/mlb/odds/totalbases', 'Total-bases props', 'open'],
        ['/mlb/odds/hits', 'Hits props', 'open'],
        ['/mlb/odds/strikeouts', 'Pitcher strikeout props', 'open'],
        ['/mlb/odds/rbi', 'RBI props', 'open'],
        ['/mlb/odds/all', 'All prop markets combined', 'open'],
        ['/mlb/odds/player', 'One player across prop markets (?name)', 'open']]],
      ['Model output', [
        ['/mlb/odds/model', 'PropBetEdge Poisson model prices (?market, ?player, ?direction)', 'open'],
        ['/mlb/odds/model/top', 'Top model OVER plays', 'open'],
        ['/mlb/odds/model/player', 'One player across model markets (?name)', 'open']]],
      ['Minor leagues (MiLB)', [
        ['/mlb/minors/meta', 'Minor-league API metadata and schema version', 'open'],
        ['/mlb/minors/levels', 'Levels: Triple-A, Double-A, High-A, Single-A, Rookie', 'open'],
        ['/mlb/minors/organizations', 'MLB organizations and their affiliates (?season)', 'open'],
        ['/mlb/minors/teams', 'Affiliated teams (?season, ?level, ?org, ?league)', 'open'],
        ['/mlb/minors/teams/:id', 'Team detail', 'open'],
        ['/mlb/minors/standings', 'Standings by level and league (?season, ?level, ?type)', 'open'],
        ['/mlb/minors/scores', 'Scores by date (?date, ?level, ?org)', 'open'],
        ['/mlb/minors/games/:pk', 'Game detail', 'open'],
        ['/mlb/minors/leaders', 'Qualified leaders (?level, ?group, ?stat, ?limit)', 'open'],
        ['/mlb/minors/players/:id', 'Player career across minor-league and MLB levels', 'open'],
        ['/mlb/minors/players/:id/form', 'Recent player form (?as_of)', 'open'],
        ['/mlb/minors/postseason', 'Postseason series (?season, ?level)', 'open'],
        ['/mlb/minors/postseason/champions', 'League champions across stored seasons', 'open'],
        ['/mlb/minors/search', 'Team, league and player lookup (?q)', 'open'],
        ['/mlb/minors/coverage', 'Coverage and freshness by season', 'open']]]
    ],
    nfl: [
      ['Schedule & live', [
        ['/nfl/schedule', 'Normalized scoreboard for the current slate (?date, ?week)', 'open'],
        ['/nfl/scoreboard', 'Scoreboard by date or week', 'key'],
        ['/nfl/games/live', 'Games in progress', 'open'],
        ['/nfl/odds', 'Game odds', 'open']]],
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
        ['/nfl/game/:id/winprob', 'Win-probability series', 'key']]],
      ['Current season intelligence', [
        ['/nfl/season', 'Current season, phase, week and slate state', 'key'],
        ['/nfl/current-games', 'Current game-state window', 'key'],
        ['/nfl/current-stats', 'Accumulated current-season leaders', 'key'],
        ['/nfl/current-player', 'One player current-season production', 'key'],
        ['/nfl/scores', 'Current-season score ledger', 'key'],
        ['/nfl/stats', 'Category leader view', 'key']]],
      ['Availability & context', [
        ['/nfl/injuries', 'Persisted injury availability feed', 'key'],
        ['/nfl/changes', 'Material NFL changes feed', 'key'],
        ['/nfl/best-line', 'Current best-line shopping view', 'key'],
        ['/nfl/game-weather', 'Kickoff weather context', 'key']]],
      ['Markets & intelligence', [
        ['/nfl/capabilities', 'NFL intelligence capability contract', 'key'],
        ['/nfl/markets/catalog', 'Supported player-prop markets', 'key'],
        ['/nfl/events', 'Sportsbook event discovery', 'key'],
        ['/nfl/event-markets', 'Available markets for an event', 'key'],
        ['/nfl/props/board', 'Current player-prop book quotes', 'key'],
        ['/nfl/line-movement', 'Observed player-prop movement', 'key'],
        ['/nfl/game-intelligence', 'Weather and market-implied game context', 'key']]],
      ['Player DNA', [
        ['/nfl/dna/qb', 'Quarterback Player DNA', 'key'],
        ['/nfl/dna/wr', 'Wide receiver Player DNA', 'key'],
        ['/nfl/dna/rb', 'Running back Player DNA', 'key'],
        ['/nfl/dna/te', 'Tight end Player DNA', 'key']]]
    ],
    nba: [
      ['Schedule & live', [
        ['/nba/schedule', 'Scoreboard by date (playoffs, then regular season)', 'open'],
        ['/nba/schedule/today', "Today's slate", 'open'],
        ['/nba/games/live', 'Games in progress', 'open']]],
      ['Game detail', [
        ['/nba/game/:id/summary', 'Game summary with header', 'open'],
        ['/nba/game/:id/boxscore', 'Normalized box score with computed TS% and USG%', 'open'],
        ['/nba/game/:id/plays', 'Play-by-play with court coordinates and event category', 'open'],
        ['/nba/game/:id/shotchart', 'Made and missed shots with x/y coordinates', 'open'],
        ['/nba/game/:id/lineup', 'On-court five reconstructed from starters and substitutions (estimated)', 'open'],
        ['/nba/game/:id/winprob', 'Win-probability series (ESPN source)', 'open'],
        ['/nba/game/:id/hustle', 'Hustle box when the source allows it (may return available:false)', 'open']]],
      ['Teams & standings', [
        ['/nba/standings', 'Conference standings', 'key'],
        ['/nba/teams', 'All 30 teams', 'key'],
        ['/nba/team/:id', 'Team profile', 'key'],
        ['/nba/team/:id/roster', 'Current roster', 'key'],
        ['/nba/team/:id/schedule', 'Team schedule and results', 'key'],
        ['/nba/team/:id/stats', 'Team statistics', 'key']]],
      ['Players & markets', [
        ['/nba/leaders', 'League leaders (?stat, ?season)', 'key'],
        ['/nba/player/:id/stats', 'Year-over-year player stats', 'key'],
        ['/nba/odds', 'Game lines', 'key']]]
    ],
    nhl: [
      ['Schedule & live', [
        ['/nhl/board', 'Slate with season phase, calendar and next puck drop', 'open'],
        ['/nhl/schedule', 'Normalized schedule', 'open'],
        ['/nhl/schedule/today', "Today's slate", 'open'],
        ['/nhl/scoreboard', 'Scoreboard', 'open'],
        ['/nhl/games/live', 'Games in progress', 'open']]],
      ['Standings & leaders', [
        ['/nhl/standings', 'Standings (flags prior-season final before opening night)', 'open'],
        ['/nhl/leaders', 'Skater leaders (?category, ?season, ?limit)', 'open'],
        ['/nhl/goalies/leaders', 'Goalie leaders', 'open']]],
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
        ['/wnba/today', "Today's slate (or the next slate)", 'open'],
        ['/wnba/schedule', 'Schedule', 'open'],
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
      ['Stats & DNA', [
        ['/wnba/stats/players', 'Player statistics', 'key'],
        ['/wnba/stats/teams', 'Team statistics', 'key'],
        ['/wnba/stats/winba', 'WinBA winning-impact index', 'key'],
        ['/wnba/dna/meta', 'Player DNA method, version and field availability', 'key'],
        ['/wnba/dna/index', 'Player DNA index', 'key'],
        ['/wnba/dna/players/:id', 'Player DNA profile', 'key']]],
      ['Markets & PBE intelligence', [
        ['/wnba/sources', 'Source and ingest health', 'key'],
        ['/wnba/odds', 'Current game market snapshot', 'key'],
        ['/wnba/props', 'Current player-prop markets', 'key'],
        ['/wnba/track-record', 'Official public model record', 'key'],
        ['/wnba/pbe/status', 'PBE model and validation status', 'key'],
        ['/wnba/pbe/coverage', 'Current PBE coverage window', 'key'],
        ['/wnba/pbe/free-sample', 'Current public PBE sample', 'key']]]
    ],
    tennis: [
      ['Matches & live', [
        ['/tennis/today', "Today's order of play across tournaments", 'open'],
        ['/tennis/live', 'Live matches with point score, server and set detail', 'open'],
        ['/tennis/matches/:id', 'Match detail', 'key'],
        ['/tennis/schedule', 'Schedule with tour, surface and event filters', 'key'],
        ['/tennis/pbecast/:id', 'Point-level PBEcast match state', 'key'],
        ['/tennis/matches/:id/broadcast', 'Verified broadcast rights when available', 'key']]],
      ['Tournaments & coverage', [
        ['/tennis/tournaments', 'Tournaments', 'key'],
        ['/tennis/tournaments/:slug/:year', 'Tournament edition', 'key'],
        ['/tennis/slams', 'Grand Slam coverage', 'key'],
        ['/tennis/sources', 'Source registry and canary evidence', 'key'],
        ['/tennis/coverage', 'Warehouse coverage summary', 'key']]],
      ['Players & rankings', [
        ['/tennis/players', 'Players', 'key'],
        ['/tennis/players/:slug', 'Player profile', 'key'],
        ['/tennis/players/:slug/dna', 'Tennis DNA snapshot', 'key'],
        ['/tennis/players/:slug/profile', 'Deep player profile', 'key'],
        ['/tennis/rankings', 'WTA and ATP rankings', 'key'],
        ['/tennis/men', 'ATP coverage overview', 'key'],
        ['/tennis/men/players', 'ATP player directory', 'key']]],
      ['Matchup intelligence', [
        ['/tennis/h2h/:a/:b', 'Head-to-head record', 'key'],
        ['/tennis/matchups', 'Upcoming matchup board', 'key'],
        ['/tennis/matchups/:id', 'Matchup DNA detail', 'key'],
        ['/tennis/players-to-watch', 'Players to Watch intelligence', 'key'],
        ['/tennis/dna/leaders', 'Tennis DNA leaderboards', 'key'],
        ['/tennis/search', 'Canonical player and tournament search', 'key'],
        ['/tennis/venues/:slug', 'Venue intelligence', 'key']]]
    ],
    soccer: [
      ['Matches & live', [
        ['/soccer/matches', 'Fixtures and results (?date, ?competition, ?limit)', 'open'],
        ['/soccer/live', 'Live and recently finished matches', 'open'],
        ['/soccer/matches/:id', 'Match detail', 'key'],
        ['/soccer/matches/:id/cast', 'Match cast', 'key'],
        ['/soccer/matches/:id/analyzer-preview', 'Match analyzer preview', 'key']]],
      ['Competitions & teams', [
        ['/soccer/competitions', 'Competitions and seasons', 'key'],
        ['/soccer/competitions/:slug', 'Competition detail', 'key'],
        ['/soccer/table', 'League table', 'key'],
        ['/soccer/coverage', 'Coverage counts: matches, events and lineups', 'key'],
        ['/soccer/data-health', 'Canonical data-health summary', 'key'],
        ['/soccer/teams/:slug', 'Team profile', 'key'],
        ['/soccer/teams/:slug/history', 'Team historical context', 'key'],
        ['/soccer/teams/:slug/dna', 'Team DNA', 'key']]],
      ['Players & DNA', [
        ['/soccer/players', 'Players', 'key'],
        ['/soccer/players/:slug', 'Player profile', 'key'],
        ['/soccer/players/:slug/dna', 'Player DNA', 'key']]],
      ['News & media', [
        ['/soccer/news', 'Soccer newsroom feed', 'key'],
        ['/soccer/news/:slug', 'Article detail', 'key'],
        ['/soccer/videos', 'Video feed', 'key']]],
      ['Model intelligence', [
        ['/soccer/algo/picks', 'Model picks v1', 'key'],
        ['/soccer/algo/record', 'Model record v1', 'key'],
        ['/soccer/algo/research', 'Model research summary v1', 'key'],
        ['/soccer/algo/v2/picks', 'Model picks v2', 'key'],
        ['/soccer/algo/v2/record', 'Model record v2', 'key'],
        ['/soccer/algo/v2/research', 'Model research summary v2', 'key']]]
    ]
  };

  // UFC runs on its own commercial host and is counted in the eight-sport
  // network total, but not in the 206-route PropSports core API catalog.
  // Contract source: LHBUSA/ufc-api config/entitlements.json (39 commercial GET routes).
  var UFC_ROUTES = [
    ['Events & fight week', [
      ['/v1/ufc', 'API index', 'key'],
      ['/v1/ufc/events', 'Events: upcoming, recent, all or by date', 'key'],
      ['/v1/ufc/events/:id', 'Event detail', 'key'],
      ['/v1/ufc/events/:id/card', 'Ordered fight card', 'key'],
      ['/v1/ufc/events/:id/weigh-ins', 'Event weigh-ins with coverage state', 'key'],
      ['/v1/ufc/events/:id/card-changes', 'Withdrawals, replacements and card changes', 'key'],
      ['/v1/ufc/events/:id/intelligence', 'Fight Week intelligence by bout', 'key'],
      ['/v1/ufc/weigh-ins', 'Official weigh-in readings', 'key'],
      ['/v1/ufc/injuries', 'Sourced fighter availability events', 'key'],
      ['/v1/ufc/results', 'Recent results', 'key'],
      ['/v1/ufc/rankings', 'Official rankings snapshot', 'key']]],
    ['Fighters & bouts', [
      ['/v1/ufc/fighters', 'Search and list fighters', 'key'],
      ['/v1/ufc/fighters/media', 'Bulk fighter image metadata', 'key'],
      ['/v1/ufc/fighters/:id', 'Fighter profile composite', 'key'],
      ['/v1/ufc/fighters/:id/history', 'Fighter bout history', 'key'],
      ['/v1/ufc/fighters/:id/status', 'Current availability plus sourced history', 'key'],
      ['/v1/ufc/fighters/:id/stats', 'Career round rows, rates and aggregates', 'key'],
      ['/v1/ufc/bouts/:id', 'Bout detail', 'key'],
      ['/v1/ufc/bouts/:id/stats', 'Round-level bout statistics', 'key'],
      ['/v1/ufc/bouts/:id/ledger', 'Fight State Ledger snapshots and diffs', 'key']]],
    ['Fight DNA', [
      ['/v1/ufc/dna/metrics', 'Fight DNA metric registry', 'key'],
      ['/v1/ufc/dna/query', 'Cross-fighter Fight DNA query', 'key'],
      ['/v1/ufc/fighters/:id/dna', 'Fight DNA snapshot', 'key'],
      ['/v1/ufc/fighters/:id/splits', 'Stance DNA splits', 'key'],
      ['/v1/ufc/fighters/:id/round-profile', 'Round DNA profile', 'key'],
      ['/v1/ufc/fighters/:id/finish-profile', 'Finish DNA profile', 'key'],
      ['/v1/ufc/fighters/:id/position-profile', 'Position profile when licensed data is available', 'key'],
      ['/v1/ufc/matchups/:fighterA/:fighterB/dna', 'Fighter-vs-fighter Matchup DNA', 'key']]],
    ['News & media', [
      ['/v1/ufc/news', 'PropBetEdge newsroom list', 'key'],
      ['/v1/ufc/articles/:slug', 'Article detail', 'key'],
      ['/v1/ufc/events/:id/articles', 'Event articles', 'key'],
      ['/v1/ufc/fighters/:id/articles', 'Fighter articles', 'key'],
      ['/v1/ufc/videos', 'Official video metadata feed', 'key'],
      ['/v1/ufc/events/:id/videos', 'Event video metadata', 'key'],
      ['/v1/ufc/fighters/:id/videos', 'Fighter video metadata', 'key'],
      ['/v1/ufc/bouts/:id/videos', 'Bout video metadata', 'key'],
      ['/v1/ufc/wire', 'Third-party headline wire; enterprise / rights-review gated', 'key']]],
    ['Discovery', [
      ['/v1/ufc/search', 'Search fighters, events and articles', 'key'],
      ['/v1/ufc/counts', 'Coverage counts', 'key']]]
  ];

  var SPORTS = [
    { id: 'mlb', status: 'PropSports API', line: 'Pitch-level Statcast, live games and the MLB Poisson model.', media: '/assets/media/sport-mlb.webp', alt: 'A baseball kicking up infield dirt under stadium lights', name: 'MLB', long: 'Major League Baseball', color: '#E2574C', api: true,
      deep: '/mlb', platform: null, examples: ['mlb', 'mlb-standings', 'mlb-statcast', 'mlb-minors'],
      headline: 'Schedules, live games, Statcast and model output.',
      summary: 'MLB is the deepest dataset on the network: live game state, standings, teams and rosters, owned Statcast tables, game environment (weather, park factor, umpires), market data, the PropBetEdge Poisson model and affiliated minor leagues from Triple-A to Rookie.',
      sources: 'MLB Stats API (games, standings, teams, rosters, minor leagues), Supabase Statcast tables, Open-Meteo, DraftKings and FanDuel props',
      cache: 'Statcast 15 min · odds 2–5 min',
      matrix: { live: ['Schedule & slate', 'Live games', 'Lineups & probables', 'MiLB scores, Triple-A to Rookie'], pbp: ['Plays', 'Box score', 'Linescore', 'MiLB game detail'], players: ['Season stats', 'Game logs', 'MiLB careers & form', 'Hitter & Pitcher DNA'], teams: ['Standings', 'Teams', 'Team profiles', 'Rosters', 'Team schedules'], adv: ['Statcast batters & pitchers', 'Weather & park factor', 'Umpire crews', 'Sportsbook props'], models: ['Hitter DNA', 'Pitcher DNA', 'Poisson model prices', 'Top model plays'] } },
    { id: 'nfl', status: 'PropSports API', line: '36 routes spanning live games, injuries, weather, markets and Player DNA.', media: '/assets/media/sport-nfl.webp', alt: 'A football spinning through spray under green stadium lights', name: 'NFL', long: 'National Football League', color: '#5FAE63', api: true,
      deep: '/nfl', platform: null, examples: ['nfl'],
      headline: '36 NFL routes from live games to market intelligence and Player DNA.',
      summary: 'A 36-route NFL layer covering scoreboards, current-season state, standings, rosters, play-by-play, drives, leaders, injuries, weather, sportsbook markets, line movement, game intelligence and position-specific Player DNA.',
      sources: 'ESPN site and core APIs, normalized by the PropSports NFL adapter',
      cache: 'Live 2–3 s',
      matrix: { live: ['Scoreboard by date or week', 'Live games', 'Season & current-game state', 'Game odds'], pbp: ['Play-by-play', 'Drives', 'Box score', 'Game leaders'], players: ['Rosters', 'Current player stats', 'QB / WR / RB / TE DNA'], teams: ['Standings', 'Teams', 'Team profiles', 'Rosters', 'Team schedules'], adv: ['Injuries & changes', 'Kickoff weather', 'Best line', 'Market catalog & line movement'], models: ['Game intelligence', 'Player DNA'] } },
    { id: 'nba', status: 'PropSports API', line: 'Play-by-play with coordinates, shot charts and TS% / USG%.', media: '/assets/media/sport-nba.webp', alt: 'An empty basketball court under arena lights', name: 'NBA', long: 'National Basketball Association', color: '#E8843C', api: true,
      deep: '/nba', platform: null, examples: ['nba'],
      headline: 'Shot coordinates, advanced box scores, standings and teams.',
      summary: 'Game-level NBA detail — play-by-play with court coordinates, shot charts, reconstructed lineups and box scores with computed TS% and USG% — plus standings, teams, rosters, team schedules and team stats.',
      sources: 'ESPN game summaries, stats.nba.com and the PropBetEdge NBA data layer (standings, teams, rosters, schedules, team stats)',
      cache: 'Live 10 s',
      matrix: { live: ['Schedule & slate', 'Live games', 'Game lines'], pbp: ['Plays with coordinates', 'Shot chart', 'Box score', 'Game summary'], players: ['Player stats', 'League leaders', 'Rosters', 'Player DNA'], teams: ['Standings', 'Teams', 'Team profiles', 'Rosters', 'Team schedules', 'Team stats'], adv: ['TS% & USG%', 'Estimated lineups', 'Win-probability series', 'Hustle box'], models: ['Player DNA', 'WinBA', 'Model intelligence'] } },
    { id: 'wnba', status: 'API + live platform', line: '32 routes across live games, props, WinBA, Player DNA and PBE intelligence.', media: '/assets/media/sport-wnba.webp', alt: 'A lit basketball arena floor seen from the baseline', name: 'WNBA', long: "Women's National Basketball Association", color: '#E0708F', api: true,
      deep: null, platform: 'https://wnba.propbetedge.ai', examples: ['wnba'],
      headline: '32 WNBA routes from live games to market and model intelligence.',
      summary: 'A 32-route WNBA API covering schedules, live game state, events, box scores, shots, teams, standings, player game logs, injuries, transactions, player and team stats, odds, player props, the official PBE track record, WinBA and Player DNA.',
      sources: 'Dedicated WNBA platform (wnba-api.propbetedge.ai); live ingest every minute',
      cache: 'Upstream cache headers',
      matrix: { live: ['Today & schedule', 'Live game state'], pbp: ['Game events', 'Shots', 'Box score'], players: ['Profiles & game logs', 'Injuries & transactions'], teams: ['Standings & playoffs', 'Rosters'], adv: ['Player & team stats', 'Odds & player props', 'Source health', 'Official track record'], models: ['WinBA index', 'Player DNA', 'PBE status & coverage'] } },
    { id: 'nhl', status: 'PropSports API', line: 'Live cast, shot geometry, goalie starters and line deployment.', media: '/assets/media/sport-nhl.webp', alt: 'Hockey players and a goalie at the crease under rink lights', name: 'NHL', long: 'National Hockey League', color: '#5AA9E6', api: true,
      deep: '/nhl', platform: null, examples: ['nhl', 'nhl-board'],
      headline: 'Live cast, shot geometry and line deployment.',
      summary: 'NHL slate, standings and leaders are public; keyed routes add play-by-play, live cast, shot geometry, goalie starters and line deployment derived from shift charts. Shot data is raw geometry — no xG or GSAx is claimed.',
      sources: 'api-web.nhle.com and api.nhle.com; daily archive to Supabase',
      cache: 'Live 5–8 s · standings 15 min',
      matrix: { live: ['Board, schedule & scoreboard', 'Live games'], pbp: ['Play-by-play', 'Live cast', 'Box score'], players: ['Profiles, stats & game logs', 'Leaders', 'Goalie Edge detail', 'Skater DNA'], teams: ['Standings', 'Rosters', 'Team stats', 'Team schedules', 'Team deployment'], adv: ['Shot geometry (raw)', 'Goalie starters', 'Line deployment'], models: ['Skater DNA (rights-gated)', 'PBE Picks', 'Game intelligence'] } },
    { id: 'tennis', status: 'API + live platform', line: '25 routes for live match state, Matchup DNA, rankings, venues and Tennis DNA.', media: '/assets/media/sport-tennis.webp', alt: 'A tennis ball hitting a clay court in a burst of dust', name: 'Tennis', long: 'ATP and WTA tennis', color: '#C9D84E', api: true,
      deep: null, platform: 'https://tennis.propbetedge.ai', examples: ['tennis'],
      headline: 'Live point score, tournaments, rankings and H2H.',
      summary: 'Served through the PropSports gateway from the dedicated tennis platform: live matches with point score and server, order of play, tournaments, player profiles, rankings and head-to-head records.',
      sources: 'Dedicated tennis platform (tennis-api.propbetedge.ai); live polling every minute',
      cache: 'Upstream cache headers',
      matrix: { live: ["Today's order of play", 'Live point score & server'], pbp: ['Match detail', 'Set-by-set score'], players: ['Player directory', 'Profiles', 'Player DNA'], teams: ['WTA & ATP rankings', 'Tournaments & editions'], adv: ['Head-to-head records', 'Point-level live state'], models: ['Tennis DNA', 'Matchup intelligence'] } },
    { id: 'soccer', status: 'API + live platform', line: '25 routes across fixtures, live match cast, team history, newsroom and model intelligence.', media: '/assets/media/sport-soccer.webp', alt: 'A soccer ball splashing across wet grass under floodlights', name: 'Soccer', long: 'Club and international soccer', color: '#3FC093', api: true,
      deep: null, platform: 'https://soccer.propbetedge.ai', examples: ['soccer'],
      headline: 'Fixtures, live matches, tables and DNA.',
      summary: 'Served through the PropSports gateway from the dedicated soccer platform: fixtures and live matches, match cast, competitions, league tables, players and teams, plus player and team DNA.',
      sources: 'Dedicated soccer platform (soccer.propbetedge.ai); live snapshot every minute',
      cache: 'Upstream cache headers',
      matrix: { live: ['Fixtures & results', 'Live matches'], pbp: ['Match cast', 'Match detail', 'Analyzer preview'], players: ['Players & profiles', 'Player DNA'], teams: ['League tables', 'Competitions', 'Team profiles', 'Team history', 'Team DNA'], adv: ['Coverage & data health', 'Newsroom', 'Video feed'], models: ['Player DNA', 'Team DNA', 'Algo v1 & v2'] } },
    { id: 'ufc', status: 'Fight Intelligence', line: '39-route fight-intelligence API: Fight DNA, Matchup DNA, fight week, availability, media and card intelligence.', media: '/assets/media/sport-ufc.webp', alt: 'A crowded arena around a lit fighting cage', name: 'UFC', long: 'UFC and combat sports', color: '#D8483F', api: false,
      deep: null, platform: 'https://ufc.proptechusa.ai', examples: ['ufc'],
      headline: '39 commercial routes across Fight DNA, fight week, fighter state and media intelligence.',
      summary: 'UFC runs on the dedicated combat-sports intelligence platform, not through the PropSports API key: 39 commercial routes across events, cards, weigh-ins, availability, fighter and bout history, round statistics, Fight DNA, Matchup DNA, Fight State Ledger, editorial and official media metadata.',
      sources: 'Dedicated UFC platform (ufc-api.propbetedge.ai); weigh-in ingest every minute',
      cache: 'Platform-managed',
      matrix: { live: ['Events & cards', 'Weigh-ins', 'Results', 'Card changes', 'Injuries & availability'], pbp: ['Bout detail', 'Round statistics', 'Fight State Ledger'], players: ['Fighter profiles', 'Fight history', 'Fighter status', 'Fight DNA'], teams: ['Official rankings', 'Search & discovery'], adv: ['Fight-week intelligence', 'Newsroom & articles', 'Official video metadata', 'Coverage counts'], models: ['Fight DNA', 'Matchup DNA', 'DNA query', 'Card intelligence'] } }
  ];

  // Product-story content per sport page. Every claim maps to a documented route or verified platform behavior.
  var STORY = {
    mlb: { value: 'The deepest MLB data layer on the network — live games, owned Statcast and a first-party model.',
      points: [['Owned Statcast tables', 'Batter and pitcher exit velocity, barrel %, xBA / xSLG / xwOBA and handedness splits from our own database.'],
        ['Game environment', 'Per-park wind and temperature with park factor, plus umpire crews for every game on the slate.'],
        ['Live game state', 'Inning, count, outs and runners from the live slate; linescore, box score and recent plays per game.'],
        ['Model output, kept separate', 'PropBetEdge Poisson model prices published under their own /mlb/odds/model routes.'],
        ['Standings, teams and rosters', 'League and division standings, all 30 clubs, team profiles, active rosters and team schedules from the MLB Stats API.'],
        ['The minor leagues, on the same key', 'Triple-A to Rookie: affiliates, standings, scores, leaders, player careers and recent form — open without a key.']],
      uses: [['Live score and slate apps', 'Schedule, probables, lineups, live state and standings in one feed.'], ['Prospect and farm-system tools', 'MiLB careers, form and leaders tied to MLB player IDs.'], ['Research and model builds', 'Statcast tables with pagination for backtests and features.'], ['Betting and props tools', 'Book props and model prices side by side.'], ['Media products', 'Game environment and umpire context for previews.']] },
    nfl: { value: 'A normalized NFL layer — scoreboards, drives, play-by-play and standings on one key.',
      points: [['Normalized scoreboard', 'One scoreboard shape by date or week, with records, broadcasts and possession.'],
        ['Drives and plays', 'Full drive history, the current drive and every play for a game.'],
        ['Win-probability series', 'ESPN\'s win-probability series per game, passed through as a clearly sourced field.'],
        ['Teams and rosters', 'Standings, team directory, rosters and team schedules.']],
      uses: [['Live score products', 'Scoreboards and live games refreshed in seconds.'], ['Game-detail apps', 'Drives, plays and leaders for every game page.'], ['Fantasy and analysis tools', 'Rosters, box scores and schedules.'], ['Media dashboards', 'Standings and week-by-week slates.']] },
    nba: { value: 'Game-level basketball detail — shot coordinates, lineups and advanced box scores.',
      points: [['Shot coordinates', 'Every made and missed shot with court x/y, plus a ready shot chart.'],
        ['Reconstructed lineups', 'On-court five rebuilt from starters and substitutions (estimates, labelled as such).'],
        ['Advanced box scores', 'Box scores with computed TS% and USG%.'],
        ['Win-probability series', 'ESPN\'s win-probability series per game, clearly sourced.'],
        ['Standings and teams', 'Conference standings, all 30 teams, team profiles, rosters, team schedules and team statistics.']],
      uses: [['Shot-chart visualizations', 'Court-coordinate plays ready to plot.'], ['Game-center products', 'Summary, box score, plays and lineups per game.'], ['Player analysis', 'Efficiency metrics computed per game.'], ['Live score apps', 'Slate and live games.'], ['Team pages', 'Standings, rosters, schedules and team stats per club.']] },
    wnba: { value: 'The WNBA with real depth — live games, player and team stats, WinBA and Player DNA.',
      points: [['Live game state', 'Today\'s slate, live game state, events, box scores and shots.'],
        ['Player and team stats', 'Player and team statistics, game logs, injuries and transactions.'],
        ['WinBA', 'A winning-impact index that measures association with winning, not causation.'],
        ['Player DNA', 'Current-season Player DNA profiles, with a meta route listing which fields are proxies.']],
      uses: [['WNBA score and slate apps', 'Today, schedule and live state.'], ['Player analysis', 'Game logs, stats and DNA profiles.'], ['Media and newsroom tools', 'Standings, playoffs, injuries and transactions.'], ['Model research', 'WinBA and stat tables as inputs.']] },
    nhl: { value: 'Hockey beyond the box score — live cast, shot geometry, goalie starters and line deployment.',
      points: [['Live cast', 'Manpower, goalies in net and running totals during the game.'],
        ['Shot geometry', 'Raw shot features per game, marked raw-features-only — no xG is claimed.'],
        ['Goalie starters', 'Confirmed or projected starters with rest and recent form; GSAx is reported as unavailable, never estimated.'],
        ['Line deployment', 'Lines and pairs derived from shift charts for completed games.']],
      uses: [['Live hockey apps', 'Board, scoreboard and live cast.'], ['Goalie and lineup tools', 'Starters and deployment by team.'], ['Shot-location research', 'Raw shot geometry for your own models.'], ['Standings and leaders pages', 'Public standings and leader routes.']] },
    tennis: { value: 'Point-level tennis — live score and server, tournaments, rankings and head-to-head.',
      points: [['Live point score', 'Live matches with point score, server and set-by-set detail.'],
        ['Order of play', 'Today\'s matches across ATP and WTA events.'],
        ['Rankings and H2H', 'WTA rankings by default, ATP via ?tour=atp, and head-to-head records.'],
        ['Tournament editions', 'Tournament and edition detail with match lists.']],
      uses: [['Live tennis score apps', 'Point, game and set state as it happens.'], ['Player profile pages', 'Profiles, rankings and H2H.'], ['Tournament trackers', 'Editions, draws and order of play.'], ['Match research', 'Match detail and history for analysis.']] },
    soccer: { value: 'Club and international soccer — fixtures, live matches, tables and player and team DNA.',
      points: [['Fixtures and live matches', 'Fixtures and results by date or competition, plus live and recent matches.'],
        ['Match cast', 'A per-match cast alongside match detail.'],
        ['League tables and competitions', 'Premier League, Bundesliga, UEFA Champions League, UEFA Nations League and MLS.'],
        ['Player and team DNA', 'DNA profiles for players and teams.']],
      uses: [['Soccer score apps', 'Fixtures, live matches and results.'], ['League table widgets', 'Tables by competition.'], ['Scouting and analysis', 'Player and team DNA profiles.'], ['Media products', 'Match detail and cast per game.']] },
    ufc: { value: 'Combat-sports intelligence on its own platform — cards, weigh-ins, round stats and Fight DNA.',
      points: [['Events and cards', 'Upcoming events, fight cards, card changes and results.'],
        ['Weigh-ins', 'Event weigh-in results as they post.'],
        ['Round statistics', 'Round-by-round bout statistics and fighter histories.'],
        ['Fight DNA and card intelligence', 'Fight DNA describes style and output — not a pick, price or probability.']],
      uses: [['Fight-week products', 'Cards, weigh-ins and card changes.'], ['Fighter profile pages', 'Histories and career statistics.'], ['Analysis tools', 'Round statistics and Fight DNA.'], ['Media coverage', 'Event intelligence and results.']] }
  };

  // MLB Edge Suite: a separate specialist product (not part of PropSports API plans).
  // checkoutReady stays false until the billing Worker accepts these prices and provisioning is verified.
  var EDGE = {
    checkoutReady: false,
    products: [
      ['Almost Bomb Streak Detector', 'Hitters producing homer-quality contact without the box-score result — exit velocity, launch angle, distance, xBA and streak length.'],
      ['Pitcher Intelligence', 'Probable starters ranked by a last-five-start punishment score from hard-hit %, barrel %, exit velocity and K/9 trend.'],
      ['Lucky Bombs', 'Yesterday\'s home runs that were more gift than signal: soft contact, bad angle, short distance or park-aided.'],
      ['Ball Flight Intelligence', 'Tonight\'s games scored on temperature, humidity, altitude and air density, with estimated extra carry.'],
      ['MLB Intelligence', 'Park factor, wind, temperature, umpire grades and HR scores in one composite layer.']
    ],
    plans: [
      { id: 'EDGE_BASIC', name: 'Basic', price: 29, limit: 10000, priceId: 'price_1TgVoxF3CaVzg4ORm5niMmar' },
      { id: 'EDGE_PRO', name: 'Pro', price: 59, limit: 50000, priceId: 'price_1TgVpYF3CaVzg4ORBTywn1gR', featured: true },
      { id: 'EDGE_ULTRA', name: 'Ultra', price: 99, limit: 200000, priceId: 'price_1TgVqWF3CaVzg4OR3cxGnuAx' }
    ]
  };

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
      lede: 'Production terms and priority integration.', feats: ['Priority integration support', 'Production terms', 'Custom data and rights scope by written agreement'] }
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
  function countAccess(list, a) { return list.reduce(function (n, g) { return n + g[1].filter(function (r) { return r[2] === a; }).length; }, 0); }
  var perSport = {}, byAccess = { open: {}, demo: {}, key: {} }, totals = { open: 0, demo: 0, key: 0 }, total = 0;
  Object.keys(ROUTES).forEach(function (s) {
    perSport[s] = count(ROUTES[s]); total += perSport[s];
    Object.keys(totals).forEach(function (a) { byAccess[a][s] = countAccess(ROUTES[s], a); totals[a] += byAccess[a][s]; });
  });

  root.PS_CONFIG = {
    API_BASE: API_BASE, UFC_BASE: UFC_BASE,
    CHECKOUT_URL: 'https://propsports-stripe.sales-fd3.workers.dev/create-checkout',
    SITE: 'https://propsports.proptechusa.ai',
    REFRESH_SECONDS: 15,
    // Endpoint count shown on the site = the live API catalog (GET /health "endpoints").
    // Build fetches it; pages re-read it at runtime. This is only the offline fallback.
    CATALOG_ENDPOINTS_FALLBACK: 206,
    ACCESS: ACCESS, SPORTS: SPORTS, STORY: STORY, EDGE: EDGE, ROUTES: ROUTES, UFC_ROUTES: UFC_ROUTES, PLANS: PLANS, PRICE_IDS: PRICE_IDS, DEVELOPER_MAX_SPORTS: DEVELOPER_MAX_SPORTS,
    COUNTS: {
      SPORT_PLATFORMS: SPORTS.length,
      CORE_API_SPORTS: SPORTS.filter(function (s) { return s.api; }).length,
      DOCUMENTED_ROUTES: total, PER_SPORT: perSport,
      OPEN: totals.open, DEMO: totals.demo, KEY: totals.key,
      OPEN_PER_SPORT: byAccess.open, DEMO_PER_SPORT: byAccess.demo, KEY_PER_SPORT: byAccess.key,
      UFC_ENDPOINTS_LISTED: count(UFC_ROUTES),
      NETWORK_DOCUMENTED_ROUTES: total + count(UFC_ROUTES)
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
