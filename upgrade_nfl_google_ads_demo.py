#!/usr/bin/env python3
"""Upgrade the PropSports NFL landing page with a polished, light, interactive API demo.

The patch is intentionally idempotent so the publish workflow can safely run more than once.
It preserves the existing embedded football hero photo and the current checkout wiring.
"""
from pathlib import Path

PAGE = Path("nfl.html")
html = PAGE.read_text(encoding="utf-8")

SANDBOX_CSS = r'''
/* interactive NFL sandbox */
.sandbox-section{background:#fff;border-top:1px solid var(--border);border-bottom:1px solid var(--border);padding:78px 0}
.sandbox-head{display:grid;grid-template-columns:minmax(0,1fr) minmax(320px,.72fr);gap:34px;align-items:end;margin-bottom:28px}
.sandbox-head h2{max-width:720px}
.sandbox-head .section-copy{justify-self:end}
.sandbox-shell{display:grid;grid-template-columns:300px minmax(0,1fr);background:var(--off);border:1px solid var(--border);border-radius:24px;overflow:hidden;box-shadow:0 26px 70px rgba(13,13,13,.09)}
.sandbox-controls{background:#fff;border-right:1px solid var(--border);padding:22px;display:flex;flex-direction:column;gap:16px}
.sandbox-label{font:800 9px 'JetBrains Mono',monospace;letter-spacing:.13em;text-transform:uppercase;color:var(--soft)}
.sandbox-endpoints{display:grid;gap:8px}
.sandbox-tab{width:100%;display:flex;align-items:center;justify-content:space-between;gap:10px;border:1px solid var(--border);background:#fff;color:var(--ink);border-radius:11px;padding:11px 12px;text-align:left;font-weight:800;font-size:12px;cursor:pointer;transition:.16s ease}
.sandbox-tab span:last-child{font:800 9px 'JetBrains Mono',monospace;color:var(--soft)}
.sandbox-tab:hover{border-color:#c8c6bf;background:var(--cream)}
.sandbox-tab.active{border-color:rgba(215,59,26,.35);background:rgba(215,59,26,.055);color:var(--red)}
.sandbox-tab.active span:last-child{color:var(--red)}
.sandbox-callout{margin-top:auto;background:var(--cream);border:1px solid var(--border);border-radius:14px;padding:14px}
.sandbox-callout strong{display:block;font:800 13px 'Syne',sans-serif;margin-bottom:5px}
.sandbox-callout p{font-size:12px;line-height:1.55;color:var(--muted)}
.sandbox-actions{display:grid;gap:8px}
.sandbox-actions .btn{width:100%;padding:11px 14px}
.sandbox-stage{min-width:0;padding:22px}
.sandbox-toolbar{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:14px}
.sandbox-request{display:flex;align-items:center;gap:9px;min-width:0;background:#fff;border:1px solid var(--border);border-radius:12px;padding:9px 12px;box-shadow:0 4px 16px rgba(0,0,0,.025)}
.sandbox-method{font:800 9px 'JetBrains Mono',monospace;color:var(--green);background:rgba(11,138,74,.08);border:1px solid rgba(11,138,74,.16);border-radius:6px;padding:4px 7px}
.sandbox-path{font:700 11px 'JetBrains Mono',monospace;color:var(--ink);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.sandbox-status{display:flex;align-items:center;gap:6px;font:800 9px 'JetBrains Mono',monospace;letter-spacing:.08em;text-transform:uppercase;color:var(--green)}
.sandbox-status i{width:7px;height:7px;border-radius:50%;background:var(--green);box-shadow:0 0 0 5px rgba(11,138,74,.08)}
.sandbox-product{background:#fff;border:1px solid var(--border);border-radius:18px;padding:20px;margin-bottom:14px}
.sandbox-product-top{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:18px}
.sandbox-product h3{font:800 24px 'Syne',sans-serif;letter-spacing:-.6px;line-height:1.05;margin-bottom:5px}
.sandbox-product p{font-size:13px;color:var(--muted);line-height:1.55;max-width:650px}
.sandbox-demo-badge{flex:0 0 auto;font:800 8px 'JetBrains Mono',monospace;letter-spacing:.12em;text-transform:uppercase;color:var(--red);background:rgba(215,59,26,.06);border:1px solid rgba(215,59,26,.16);border-radius:999px;padding:6px 9px}
.sandbox-score{display:grid;grid-template-columns:1fr auto 1fr;gap:16px;align-items:center;background:var(--cream);border:1px solid var(--border);border-radius:16px;padding:17px}
.sandbox-team{display:flex;align-items:center;gap:11px;min-width:0}
.sandbox-team:last-child{justify-content:flex-end;text-align:right}
.sandbox-team-mark{width:46px;height:46px;border-radius:13px;background:#fff;border:1px solid var(--border);display:grid;place-items:center;font:800 13px 'Syne',sans-serif;box-shadow:0 4px 12px rgba(0,0,0,.04)}
.sandbox-team b{display:block;font:800 15px 'Syne',sans-serif;line-height:1.1}
.sandbox-team small{display:block;margin-top:3px;color:var(--muted);font-size:11px}
.sandbox-vs{text-align:center}.sandbox-vs strong{display:block;font:800 12px 'JetBrains Mono',monospace}.sandbox-vs span{display:block;font-size:10px;color:var(--muted);margin-top:3px}
.sandbox-kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:10px}
.sandbox-kpi{background:#fff;border:1px solid var(--border);border-radius:12px;padding:11px}
.sandbox-kpi b{display:block;font:800 14px 'Syne',sans-serif;line-height:1.15;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.sandbox-kpi span{display:block;margin-top:4px;font:800 8px 'JetBrains Mono',monospace;letter-spacing:.09em;text-transform:uppercase;color:var(--soft)}
.sandbox-json-wrap{background:#fff;border:1px solid var(--border);border-radius:18px;overflow:hidden}
.sandbox-json-top{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 13px;border-bottom:1px solid var(--border);background:var(--cream)}
.sandbox-json-top span{font:800 9px 'JetBrains Mono',monospace;letter-spacing:.1em;text-transform:uppercase;color:var(--muted)}
.sandbox-copy{border:1px solid var(--border);background:#fff;color:var(--ink);border-radius:7px;padding:5px 8px;font:800 9px 'JetBrains Mono',monospace;cursor:pointer}
.sandbox-copy:hover{border-color:#bbb}
.sandbox-json{margin:0;padding:18px;min-height:290px;max-height:390px;overflow:auto;background:#fff;color:#252522;font:500 11px/1.72 'JetBrains Mono',monospace;white-space:pre-wrap;word-break:break-word}
.sandbox-foot{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-top:12px;color:var(--muted);font-size:11px}
.sandbox-foot strong{color:var(--ink)}
.sandbox-proof{display:flex;gap:6px;flex-wrap:wrap}.sandbox-proof span{font:800 8px 'JetBrains Mono',monospace;letter-spacing:.08em;text-transform:uppercase;border:1px solid var(--border);background:#fff;border-radius:999px;padding:5px 8px;color:var(--muted)}
.sandbox-run.loading{opacity:.72;pointer-events:none}
@media(max-width:900px){.sandbox-head{grid-template-columns:1fr}.sandbox-head .section-copy{justify-self:start}.sandbox-shell{grid-template-columns:1fr}.sandbox-controls{border-right:0;border-bottom:1px solid var(--border)}.sandbox-endpoints{grid-template-columns:repeat(2,1fr)}.sandbox-callout{margin-top:0}.sandbox-actions{grid-template-columns:1fr 1fr}.sandbox-kpis{grid-template-columns:1fr 1fr}}
@media(max-width:560px){.sandbox-section{padding:56px 0}.sandbox-controls,.sandbox-stage{padding:14px}.sandbox-endpoints{grid-template-columns:1fr}.sandbox-actions{grid-template-columns:1fr}.sandbox-product-top{display:block}.sandbox-demo-badge{display:inline-block;margin-top:10px}.sandbox-score{grid-template-columns:1fr;gap:10px}.sandbox-team,.sandbox-team:last-child{justify-content:flex-start;text-align:left}.sandbox-vs{text-align:left;padding-left:57px}.sandbox-kpis{grid-template-columns:1fr 1fr}.sandbox-json{min-height:240px;font-size:10px}}
'''

