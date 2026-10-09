/*
 * encargos.js · "Encárgalo con dedicatoria": el cliente elige qué encargar,
 * escribe la dedicatoria y la ve en vivo en la tarjetita redonda de la casa.
 * El encargo y la cotización de eventos salen por WhatsApp.
 */
(() => {
  "use strict";
  const LM = window.LM, IMG = window.IMG || {};
  if (!LM) return;
  const t = LM.t, en = LM.lang === "en";
  const LEAD_DAYS = 2; // días de antelación para encargos (propuesto, ver README)

  const KINDS = {
    bizcocho: { img: "bizcocho-frutas", es: "Bizcocho de celebración", en: "Celebration cake", alt: "Bizcocho decorado con frutas" },
    bandeja: { img: "bandeja", es: "La bandeja que lo tiene todo", en: "The everything breakfast tray", alt: "Bandeja de desayuno con waffle, croquetas y café" },
    galletas: { img: "galletas-vintage", es: "Galletas decoradas", en: "Decorated cookies", alt: "Galletas decoradas" },
    picaderas: { img: "empanadas", es: "Picaderas para evento", en: "Party platters", alt: "Empanadas doradas" }
  };

  const f = document.querySelector("[data-encargo]");
  if (f) {
    const prevImg = document.querySelector("[data-prev-img]");
    const tag = document.querySelector("[data-tag]");
    const tagTxts = document.querySelectorAll("[data-tag-txt]");
    const msgEl = document.querySelector("[data-prev-msg]");
    const dediN = document.querySelector("[data-dedi-n]");
    const kind = () => f.tipo.value;
    const placeholder = () => f.dedicatoria.placeholder || "¡Feliz día, mamá!";

    const today = LM.dateStr(LM.nowSD());
    f.fecha.min = LM.addDays(today, LEAD_DAYS);
    f.fecha.max = LM.addDays(today, 180);
    f.fecha.value = LM.firstOpenDate(LEAD_DAYS);
    const hourOpts = { lead: 0, until: 30, step: 30 };
    LM.fillHours(f.hora, f.fecha.value, hourOpts);

    function setKind() {
      const k = kind(), info = KINDS[k], im = IMG[info.img];
      f.querySelectorAll("[data-for]").forEach((el) => { el.hidden = !el.dataset.for.split(" ").includes(k); });
      if (im) {
        prevImg.srcset = im.widths.map((w) => `assets/img/${info.img}-${w}.webp ${w}w`).join(", ");
        prevImg.src = `assets/img/${info.img}-${im.widths[im.widths.length - 1]}.webp`;
        prevImg.width = im.w; prevImg.height = im.h;
      }
      prevImg.alt = info.alt;
      tag.hidden = k === "picaderas";
      render();
    }

    function details() {
      const k = kind(), L = [];
      const sel = (s) => s.options[s.selectedIndex].text;
      if (k === "bizcocho") { L.push(`${en ? "Flavor" : "Sabor"}: ${sel(f.sabor)}`, `${en ? "Servings" : "Porciones"}: ${sel(f.porciones)}`); }
      if (k === "bandeja") { const r = f.querySelector('input[name="bandeja"]:checked'); L.push(`${en ? "Size" : "Tamaño"}: ${r.nextElementSibling.textContent}`); }
      if (k === "galletas") { L.push(`${en ? "Quantity" : "Cantidad"}: ${sel(f.cantidad)}`); if (f.tema.value.trim()) L.push(`${en ? "Theme" : "Tema"}: ${f.tema.value.trim()}`); }
      if (k === "picaderas") {
        const p = [...f.querySelectorAll('input[name="picaderas"]:checked')].map((c) => c.nextElementSibling.textContent);
        L.push(`${en ? "Platters" : "Picaderas"}: ${p.join(", ") || "—"}`, `${en ? "Guests" : "Invitados"}: ${sel(f.invitados)}`);
      }
      if (k !== "picaderas" && f.dedicatoria.value.trim()) L.push(`${en ? "Message" : "Dedicatoria"}: “${f.dedicatoria.value.trim()}”`);
      if (f.fecha.value) L.push(`${en ? "Date" : "Fecha"}: ${LM.fmtDate(f.fecha.value)}`);
      if (f.hora.value) L.push(`${en ? "Pickup time" : "Hora de recogida"}: ${f.hora.value}`);
      if (f.nombre.value.trim()) L.push(`${en ? "Name" : "Nombre"}: ${f.nombre.value.trim()}`);
      if (f.nota.value.trim()) L.push(`${en ? "Note" : "Nota"}: ${f.nota.value.trim()}`);
      return L;
    }
    function message() {
      const what = en ? KINDS[kind()].en : KINDS[kind()].es;
      const head = en ? `Hi, Leche + Miel! I'd like to order: ${what}.` : `¡Hola, Leche + Miel! Quiero encargar: ${what}.`;
      const tail = en ? "Could you confirm availability and price? Thank you!" : "¿Me confirman disponibilidad y precio? ¡Gracias!";
      return `${head}\n\n${details().map((l) => "• " + l).join("\n")}\n\n${tail}`;
    }
    let typing;
    function render() {
      const v = f.dedicatoria.value.trim();
      tagTxts.forEach((el) => (el.textContent = v || placeholder()));
      dediN.textContent = f.dedicatoria.value.length;
      msgEl.textContent = message();
    }
    f.addEventListener("change", (e) => {
      if (e.target.name === "tipo") setKind();
      if (e.target === f.fecha) { LM.fillHours(f.hora, f.fecha.value, hourOpts); checkDate(); }
      if (e.target === f.hora) LM.setError(f.hora, "");
      render();
    });
    f.addEventListener("input", (e) => {
      if (e.target === f.dedicatoria) {
        tag.classList.add("is-typing");
        clearTimeout(typing);
        typing = setTimeout(() => tag.classList.remove("is-typing"), 400);
      }
      if (e.target === f.nombre) LM.setError(f.nombre, "");
      render();
    });

    function checkDate() {
      const v = f.fecha.value, min = f.fecha.min;
      if (!v) return LM.setError(f.fecha, t("err.fecha", "Elige una fecha.")), false;
      if (v < min) return LM.setError(f.fecha, t("err.antelacion", "Los encargos se hacen con al menos 2 días de antelación.")), false;
      if (!LM.slotsFor(v, hourOpts).length) return LM.setError(f.fecha, t("err.cerrado", "Ese día estamos cerrados. Elige otro.")), false;
      LM.setError(f.fecha, ""); return true;
    }

    f.addEventListener("submit", (e) => {
      e.preventDefault();
      const bad = [];
      if (!checkDate()) bad.push(f.fecha);
      if (!f.hora.value) { LM.setError(f.hora, t("err.hora", "Elige una hora.")); bad.push(f.hora); }
      const picErr = document.getElementById("e-pic-err");
      picErr.textContent = "";
      if (kind() === "picaderas" && !f.querySelector('input[name="picaderas"]:checked')) {
        picErr.textContent = t("err.picaderas", "Elige al menos una picadera.");
        bad.push(f.querySelector('input[name="picaderas"]'));
      }
      if (f.nombre.value.trim().length < 2) { LM.setError(f.nombre, t("err.nombre3", "Escribe tu nombre para el encargo.")); bad.push(f.nombre); }
      if (bad.length) { bad[0].focus(); return; }
      LM.openWa(message());
    });

    setKind();
    // Cuando main.js aplica el inglés, se actualizan textos y vista previa
    document.addEventListener("DOMContentLoaded", render);
  }

  /* ---------------- Cotización de eventos ---------------- */
  const ev = document.querySelector("[data-evento]");
  if (ev) {
    const today = LM.dateStr(LM.nowSD());
    ev.fecha.min = LM.addDays(today, LEAD_DAYS);
    ev.fecha.max = LM.addDays(today, 365);
    ev.fecha.addEventListener("change", () => LM.setError(ev.fecha, ""));
    ev.nombre.addEventListener("input", () => LM.setError(ev.nombre, ""));
    ev.addEventListener("submit", (e) => {
      e.preventDefault();
      const bad = [];
      if (!ev.fecha.value) { LM.setError(ev.fecha, t("err.fecha", "Elige una fecha.")); bad.push(ev.fecha); }
      else if (ev.fecha.value < ev.fecha.min) { LM.setError(ev.fecha, t("err.antelacion", "Los encargos se hacen con al menos 2 días de antelación.")); bad.push(ev.fecha); }
      if (ev.nombre.value.trim().length < 2) { LM.setError(ev.nombre, t("err.nombre4", "Escribe tu nombre para la cotización.")); bad.push(ev.nombre); }
      if (bad.length) { bad[0].focus(); return; }
      const sel = (s) => s.options[s.selectedIndex].text;
      const extras = [...ev.querySelectorAll('input[name="extras"]:checked')].map((c) => c.nextElementSibling.textContent).join(", ") || "—";
      const msg = en
        ? `Hi, Leche + Miel! I'd like a quote for an event:\n\n• Event: ${sel(ev.tipo)}\n• Date: ${LM.fmtDate(ev.fecha.value)}\n• Guests: ${sel(ev.invitados)}\n• Space: ${sel(ev.espacio)}\n• I need: ${extras}\n• Name: ${ev.nombre.value.trim()}\n\nThank you!`
        : `¡Hola, Leche + Miel! Quiero cotizar un evento:\n\n• Evento: ${sel(ev.tipo)}\n• Fecha: ${LM.fmtDate(ev.fecha.value)}\n• Invitados: ${sel(ev.invitados)}\n• Espacio: ${sel(ev.espacio)}\n• Necesito: ${extras}\n• Nombre: ${ev.nombre.value.trim()}\n\n¡Gracias!`;
      LM.openWa(msg);
    });
  }
})();
