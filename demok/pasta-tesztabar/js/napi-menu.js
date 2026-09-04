/* PASTA. -- napi menü (publikus megjelenítés).
   A Supabase-ből olvassa a LEGUTÓBB mentett napi menüt és berendereli a
   #napi-menu-content konténerbe. Ha nincs háló / nincs mentett menü, marad az
   üres-állapot szöveg. Csak OLVAS, nem ír (az írás az admin oldal dolga). */
(function () {
  'use strict';

  var SUPABASE_URL = 'https://lyagqwuqzurkkvcnjqtg.supabase.co';
  var ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5YWdxd3VxenVya2t2Y25qcXRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5MDE2NzIsImV4cCI6MjA5NTQ3NzY3Mn0.tuoGksKYjjiaohdTaNt_vvnY1mB9IUpoQC3cAqA9-tU';
  var REST = SUPABASE_URL + '/rest/v1/';

  var HU_MONTHS = ['január', 'február', 'március', 'április', 'május', 'június',
    'július', 'augusztus', 'szeptember', 'október', 'november', 'december'];
  var HU_DAYS = ['vasárnap', 'hétfő', 'kedd', 'szerda', 'csütörtök', 'péntek', 'szombat'];

  function huDate(dstr) {
    // dstr: 'YYYY-MM-DD' -> "2026. szeptember 4., csütörtök"
    var p = String(dstr).split('-');
    if (p.length !== 3) return dstr;
    var d = new Date(+p[0], +p[1] - 1, +p[2]);
    return p[0] + '. ' + HU_MONTHS[+p[1] - 1] + ' ' + (+p[2]) + '., ' + HU_DAYS[d.getDay()];
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  function render(row) {
    var box = document.getElementById('napi-menu-content');
    if (!box) return;

    if (!row || !Array.isArray(row.items) || !row.items.length) {
      box.innerHTML = '<p class="nm-empty">A mai menü hamarosan. Kövess minket a Facebookon a napi ajánlatért.</p>';
      return;
    }

    var html = '';
    // A kártya fejléce (Irisz) már adja a "Mai menü" címet, itt a dátum jön.
    html += '<div class="nm-date">' + esc(huDate(row.menu_date)) + '</div>';
    var t = (row.title || '').trim();
    if (t && t.toLowerCase() !== 'napi menü' && t.toLowerCase() !== 'mai menü') {
      html += '<div class="nm-subtitle">' + esc(t) + '</div>';
    }

    html += '<ul class="nm-list">';
    row.items.forEach(function (it) {
      if (!it || (!it.name && !it.price)) return;
      html += '<li class="nm-item">';
      html += '<span class="nm-name">' + esc(it.name || '') + '</span>';
      if (it.price) html += '<span class="nm-dots" aria-hidden="true"></span><span class="nm-price">' + esc(it.price) + '</span>';
      html += '</li>';
    });
    html += '</ul>';

    if (row.note) html += '<p class="nm-note">' + esc(row.note) + '</p>';

    box.innerHTML = html;
  }

  function load() {
    var box = document.getElementById('napi-menu-content');
    if (!box) return; // az oldalon nincs napi-menü szekció
    fetch(REST + 'pasta_napi_menu?select=*&order=menu_date.desc&limit=1', {
      headers: { 'apikey': ANON, 'Authorization': 'Bearer ' + ANON }
    })
      .then(function (r) { return r.ok ? r.json() : []; })
      .then(function (rows) { render(rows && rows[0]); })
      .catch(function () { /* marad az üres-állapot */ });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', load);
  } else {
    load();
  }
})();
