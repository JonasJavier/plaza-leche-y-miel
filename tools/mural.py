"""Extrae el rotulado del mural "Cremoso como leche, dulce como miel" de la foto
del local y lo convierte en una máscara con transparencia por palabra:

  mural-cremoso.webp, mural-leche.webp, mural-dulce.webp, mural-miel.webp

Las palabras grises del mural ("como") se componen con tipografía en el sitio.
Se usan como CSS mask, así el color se controla desde styles.css.
Uso:  python tools/mural.py
"""
from pathlib import Path
import numpy as np
from PIL import Image, ImageFilter, ImageOps, ImageChops

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "source" / "tripadvisor" / "plaza-3.jpg"
OUT = ROOT / "src" / "assets" / "img"

# Recorte del mural en la foto original (2000x2667)
BOX = (575, 500, 1492, 2120)
WIDTH = 900  # ancho final de las máscaras


def drop_specks(part):
    """Quita manchas sueltas: trozos pequeños de las palabras vecinas que quedan
    cortados en el borde de la franja, y polvo de la pared."""
    a = np.array(part)
    ink = a > 40
    lab, n = ndi_label(ink)
    if n == 0:
        return part
    sizes = np.bincount(lab.ravel())
    total = sizes[1:].sum()
    keep = np.zeros(n + 1, bool)
    for i in range(1, n + 1):
        ys, xs = np.nonzero(lab == i)
        touches = ys.min() == 0 or ys.max() == a.shape[0] - 1
        small = sizes[i] < total * (0.15 if touches else 0.004)
        keep[i] = not small
    # incluye el borde suave alrededor de cada trazo conservado
    mask = keep[lab]
    grown = np.array(Image.fromarray((mask * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(5))) > 0
    a[~grown] = 0
    return Image.fromarray(a)


def ndi_label(b):
    """Etiquetado de componentes conectados (4 vecinos) sin depender de scipy."""
    h, w = b.shape
    lab = np.zeros((h, w), np.int32)
    n = 0
    for y in range(h):
        row = b[y]
        for x in np.nonzero(row & (lab[y] == 0))[0]:
            if lab[y, x]:
                continue
            n += 1
            stack = [(y, x)]
            lab[y, x] = n
            while stack:
                cy, cx = stack.pop()
                for ny, nx in ((cy - 1, cx), (cy + 1, cx), (cy, cx - 1), (cy, cx + 1)):
                    if 0 <= ny < h and 0 <= nx < w and b[ny, nx] and not lab[ny, nx]:
                        lab[ny, nx] = n
                        stack.append((ny, nx))
    return lab, n


def main():
    im = Image.open(SRC).convert("L").crop(BOX)
    # Fondo estimado (la pared tiene degradado de luz) y diferencia
    # máximo local a gran escala (más ancho que cualquier trazo) y suavizado
    small = im.resize((im.width // 8, im.height // 8), Image.BILINEAR)
    small = small.filter(ImageFilter.MaxFilter(15)).filter(ImageFilter.GaussianBlur(6))
    bg = small.resize(im.size, Image.BICUBIC)
    dark = ImageChops.subtract(bg, im)  # 0 = pared, alto = pintura

    # Trazo negro: diferencia muy alta
    trazo = dark.point(lambda v: 0 if v < 70 else min(255, int((v - 70) * 3.2)))

    h = round(im.height * WIDTH / im.width)
    trazo = trazo.filter(ImageFilter.MedianFilter(5)).resize((WIDTH, h), Image.LANCZOS)
    trazo = trazo.point(lambda v: 0 if v < 24 else v)  # limpia polvo suelto
    # Cada palabra por separado (franjas verticales en proporción de alto)
    bands = {"cremoso": (0.0, 0.135), "leche": (0.14, 0.535), "dulce": (0.535, 0.60), "miel": (0.60, 1.0)}
    for word, (a, b) in bands.items():
        part = trazo.crop((0, round(a * h), WIDTH, round(b * h)))
        if word == "miel":  # sombra de la silla en la esquina inferior izquierda
            part.paste(0, (0, round(part.height * 0.40), 46, part.height))
        part = drop_specks(part)
        bbox = part.getbbox()
        part = part.crop(bbox)
        black = Image.new("RGBA", part.size, (0, 0, 0, 255))
        black.putalpha(part)
        black.save(OUT / f"mural-{word}.webp", "WEBP", quality=90, method=6)
        prev = Image.new("RGB", part.size, (250, 247, 240))
        prev.paste((40, 40, 40), mask=part)
        prev.save(ROOT / "source" / f"prev-mural-{word}.jpg", quality=80)
        print(word, part.size)
    print("mural listo", WIDTH, h)


if __name__ == "__main__":
    main()
