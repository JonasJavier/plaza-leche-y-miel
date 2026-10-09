/*
 * menu.js · carta interactiva (búsqueda, filtros, categorías), pedido por
 * WhatsApp y el carrusel "Lo que más se pide" del inicio.
 * Los datos vienen de menu-data.js.
 */
(() => {
  "use strict";
  const M = window.MENU, IMG = window.IMG || {}, LM = window.LM;
  if (!M || !LM) return;
  const en = LM.lang === "en";
  const t = LM.t;
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const norm = (s) => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
  const name = (it) => (en && it.en ? it.en : it.name);
  const desc = (it) => (en ? it.desc_en || it.desc : it.desc) || "";
  const tagLabel = (k) => (M.tags[k] ? (en ? M.tags[k].en : M.tags[k].es) : k);
  const money = (n) => `RD$ ${Number(n).toLocaleString("es-DO")}`;
  const priceOf = (it) => (it.price != null ? it.price : it.sizes ? it.sizes[0][1] : null);

  const ALL = [];
  M.categories.forEach((c) => c.items.forEach((it) => ALL.push({ ...it, cat: c })));
  const byId = Object.fromEntries(ALL.map((it) => [it.id, it]));

  function img(nameImg, sizes, alt = "") {
    const info = IMG[nameImg];
    if (!info) return "";
    const srcset = info.widths.map((w) => `assets/img/${nameImg}-${w}.webp ${w}w`).join(", ");
    return `<img src="assets/img/${nameImg}-${info.widths[0]}.webp" srcset="${srcset}" sizes="${sizes}" width="${info.w}" height="${info.h}" alt="${esc(alt)}" loading="lazy" decoding="async">`;
  }

  /* ---------------- Carrusel del inicio ---------------- */
  const favs = document.querySelector("[data-favs]");
  if (favs) {
    favs.innerHTML = ALL.filter((it) => it.fav).map((it) => {
      const p = priceOf(it);
      const tag = p != null
        ? `<span class="dish__tag dish__tag--price">${money(p)}</span>`
        : it.tags && it.tags.length ? `<span class="dish__tag">${esc(tagLabel(it.tags[0]))}</span>` : "";
      const media = it.photo
        ? img(it.photo, "(min-width: 1280px) 290px, (min-width: 1024px) 31vw, (min-width: 640px) 44vw, 74vw", name(it))
        : `<div class="dish__type"><span>${esc(name(it))}<small>${esc(en ? it.cat.en : it.cat.name)}</small></span></div>`;
      return `<li><a class="dish" href="menu.html${en ? "?lang=en" : ""}#item-${it.id}">
        <div class="dish__media">${media}${tag}</div>
        <div class="dish__body"><h3 class="dish__name">${esc(name(it))}</h3><p class="dish__desc">${esc(desc(it) || (en ? it.cat.en : it.cat.name))}</p></div>
      </a></li>`;
    }).join("");
  }

  /* ---------------- Página del menú ---------------- */
  const root = document.querySelector("[data-menu]");
  if (!root) return;

  /* Pedido guardado en el teléfono */
  let cart = {};
  try { cart = JSON.parse(LM.store.get("lm-pedido") || "{}") || {}; } catch (e) { cart = {}; }
  Object.keys(cart).forEach((id) => { if (!byId[id] || !(cart[id] > 0)) delete cart[id]; });
  const saveCart = () => LM.store.set("lm-pedido", JSON.stringify(cart));
  const count = () => Object.values(cart).reduce((a, b) => a + b, 0);

  function side(it) {
    const q = cart[it.id] || 0;
    const p = priceOf(it);
    const price = p != null ? `<span class="item__price">${money(p)}</span>` : "";
    if (!q) return `${price}<button class="add-btn" type="button" data-add="${it.id}" aria-label="${esc(t("menu.agregar", "Agregar") + " " + name(it))}"><svg aria-hidden="true"><use href="#i-plus"/></svg></button>`;
    return `${price}<span class="stepper" role="group" aria-label="${esc(name(it))}">
      <button type="button" data-dec="${it.id}" aria-label="${esc(t("menu.quitar", "Quitar uno"))}"><svg aria-hidden="true"><use href="#i-minus"/></svg></button>
      <output aria-live="polite">${q}</output>
      <button type="button" data-inc="${it.id}" aria-label="${esc(t("menu.otro", "Agregar otro"))}"><svg aria-hidden="true"><use href="#i-plus"/></svg></button></span>`;
  }

  function itemHTML(it) {
    const other = en ? it.name : it.en;
    const tags = (it.tags || []).map((k) => `<span class="item__tag item__tag--${k}">${esc(tagLabel(k))}</span>`).join("");
    return `<li class="item${it.photo ? "" : " item--noimg"}" id="item-${it.id}" data-id="${it.id}">
      ${it.photo ? `<div class="item__img">${img(it.photo, "72px", "")}</div>` : ""}
      <div class="item__main">
        <h3 class="item__name">${esc(name(it))}</h3>
        ${other && other !== name(it) ? `<span class="item__en" lang="${en ? "es" : "en"}">${esc(other)}</span>` : ""}
        ${desc(it) ? `<p class="item__desc">${esc(desc(it))}</p>` : ""}
        ${tags ? `<div class="item__tags">${tags}</div>` : ""}
      </div>
      <div class="item__side" data-side="${it.id}">${side(it)}</div>
    </li>`;
  }

  root.innerHTML = M.categories.map((c) => `
    <section class="menu-cat" id="cat-${c.id}" data-cat="${c.id}" aria-labelledby="h-${c.id}">
      <div class="menu-cat__head"><h2 id="h-${c.id}">${esc(en ? c.en : c.name)}</h2>${c.note ? `<p>${esc(en ? c.note_en : c.note)}</p>` : ""}</div>
      <ul class="menu-list">${c.items.map((it) => itemHTML({ ...it, cat: c })).join("")}</ul>
    </section>`).join("");

  /* Barra de categorías */
  const cats = document.querySelector("[data-cats]");
  cats.innerHTML = M.categories.map((c) => `<li><a href="#cat-${c.id}" data-cat-link="${c.id}">${esc(en ? c.en : c.name)}</a></li>`).join("");
  const header = document.querySelector("[data-header]");
  const catsBar = document.querySelector(".cats");
  const offset = () => (header ? header.offsetHeight : 64) + (catsBar ? catsBar.offsetHeight : 60) + 8;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const scrollToEl = (el) => window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - offset(), behavior: reduce ? "auto" : "smooth" });

  cats.addEventListener("click", (e) => {
    const a = e.target.closest("[data-cat-link]");
    if (!a) return;
    e.preventDefault();
    const sec = document.getElementById(`cat-${a.dataset.catLink}`);
    if (sec) { scrollToEl(sec); history.replaceState(null, "", `#cat-${a.dataset.catLink}`); }
  });

  let activeId = null;
  function spy() {
    const line = offset() + 4;
    let cur = null;
    root.querySelectorAll(".menu-cat:not([hidden])").forEach((s) => { if (s.getBoundingClientRect().top <= line) cur = s.dataset.cat; });
    if (!cur) { const first = root.querySelector(".menu-cat:not([hidden])"); cur = first && first.dataset.cat; }
    if (cur === activeId) return;
    activeId = cur;
    cats.querySelectorAll("a").forEach((a) => {
      const on = a.dataset.catLink === cur;
      a.classList.toggle("is-active", on);
      if (on) { a.setAttribute("aria-current", "true"); cats.scrollTo({ left: a.offsetLeft - cats.clientWidth / 2 + a.offsetWidth / 2, behavior: reduce ? "auto" : "smooth" }); }
      else a.removeAttribute("aria-current");
    });
  }
  let spyTick = false;
  window.addEventListener("scroll", () => { if (!spyTick) { spyTick = true; requestAnimationFrame(() => { spy(); spyTick = false; }); } }, { passive: true });

  const prevB = document.querySelector("[data-cats-prev]"), nextB = document.querySelector("[data-cats-next]");
  const arrows = () => {
    const max = cats.scrollWidth - cats.clientWidth;
    prevB.disabled = cats.scrollLeft <= 2;
    nextB.disabled = cats.scrollLeft >= max - 2;
  };
  prevB.addEventListener("click", () => cats.scrollBy({ left: -cats.clientWidth * 0.7 }));
  nextB.addEventListener("click", () => cats.scrollBy({ left: cats.clientWidth * 0.7 }));
  cats.addEventListener("scroll", arrows, { passive: true });
  window.addEventListener("resize", arrows);

  /* Búsqueda y filtros */
  const search = document.querySelector("[data-search]");
  const filters = document.querySelector("[data-filters]");
  const empty = document.querySelector("[data-empty]");
  let tag = "";
  function apply() {
    const q = norm(search.value);
    let total = 0;
    root.querySelectorAll(".menu-cat").forEach((sec) => {
      let n = 0;
      sec.querySelectorAll(".item").forEach((li) => {
        const it = byId[li.dataset.id];
        const hay = norm([it.name, it.en, it.desc, it.desc_en, it.cat.name, it.cat.en].join(" "));
        const okQ = !q || q.split(/\s+/).every((w) => hay.includes(w));
        const okT = !tag || (tag === "foto" ? !!it.photo : (it.tags || []).includes(tag));
        li.hidden = !(okQ && okT);
        if (!li.hidden) n++;
      });
      sec.hidden = n === 0;
      const link = cats.querySelector(`[data-cat-link="${sec.dataset.cat}"]`);
      if (link) link.parentElement.hidden = n === 0;
      total += n;
    });
    empty.hidden = total > 0;
    if (!total) {
      const shown = search.value.trim();
      document.querySelector("[data-empty-text]").textContent = shown
        ? t("menu.vacio.q", "No hay nada con «{q}». Prueba con «tres leches» o «café», o pregúntanos por WhatsApp.").replace("{q}", shown)
        : t("menu.vacio.f", "No hay platos con ese filtro por ahora.");
      document.querySelector("[data-empty-wa]").href = LM.wa(shown
        ? t("menu.vacio.msg", "¡Hola! ¿Tienen {q}?").replace("{q}", shown)
        : t("wa.hola", "¡Hola, Leche + Miel! Les escribo desde su página web."));
    }
    activeId = null; spy(); arrows();
  }
  search.addEventListener("input", apply);
  filters.addEventListener("click", (e) => {
    const c = e.target.closest("[data-filter]");
    if (!c) return;
    tag = c.dataset.filter;
    filters.querySelectorAll(".chip").forEach((x) => x.setAttribute("aria-pressed", String(x === c)));
    apply();
  });
  document.querySelector("[data-clear]").addEventListener("click", () => {
    search.value = ""; tag = "";
    filters.querySelectorAll(".chip").forEach((x, k) => x.setAttribute("aria-pressed", String(k === 0)));
    apply(); search.focus();
  });

  /* ---------------- Pedido ---------------- */
  const fab = document.querySelector("[data-cart-open]");
  const fabN = document.querySelector("[data-cart-count]");
  const dlg = document.getElementById("pedido");
  const form = dlg.querySelector("[data-cart-form]");
  const list = dlg.querySelector("[data-cart-list]");
  const totalEl = dlg.querySelector("[data-cart-total]");

  function refreshItem(id) {
    const s = root.querySelector(`[data-side="${id}"]`);
    if (s) s.innerHTML = side(byId[id]);
  }
  function refreshFab(bump) {
    const n = count();
    fab.hidden = n === 0;
    fabN.textContent = n;
    fab.setAttribute("aria-label", `${t("cart.fab", "Tu pedido")}: ${n}`);
    if (bump) { fab.classList.remove("is-bump"); void fab.offsetWidth; fab.classList.add("is-bump"); }
  }
  function change(id, d) {
    cart[id] = Math.max(0, (cart[id] || 0) + d);
    if (!cart[id]) delete cart[id];
    saveCart();
    refreshItem(id);
    refreshFab(d > 0);
    if (dlg.open) renderCart();
  }
  root.addEventListener("click", (e) => {
    const add = e.target.closest("[data-add]"), inc = e.target.closest("[data-inc]"), dec = e.target.closest("[data-dec]");
    if (add) {
      const id = add.dataset.add;
      change(id, 1);
      const s = root.querySelector(`[data-side="${id}"] [data-inc]`);
      if (s) { s.closest(".stepper").classList.add("is-added"); s.focus(); }
    } else if (inc) change(inc.dataset.inc, 1);
    else if (dec) {
      const id = dec.dataset.dec;
      change(id, -1);
      const b = root.querySelector(`[data-side="${id}"] button`);
      if (b) b.focus();
    }
  });

  function renderCart() {
    const ids = Object.keys(cart);
    if (!ids.length) {
      list.innerHTML = `<li class="cart-line"><span class="cart-line__price">${esc(t("cart.vacio", "Tu pedido está vacío. Toca + en el menú para agregar."))}</span></li>`;
    } else {
      list.innerHTML = ids.map((id) => {
        const it = byId[id], p = priceOf(it);
        return `<li class="cart-line"><div><div class="cart-line__name">${esc(name(it))}</div>${p != null ? `<div class="cart-line__price">${money(p)}</div>` : ""}</div>
          <span class="stepper" role="group" aria-label="${esc(name(it))}">
            <button type="button" data-cdec="${id}" aria-label="${esc(t("menu.quitar", "Quitar uno"))}"><svg aria-hidden="true"><use href="#i-minus"/></svg></button>
            <output>${cart[id]}</output>
            <button type="button" data-cinc="${id}" aria-label="${esc(t("menu.otro", "Agregar otro"))}"><svg aria-hidden="true"><use href="#i-plus"/></svg></button></span></li>`;
      }).join("");
    }
    const known = ids.every((id) => priceOf(byId[id]) != null);
    const sum = ids.reduce((a, id) => a + (priceOf(byId[id]) || 0) * cart[id], 0);
    totalEl.innerHTML = ids.length && known
      ? `<span>${esc(t("cart.total", "Total estimado"))}</span><strong>${money(sum)}</strong>`
      : `<small>${esc(t("cart.sinprecio", "Te confirmamos el total por WhatsApp."))}</small><span>${count()} ${esc(count() === 1 ? t("cart.producto", "producto") : t("cart.productos", "productos"))}</span>`;
  }
  list.addEventListener("click", (e) => {
    const inc = e.target.closest("[data-cinc]"), dec = e.target.closest("[data-cdec]");
    if (inc) change(inc.dataset.cinc, 1);
    if (dec) change(dec.dataset.cdec, -1);
  });

  function fillPickup() {
    const sel = form.hora;
    const today = LM.dateStr(LM.nowSD());
    const ds = LM.firstOpenDate(0, { lead: 20, until: 15 });
    const slots = LM.slotsFor(ds, { lead: 20, until: 15 });
    sel.innerHTML = "";
    const prefix = ds === today ? "" : `${ds === LM.addDays(today, 1) ? t("cart.manana", "Mañana") : LM.fmtDate(ds)}, `;
    if (ds === today) sel.append(new Option(t("cart.ya", "Lo antes posible"), "Lo antes posible"));
    slots.forEach((m) => { const v = prefix + LM.fmtTime(m).replace(/ /g, " "); sel.append(new Option(v, v)); });
  }

  fab.addEventListener("click", () => { renderCart(); fillPickup(); LM.openDialog(dlg); });
  form.querySelectorAll('input[name="entrega"]').forEach((r) => r.addEventListener("change", () => {
    dlg.querySelector("[data-dir]").hidden = form.entrega.value !== "delivery";
  }));
  form.nombre.addEventListener("input", () => LM.setError(form.nombre, ""));
  form.direccion.addEventListener("input", () => LM.setError(form.direccion, ""));
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const ids = Object.keys(cart);
    if (!ids.length) { dlg.close(); return; }
    const bad = [];
    if (form.nombre.value.trim().length < 2) { LM.setError(form.nombre, t("err.nombre2", "Escribe tu nombre para el pedido.")); bad.push(form.nombre); }
    const delivery = form.entrega.value === "delivery";
    if (delivery && form.direccion.value.trim().length < 6) { LM.setError(form.direccion, t("err.dir", "Escribe la dirección y una referencia.")); bad.push(form.direccion); }
    if (bad.length) { bad[0].focus(); return; }
    const lines = ids.map((id) => `• ${cart[id]} × ${name(byId[id])}`).join("\n");
    const known = ids.every((id) => priceOf(byId[id]) != null);
    const sum = ids.reduce((a, id) => a + (priceOf(byId[id]) || 0) * cart[id], 0);
    const sel = (s) => s.options[s.selectedIndex].text;
    const msg = en
      ? `Hi, Leche + Miel! I'd like to place an order:\n\n${lines}\n\n• ${delivery ? "Delivery to: " + form.direccion.value.trim() : "Pickup at the plaza"}\n• When: ${sel(form.hora)}\n• Payment: ${sel(form.pago)}\n• Name: ${form.nombre.value.trim()}${form.nota.value.trim() ? "\n• Note: " + form.nota.value.trim() : ""}\n\n${known ? "Estimated total: " + money(sum).replace(/ /g, " ") + "\n" : ""}Could you confirm${known ? "" : " the total"}, please? Thank you!`
      : `¡Hola, Leche + Miel! Quiero hacer un pedido:\n\n${lines}\n\n• ${delivery ? "Delivery a: " + form.direccion.value.trim() : "Para recoger en la plaza"}\n• Para: ${sel(form.hora)}\n• Pago: ${sel(form.pago)}\n• Nombre: ${form.nombre.value.trim()}${form.nota.value.trim() ? "\n• Nota: " + form.nota.value.trim() : ""}\n\n${known ? "Total estimado: " + money(sum).replace(/ /g, " ") + "\n" : ""}¿Me confirman${known ? "" : " el total"}, por favor? ¡Gracias!`;
    LM.openWa(msg);
    dlg.close();
  });

  refreshFab(false);
  apply();
  arrows();

  /* Si llegan desde un favorito del inicio (#item-...), lo mostramos */
  if (location.hash.startsWith("#item-") || location.hash.startsWith("#cat-")) {
    const el = document.getElementById(location.hash.slice(1));
    if (el) requestAnimationFrame(() => { scrollToEl(el); if (el.classList.contains("item")) { el.style.transition = "background-color 1.2s"; el.style.backgroundColor = "rgba(226,167,46,.18)"; setTimeout(() => (el.style.backgroundColor = ""), 1400); } });
  }
})();
