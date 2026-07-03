/* polarisweb — shared interactivity (nav, FAQ, contact form, portfolio filter, billing toggle) */
(function () {
  'use strict';

  /* ---- Mobile nav toggle ---- */
  var navToggle = document.getElementById('navToggle');
  var navLinks = document.getElementById('navLinks');
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', function () {
      var open = navLinks.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    navLinks.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        navLinks.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ---- FAQ accordion (single-open, CSS grid-driven height — never clips) ---- */
  document.querySelectorAll('[data-faq]').forEach(function (list) {
    var items = Array.prototype.slice.call(list.querySelectorAll('.faq-item'));

    function setOpen(item, open) {
      item.classList.toggle('open', open);
      item.querySelector('.faq-q').setAttribute('aria-expanded', open ? 'true' : 'false');
      item.querySelector('.faq-icon').textContent = open ? '−' : '+';
    }

    // Sync initial .open state from the markup's aria-expanded="true".
    items.forEach(function (item) {
      if (item.querySelector('.faq-q').getAttribute('aria-expanded') === 'true') {
        item.classList.add('open');
      }
    });

    items.forEach(function (item) {
      item.querySelector('.faq-q').addEventListener('click', function () {
        var wasOpen = item.classList.contains('open');
        items.forEach(function (other) { setOpen(other, false); });
        if (!wasOpen) setOpen(item, true);
      });
    });
  });

  /* ---- Home contact form ---- */
  var contactForm = document.getElementById('contactForm');
  if (contactForm) {
    var cfError = contactForm.querySelector('[data-cf-error]');
    var cfHoneypot = contactForm.querySelector('[data-honeypot]');
    var cfSubmitBtn = contactForm.querySelector('.form-submit');

    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = contactForm.querySelector('#cf-name');
      var email = contactForm.querySelector('#cf-email');
      var company = contactForm.querySelector('#cf-company');
      var message = contactForm.querySelector('#cf-msg');

      if (!name.value.trim() || !email.value.trim()) {
        (name.value.trim() ? email : name).focus();
        return;
      }

      cfError.hidden = true;
      cfSubmitBtn.disabled = true;
      var originalLabel = cfSubmitBtn.textContent;
      cfSubmitBtn.textContent = 'Küldés…';

      fetch('/api/send-contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.value.trim(),
          company: company.value.trim(),
          email: email.value.trim(),
          message: message.value.trim(),
          website: cfHoneypot ? cfHoneypot.value : ''
        })
      })
        .then(function (res) {
          return res.json().catch(function () { return {}; }).then(function (data) {
            if (!res.ok) throw new Error(data.error || 'Nem sikerült elküldeni az üzenetet.');
            return data;
          });
        })
        .then(function () {
          contactForm.querySelector('.form-fields').hidden = true;
          contactForm.querySelector('.form-success').hidden = false;
        })
        .catch(function (err) {
          cfError.textContent = err.message || 'Nem sikerült elküldeni az üzenetet. Próbálja újra.';
          cfError.hidden = false;
          cfSubmitBtn.disabled = false;
          cfSubmitBtn.textContent = originalLabel;
        });
    });
  }

  /* ---- Portfolio filter ---- */
  var filterBar = document.querySelector('[data-filters]');
  if (filterBar) {
    var tiles = document.querySelectorAll('[data-projects] .pf-tile');
    filterBar.addEventListener('click', function (e) {
      var chip = e.target.closest('.filter-chip');
      if (!chip) return;
      filterBar.querySelectorAll('.filter-chip').forEach(function (c) {
        c.classList.remove('active');
      });
      chip.classList.add('active');
      var filter = chip.getAttribute('data-filter');
      tiles.forEach(function (tile) {
        var show = filter === 'all' || tile.getAttribute('data-cat') === filter;
        tile.style.display = show ? '' : 'none';
      });
    });
  }

  /* ---- Pricing billing toggle ---- */
  var billing = document.querySelector('[data-billing]');
  if (billing) {
    var amounts = document.querySelectorAll('.pricing-table .amt');
    billing.addEventListener('click', function (e) {
      var opt = e.target.closest('.opt');
      if (!opt) return;
      billing.querySelectorAll('.opt').forEach(function (o) { o.classList.remove('active'); });
      opt.classList.add('active');
      var mode = opt.getAttribute('data-billing-mode');
      amounts.forEach(function (amt) {
        amt.textContent = amt.getAttribute(mode === 'annual' ? 'data-annual' : 'data-monthly');
      });
    });
  }

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- Sticky header shadow on scroll ---- */
  var header = document.querySelector('.site-header');
  if (header) {
    var onScroll = function () {
      header.classList.toggle('scrolled', window.scrollY > 8);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---- Scroll-reveal ---- */
  if (!reduceMotion && 'IntersectionObserver' in window) {
    var revealSelector = [
      '.section-head', '.step-card', '.service-card', '.pf-card', '.pf-tile',
      '.tier', '.tier-mini', '.faq-item', '.founder', '.stat',
      '.testimonial-inner', '.big-cta .box', '.pricing-note-inner',
      '.cta-center', '.trust-inner', '.legal h2', '.legal .info-card'
    ].join(', ');

    var revealEls = Array.prototype.slice.call(document.querySelectorAll(revealSelector));
    revealEls.forEach(function (el) { el.classList.add('reveal'); });
    // Stagger cards that sit next to identical siblings (grids).
    revealEls.forEach(function (el) {
      var base = el.classList[0];
      var idx = 0, sib = el;
      while ((sib = sib.previousElementSibling)) {
        if (sib.classList && sib.classList.contains(base) && sib.classList.contains('reveal')) idx++;
      }
      if (idx > 0) el.style.transitionDelay = Math.min(idx * 70, 350) + 'ms';
    });

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    revealEls.forEach(function (el) { io.observe(el); });
  }
})();
