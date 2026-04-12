// PropSports API — Shared JS v2

// ── ALL ENDPOINTS (search database) ──────────────────────────────────────
const ALL_ENDPOINTS = [
  // MLB
  {sport:'⚾',label:'MLB',path:'/mlb/schedule/today',desc:'Full slate with probable pitchers & venues',page:'/mlb.html'},
  {sport:'⚾',label:'MLB',path:'/mlb/schedule?date=YYYY-MM-DD',desc:'Schedule for any date',page:'/mlb.html'},
  {sport:'⚾',label:'MLB',path:'/mlb/games/live',desc:'Live games only with linescore',page:'/mlb.html'},
  {sport:'⚾',label:'MLB',path:'/mlb/lineups?date=YYYY-MM-DD',desc:'Confirmed batting orders',page:'/mlb.html'},
  {sport:'⚾',label:'MLB',path:'/mlb/game/:gamePk/plays',desc:'Real-time play-by-play data',page:'/mlb.html'},
  {sport:'⚾',label:'MLB',path:'/mlb/game/:gamePk/boxscore',desc:'Full box score with player stats',page:'/mlb.html'},
  {sport:'⚾',label:'MLB',path:'/mlb/game/:gamePk/linescore',desc:'Inning-by-inning linescore',page:'/mlb.html'},
  {sport:'⚾',label:'MLB',path:'/mlb/statcast/batters',desc:'Exit velocity, barrel%, hard hit% — MLB/AAA/AA',page:'/mlb.html'},
  {sport:'⚾',label:'MLB',path:'/mlb/statcast/pitchers',desc:'SwStr%, velo, EV allowed, barrels',page:'/mlb.html'},
  {sport:'⚾',label:'MLB',path:'/mlb/weather?park=Camden+Yards',desc:'Wind, temp, park factor for a specific park',page:'/mlb.html'},
  {sport:'⚾',label:'MLB',path:'/mlb/weather/all',desc:'Weather for every park today',page:'/mlb.html'},
  {sport:'⚾',label:'MLB',path:'/mlb/umpires?date=YYYY-MM-DD',desc:'Home plate umpire assignments',page:'/mlb.html'},
  {sport:'⚾',label:'MLB',path:'/mlb/player/:id/stats',desc:'Season hitting or pitching stats',page:'/mlb.html'},
  {sport:'⚾',label:'MLB',path:'/mlb/player/:id/gamelog',desc:'Game-by-game log for any player',page:'/mlb.html'},
  {sport:'⚾',label:'MLB',path:'/mlb/odds',desc:'Moneylines, spreads, over/unders',page:'/mlb.html'},
  // NFL
  {sport:'🏈',label:'NFL',path:'/nfl/schedule?week=1',desc:'Weekly schedule with matchups & venues',page:'/nfl.html'},
  {sport:'🏈',label:'NFL',path:'/nfl/games/live',desc:'Live NFL games in progress',page:'/nfl.html'},
  {sport:'🏈',label:'NFL',path:'/nfl/odds',desc:'Point spreads, totals, moneylines',page:'/nfl.html'},
  // NBA
  {sport:'🏀',label:'NBA',path:'/nba/schedule/today',desc:'Today\'s games with scores & odds',page:'/nba.html'},
  {sport:'🏀',label:'NBA',path:'/nba/schedule?date=YYYYMMDD',desc:'Games for any date',page:'/nba.html'},
  {sport:'🏀',label:'NBA',path:'/nba/games/live',desc:'Live games real-time',page:'/nba.html'},
  {sport:'🏀',label:'NBA',path:'/nba/leaders?stat=PTS',desc:'Stat leaders — PTS/REB/AST/BLK/STL',page:'/nba.html'},
  {sport:'🏀',label:'NBA',path:'/nba/player/:id/stats',desc:'Player season averages',page:'/nba.html'},
  {sport:'🏀',label:'NBA',path:'/nba/odds',desc:'Game lines and totals',page:'/nba.html'},
  // NHL
  {sport:'🏒',label:'NHL',path:'/nhl/schedule/today',desc:'Puck drops with TV broadcast info',page:'/nhl.html'},
  {sport:'🏒',label:'NHL',path:'/nhl/schedule?date=YYYY-MM-DD',desc:'Games for any date',page:'/nhl.html'},
  {sport:'🏒',label:'NHL',path:'/nhl/games/live',desc:'Live games with period and score',page:'/nhl.html'},
  {sport:'🏒',label:'NHL',path:'/nhl/standings',desc:'Full conference and division standings',page:'/nhl.html'},
  {sport:'🏒',label:'NHL',path:'/nhl/leaders?category=goals',desc:'Goals, assists, points leaders',page:'/nhl.html'},
  {sport:'🏒',label:'NHL',path:'/nhl/player/:id/stats',desc:'Player stats and career info',page:'/nhl.html'},
  {sport:'🏒',label:'NHL',path:'/nhl/odds',desc:'Puck lines, totals, moneylines',page:'/nhl.html'},
];

const BASE = 'https://propsports-api.sales-fd3.workers.dev';

// ── GLOBAL SEARCH MODAL ───────────────────────────────────────────────────
function openSearch() {
  const bg = document.getElementById('search-modal-bg');
  if (!bg) return;
  bg.classList.add('open');
  setTimeout(() => {
    const inp = document.getElementById('global-search-input');
    if (inp) inp.focus();
  }, 50);
}
function closeSearch() {
  const bg = document.getElementById('search-modal-bg');
  if (bg) bg.classList.remove('open');
}

