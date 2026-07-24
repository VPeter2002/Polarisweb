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

  function applyFilters() {
    var mufaj = mufajSelect.value;
    var regio = regioSelect.value;
    var stilus = activeStilus();
    var visibleCount = 0;

    cards.forEach(function (card) {
      var matches =
        hasValue(card.dataset.mufaj, mufaj) &&
        (!regio || card.dataset.regio === regio) &&
        hasValue(card.dataset.stilus, stilus);
      card.hidden = !matches;
      if (matches) visibleCount++;
    });

    if (countEl) {
      countEl.textContent = visibleCount === 1 ? '1 fotós található' : visibleCount + ' fotós található';
    }
    if (noResults) noResults.hidden = visibleCount !== 0;

    updateUrl(mufaj, regio, stilus);
  }

  mufajSelect.addEventListener('change', applyFilters);
  regioSelect.addEventListener('change', applyFilters);
  chips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      chips.forEach(function (c) { c.classList.remove('active'); });
      chip.classList.add('active');
      applyFilters();
    });
  });

  readQueryParams();
  applyFilters();
});
