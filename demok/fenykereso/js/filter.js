document.addEventListener('DOMContentLoaded', function () {
  var mufajSelect = document.getElementById('filterMufaj');
  var regioSelect = document.getElementById('filterRegio');
  var stilusGroup = document.getElementById('filterStilus');
  var grid = document.getElementById('resultsGrid');
  var countEl = document.getElementById('resultsCount');
  var noResults = document.getElementById('noResults');
  if (!grid || !mufajSelect || !regioSelect || !stilusGroup) return;

  var cards = Array.prototype.slice.call(grid.querySelectorAll('.photog-card'));
  var chips = Array.prototype.slice.call(stilusGroup.querySelectorAll('.filter-chip'));

  function setSelectValue(select, value) {
    if (!value) return;
    var match = Array.prototype.slice.call(select.options).some(function (opt) {
      return opt.value === value || opt.textContent === value;
    });
    if (match) select.value = value;
  }

  function readQueryParams() {
    var params = new URLSearchParams(window.location.search);
    setSelectValue(mufajSelect, params.get('mufaj'));
    setSelectValue(regioSelect, params.get('regio'));
    var stilus = params.get('stilus');
    if (stilus) {
      chips.forEach(function (chip) {
        chip.classList.toggle('active', chip.dataset.stilus === stilus);
      });
    }
  }

  function activeStilus() {
    var active = chips.filter(function (chip) { return chip.classList.contains('active'); })[0];
    return active ? active.dataset.stilus : '';
  }

  function updateUrl(mufaj, regio, stilus) {
    var params = new URLSearchParams();
    if (mufaj) params.set('mufaj', mufaj);
    if (regio) params.set('regio', regio);
    if (stilus) params.set('stilus', stilus);
    var query = params.toString();
    var newUrl = window.location.pathname + (query ? '?' + query : '');
    try {
      window.history.replaceState(null, '', newUrl);
    } catch (e) {
      /* file:// local preview can block history writes; filtering itself still works */
    }
  }

  function hasValue(datasetValue, value) {
    if (!value) return true;
    if (!datasetValue) return false;
    var values = datasetValue.split(',').map(function (v) { return v.trim(); });
    return values.indexOf(value) !== -1;
  }

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var lastCount = null;

  function renderCount(n) {
    if (!countEl) return;
    var suffix = ' fotós található';
    if (reduceMotion || lastCount === null || lastCount === n) {
      countEl.innerHTML = '<span class="count-num">' + n + '</span>' + suffix;
      lastCount = n;
      return;
    }
    var from = lastCount, to = n, start = null, dur = 380;
    function tick(ts) {
      if (start === null) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var val = Math.round(from + (to - from) * (1 - Math.pow(1 - p, 3)));
      countEl.innerHTML = '<span class="count-num">' + val + '</span>' + suffix;
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
    lastCount = n;
  }

  function applyFilters(animate) {
    var mufaj = mufajSelect.value;
    var regio = regioSelect.value;
    var stilus = activeStilus();
    var visibleCount = 0;

    cards.forEach(function (card) {
      var matches =
        hasValue(card.dataset.mufaj, mufaj) &&
        (!regio || card.dataset.regio === regio) &&
        hasValue(card.dataset.stilus, stilus);
      var wasHidden = card.hidden;
      card.hidden = !matches;
      if (matches) {
        visibleCount++;
        if (animate && !reduceMotion && wasHidden) {
          card.classList.remove('card-enter');
          // force reflow so the animation restarts
          void card.offsetWidth;
          card.classList.add('card-enter');
        }
      }
    });

    renderCount(visibleCount);
    if (noResults) noResults.hidden = visibleCount !== 0;
    updateUrl(mufaj, regio, stilus);
  }

  cards.forEach(function (card) {
    card.addEventListener('animationend', function () { card.classList.remove('card-enter'); });
  });

  mufajSelect.addEventListener('change', function () { applyFilters(true); });
  regioSelect.addEventListener('change', function () { applyFilters(true); });
  chips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      chips.forEach(function (c) { c.classList.remove('active'); });
      chip.classList.add('active');
      applyFilters(true);
    });
  });

  readQueryParams();
  applyFilters(false);
});
