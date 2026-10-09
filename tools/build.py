"""Compila el sitio: src/ -> site/

- Cada página de src/pages/ se envuelve en src/partials/layout.html
  (head, encabezado, pie, diálogos y barra móvil no se repiten a mano).
- Versiona CSS y JS en la URL (styles.css?v=<hash>) para evitar cachés viejas.
- Escribe las URL absolutas (canonical, og:url, og:image, JSON-LD, QR) a partir
  de SITE_URL, que se lee de src/assets/js/config.js.

Sintaxis de las plantillas:
  {{ clave }}                         variable de la página o del sitio
  {% include archivo.html %}          partial de src/partials/
  {% img nombre | alt | sizes | clases | eager %}   <img> con srcset, width y height
  {% asset css/styles.css %}          ruta versionada

Uso:  python tools/build.py
"""
import hashlib
import html
import json
import re
import shutil
from datetime import date
from pathlib import Path

import segno

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "src"
OUT = ROOT / "site"
IMAGES = json.loads((ROOT / "tools" / "images.json").read_text(encoding="utf-8"))

DAYS_SCHEMA = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

# Navegación: (slug, etiqueta, subtítulo, clave i18n)
NAV = [
    ("index", "Inicio", "Horario, reseñas y cómo llegar", "nav.inicio"),
    ("menu", "Menú", "Desayunos, postres y café", "nav.menu"),
    ("encargos", "Encargos", "Bizcochos, bandejas y eventos", "nav.encargos"),
    ("galeria", "Galería", "El mostrador, el patio y la pista", "nav.galeria"),
]


def read_config():
    text = (SRC / "assets" / "js" / "config.js").read_text(encoding="utf-8")
    obj = text[text.index("window.SITE =") + len("window.SITE ="):].strip().rstrip(";")
    return json.loads(obj)


SITE = read_config()
SITE_URL = SITE["SITE_URL"].rstrip("/") + "/"


def file_hash(path):
    return hashlib.md5(path.read_bytes()).hexdigest()[:8]


def front_matter(text):
    m = re.match(r"\s*<!--\s*meta\s*\n(.*?)-->\s*\n", text, re.S)
    meta = {}
    if m:
        for line in m.group(1).strip().splitlines():
            k, _, v = line.partition(":")
            meta[k.strip()] = v.strip()
        text = text[m.end():]
    return meta, text


def img_tag(args, base):
    parts = [p.strip() for p in args.split("|")]
    name, alt = parts[0], parts[1] if len(parts) > 1 else ""
    sizes = parts[2] if len(parts) > 2 and parts[2] else "100vw"
    cls = parts[3] if len(parts) > 3 else ""
    eager = len(parts) > 4 and parts[4] == "eager"
    info = IMAGES[name]
    srcset = ", ".join(f"{base}assets/img/{name}-{w}.webp {w}w" for w in info["widths"])
    default = info["widths"][min(1, len(info["widths"]) - 1)]
    attrs = [
        f'src="{base}assets/img/{name}-{default}.webp"',
        f'srcset="{srcset}"',
        f'sizes="{sizes}"',
        f'width="{info["w"]}" height="{info["h"]}"',
        f'alt="{html.escape(alt)}"',
    ]
    if cls:
        attrs.append(f'class="{cls}"')
    attrs.append('fetchpriority="high" decoding="async"' if eager else 'loading="lazy" decoding="async"')
    return "<img " + " ".join(attrs) + ">"


def preload_tag(name, sizes, base):
    info = IMAGES[name]
    srcset = ", ".join(f"{base}assets/img/{name}-{w}.webp {w}w" for w in info["widths"])
    return f'<link rel="preload" as="image" type="image/webp" imagesrcset="{srcset}" imagesizes="{sizes}" fetchpriority="high">'


def time_12(hhmm):
    h, m = map(int, hhmm.split(":"))
    suf = "a. m." if h < 12 else "p. m."
    return f"{(h % 12) or 12}:{m:02d} {suf}"


