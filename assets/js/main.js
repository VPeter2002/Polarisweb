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

  /* ---- FAQ accordion (single-open) ---- */
  document.querySelectorAll('[data-faq]').forEach(function (list) {
    var items = list.querySelectorAll('.faq-item');
    items.forEach(function (item) {
      var btn = item.querySelector('.faq-q');
      var answer = item.querySelector('.faq-a');
      var icon = item.querySelector('.faq-icon');
      btn.addEventListener('click', function () {
        var isOpen = btn.getAttribute('aria-expanded') === 'true';
        // Close all
        items.forEach(function (other) {
          other.querySelector('.faq-q').setAttribute('aria-expanded', 'false');
          other.querySelector('.faq-a').hidden = true;
          other.querySelector('.faq-icon').textContent = '+';
        });
        // Toggle current
        if (!isOpen) {
          btn.setAttribute('aria-expanded', 'true');
          answer.hidden = false;
          icon.textContent = '−';
        }
      });
    });
  });

  /* ---- Home contact form ---- */
  var contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = contactForm.querySelector('#cf-name');
      var email = contactForm.querySelector('#cf-email');
      if (!name.value.trim() || !email.value.trim()) {
        (name.value.trim() ? email : name).focus();
        return;
      }
      contactForm.querySelector('.form-fields').hidden = true;
      contactForm.querySelector('.form-success').hidden = false;
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
})();