SANDBOX_HTML = r'''
<section class="sandbox-section" id="sandbox">
  <div class="wrap">
    <div class="sandbox-head">
      <div><div class="eyebrow">Interactive NFL sandbox</div><h2>See the product before you wire a single endpoint.</h2></div>
      <p class="section-copy">A guided, no-key preview of the response shapes your app gets from PropSports. Switch between football endpoints, inspect normalized fields, and copy the request you would use in production.</p>
    </div>
    <div class="sandbox-shell">
      <aside class="sandbox-controls">
        <div>
          <div class="sandbox-label">Choose a capability</div>
          <div class="sandbox-endpoints" style="margin-top:9px">
            <button class="sandbox-tab active" data-sandbox="scoreboard"><span>Scoreboard</span><span>GAME DAY</span></button>
            <button class="sandbox-tab" data-sandbox="standings"><span>Standings</span><span>LEAGUE</span></button>
            <button class="sandbox-tab" data-sandbox="teams"><span>Teams</span><span>DIRECTORY</span></button>
            <button class="sandbox-tab" data-sandbox="roster"><span>Team roster</span><span>PLAYERS</span></button>
            <button class="sandbox-tab" data-sandbox="game"><span>Game detail</span><span>FULL GAME</span></button>
            <button class="sandbox-tab" data-sandbox="plays"><span>Play-by-play</span><span>LIVE FEED</span></button>
            <button class="sandbox-tab" data-sandbox="winprob"><span>Win probability</span><span>SERIES</span></button>
          </div>
        </div>
        <div class="sandbox-callout"><strong>Built for product teams.</strong><p>The demo is intentionally source-aware: fields that are not supplied stay unavailable instead of being invented.</p></div>
        <div class="sandbox-actions">
          <button class="btn btn-red sandbox-run" id="sandbox-run" type="button">Run Demo →</button>
          <a class="btn btn-ghost" href="/docs#nfl-scoreboard">Open Full Docs</a>
        </div>
      </aside>
      <div class="sandbox-stage">
        <div class="sandbox-toolbar">
          <div class="sandbox-request"><span class="sandbox-method">GET</span><span class="sandbox-path" id="sandbox-path">/nfl/scoreboard?week=1&amp;season=2026</span></div>
          <div class="sandbox-status"><i></i><span id="sandbox-status">200 · response preview</span></div>
        </div>
        <div class="sandbox-product">
          <div class="sandbox-product-top"><div><h3 id="sandbox-title">Normalized NFL scoreboard</h3><p id="sandbox-copytext">Score, status, venue, broadcast context, game situation, and odds when the upstream package supplies them.</p></div><span class="sandbox-demo-badge">Sample shape · not live data</span></div>
          <div class="sandbox-score" id="sandbox-score">
            <div class="sandbox-team"><div class="sandbox-team-mark">DAL</div><div><b>Dallas</b><small>Away team</small></div></div>
            <div class="sandbox-vs"><strong>AT</strong><span>Week 1</span></div>
            <div class="sandbox-team"><div><b>Philadelphia</b><small>Home team</small></div><div class="sandbox-team-mark">PHI</div></div>
          </div>
          <div class="sandbox-kpis" id="sandbox-kpis"></div>
        </div>
        <div class="sandbox-json-wrap">
          <div class="sandbox-json-top"><span>Normalized JSON response</span><button class="sandbox-copy" id="sandbox-copy-json" type="button">Copy JSON</button></div>
          <pre class="sandbox-json" id="sandbox-json"></pre>
        </div>
        <div class="sandbox-foot"><span><strong>No API key is used in this guided preview.</strong> Production calls use your subscriber key.</span><div class="sandbox-proof"><span>Clean JSON</span><span>Source-aware</span><span>Edge delivered</span><span>15 NFL endpoints</span></div></div>
      </div>
    </div>
  </div>
</section>
'''

