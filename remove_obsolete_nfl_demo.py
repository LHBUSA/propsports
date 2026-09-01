#!/usr/bin/env python3
"""Remove the obsolete static NFL terminal demo now that the interactive sandbox is live.

Strict + idempotent. The football hero image, interactive sandbox, checkout wiring,
and endpoint catalog stay intact. Only the old worker-terminal preview is removed.
"""
from pathlib import Path

PAGE = Path("nfl.html")
html = PAGE.read_text(encoding="utf-8")

legacy_probe = '// GET /nfl/odds'
legacy_shell = '<div class="code-shell">'
endpoint_heading = '<div class="eyebrow">NFL endpoints</div>'

removed = 0
while legacy_probe in html:
    probe_at = html.index(legacy_probe)
    shell_at = html.rfind(legacy_shell, 0, probe_at)
    heading_at = html.find(endpoint_heading, probe_at)
    if shell_at < 0:
        raise SystemExit("ERROR: found legacy NFL odds preview without its code-shell wrapper")
    if heading_at < 0:
        raise SystemExit("ERROR: found legacy NFL odds preview without the following NFL endpoint catalog")

    # Keep the endpoint catalog's outer column div. Remove only the obsolete code-shell.
    catalog_col_at = html.rfind('<div>', probe_at, heading_at)
    if catalog_col_at < shell_at:
        # Current markup uses an indented plain div directly before the eyebrow heading.
        catalog_col_at = html.rfind('    <div>', probe_at, heading_at)
    if catalog_col_at < shell_at:
        raise SystemExit("ERROR: could not resolve the endpoint catalog column boundary")

    html = html[:shell_at] + html[catalog_col_at:]
    removed += 1

# Convert the now-single-column endpoint section to a full-width supporting catalog.
html = html.replace(
    '<div class="wrap endpoint-grid">\n    <div>\n      <div class="eyebrow">NFL endpoints</div>',
    '<div class="wrap endpoint-grid endpoint-grid-single">\n    <div>\n      <div class="eyebrow">NFL endpoints</div>',
    1,
)

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
if legacy_probe in html:
    raise SystemExit("ERROR: legacy terminal demo still present")
if 'propsports-api.sales-fd3.workers.dev</span><span>200 OK' in html:
    raise SystemExit("ERROR: legacy worker terminal chrome still present")
if html.count('id="sandbox"') != 1:
    raise SystemExit(f'ERROR: expected exactly one interactive sandbox, found {html.count("id=\"sandbox\"")}')
if endpoint_heading not in html:
    raise SystemExit("ERROR: endpoint catalog was accidentally removed")

PAGE.write_text(html, encoding="utf-8")
print(f"PASS: removed {removed} obsolete NFL terminal demo block(s); interactive sandbox retained.")
