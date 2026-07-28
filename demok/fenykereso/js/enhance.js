/* Elevation layer: scroll reveals, hero scroll-cue, tactile polish.
   Progressive enhancement -- everything is visible/usable without JS. */
(function () {
  var root = document.documentElement;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  root.classList.add('js-anim');

  /* ---- inject a scroll cue into the hero ---- */
  var hero = document.querySelector('.hero');
  if (hero && !hero.querySelector('.scroll-cue')) {
    var cue = document.createElement('div');
    cue.className = 'scroll-cue';
    cue.innerHTML = 'görgess<span></span>';
    hero.appendChild(cue);
  }

  document.addEventListener('DOMContentLoaded', function () {
    /* ---- staggered reveal on scroll ---- */
    var groups = [
      { sel: '.results-grid .photog-card', step: 0.06, cap: 0.42 },
      { sel: '.photog-grid .photog-card', step: 0.08, cap: 0.4 },
      { sel: '.how-step', step: 0.1, cap: 0.3 },
      { sel: '.value-card', step: 0.1, cap: 0.3 },
      { sel: '.section-head', step: 0, cap: 0 },
      { sel: '.portfolio-grid .ph-cover', step: 0.05, cap: 0.4 },
      { sel: '.pricing-card', step: 0, cap: 0 },
      { sel: '.offer-info', step: 0, cap: 0 }
    ];
    var targets = [];
    groups.forEach(function (g) {
      var nodes = Array.prototype.slice.call(document.querySelectorAll(g.sel));
      nodes.forEach(function (node, i) {
        if (node.hasAttribute('data-reveal')) return;
        node.setAttribute('data-reveal', '');
        var delay = Math.min(i * g.step, g.cap);
        node.style.setProperty('--reveal-delay', delay + 's');
        targets.push(node);
      });
    });

    if (reduce || !('IntersectionObserver' in window)) {
      targets.forEach(function (n) { n.classList.add('is-visible'); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('is-visible');
          io.unobserve(e.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

    targets.forEach(function (n) { io.observe(n); });

    /* safety: if anything is already in view above the fold, reveal immediately */
    requestAnimationFrame(function () {
      targets.forEach(function (n) {
        var r = n.getBoundingClientRect();
        if (r.top < window.innerHeight * 0.92) n.classList.add('is-visible');
      });
    });
  });
})();
