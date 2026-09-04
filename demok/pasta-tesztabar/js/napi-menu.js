/* PASTA. -- napi menü (publikus, TELEPHELYENKÉNT).
   A Supabase-ből olvassa a mai napi menüt telephelyenként (pasta_daily) és az
   étel-katalógust (pasta_dishes). A #napi-menu-content-be telephely-tabokat renderel
   (kattintható), a #etlap-content-be a teljes katalógust. Csak OLVAS. */
(function () {
  'use strict';

  var SUPABASE_URL = 'https://lyagqwuqzurkkvcnjqtg.supabase.co';
  var ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5YWdxd3VxenVya2t2Y25qcXRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5MDE2NzIsImV4cCI6MjA5NTQ3NzY3Mn0.tuoGksKYjjiaohdTaNt_vvnY1mB9IUpoQC3cAqA9-tU';
  var REST = SUPABASE_URL + '/rest/v1/';

  // A 4 telephely (fix). A napi menüt a slug köti össze a pasta_daily-vel.
  var LOCATIONS = [
    { slug: 'kalvin',  name: 'Kálvin tér 2.',  hours: '11:00-20:00' },
    { slug: 'apaly',   name: 'Apály utca 2/E.', hours: '10:00-16:00' },
    { slug: 'tuzolto', name: 'Tűzoltó utca 50-56.', hours: '10:00-19:00' },
    { slug: 'nyugati', name: 'Nyugati tér 8.',  hours: '11:00-17:00' }
  ];

  var HU_MONTHS = ['január', 'február', 'március', 'április', 'május', 'június',
    'július', 'augusztus', 'szeptember', 'október', 'november', 'december'];
  var HU_DAYS = ['vasárnap', 'hétfő', 'kedd', 'szerda', 'csütörtök', 'péntek', 'szombat'];

  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function todayStr() { var d = new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function huDate(dstr) {
    var p = String(dstr).split('-'); if (p.length !== 3) return dstr;
    var d = new Date(+p[0], +p[1] - 1, +p[2]);
    return p[0] + '. ' + HU_MONTHS[+p[1] - 1] + ' ' + (+p[2]) + '., ' + HU_DAYS[d.getDay()];
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }
  function sb(path) {
    return fetch(REST + path, { headers: { 'apikey': ANON, 'Authorization': 'Bearer ' + ANON } })
      .then(function (r) { return r.ok ? r.json() : []; });
  }

  // ---------- napi menü (telephely-tabok) ----------
  function renderDaily(rows) {
    var box = document.getElementById('napi-menu-content');
    if (!box) return;

    var bySlug = {};
    (rows || []).forEach(function (r) { bySlug[r.location_slug] = r; });
    var active = LOCATIONS.filter(function (l) { return bySlug[l.slug]; });

    if (!active.length) {
      box.innerHTML = '<p class="nm-empty">A mai menü hamarosan. Kövess minket a Facebookon a napi ajánlatért.</p>';
      return;
    }

    var date = huDate((bySlug[active[0].slug] || {}).menu_date || todayStr());
    var price = (bySlug[active[0].slug] || {}).price || '';
    var note = (bySlug[active[0].slug] || {}).note || '';

    var html = '<div class="nm-topline"><span class="nm-date">' + esc(date) + '</span>';
    if (price) html += '<span class="nm-price-badge">Minden tészta ' + esc(price) + '</span>';
    html += '</div>';

    // tabok
    html += '<div class="nm-tabs" role="tablist">';
    active.forEach(function (l, i) {
      html += '<button class="nm-tab' + (i === 0 ? ' is-active' : '') + '" data-slug="' + esc(l.slug) + '">' + esc(l.name) + '</button>';
    });
    html += '</div>';

    // panelok
    active.forEach(function (l, i) {
      var r = bySlug[l.slug];
      html += '<div class="nm-panel' + (i === 0 ? ' is-active' : '') + '" data-slug="' + esc(l.slug) + '">';
      html += '<div class="nm-loc-hours">' + esc(l.hours) + '</div>';
      html += '<ul class="nm-list">';
      (r.items || []).forEach(function (it) {
        if (!it || !it.name) return;
        html += '<li class="nm-item"><span class="nm-name">' + esc(it.name) + '</span>';
        if (it.description) html += '<span class="nm-desc">' + esc(it.description) + '</span>';
        html += '</li>';
      });
      html += '</ul></div>';
    });

    if (note) html += '<p class="nm-note">' + esc(note) + '</p>';

    box.innerHTML = html;

    // tab-váltás
    var tabs = box.querySelectorAll('.nm-tab');
    var panels = box.querySelectorAll('.nm-panel');
    tabs.forEach(function (t) {
      t.addEventListener('click', function () {
        var slug = t.getAttribute('data-slug');
        tabs.forEach(function (x) { x.classList.toggle('is-active', x === t); });
        panels.forEach(function (p) { p.classList.toggle('is-active', p.getAttribute('data-slug') === slug); });
      });
    });
  }

  // ---------- állandó étlap = étel-katalógus ----------
  function renderCatalog(dishes) {
    var box = document.getElementById('etlap-content');
    if (!box) return;
    if (!dishes || !dishes.length) return; // hagyd a meglévő tartalmat
    var html = '<div class="cat-grid">';
    dishes.forEach(function (d) {
      html += '<div class="cat-row"><div class="cat-name">' + esc(d.name) + '</div>';
      if (d.description) html += '<div class="cat-desc">' + esc(d.description) + '</div>';
      html += '</div>';
    });
    html += '</div>';
    box.innerHTML = html;
  }

  function load() {
    var day = todayStr();
    if (document.getElementById('napi-menu-content')) {
      sb('pasta_daily?select=*&menu_date=eq.' + encodeURIComponent(day))
        .then(renderDaily).catch(function () {});
    }
    if (document.getElementById('etlap-content')) {
      sb('pasta_dishes?select=name,description,sort&order=sort.asc')
        .then(renderCatalog).catch(function () {});
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', load);
  else load();
})();
