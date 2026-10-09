/*
 * Datos del negocio: ÚNICO lugar para nombre, teléfono, WhatsApp, dirección,
 * coordenadas, horario y SITE_URL. El build (tools/build.py) también lee este
 * archivo para la canonical, Open Graph, JSON-LD y el QR.
 *
 * Importante: el objeto va en JSON estricto (claves con comillas, sin comas
 * al final) para que Python lo pueda leer.
 *
 * Horario: 0 = domingo … 6 = sábado. Cada día es una lista de turnos
 * ["abre", "cierra"] en 24 h. Si "cierra" es menor que "abre" (por ejemplo
 * ["18:00", "01:00"]), el turno termina después de medianoche.
 */
window.SITE = {
  "SITE_URL": "https://jonasjavier.github.io/plaza-leche-y-miel/",
  "name": "Plaza Leche y Miel",
  "brand": "leche + miel",
  "tagline": "Pastelería, café y desayunos en Juan Dolio",
  "phone": "+18095262887",
  "phoneDisplay": "809-526-2887",
  "whatsapp": "18095262887",
  "catalog": "https://wa.me/c/18095262887",
  "instagram": "https://www.instagram.com/plazalechemiel/",
  "instagramHandle": "@plazalechemiel",
  "facebook": "https://www.facebook.com/1558502284466672/",
  "tripadvisor": "https://www.tripadvisor.com/Restaurant_Review-g317145-d8372371-Reviews-La_Plaza_Leche_Miel-Juan_Dolio_San_Pedro_de_Macoris_Province_Dominican_Republic.html",
  "address": {
    "street": "Boulevard de Juan Dolio, km 8",
    "locality": "Juan Dolio",
    "region": "San Pedro de Macorís",
    "postalCode": "21000",
    "country": "DO",
    "reference": "En el Boulevard, a pocos pasos del hotel Fior di Loto"
  },
  "geo": { "lat": 18.4259962, "lng": -69.4268211 },
  "mapsDirections": "https://www.google.com/maps/dir/?api=1&destination=18.4259962,-69.4268211",
  "mapsPlace": "https://www.google.com/maps/search/?api=1&query=Plaza+Leche+Y+Miel+Juan+Dolio",
  "waze": "https://waze.com/ul?ll=18.4259962,-69.4268211&navigate=yes",
  "mapEmbed": "https://www.google.com/maps?q=Plaza+Leche+Y+Miel,+Juan+Dolio&ll=18.4259962,-69.4268211&z=17&output=embed",
  "timezone": "America/Santo_Domingo",
  "hours": {
    "0": [["08:00", "21:00"]],
    "1": [],
    "2": [["08:00", "19:00"]],
    "3": [["08:00", "19:00"]],
    "4": [["08:00", "19:00"]],
    "5": [["08:00", "21:00"]],
    "6": [["08:00", "21:00"]]
  },
  "rating": {
    "tripadvisor": { "value": 4.7, "count": 14, "checked": "2026-10-09" },
    "google": { "value": 4.7, "count": 159, "checked": "2026-10-09" }
  }
};
