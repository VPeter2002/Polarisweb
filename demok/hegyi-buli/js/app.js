(function () {
  'use strict';

  var store = window.HegyiStore;

  var PROFILES = [
    { id: 'donat', name: 'Donát', color: '#E8792E' },
    { id: 'tamas', name: 'Tamás', color: '#4E7B5C' },
    { id: 'misi', name: 'Misi', color: '#C25D1A' },
    { id: 'marci', name: 'Marci', color: '#3E6B8A' },
    { id: 'botond', name: 'Botond', color: '#8A5A3E' },
    { id: 'peti', name: 'Peti', color: '#6B4E8A' }
  ];
  var PROFILE_IDS = PROFILES.map(function (p) { return p.id; });

  var DRINKS = {
    ser:        { name: 'Sör',          emoji: '🍺', ratio: null },
    kisfroccs:  { name: 'Kisfröccs',    emoji: '🥂', ratio: '1+1' },
    nagyfroccs: { name: 'Nagyfröccs',   emoji: '🍷', ratio: '2+1' },
    hosszulepes:{ name: 'Hosszúlépés',  emoji: '🚶', ratio: '1+2' },
    hazmester:  { name: 'Házmester',    emoji: '🔑', ratio: '3+2' },
    vicehaz:    { name: 'Viceházmester',emoji: '🗝️', ratio: '2+3' },
    sportfroccs:{ name: 'Sportfröccs',  emoji: '🏃', ratio: '1+4' },
    krudy:      { name: 'Krúdy-fröccs', emoji: '💀', ratio: '9+1' },
    palinka:    { name: 'Pálinka',      emoji: '🥃', ratio: null },
    forraltbor: { name: 'Forralt bor',  emoji: '☕', ratio: null }
  };

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

  function totalOf(drinkObj) {
    var sum = 0;
    Object.keys(drinkObj || {}).forEach(function (k) { sum += drinkObj[k]; });
    return sum;
  }

  function renderProfilePicker() {
    var grid = $('#profileGrid');
    grid.innerHTML = '';
    var current = getCurrentProfileId();
    PROFILES.forEach(function (p) {
      var card = document.createElement('div');
      card.className = 'profile-card' + (p.id === current ? ' active' : '');
      card.innerHTML =
        '<div class="profile-avatar" style="background:' + p.color + '">' + initial(p.name) + '</div>' +
        '<span class="pname">' + p.name + '</span>' +
        '<span class="ptag">' + (p.id === current ? 'te vagy' : 'választás') + '</span>';
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
      var total = totalOf(drinks);
      var totalChip = document.createElement('span');
      totalChip.className = 'my-stat-chip';
      totalChip.textContent = 'Összesen: ' + total + ' ital';
      wrap.appendChild(totalChip);
      Object.keys(DRINKS).forEach(function (key) {
        var count = drinks[key] || 0;
        if (!count) return;
        var chip = document.createElement('span');
        chip.className = 'my-stat-chip';
        chip.textContent = DRINKS[key].emoji + ' ' + DRINKS[key].name + ': ' + count;
        wrap.appendChild(chip);
      });
    });
  }

  function renderLeaderboard() {
    store.getAllDrinks(PROFILE_IDS).then(function (all) {
      var rows = PROFILES.map(function (p) {
        return { profile: p, total: totalOf(all[p.id]) };
      });
      rows.sort(function (a, b) { return b.total - a.total; });
      var maxTotal = Math.max(1, rows[0].total);

      var list = $('#boardList');
      list.innerHTML = '';
      var medals = ['🥇', '🥈', '🥉'];
      rows.forEach(function (row, i) {
        var el = document.createElement('div');
        el.className = 'board-row' + (i === 0 && row.total > 0 ? ' leader' : '');
        var pct = Math.round((row.total / maxTotal) * 100);
        el.innerHTML =
          '<span class="medal">' + (medals[i] || '') + '</span>' +
          '<span class="b-avatar" style="background:' + row.profile.color + '">' + initial(row.profile.name) + '</span>' +
          '<span class="b-info"><span class="b-name">' + row.profile.name + (i === 0 && row.total > 0 ? ' – a hegy ura 👑' : '') + '</span>' +
          '<span class="b-bar-wrap"><span class="b-bar" style="width:' + pct + '%"></span></span></span>' +
          '<span class="b-count">' + row.total + '</span>';
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
