"""Compone la imagen estática del mapa (© OpenStreetMap) con el pin del local.
Se muestra primero; el iframe de Google Maps solo se carga al tocar "Ver mapa".
Uso:  python tools/static_map.py
"""
import io
import json
import math
import re
import urllib.request
from pathlib import Path
from PIL import Image, ImageDraw
from optimize_images import save_manifest

ROOT = Path(__file__).resolve().parents[1]
CONFIG = (ROOT / "src" / "assets" / "js" / "config.js").read_text(encoding="utf-8")
LAT = float(re.search(r'"lat":\s*([-\d.]+)', CONFIG).group(1))
LNG = float(re.search(r'"lng":\s*([-\d.]+)', CONFIG).group(1))
ZOOM = 17
W, H = 1200, 750
UA = "PropuestaWebLecheMiel/1.0 (contacto: github.com/JonasJavier)"


def tile_xy(lat, lng, z):
    n = 2 ** z
    x = (lng + 180) / 360 * n
    y = (1 - math.asinh(math.tan(math.radians(lat))) / math.pi) / 2 * n
    return x, y


def main():
    fx, fy = tile_xy(LAT, LNG, ZOOM)
    px, py = fx * 256, fy * 256
    x0, y0 = px - W / 2, py - H / 2
    canvas = Image.new("RGB", (W, H), "#eee")
    for tx in range(int(x0 // 256), int((x0 + W) // 256) + 1):
        for ty in range(int(y0 // 256), int((y0 + H) // 256) + 1):
            url = f"https://tile.openstreetmap.org/{ZOOM}/{tx}/{ty}.png"
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            tile = Image.open(io.BytesIO(urllib.request.urlopen(req).read())).convert("RGB")
            canvas.paste(tile, (int(tx * 256 - x0), int(ty * 256 - y0)))
    # Tono cálido suave para que combine con la paleta
    warm = Image.new("RGB", canvas.size, (250, 244, 228))
    canvas = Image.blend(canvas, warm, 0.18)
    d = ImageDraw.Draw(canvas)
    cx, cy = W // 2, H // 2
    # Pin: gota verde hoja con centro miel
    r = 26
    d.ellipse((cx - r, cy - 2 * r - 22, cx + r, cy - 22), fill="#3F4B24")
    d.polygon([(cx - r + 4, cy - r - 14), (cx + r - 4, cy - r - 14), (cx, cy)], fill="#3F4B24")
    d.ellipse((cx - 10, cy - r - 32, cx + 10, cy - r - 12), fill="#E2A72E")
    d.ellipse((cx - 8, cy - 3, cx + 8, cy + 3), fill=(0, 0, 0, 60))
    out = ROOT / "src" / "assets" / "img"
    widths = [480, 800, 1200]
    for w in widths:
        canvas.resize((w, round(H * w / W)), Image.LANCZOS).save(out / f"mapa-{w}.webp", "WEBP", quality=80, method=6)
    save_manifest({"mapa": {"w": W, "h": H, "widths": widths}})
    print("mapa listo")


if __name__ == "__main__":
    main()
