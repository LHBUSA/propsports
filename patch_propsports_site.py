#!/usr/bin/env python3
"""
Patches C:\Workers\propsports-site\index.html directly.
Run from anywhere.
"""
import os, shutil
from datetime import datetime

INDEX = r"C:\Workers\propsports-site\index.html"
if not os.path.exists(INDEX):
    print(f"ERROR: {INDEX} not found"); exit(1)

backup = INDEX + f".bak_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
shutil.copy2(INDEX, backup)

with open(INDEX, 'r', encoding='utf-8') as f:
    src = f.read()
print(f"Loaded: {len(src):,} chars")

# ── Ticker ────────────────────────────────────────────────────────────────────
src = src.replace(
    '<span class="tk-item"><span class="sport">31 ENDPOINTS</span>MLB &middot; NFL &middot; NBA &middot; NHL</span>',
    '<span class="tk-item"><span class="tk-dot"></span><span class="sport">31 ENDPOINTS</span>MLB &middot; NFL &middot; NBA &middot; NHL &middot; OWNED STATCAST</span>'
)
src = src.replace(
    '/mlb/statcast/batters &rarr; avgEV &middot; barrel% &middot; hardHitPct',
    '/mlb/statcast/batters &rarr; avgEV &middot; barrel% &middot; xwOBA &middot; HR streak &middot; L7 HR'
)

# ── Feature card 01 ───────────────────────────────────────────────────────────
src = src.replace(
    '<div class="fc-title">Official Sources Only</div><div class="fc-body">MLB Stats API, NHL Stats API, NBA Stats API, ESPN, and Baseball Savant Statcast. The exact same data ESPN, The Athletic, and FanGraphs use. We just wrap it cleanly and cheaply.</div>',
    '<div class="fc-title">Owned Statcast Data</div><div class="fc-body">We don\'t rent statcast data &mdash; we own it. Our Cloudflare pipeline scrapes FanGraphs + MLB Stats API into our own Supabase tables. 131 batters, 129 pitchers, refreshed 4x daily. No blocked requests. No outages.</div>'
)

# ── What This Actually Is copy ────────────────────────────────────────────────
src = src.replace(
    'Official league APIs only &mdash; no scraping, no stale data, no made-up numbers.',
    'Statcast data is owned &mdash; our pipeline writes to Supabase tables we control, refreshed 4x daily. Everything else from official league APIs.'
)

# ── Statcast panel header ─────────────────────────────────────────────────────
src = src.replace(
    '<span>STATCAST &mdash; LIVE FROM BASEBALL SAVANT</span><span class="sp-feature-badge">EXCLUSIVE</span>',
    '<span>STATCAST &mdash; OWNED INFRASTRUCTURE</span><span class="sp-feature-badge">OWNED DATA</span>'
)
src = src.replace(
    '// Loading Statcast data from Baseball Savant...',
    '// Loading Statcast data from owned Supabase tables...'
)

# ── Statcast endpoint descriptions ────────────────────────────────────────────
src = src.replace(
    '<div class="sp-desc">Exit velo, barrel%, hardHit%, avgLA &mdash; MLB/AAA/AA</div>',
    '<div class="sp-desc">Exit velo, barrel%, hardHit%, xwOBA, HR streak, L7 HR, LHP/RHP splits &mdash; owned data, 4x daily</div>'
)
src = src.replace(
    '<div class="sp-desc">SwStr%, velo, EV allowed, barrel rate</div>',
    '<div class="sp-desc">EV allowed, hard hit%, barrel rate, pitch mix, velo &mdash; owned data, 4x daily</div>'
)

