#!/usr/bin/env python3
"""Prepare the PropSports static site for the NFL v5 API release.

This script is intentionally not run automatically. Promote the API first, verify
its live canaries, then run this script from the propsports repository root and
publish the resulting HTML changes.
"""
from pathlib import Path

ROOT = Path(__file__).resolve().parent

NFL_DATA_CARDS = '''
        <div class="endpoint-card"><span class="badge-get">GET</span><div><h4>/nfl/scoreboard</h4><p>Normalized NFL scoreboard by date or week, including teams, scores, status, venue, broadcast, and game context.</p></div></div>
        <div class="endpoint-card"><span class="badge-get">GET</span><div><h4>/nfl/standings</h4><p>Current NFL standings normalized into all eight division groups.</p></div></div>
        <div class="endpoint-card"><span class="badge-get">GET</span><div><h4>/nfl/teams</h4><p>NFL team directory with IDs, abbreviations, names, colors, logos, and links.</p></div></div>
        <div class="endpoint-card"><span class="badge-get">GET</span><div><h4>/nfl/team/:id</h4><p>Normalized team profile for a single NFL team.</p></div></div>
        <div class="endpoint-card"><span class="badge-get">GET</span><div><h4>/nfl/team/:id/roster</h4><p>Current roster with player IDs, positions, jersey numbers, headshots, size, experience, and status when supplied upstream.</p></div></div>
        <div class="endpoint-card"><span class="badge-get">GET</span><div><h4>/nfl/team/:id/schedule</h4><p>Team-specific NFL event schedule with dates, IDs, season/week references, competitions, and links.</p></div></div>
        <div class="endpoint-card"><span class="badge-get">GET</span><div><h4>/nfl/game/:id</h4><p>Full normalized game package with score, possession, down-and-distance, venue, drives, plays, leaders, and player statistics.</p></div></div>
        <div class="endpoint-card"><span class="badge-get">GET</span><div><h4>/nfl/game/:id/boxscore</h4><p>Player box-score groups and labels for both teams.</p></div></div>
        <div class="endpoint-card"><span class="badge-get">GET</span><div><h4>/nfl/game/:id/plays</h4><p>Play-by-play with down, distance, field position, scoring state, participants, and score context.</p></div></div>
        <div class="endpoint-card"><span class="badge-get">GET</span><div><h4>/nfl/game/:id/drives</h4><p>Drive history with team, result, yards, elapsed time, start/end field position, and contained plays.</p></div></div>
        <div class="endpoint-card"><span class="badge-get">GET</span><div><h4>/nfl/game/:id/leaders</h4><p>Passing, rushing, and receiving game leaders using factual game-package statistics.</p></div></div>
        <div class="endpoint-card"><span class="badge-get">GET</span><div><h4>/nfl/game/:id/winprob</h4><p>Game win-probability series when supplied by the upstream game package.</p></div></div>'''

