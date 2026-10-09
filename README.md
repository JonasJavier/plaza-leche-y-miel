# Plaza Leche y Miel · propuesta de sitio web

**Esto es una propuesta, no el sitio oficial.** Es una demostración preparada para presentarle al dueño de **Plaza Leche y Miel** (pastelería, café y desayunos en el Boulevard de Juan Dolio) cómo podría verse su sitio. Las fotos, la carta y la marca son del negocio y se usan solo para esta presentación.

**Ver en vivo:** https://jonasjavier.github.io/plaza-leche-y-miel/
**Versión en inglés para compartir:** https://jonasjavier.github.io/plaza-leche-y-miel/?lang=en

---

## Páginas y funciones

| Página | Qué tiene |
|---|---|
| **Inicio** (`index.html`) | Hero con el mural del local («Cremoso como leche, dulce como miel») redibujado a partir de la foto · estado **abierto/cerrado en vivo** con la hora de Santo Domingo · acciones rápidas (llamar, WhatsApp, cómo llegar, Instagram) · carrusel «Lo que más se pide» · la historia de la plaza · de la mañana a la tarde · los espacios (patio, salón, tiendita, pista de patinaje) · encargos con dedicatoria · **reservas por WhatsApp** · reseñas reales con fuente y fecha · adelanto de galería · preguntas frecuentes · horario con el día de hoy resaltado, mapa bajo demanda, Google Maps y Waze |
| **Menú** (`menu.html`) | La pizarra del mostrador completa (unos 90 productos) en español e inglés · buscador que no distingue tildes · filtros (favoritos, nuevo, sin gluten, saludable, con foto) · barra de categorías fija · **pedido por WhatsApp con carrito** (recoger o delivery, hora, forma de pago), guardado en el teléfono · versión imprimible con QR |
| **Encargos** (`encargos.html`) | **Elemento firma:** el cliente elige bizcocho, la bandeja de desayuno, galletas decoradas o picaderas, escribe la dedicatoria y la ve en vivo en la tarjetita redonda de la casa; el encargo sale armado por WhatsApp · **Celebra en la plaza:** la pista de patinaje para cumpleaños, proceso en 3 pasos y cotización por WhatsApp |
| **Galería** (`galeria.html`) | 22 fotos con filtros (postres, desayunos, café, el lugar, la pista) y visor a pantalla completa (teclado ← → Esc, deslizar con el dedo) |
| **404** | Página propia con enlaces al menú y al inicio |

En todo el sitio: menú móvil tipo hoja con el estado del día, barra inferior tipo app en el teléfono (Encargar · Menú · Cómo llegar · WhatsApp), versión en inglés con `?lang=en` y QR del sitio en el pie (escritorio).

## Qué mejora frente a lo que tienen hoy

Hoy Leche + Miel no tiene sitio web: su enlace en los directorios es el Instagram, el menú solo existe en una pizarra (en inglés y sin precios) y el horario aparece distinto en Instagram, Google y TripAdvisor.

- **Un solo enlace con todo**: menú, horario, ubicación, fotos y contacto. Sirve para la bio de Instagram, Google Maps y los grupos de WhatsApp.
- **Más pedidos y encargos por WhatsApp**: el cliente arma su pedido o su bizcocho con dedicatoria y llega al WhatsApp del negocio con el mensaje ordenado (qué, cuántos, para cuándo, nombre). Menos idas y vueltas.
- **Reservas de grupos**: equipos de misión, familias y cumpleaños reservan el patio en segundos.
- **Turistas atendidos en su idioma**: la carta completa en inglés con un enlace para compartir.
- **Responde solo las preguntas de siempre**: estacionamiento, pagos, delivery, niños, opciones sin gluten.
- **Muestra lo que lo hace único**: la plaza con café, tiendita, patio bajo la enramada y pista de patinaje, con su propio mural como identidad.
- **Se ve bien cuando se comparte**: al pegar el enlace en WhatsApp aparece una tarjeta con foto real del mostrador, el logo y el nombre.

## Cómo verlo en local

