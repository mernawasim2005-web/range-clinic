(function () {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));

  /* ---------- Sticky header ---------- */
  const header = $("#header");

  function onScroll() {
    if (header) header.classList.toggle("is-stuck", window.scrollY > 8);
  }

  /* ---------- Mobile navigation ---------- */
  const navToggle = $("#navToggle");
  const nav = $("#nav");

  if (navToggle && nav && window.matchMedia("(max-width: 900px)").matches) {
    const backdrop = document.createElement("div");
    backdrop.className = "nav-backdrop";
    document.body.appendChild(backdrop);

    const setMenu = (open) => {
      nav.classList.toggle("is-open", open);
      backdrop.classList.toggle("is-visible", open);
      navToggle.setAttribute("aria-expanded", String(open));
      navToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      document.body.classList.toggle("nav-open", open);
    };

    navToggle.addEventListener("click", () => {
      setMenu(navToggle.getAttribute("aria-expanded") !== "true");
    });

    backdrop.addEventListener("click", () => setMenu(false));

    $$("a", nav).forEach((link) => link.addEventListener("click", () => setMenu(false)));

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && nav.classList.contains("is-open")) {
        setMenu(false);
        navToggle.focus();
      }
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 900) setMenu(false);
    });
  }

  /* ---------- Scroll spy ---------- */
  const spyLinks = $$('.nav__list a[href^="#"]');
  const sections = spyLinks
    .map((link) => ({ link, section: document.querySelector(link.getAttribute("href")) }))
    .filter((item) => item.section);

  function syncSpy() {
    const offset = window.scrollY + 140;
    let current = null;

    sections.forEach((item) => {
      if (item.section.offsetTop <= offset) current = item;
    });

    sections.forEach((item) => {
      item.link.classList.toggle("is-active", item === current);
    });
  }

  /* ---------- Reveal on scroll ---------- */
  const revealTargets = $$(
    ".section__head, .card, .feature, .person, .conditions__group, .steps li, .about__media, .booking__info, .accordion__item, .cta__inner, .logos__row"
  );

  revealTargets.forEach((el, i) => {
    el.classList.add("reveal");
    if (i % 4 === 1) el.classList.add("reveal-delay-1");
    if (i % 4 === 2) el.classList.add("reveal-delay-2");
    if (i % 4 === 3) el.classList.add("reveal-delay-3");
  });

  if ("IntersectionObserver" in window && !reduceMotion) {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );

    revealTargets.forEach((el) => revealObserver.observe(el));
  } else {
    revealTargets.forEach((el) => el.classList.add("is-visible"));
  }

  /* ---------- Animated counters ---------- */
  const counters = $$("[data-count]");

  function animateCounter(el) {
    const target = parseFloat(el.dataset.count);
    const decimals = parseInt(el.dataset.decimals || "0", 10);
    const suffix = el.dataset.suffix || "";
    const duration = 1400;
    const start = performance.now();

    function frame(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = target * eased;
      el.textContent =
        (decimals ? value.toFixed(decimals) : Math.round(value).toLocaleString("en-AU")) + suffix;
      if (progress < 1) requestAnimationFrame(frame);
    }

    requestAnimationFrame(frame);
  }

  if (counters.length) {
    if ("IntersectionObserver" in window && !reduceMotion) {
      const countObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              animateCounter(entry.target);
              countObserver.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.4 }
      );
      counters.forEach((el) => countObserver.observe(el));
    } else {
      counters.forEach((el) => {
        const decimals = parseInt(el.dataset.decimals || "0", 10);
        el.textContent =
          (decimals
            ? parseFloat(el.dataset.count).toFixed(decimals)
            : parseFloat(el.dataset.count).toLocaleString("en-AU")) + (el.dataset.suffix || "");
      });
    }
  }

  /* ---------- FAQ accordion ---------- */
  const accordion = $("#accordion");

  if (accordion) {
    $$(".accordion__trigger", accordion).forEach((trigger) => {
      const item = trigger.closest(".accordion__item");

      trigger.addEventListener("click", () => {
        const isOpen = item.classList.contains("is-open");

        $$(".accordion__item", accordion).forEach((other) => {
          other.classList.remove("is-open");
          $(".accordion__trigger", other).setAttribute("aria-expanded", "false");
        });

        if (!isOpen) {
          item.classList.add("is-open");
          trigger.setAttribute("aria-expanded", "true");
        }
      });
    });

    const first = $(".accordion__trigger", accordion);
    if (first) first.click();
  }

  /* ---------- Booking form validation ---------- */
  const form = $("#bookingForm");

  if (form) {
    const status = $("#formStatus");

    const rules = {
      name: (v) => (v.trim().length >= 2 ? "" : "Please enter your full name."),
      phone: (v) => (/^[\d\s()+.-]{8,}$/.test(v.trim()) ? "" : "Please enter a valid contact number."),
      email: (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? "" : "Please enter a valid email address."),
      consent: (v, el) => (el.checked ? "" : "Please tick to continue.")
    };

    const fieldOf = (input) => input.closest(".field") || input.closest(".checkbox")?.parentElement;

    function showError(input, message) {
      const holder = fieldOf(input);
      const target = $(`[data-error-for="${input.name}"]`);
      if (holder && input.type !== "checkbox") holder.classList.toggle("has-error", Boolean(message));
      if (target) target.textContent = message;
      if (message) {
        input.setAttribute("aria-invalid", "true");
      } else {
        input.removeAttribute("aria-invalid");
      }
    }

    function validateField(input) {
      const rule = rules[input.name];
      if (!rule) return true;
      const message = rule(input.value, input);
      showError(input, message);
      return !message;
    }

    $$("input, select, textarea", form).forEach((input) => {
      input.addEventListener("blur", () => {
        if (input.name in rules) validateField(input);
      });
      input.addEventListener("input", () => {
        if (input.name in rules && input.getAttribute("aria-invalid") === "true") validateField(input);
      });
    });

    form.addEventListener("submit", (e) => {
      e.preventDefault();

      let valid = true;
      let firstInvalid = null;

      Object.keys(rules).forEach((name) => {
        const input = form.elements[name];
        if (!input) return;
        if (!validateField(input)) {
          valid = false;
          if (!firstInvalid) firstInvalid = input;
        }
      });

      if (!valid) {
        status.textContent = "Please correct the highlighted fields and try again.";
        status.className = "form__status is-visible is-error";
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      const name = form.elements.name.value.trim().split(/\s+/)[0];
      status.textContent =
        "Thanks " + name + " \u2014 your request has been received. Reception will confirm your appointment within one business day.";
      status.className = "form__status is-visible is-success";
      form.reset();
    });
  }

  /* ---------- Back to top ---------- */
  const toTop = $("#toTop");

  if (toTop) {
    toTop.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    });
  }

  /* ---------- Shared scroll handler ---------- */
  let ticking = false;

  function onScrollAll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      onScroll();
      syncSpy();
      if (toTop) toTop.classList.toggle("is-visible", window.scrollY > 600);
      ticking = false;
    });
  }

  window.addEventListener("scroll", onScrollAll, { passive: true });
  onScrollAll();
})();
