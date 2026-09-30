"""PropSports brand, social and media asset generator.

Usage:  python scripts/make-assets.py
Needs:  Pillow (with WebP/AVIF) and fontTools. Fonts in scripts/fonts are SIL OFL (Archivo, IBM Plex Sans).
Inputs: hero-sports-network.png (master, never modified) and the licensed media listed in assets/media/CREDITS.md.
"""
import os
import subprocess
from PIL import Image, ImageDraw, ImageFont
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
WORKERS = os.path.abspath(os.path.join(ROOT, '..'))
FONTS = os.path.join(ROOT, 'scripts', 'fonts')
RED = '#D73B1A'
INK = '#12151B'
CHROME = os.environ.get('CHROME', r'C:\Program Files\Google\Chrome\Application\chrome.exe')
# PropSports mark (2026-09-30): an italic "P" whose counter is a lane (scoreboard / data stream)
# plus a detached live node. Drawn on a 64-unit grid; every counter and gap >= 6 units so it holds at 16px.
MARK_GLYPH = ('<g transform="skewX(-9) translate(7 0)">'
              '<path fill-rule="evenodd" d="M12 10h25c10 0 16 6.2 16 15.5S47 41 37 41H25v13H12z M25 20v10h12a5 5 0 0 0 0-10z"/>'
              '<rect x="41" y="44" width="11" height="10" rx="2"/></g>')
out = lambda *p: os.path.join(ROOT, *p)


# ── brand mark ──────────────────────────────────────────
def mark_tile(bg=RED, fg='#FFFFFF', radius=14, inset=0):
    """Tile + glyph as SVG body on a 64 grid. inset shrinks the glyph for maskable/app icons."""
    k = (64 - 2 * inset) / 64
    glyph = f'<g transform="translate({inset} {inset}) scale({k:.4f})" fill="{fg}">{MARK_GLYPH}</g>'
    return f'<rect width="64" height="64" rx="{radius}" fill="{bg}"/>{glyph}'


def svg_doc(body, w=64, h=64, label='PropSports'):
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" role="img" aria-label="{label}">{body}</svg>\n'


# ── wordmark as outlines (Archivo Bold, skewed to match the mark, tightened) ──
def wordmark_path(text, font_file, cap_px, tracking=-0.035):
    font = TTFont(font_file)
    gs, cmap, hmtx = font.getGlyphSet(), font.getBestCmap(), font['hmtx']
    cap = font['OS/2'].sCapHeight or 700
    k = cap_px / cap
    x, d = 0.0, []
    for ch in text:
        g = cmap[ord(ch)]
        pen = SVGPathPen(gs)
        gs[g].draw(TransformPen(pen, (k, 0, 0, -k, x, cap_px)))
        d.append(pen.getCommands())
        x += hmtx[g][0] * k + cap_px * tracking
    return ' '.join(d), x


def logo_svg(word_color):
    path, width = wordmark_path('PropSports', os.path.join(FONTS, 'Archivo-700.ttf'), 22)
    tx, ty = 54, 13
    w = tx + width + 6
    body = (f'<g transform="translate(0 2) scale(0.75)">{mark_tile()}</g>'
            f'<g transform="translate({tx} {ty}) skewX(-9)"><path fill="{word_color}" d="{path}"/></g>')
    return svg_doc(body, round(w, 1), 52)


def write(path, data, mode='w'):
    with open(path, mode, **({} if 'b' in mode else {'encoding': 'utf-8'})) as f:
        f.write(data)


