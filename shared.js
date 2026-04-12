// PropSports API — Shared JS

// Mobile menu toggle
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

// Animated sports balls background
function initBalls() {
  const container = document.getElementById('balls-bg');
  if (!container) return;
  const types = ['baseball','basketball','hockey'];
  const count = window.innerWidth < 600 ? 6 : 12;
  for (let i = 0; i < count; i++) {
    const ball = document.createElement('div');
    const type = types[i % types.length];
    const size = 20 + Math.random() * 60;
    ball.className = `ball ball-${type}`;
    ball.style.cssText = `
      width:${size}px;
      height:${type === 'hockey' ? Math.round(size*0.4)+'px' : size+'px'};
      left:${Math.random()*100}%;
      animation-duration:${12 + Math.random()*20}s;
      animation-delay:${Math.random()*-20}s;
      opacity:${0.03 + Math.random()*0.06};
    `;
    container.appendChild(ball);
  }
}

// Fade-up on scroll
function initFadeUp() {
  const els = document.querySelectorAll('.scroll-fu');
  if (!els.length) return;
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('fu');
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.1 });
  els.forEach(el => obs.observe(el));
}

// Sport tab switcher
function showSport(sport, btn) {
  document.querySelectorAll('[data-sport-panel]').forEach(p => {
    p.style.display = p.dataset.sportPanel === sport ? 'grid' : 'none';
  });
  document.querySelectorAll('[data-sport-tab]').forEach(b => b.classList.remove('on'));
  btn.classList.add('on');
}

document.addEventListener('DOMContentLoaded', () => {
  initBalls();
  initFadeUp();
});