def json_ld():
    hours = []
    for d, shifts in SITE["hours"].items():
        for o, c in shifts:
            hours.append({"@type": "OpeningHoursSpecification", "dayOfWeek": DAYS_SCHEMA[int(d)], "opens": o, "closes": c})
    ta = SITE["rating"]["tripadvisor"]
    data = {
        "@context": "https://schema.org",
        "@type": ["CafeOrCoffeeShop", "Bakery"],
        "@id": SITE_URL + "#negocio",
        "name": SITE["name"],
        "alternateName": "Leche + Miel Plaza",
        "description": "Pastelería, café y desayunos en el Boulevard de Juan Dolio.",
        "url": SITE_URL,
        "image": [SITE_URL + "assets/img/og-image.jpg", SITE_URL + "assets/img/mostrador-1200.webp"],
        "logo": SITE_URL + "assets/img/logo.svg",
        "telephone": SITE["phone"],
        "address": {
            "@type": "PostalAddress",
            "streetAddress": SITE["address"]["street"],
            "addressLocality": SITE["address"]["locality"],
            "addressRegion": SITE["address"]["region"],
            "postalCode": SITE["address"]["postalCode"],
            "addressCountry": SITE["address"]["country"],
        },
        "geo": {"@type": "GeoCoordinates", "latitude": SITE["geo"]["lat"], "longitude": SITE["geo"]["lng"]},
        "hasMap": SITE["mapsPlace"],
        "servesCuisine": ["Café", "Repostería", "Desayunos dominicanos"],
        "priceRange": "$",
        "paymentAccepted": "Efectivo, tarjeta de crédito",
        "openingHoursSpecification": hours,
        "hasMenu": SITE_URL + "menu.html",
        "acceptsReservations": True,
        "sameAs": [SITE["instagram"], SITE["facebook"], SITE["tripadvisor"]],
        "aggregateRating": {"@type": "AggregateRating", "ratingValue": ta["value"], "reviewCount": ta["count"], "bestRating": 5},
    }
    return '<script type="application/ld+json">' + json.dumps(data, ensure_ascii=False) + "</script>"


def hours_rows():
    names = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"]
    order = [1, 2, 3, 4, 5, 6, 0]  # la semana empieza el lunes
    rows = []
    for d in order:
        shifts = SITE["hours"][str(d)]
        txt = " y ".join(f"{time_12(o)} – {time_12(c)}" for o, c in shifts) if shifts else "Cerrado"
        rows.append(f'<tr data-day="{d}"><th scope="row" data-i18n="day.{d}">{names[d]}</th><td>{txt}</td></tr>')
    return "\n".join(rows)


def qr_svg():
    qr = segno.make(SITE_URL, error="m")
    svg = qr.svg_inline(dark="#2B2E2A", light="#FAF7F0", border=2, scale=4)
    return svg.replace("<svg ", '<svg role="img" aria-label="Código QR de este sitio" ', 1)


def nav_html(slug, base):
    desk, sheet = [], []
    for s, label, sub, key in NAV:
        cur = ' aria-current="page"' if s == slug else ""
        href = f"{base}{'index' if s == 'index' else s}.html" if s != "index" else f"{base}index.html"
        desk.append(f'<li><a href="{href}"{cur} data-i18n="{key}">{label}</a></li>')
        sheet.append(
            f'<li style="--i:{len(sheet)}"><a href="{href}"{cur}><span class="sheet-link__t" data-i18n="{key}">{label}</span>'
            f'<span class="sheet-link__s" data-i18n="{key}.sub">{sub}</span></a></li>'
        )
    return "\n".join(desk), "\n".join(sheet)


def bottom_bar(slug, base):
    cur = lambda s: ' aria-current="page"' if s == slug else ""
    return f"""<nav class="bottombar" aria-label="Acciones rápidas" data-bottombar>
  <a class="bottombar__item bottombar__item--main" href="{base}encargos.html"{cur("encargos")}><svg aria-hidden="true"><use href="#i-cake"/></svg><span data-i18n="bar.encargar">Encargar</span></a>
  <a class="bottombar__item" href="{base}menu.html"{cur("menu")}><svg aria-hidden="true"><use href="#i-menu-book"/></svg><span data-i18n="bar.menu">Menú</span></a>
  <a class="bottombar__item" href="{SITE["mapsDirections"]}" target="_blank" rel="noopener"><svg aria-hidden="true"><use href="#i-route"/></svg><span data-i18n="bar.llegar">Cómo llegar</span></a>
  <a class="bottombar__item bottombar__item--wa" href="https://wa.me/{SITE["whatsapp"]}" target="_blank" rel="noopener" data-wa-generic><svg aria-hidden="true"><use href="#i-whatsapp"/></svg><span>WhatsApp</span></a>
</nav>"""


