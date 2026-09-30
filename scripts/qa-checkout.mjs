// Opens (but never pays) a Stripe Checkout session for every forward-facing plan, exactly as the site does.
// Usage: node scripts/qa-checkout.mjs
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import vm from 'node:vm';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const ctx = {};
vm.runInNewContext(readFileSync(join(root, 'assets/ps-config.js'), 'utf8'), { globalThis: ctx, window: undefined });
const C = ctx.PS_CONFIG;
const base = { successUrl: C.SITE + '/docs?checkout=success', cancelUrl: C.SITE + '/pricing' };
const cases = [
  ...['MLB', 'NFL', 'NBA', 'WNBA', 'NHL', 'TENNIS', 'SOCCER'].map((t) => ({ label: `Single Sport · ${t}`, body: { tier: t, priceId: C.PRICE_IDS[t] } })),
  { label: 'Developer · 1 sport', body: { tier: 'DEVELOPER', priceId: C.PRICE_IDS.DEVELOPER, selectedSports: ['mlb'] } },
  { label: 'Developer · 2 sports', body: { tier: 'DEVELOPER', priceId: C.PRICE_IDS.DEVELOPER, selectedSports: ['mlb', 'nba'] } },
  { label: 'Developer · 3 sports', body: { tier: 'DEVELOPER', priceId: C.PRICE_IDS.DEVELOPER, selectedSports: ['mlb', 'nba', 'tennis'] } },
  ...['ALL_SPORTS', 'PRO', 'SCALE', 'ENTERPRISE'].map((t) => ({ label: t, body: { tier: t, priceId: C.PRICE_IDS[t] } }))
];
let bad = 0;
const health = await fetch(C.CHECKOUT_URL.replace('/create-checkout', '/health')).then((r) => r.json()).catch(() => null);
console.log('billing health:', health && JSON.stringify({ service: health.service, catalog: health.catalog, currentPriceCount: health.currentPriceCount, acceptedPriceCount: health.acceptedPriceCount }));
for (const c of cases) {
  const res = await fetch(C.CHECKOUT_URL, { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: C.SITE }, body: JSON.stringify({ ...c.body, ...base }) });
  const data = await res.json().catch(() => ({}));
  const url = data.url || data.checkoutUrl || data.sessionUrl || '';
  const ok = res.ok && /^https:\/\/checkout\.stripe\.com\//.test(url);
  if (!ok) bad++;
  console.log(`${ok ? 'ok ' : 'BAD'} ${c.label.padEnd(24)} ${c.body.priceId}  → ${res.status} ${ok ? url.slice(0, 60) + '…' : JSON.stringify(data).slice(0, 160)}`);
}
// A legacy price must not be purchasable as a NEW checkout from the website's point of view: the site never sends one.
const legacy = await fetch(C.CHECKOUT_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tier: 'BASIC', priceId: 'price_1TgVGEF3CaVzg4ORwIgccsLq', ...base }) });
console.log(`info legacy BASIC price → ${legacy.status} (the website no longer sends legacy prices)`);
process.exit(bad ? 1 : 0);