function renderSearchResults(query) {
  const list = document.getElementById('search-results-list');
  if (!list) return;
  const q = query.toLowerCase().trim();
  if (!q) {
    list.innerHTML = '<div class="search-empty">Type to search all 31 endpoints…</div>';
    return;
  }
  const results = ALL_ENDPOINTS.filter(ep =>
    ep.path.toLowerCase().includes(q) ||
    ep.desc.toLowerCase().includes(q) ||
    ep.label.toLowerCase().includes(q)
  );
  if (!results.length) {
    list.innerHTML = '<div class="search-empty">No endpoints found for "' + query + '"</div>';
    return;
  }
  list.innerHTML = results.map(ep => {
    const hi = s => s.replace(new RegExp('(' + q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&') + ')', 'gi'), '<mark>$1</mark>');
    return `<a href="${ep.page}" class="search-result-item">
      <span class="sr-sport">${ep.sport}</span>
      <span class="sr-badge">GET</span>
      <span class="sr-path">${hi(ep.path)}</span>
      <span class="sr-desc">${ep.desc}</span>
    </a>`;
  }).join('');
}

// ── MOBILE MENU ───────────────────────────────────────────────────────────
function toggleMenu() {
  const menu = document.getElementById('mobile-menu');
  const ham = document.getElementById('hamburger');
  if (!menu) return;
  const open = menu.style.display === 'flex';
  menu.style.display = open ? 'none' : 'flex';
  if (ham) {
    ham.children[0].style.transform = open ? '' : 'rotate(45deg) translate(4px,4px)';
    ham.children[1].style.opacity = open ? '1' : '0';
    ham.children[2].style.transform = open ? '' : 'rotate(-45deg) translate(4px,-4px)';
  }
}

// ── ANIMATED BALLS ────────────────────────────────────────────────────────
function initBalls() {
  const container = document.getElementById('balls-bg');
  if (!container) return;
  const types = ['baseball','basketball','basketball','baseball','soccer','hockey'];
  const count = window.innerWidth < 600 ? 7 : 15;
  for (let i = 0; i < count; i++) {
    const ball = document.createElement('div');
    const type = types[i % types.length];
    const size = type === 'hockey' ? (12 + Math.random() * 20) : (24 + Math.random() * 70);
    const dur = 14 + Math.random() * 22;
    const delay = -(Math.random() * dur);
    ball.className = 'ball ball-' + type;
    ball.style.cssText = [
      'width:' + size + 'px',
      'height:' + (type === 'hockey' ? Math.round(size * 0.38) : size) + 'px',
      'left:' + (Math.random() * 100) + '%',
      'animation-duration:' + dur + 's',
      'animation-delay:' + delay + 's',
      'opacity:' + (0.04 + Math.random() * 0.07),
    ].join(';');
    container.appendChild(ball);
  }
}

// ── INLINE ENDPOINT SEARCH ────────────────────────────────────────────────
function initEpSearch() {
  const inp = document.getElementById('ep-search');
  const countEl = document.getElementById('ep-count');
  if (!inp) return;
  inp.addEventListener('input', () => {
    const q = inp.value.toLowerCase().trim();
    const cards = document.querySelectorAll('.ep-card[data-path]');
    let visible = 0;
    cards.forEach(card => {
      const path = (card.dataset.path || '').toLowerCase();
      const desc = (card.dataset.desc || '').toLowerCase();
      const hit = !q || path.includes(q) || desc.includes(q);
      card.classList.toggle('hidden', !hit);
      if (hit) {
        visible++;
        // Highlight matching text
        const pathEl = card.querySelector('.ep-path');
        const descEl = card.querySelector('.ep-desc');
        if (q && pathEl) pathEl.innerHTML = highlightMatch(card.dataset.path, q);
        else if (pathEl) pathEl.textContent = card.dataset.path;
        if (q && descEl) descEl.innerHTML = highlightMatch(card.dataset.desc, q);
        else if (descEl) descEl.textContent = card.dataset.desc;
      }
    });
    if (countEl) countEl.textContent = visible + ' endpoints';
  });
}

function highlightMatch(text, q) {
  if (!q) return text;
  return text.replace(new RegExp('(' + q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&') + ')', 'gi'), '<mark>$1</mark>');
}

// ── SPORT TAB SWITCHER ────────────────────────────────────────────────────
function showSport(sport, btn) {
  document.querySelectorAll('[data-sport-panel]').forEach(p => {
    p.style.display = p.dataset.sportPanel === sport ? 'grid' : 'none';
  });
  document.querySelectorAll('[data-sport-tab]').forEach(b => b.classList.remove('on'));
  btn.classList.add('on');
}

// ── PREVIEW TABS ──────────────────────────────────────────────────────────
function showPreview(name, btn) {
  document.querySelectorAll('.prev-panel').forEach(p => p.classList.remove('on'));
  document.querySelectorAll('.prev-tab').forEach(b => b.classList.remove('on'));
  const panel = document.getElementById('prev-' + name);
  if (panel) panel.classList.add('on');
  btn.classList.add('on');
}

// ── SCROLL FADE UP ────────────────────────────────────────────────────────
function initScrollFu() {
  const els = document.querySelectorAll('.scroll-fu');
  if (!els.length) return;
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); }
    });
  }, { threshold: 0.08 });
  els.forEach(el => obs.observe(el));
}

// ── KEYBOARD SHORTCUTS ────────────────────────────────────────────────────
document.addEventListener('keydown', e => {
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); openSearch(); }
  if (e.key === 'Escape') closeSearch();
});

// ── INIT ──────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initBalls();
  initScrollFu();
  initEpSearch();

  // Search modal input
  const globalInp = document.getElementById('global-search-input');
  if (globalInp) {
    globalInp.addEventListener('input', () => renderSearchResults(globalInp.value));
    renderSearchResults('');
  }

  // Close search on bg click
  const bg = document.getElementById('search-modal-bg');
  if (bg) bg.addEventListener('click', e => { if (e.target === bg) closeSearch(); });
});