Requiere Python 3.10 o más reciente.

```bash
pip install segno
python tools/build.py
python -m http.server 5187 --directory site
```

Abre http://localhost:5187. Después de cada cambio en `src/`, vuelve a correr `python tools/build.py`.

**Probar el horario:** agrega `?simular=2026-10-11T21:30` a la URL para ver el estado como si fuera esa fecha y hora en Santo Domingo (por ejemplo, domingo después del cierre muestra «Abre el martes a las 8:00 a. m.»).

## Cómo publicarlo

**GitHub Pages (como está hoy).** Cada push a `main` corre `.github/workflows/pages.yml`, que compila `src/` → `site/` y lo publica. En el repo: *Settings → Pages → Source: GitHub Actions*. Si cambia el dominio, actualiza `SITE_URL` en `src/assets/js/config.js` (de ahí salen la canonical, Open Graph, JSON-LD y el QR).

**Netlify (opcional).** Conectar el repo, rama `main`. El `netlify.toml` ya trae todo: comando de build `pip install segno && python tools/build.py`, carpeta de publicación `site`, encabezados de caché largos para imágenes y fuentes, y el 404 propio.

> GitHub Pages no permite configurar encabezados de caché (usa 10 minutos). Para evitar versiones viejas, el build agrega `?v=<hash>` a CSS, JS y a las imágenes y fuentes que usa el CSS.

### Quitar el «no indexar» cuando sea el sitio oficial

Mientras es propuesta, el sitio no se indexa para no competir con su presencia oficial:

1. En `src/partials/head.html`, borra `<meta name="robots" content="noindex, nofollow">`.
2. En `tools/build.py`, cambia el `robots.txt` por `User-agent: *` + `Allow: /` y añade la línea del sitemap.
3. Si usan Netlify, quita `X-Robots-Tag` en `netlify.toml`.

## Quiero cambiar…

| Quiero cambiar… | Archivo |
|---|---|
| Platos, descripciones, **precios**, fotos de un plato, favoritos del inicio | `src/assets/js/menu-data.js` |
| Teléfono, WhatsApp, dirección, coordenadas, **horario**, redes, `SITE_URL` | `src/assets/js/config.js` |
| Textos de una página | `src/pages/*.html` |
| Encabezado, pie, menú móvil, diálogo de reservas | `src/partials/*.html` |
| Textos en inglés | `src/assets/js/i18n-en.js` |
| Colores, tipografía, espacios | `src/assets/css/styles.css` (variables en `:root`) |
| Opciones de encargos (sabores, días de antelación) | `src/pages/encargos.html` y `src/assets/js/encargos.js` |
| Agregar o cambiar fotos | poner el original en `source/`, añadirlo en `tools/optimize_images.py` y correr `python tools/optimize_images.py` |
| Logo, íconos, imagen para compartir | `tools/brand.py` |
| Mapa estático | `tools/static_map.py` (lee las coordenadas de `config.js`) |

Para los scripts de `tools/` que procesan imágenes: `pip install -r requirements.txt`.

## Por confirmar con el cliente

