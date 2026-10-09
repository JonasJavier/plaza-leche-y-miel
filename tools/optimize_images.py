"""Optimiza las fotos de source/ a WebP en varios anchos.

Salida:
  src/assets/img/<nombre>-<ancho>.webp
  src/assets/js/images.js   (medidas para que el JS arme srcset)
  tools/images.json         (medidas para build.py)

Uso:  python tools/optimize_images.py
Para agregar una foto: ponla en source/ y añade una línea a FOTOS.
"""
import json
from pathlib import Path
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "source"
OUT = ROOT / "src" / "assets" / "img"
WIDTHS = (480, 800, 1200, 1600)

# nombre: (archivo en source/, recorte (x0, y0, x1, y1) en píxeles o None)
FOTOS = {
    "mostrador": ("tripadvisor/plaza-2.jpg", (0, 120, 2000, 2620)),
    "patio": ("tripadvisor/patio-enramada.jpg", None),
    "patio-mesas": ("tripadvisor/patio-3.jpg", None),
    "patio-jardin": ("tripadvisor/patio-2.jpg", None),
    "mural": ("tripadvisor/plaza-3.jpg", (0, 280, 2000, 2667)),
    "pizarra": ("tripadvisor/plaza-1.jpg", (300, 330, 1990, 2330)),
    "fachada": ("tripadvisor/acogedor.jpg", None),
    "bizcocho-cumple": ("tripadvisor/bizcochos-1.jpg", None),
    "bizcocho-frutas": ("tripadvisor/bizcochos-2.jpg", None),
    "cupcakes": ("tripadvisor/bizcochitos.jpg", None),
    "mangu": ("tripadvisor/desayuno.jpg", None),
    "hamburguesa": ("tripadvisor/hamburguesa.jpg", None),
    "sandwich-platano": ("tripadvisor/sandwich-platano.jpg", None),
    "capuchino": ("tripadvisor/capuchino.jpg", None),
    "cafe": ("tripadvisor/cafe-1.jpg", None),
    "pista-neon": ("tripadvisor/familia-1.jpg", None),
    "pista-globos": ("tripadvisor/familia-2.jpg", None),
    "bandeja": ("instagram/ig-01.jpg", (55, 160, 595, 545)),
    "gallepapas": ("instagram/ig-02.jpg", (0, 175, 360, 520)),
    "brownie-helado": ("instagram/ig-03.jpg", (0, 120, 361, 500)),
    "empanadas": ("instagram/ig-08.jpg", None),
    "galletas-vintage": ("instagram/ig-12.jpg", (0, 60, 360, 600)),
    "patio-plantas": ("instagram/ig-11.jpg", None),
}


MANIFEST = ROOT / "tools" / "images.json"


def save_manifest(new):
    """Mezcla las medidas nuevas con las existentes (p. ej. el mapa) y escribe
    tools/images.json y src/assets/js/images.js."""
    data = json.loads(MANIFEST.read_text(encoding="utf-8")) if MANIFEST.exists() else {}
    data.update(new)
    MANIFEST.write_text(json.dumps(data, indent=1), encoding="utf-8")
    js = ("/* Generado por tools/optimize_images.py, no editar a mano */\n"
          "window.IMG = " + json.dumps(data, separators=(",", ":")) + ";\n")
    (ROOT / "src" / "assets" / "js" / "images.js").write_text(js, encoding="utf-8")


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    data = {}
    before = after = 0
    for name, (file, box) in FOTOS.items():
        path = SRC / file
        before += path.stat().st_size
        im = ImageOps.exif_transpose(Image.open(path)).convert("RGB")
        if box:
            im = im.crop(box)
        widths = [w for w in WIDTHS if w < im.width] + [min(im.width, WIDTHS[-1])]
        widths = sorted(set(widths))
        for w in widths:
            h = round(im.height * w / im.width)
            out = OUT / f"{name}-{w}.webp"
            im.resize((w, h), Image.LANCZOS).save(out, "WEBP", quality=78, method=6)
            after += out.stat().st_size
        data[name] = {"w": im.width if im.width <= WIDTHS[-1] else WIDTHS[-1],
                      "h": round(im.height * min(im.width, WIDTHS[-1]) / im.width),
                      "widths": widths}
    (ROOT / "tools" / "images.json").write_text(json.dumps(data, indent=1), encoding="utf-8")
    js = "/* Generado por tools/optimize_images.py — no editar a mano */\nwindow.IMG = " + json.dumps(data, separators=(",", ":")) + ";\n"
    (ROOT / "src" / "assets" / "js" / "images.js").write_text(js, encoding="utf-8")
    print(f"{len(FOTOS)} fotos - originales {before/1e6:.1f} MB -> webp {after/1e6:.1f} MB")


if __name__ == "__main__":
    main()
