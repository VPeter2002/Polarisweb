document.addEventListener('DOMContentLoaded', function () {
  var toggle = document.querySelector('.nav-toggle');
  var menu = document.querySelector('.mobile-menu');
  if (toggle && menu) {
    function close() {
      toggle.classList.remove('open');
      menu.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    }
    toggle.addEventListener('click', function () {
      var isOpen = menu.classList.toggle('open');
      toggle.classList.toggle('open', isOpen);
      toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
    menu.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', close);
    });
  }

  var navDropdowns = document.querySelectorAll('.nav-dropdown');
  navDropdowns.forEach(function (dd) {
    dd.addEventListener('toggle', function () {
      if (dd.open) {
        navDropdowns.forEach(function (other) { if (other !== dd) other.open = false; });
      }
    });
  });
  document.addEventListener('click', function (e) {
    navDropdowns.forEach(function (dd) {
      if (dd.open && !dd.contains(e.target)) dd.open = false;
    });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      navDropdowns.forEach(function (dd) { dd.open = false; });
    }
  });

  var header = document.querySelector('.site-header');
  if (header) {
    var onScroll = function () {
      header.classList.toggle('scrolled', window.scrollY > 12);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  var revealEls = document.querySelectorAll('.reveal');
  if (revealEls.length && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12 });
    revealEls.forEach(function (el) { io.observe(el); });
  }

  var logo = document.getElementById('brandLogo');
  if (logo) {
    var spin = function () {
      logo.classList.remove('logo-spin');
      void logo.offsetWidth;
      logo.classList.add('logo-spin');
    };
    window.setTimeout(spin, 350);
    logo.addEventListener('mouseenter', spin);
  }
});
