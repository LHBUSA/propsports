#!/usr/bin/env python3
"""Remove the obsolete static NFL terminal demo now that the interactive sandbox is live.

This is intentionally strict and idempotent. It preserves the football hero image,
the interactive sandbox, pricing, checkout wiring, and the full NFL endpoint catalog.
"""
from pathlib import Path

PAGE = Path("nfl.html")
html = PAGE.read_text(encoding="utf-8")

section_marker = '<section id="endpoints" style="background:var(--off);border-top:1px solid var(--border);border-bottom:1px solid var(--border)">'
if section_marker not in html:
    raise SystemExit("ERROR: NFL endpoints section not found")

section_start = html.index(section_marker)
section_end = html.index('</section>', section_start) + len('</section>')
section = html[section_start:section_end]

legacy_start = '    <div class="code-shell">'
next_column = '    <div>\n      <div class="eyebrow">NFL endpoints</div>'

if legacy_start in section:
    start = section.index(legacy_start)
    try:
        end = section.index(next_column, start)
    except ValueError as exc:
        raise SystemExit("ERROR: could not locate endpoint-copy column after legacy terminal demo") from exc
    section = section[:start] + section[end:]

# The old section was a 2-column demo + endpoint list. With the demo gone, make the
# endpoint catalog a deliberate full-width supporting section beneath the sandbox.
section = section.replace(
    '<div class="wrap endpoint-grid">',
    '<div class="wrap endpoint-grid endpoint-grid-single">',
    1,
)
html = html[:section_start] + section + html[section_end:]

catalog_css = '''
/* supporting endpoint catalog below the interactive sandbox */
.endpoint-grid.endpoint-grid-single{grid-template-columns:1fr;max-width:1040px}
.endpoint-grid-single .endpoint-list{grid-template-columns:repeat(2,minmax(0,1fr))}
@media(max-width:760px){.endpoint-grid-single .endpoint-list{grid-template-columns:1fr}}
'''
if '/* supporting endpoint catalog below the interactive sandbox */' not in html:
    css_anchor = '/* pricing */'
    if css_anchor not in html:
        raise SystemExit("ERROR: CSS insertion anchor not found")
    html = html.replace(css_anchor, catalog_css + '\n' + css_anchor, 1)

# Hard validation: exactly one real demo surface remains.
if '// GET /nfl/odds' in html:
    raise SystemExit("ERROR: legacy terminal demo still present")
if 'propsports-api.sales-fd3.workers.dev</span><span>200 OK' in html:
    raise SystemExit("ERROR: legacy worker terminal chrome still present")
if html.count('id="sandbox"') != 1:
    raise SystemExit(f'ERROR: expected exactly one interactive sandbox, found {html.count("id=\"sandbox\"")}')

PAGE.write_text(html, encoding="utf-8")
print("PASS: obsolete NFL terminal demo removed; interactive sandbox retained.")