SANDBOX_JS = r'''
const NFL_SANDBOX_DATA = {
  scoreboard: {
    path:'/nfl/scoreboard?week=1&season=2026',
    title:'Normalized NFL scoreboard',
    copy:'Score, status, venue, broadcast context, game situation, and odds when the upstream package supplies them.',
    teams:['DAL','Dallas','PHI','Philadelphia','Week 1'],
    kpis:[['scheduled','Status'],['2026','Season'],['1','Week'],['2','Teams']],
    response:{sport:'NFL',season:2026,week:1,games:[{id:'sample_game_id',away:{id:'6',abbr:'DAL',name:'Dallas Cowboys',score:null},home:{id:'21',abbr:'PHI',name:'Philadelphia Eagles',score:null},status:{state:'pre',detail:'Scheduled'},venue:{name:'Lincoln Financial Field'},broadcast:null,odds:null}],source_aware:true}
  },
  standings: {
    path:'/nfl/standings?season=2026',title:'League standings by division',copy:'All eight NFL divisions with team metadata and provider-supplied standings statistics.',teams:null,
    kpis:[['8','Divisions'],['32','Teams'],['2026','Season'],['source','Stats']],
    response:{sport:'NFL',season:2026,groups:[{name:'NFC East',teams:[{abbr:'DAL',stats:{wins:null,losses:null}},{abbr:'PHI',stats:{wins:null,losses:null}},{abbr:'NYG',stats:{wins:null,losses:null}},{abbr:'WSH',stats:{wins:null,losses:null}}]}],note:'Sample response shape; standings values remain null when not supplied.'}
  },
  teams: {
    path:'/nfl/teams',title:'Stable NFL team directory',copy:'Team IDs, abbreviations, names, colors, active state, and source links in one normalized directory.',teams:null,
    kpis:[['32','Teams'],['stable','IDs'],['logos','Metadata'],['active','State']],
    response:{sport:'NFL',teams:[{id:'21',abbreviation:'PHI',display_name:'Philadelphia Eagles',active:true,color:'004C54'},{id:'6',abbreviation:'DAL',display_name:'Dallas Cowboys',active:true,color:'002244'}],count:32}
  },
  roster: {
    path:'/nfl/team/21/roster',title:'Roster and player metadata',copy:'Current roster structure with player IDs, position, jersey, headshot, size, experience, and status when supplied upstream.',teams:null,
    kpis:[['21','Team ID'],['PHI','Team'],['players','Array'],['null-safe','Fields']],
    response:{sport:'NFL',team:{id:'21',abbr:'PHI'},players:[{id:'sample_player_id',display_name:'Sample Player',jersey:'00',position:'QB',headshot:null,height:null,weight:null,experience:null,status:null}],source_aware:true}
  },
  game: {
    path:'/nfl/game/sample_game_id',title:'Full normalized game package',copy:'A single call can carry score, situation, venue, drives, plays, leaders, player statistics, and win probability when available.',teams:['DAL','Dallas','PHI','Philadelphia','Game package'],
    kpis:[['game','Core'],['drives','Included'],['plays','Included'],['leaders','Included']],
    response:{sport:'NFL',id:'sample_game_id',teams:{away:{abbr:'DAL'},home:{abbr:'PHI'}},status:{state:'pre'},situation:null,drives:[],plays:[],leaders:[],player_statistics:[],win_probability:[]}
  },
  plays: {
    path:'/nfl/game/sample_game_id/plays',title:'Play-by-play built for product surfaces',copy:'Period, clock, field position, down-and-distance, participants, scoring state, and score context.',teams:['DAL','Dallas','PHI','Philadelphia','Play feed'],
    kpis:[['ordered','Plays'],['clock','Context'],['down','Situation'],['players','Participants']],
    response:{sport:'NFL',game_id:'sample_game_id',plays:[{id:'sample_play_id',period:1,clock:'15:00',text:'Sample play shape',down:1,distance:10,yard_line:null,scoring_play:false,participants:[],score:{away:0,home:0}}]}
  },
  winprob: {
    path:'/nfl/game/sample_game_id/winprob',title:'Provider-supplied win probability series',copy:'Play-keyed probability points when the upstream game package supplies them; otherwise the API returns an empty series.',teams:['DAL','Dallas','PHI','Philadelphia','Win probability'],
    kpis:[['play_id','Keyed'],['0–1','Range'],['source','Provider'],['[]','If missing']],
    response:{sport:'NFL',game_id:'sample_game_id',win_probability:[{play_id:'sample_play_id',home_win_probability:0.5}],note:'Illustrative response shape. Production returns provider-supplied values only.'}
  }
};
let nflSandboxKey = 'scoreboard';
function renderNflSandbox(key){
  const item = NFL_SANDBOX_DATA[key] || NFL_SANDBOX_DATA.scoreboard;
  nflSandboxKey = key;
  document.querySelectorAll('[data-sandbox]').forEach(btn=>btn.classList.toggle('active',btn.dataset.sandbox===key));
  const path = document.getElementById('sandbox-path');
  const title = document.getElementById('sandbox-title');
  const copy = document.getElementById('sandbox-copytext');
  const json = document.getElementById('sandbox-json');
  const kpis = document.getElementById('sandbox-kpis');
  const score = document.getElementById('sandbox-score');
  if(path) path.textContent=item.path;
  if(title) title.textContent=item.title;
  if(copy) copy.textContent=item.copy;
  if(json) json.textContent=JSON.stringify(item.response,null,2);
  if(kpis) kpis.innerHTML=item.kpis.map(([value,label])=>`<div class="sandbox-kpi"><b>${value}</b><span>${label}</span></div>`).join('');
  if(score){
    if(item.teams){
      score.style.display='grid';
      score.innerHTML=`<div class="sandbox-team"><div class="sandbox-team-mark">${item.teams[0]}</div><div><b>${item.teams[1]}</b><small>Away team</small></div></div><div class="sandbox-vs"><strong>AT</strong><span>${item.teams[4]}</span></div><div class="sandbox-team"><div><b>${item.teams[3]}</b><small>Home team</small></div><div class="sandbox-team-mark">${item.teams[2]}</div></div>`;
    }else{
      score.style.display='none';
      score.innerHTML='';
    }
  }
}
function runNflSandbox(){
  const btn=document.getElementById('sandbox-run');
  const status=document.getElementById('sandbox-status');
  if(btn){btn.classList.add('loading');btn.textContent='Running preview...';}
  if(status) status.textContent='requesting sample shape';
  setTimeout(()=>{renderNflSandbox(nflSandboxKey);if(btn){btn.classList.remove('loading');btn.textContent='Run Demo →';}if(status) status.textContent='200 · response preview';},420);
}
document.querySelectorAll('[data-sandbox]').forEach(btn=>btn.addEventListener('click',()=>renderNflSandbox(btn.dataset.sandbox)));
document.getElementById('sandbox-run')?.addEventListener('click',runNflSandbox);
document.getElementById('sandbox-copy-json')?.addEventListener('click',async function(){
  const text=document.getElementById('sandbox-json')?.textContent||'';
  try{await navigator.clipboard.writeText(text);this.textContent='Copied';setTimeout(()=>this.textContent='Copy JSON',1200);}catch(_){this.textContent='Select + copy';}
});
renderNflSandbox('scoreboard');
'''

