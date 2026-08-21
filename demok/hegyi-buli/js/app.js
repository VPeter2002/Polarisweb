(function () {
  'use strict';

  var store = window.HegyiStore;

  var PROFILES = [
    { id: 'donat', name: 'Donát', color: '#E8792E', photo: 'img/buli-4.jpg' },
    { id: 'tamas', name: 'Tamás', color: '#4E7B5C', photo: 'img/buli-3.jpg' },
    { id: 'misi', name: 'Misi', color: '#C25D1A', photo: 'img/buli-7.jpg' },
    { id: 'marci', name: 'Marci', color: '#3E6B8A', photo: 'img/buli-5.jpg' },
    { id: 'botond', name: 'Botond', color: '#8A5A3E', photo: 'img/buli-2.jpg' },
    { id: 'peti', name: 'Peti', color: '#6B4E8A', photo: 'img/buli-1.jpg' }
  ];
  var PROFILE_IDS = PROFILES.map(function (p) { return p.id; });
  var AKOS_PHOTO = 'img/buli-6.jpg';

  /* wine/soda dl-ben, sör/pálinka darabban -- ugyanaz a leegyszerűsített
     alkohol-becslés, mint a Misi-oldalon: bor dl*100*0.11*0.8 g/dl,
     sör 500ml*0.05*0.8 g/db, pálinka 4cl*0.40*0.8 g/db (~12,8g/adag). */
  var DRINKS = {
    ser:        { name: 'Sör',          emoji: '🍺', wine: 0, soda: 0, ratio: null, isBeer: true },
    kisfroccs:  { name: 'Kisfröccs',    emoji: '🥂', wine: 1, soda: 1, ratio: '1+1' },
    nagyfroccs: { name: 'Nagyfröccs',   emoji: '🍷', wine: 2, soda: 1, ratio: '2+1' },
    hosszulepes:{ name: 'Hosszúlépés',  emoji: '🚶', wine: 1, soda: 2, ratio: '1+2' },
    hazmester:  { name: 'Házmester',    emoji: '🔑', wine: 3, soda: 2, ratio: '3+2' },
    vicehaz:    { name: 'Viceházmester',emoji: '🗝️', wine: 2, soda: 3, ratio: '2+3' },
    sportfroccs:{ name: 'Sportfröccs',  emoji: '🏃', wine: 1, soda: 4, ratio: '1+4' },
    krudy:      { name: 'Krúdy-fröccs', emoji: '💀', wine: 9, soda: 1, ratio: '9+1' },
    palinka:    { name: 'Pálinka',      emoji: '🥃', wine: 0, soda: 0, ratio: null, isShot: true }
  };

  var GRAMS_PER_WINE_DL = 100 * 0.11 * 0.8;   // ~8.8 g
  var GRAMS_PER_BEER = 500 * 0.05 * 0.8;      // 20 g
  var GRAMS_PER_SHOT = 40 * 0.40 * 0.8;       // ~12.8 g

  var CURRENT_KEY = 'hegyibuli-current-profile';

  var $ = function (sel) { return document.querySelector(sel); };
  var $$ = function (sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); };

  function getCurrentProfileId() {
    try { return localStorage.getItem(CURRENT_KEY); } catch (e) { return null; }
  }
  function setCurrentProfileId(id) {
    try { localStorage.setItem(CURRENT_KEY, id); } catch (e) {}
  }
  function profileById(id) {
    for (var i = 0; i < PROFILES.length; i++) if (PROFILES[i].id === id) return PROFILES[i];
    return null;
  }
  function initial(name) { return name.charAt(0).toUpperCase(); }

  function avatarInner(p) {
    return p.photo
      ? '<img src="' + p.photo + '" alt="' + p.name + '">'
      : initial(p.name);
  }

  function computeTotals(drinkObj) {
    var d = drinkObj || {};
    var count = 0, wineDl = 0, beerCount = 0, shotCount = 0;
    Object.keys(DRINKS).forEach(function (key) {
      var n = d[key] || 0;
      if (!n) return;
      var def = DRINKS[key];
      count += n;
      wineDl += n * def.wine;
      if (def.isBeer) beerCount += n;
      if (def.isShot) shotCount += n;
    });
    var alcoholG = wineDl * GRAMS_PER_WINE_DL + beerCount * GRAMS_PER_BEER + shotCount * GRAMS_PER_SHOT;
    return { count: count, wineDl: wineDl, beerCount: beerCount, shotCount: shotCount, alcoholG: alcoholG };
  }

  function categoryLine(t) {
    var parts = [];
    if (t.wineDl) parts.push('🍷 ' + (Math.round(t.wineDl * 10) / 10) + ' dl bor');
    if (t.beerCount) parts.push('🍺 ' + t.beerCount + ' sör');
    if (t.shotCount) parts.push('🥃 ' + t.shotCount + ' pálinka');
    return parts.length ? parts.join(' · ') : 'még semmi';
  }

  // Resolve the img/ base from an <img> already in the HTML (the Ákos avatar),
  // so JS-injected background-image paths match whatever the deploy transform
  // rewrote the HTML src to (relative locally, /demok/hegyi-buli/img/ live).
  function assetBase() {
    var ref = document.querySelector('.akos-card .profile-avatar img');
    if (ref) {
      var raw = ref.getAttribute('src') || '';
      var base = raw.replace(/[^/]*$/, '');
      if (base) return base;
    }
    return 'img/';
  }

  function renderProfilePicker() {
    var grid = $('#profileGrid');
    grid.innerHTML = '';
    var current = getCurrentProfileId();
    var base = assetBase();
    PROFILES.forEach(function (p) {
      var card = document.createElement('div');
      card.className = 'profile-card' + (p.id === current ? ' active' : '');
      card.style.setProperty('--pc', p.color);
      if (p.photo) card.style.backgroundImage = "url('" + base + p.photo.replace(/^img\//, '') + "')";
      else card.classList.add('no-photo');
      card.innerHTML =
        (p.photo ? '' : '<span class="pc-initial">' + initial(p.name) + '</span>') +
        '<div class="pc-overlay">' +
          '<span class="pname">' + p.name + '</span>' +
          '<span class="ptag">' + (p.id === current ? '✓ te vagy' : 'választás') + '</span>' +
        '</div>';
      card.addEventListener('click', function () { selectProfile(p.id); });
      grid.appendChild(card);
    });
  }

  function renderActiveBar() {
    var bar = $('#activeBar');
    var note = $('#noProfileNote');
    var current = getCurrentProfileId();
    var p = current ? profileById(current) : null;
    if (p) {
      bar.hidden = false;
      note.hidden = true;
      bar.querySelector('.txt').innerHTML = 'Te vagy: <strong>' + p.name + '</strong>';
    } else {
      bar.hidden = true;
      note.hidden = false;
    }

    var wallForm = $('#wallForm');
    var wallNote = $('#wallNoProfileNote');
    if (wallForm && wallNote) {
      wallForm.hidden = !p;
      wallNote.hidden = !!p;
    }
  }

  function buildDrinkButtonsOnce() {
    var grid = $('#counterGrid');
    Object.keys(DRINKS).forEach(function (key) {
      var d = DRINKS[key];
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'drink-btn';
      btn.setAttribute('data-key', key);
      btn.innerHTML =
        '<span class="emoji">' + d.emoji + '</span>' +
        '<span class="name">' + d.name + ' +1</span>' +
        (d.ratio ? '<span class="ratio">' + d.ratio + ' (bor+szóda)</span>' : '<span class="ratio">&nbsp;</span>');
      btn.addEventListener('click', function () { handleDrinkClick(key); });
      grid.appendChild(btn);
    });
  }

  function renderMyStats() {
    var current = getCurrentProfileId();
    var wrap = $('#myStats');
    var counterSection = $('#counterSection');
    if (!current) {
      counterSection.hidden = true;
      return;
    }
    counterSection.hidden = false;
    store.getDrinks(current).then(function (drinks) {
      wrap.innerHTML = '';
      var t = computeTotals(drinks);
      var totalChip = document.createElement('span');
      totalChip.className = 'my-stat-chip';
      totalChip.textContent = 'Összesen: ' + t.count + ' ital · ~' + Math.round(t.alcoholG) + ' g alkohol';
      wrap.appendChild(totalChip);
      var catChip = document.createElement('span');
      catChip.className = 'my-stat-chip';
      catChip.textContent = categoryLine(t);
      wrap.appendChild(catChip);
    });
  }

  function renderLeaderboard() {
    store.getAllDrinks(PROFILE_IDS).then(function (all) {
      var rows = PROFILES.map(function (p) {
        return { profile: p, totals: computeTotals(all[p.id]) };
      });
      rows.sort(function (a, b) { return b.totals.alcoholG - a.totals.alcoholG; });
      var maxG = Math.max(1, rows[0].totals.alcoholG);

      var list = $('#boardList');
      list.innerHTML = '';
      var medals = ['🥇', '🥈', '🥉'];
      rows.forEach(function (row, i) {
        var el = document.createElement('div');
        var leading = i === 0 && row.totals.alcoholG > 0;
        el.className = 'board-row' + (leading ? ' leader' : '');
        var pct = Math.round((row.totals.alcoholG / maxG) * 100);
        el.innerHTML =
          '<span class="medal">' + (medals[i] || '') + '</span>' +
          '<span class="b-avatar" style="border-color:' + row.profile.color + '">' + avatarInner(row.profile) + '</span>' +
          '<span class="b-info"><span class="b-name">' + row.profile.name + (leading ? ' – a hegy ura 👑' : '') + '</span>' +
          '<span class="b-cat">' + categoryLine(row.totals) + '</span>' +
          '<span class="b-bar-wrap"><span class="b-bar" style="width:' + pct + '%"></span></span></span>' +
          '<span class="b-count">~' + Math.round(row.totals.alcoholG) + ' g</span>';
        list.appendChild(el);
      });
    });
  }

  function handleDrinkClick(key) {
    var current = getCurrentProfileId();
    if (!current) return;
    store.addDrink(current, key).then(function () {
      renderMyStats();
      renderLeaderboard();
    });
  }

  function selectProfile(id) {
    setCurrentProfileId(id);
    renderProfilePicker();
    renderActiveBar();
    renderMyStats();
  }

  function newestFirst(list) { return list.slice().reverse(); }

  function renderWall() {
    store.getMessages().then(function (list) {
      var wrap = $('#wallList');
      wrap.innerHTML = '';
      if (!list.length) {
        wrap.innerHTML = '<div class="wall-empty">Még senki nem írt semmit – legyél te az első a hegyen!</div>';
        return;
      }
      newestFirst(list).forEach(function (item) {
        var div = document.createElement('div');
        div.className = 'wall-item';
        div.innerHTML = '<div class="who"></div><div class="msg"></div>';
        div.querySelector('.who').textContent = item.name;
        div.querySelector('.msg').textContent = item.msg;
        wrap.appendChild(div);
      });
    });
  }

  function handleWallSubmit(e) {
    e.preventDefault();
    var current = getCurrentProfileId();
    if (!current) return;
    var p = profileById(current);
    var msgEl = $('#wallMsg');
    var msg = msgEl.value.trim();
    if (!msg) return;
    store.addMessage(p.name, msg).then(function () {
      msgEl.value = '';
      renderWall();
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    buildDrinkButtonsOnce();
    renderProfilePicker();
    renderActiveBar();
    renderMyStats();
    renderLeaderboard();
    renderWall();

    var wallForm = $('#wallForm');
    if (wallForm) wallForm.addEventListener('submit', handleWallSubmit);
  });
})();