INDEX_EP_CARDS = '''
      <div class="ep-card" data-tags="nfl scoreboard scores date week status"><span class="get-b">GET</span><div><div class="ep-path">/nfl/scoreboard</div><div class="ep-desc">Normalized scoreboard by date or week. Scores, status, venue, broadcast, possession context.</div></div></div>
      <div class="ep-card" data-tags="nfl standings conference division records"><span class="get-b">GET</span><div><div class="ep-path">/nfl/standings</div><div class="ep-desc">Current NFL standings across all eight divisions.</div></div></div>
      <div class="ep-card" data-tags="nfl teams directory logos"><span class="get-b">GET</span><div><div class="ep-path">/nfl/teams</div><div class="ep-desc">NFL team directory with IDs, abbreviations, names, logos and colors.</div></div></div>
      <div class="ep-card" data-tags="nfl team profile"><span class="get-b">GET</span><div><div class="ep-path">/nfl/team/:id</div><div class="ep-desc">Normalized NFL team profile.</div></div></div>
      <div class="ep-card" data-tags="nfl roster players position jersey"><span class="get-b">GET</span><div><div class="ep-path">/nfl/team/:id/roster</div><div class="ep-desc">Current roster with player IDs, positions, jersey numbers, headshots and status.</div></div></div>
      <div class="ep-card" data-tags="nfl team schedule games"><span class="get-b">GET</span><div><div class="ep-path">/nfl/team/:id/schedule</div><div class="ep-desc">Team-specific event schedule with dates, IDs, season/week references and competition metadata.</div></div></div>
      <div class="ep-card" data-tags="nfl game detail possession down distance"><span class="get-b">GET</span><div><div class="ep-path">/nfl/game/:id</div><div class="ep-desc">Full game package: score, situation, drives, plays, leaders and player stats.</div></div></div>
      <div class="ep-card" data-tags="nfl game boxscore player stats"><span class="get-b">GET</span><div><div class="ep-path">/nfl/game/:id/boxscore</div><div class="ep-desc">Player box-score groups for both teams.</div></div></div>
      <div class="ep-card" data-tags="nfl play by play pbp"><span class="get-b">GET</span><div><div class="ep-path">/nfl/game/:id/plays</div><div class="ep-desc">Play-by-play with field position, down-and-distance, participants and score state.</div></div></div>
      <div class="ep-card" data-tags="nfl drives drive history"><span class="get-b">GET</span><div><div class="ep-path">/nfl/game/:id/drives</div><div class="ep-desc">Drive history with result, yards, time and contained plays.</div></div></div>
      <div class="ep-card" data-tags="nfl leaders passing rushing receiving"><span class="get-b">GET</span><div><div class="ep-path">/nfl/game/:id/leaders</div><div class="ep-desc">Passing, rushing and receiving game leaders.</div></div></div>
      <div class="ep-card" data-tags="nfl win probability winprob"><span class="get-b">GET</span><div><div class="ep-path">/nfl/game/:id/winprob</div><div class="ep-desc">Game win-probability series when supplied by the upstream game package.</div></div></div>'''

INDEX_SP_ITEMS = '''
        <div class="sp-item"><span class="sp-badge">GET</span><div><div class="sp-path">/nfl/scoreboard</div><div class="sp-desc">Normalized scoreboard by date or week.</div></div></div>
        <div class="sp-item"><span class="sp-badge">GET</span><div><div class="sp-path">/nfl/standings</div><div class="sp-desc">Eight-division NFL standings.</div></div></div>
        <div class="sp-item"><span class="sp-badge">GET</span><div><div class="sp-path">/nfl/teams</div><div class="sp-desc">Team directory with IDs, abbreviations, logos and colors.</div></div></div>
        <div class="sp-item"><span class="sp-badge">GET</span><div><div class="sp-path">/nfl/team/:id/roster</div><div class="sp-desc">Current roster and player metadata.</div></div></div>
        <div class="sp-item"><span class="sp-badge">GET</span><div><div class="sp-path">/nfl/game/:id</div><div class="sp-desc">Normalized full-game package.</div></div></div>
        <div class="sp-item"><span class="sp-badge">GET</span><div><div class="sp-path">/nfl/game/:id/boxscore</div><div class="sp-desc">Player box score for both teams.</div></div></div>
        <div class="sp-item"><span class="sp-badge">GET</span><div><div class="sp-path">/nfl/game/:id/plays</div><div class="sp-desc">Play-by-play with situation and participants.</div></div></div>
        <div class="sp-item"><span class="sp-badge">GET</span><div><div class="sp-path">/nfl/game/:id/drives</div><div class="sp-desc">Drive history with yards, time and result.</div></div></div>
        <div class="sp-item"><span class="sp-badge">GET</span><div><div class="sp-path">/nfl/game/:id/leaders</div><div class="sp-desc">Passing, rushing and receiving leaders.</div></div></div>
        <div class="sp-item"><span class="sp-badge">GET</span><div><div class="sp-path">/nfl/game/:id/winprob</div><div class="sp-desc">Game win-probability series when available.</div></div></div>'''

