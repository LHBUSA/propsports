"""PropSports brand, social and media asset generator.

Usage:  python scripts/make-assets.py
Needs:  Pillow (with WebP/AVIF) and fontTools. Fonts in scripts/fonts are SIL OFL (Archivo, IBM Plex Sans).
Inputs: hero-sports-network.png (master, never modified) and the licensed media listed in assets/media/CREDITS.md.
"""
import os
from PIL import Image, ImageDraw, ImageFont
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
WORKERS = os.path.abspath(os.path.join(ROOT, '..'))
FONTS = os.path.join(ROOT, 'scripts', 'fonts')
RED = '#D73B1A'
INK = '#12151B'
BOLT = [(10, 6), (6, 17), (13, 17), (9, 26), (26, 13), (18, 13), (22, 6)]  # 32-unit grid, the original PropSports bolt
out = lambda *p: os.path.join(ROOT, *p)


# ── brand mark ──────────────────────────────────────────
def mark_svg():
    pts = ' '.join(f'{x},{y}' for x, y in BOLT)
    return f'<rect width="32" height="32" rx="7" fill="{RED}"/><polygon points="{pts}" fill="#FFFFFF"/>'


def mark_png(size, full_bleed=False, bolt_scale=1.0):
    s = size * 4
    im = Image.new('RGBA', (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    if full_bleed:
        d.rectangle([0, 0, s, s], fill=RED)
    else:
        d.rounded_rectangle([0, 0, s - 1, s - 1], radius=s * 7 / 32, fill=RED)
    k = s / 32 * bolt_scale
    off = (s - 32 * k) / 2
    d.polygon([(off + x * k, off + y * k) for x, y in BOLT], fill='white')
    return im.resize((size, size), Image.LANCZOS)


# ── wordmark as outlines ────────────────────────────────
def wordmark_path(text, font_file, cap_px):
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
        x += hmtx[g][0] * k - cap_px * 0.012
    return ' '.join(d), x


def logo_svg(color):
    path, width = wordmark_path('PropSports', os.path.join(FONTS, 'Archivo-700.ttf'), 19)
    tx, ty = 42, 10.5
    w = tx + width + 2
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w:.1f} 40" width="{w:.0f}" height="40" role="img" aria-label="PropSports">'
            f'<g transform="translate(2 4)">{mark_svg()}</g>'
            f'<path transform="translate({tx} {ty})" fill="{color}" d="{path}"/></svg>\n')


def write(path, data, mode='w'):
    with open(path, mode, **({} if 'b' in mode else {'encoding': 'utf-8'})) as f:
        f.write(data)


def brand():
    b = out('assets', 'brand')
    mark = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" role="img" aria-label="PropSports">{mark_svg()}</svg>\n'
    write(os.path.join(b, 'propsports-mark.svg'), mark)
    write(os.path.join(b, 'favicon.svg'), mark)
    write(out('favicon.svg'), mark)  # legacy root path kept in sync
    write(os.path.join(b, 'propsports-logo.svg'), logo_svg(INK))
    write(os.path.join(b, 'propsports-logo-white.svg'), logo_svg('#FFFFFF'))
    mark_png(16).save(os.path.join(b, 'favicon-16x16.png'))
    mark_png(32).save(os.path.join(b, 'favicon-32x32.png'))
    mark_png(48).save(os.path.join(b, 'favicon-48x48.png'))
    mark_png(180, full_bleed=True, bolt_scale=0.78).convert('RGB').save(os.path.join(b, 'apple-touch-icon.png'))
    mark_png(192).save(os.path.join(b, 'icon-192.png'))
    mark_png(512).save(os.path.join(b, 'icon-512.png'))
    mark_png(512, full_bleed=True, bolt_scale=0.62).save(os.path.join(b, 'icon-maskable-512.png'))
    mark_png(48).save(out('favicon.ico'), sizes=[(16, 16), (32, 32), (48, 48)])


# ── social card ─────────────────────────────────────────
def social():
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
    d = ImageDraw.Draw(card)
    title = ImageFont.truetype(os.path.join(FONTS, 'Archivo-700.ttf'), 76)
    sub = ImageFont.truetype(os.path.join(FONTS, 'IBMPlexSans-500.ttf'), 34)
    line = ImageFont.truetype(os.path.join(FONTS, 'IBMPlexSans-600.ttf'), 21)
    m = mark_png(76)
    card.paste(m, (72, 382), m)
    d.text((170, 380), 'PropSports API', font=title, fill='#FFFFFF')
    d.text((74, 480), 'Live sports data infrastructure', font=sub, fill='#E4E8EE')
    sports = 'MLB  ·  NFL  ·  NBA  ·  WNBA  ·  NHL  ·  TENNIS  ·  SOCCER  ·  UFC'
    d.text((76, 540), sports, font=line, fill='#AEB7C3')
    d.rectangle([72, 530, 72 + 40, 532], fill=RED)
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
    brand(); social(); hero(); media()
    for d in ('brand', 'social', 'hero', 'media'):
        for f in sorted(os.listdir(out('assets', d))):
            p = out('assets', d, f)
            print(f'{d}/{f}  {os.path.getsize(p):,} B')