def chrome_raster(items, tmp):
    """Rasterize SVGs with Chrome (the same renderer browsers use for favicons).
    items: [(name, svg_text, width, height)] -> {name: PIL.Image RGBA}"""
    os.makedirs(tmp, exist_ok=True)
    y, placed, html = 0, [], []
    for name, svg, w, h in items:
        p = os.path.join(tmp, f'{name}.svg'); write(p, svg)
        html.append(f'<img src="{name}.svg" width="{w}" height="{h}" style="position:absolute;left:0;top:{y}px">')
        placed.append((name, 0, y, w, h)); y += h + 8
    page = os.path.join(tmp, 'sheet.html')
    write(page, '<!doctype html><html><body style="margin:0;background:transparent">' + ''.join(html) + '</body></html>')
    shot = os.path.join(tmp, 'sheet.png')
    subprocess.run([CHROME, '--headless=new', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=1',
                    '--default-background-color=00000000', f'--window-size=1400,{y + 20}', f'--screenshot={shot}',
                    'file:///' + page.replace('\\', '/')], check=True, capture_output=True, timeout=120)
    sheet = Image.open(shot).convert('RGBA')
    return {n: sheet.crop((x, yy, x + w, yy + h)) for n, x, yy, w, h in placed}


def brand():
    b = out('assets', 'brand')
    mark = svg_doc(mark_tile())
    write(os.path.join(b, 'propsports-mark.svg'), mark)
    write(os.path.join(b, 'propsports-mark-mono.svg'), svg_doc(f'<g fill="currentColor">{MARK_GLYPH}</g>'))
    write(os.path.join(b, 'favicon.svg'), mark)
    write(out('favicon.svg'), mark)  # root path kept for legacy references
    logo = logo_svg(INK); logo_w = logo_svg('#FFFFFF')
    write(os.path.join(b, 'propsports-logo.svg'), logo)
    write(os.path.join(b, 'propsports-logo-white.svg'), logo_w)
    apple = svg_doc(mark_tile(radius=0, inset=6))         # iOS masks the corners itself
    maskable = svg_doc(mark_tile(radius=0, inset=12))     # glyph inside the 80% safe zone
    tmp = os.path.join(os.environ.get('TEMP', '/tmp'), 'ps-brand-raster')
    lw = float(logo_w.split('viewBox="0 0 ')[1].split(' ')[0])
    r = chrome_raster([('m16', mark, 16, 16), ('m32', mark, 32, 32), ('m48', mark, 48, 48), ('m192', mark, 192, 192),
                       ('m512', mark, 512, 512), ('apple', apple, 180, 180), ('mask', maskable, 512, 512),
                       ('logo_w', logo_w, round(lw * 1.6), round(52 * 1.6))], tmp)
    r['m16'].save(os.path.join(b, 'favicon-16x16.png')); r['m32'].save(os.path.join(b, 'favicon-32x32.png'))
    r['m48'].save(os.path.join(b, 'favicon-48x48.png')); r['m192'].save(os.path.join(b, 'icon-192.png'))
    r['m512'].save(os.path.join(b, 'icon-512.png')); r['mask'].save(os.path.join(b, 'icon-maskable-512.png'))
    r['apple'].convert('RGB').save(os.path.join(b, 'apple-touch-icon.png'))
    r['m48'].save(out('favicon.ico'), sizes=[(16, 16), (32, 32), (48, 48)], append_images=[r['m16'], r['m32']])
    return r


# ── social card ─────────────────────────────────────────
def social(r):
    W, H = 1200, 630
    hero = Image.open(out('hero-sports-network.png')).convert('RGB')
    card = Image.new('RGB', (W, H), (6, 8, 12))
    hh = round(hero.height * W / hero.width)
    card.paste(hero.resize((W, hh), Image.LANCZOS), (0, 0))
    shade = Image.new('L', (W, H), 0)
    px = shade.load()
    for y in range(H):
        v = 0 if y < 230 else min(255, int((y - 230) / (H - 230) * 1.35 * 255))
        for x in range(W):
            h = max(0, 1 - x / 820) * 150
            px[x, y] = min(255, int(max(v, h)))
    card = Image.composite(Image.new('RGB', (W, H), (6, 8, 12)), card, shade)
    logo = r['logo_w']
    card.paste(logo, (70, 380), logo)
    d = ImageDraw.Draw(card)
    sub = ImageFont.truetype(os.path.join(FONTS, 'Archivo-700.ttf'), 30)
    line = ImageFont.truetype(os.path.join(FONTS, 'IBMPlexSans-600.ttf'), 21)
    d.text((76, 478), 'LIVE SPORTS DATA INFRASTRUCTURE', font=sub, fill='#FFFFFF')
    d.rectangle([76, 528, 76 + 40, 530], fill=RED)
    d.text((76, 544), 'MLB  ·  NFL  ·  NBA  ·  WNBA  ·  NHL  ·  TENNIS  ·  SOCCER', font=line, fill='#AEB7C3')
    card.save(out('assets', 'social', 'propsports-og.jpg'), 'JPEG', quality=86, optimize=True, progressive=True)


