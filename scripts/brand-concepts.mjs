// Renders the three brand-mark concepts at real sizes for review (not a production asset).
// Usage: node scripts/brand-concepts.mjs <outHtml>
import { writeFileSync } from 'node:fs';

const RED = '#D5381C', INK = '#12151B';
// 64-unit grid. Every counter/gap is >= 6 units so it survives at 16px (1.5px).
export const CONCEPTS = {
  A: { name: 'P-signal', glyph: '<path fill-rule="evenodd" d="M15 10h24c10.5 0 17 7 17 16.5S49.5 43 39 43h-12v11H15z M27 20v13l11-6.5z"/>' },
  B: { name: 'Score rails', glyph: '<path d="M14 54 L20 10 H31 L25 54 Z"/><path d="M33 40 L37 10 H50 L46 40 Z"/>' },
  C: { name: 'Lane S', glyph: '<path d="M14 11h24v10H24v6h26v26H14V43h26v-6H14z"/><circle cx="48" cy="16" r="6"/>' },
  A2a: { name: 'P-lane + live node', glyph: '<path fill-rule="evenodd" d="M12 10h25c10 0 16 6.2 16 15.5S47 41 37 41H25v13H12z M25 20v10h12a5 5 0 0 0 0-10z"/><rect x="41" y="44" width="11" height="10" rx="2"/>' },
  A2b: { name: 'P-lane italic + node', glyph: '<g transform="skewX(-9) translate(7 0)"><path fill-rule="evenodd" d="M12 10h25c10 0 16 6.2 16 15.5S47 41 37 41H25v13H12z M25 20v10h12a5 5 0 0 0 0-10z"/><rect x="41" y="44" width="11" height="10" rx="2"/></g>' },
  A2c: { name: 'P-lane italic, open lane', glyph: '<g transform="skewX(-9) translate(7 0)"><path fill-rule="evenodd" d="M12 10h25c10 0 16 6.2 16 15.5S47 41 37 41H25v13H12z M25 20v10h20v-10z"/><rect x="41" y="44" width="11" height="10" rx="2"/></g>' }
};
const tile = (glyph, bg, fg, r = 14) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="${r}" fill="${bg}"/><g fill="${fg}">${glyph}</g></svg>`;
const bare = (glyph, fg) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><g fill="${fg}">${glyph}</g></svg>`;
const uri = (svg) => 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);

if (process.argv[2]) {
  const sizes = [16, 32, 64, 180];
  const rows = Object.entries(CONCEPTS).map(([k, c]) => {
    const variants = [
      ['red tile', tile(c.glyph, RED, '#fff'), '#fff'],
      ['ink tile', tile(c.glyph, INK, RED), '#fff'],
      ['red on white', bare(c.glyph, RED), '#fff'],
      ['white on dark', bare(c.glyph, '#fff'), '#07090C']
    ];
    return `<section><h2>${k} — ${c.name}</h2>${variants.map(([label, svg, bg]) => `
      <div class="row" style="background:${bg}"><span style="color:${bg === '#fff' ? '#333' : '#aaa'}">${label}</span>${sizes.map((s) => `<img src="${uri(svg)}" width="${s}" height="${s}">`).join('')}</div>`).join('')}</section>`;
  }).join('');
  writeFileSync(process.argv[2], `<!doctype html><meta charset="utf-8"><style>body{margin:0;font:600 13px system-ui;background:#F5F3EE}section{padding:10px 16px}h2{margin:6px 0;font:700 15px system-ui}.row{display:flex;align-items:center;gap:22px;padding:10px 14px;border:1px solid #ddd}.row span{width:110px}</style>${rows}`);
  console.log('wrote', process.argv[2]);
}