def render(text, ctx, base, versions):
    def include(m):
        return render((SRC / "partials" / m.group(1).strip()).read_text(encoding="utf-8"), ctx, base, versions)

    text = re.sub(r"\{%\s*include\s+([\w./-]+)\s*%\}", include, text)
    text = re.sub(r"\{%\s*img\s+(.*?)\s*%\}", lambda m: img_tag(m.group(1), base), text)
    text = re.sub(r"\{%\s*asset\s+([\w./-]+)\s*%\}", lambda m: f"{base}assets/{m.group(1)}?v={versions.get(m.group(1), '0')}", text)
    text = re.sub(r"\{\{\s*([\w.]+)\s*\}\}", lambda m: str(ctx.get(m.group(1), m.group(0))), text)
    return text


def build():
    if OUT.exists():
        shutil.rmtree(OUT)
    shutil.copytree(SRC / "assets", OUT / "assets")
    shutil.copy(SRC / "favicon.ico", OUT / "favicon.ico")
    (OUT / ".nojekyll").write_text("", encoding="utf-8")

    # Imágenes y fuentes referenciadas desde el CSS también llevan versión
    css_out = OUT / "assets" / "css" / "styles.css"
    css = css_out.read_text(encoding="utf-8")
    css = re.sub(r'url\("\.\./(img|fonts)/([^"?]+)"\)',
                 lambda m: f'url("../{m.group(1)}/{m.group(2)}?v={file_hash(SRC / "assets" / m.group(1) / m.group(2))}")', css)
    css_out.write_text(css, encoding="utf-8")

    versions = {}
    for p in (OUT / "assets").rglob("*"):
        if p.suffix in (".css", ".js"):
            versions[p.relative_to(OUT / "assets").as_posix()] = file_hash(p)

    layout = (SRC / "partials" / "layout.html").read_text(encoding="utf-8")
    qr = qr_svg()
    ld = json_ld()
    for page in sorted((SRC / "pages").glob("*.html")):
        meta, body = front_matter(page.read_text(encoding="utf-8"))
        slug = page.stem
        # El 404 se sirve desde cualquier ruta: usa URLs absolutas
        base = SITE_URL if slug == "404" else ""
        url = SITE_URL if slug == "index" else f"{SITE_URL}{slug}.html"
        desk, sheet = nav_html(slug, base)
        scripts = "".join(
            f'<script src="{base}assets/js/{s.strip()}?v={versions.get("js/" + s.strip(), "0")}" defer></script>'
            for s in meta.get("scripts", "").split(",") if s.strip()
        )
        ctx = {
            **{f"site.{k}": v for k, v in SITE.items() if isinstance(v, (str, int, float))},
            "site.street": SITE["address"]["street"],
            "site.reference": SITE["address"]["reference"],
            "base": base,
            "slug": slug,
            "title": meta.get("title", SITE["name"]),
            "description": meta.get("description", ""),
            "canonical": url,
            "og_image": SITE_URL + "assets/img/og-image.jpg",
            "body_class": meta.get("body_class", f"page-{slug}"),
            "preload": preload_tag(meta["hero"], meta.get("hero_sizes", "100vw"), base) if meta.get("hero") else "",
            "page_scripts": scripts,
            "nav_desktop": desk,
            "nav_sheet": sheet,
            "bottom_bar": bottom_bar(slug, base),
            "json_ld": ld if slug == "index" else "",
            "hours_rows": hours_rows(),
            "qr": qr,
            "year": date.today().year,
        }
        ctx["content"] = render(body, ctx, base, versions)
        out = render(layout, ctx, base, versions)
        (OUT / page.name).write_text(out, encoding="utf-8")

    manifest = {
        "name": SITE["name"],
        "short_name": "Leche + Miel",
        "lang": "es-DO",
        "start_url": "./",
        "scope": "./",
        "display": "standalone",
        "background_color": "#FAF7F0",
        "theme_color": "#3F4B24",
        "icons": [
            {"src": "assets/img/icon-192.png", "sizes": "192x192", "type": "image/png"},
            {"src": "assets/img/icon-512.png", "sizes": "512x512", "type": "image/png"},
            {"src": "assets/img/icon-maskable.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable"},
        ],
    }
    (OUT / "manifest.webmanifest").write_text(json.dumps(manifest, ensure_ascii=False, indent=1), encoding="utf-8")
    # Mientras sea propuesta, no se indexa (ver README para quitarlo)
    (OUT / "robots.txt").write_text("# Propuesta: bloqueada para no competir con la presencia oficial\nUser-agent: *\nDisallow: /\n", encoding="utf-8")
    print(f"site/ listo · SITE_URL = {SITE_URL}".encode("ascii", "replace").decode())


if __name__ == "__main__":
    build()