# ── hero derivatives (master PNG untouched) ─────────────
def hero():
    src = Image.open(out('hero-sports-network.png')).convert('RGB')
    src.save(out('assets', 'hero', 'hero-sports-network.webp'), 'WEBP', quality=84, method=6)
    src.save(out('assets', 'hero', 'hero-sports-network.avif'), 'AVIF', quality=68)
    mob = src.resize((1280, round(src.height * 1280 / src.width)), Image.LANCZOS)
    mob.save(out('assets', 'hero', 'hero-sports-network-mobile.webp'), 'WEBP', quality=82, method=6)
    mob.save(out('assets', 'hero', 'hero-sports-network-mobile.avif'), 'AVIF', quality=64)


# ── editorial media ─────────────────────────────────────
def fit(im, w, h, cx=0.5, cy=0.5):
    r = max(w / im.width, h / im.height)
    im = im.resize((round(im.width * r), round(im.height * r)), Image.LANCZOS)
    x = min(max(0, round(im.width * cx - w / 2)), im.width - w)
    y = min(max(0, round(im.height * cy - h / 2)), im.height - h)
    return im.crop((x, y, x + w, y + h))


def media():
    m = out('assets', 'media')
    hero = Image.open(out('hero-sports-network.png')).convert('RGB')
    panels = {'mlb': (0, 75, 285, 265), 'nfl': (215, 70, 515, 270), 'tennis': (1470, 90, 1755, 280), 'soccer': (1635, 95, 1920, 285)}
    for sid, box in panels.items():
        fit(hero.crop(box), 720, 480).save(os.path.join(m, f'sport-{sid}.webp'), 'WEBP', quality=80, method=6)
    ext = {
        'nba': ('nba-propbetedge/public/assets/nba/backdrops/nbacast-1920.webp', 0.5, 0.62),
        'wnba': ('nba-propbetedge/public/assets/nba/backdrops/today-1920.webp', 0.48, 0.6),
        'nhl': ('nhl-propbetedge/public/assets/nhl/backdrops/cast-1400.webp', 0.36, 0.45),
        'ufc': ('ufc-propbetedge/web/public/media/ufc-cage-bg-1600.webp', 0.42, 0.52),
    }
    for sid, (rel, cx, cy) in ext.items():
        fit(Image.open(os.path.join(WORKERS, rel)).convert('RGB'), 720, 480, cx, cy).save(os.path.join(m, f'sport-{sid}.webp'), 'WEBP', quality=80, method=6)
    wide = Image.open(os.path.join(WORKERS, 'nhl-propbetedge/public/assets/nhl/backdrops/lines-1400.webp')).convert('RGB')
    fit(wide, 1400, 612).save(os.path.join(m, 'editorial-nhl-lines.webp'), 'WEBP', quality=80, method=6)
    fit(wide, 900, 700, 0.5, 0.6).save(os.path.join(m, 'editorial-nhl-lines-m.webp'), 'WEBP', quality=80, method=6)
    court = Image.open(os.path.join(WORKERS, 'nba-propbetedge/public/assets/nba/backdrops/shotlab-1920.webp')).convert('RGB')
    fit(court, 960, 640, 0.42, 0.5).save(os.path.join(m, 'editorial-nba-court.webp'), 'WEBP', quality=80, method=6)


if __name__ == '__main__':
    for d in ('brand', 'social', 'hero', 'media'):
        os.makedirs(out('assets', d), exist_ok=True)
    r = brand(); social(r); hero(); media()
    for d in ('brand', 'social', 'hero', 'media'):
        for f in sorted(os.listdir(out('assets', d))):
            p = out('assets', d, f)
            print(f'{d}/{f}  {os.path.getsize(p):,} B')