DOC_SIDEBAR = '''
      <a href="#nfl-scoreboard" class="sb-link">GET /nfl/scoreboard</a>
      <a href="#nfl-standings" class="sb-link">GET /nfl/standings</a>
      <a href="#nfl-teams" class="sb-link">GET /nfl/teams</a>
      <a href="#nfl-team" class="sb-link">GET /nfl/team/:id</a>
      <a href="#nfl-roster" class="sb-link">GET /nfl/team/:id/roster</a>
      <a href="#nfl-team-schedule" class="sb-link">GET /nfl/team/:id/schedule</a>
      <a href="#nfl-game" class="sb-link">GET /nfl/game/:id</a>
      <a href="#nfl-boxscore" class="sb-link">GET /nfl/game/:id/boxscore</a>
      <a href="#nfl-plays" class="sb-link">GET /nfl/game/:id/plays</a>
      <a href="#nfl-drives" class="sb-link">GET /nfl/game/:id/drives</a>
      <a href="#nfl-leaders" class="sb-link">GET /nfl/game/:id/leaders</a>
      <a href="#nfl-winprob" class="sb-link">GET /nfl/game/:id/winprob</a>'''

DOC_SECTIONS = '''
    <div class="doc-section" id="nfl-scoreboard">
      <h2>GET /nfl/scoreboard</h2>
      <div class="ep-badge"><span class="get-tag">GET</span>/nfl/scoreboard</div>
      <p>Normalized NFL scoreboard by date or week. Returns teams, score, status, venue, broadcast context, current situation, and game-level odds when present upstream.</p>
      <table class="param-table"><thead><tr><th>Param</th><th>Type</th><th>Required</th><th>Description</th></tr></thead><tbody><tr><td class="pn">date</td><td class="pt">YYYYMMDD</td><td><span class="po">optional</span></td><td>Scoreboard date. Defaults to the current Eastern date.</td></tr><tr><td class="pn">week</td><td class="pt">integer</td><td><span class="po">optional</span></td><td>NFL week. When supplied, week mode takes precedence over date.</td></tr><tr><td class="pn">season</td><td class="pt">integer</td><td><span class="po">optional</span></td><td>NFL season year. Defaults to the current year.</td></tr><tr><td class="pn">season_type</td><td class="pt">integer</td><td><span class="po">optional</span></td><td>ESPN season type. Defaults to 2 for regular season.</td></tr></tbody></table>
    </div>

    <div class="doc-section" id="nfl-standings"><h2>GET /nfl/standings</h2><div class="ep-badge"><span class="get-tag">GET</span>/nfl/standings</div><p>Current NFL standings normalized into all eight division groups with team metadata and provider-supplied standings statistics.</p></div>
    <div class="doc-section" id="nfl-teams"><h2>GET /nfl/teams</h2><div class="ep-badge"><span class="get-tag">GET</span>/nfl/teams</div><p>NFL team directory with stable ESPN IDs, abbreviations, names, logos, colors, active status, and links.</p></div>
    <div class="doc-section" id="nfl-team"><h2>GET /nfl/team/:id</h2><div class="ep-badge"><span class="get-tag">GET</span>/nfl/team/:id</div><p>Normalized profile for one NFL team. Use the team ID returned by <code>/nfl/teams</code>.</p></div>
    <div class="doc-section" id="nfl-roster"><h2>GET /nfl/team/:id/roster</h2><div class="ep-badge"><span class="get-tag">GET</span>/nfl/team/:id/roster</div><p>Current roster with player IDs, names, jersey, position, headshot, age, height, weight, experience, and roster status when supplied upstream.</p></div>
    <div class="doc-section" id="nfl-team-schedule"><h2>GET /nfl/team/:id/schedule</h2><div class="ep-badge"><span class="get-tag">GET</span>/nfl/team/:id/schedule</div><p>Team-specific event schedule with event IDs, dates, names, season/week references, competition references, and links.</p><table class="param-table"><thead><tr><th>Param</th><th>Type</th><th>Required</th><th>Description</th></tr></thead><tbody><tr><td class="pn">season</td><td class="pt">integer</td><td><span class="po">optional</span></td><td>Season year.</td></tr></tbody></table></div>
    <div class="doc-section" id="nfl-game"><h2>GET /nfl/game/:id</h2><div class="ep-badge"><span class="get-tag">GET</span>/nfl/game/:id</div><p>Full normalized game package: teams, score, status, venue, possession, down-and-distance, drives, play-by-play, player statistics, leaders, and win probability. Use an ESPN game ID returned by the schedule or scoreboard routes.</p></div>
    <div class="doc-section" id="nfl-boxscore"><h2>GET /nfl/game/:id/boxscore</h2><div class="ep-badge"><span class="get-tag">GET</span>/nfl/game/:id/boxscore</div><p>Player box-score groups and labels for both teams. Fields remain source-aware rather than inventing missing statistics.</p></div>
    <div class="doc-section" id="nfl-plays"><h2>GET /nfl/game/:id/plays</h2><div class="ep-badge"><span class="get-tag">GET</span>/nfl/game/:id/plays</div><p>Play-by-play with period, clock, field position, down-and-distance, participants, scoring state, and score context.</p></div>
    <div class="doc-section" id="nfl-drives"><h2>GET /nfl/game/:id/drives</h2><div class="ep-badge"><span class="get-tag">GET</span>/nfl/game/:id/drives</div><p>Drive history with offense, result, yards, play count, elapsed time, start/end field position, and contained plays.</p></div>
    <div class="doc-section" id="nfl-leaders"><h2>GET /nfl/game/:id/leaders</h2><div class="ep-badge"><span class="get-tag">GET</span>/nfl/game/:id/leaders</div><p>Passing, rushing, and receiving game leaders. If the provider omits a leader block, PropSports derives leaders only from factual box-score yardage.</p></div>
    <div class="doc-section" id="nfl-winprob"><h2>GET /nfl/game/:id/winprob</h2><div class="ep-badge"><span class="get-tag">GET</span>/nfl/game/:id/winprob</div><p>Provider-supplied game win-probability series keyed to play IDs. Returns an empty series when the upstream game package does not supply win probability.</p></div>

'''


