/*
 * main.js · navegación, idioma, estado abierto/cerrado, reservas, barra móvil,
 * carrusel, mapa bajo demanda y visor de fotos.
 *
 * Prueba de horarios: agrega ?simular=2026-10-11T20:45 a la URL para ver el
 * estado como si fuera esa hora en Santo Domingo.
 */
(() => {
  "use strict";
  const S = window.SITE;
  const EN = window.I18N_EN || {};
  const params = new URLSearchParams(location.search);
  document.documentElement.classList.add("js");

  /* ---------------- Almacenamiento seguro ---------------- */
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* modo privado */ } }
  };

  /* ---------------- Idioma ---------------- */
  let lang = params.get("lang");
  if (lang === "en" || lang === "es") store.set("lm-lang", lang);
  else lang = store.get("lm-lang") === "en" ? "en" : "es";
  const t = (key, es) => (lang === "en" && EN[key] != null ? EN[key] : es);

  /* ---------------- Hora en Santo Domingo ---------------- */
  const DOWS = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  function nowSD() {
    const sim = (params.get("simular") || "").match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
    if (sim) {
      const d = new Date(Date.UTC(+sim[1], sim[2] - 1, +sim[3]));
      return { y: +sim[1], m: +sim[2], d: +sim[3], dow: d.getUTCDay(), min: +sim[4] * 60 + +sim[5] };
    }
    const f = new Intl.DateTimeFormat("en-US", {
      timeZone: S.timezone, year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", hourCycle: "h23", weekday: "short"
    });
    const p = Object.fromEntries(f.formatToParts(new Date()).map((x) => [x.type, x.value]));
    return { y: +p.year, m: +p.month, d: +p.day, dow: DOWS[p.weekday], min: (+p.hour % 24) * 60 + +p.minute };
  }
  const pad = (n) => String(n).padStart(2, "0");
  const toMin = (s) => { const [h, m] = s.split(":").map(Number); return h * 60 + m; };
  const dateStr = (o) => `${o.y}-${pad(o.m)}-${pad(o.d)}`;
  const parseDate = (s) => { const [y, m, d] = s.split("-").map(Number); return new Date(Date.UTC(y, m - 1, d)); };
  const addDays = (s, n) => { const d = parseDate(s); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };

  /* Turnos del día en minutos; si cierra después de medianoche, el cierre pasa de 1440 */
  function shifts(dow) {
    return (S.hours[dow] || []).map(([o, c]) => {
      const a = toMin(o); let b = toMin(c);
      if (b <= a) b += 1440;
      return [a, b];
    });
  }

  /* Formato dominicano: 7:00 a. m. · 9:30 p. m. (espacios que no se parten) */
  function fmtTime(min) {
    const h = Math.floor(min / 60) % 24, m = min % 60, h12 = h % 12 || 12;
    const suf = lang === "en" ? (h < 12 ? "a.m." : "p.m.") : (h < 12 ? "a. m." : "p. m.");
    return `${h12}:${pad(m)} ${suf}`;
  }
  const art = (min) => (Math.floor(min / 60) % 12 === 1 ? "la" : "las");
  const DAYS_ES = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
  const DAYS_EN = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  function computeStatus(n = nowSD()) {
    const open = (closeAt) => {
      const left = closeAt - n.min;
      return { state: left <= 30 ? "soon" : "open", closeAt: closeAt % 1440 };
    };
    // Turno de ayer que cruza la medianoche
    for (const [, b] of shifts((n.dow + 6) % 7)) if (b > 1440 && n.min < b - 1440) return open(b - 1440);
    for (const [a, b] of shifts(n.dow)) if (n.min >= a && n.min < b) return open(b);
    for (const [a] of shifts(n.dow)) if (a > n.min) return { state: "closed", when: "today", at: a };
    for (let k = 1; k <= 7; k++) {
      const d = (n.dow + k) % 7, s = shifts(d);
      if (s.length) return { state: "closed", when: k === 1 ? "tomorrow" : "day", day: d, at: s[0][0] };
    }
    return { state: "closed", when: "never" };
  }

  function statusText(st) {
    if (lang === "en") {
      if (st.state === "open") return `Open now · until ${fmtTime(st.closeAt)}`;
      if (st.state === "soon") return `Closing soon · at ${fmtTime(st.closeAt)}`;
      if (st.when === "today") return `Opens today at ${fmtTime(st.at)}`;
      if (st.when === "tomorrow") return `Opens tomorrow at ${fmtTime(st.at)}`;
      if (st.when === "day") return `Opens ${DAYS_EN[st.day]} at ${fmtTime(st.at)}`;
      return "Closed";
    }
    if (st.state === "open") return `Abierto ahora · hasta ${art(st.closeAt)} ${fmtTime(st.closeAt)}`;
    if (st.state === "soon") return `Cierra pronto · a ${art(st.closeAt)} ${fmtTime(st.closeAt)}`;
    if (st.when === "today") return `Abre hoy a ${art(st.at)} ${fmtTime(st.at)}`;
    if (st.when === "tomorrow") return `Abre mañana a ${art(st.at)} ${fmtTime(st.at)}`;
    if (st.when === "day") return `Abre el ${DAYS_ES[st.day]} a ${art(st.at)} ${fmtTime(st.at)}`;
    return "Cerrado";
  }

  /* Horas disponibles para una fecha (cada 30 min, hasta `until` min antes del cierre) */
  function slotsFor(ds, { lead = 30, until = 60, step = 30 } = {}) {
    const n = nowSD(), today = dateStr(n);
    if (ds < today) return [];
    const dow = parseDate(ds).getUTCDay();
    const out = [];
    for (const [a, b] of shifts(dow)) {
      for (let m = a; m <= b - until; m += step) {
        if (ds === today && m < n.min + lead) continue;
        out.push(m);
      }
    }
    return out;
  }

  function fmtDate(ds) {
    return new Intl.DateTimeFormat(lang === "en" ? "en-US" : "es-DO", {
      weekday: "long", day: "numeric", month: "long", timeZone: "UTC"
    }).format(parseDate(ds));
  }

  const wa = (msg) => `https://wa.me/${S.whatsapp}?text=${encodeURIComponent(msg)}`;
  const openWa = (msg) => { window.open(wa(msg), "_blank", "noopener"); };

  /* Validación accesible: marca el campo y escribe el error junto a él */
  function setError(input, msg) {
    const err = document.getElementById(input.getAttribute("aria-describedby")?.split(" ").find((id) => id.endsWith("-err")) || "");
    input.setAttribute("aria-invalid", msg ? "true" : "false");
    if (err) err.textContent = msg || "";
  }

  /* Llena un <select> de horas */
  function fillHours(select, ds, opts, placeholder) {
    const slots = ds ? slotsFor(ds, opts) : [];
    select.innerHTML = "";
    if (!ds) { select.append(new Option(placeholder || t("res.eligefecha", "Elige la fecha primero"), "")); return slots; }
    if (!slots.length) { select.append(new Option(t("res.sinhoras", "No hay horas disponibles ese día"), "")); return slots; }
    slots.forEach((m) => select.append(new Option(fmtTime(m).replace(/ /g, " "), fmtTime(m).replace(/ /g, " "))));
    return slots;
  }

  /* Primer día (desde hoy + offset) con horas disponibles */
  function firstOpenDate(offset = 0, opts) {
    let ds = addDays(dateStr(nowSD()), offset);
    for (let i = 0; i < 14; i++) { if (slotsFor(ds, opts).length) return ds; ds = addDays(ds, 1); }
    return ds;
  }

  /* ---------------- Diálogos ---------------- */
  function openDialog(id) {
    const dlg = typeof id === "string" ? document.getElementById(id) : id;
    if (!dlg || dlg.open) return dlg;
    dlg.showModal();
    document.body.classList.add("has-dialog");
    return dlg;
  }
  function wireDialog(dlg) {
    dlg.addEventListener("close", () => {
      if (!document.querySelector("dialog[open]")) document.body.classList.remove("has-dialog");
    });
    // Tocar el fondo cierra
    dlg.addEventListener("click", (e) => { if (e.target === dlg) dlg.close(); });
    dlg.querySelectorAll("[data-close]").forEach((b) => b.addEventListener("click", () => dlg.close()));
  }

  window.LM = { lang, t, store, nowSD, dateStr, addDays, parseDate, fmtTime, fmtDate, slotsFor, fillHours, firstOpenDate, computeStatus, wa, openWa, setError, openDialog };

  /* ======================================================================
     Todo lo que toca el DOM, después de que corren los demás scripts
     ====================================================================== */
  document.addEventListener("DOMContentLoaded", () => {
    applyLang();
    initStatus();
    initHeader();
    initBottomBar();
    document.querySelectorAll("dialog").forEach(wireDialog);
    document.querySelectorAll("[data-open]").forEach((b) => b.addEventListener("click", () => {
      if (b.dataset.open === "reservar") prepReserva();
      openDialog(b.dataset.open);
    }));
    document.querySelectorAll("[data-open-sheet]").forEach((b) => b.addEventListener("click", () => openDialog("hoja-nav")));
    initReserva();
    document.querySelectorAll("[data-carousel]").forEach(initCarousel);
    initMap();
    initGallery();
    initReveal();
  });

  function applyLang() {
    document.documentElement.lang = lang === "en" ? "en" : "es-DO";
    if (lang === "en") {
      document.querySelectorAll("[data-i18n]").forEach((el) => { const v = EN[el.dataset.i18n]; if (v != null) el.textContent = v; });
      document.querySelectorAll("[data-i18n-html]").forEach((el) => { const v = EN[el.dataset.i18nHtml]; if (v != null) el.innerHTML = v; });
      document.querySelectorAll("[data-i18n-aria]").forEach((el) => { const v = EN[el.dataset.i18nAria]; if (v != null) el.setAttribute("aria-label", v); });
      document.querySelectorAll("[data-i18n-ph]").forEach((el) => { const v = EN[el.dataset.i18nPh]; if (v != null) el.placeholder = v; });
      document.querySelectorAll(".hours td").forEach((td) => { if (td.textContent.trim() === "Cerrado") td.textContent = "Closed"; });
      // Los enlaces internos conservan el idioma para compartirlos
      document.querySelectorAll('a[href$=".html"]').forEach((a) => {
        const u = new URL(a.getAttribute("href"), location.href);
        if (u.origin === location.origin) { u.searchParams.set("lang", "en"); a.href = u.pathname + u.search + u.hash; }
      });
    }
    document.querySelectorAll("[data-lang-toggle]").forEach((a) => {
      const other = lang === "en" ? "es" : "en";
      a.href = `?lang=${other}${location.hash}`;
      a.hreflang = other; a.lang = other;
      a.textContent = a.textContent.trim().length > 2 ? (other === "en" ? "English" : "Español") : other.toUpperCase();
      a.setAttribute("aria-label", other === "en" ? "View this site in English" : "Ver el sitio en español");
    });
    document.querySelectorAll("[data-wa-generic]").forEach((a) => {
      a.href = wa(t("wa.hola", "¡Hola, Leche + Miel! Les escribo desde su página web."));
    });
    document.querySelectorAll("[data-wa-msg]").forEach((a) => {
      a.href = wa(t(a.dataset.waMsg, a.dataset.waMsg === "cierre.msg" ? "¡Hola! ¿Me apartan un pedazo de tres leches para hoy?" : ""));
    });
  }

  function initStatus() {
    const update = () => {
      const st = computeStatus();
      const txt = statusText(st);
      document.querySelectorAll("[data-status]").forEach((el) => {
        el.classList.remove("is-open", "is-soon", "is-closed");
        el.classList.add(st.state === "open" ? "is-open" : st.state === "soon" ? "is-soon" : "is-closed");
        el.querySelector(".status__text").textContent = txt;
      });
      const dow = nowSD().dow;
      document.querySelectorAll("[data-hours] tr").forEach((tr) => {
        const today = +tr.dataset.day === dow;
        tr.classList.toggle("is-today", today);
        const th = tr.querySelector("th");
        if (today) { th.dataset.hoy = t("hoy", "hoy"); tr.setAttribute("aria-current", "date"); }
        else tr.removeAttribute("aria-current");
      });
    };
    update();
    setInterval(update, 60000);
  }

  function initHeader() {
    const h = document.querySelector("[data-header]");
    if (!h) return;
    const on = () => h.classList.toggle("is-scrolled", window.scrollY > 8);
    on();
    window.addEventListener("scroll", on, { passive: true });
  }

  /* Barra inferior: se oculta al bajar y vuelve al subir o al llegar al final */
  function initBottomBar() {
    const bar = document.querySelector("[data-bottombar]");
    if (!bar) return;
    let last = window.scrollY, ticking = false;
    const check = () => {
      const y = window.scrollY;
      const atEnd = window.innerHeight + y >= document.documentElement.scrollHeight - 80;
      if (atEnd || y < 120) bar.classList.remove("is-hidden");
      else if (y > last + 6) bar.classList.add("is-hidden");
      else if (y < last - 6) bar.classList.remove("is-hidden");
      last = y; ticking = false;
    };
    window.addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(check); } }, { passive: true });
  }

  /* ---------------- Reservas por WhatsApp ---------------- */
  function prepReserva() {
    const f = document.querySelector("[data-reserva]");
    if (!f) return;
    const today = dateStr(nowSD());
    f.fecha.min = today;
    f.fecha.max = addDays(today, 90);
    if (!f.fecha.value || f.fecha.value < today) f.fecha.value = firstOpenDate(0);
    fillHours(f.hora, f.fecha.value);
  }
  function initReserva() {
    const f = document.querySelector("[data-reserva]");
    if (!f) return;
    f.fecha.addEventListener("change", () => { fillHours(f.hora, f.fecha.value); setError(f.fecha, ""); checkDate(); });
    const checkDate = () => {
      const today = dateStr(nowSD()), v = f.fecha.value;
      if (!v) return setError(f.fecha, t("err.fecha", "Elige una fecha.")), false;
      if (v < today) return setError(f.fecha, t("err.pasada", "Esa fecha ya pasó. Elige hoy o un día próximo.")), false;
      if (!shifts(parseDate(v).getUTCDay()).length) return setError(f.fecha, t("err.cerrado", "Ese día estamos cerrados. Elige otro.")), false;
      if (!slotsFor(v).length) return setError(f.fecha, t("err.tarde", "Para hoy ya no quedan horas. Elige otro día.")), false;
      setError(f.fecha, ""); return true;
    };
    f.nombre.addEventListener("input", () => setError(f.nombre, ""));
    f.hora.addEventListener("change", () => setError(f.hora, ""));
    f.addEventListener("submit", (e) => {
      e.preventDefault();
      const bad = [];
      if (!checkDate()) bad.push(f.fecha);
      if (!f.hora.value) { setError(f.hora, t("err.hora", "Elige una hora.")); bad.push(f.hora); }
      if (f.nombre.value.trim().length < 2) { setError(f.nombre, t("err.nombre", "Escribe tu nombre para la reserva.")); bad.push(f.nombre); }
      if (bad.length) { bad[0].focus(); return; }
      const sel = (s) => s.options[s.selectedIndex].text;
      const msg = lang === "en"
        ? `Hi, Leche + Miel! I'd like to book a table:\n\n• Date: ${fmtDate(f.fecha.value)}\n• Time: ${f.hora.value}\n• Guests: ${sel(f.personas)}\n• Where: ${sel(f.area)}\n• Occasion: ${sel(f.ocasion)}\n• Name: ${f.nombre.value.trim()}\n\nCould you confirm, please? Thank you!`
        : `¡Hola, Leche + Miel! Quiero reservar una mesa:\n\n• Fecha: ${fmtDate(f.fecha.value)}\n• Hora: ${f.hora.value}\n• Personas: ${sel(f.personas)}\n• Dónde: ${sel(f.area)}\n• Ocasión: ${sel(f.ocasion)}\n• Nombre: ${f.nombre.value.trim()}\n\n¿Me confirman, por favor? ¡Gracias!`;
      openWa(msg);
      f.closest("dialog").close();
    });
  }

  /* ---------------- Carrusel ---------------- */
  function initCarousel(root) {
    const track = root.querySelector(".carousel__track");
    const bar = root.querySelector(".carousel__bar span");
    const prev = root.querySelector("[data-prev]"), next = root.querySelector("[data-next]");
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const update = () => {
      const max = track.scrollWidth - track.clientWidth;
      const ratio = track.scrollWidth ? track.clientWidth / track.scrollWidth : 1;
      const prog = max > 0 ? track.scrollLeft / max : 0;
      if (bar) { bar.style.width = `${Math.min(100, ratio * 100)}%`; bar.style.transform = `translateX(${prog * (1 / ratio - 1) * 100}%)`; }
      if (prev) prev.disabled = track.scrollLeft <= 2;
      if (next) next.disabled = track.scrollLeft >= max - 2;
    };
    const go = (dir) => track.scrollBy({ left: dir * track.clientWidth, behavior: reduce ? "auto" : "smooth" });
    prev && prev.addEventListener("click", () => go(-1));
    next && next.addEventListener("click", () => go(1));
    track.addEventListener("scroll", () => requestAnimationFrame(update), { passive: true });
    window.addEventListener("resize", update);
    update();
    // Arrastre con el mouse en escritorio
    let down = false, startX = 0, startLeft = 0, moved = false;
    track.addEventListener("pointerdown", (e) => {
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      down = true; moved = false; startX = e.clientX; startLeft = track.scrollLeft;
    });
    window.addEventListener("pointermove", (e) => {
      if (!down) return;
      const dx = e.clientX - startX;
      if (!moved && Math.abs(dx) > 5) { moved = true; track.classList.add("is-dragging"); }
      if (moved) track.scrollLeft = startLeft - dx;
    });
    window.addEventListener("pointerup", () => {
      if (!down) return;
      down = false;
      if (moved) {
        // Al soltar, se ajusta a la tarjeta más cercana
        const card = track.firstElementChild;
        const w = card ? card.getBoundingClientRect().width + parseFloat(getComputedStyle(track).columnGap || 0) : 1;
        const target = Math.round(track.scrollLeft / w) * w;
        track.classList.remove("is-dragging");
        track.scrollTo({ left: target, behavior: reduce ? "auto" : "smooth" });
      }
    });
    track.addEventListener("click", (e) => { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } }, true);
    track.addEventListener("dragstart", (e) => e.preventDefault());
  }

  /* ---------------- Mapa bajo demanda ---------------- */
  function initMap() {
    document.querySelectorAll("[data-map-load]").forEach((btn) => btn.addEventListener("click", () => {
      const fig = btn.closest("[data-map]");
      const ifr = document.createElement("iframe");
      ifr.src = fig.dataset.map;
      ifr.title = t("ubi.iframe", "Mapa de Google con la ubicación de Plaza Leche y Miel");
      ifr.loading = "lazy";
      ifr.referrerPolicy = "no-referrer-when-downgrade";
      ifr.allowFullscreen = true;
      fig.innerHTML = "";
      fig.append(ifr);
    }));
  }

  /* ---------------- Galería: filtros y visor ---------------- */
  function initGallery() {
    const grid = document.querySelector("[data-gallery]");
    const dlg = document.getElementById("visor");
    if (!grid || !dlg) return;
    const img = dlg.querySelector("[data-lb-img]"), cap = dlg.querySelector("[data-lb-cap]"), count = dlg.querySelector("[data-lb-count]");
    let list = [], i = 0;
    const visible = () => [...grid.querySelectorAll("li:not([hidden]) button")];
    const show = (k) => {
      i = (k + list.length) % list.length;
      const b = list[i], name = b.dataset.full, info = (window.IMG || {})[name];
      const ws = info ? info.widths : [800];
      img.src = `assets/img/${name}-${ws[ws.length - 1]}.webp`;
      img.srcset = ws.map((w) => `assets/img/${name}-${w}.webp ${w}w`).join(", ");
      img.sizes = "100vw";
      if (info) { img.width = info.w; img.height = info.h; }
      img.alt = b.querySelector("img").alt;
      cap.textContent = b.dataset.cap || "";
      count.textContent = `${i + 1} / ${list.length}`;
    };
    grid.addEventListener("click", (e) => {
      const b = e.target.closest("button[data-full]");
      if (!b) return;
      list = visible();
      openDialog(dlg);
      show(list.indexOf(b));
    });
    dlg.querySelector("[data-lb-prev]").addEventListener("click", () => show(i - 1));
    dlg.querySelector("[data-lb-next]").addEventListener("click", () => show(i + 1));
    dlg.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") { e.preventDefault(); show(i - 1); }
      if (e.key === "ArrowRight") { e.preventDefault(); show(i + 1); }
    });
    // Deslizar con el dedo
    const stage = dlg.querySelector("[data-lb-stage]");
    let sx = null, sy = 0;
    stage.addEventListener("pointerdown", (e) => { sx = e.clientX; sy = e.clientY; });
    stage.addEventListener("pointerup", (e) => {
      if (sx == null) return;
      const dx = e.clientX - sx, dy = Math.abs(e.clientY - sy);
      if (Math.abs(dx) > 50 && dy < 80) show(i + (dx < 0 ? 1 : -1));
      sx = null;
    });
    stage.addEventListener("click", (e) => { if (e.target === stage) dlg.close(); });

    const chips = document.querySelector("[data-gal-filters]");
    if (chips) chips.addEventListener("click", (e) => {
      const c = e.target.closest("[data-gal-filter]");
      if (!c) return;
      chips.querySelectorAll(".chip").forEach((x) => x.setAttribute("aria-pressed", String(x === c)));
      const f = c.dataset.galFilter;
      grid.querySelectorAll("li").forEach((li) => { li.hidden = !!f && li.dataset.cat !== f; });
      grid.classList.toggle("gallery--wide", !f);
    });
  }

  /* ---------------- Aparición sutil ---------------- */
  function initReveal() {
    const els = document.querySelectorAll("[data-reveal]");
    if (!("IntersectionObserver" in window)) { els.forEach((el) => el.classList.add("is-in")); return; }
    const io = new IntersectionObserver((entries) => entries.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); }
    }), { rootMargin: "0px 0px -8% 0px" });
    els.forEach((el) => io.observe(el));
  }
})();
