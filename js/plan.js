/* Home page: interactive project drawing (lines/original switch, crosshair with coordinates). */
(function () {
  "use strict";
  var fig = document.getElementById("projekts");
  if (!fig) return;
  var STR = {
    lv: {
      hint: "Pavirziet kursoru pār rasējumu, un parādīsim koordinātas milimetros.",
      touch: "Pieskarieties rasējumam, un parādīsim koordinātas milimetros.",
      read: "{x} mm no kreisās malas · {y} mm no grīdas"
    },
    ru: {
      hint: "Наведите курсор на чертёж, и мы покажем координаты в миллиметрах.",
      touch: "Коснитесь чертежа, и мы покажем координаты в миллиметрах.",
      read: "{x} мм от левого края · {y} мм от пола"
    }
  };
  function L() { return STR[(window.TR && window.TR.lang) || "lv"]; }
  var svg = fig.querySelector(".plan");
  var read = fig.querySelector("[data-read]");
  var cross = svg.querySelector(".cross");
  var cx = cross.querySelector(".cx"), cy = cross.querySelector(".cy"), cc = cross.querySelector(".cc");
  var canHover = window.matchMedia("(hover: hover)").matches;
  var aiming = false;
  function setHint() {
    if (aiming) return;
    read.textContent = canHover ? L().hint : L().touch;
  }
  fig.querySelectorAll("[data-view]").forEach(function (b) {
    b.addEventListener("click", function () {
      var orig = b.getAttribute("data-view") === "orig";
      fig.classList.toggle("is-orig", orig);
      fig.querySelectorAll("[data-view]").forEach(function (o) { o.setAttribute("aria-pressed", String(o === b)); });
    });
  });
  function fmt(v) { return String(v).replace(/\B(?=(\d{3})+(?!\d))/g, " "); }
  function aim(e) {
    var m = svg.getScreenCTM();
    if (!m) return;
    var p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse());
    var inside = p.x >= 0 && p.x <= 3500 && p.y >= 0 && p.y <= 2500;
    if (!inside) { stopAim(); return; }
    var x = Math.round(p.x / 5) * 5, y = Math.round(p.y / 5) * 5;
    cx.setAttribute("d", "M" + x + " 0V2500");
    cy.setAttribute("d", "M0 " + y + "H3500");
    cc.setAttribute("cx", x); cc.setAttribute("cy", y);
    svg.classList.add("is-aim");
    aiming = true;
    read.textContent = L().read.replace("{x}", fmt(x)).replace("{y}", fmt(2500 - y));
  }
  function stopAim() { svg.classList.remove("is-aim"); aiming = false; setHint(); }
  svg.addEventListener("pointermove", aim);
  svg.addEventListener("pointerdown", aim);
  svg.addEventListener("pointerleave", function (e) { if (e.pointerType !== "touch") stopAim(); });
  document.addEventListener("pointerdown", function (e) { if (aiming && !svg.contains(e.target)) stopAim(); });
  if (window.TR) window.TR.on(function () { aiming = false; setHint(); });
  setHint();
})();