def load(name: str) -> str:
    path = ROOT / name
    if not path.exists():
        raise SystemExit(f"ERROR: {name} not found")
    return path.read_text(encoding="utf-8")


def save(name: str, text: str) -> None:
    (ROOT / name).write_text(text, encoding="utf-8")
    print(f"updated {name}: {len(text):,} chars")


def require_replace(text: str, old: str, new: str, label: str, minimum: int = 1) -> str:
    count = text.count(old)
    if count < minimum:
        raise SystemExit(f"ERROR: release marker missing for {label}: expected >= {minimum}, found {count}")
    return text.replace(old, new)


def patch_nfl_page() -> None:
    name = "nfl.html"
    src = load(name)
    src = require_replace(src, "NFL API — Live Scores, Schedules & Football Odds | PropSports API", "NFL API — Scores, Box Scores, Play-by-Play, Rosters & Odds | PropSports API", "NFL title")
    src = require_replace(src, "PropSports NFL API gives builders clean football schedules, live games, odds, and all-sports API access. NFL-only from $19/mo. All sports from $49/mo.", "PropSports NFL API gives builders schedules, live games, odds, standings, team rosters, box scores, play-by-play, drives, leaders, and win-probability data. NFL-only from $19/mo. All sports from $49/mo.", "NFL meta description")
    ticker_old = '<span class="ticker-item"><strong>NFL API</strong> /nfl/schedule · /nfl/games/live · /nfl/odds</span>'
    ticker_new = '<span class="ticker-item"><strong>NFL API v5</strong> 15 data endpoints · scores · rosters · box scores · play-by-play</span>'
    src = require_replace(src, ticker_old, ticker_new, "NFL ticker", minimum=2)
    src = require_replace(src, "Clean football schedules, live game state, and odds from the same PropSports platform powering our public sports products. Start NFL-only, then upgrade to MLB, NFL, NBA, and NHL on one API key.", "Clean football data for production apps: schedules, live game state, odds, standings, rosters, box scores, play-by-play, drives, leaders, and win probability from one API surface. Start NFL-only, then upgrade to MLB, NFL, NBA, and NHL on one key.", "NFL hero copy")
    src = require_replace(src, '<div class="metric"><strong>47</strong><span>Total endpoints</span></div>', '<div class="metric"><strong>59</strong><span>Total endpoints</span></div>', "NFL metric")
    if "/nfl/scoreboard</h4>" not in src:
        anchor = '        <div class="endpoint-card"><span class="badge-get">GET</span><div><h4>/nfl/odds</h4><p>Point spreads, totals, and moneylines for NFL board views.</p></div></div>'
        src = require_replace(src, anchor, anchor + NFL_DATA_CARDS, "NFL endpoint cards")
    save(name, src)


