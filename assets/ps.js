/* PropSports shared runtime: navigation, checkout, API console. Depends on ps-config.js. */
(function () {
  var C = window.PS_CONFIG;

  /* ── Navigation ─────────────────────────────────────── */
  function closeMenus(except) {
    document.querySelectorAll('.dd.open').forEach(function (d) {
      if (d !== except) { d.classList.remove('open'); d.querySelector('button').setAttribute('aria-expanded', 'false'); }
    });
  }
  document.querySelectorAll('.dd > button').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var dd = btn.parentNode, open = !dd.classList.contains('open');
      closeMenus(dd);
      dd.classList.toggle('open', open);
      btn.setAttribute('aria-expanded', String(open));
    });
  });
  document.addEventListener('click', function (e) { if (!e.target.closest('.dd')) closeMenus(); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { closeMenus(); document.body.classList.remove('nav-open'); }
  });
  var burger = document.querySelector('.nav-burger');
  if (burger) {
    burger.addEventListener('click', function () {
      var open = !document.body.classList.contains('nav-open');
      document.body.classList.toggle('nav-open', open);
      burger.setAttribute('aria-expanded', String(open));
    });
    document.querySelectorAll('.drawer a').forEach(function (a) {
      a.addEventListener('click', function () { document.body.classList.remove('nav-open'); });
    });
  }

  /* ── Checkout (billing Worker /create-checkout is authoritative) ── */
  function doCheckout(tier, el, extra) {
    tier = tier || 'ALL_SPORTS';
    var priceId = C.PRICE_IDS[tier];
    if (!priceId) {
      alert('Checkout is not configured for ' + tier + '. Email sales@proptechusa.ai or call 1-888-784-3881.');
      return;
    }
    var btn = el || (window.event && window.event.currentTarget) || null;
    var label = btn ? btn.textContent : '';
    if (btn) { btn.setAttribute('aria-busy', 'true'); btn.textContent = 'Loading…'; }
    var body = { tier: tier, priceId: priceId, successUrl: location.origin + '/docs?checkout=success', cancelUrl: location.href };
    if (extra && extra.selectedSports) body.selectedSports = extra.selectedSports;
    fetch(C.CHECKOUT_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (data) {
        var url = data.url || data.checkoutUrl || data.sessionUrl;
        if (!res.ok || !url) throw new Error(data.error || data.message || 'Checkout failed');
        location.href = url;
      });
    }).catch(function (err) {
      alert((err && err.message ? err.message : 'Checkout failed') + ' — email sales@proptechusa.ai or call 1-888-784-3881.');
      if (btn) { btn.removeAttribute('aria-busy'); btn.textContent = label; }
    });
  }
  window.doCheckout = doCheckout;

  /* Developer plan: 1–3 distinct sports, lowercase canonical IDs */
  var devSelects = Array.prototype.slice.call(document.querySelectorAll('[data-dev-sport]'));
  var devError = document.getElementById('dev-error');
  function developerSports() {
    var seen = {}, out = [];
    devSelects.forEach(function (sel) { var v = sel.value; if (v && !seen[v]) { seen[v] = 1; out.push(v); } });
    return out.slice(0, C.DEVELOPER_MAX_SPORTS);
  }
  function syncDeveloper() {
    var chosen = devSelects.map(function (s) { return s.value; });
    devSelects.forEach(function (sel, i) {
      Array.prototype.forEach.call(sel.options, function (opt) {
        opt.disabled = !!opt.value && chosen.some(function (v, j) { return j !== i && v === opt.value; });
      });
    });
    if (devError && developerSports().length) { devError.hidden = true; devSelects[0].removeAttribute('aria-invalid'); }
  }
  devSelects.forEach(function (sel) { sel.addEventListener('change', syncDeveloper); });
  window.psDeveloperSports = developerSports;

  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-checkout]');
    if (!t) return;
    e.preventDefault();
    var tier = t.getAttribute('data-checkout');
    if (tier === 'single') {
      var sel = document.getElementById(t.getAttribute('data-select'));
      tier = sel ? sel.value : 'MLB';
      return doCheckout(tier, t);
    }
    if (tier === 'developer') {
      var sports = developerSports();
      if (!sports.length) {
        if (devError) { devError.hidden = false; }
        if (devSelects[0]) { devSelects[0].setAttribute('aria-invalid', 'true'); devSelects[0].focus(); }
        return;
      }
      return doCheckout('DEVELOPER', t, { selectedSports: sports });
    }
    doCheckout(tier, t);
  });

  /* ── Copy ───────────────────────────────────────────── */
  function copy(text, btn) {
    var done = function () { if (!btn) return; var o = btn.textContent; btn.textContent = 'Copied'; setTimeout(function () { btn.textContent = o; }, 1400); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, function () {});
    else { var ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); done(); } catch (e) {} ta.remove(); }
  }

  /* ── JSON highlighting ──────────────────────────────── */
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function highlight(json) {
    return esc(json).replace(/("(?:\\.|[^"\\])*")(\s*:)?|\b(true|false)\b|\bnull\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/g, function (m, str, colon, bool) {
      if (str) return colon ? '<span class="j-k">' + str + '</span>' + colon : '<span class="j-s">' + str + '</span>';
      if (bool) return '<span class="j-b">' + m + '</span>';
      if (m === 'null') return '<span class="j-z">null</span>';
      return '<span class="j-n">' + m + '</span>';
    });
  }

  /* ── API console ────────────────────────────────────── */
  var examplesPromise = null;
  function loadExamples() {
    if (!examplesPromise) examplesPromise = fetch('/assets/api-examples.json').then(function (r) { return r.json(); }).catch(function () { return null; });
    return examplesPromise;
  }
  function routeInfo(path) {
    var bare = path.split('?')[0], hit = null, groups = [];
    Object.keys(C.ROUTES).forEach(function (s) { groups = groups.concat(C.ROUTES[s]); });
    groups = groups.concat(C.UFC_ROUTES);
    groups.forEach(function (g) { g[1].forEach(function (r) { if (r[0] === bare) hit = r; }); });
    return hit;
  }
  function initConsole(root) {
    var tabs = root.querySelectorAll('[data-ex]');
    var pathEl = root.querySelector('.con-path'), descEl = root.querySelector('.con-desc'), statusEl = root.querySelector('.con-status'), bodyEl = root.querySelector('.con-body');
    var runBtn = root.querySelector('[data-act="run"]'), copyBtn = root.querySelector('[data-act="copy"]'), copyJson = root.querySelector('[data-act="json"]');
    var current = null;
    function show(id) {
      loadExamples().then(function (data) {
        var ex = data && data.examples && data.examples[id];
        tabs.forEach(function (t) { t.setAttribute('aria-selected', String(t.getAttribute('data-ex') === id)); });
        if (!ex) { bodyEl.textContent = 'Example unavailable.'; return; }
        current = ex;
        var info = routeInfo(ex.path);
        pathEl.innerHTML = '<span class="host">' + esc(ex.host.replace('https://', '')) + '</span>' + esc(ex.path);
        descEl.innerHTML = info ? esc(info[1]) + ' · <code>' + (info[2] === 'pub' ? 'public, no key' : info[2] === 'demo' ? 'demo key accepted' : 'API key required') + '</code>' : '';
        var ok = ex.status >= 200 && ex.status < 300;
        var trimmed = ex.trims && ex.trims.length ? ' · arrays trimmed for display' : '';
        statusEl.innerHTML = '<span class="code' + (ok ? '' : ' err') + '">' + (ex.status || 'ERR') + '</span><span>' + ex.ms + ' ms</span><span>captured ' + esc(String(data.captured_at).slice(0, 10)) + trimmed + '</span>';
        bodyEl.innerHTML = ex.body == null ? esc(ex.error || 'No body') : highlight(JSON.stringify(ex.body, null, 2));
        bodyEl.scrollTop = 0;
        if (runBtn) runBtn.hidden = !(info && info[2] === 'pub');
      });
    }
    tabs.forEach(function (t) { t.addEventListener('click', function () { show(t.getAttribute('data-ex')); }); });
    if (copyBtn) copyBtn.addEventListener('click', function () {
      if (!current) return;
      var info = routeInfo(current.path);
      var keyed = !(info && info[2] === 'pub');
      copy('curl ' + (keyed ? '-H "X-API-Key: $PROPSPORTS_KEY" ' : '') + '"' + current.url + '"', copyBtn);
    });
    if (copyJson) copyJson.addEventListener('click', function () { if (current && current.body) copy(JSON.stringify(current.body, null, 2), copyJson); });
    if (runBtn) runBtn.addEventListener('click', function () {
      if (!current) return;
      var t0 = performance.now();
      runBtn.textContent = 'Running…';
      fetch(current.url, { headers: { Accept: 'application/json' } }).then(function (r) {
        return r.json().then(function (j) { return { s: r.status, j: j }; });
      }).then(function (res) {
        var ms = Math.round(performance.now() - t0), ok = res.s >= 200 && res.s < 300;
        statusEl.innerHTML = '<span class="code' + (ok ? '' : ' err') + '">' + res.s + '</span><span>' + ms + ' ms</span><span>live response · full body</span>';
        bodyEl.innerHTML = highlight(JSON.stringify(res.j, null, 2));
      }).catch(function (e) {
        statusEl.innerHTML = '<span class="code err">ERR</span><span>' + esc(e.message) + '</span>';
      }).then(function () { runBtn.textContent = 'Run live'; });
    });
    var first = root.getAttribute('data-first') || (tabs[0] && tabs[0].getAttribute('data-ex'));
    var start = function () { show(first); };
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (en) { if (en[0].isIntersecting) { io.disconnect(); start(); } }, { rootMargin: '400px' });
      io.observe(root);
    } else start();
  }
  document.querySelectorAll('[data-console]').forEach(initConsole);

  /* ── Catalog endpoint count: the live API is the source of truth ── */
  var countEls = document.querySelectorAll('[data-ps-endpoints]');
  if (countEls.length) {
    fetch(C.API_BASE + '/health', { headers: { Accept: 'application/json' } }).then(function (r) { return r.json(); }).then(function (j) {
      var n = j && Number(j.endpoints);
      if (n > 0) countEls.forEach(function (el) { el.textContent = n.toLocaleString('en-US'); });
    }).catch(function () {});
  }

  /* ── Single-sport plan: route count follows the chosen sport ── */
  var single = document.getElementById('single-sport');
  var singleCount = document.querySelector('[data-single-count]');
  if (single && singleCount) {
    var sync = function () {
      var id = single.value.toLowerCase(), sport = C.SPORTS.filter(function (s) { return s.id === id; })[0];
      if (sport) singleCount.textContent = C.COUNTS.PER_SPORT[id] + ' ' + sport.name + ' routes';
    };
    single.addEventListener('change', sync);
    sync();
  }
})();
