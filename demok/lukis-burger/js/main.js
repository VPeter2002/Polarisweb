/* Luki's Burger Ludovika -- interaction layer.
   Everything degrades gracefully: without JS the page is still fully readable,
   every dish is visible and every link works. */
(function () {
  'use strict';

  var reduced = window.matchMedia &&
                window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ----- sticky header ----- */
  var head = document.getElementById('siteHead');
  function onScroll() {
    if (!head) return;
    head.classList.toggle('is-stuck', window.scrollY > 24);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ----- mobile nav ----- */
  var burger = document.getElementById('burger');
  var navMob = document.getElementById('navMob');
  function closeNav() {
    if (!burger || !navMob) return;
    burger.classList.remove('is-open');
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'Menü megnyitása');
    navMob.hidden = true;
  }
  if (burger && navMob) {
    burger.addEventListener('click', function () {
      var open = burger.classList.toggle('is-open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      burger.setAttribute('aria-label', open ? 'Menü bezárása' : 'Menü megnyitása');
      navMob.hidden = !open;
    });
    navMob.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') closeNav();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeNav();
    });
  }

  /* ----- reveal on scroll -----
     threshold stays at 0 on purpose: a tall section (the 25 card menu on a
     phone) never reaches a fractional threshold, and would stay invisible
     while still taking up its space. */
  var revealables = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window) || reduced) {
    Array.prototype.forEach.call(revealables, function (el) { el.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('in');
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0, rootMargin: '0px 0px -8% 0px' });
    Array.prototype.forEach.call(revealables, function (el) { io.observe(el); });
  }

  /* ----- menu filter ----- */
  var chips = document.querySelectorAll('.chip');
  var dishes = document.querySelectorAll('#dishes .dish');
  var empty = document.getElementById('menuEmpty');

  function applyFilter(f) {
    var shown = 0;
    Array.prototype.forEach.call(dishes, function (d) {
      var match =
        f === 'all' ? true :
        f === 'hot' ? d.getAttribute('data-hot') === '1' :
        d.getAttribute('data-cat') === f;
      d.classList.toggle('is-hidden', !match);
      if (match) {
        shown++;
        /* a filtered-in card that never scrolled into view would stay at
           opacity 0, so make sure it is revealed */
        d.classList.add('in');
      }
    });
    if (empty) empty.hidden = shown !== 0;
  }

  Array.prototype.forEach.call(chips, function (chip) {
    chip.addEventListener('click', function () {
      Array.prototype.forEach.call(chips, function (c) {
        c.classList.remove('is-on');
        c.setAttribute('aria-pressed', 'false');
      });
      chip.classList.add('is-on');
      chip.setAttribute('aria-pressed', 'true');
      applyFilter(chip.getAttribute('data-f'));
    });
  });

  /* ----- count up ----- */
  function countUp(el) {
    var to = parseFloat(el.getAttribute('data-to'));
    var dec = el.getAttribute('data-dec') === '1';
    if (isNaN(to)) return;
    if (reduced) {
      el.textContent = dec ? (to / 10).toFixed(1).replace('.', ',') : String(to);
      return;
    }
    var start = null, dur = 1100;
    function step(ts) {
      if (start === null) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      var v = to * eased;
      el.textContent = dec ? (v / 10).toFixed(1).replace('.', ',') : String(Math.round(v));
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  var counters = document.querySelectorAll('.cnt');
  if ('IntersectionObserver' in window) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { countUp(en.target); cio.unobserve(en.target); }
      });
    }, { threshold: 0 });
    Array.prototype.forEach.call(counters, function (el) { cio.observe(el); });
  } else {
    Array.prototype.forEach.call(counters, countUp);
  }
})();
