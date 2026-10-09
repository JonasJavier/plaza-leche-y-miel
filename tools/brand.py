"""Redibuja el logo de Leche + Miel Plaza en SVG (trazos, sin depender de fuentes)
y genera favicon, íconos de la app y la imagen Open Graph (1200x630).

El logo original solo existe en baja calidad (foto de perfil de Instagram):
"leche + miel" en serif minúscula sobre una barra negra con "P L A Z A".

Uso:  python tools/brand.py
"""
import io
from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.boundsPen import BoundsPen
from fontTools.varLib.instancer import instantiateVariableFont
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
FONTS = ROOT / "source" / "fonts"
IMG = ROOT / "src" / "assets" / "img"
PIZARRA, LECHE, HOJA, MIEL = "#2B2E2A", "#FAF7F0", "#3F4B24", "#E2A72E"


def load(name, **axes):
    f = TTFont(FONTS / name)
    return instantiateVariableFont(f, axes) if "fvar" in f else f


def text_path(font, text, x, y, size, tracking=0):
    """Devuelve (path d, ancho) del texto con origen en la línea base (x, y)."""
    gs = font.getGlyphSet()
    cmap = font.getBestCmap()
    upm = font["head"].unitsPerEm
    s = size / upm
    parts, cursor = [], 0
    for ch in text:
        gname = cmap.get(ord(ch))
        if gname is None:
            continue
        pen = SVGPathPen(gs)
        gs[gname].draw(pen)
        d = pen.getCommands()
        if d:
            parts.append(f'<path transform="translate({x + cursor * s:.2f} {y:.2f}) scale({s:.5f} {-s:.5f})" d="{d}"/>')
        cursor += gs[gname].width + tracking * upm
    return "".join(parts), cursor * s - tracking * size


def logo_svg():
    serif = load("Newsreader.ttf", wght=380, opsz=36)
    sans = load("HankenGrotesk.ttf", wght=800)
    top, tw = text_path(serif, "leche + miel", 0, 0, 100)
    # barra: un poco más ancha que el texto, como en el original
    bar_w, bar_h = tw * 0.96, 46
    letters, lw = text_path(sans, "PLAZA", 0, 0, 34, tracking=0.62)
    bx = (tw - bar_w) / 2
    W, H = tw + 4, 100 + 18 + bar_h + 4
    lx = bx + (bar_w - lw) / 2
    ly = 100 + 18 + bar_h / 2 + 12
    svg = (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="-2 -78 {W:.0f} {H:.0f}" role="img" aria-label="Leche + Miel Plaza">'
        f'<g fill="currentColor">{top}</g>'
        f'<rect x="{bx:.1f}" y="{100 + 18 - 78 + 4:.1f}" width="{bar_w:.1f}" height="{bar_h}" fill="currentColor"/>'
        f'<g fill="var(--logo-bar-text, #fff)" transform="translate({lx:.1f} {ly - 78 + 4:.1f})">{letters}</g>'
        "</svg>"
    )
    # Dos versiones con colores fijos: oscura (encabezado) y clara (pie)
    dark = svg.replace("currentColor", PIZARRA).replace("var(--logo-bar-text, #fff)", LECHE)
    light = svg.replace("currentColor", LECHE).replace("var(--logo-bar-text, #fff)", PIZARRA)
    (IMG / "logo.svg").write_text(dark, encoding="utf-8")
    (IMG / "logo-claro.svg").write_text(light, encoding="utf-8")
    print("logo.svg", round(W), round(H))


def favicon_svg():
    serif = load("Newsreader.ttf", wght=420, opsz=36)
    mark, mw = text_path(serif, "l+m", 0, 0, 40)
    x = (64 - mw) / 2
    svg = (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">'
        f'<rect width="64" height="64" rx="14" fill="{HOJA}"/>'
        f'<g fill="{LECHE}" transform="translate({x:.1f} 40)">{mark}</g>'
        f'<rect x="14" y="48" width="36" height="5" rx="1" fill="{MIEL}"/>'
        "</svg>"
    )
    (IMG / "favicon.svg").write_text(svg, encoding="utf-8")


def pil_font(name, size, **axes):
    f = load(name, **axes)
    buf = io.BytesIO()
    f.save(buf)
    buf.seek(0)
    return ImageFont.truetype(buf, size)


