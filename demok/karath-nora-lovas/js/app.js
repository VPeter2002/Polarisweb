(function () {
  'use strict';

  // Keyed recipient vegpont (anti-open-relay): a bongeszo csak a kulcsot kuldi,
  // a cimzettet a szerver oldali CLIENTS tabla donti el (send-client-lead.js).
  var ENDPOINT = 'https://www.polarisweb.hu/api/send-client-lead';
  var FORM_KEY = 'karath-nora';

  var $ = function (sel, root) { return (root || document).querySelector(sel); };

  function initNav() {
    var toggle = $('.nav-toggle');
    var menu = $('.mobile-menu');
    if (!toggle || !menu) return;
    toggle.addEventListener('click', function () {
      var open = toggle.classList.toggle('open');
      menu.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    menu.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        toggle.classList.remove('open');
        menu.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  function initReveal() {
    var items = Array.prototype.slice.call(document.querySelectorAll('.reveal'));
    if (!items.length) return;
    if (!('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    items.forEach(function (el) { io.observe(el); });
  }

  function setStatus(el, kind, text) {
    el.textContent = text;
    el.className = 'form-status' + (kind ? ' ' + kind : '');
  }

  function initContactForm() {
    var form = $('#contactForm');
    if (!form) return;
    var status = $('#contactStatus', form);
    var submitBtn = form.querySelector('button[type="submit"]');

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var name = form.elements['name'].value.trim();
      var contact = form.elements['contact'].value.trim();
      var message = form.elements['message'].value.trim();

      if (!name || !contact || !message) {
        setStatus(status, 'err', 'Kérlek töltsd ki a nevet, egy elérhetőséget és az üzenetet.');
        return;
      }

      submitBtn.disabled = true;
      setStatus(status, '', 'Küldés...');

      // A vegpont kulon email/phone mezot var; az egy soros "contact" mezobol
      // eldontjuk, email-e vagy telefon, es ugy toltjuk ki.
      var isEmail = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(contact);
      fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: FORM_KEY,
          name: name,
          email: isEmail ? contact : '',
          phone: isEmail ? '' : contact,
          message: message
        })
      })
        .then(function (res) {
          if (!res.ok) throw new Error('send failed');
          form.reset();
          setStatus(status, 'ok', 'Köszönöm, hamarosan jelentkezem!');
        })
        .catch(function () {
          setStatus(status, 'err', 'Most nem sikerült elküldeni. Írj bátran telefonon vagy Messengeren.');
        })
        .then(function () { submitBtn.disabled = false; });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initNav();
    initReveal();
    initContactForm();
  });
})();