def patch_index() -> None:
    name = "index.html"
    src = load(name)
    src = src.replace("47 endpoints", "59 endpoints").replace("47 Endpoints", "59 Endpoints").replace("47+Live Endpoints", "59+Live Endpoints")
    src = src.replace("View All 47 Endpoints", "View All 59 Endpoints")
    src = src.replace("Search all 47 endpoints.", "Search all 59 endpoints.")
    src = require_replace(src, "Full NFL schedule, live scores, spread and over/under. NHL schedule, standings, skater leaders. Everything in one auth header.", "NFL now includes schedules, live scores, odds, standings, rosters, box scores, play-by-play, drives, leaders, and win probability. NHL includes schedule, standings, skater leaders. Everything in one auth header.", "homepage NFL feature")
    if 'data-tags="nfl scoreboard scores date week status"' not in src:
        anchor = '      <div class="ep-card" data-tags="nfl odds spread moneyline over under"><span class="get-b">GET</span><div><div class="ep-path">/nfl/odds</div><div class="ep-desc">Game-level NFL odds — spread, over/under, home/away moneyline.</div></div></div>'
        src = require_replace(src, anchor, anchor + INDEX_EP_CARDS, "homepage endpoint grid")
    if '<div class="sp-path">/nfl/scoreboard</div>' not in src:
        anchor = '        <div class="sp-item"><span class="sp-badge">GET</span><div><div class="sp-path">/nfl/odds</div><div class="sp-desc">Game odds — spread, over/under, home and away moneyline.</div></div></div>'
        src = require_replace(src, anchor, anchor + INDEX_SP_ITEMS, "homepage NFL sport panel")
    src = require_replace(src, '<div class="sp-box-head"><span>NFL — 3 endpoints</span><span class="sp-badge2">BASIC+</span></div>', '<div class="sp-box-head"><span>NFL — 15 data endpoints</span><span class="sp-badge2">BASIC+</span></div>', "homepage NFL panel count")
    save(name, src)


def patch_docs() -> None:
    name = "docs.html"
    src = load(name)
    src = src.replace("47 Endpoints", "59 Endpoints").replace("47 endpoints", "59 endpoints")
    if 'href="#nfl-scoreboard"' not in src:
        anchor = '      <a href="#nfl-odds" class="sb-link">GET /nfl/odds</a>'
        src = require_replace(src, anchor, anchor + DOC_SIDEBAR, "docs NFL sidebar")
    if 'id="nfl-scoreboard"' not in src:
        marker = '    <!-- ═══════ NBA ═══════ -->'
        src = require_replace(src, marker, DOC_SECTIONS + marker, "docs NFL v5 sections")
    save(name, src)


def patch_pricing() -> None:
    name = "pricing.html"
    src = load(name)
    src = src.replace("47 endpoints", "59 endpoints").replace("47 Endpoints", "59 Endpoints")
    src = require_replace(src, "Player props · spreads · totals<br>Moneylines · team stats<br>Live scores · standings", "Schedules · live scores · odds<br>Standings · rosters · box scores<br>Play-by-play · drives · leaders", "pricing NFL capability copy")
    save(name, src)


if __name__ == "__main__":
    patch_nfl_page()
    patch_index()
    patch_docs()
    patch_pricing()
    print("PropSports NFL v5 site release prepared. Review diff before publishing.")
