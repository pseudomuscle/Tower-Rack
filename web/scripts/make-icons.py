"""Buat ikon aplikasi, layar pembuka (splash), dan grafis Play Store.

Semua digambar sendiri dengan Pillow (tanpa aset luar).
Pakai:  python3 web/scripts/make-icons.py   (dari akar repo)
"""
import os
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RES = os.path.join(ROOT, 'android/app/src/main/res')
STORE = os.path.join(ROOT, 'store')
S = 1024  # ukuran kerja

def lerp(a, b, t): return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))
def hexc(h): h = h.lstrip('#'); return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))

def sky(w, h):
    """Langit senja: biru tua → jingga → keemasan, dengan cahaya matahari."""
    top, mid, low = hexc('#24346a'), hexc('#e0755f'), hexc('#ffd59b')
    im = Image.new('RGB', (w, h))
    px = im.load()
    for y in range(h):
        t = y / (h - 1)
        c = lerp(top, mid, t / 0.62) if t < 0.62 else lerp(mid, low, (t - 0.62) / 0.38)
        for x in range(w): px[x, y] = c
    glow = Image.new('L', (w, h), 0)
    ImageDraw.Draw(glow).ellipse((w * 0.18, h * 0.5, w * 0.82, h * 1.1), fill=150)
    glow = glow.filter(ImageFilter.GaussianBlur(w * 0.09))
    im.paste(Image.new('RGB', (w, h), hexc('#ffe7b8')), (0, 0), glow)
    return im

def tower(size, scale=1.0):
    """Menara bertumpuk (RGBA, latar transparan) di kanvas size×size."""
    im = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    u = size / 108 * scale          # satuan "dp" kanvas adaptif 108
    cx = size / 2
    base_y = size / 2 + 30 * u      # kaki menara
    floors = [(40, 0), (36, 1.5), (33, -1.2), (30, 1.0), (27, -0.8), (24, 0.6), (21, -0.4), (18, 0.3)]
    fh = 5.2 * u
    # alas
    d.rounded_rectangle((cx - 26 * u, base_y, cx + 26 * u, base_y + 4 * u), radius=1.2 * u, fill=hexc('#3b2f2a'))
    y = base_y
    cream, shade, side, win = hexc('#f7f0e1'), hexc('#d9cdb5'), hexc('#b9ab90'), hexc('#5b6b78')
    for k, (w, off) in enumerate(floors):
        w *= u; x0 = cx - w / 2 + off * u
        y0 = y - fh
        d.rectangle((x0, y0, x0 + w, y), fill=cream if k % 2 == 0 else hexc('#f1e8d6'))
        d.rectangle((x0 + w * 0.82, y0, x0 + w, y), fill=side)            # sisi gelap
        d.rectangle((x0, y0, x0 + w, y0 + fh * 0.18), fill=hexc('#ffffff'))  # tepi atas terang
        d.rectangle((x0, y - fh * 0.14, x0 + w, y), fill=shade)           # garis lantai
        n = max(2, int(w / (5 * u)))
        for q in range(n):                                                 # jendela
            wx = x0 + (q + 0.5) * w * 0.82 / n
            d.rectangle((wx - 0.9 * u, y0 + fh * 0.32, wx + 0.9 * u, y0 + fh * 0.72), fill=win)
        y = y0
    # puncak: piramida kecil + lidah api emas
    tw = 16 * u
    d.polygon([(cx - tw / 2, y), (cx + tw / 2, y), (cx, y - 6 * u)], fill=hexc('#efe8d8'))
    gy = y - 6 * u
    d.ellipse((cx - 3.2 * u, gy - 2 * u, cx + 3.2 * u, gy + 1.2 * u), fill=hexc('#d9a62e'))
    flame = [(cx, gy - 15 * u), (cx + 4.2 * u, gy - 6 * u), (cx + 3 * u, gy - 1 * u), (cx, gy), (cx - 3 * u, gy - 1 * u), (cx - 4.2 * u, gy - 6 * u)]
    d.polygon(flame, fill=hexc('#f4c13d'))
    d.polygon([(cx, gy - 10 * u), (cx + 2 * u, gy - 4 * u), (cx, gy - 1.5 * u), (cx - 2 * u, gy - 4 * u)], fill=hexc('#ffe58a'))
    return im

