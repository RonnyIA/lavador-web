(function () {
  "use strict";

  var data = window.__BRAND__ || {};
  var reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fineHover = matchMedia("(hover: hover) and (pointer: fine)").matches;

  var $ = function (sel, scope) { return (scope || document).querySelector(sel); };
  var $$ = function (sel, scope) { return Array.prototype.slice.call((scope || document).querySelectorAll(sel)); };

  function safe(fn, name) {
    try { fn(); } catch (e) { console.warn("[" + name + "]", e); }
  }

  /* ---- Nav: solidify on scroll ---- */
  function initNav() {
    var nav = $(".nav");
    if (!nav) return;
    var onScroll = function () {
      if (window.scrollY > 24 || nav.classList.contains("menu-open")) nav.classList.add("is-scrolled");
      else nav.classList.remove("is-scrolled");
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---- Mobile menu ---- */
  function initMobileMenu() {
    var toggle = $(".nav-toggle");
    var menu = $(".mobile-menu");
    var nav = $(".nav");
    if (!toggle || !menu) return;

    function setOpen(open) {
      toggle.setAttribute("aria-expanded", String(open));
      menu.classList.toggle("is-open", open);
      document.body.style.overflow = open ? "hidden" : "";
      if (nav) {
        nav.classList.toggle("menu-open", open);
        if (!open && window.scrollY <= 24) nav.classList.remove("is-scrolled");
        else nav.classList.add("is-scrolled");
      }
    }

    toggle.addEventListener("click", function () {
      var open = toggle.getAttribute("aria-expanded") === "true";
      setOpen(!open);
    });
    $$("a", menu).forEach(function (a) {
      a.addEventListener("click", function () { setOpen(false); });
    });
  }

  /* ---- Scroll reveal ---- */
  function initReveals() {
    var targets = $$("[data-reveal]");
    if (!targets.length) return;

    if (typeof IntersectionObserver === "undefined") {
      targets.forEach(function (el) { el.classList.add("is-visible"); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.02, rootMargin: "0px 0px -2% 0px" });

    targets.forEach(function (el, i) {
      el.style.transitionDelay = reduced ? "0s" : Math.min(i % 4, 3) * 0.08 + "s";
      io.observe(el);
    });

    setTimeout(function () {
      $$("[data-reveal]:not(.is-visible)").forEach(function (el) {
        if (el.getBoundingClientRect().top < window.innerHeight) el.classList.add("is-visible");
      });
    }, 6000);
  }

  /* ---- Tilt on service/pillar cards ---- */
  function initTilt() {
    if (!fineHover) return;
    $$("[data-tilt]").forEach(function (card) {
      var raf = null;
      card.addEventListener("mousemove", function (e) {
        if (raf) return;
        raf = requestAnimationFrame(function () {
          var r = card.getBoundingClientRect();
          var px = (e.clientX - r.left) / r.width - 0.5;
          var py = (e.clientY - r.top) / r.height - 0.5;
          card.style.transform = "perspective(700px) rotateX(" + (py * -6) + "deg) rotateY(" + (px * 6) + "deg) translateY(-6px)";
          raf = null;
        });
      });
      card.addEventListener("mouseleave", function () { card.style.transform = ""; });
    });
  }

  /* ---- Nav logo reveal: hidden while hero logo is visible, fades in once it scrolls away ---- */
  function initLogoReveal() {
    var heroLogo = $(".hero-lockup");
    var navLogo = $(".brand-logo-reveal");
    if (!heroLogo || !navLogo || typeof IntersectionObserver === "undefined") return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        navLogo.classList.toggle("is-hidden", entry.isIntersecting);
      });
    }, { rootMargin: "-90px 0px 0px 0px", threshold: 0 });
    io.observe(heroLogo);
  }

  /* ---- WhatsApp quick-message forms: type a message, opens WhatsApp pre-filled ---- */
  function initWaForms() {
    var WA_NUMBER = "18299950994";
    var DEFAULT_MSG = "Hola, quisiera información sobre el servicio de lavandería.";
    $$("[data-wa-form]").forEach(function (form) {
      if (form.dataset.waBound) return;
      form.dataset.waBound = "1";
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var input = form.querySelector("input[name='text']");
        var msg = (input && input.value.trim()) || DEFAULT_MSG;
        var url = "https://wa.me/" + WA_NUMBER + "?text=" + encodeURIComponent(msg);
        window.open(url, "_blank", "noopener");
        if (input) input.value = "";
        var panel = form.closest("[data-wa-chat-panel]");
        if (panel) panel.classList.remove("is-open");
      });
    });
  }

  /* ---- WhatsApp floating chat widget: toggle popup panel ---- */
  function initWaChat() {
    $$("[data-wa-chat]").forEach(function (wrap) {
      var panel = wrap.querySelector("[data-wa-chat-panel]");
      var toggles = $$("[data-wa-chat-toggle]", wrap);
      if (!panel || !toggles.length) return;

      function setOpen(open) {
        panel.classList.toggle("is-open", open);
        toggles.forEach(function (t) { t.setAttribute("aria-expanded", String(open)); });
        if (open) {
          var input = panel.querySelector("input[name='text']");
          if (input) setTimeout(function () { input.focus(); }, 200);
        }
      }

      toggles.forEach(function (t) {
        t.addEventListener("click", function (e) {
          e.preventDefault();
          setOpen(!panel.classList.contains("is-open"));
        });
      });

      document.addEventListener("click", function (e) {
        if (!wrap.contains(e.target)) setOpen(false);
      });
      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape") setOpen(false);
      });
    });
  }

  /* ---- Footer year ---- */
  function initFooterYear() {
    var el = $("[data-year]");
    if (el) el.textContent = String(new Date().getFullYear());
  }

  /* ---- Smooth anchor scroll (native) ---- */
  function initSmoothAnchors() {
    document.addEventListener("click", function (e) {
      var a = e.target.closest && e.target.closest('a[href^="#"]');
      if (!a) return;
      var id = a.getAttribute("href");
      if (!id || id === "#") return;
      var el = document.querySelector(id);
      if (!el) return;
      e.preventDefault();
      var navOffset = 84;
      window.scrollTo({
        top: el.getBoundingClientRect().top + window.scrollY - navOffset,
        behavior: reduced ? "auto" : "smooth"
      });
    });
  }

  /* ---- Language tabs (politica.html) — progressive enhancement ---- */
  function initLangTabs() {
    var tabs = $$(".lang-tab");
    if (!tabs.length) return;
    var panels = {
      es: $('[data-lang-panel="es"]'),
      en: $('[data-lang-panel="en"]')
    };
    if (!panels.es || !panels.en) return;

    function activate(lang) {
      tabs.forEach(function (t) { t.setAttribute("aria-selected", String(t.dataset.lang === lang)); });
      Object.keys(panels).forEach(function (key) {
        panels[key].classList.toggle("is-hidden", key !== lang);
      });
    }

    tabs.forEach(function (t) {
      t.addEventListener("click", function () { activate(t.dataset.lang); });
    });

    activate("es");
  }

  /* ---- GSAP-enhanced hero entrance (optional, feature-detected) ---- */
  function initHeroEntrance() {
    if (!window.gsap) return;
    var tl = gsap.timeline({ defaults: { ease: "expo.out", duration: 1.1 } });
    tl.from(".hero-lockup", { y: 30, opacity: 0 })
      .from(".hero-title", { y: 26, opacity: 0 }, "-=0.75")
      .from(".hero-sub", { y: 20, opacity: 0 }, "-=0.75")
      .from(".hero-actions", { y: 16, opacity: 0 }, "-=0.7")
      .from(".hero-badges", { y: 14, opacity: 0 }, "-=0.65");
  }

  function boot() {
    safe(initNav, "initNav");
    safe(initMobileMenu, "initMobileMenu");
    safe(initLogoReveal, "initLogoReveal");
    safe(initWaForms, "initWaForms");
    safe(initWaChat, "initWaChat");
    safe(initReveals, "initReveals");
    safe(initTilt, "initTilt");
    safe(initFooterYear, "initFooterYear");
    safe(initSmoothAnchors, "initSmoothAnchors");
    safe(initLangTabs, "initLangTabs");
    safe(initHeroEntrance, "initHeroEntrance");
    document.documentElement.classList.add("is-ready");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
