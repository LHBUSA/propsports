#!/usr/bin/env python3
"""Remove the obsolete static NFL terminal demo now that the interactive sandbox is live.

Strict + idempotent. The football hero image, interactive sandbox, checkout wiring,
and endpoint catalog stay intact. Only the old worker-terminal preview is removed.
"""
from pathlib import Path

PAGE = Path("nfl.html")
html = PAGE.read_text(encoding="utf-8")

legacy_chrome = 'propsports-api.sales-fd3.workers.dev</span><span>200 OK'
legacy_shell = '<div class="code-shell">'
catalog_wrapper = '    <div>\n      <div class="eyebrow">NFL endpoints</div>'
endpoint_heading = '<div class="eyebrow">NFL endpoints</div>'
section_marker = '<section id="endpoints" style="background:var(--off);border-top:1px solid var(--border);border-bottom:1px solid var(--border)">'

removed = 0
while legacy_chrome in html:
    chrome_at = html.index(legacy_chrome)
    shell_at = html.rfind(legacy_shell, 0, chrome_at)
    catalog_at = html.find(catalog_wrapper, chrome_at)
    if shell_at < 0:
        raise SystemExit("ERROR: found obsolete worker terminal chrome without its code-shell wrapper")
    if catalog_at < 0:
        # Be tolerant of indentation changes while still anchoring to the exact endpoint heading.
        heading_at = html.find(endpoint_heading, chrome_at)
        if heading_at < 0:
            raise SystemExit("ERROR: found obsolete worker terminal without the following NFL endpoint catalog")
        catalog_at = html.rfind('<div>', chrome_at, heading_at)
        if catalog_at < shell_at:
            raise SystemExit("ERROR: could not resolve NFL endpoint catalog wrapper")

    html = html[:shell_at] + html[catalog_at:]
    removed += 1

# The old section used two columns because the terminal sat beside the catalog.
# With the terminal gone, force the endpoint catalog to use the full content width.
section_at = html.find(section_marker)
if section_at < 0:
    raise SystemExit("ERROR: NFL endpoints section not found")
grid_marker = '<div class="wrap endpoint-grid">'
grid_at = html.find(grid_marker, section_at)
section_end = html.find('</section>', section_at)
if grid_at >= 0 and (section_end < 0 or grid_at < section_end):
    html = html[:grid_at] + '<div class="wrap endpoint-grid endpoint-grid-single">' + html[grid_at + len(grid_marker):]

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

if legacy_chrome in html:
    raise SystemExit("ERROR: obsolete NFL worker terminal is still present")
if html.count('id="sandbox"') != 1:
    raise SystemExit(f'ERROR: expected exactly one interactive sandbox, found {html.count("id=\"sandbox\"")}')
if endpoint_heading not in html:
    raise SystemExit("ERROR: endpoint catalog was accidentally removed")
if 'endpoint-grid endpoint-grid-single' not in html:
    raise SystemExit("ERROR: cleaned endpoint catalog is not full width")

PAGE.write_text(html, encoding="utf-8")
print(f"PASS: removed {removed} obsolete NFL worker-terminal block(s); interactive sandbox retained; endpoint catalog full width.")