def shadowed(fg, size):
    sh = Image.new('RGBA', fg.size, (0, 0, 0, 0))
    sh.putalpha(fg.getchannel('A').point(lambda a: a * 0.35))
    sh = sh.filter(ImageFilter.GaussianBlur(size * 0.012))
    out = Image.new('RGBA', fg.size, (0, 0, 0, 0))
    out.alpha_composite(sh, (int(size * 0.008), int(size * 0.012)))
    out.alpha_composite(fg)
    return out

def composite(size, shape='square', scale=1.0):
    big = S
    bg = sky(big, big).convert('RGBA')
    bg.alpha_composite(shadowed(tower(big, scale), big))
    if shape != 'square':
        mask = Image.new('L', (big, big), 0)
        md = ImageDraw.Draw(mask)
        if shape == 'round': md.ellipse((0, 0, big - 1, big - 1), fill=255)
        else: md.rounded_rectangle((0, 0, big - 1, big - 1), radius=big * 0.22, fill=255)
        bg.putalpha(mask)
    return bg.resize((size, size), Image.LANCZOS)

def font(px):
    for f in ['/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf']:
        try: return ImageFont.truetype(f, px)
        except OSError: pass
    return ImageFont.load_default()

def save(im, path):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    im.save(path, optimize=True)

def main():
    dens = {'mdpi': 1, 'hdpi': 1.5, 'xhdpi': 2, 'xxhdpi': 3, 'xxxhdpi': 4}
    fg_big = shadowed(tower(S), S)
    bg_big = sky(S, S)
    for name, k in dens.items():
        d = os.path.join(RES, 'mipmap-' + name)
        save(composite(int(48 * k), 'rounded', 1.25), os.path.join(d, 'ic_launcher.png'))
        save(composite(int(48 * k), 'round', 1.25), os.path.join(d, 'ic_launcher_round.png'))
        save(fg_big.resize((int(108 * k),) * 2, Image.LANCZOS), os.path.join(d, 'ic_launcher_foreground.png'))
        save(bg_big.resize((int(108 * k),) * 2, Image.LANCZOS), os.path.join(d, 'ic_launcher_bg.png'))
    # layar pembuka lama (Android < 12): latar gelap, ikon bulat, nama game
    for folder in os.listdir(RES):
        p = os.path.join(RES, folder, 'splash.png')
        if not os.path.exists(p): continue
        w, h = Image.open(p).size
        sp = Image.new('RGB', (w, h), hexc('#141a24'))
        ic = composite(int(min(w, h) * 0.34), 'round', 1.25)
        sp.paste(ic, ((w - ic.width) // 2, int(h * 0.5 - ic.height * 0.7)), ic)
        dr = ImageDraw.Draw(sp); f = font(max(14, int(min(w, h) * 0.07)))
        t = 'Menara Lapis'; tw = dr.textlength(t, font=f)
        dr.text(((w - tw) / 2, h * 0.5 + ic.height * 0.42), t, font=f, fill=hexc('#ffb84d'))
        save(sp, p)
    # Play Store: ikon 512 dan grafis fitur 1024×500
    save(composite(512, 'square', 1.25).convert('RGB'), os.path.join(STORE, 'icon-512.png'))
    fgx = sky(1024, 500).convert('RGBA')
    tw_ = tower(560, 1.2)
    fgx.alpha_composite(shadowed(tw_, 560), (40, -40))
    dr = ImageDraw.Draw(fgx)
    dr.text((500, 160), 'Menara Lapis', font=font(70), fill=(255, 255, 255), stroke_width=3, stroke_fill=(40, 30, 50))
    dr.text((504, 258), '60 menara dunia. Satu jari.', font=font(32), fill=(255, 245, 225), stroke_width=2, stroke_fill=(40, 30, 50))
    save(fgx.convert('RGB'), os.path.join(STORE, 'feature-graphic-1024x500.png'))
    print('selesai')

if __name__ == '__main__':
    main()