# ── Inject owned data section before SPORT DEEP DIVE ─────────────────────────
OWNED = '''
<!-- OWNED DATA INFRASTRUCTURE -->
<section class="section" style="background:var(--ink);color:#fff;position:relative;overflow:hidden;">
  <div style="position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,0.015) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.015) 1px,transparent 1px);background-size:48px 48px;pointer-events:none;"></div>
  <div class="wrap" style="position:relative;z-index:1;">
    <div style="font:700 10px var(--mono);letter-spacing:0.15em;text-transform:uppercase;color:var(--red);margin-bottom:10px;">Data Infrastructure</div>
    <h2 style="color:#fff;margin-bottom:12px;">We own the data.<br><em style="font-family:var(--serif);font-style:italic;">Like PropData owns parcels.</em></h2>
    <p style="font-size:16px;color:rgba(255,255,255,0.45);max-width:560px;line-height:1.75;margin-bottom:40px;">Most sports APIs are just wrappers around other people&rsquo;s data. We built our own statcast pipeline &mdash; scraping FanGraphs + MLB Stats API, normalizing everything, and upserting into Supabase tables we own and control. Runs 4x daily on Cloudflare. Zero external dependencies on anything that blocks.</p>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:1px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.06);border-radius:16px;overflow:hidden;margin-bottom:40px;">
      <div style="background:var(--ink2);padding:28px 24px;">
        <div style="font:800 42px var(--display);letter-spacing:-1px;color:#fff;line-height:1;">131</div>
        <div style="font:700 9px var(--mono);letter-spacing:0.12em;text-transform:uppercase;color:rgba(255,255,255,0.3);margin-top:4px;">MLB Batters Owned</div>
        <div style="font-size:12px;color:rgba(255,255,255,0.25);margin-top:8px;line-height:1.6;">EV, barrel%, xwOBA, sprint speed, HR streak, L7 HR, platoon splits</div>
      </div>
      <div style="background:var(--ink2);padding:28px 24px;">
        <div style="font:800 42px var(--display);letter-spacing:-1px;color:#fff;line-height:1;">129</div>
        <div style="font:700 9px var(--mono);letter-spacing:0.12em;text-transform:uppercase;color:rgba(255,255,255,0.3);margin-top:4px;">MLB Pitchers Owned</div>
        <div style="font-size:12px;color:rgba(255,255,255,0.25);margin-top:8px;line-height:1.6;">EV allowed, hard hit%, barrel rate, pitch mix, velocity, PA/HR</div>
      </div>
      <div style="background:var(--ink2);padding:28px 24px;">
        <div style="font:800 42px var(--display);letter-spacing:-1px;color:var(--red);line-height:1;">4x</div>
        <div style="font:700 9px var(--mono);letter-spacing:0.12em;text-transform:uppercase;color:rgba(255,255,255,0.3);margin-top:4px;">Daily Refresh</div>
        <div style="font-size:12px;color:rgba(255,255,255,0.25);margin-top:8px;line-height:1.6;">2am, 8am, 2pm, 8pm ET via Cloudflare cron. Always fresh for game time.</div>
      </div>
      <div style="background:var(--ink2);padding:28px 24px;">
        <div style="font:800 42px var(--display);letter-spacing:-1px;color:#fff;line-height:1;">0</div>
        <div style="font:700 9px var(--mono);letter-spacing:0.12em;text-transform:uppercase;color:rgba(255,255,255,0.3);margin-top:4px;">External Dependencies</div>
        <div style="font-size:12px;color:rgba(255,255,255,0.25);margin-top:8px;line-height:1.6;">No Baseball Savant. No blocked requests. No outages. Our pipe, our data.</div>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;">
      <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:12px;padding:20px 22px;">
        <div style="font:700 10px var(--mono);letter-spacing:0.12em;text-transform:uppercase;color:var(--red);margin-bottom:14px;">Batter Fields We Own</div>
        <div style="display:flex;flex-direction:column;gap:7px;">
          <div style="display:flex;justify-content:space-between;font:400 12px var(--mono);color:rgba(255,255,255,0.5);border-bottom:1px solid rgba(255,255,255,0.04);padding-bottom:6px;"><span>avg_ev / max_ev</span><span style="color:rgba(255,255,255,0.25)">exit velocity</span></div>
          <div style="display:flex;justify-content:space-between;font:400 12px var(--mono);color:rgba(255,255,255,0.5);border-bottom:1px solid rgba(255,255,255,0.04);padding-bottom:6px;"><span>hard_hit_pct / barrel_pct</span><span style="color:rgba(255,255,255,0.25)">quality of contact</span></div>
          <div style="display:flex;justify-content:space-between;font:400 12px var(--mono);color:rgba(255,255,255,0.5);border-bottom:1px solid rgba(255,255,255,0.04);padding-bottom:6px;"><span>xwoba / xba / xslg</span><span style="color:rgba(255,255,255,0.25)">expected stats</span></div>
          <div style="display:flex;justify-content:space-between;font:400 12px var(--mono);color:rgba(255,255,255,0.5);border-bottom:1px solid rgba(255,255,255,0.04);padding-bottom:6px;"><span>l7_hr / l7_pa</span><span style="color:rgba(255,255,255,0.25)">rolling 7-day</span></div>
          <div style="display:flex;justify-content:space-between;font:400 12px var(--mono);color:rgba(255,255,255,0.5);border-bottom:1px solid rgba(255,255,255,0.04);padding-bottom:6px;"><span>hr_streak / last_hr_date</span><span style="color:rgba(255,255,255,0.25)">streak data</span></div>
          <div style="display:flex;justify-content:space-between;font:400 12px var(--mono);color:rgba(255,255,255,0.5);"><span>vs_rhp_hr / vs_lhp_hr</span><span style="color:rgba(255,255,255,0.25)">platoon splits</span></div>
        </div>
      </div>
      <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:12px;padding:20px 22px;">
        <div style="font:700 10px var(--mono);letter-spacing:0.12em;text-transform:uppercase;color:var(--red);margin-bottom:14px;">Pitcher Fields We Own</div>
        <div style="display:flex;flex-direction:column;gap:7px;">
          <div style="display:flex;justify-content:space-between;font:400 12px var(--mono);color:rgba(255,255,255,0.5);border-bottom:1px solid rgba(255,255,255,0.04);padding-bottom:6px;"><span>avg_ev_allowed / max_ev</span><span style="color:rgba(255,255,255,0.25)">contact quality</span></div>
          <div style="display:flex;justify-content:space-between;font:400 12px var(--mono);color:rgba(255,255,255,0.5);border-bottom:1px solid rgba(255,255,255,0.04);padding-bottom:6px;"><span>hard_hit_allowed / barrel_rate</span><span style="color:rgba(255,255,255,0.25)">damage allowed</span></div>
          <div style="display:flex;justify-content:space-between;font:400 12px var(--mono);color:rgba(255,255,255,0.5);border-bottom:1px solid rgba(255,255,255,0.04);padding-bottom:6px;"><span>avg_velo / recent_velo</span><span style="color:rgba(255,255,255,0.25)">velocity + fade</span></div>
          <div style="display:flex;justify-content:space-between;font:400 12px var(--mono);color:rgba(255,255,255,0.5);border-bottom:1px solid rgba(255,255,255,0.04);padding-bottom:6px;"><span>pitch_mix</span><span style="color:rgba(255,255,255,0.25)">% by pitch type</span></div>
          <div style="display:flex;justify-content:space-between;font:400 12px var(--mono);color:rgba(255,255,255,0.5);border-bottom:1px solid rgba(255,255,255,0.04);padding-bottom:6px;"><span>hrs_allowed / pa_per_hr</span><span style="color:rgba(255,255,255,0.25)">HR vulnerability</span></div>
          <div style="display:flex;justify-content:space-between;font:400 12px var(--mono);color:rgba(255,255,255,0.5);"><span>sample_size</span><span style="color:rgba(255,255,255,0.25)">balls in play</span></div>
        </div>
      </div>
    </div>
  </div>
</section>

'''

if '<!-- SPORT DEEP DIVE -->' in src:
    src = src.replace('<!-- SPORT DEEP DIVE -->', OWNED + '<!-- SPORT DEEP DIVE -->')
    print("Injected owned data section")
else:
    print("WARNING: Could not find SPORT DEEP DIVE comment - section not injected")

with open(INDEX, 'w', encoding='utf-8') as f:
    f.write(src)

print(f"Written: {len(src):,} chars")
print("Done. Run: npx vercel --prod")