def icons():
    for size, name, pad in ((192, "icon-192.png", 0), (512, "icon-512.png", 0), (180, "apple-touch-icon.png", 0), (512, "icon-maskable.png", 0.12)):
        im = Image.new("RGB", (size, size), HOJA)
        d = ImageDraw.Draw(im)
        fs = int(size * (0.5 - pad))
        font = pil_font("Newsreader.ttf", fs, wght=420, opsz=36)
        text = "l+m"
        bb = d.textbbox((0, 0), text, font=font)
        d.text(((size - (bb[2] - bb[0])) / 2 - bb[0], size * 0.58 - bb[3]), text, font=font, fill=LECHE)
        bw = size * (0.5 - pad)
        d.rectangle(((size - bw) / 2, size * 0.7, (size + bw) / 2, size * 0.7 + size * 0.07), fill=MIEL)
        im.save(IMG / name)
    ico = Image.open(IMG / "icon-192.png").resize((48, 48), Image.LANCZOS)
    ico.save(ROOT / "src" / "favicon.ico", sizes=[(48, 48), (32, 32), (16, 16)])


def og_image():
    """1200x630: foto real del mostrador + panel con logo, nombre y frase."""
    W, H = 1200, 630
    photo = Image.open(ROOT / "source" / "tripadvisor" / "plaza-2.jpg").convert("RGB")
    # recorte vertical del mostrador para la mitad derecha
    pw = 560
    ph = H
    src_w = photo.width
    crop_h = round(src_w * ph / pw)
    top = 380
    photo = photo.crop((0, top, src_w, top + crop_h)).resize((pw, ph), Image.LANCZOS)
    og = Image.new("RGB", (W, H), LECHE)
    og.paste(photo, (W - pw, 0))
    d = ImageDraw.Draw(og)
    # mural: "Leche" del propio local, en verde hoja
    for word, xy, height in (("leche", (64, 150), 230), ):
        m = Image.open(IMG / f"mural-{word}.webp").split()[-1]
        m = m.resize((round(m.width * height / m.height), height), Image.LANCZOS)
        og.paste(HOJA, (xy[0], xy[1], xy[0] + m.width, xy[1] + m.height), mask=m)
    serif_i = pil_font("Newsreader-Italic.ttf", 44, wght=400, opsz=36)
    sans = pil_font("HankenGrotesk.ttf", 30, wght=600)
    sans_s = pil_font("HankenGrotesk.ttf", 26, wght=500)
    d.text((70, 80), "Cremoso como", font=serif_i, fill=PIZARRA)
    d.text((70, 392), "dulce como miel.", font=serif_i, fill=PIZARRA)
    d.text((70, 488), "Pastelería, café y desayunos", font=sans, fill=PIZARRA)
    d.text((70, 530), "Boulevard de Juan Dolio, km 8", font=sans_s, fill="#5C5F57")
    # logo pequeño arriba a la izquierda del panel de foto
    logo = Image.new("RGBA", (300, 110), (0, 0, 0, 0))
    ld = ImageDraw.Draw(logo)
    lf = pil_font("Newsreader.ttf", 46, wght=380, opsz=36)
    bb = ld.textbbox((0, 0), "leche + miel", font=lf)
    tw = bb[2] - bb[0]
    ld.rounded_rectangle((0, 0, tw + 40, 100), 10, fill=LECHE)
    ld.text((20 - bb[0], 8), "leche + miel", font=lf, fill=PIZARRA)
    ld.rectangle((20, 64, 20 + tw, 88), fill=PIZARRA)
    pf = pil_font("HankenGrotesk.ttf", 18, wght=800)
    letters = "P  L  A  Z  A"
    bb2 = ld.textbbox((0, 0), letters, font=pf)
    ld.text((20 + (tw - (bb2[2] - bb2[0])) / 2 - bb2[0], 76 - (bb2[3] + bb2[1]) / 2), letters, font=pf, fill="#fff")
    og.paste(logo, (W - pw + 28, 28), logo)
    og.save(IMG / "og-image.jpg", "JPEG", quality=86, optimize=True, progressive=True)
    print("og-image.jpg", og.size)


if __name__ == "__main__":
    logo_svg()
    favicon_svg()
    icons()
    og_image()
