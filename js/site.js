/* Trast I.G.: shared behaviour (language switch, menu, lightbox, form). No dependencies. */
(function () {
  "use strict";
  var root = document.documentElement;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  var auto = !!navigator.webdriver; // automated runs get the final state at once
  if (!reduce.matches && !auto) root.classList.add("anim");

  /* ---------- language: Latvian is in the markup, Russian in a JSON block ---------- */
  var RU = {};
  var ruEl = document.getElementById("i18n-ru");
  if (ruEl) { try { RU = JSON.parse(ruEl.textContent); } catch (e) { RU = {}; } }
  var ATTRS = ["alt", "aria-label", "title", "placeholder"];
  var textNodes = [].slice.call(document.querySelectorAll("[data-i]"));
  var textLV = textNodes.map(function (n) { return n.innerHTML; });
  var attrNodes = [];
  ATTRS.forEach(function (a) {
    [].forEach.call(document.querySelectorAll("[data-ia-" + a + "]"), function (n) {
      attrNodes.push({ n: n, a: a, k: n.getAttribute("data-ia-" + a), lv: n.getAttribute(a) });
    });
  });
  var metaDesc = document.querySelector('meta[name="description"]');
  var ogTitle = document.querySelector('meta[property="og:title"]');
  var ogDesc = document.querySelector('meta[property="og:description"]');
  var ogLoc = document.querySelector('meta[property="og:locale"]');
  var ogAlt = document.querySelector('meta[property="og:locale:alternate"]');
  var titleLV = document.title;
  var descLV = metaDesc ? metaDesc.getAttribute("content") : "";

  var TR = window.TR = { lang: "lv", cbs: [], on: function (f) { TR.cbs.push(f); } };

  function skipHref(h) { return !h || h.charAt(0) === "#" || /^(mailto:|tel:|https?:|javascript:)/i.test(h); }
  function withLang(h, ru) {
    var hash = "", i = h.indexOf("#");
    if (i > -1) { hash = h.slice(i); h = h.slice(0, i); }
    var q = "", j = h.indexOf("?");
    if (j > -1) { q = h.slice(j + 1); h = h.slice(0, j); }
    var parts = q ? q.split("&").filter(function (p) { return p && p.indexOf("lang=") !== 0; }) : [];
    if (ru) parts.push("lang=ru");
    return h + (parts.length ? "?" + parts.join("&") : "") + hash;
  }
  function setLinks(ru) {
    [].forEach.call(document.querySelectorAll("a[href]"), function (a) {
      var h0 = a.getAttribute("data-h0");
      if (h0 === null) { h0 = a.getAttribute("href"); a.setAttribute("data-h0", h0); }
      if (skipHref(h0)) return;
      a.setAttribute("href", withLang(h0, ru));
    });
  }

  function applyLang(l) {
    var ru = l === "ru";
    TR.lang = l;
    root.lang = l;
    textNodes.forEach(function (n, idx) {
      var k = n.getAttribute("data-i");
      var v = ru ? (RU[k] != null ? RU[k] : textLV[idx]) : textLV[idx];
      if (n.innerHTML !== v) n.innerHTML = v;
    });
    attrNodes.forEach(function (o) {
      var v = ru ? (RU[o.k] != null ? RU[o.k] : o.lv) : o.lv;
      o.n.setAttribute(o.a, v);
    });
    var t = ru && RU._t ? RU._t : titleLV;
    var d = ru && RU._d ? RU._d : descLV;
    document.title = t;
    if (metaDesc) metaDesc.setAttribute("content", d);
    if (ogTitle) ogTitle.setAttribute("content", t);
    if (ogDesc) ogDesc.setAttribute("content", d);
    if (ogLoc) ogLoc.setAttribute("content", ru ? "ru_RU" : "lv_LV");
    if (ogAlt) ogAlt.setAttribute("content", ru ? "lv_LV" : "ru_RU");
    [].forEach.call(document.querySelectorAll("[data-lang]"), function (b) {
      b.setAttribute("aria-pressed", String(b.getAttribute("data-lang") === l));
    });
    setLinks(ru);
    TR.cbs.forEach(function (f) { try { f(l); } catch (e) {} });
  }
  function setLang(l) {
    if (l === TR.lang) return;
    applyLang(l);
    try {
      var u = new URL(location.href);
      if (l === "ru") u.searchParams.set("lang", "ru"); else u.searchParams.delete("lang");
      history.replaceState(null, "", u);
    } catch (e) {}
  }
  [].forEach.call(document.querySelectorAll("[data-lang]"), function (b) {
    b.addEventListener("click", function () { setLang(b.getAttribute("data-lang")); });
  });

  /* ---------- mobile menu ---------- */
  var mb = document.querySelector(".menu-btn");
  var mn = document.getElementById("mnav");
  function setMenu(open) {
    if (!mb || !mn) return;
    mb.setAttribute("aria-expanded", String(open));
    mn.classList.toggle("open", open);
    document.body.classList.toggle("menu-open", open);
  }
  if (mb && mn) {
    mb.addEventListener("click", function () { setMenu(mb.getAttribute("aria-expanded") !== "true"); });
    mn.addEventListener("click", function (e) { if (e.target.closest("a")) setMenu(false); });
    mn.addEventListener("keydown", function (e) {
      if (e.key !== "Tab") return;
      var f = mn.querySelectorAll("a[href]");
      if (!f.length) return;
      if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); mb.focus(); }
    });
    window.addEventListener("resize", function () { if (window.innerWidth >= 1100) setMenu(false); });
  }

  /* ---------- desktop dropdown ---------- */
  var ddBtn = document.querySelector(".dd-btn");
  var ddPanel = document.getElementById("dd-panel");
  function setDD(open) {
    if (!ddBtn || !ddPanel) return;
    ddBtn.setAttribute("aria-expanded", String(open));
    ddPanel.classList.toggle("open", open);
  }
  if (ddBtn && ddPanel) {
    ddBtn.addEventListener("click", function () { setDD(ddBtn.getAttribute("aria-expanded") !== "true"); });
    document.addEventListener("click", function (e) { if (!e.target.closest(".dd")) setDD(false); });
    ddPanel.parentNode.addEventListener("focusout", function (e) {
      if (!e.relatedTarget || !ddPanel.parentNode.contains(e.relatedTarget)) setDD(false);
    });
  }
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    if (ddPanel && ddPanel.classList.contains("open")) { setDD(false); ddBtn.focus(); }
    if (mn && mn.classList.contains("open")) { setMenu(false); mb.focus(); }
  });

  /* ---------- photo viewer: always shows the photo that was clicked ---------- */
  var lb = document.getElementById("lb");
  var lbImg = document.getElementById("lb-img");
  var opener = null;
  if (lb && lbImg) {
    [].forEach.call(document.querySelectorAll("[data-lightbox]"), function (b) {
      b.addEventListener("click", function () {
        var im = b.querySelector("img");
        opener = b;
        lbImg.removeAttribute("width"); lbImg.removeAttribute("height");
        lbImg.src = b.getAttribute("data-full") || im.currentSrc || im.src;
        lbImg.alt = im.alt;
        if (typeof lb.showModal === "function") lb.showModal(); else window.open(lbImg.src, "_blank");
      });
    });
    lb.querySelector("[data-close]").addEventListener("click", function () { lb.close(); });
    lb.addEventListener("click", function (e) { if (e.target === lb) lb.close(); });
    lb.addEventListener("close", function () { lbImg.removeAttribute("src"); if (opener) opener.focus(); });
  }

  /* ---------- scroll ruler ---------- */
  var bar = document.querySelector(".ruler i");
  var ticking = false;
  function prog() {
    ticking = false;
    if (!bar) return;
    var h = document.documentElement.scrollHeight - innerHeight;
    bar.style.setProperty("--p", h > 0 ? Math.min(1, scrollY / h).toFixed(4) : 0);
  }
  addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(prog); } }, { passive: true });
  prog();

  /* ---------- reveal on scroll (only after the first real user action) ---------- */
  function armReveal() {
    ["wheel", "touchmove", "keydown"].forEach(function (ev) { removeEventListener(ev, armReveal); });
    if (!root.classList.contains("anim") || !("IntersectionObserver" in window)) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.remove("rv-wait"); io.unobserve(en.target); } });
    }, { rootMargin: "0px 0px -8% 0px" });
    [].forEach.call(document.querySelectorAll(".rv"), function (el) {
      if (el.getBoundingClientRect().top > innerHeight * 1.05) { el.classList.add("rv-wait"); io.observe(el); }
    });
  }
  ["wheel", "touchmove", "keydown"].forEach(function (ev) { addEventListener(ev, armReveal, { passive: true }); });

  /* ---------- contact form: builds an e-mail in the visitor's mail program ---------- */
  var form = document.getElementById("cform");
  if (form) {
    var MAIL = form.getAttribute("data-mail");
    var MSG = {
      lv: {
        missing: "Lūdzu, aizpildiet obligātos laukus: virzienu un tālruni.",
        opening: "Atveram e-pasta programmu ar gatavu vēstuli. Ja tā neatvērās, rakstiet uz " + MAIL + ".",
        subject: "Pasūtījuma pieprasījums: ",
        hello: "Labdien!", dir: "Virziens", size: "Izmēri", city: "Pilsēta", phone: "Tālrunis", name: "Vārds", msg: "Ziņa"
      },
      ru: {
        missing: "Заполните обязательные поля: направление и телефон.",
        opening: "Открываем почтовую программу с готовым письмом. Если она не открылась, напишите на " + MAIL + ".",
        subject: "Запрос на заказ: ",
        hello: "Здравствуйте!", dir: "Направление", size: "Размеры", city: "Город", phone: "Телефон", name: "Имя", msg: "Сообщение"
      }
    };
    var f = {
      dir: form.querySelector("#f-dir"), size: form.querySelector("#f-size"), city: form.querySelector("#f-city"),
      phone: form.querySelector("#f-phone"), name: form.querySelector("#f-name"), msg: form.querySelector("#f-msg")
    };
    var status = form.querySelector(".form-status");
    var pre = null;
    try { pre = new URLSearchParams(location.search).get("virziens"); } catch (e) {}
    if (pre) { for (var i = 0; i < f.dir.options.length; i++) { if (f.dir.options[i].value === pre) { f.dir.selectedIndex = i; break; } } }

    var mark = function (el, bad) {
      var box = el.closest(".field");
      box.classList.toggle("bad", bad);
      if (bad) el.setAttribute("aria-invalid", "true"); else el.removeAttribute("aria-invalid");
    };
    var phoneOk = function (v) { return /^[+0-9 ()\-]+$/.test(v) && v.replace(/\D/g, "").length >= 7; };
    var check = function () {
      var okDir = !!f.dir.value;
      var v = f.phone.value.trim();
      var okPh = phoneOk(v);
      mark(f.dir, !okDir);
      mark(f.phone, !okPh);
      return { okDir: okDir, okPh: okPh };
    };
    [f.dir, f.phone].forEach(function (el) {
      el.addEventListener("input", function () { if (el.closest(".field").classList.contains("bad")) check(); });
      el.addEventListener("change", function () { if (el.closest(".field").classList.contains("bad")) check(); });
    });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var m = MSG[TR.lang] || MSG.lv;
      var r = check();
      if (!r.okDir || !r.okPh) {
        status.className = "form-status bad";
        status.textContent = m.missing;
        (r.okDir ? f.phone : f.dir).focus();
        return;
      }
      var line = function (k, v) { return v ? k + ": " + v + "\n" : ""; };
      var dirText = f.dir.options[f.dir.selectedIndex].text;
      var body = m.hello + "\n\n" +
        line(m.dir, dirText) + line(m.size, f.size.value.trim()) + line(m.city, f.city.value.trim()) +
        line(m.phone, f.phone.value.trim()) + line(m.name, f.name.value.trim());
      if (f.msg.value.trim()) body += "\n" + m.msg + ":\n" + f.msg.value.trim() + "\n";
      status.className = "form-status";
      status.textContent = m.opening;
      location.href = "mailto:" + MAIL + "?subject=" + encodeURIComponent(m.subject + dirText) + "&body=" + encodeURIComponent(body);
    });
    TR.on(function () { if (status.textContent) { status.textContent = ""; status.className = "form-status"; } });
  }

  /* ---------- language from the address ---------- */
  var q = null;
  try { q = new URLSearchParams(location.search).get("lang"); } catch (e) {}
  if (q === "ru") applyLang("ru");
})();