- **Horario.** Se usó el de su Instagram: martes a jueves de 8:00 a. m. a 7:00 p. m., viernes a domingo de 8:00 a. m. a 9:00 p. m., lunes cerrado. TripAdvisor dice que abren a las 9:00 a. m., y la ficha de Google (vía Wanderlog) dice 9:00 a. m. los miércoles y viernes.
- **Precios.** La pizarra no tiene precios y no se inventaron. Al agregar `price` en `menu-data.js`, el sitio los muestra y el carrito calcula el total.
- **WhatsApp 809-526-2887** para reservas, pedidos y encargos (tiene catálogo de WhatsApp Business).
- **Año de fundación y fundadora o fundador.** No aparecen publicados. «Más de diez años en el Boulevard» es *propuesto*: las primeras reseñas en TripAdvisor son de diciembre de 2014.
- **La misión social.** Las reseñas dicen que el café apoya a mujeres de la comunidad y a un hogar misionero local. Conviene contarlo con sus palabras.
- **Pista de patinaje.** Wanderlog dice que se alquila para eventos y hay fotos de cumpleaños; falta confirmar condiciones, horario y si sigue igual (@skateparkrd).
- **La tiendita** de artesanía y joyería: confirmar que sigue (su Instagram tiene destacados de «Joyería»).
- **Propuestos:** delivery en Juan Dolio, transferencia como forma de pago, encargos con 2 días de antelación, sabores de bizcocho (tomados de la carta: tres leches y cheesecakes), punto de referencia «a pocos pasos del hotel Fior di Loto» (sacado del mapa).
- **Promoción** «tú eliges el desayuno y el café va por la casa» (martes a viernes): publicada en su Instagram en septiembre de 2026; confirmar si sigue vigente.
- **Formas de pago:** TripAdvisor indica efectivo, Visa, Mastercard y Discover; en la puerta hay un adhesivo de Azul.
- **Fotos.** No hay fotos de stock. Las de Instagram están en baja resolución (640 px) y las de TripAdvisor en 720 px: conviene pedir los originales, sobre todo de bizcochos, la bandeja, la pista y el patio.
- **«Patacón con pollo»** no está en la pizarra; se agregó porque es el plato que más recomiendan en las reseñas.

## Siguientes pasos (fase 2)

- Dominio propio (por ejemplo `lecheymiel.do`) y quitar el «no indexar».
- Precios reales en la carta y total automático en el carrito.
- Fotos originales en alta resolución y una sesión del equipo («Nuestra gente»).
- Formularios conectados (correo o Google Sheets) además de WhatsApp.
- QR impreso en las mesas que abra la carta (la página del menú ya está lista para imprimir).
- Sitio completo en inglés revisado por el negocio.
- Delivery con zonas y costos, y enlace al catálogo de WhatsApp.
- Ficha de Google con el sitio y el horario unificados.

## Fuentes y créditos

Las fotos, la carta y la marca pertenecen a Plaza Leche y Miel y se usan solo para presentarle esta propuesta. Datos consultados el 9 de octubre de 2026.

- **Instagram @plazalechemiel** (https://www.instagram.com/plazalechemiel/): horario, teléfono, fotos recientes (bandeja que lo tiene todo, gallepapas, brownie con helado, empanadas, galletas decoradas, patio) y la promoción del café. Carpeta `source/instagram/`.
- **TripAdvisor** «La Plaza Leche & Miel» (https://www.tripadvisor.com/Restaurant_Review-g317145-d8372371): 4.7 con 14 opiniones, n.º 1 de 2 cafeterías en Juan Dolio, dirección (Boulevard de Juan Dolio, km 8), formas de pago, estacionamiento, reseñas citadas (Melissa I., mar. 2026; Balibabs, ene. 2024; Linda F., mar. 2018), las fotos subidas por el negocio y la **foto de la pizarra de la que se transcribió la carta completa**. Carpeta `source/tripadvisor/`.
- **Google Maps** «Plaza Leche Y Miel»: coordenadas 18.4259962, -69.4268211, calificación 4.7.
- **Wanderlog** (https://wanderlog.com/place/details/2903862): resumen de la ficha de Google (159 reseñas) y reseñas de Google citadas (Rob K., ene. 2025; Cherokee P., mar. 2026; Nathan O., feb. 2026), jugo verde (manzana verde, apio, jengibre), patacón con pollo y alquiler de la pista.
- **Facebook** «Plaza Leche Miel» (https://www.facebook.com/1558502284466672/).
- **Mapa estático:** © colaboradores de OpenStreetMap.
- **Mural del hero:** extraído de la foto del salón (`tools/mural.py`).
- **Logo:** redibujado en SVG a partir de la foto de perfil de Instagram (`tools/brand.py`).
- **Tipografías:** Newsreader, Hanken Grotesk y Yellowtail (SIL Open Font License), alojadas en el sitio.
- **Colores:** pizarra de la carta, pared del mural, verde oliva de sus publicaciones, tarro de miel, mostrador azul y pared de ladrillo del salón.
