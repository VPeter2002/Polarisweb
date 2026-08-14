(function () {
  var grid = document.getElementById('galGrid');
  var filters = document.getElementById('galFilters');
  if (!grid || !filters) return;

  var items = Array.prototype.slice.call(grid.querySelectorAll('.gal-item'));
  var visible = items.slice();

  /* ---- filtering ---- */
  filters.addEventListener('click', function (e) {
    var chip = e.target.closest('.gal-chip');
    if (!chip) return;
    var cat = chip.getAttribute('data-cat');

    filters.querySelectorAll('.gal-chip').forEach(function (c) {
      var on = c === chip;
      c.classList.toggle('is-active', on);
      c.setAttribute('aria-pressed', on ? 'true' : 'false');
    });

    visible = [];
    items.forEach(function (it) {
      var show = cat === 'mind' || it.getAttribute('data-cat') === cat;
      it.hidden = !show;
      if (show) visible.push(it);
    });
  });

  /* ---- lightbox ---- */
  var box = document.getElementById('lightbox');
  var img = document.getElementById('lbImg');
  var cap = document.getElementById('lbCap');
  var count = document.getElementById('lbCount');
  var pos = 0;
  var lastFocus = null;

  /* The full-size file sits next to the thumb: 01-t.jpg -> 01.jpg. Derived from the
     resolved src, not a data- attribute, so subdirectory deploys rewrite it too. */
  function render() {
    var it = visible[pos];
    if (!it) return;
    var thumb = it.querySelector('img');
    img.src = thumb.src.replace(/-t(\.jpe?g)$/i, '$1');
    img.alt = thumb.getAttribute('alt');
    cap.textContent = it.querySelector('figcaption').textContent;
    count.textContent = (pos + 1) + ' / ' + visible.length;
  }

  function open(it) {
    pos = visible.indexOf(it);
    if (pos < 0) return;
    lastFocus = document.activeElement;
    render();
    box.hidden = false;
    document.body.style.overflow = 'hidden';
    document.getElementById('lbClose').focus();
  }

  function close() {
    box.hidden = true;
    img.src = '';
    document.body.style.overflow = '';
    if (lastFocus) lastFocus.focus();
  }

  function step(d) {
    if (!visible.length) return;
    pos = (pos + d + visible.length) % visible.length;
    render();
  }

  grid.addEventListener('click', function (e) {
    var btn = e.target.closest('.gal-open');
    if (!btn) return;
    open(btn.closest('.gal-item'));
  });

  document.getElementById('lbClose').addEventListener('click', close);
  document.getElementById('lbPrev').addEventListener('click', function () { step(-1); });
  document.getElementById('lbNext').addEventListener('click', function () { step(1); });

  box.addEventListener('click', function (e) {
    if (e.target === box || e.target.classList.contains('lb-figure')) close();
  });

  document.addEventListener('keydown', function (e) {
    if (box.hidden) return;
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowLeft') step(-1);
    else if (e.key === 'ArrowRight') step(1);
  });

  /* swipe on touch */
  var x0 = null;
  box.addEventListener('touchstart', function (e) { x0 = e.changedTouches[0].clientX; }, { passive: true });
  box.addEventListener('touchend', function (e) {
    if (x0 === null) return;
    var dx = e.changedTouches[0].clientX - x0;
    if (Math.abs(dx) > 45) step(dx < 0 ? 1 : -1);
    x0 = null;
  }, { passive: true });
})();
