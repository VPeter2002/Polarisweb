/* PASTA. -- napi menü admin (telephelyenként + étel-katalógus).
   Telephelyet valasztasz, a mai tesztakat a katalogusbol (legordulo) adod hozza,
   mented (jelszavas RPC). Uj teszta felveheto a katalogusba. Export: teljes poszt-szoveg
   (osszes telephely) + Facebook-kep (aktualis telephely, canvas). A jelszo NINCS itt. */
(function () {
  'use strict';

  var SUPABASE_URL = 'https://lyagqwuqzurkkvcnjqtg.supabase.co';
  var ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5YWdxd3VxenVya2t2Y25qcXRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5MDE2NzIsImV4cCI6MjA5NTQ3NzY3Mn0.tuoGksKYjjiaohdTaNt_vvnY1mB9IUpoQC3cAqA9-tU';
  var REST = SUPABASE_URL + '/rest/v1/';
  var C = { brand: '#D8432A', green: '#4C7A3D', gold: '#F2A93B', cream: '#FBF3E6', ink: '#221D1A', muted: '#6b645b' };

  var LOCATIONS = [
    { slug: 'kalvin', name: 'Kálvin tér 2.', hours: '11:00-20:00' },
    { slug: 'apaly', name: 'Apály utca 2/E.', hours: '10:00-16:00' },
    { slug: 'tuzolto', name: 'Tűzoltó utca 50-56. (Dean\'s College)', hours: '10:00-19:00' },
    { slug: 'nyugati', name: 'Nyugati tér 8.', hours: '11:00-17:00' }
  ];
  var HU_MONTHS = ['január', 'február', 'március', 'április', 'május', 'június', 'július', 'augusztus', 'szeptember', 'október', 'november', 'december'];
  var HU_DAYS = ['vasárnap', 'hétfő', 'kedd', 'szerda', 'csütörtök', 'péntek', 'szombat'];
  var HU_DAY_ADJ = ['VASÁRNAPI', 'HÉTFŐI', 'KEDDI', 'SZERDAI', 'CSÜTÖRTÖKI', 'PÉNTEKI', 'SZOMBATI'];

  var $ = function (id) { return document.getElementById(id); };
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function todayStr() { var d = new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function dObj(s) { var p = String(s).split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function huDate(s) { var p = String(s).split('-'); if (p.length !== 3) return s; return p[0] + '. ' + HU_MONTHS[+p[1] - 1] + ' ' + (+p[2]) + '., ' + HU_DAYS[dObj(s).getDay()]; }

  var catalog = [];          // [{name, description}]
  var byName = {};           // name -> description
  var state = {};            // slug -> [{name, description}]
  var active = LOCATIONS[0].slug;

  function sb(path, opts) { return fetch(REST + path, opts).then(function (r) { return r.ok ? (r.status === 204 ? null : r.json()) : Promise.reject(r.status); }); }
  function h(extra) { var o = { 'apikey': ANON, 'Authorization': 'Bearer ' + ANON, 'Content-Type': 'application/json' }; if (extra) Object.keys(extra).forEach(function (k) { o[k] = extra[k]; }); return o; }

  // ---------- betöltés ----------
  function loadAll() {
    var date = $('f-date').value || todayStr();
    Promise.all([
      sb('pasta_dishes?select=name,description,sort&order=sort.asc', { headers: h() }).catch(function () { return []; }),
      sb('pasta_daily?select=*&menu_date=eq.' + encodeURIComponent(date), { headers: h() }).catch(function () { return []; })
    ]).then(function (res) {
      catalog = res[0] || []; byName = {}; catalog.forEach(function (d) { byName[d.name] = d.description; });
      state = {};
      (res[1] || []).forEach(function (r) { state[r.location_slug] = (r.items || []); });
      var first = (res[1] || [])[0];
      if (first) { if (first.price) $('f-price').value = first.price; if (first.note) $('f-note').value = first.note; }
      renderTabs(); renderRows(); draw();
    });
  }

  // ---------- telephely tabok ----------
  function renderTabs() {
    var t = $('loc-tabs'); t.innerHTML = '';
    LOCATIONS.forEach(function (l) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'tab' + (l.slug === active ? ' is-active' : '');
      b.textContent = shortName(l.name);
      b.addEventListener('click', function () { saveActiveToState(); active = l.slug; renderTabs(); renderRows(); draw(); });
      t.appendChild(b);
    });
    var loc = LOCATIONS.filter(function (l) { return l.slug === active; })[0];
    $('loc-hours').textContent = loc ? (loc.name + ' -- ' + loc.hours) : '';
  }
  function shortName(n) { return n.split(' (')[0]; }

  // ---------- ételsorok (katalógus legördülő) ----------
  function optionsHtml(sel) {
    var o = '<option value="">-- válassz tésztát --</option>';
    catalog.forEach(function (d) { o += '<option value="' + attr(d.name) + '"' + (d.name === sel ? ' selected' : '') + '>' + esc(d.name) + '</option>'; });
    return o;
  }
  function addRow(name) {
    var row = document.createElement('div'); row.className = 'drow';
    row.innerHTML = '<select class="i-dish">' + optionsHtml(name || '') + '</select><button class="del" type="button" title="Törlés">&times;</button>';
    row.querySelector('.del').addEventListener('click', function () { row.remove(); draw(); });
    row.querySelector('select').addEventListener('change', draw);
    $('drows').appendChild(row);
  }
  function renderRows() {
    var box = $('drows'); box.innerHTML = '';
    var items = state[active] || [];
    if (!items.length) { addRow(''); addRow(''); }
    else items.forEach(function (it) { addRow(it.name); });
  }
  function collectActive() {
    var items = [];
    $('drows').querySelectorAll('select.i-dish').forEach(function (s) {
      var name = s.value.trim(); if (!name) return;
      items.push({ name: name, description: byName[name] || '' });
    });
    return items;
  }
  function saveActiveToState() { state[active] = collectActive(); }

  // ---------- mentés ----------
  function saveLocation() {
    var pass = $('f-pass').value; if (!pass) { setStatus('status', 'Add meg a jelszót.', 'err'); return; }
    var items = collectActive();
    if (!items.length) { setStatus('status', 'Legalább egy tésztát válassz.', 'err'); return; }
    var date = $('f-date').value || todayStr();
    setStatus('status', 'Mentés...', ''); $('save').disabled = true;
    sb('rpc/pasta_daily_upsert', { method: 'POST', headers: h(), body: JSON.stringify({ p_passcode: pass, p_date: date, p_location: active, p_items: items, p_price: $('f-price').value.trim(), p_note: $('f-note').value.trim() }) })
      .then(function () { $('save').disabled = false; state[active] = items; try { localStorage.setItem('pasta-admin-pass', pass); } catch (e) {} setStatus('status', shortName(loc(active).name) + ' mentve, fent van a weboldalon.', 'ok'); })
      .catch(function (code) { $('save').disabled = false; setStatus('status', code === 400 ? 'Hibás jelszó.' : 'Hiba (' + code + ').', 'err'); });
  }
  function loc(slug) { return LOCATIONS.filter(function (l) { return l.slug === slug; })[0]; }

  // ---------- új étel a katalógusba ----------
  function addCatalog() {
    var pass = $('f-pass').value; if (!pass) { setStatus('cat-status', 'Add meg a jelszót.', 'err'); return; }
    var name = $('nd-name').value.trim(); if (!name) { setStatus('cat-status', 'Add meg a nevet.', 'err'); return; }
    var desc = $('nd-desc').value.trim();
    setStatus('cat-status', 'Hozzáadás...', ''); $('add-catalog').disabled = true;
    sb('rpc/pasta_dish_add', { method: 'POST', headers: h(), body: JSON.stringify({ p_passcode: pass, p_name: name, p_description: desc }) })
      .then(function () {
        $('add-catalog').disabled = false;
        var up = name.toUpperCase();
        if (!byName.hasOwnProperty(up)) catalog.push({ name: up, description: desc });
        byName[up] = desc;
        $('nd-name').value = ''; $('nd-desc').value = '';
        refreshSelects();
        setStatus('cat-status', up + ' hozzáadva a katalógushoz.', 'ok');
      })
      .catch(function (code) { $('add-catalog').disabled = false; setStatus('cat-status', code === 400 ? 'Hibás jelszó.' : 'Hiba (' + code + ').', 'err'); });
  }
  function refreshSelects() {
    $('drows').querySelectorAll('select.i-dish').forEach(function (s) { var v = s.value; s.innerHTML = optionsHtml(v); });
  }

  // ---------- poszt szöveg ----------
  function genText() {
    saveActiveToState();
    var date = $('f-date').value || todayStr();
    var adj = HU_DAY_ADJ[dObj(date).getDay()];
    var p = date.split('-');
    var lines = [];
    lines.push(adj + ' TÉSZTÁK (' + p[1] + '.' + p[2] + '.)');
    lines.push('');
    lines.push('Minden tésztánk ' + ($('f-price').value.trim() || '2500 Ft') + '.');
    var note = $('f-note').value.trim();
    if (note) { lines.push(''); lines.push(note); }
    LOCATIONS.forEach(function (l) {
      var items = state[l.slug] || [];
      if (!items.length) return;
      lines.push('');
      lines.push(l.name.toUpperCase() + ' (' + l.hours + ')');
      items.forEach(function (it) {
        lines.push('');
        lines.push(it.name);
        if (it.description) lines.push(it.description.split(' · ').join('\n'));
      });
    });
    lines.push('');
    lines.push('Jó étvágyat!');
    $('posttext').value = lines.join('\n');
    setStatus('status', 'Poszt szöveg elkészült, másolható.', 'ok');
  }
  function copyText() {
    if (!$('posttext').value) genText();
    var ta = $('posttext'); ta.select();
    try { navigator.clipboard.writeText(ta.value); } catch (e) { document.execCommand('copy'); }
    setStatus('status', 'Szöveg a vágólapon.', 'ok');
  }

  // ---------- Facebook-kép (canvas, aktuális telephely) ----------
  function draw() {
    var cv = $('preview'); if (!cv) return;
    var ctx = cv.getContext('2d'); var W = cv.width, H = cv.height;
    var date = $('f-date').value || todayStr();
    var l = loc(active); var items = collectActive();

    ctx.fillStyle = C.cream; ctx.fillRect(0, 0, W, H);
    var bandH = 250;
    ctx.fillStyle = C.brand; ctx.fillRect(0, 0, W, bandH);
    ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'; ctx.fillStyle = '#fff';
    ctx.font = '800 96px Unbounded, system-ui, sans-serif'; ctx.fillText('PASTA.', W / 2, 160);
    ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.font = '500 28px Sora, Arial, sans-serif'; ctx.fillText('friss tészta, minden nap', W / 2, 205);

    ctx.fillStyle = C.green; ctx.font = '700 46px Unbounded, system-ui, sans-serif';
    ctx.fillText(shortName(l.name).toUpperCase(), W / 2, bandH + 74);
    ctx.fillStyle = C.ink; ctx.font = '600 28px Sora, Arial, sans-serif';
    ctx.fillText(huDate(date) + '  ·  ' + l.hours, W / 2, bandH + 116);
    ctx.strokeStyle = C.brand; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(W / 2 - 60, bandH + 150); ctx.lineTo(W / 2 + 60, bandH + 150); ctx.stroke();

    var footerH = 110;
    var top = bandH + 200, bottom = H - footerH - 24;
    var list = items.length ? items : [{ name: 'Válassz tésztát...', description: '' }];
    var padX = 90;
    var slotH = (bottom - top) / list.length;
    var nameSize = list.length > 4 ? 30 : 36;
    var descSize = list.length > 4 ? 20 : 22;

    ctx.textAlign = 'left';
    list.forEach(function (it, i) {
      var y = top + i * slotH + 14;
      ctx.textBaseline = 'top';
      ctx.fillStyle = C.ink; ctx.font = '700 ' + nameSize + 'px Unbounded, system-ui, sans-serif';
      ctx.fillText(it.name, padX, y);
      if (it.description) {
        ctx.fillStyle = C.muted; ctx.font = '400 ' + descSize + 'px Sora, Arial, sans-serif';
        wrap(ctx, it.description, padX, y + nameSize + 12, W - padX * 2, descSize + 8, 2);
      }
    });

    ctx.fillStyle = C.ink; ctx.fillRect(0, H - footerH, W, footerH);
    ctx.textBaseline = 'middle';
    ctx.fillStyle = C.gold; ctx.textAlign = 'left'; ctx.font = '700 26px Sora, Arial, sans-serif';
    ctx.fillText('Minden tészta ' + ($('f-price').value.trim() || '2500 Ft'), padX, H - footerH / 2);
    ctx.fillStyle = '#fff'; ctx.textAlign = 'right'; ctx.font = '800 28px Unbounded, system-ui, sans-serif';
    ctx.fillText('PASTA.', W - padX, H - footerH / 2);
  }
  function wrap(ctx, text, x, y, maxW, lh, maxLines) {
    var words = text.replace(/ · /g, ' · ').split(' '); var line = '', lines = [];
    for (var i = 0; i < words.length; i++) {
      var t = line ? line + ' ' + words[i] : words[i];
      if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = words[i]; if (lines.length === maxLines - 1) { } }
      else line = t;
    }
    if (line) lines.push(line);
    lines.slice(0, maxLines).forEach(function (l, i) { ctx.fillText(l, x, y + i * lh); });
  }
  function download() {
    var l = loc(active); var date = $('f-date').value || todayStr();
    $('preview').toBlob(function (b) {
      var u = URL.createObjectURL(b), a = document.createElement('a');
      a.href = u; a.download = 'pasta-' + active + '-' + date + '.png'; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(u); }, 1000);
    }, 'image/png');
  }

  // ---------- util ----------
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]; }); }
  function attr(s) { return String(s == null ? '' : s).replace(/"/g, '&quot;'); }
  function setStatus(id, msg, kind) { var s = $(id); s.textContent = msg; s.className = 'status' + (kind ? ' ' + kind : ''); }

  // ---------- init ----------
  function init() {
    $('f-date').value = todayStr();
    try { var p = localStorage.getItem('pasta-admin-pass'); if (p) $('f-pass').value = p; } catch (e) {}
    $('add-dish').addEventListener('click', function () { addRow(''); draw(); });
    $('save').addEventListener('click', saveLocation);
    $('add-catalog').addEventListener('click', addCatalog);
    $('gen-text').addEventListener('click', genText);
    $('copy-text').addEventListener('click', copyText);
    $('download').addEventListener('click', download);
    $('f-date').addEventListener('change', loadAll);
    ['f-price', 'f-note'].forEach(function (id) { $(id).addEventListener('input', draw); });
    loadAll();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(draw);
    setTimeout(draw, 700);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