# Preserve the existing hero image/data URI; only change copy/CTAs around it.
if '/* interactive NFL sandbox */' not in html:
    html = html.replace('/* pricing */', SANDBOX_CSS + '\n/* pricing */', 1)

html = html.replace(
    '<a href="#endpoints" class="btn btn-ghost">View Endpoints</a>',
    '<a href="#sandbox" class="btn btn-ghost">Try NFL Sandbox</a>',
    1,
)
html = html.replace('apps, apps, bots', 'apps, bots')
html = html.replace('<li>All 47 endpoints</li>', '<li>All 59 endpoints</li>')
html = html.replace(
    '<ul><li>NFL schedule endpoint</li><li>Live games endpoint</li><li>NFL odds endpoint</li><li>50,000 requests/day</li><li>Cancel anytime</li></ul>',
    '<ul><li>All 15 NFL endpoints</li><li>Scoreboards + standings</li><li>Rosters + team schedules</li><li>Box scores + play-by-play</li><li>50,000 requests/day</li></ul>',
)

if 'id="sandbox"' not in html:
    marker = '<section id="endpoints" style="background:var(--off);border-top:1px solid var(--border);border-bottom:1px solid var(--border)">'
    if marker not in html:
        raise SystemExit('Could not find NFL endpoints section marker')
    html = html.replace(marker, SANDBOX_HTML + '\n' + marker, 1)

if 'const NFL_SANDBOX_DATA' not in html:
    marker = 'function toggleMob(){'
    if marker not in html:
        raise SystemExit('Could not find NFL script marker')
    html = html.replace(marker, SANDBOX_JS + '\n' + marker, 1)

PAGE.write_text(html, encoding="utf-8")
print('NFL landing page sandbox upgrade applied.')
