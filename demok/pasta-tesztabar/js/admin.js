/* PASTA. -- napi menü admin.
   Szerkeszti a napi menüt, menti a Supabase-be (jelszóval védett RPC), és egy
   gombbal Facebook-kész PNG-t generál róla (canvas, 1080x1350). A jelszó NINCS
   ebben a fájlban, a felhasználó gépeli be és a szerver ellenőrzi. */
(function () {
  'use strict';

  var SUPABASE_URL = 'https://lyagqwuqzurkkvcnjqtg.supabase.co';
  var ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5YWdxd3VxenVya2t2Y25qcXRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5MDE2NzIsImV4cCI6MjA5NTQ3NzY3Mn0.tuoGksKYjjiaohdTaNt_vvnY1mB9IUpoQC3cAqA9-tU';
  var REST = SUPABASE_URL + '/rest/v1/';

  // Márka-színek a generált képhez (a weboldal :root változóival összhangban)
  var C = { brand: '#D8432A', green: '#4C7A3D', gold: '#F2A93B', cream: '#FBF3E6', ink: '#221D1A', muted: '#6b645b' };

  var HU_MONTHS = ['január', 'február', 'március', 'április', 'május', 'június',
    'július', 'augusztus', 'szeptember', 'október', 'november', 'december'];
  var HU_DAYS = ['vasárnap', 'hétfő', 'kedd', 'szerda', 'csütörtök', 'péntek', 'szombat'];

  var $ = function (id) { return document.getElementById(id); };

  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function todayStr() { var d = new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function huDate(dstr) {
    var p = String(dstr).split('-'); if (p.length !== 3) return dstr;
    var d = new Date(+p[0], +p[1] - 1, +p[2]);
    return p[0] + '. ' + HU_MONTHS[+p[1] - 1] + ' ' + (+p[2]) + '., ' + HU_DAYS[d.getDay()];
  }
  function normPrice(v) {
    v = String(v == null ? '' : v).trim();
    if (/^\d+$/.test(v)) return v + ' Ft';
    return v;
  }

  // ---------- Sorok (tételek) ----------
  function addRow(name, price) {
    var wrap = document.createElement('div');
    wrap.className = 'row';
    wrap.innerHTML =
      '<input type="text" class="i-name" placeholder="Étel neve" value="' + attr(name) + '">' +
      '<input type="text" class="i-price" placeholder="Ár" value="' + attr(price) + '">' +
      '<button class="del" type="button" title="Sor törlése">&times;</button>';
    wrap.querySelector('.del').addEventListener('click', function () { wrap.remove(); draw(); });
    wrap.querySelectorAll('input').forEach(function (i) { i.addEventListener('input', draw); });
    $('rows').appendChild(wrap);
  }
  function attr(s) { return String(s == null ? '' : s).replace(/"/g, '&quot;'); }

  function collect() {
    var items = [];
    $('rows').querySelectorAll('.row').forEach(function (r) {
      var name = r.querySelector('.i-name').value.trim();
      var price = normPrice(r.querySelector('.i-price').value);
      if (name || price) items.push({ name: name, price: price });
    });
    return {
      menu_date: $('f-date').value || todayStr(),
      title: $('f-title').value.trim() || 'Napi menü',
      items: items,
      note: $('f-note').value.trim()
    };
  }

  // ---------- Supabase ----------
  function loadExisting() {
    var d = $('f-date').value || todayStr();
    fetch(REST + 'pasta_napi_menu?select=*&menu_date=eq.' + encodeURIComponent(d), {
      headers: { 'apikey': ANON, 'Authorization': 'Bearer ' + ANON }
    })
      .then(function (r) { return r.ok ? r.json() : []; })
      .then(function (rows) {
        var row = rows && rows[0];
        $('rows').innerHTML = '';
        if (row) {
          $('f-title').value = row.title || 'Napi menü';
          $('f-note').value = row.note || '';
          (row.items || []).forEach(function (it) { addRow(it.name, it.price); });
        }
        if (!$('rows').children.length) { addRow('', ''); addRow('', ''); }
        draw();
      })
      .catch(function () { if (!$('rows').children.length) { addRow('', ''); addRow('', ''); } draw(); });
  }

  function save() {
    var pass = $('f-pass').value;
    if (!pass) { setStatus('Add meg a jelszót a mentéshez.', 'err'); return; }
    var data = collect();
    if (!data.items.length) { setStatus('Legalább egy tételt írj be.', 'err'); return; }
    setStatus('Mentés...', '');
    $('save').disabled = true;
    fetch(REST + 'rpc/pasta_menu_upsert', {
      method: 'POST',
      headers: { 'apikey': ANON, 'Authorization': 'Bearer ' + ANON, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        p_passcode: pass, p_date: data.menu_date, p_title: data.title,
        p_items: data.items, p_note: data.note
      })
    })
      .then(function (r) {
        $('save').disabled = false;
        if (r.ok) {
          try { localStorage.setItem('pasta-admin-pass', pass); } catch (e) {}
          setStatus('Mentve. A mai menü már a weboldalon van.', 'ok');
        } else if (r.status === 400 || r.status === 401 || r.status === 403) {
          setStatus('Hibás jelszó. Nem sikerült menteni.', 'err');
        } else {
          setStatus('Hiba a mentésnél (' + r.status + ').', 'err');
        }
      })
      .catch(function () { $('save').disabled = false; setStatus('Nincs kapcsolat, a mentés nem sikerült.', 'err'); });
  }

  function setStatus(msg, kind) {
    var s = $('status'); s.textContent = msg; s.className = 'status' + (kind ? ' ' + kind : '');
  }

  // ---------- Facebook-kép (canvas) ----------
  function roundedText() {} // placeholder (nem használt)

  function draw() {
    var cv = $('preview'); if (!cv) return;
    var ctx = cv.getContext('2d');
    var W = cv.width, H = cv.height;
    var data = collect();

    // háttér
    ctx.fillStyle = C.cream; ctx.fillRect(0, 0, W, H);

    // felső sáv + wordmark
    var bandH = 300;
    ctx.fillStyle = C.brand; ctx.fillRect(0, 0, W, bandH);
    ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#fff';
    ctx.font = '800 104px Unbounded, system-ui, sans-serif';
    ctx.fillText('PASTA.', W / 2, 190);
    ctx.fillStyle = 'rgba(255,255,255,.9)';
    ctx.font = '500 30px Sora, Arial, sans-serif';
    ctx.fillText('friss tészta, minden nap', W / 2, 245);

    // cím (napi menü) + dátum
    ctx.fillStyle = C.green;
    setLS(ctx, 6);
    ctx.font = '700 54px Unbounded, system-ui, sans-serif';
    ctx.fillText((data.title || 'Napi menü').toUpperCase(), W / 2, bandH + 92);
    setLS(ctx, 0);
    ctx.fillStyle = C.ink;
    ctx.font = '500 34px Sora, Arial, sans-serif';
    ctx.fillText(huDate(data.menu_date), W / 2, bandH + 148);

    // elválasztó
    ctx.strokeStyle = C.brand; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(W / 2 - 70, bandH + 186); ctx.lineTo(W / 2 + 70, bandH + 186); ctx.stroke();

    // tételek
    var footerH = 120;
    var noteReserve = data.note ? 90 : 0;
    var top = bandH + 240;
    var bottom = H - footerH - noteReserve - 30;
    var items = data.items.filter(function (it) { return it.name || it.price; });
    if (!items.length) items = [{ name: 'Írd be a mai menüt...', price: '' }];

    var padX = 110;
    var maxRowH = 92, minRowH = 54;
    var rowH = Math.max(minRowH, Math.min(maxRowH, (bottom - top) / items.length));
    var fontSize = Math.max(30, Math.min(48, Math.round(rowH * 0.5)));
    var y = top + rowH / 2;

    items.forEach(function (it) {
      ctx.textBaseline = 'middle';
      ctx.fillStyle = C.ink;
      ctx.textAlign = 'left';
      ctx.font = '600 ' + fontSize + 'px Sora, Arial, sans-serif';
      var name = it.name || '';
      ctx.fillText(name, padX, y);
      var nameW = ctx.measureText(name).width;

      var priceW = 0, priceX = W - padX;
      if (it.price) {
        ctx.textAlign = 'right';
        ctx.fillStyle = C.brand;
        ctx.font = '700 ' + fontSize + 'px Sora, Arial, sans-serif';
        ctx.fillText(it.price, priceX, y);
        priceW = ctx.measureText(it.price).width;
        // pontsor a név és ár között
        drawDots(ctx, padX + nameW + 16, priceX - priceW - 16, y, fontSize);
      }
      y += rowH;
    });

    // megjegyzés
    if (data.note) {
      ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = C.muted;
      ctx.font = 'italic 500 28px Sora, Arial, sans-serif';
      wrapCenter(ctx, data.note, W / 2, H - footerH - 46, W - 180, 34);
    }

    // alsó sáv
    ctx.fillStyle = C.ink; ctx.fillRect(0, H - footerH, W, footerH);
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'left';
    ctx.font = '600 28px Sora, Arial, sans-serif';
    ctx.fillText('Kálvin tér + 3 telephely', padX, H - footerH / 2);
    ctx.textAlign = 'right';
    ctx.font = '800 28px Unbounded, system-ui, sans-serif';
    ctx.fillText('PASTA.', W - padX, H - footerH / 2);
  }

  function setLS(ctx, px) { try { ctx.letterSpacing = px + 'px'; } catch (e) {} }

  function drawDots(ctx, x1, x2, y, fontSize) {
    if (x2 - x1 < 20) return;
    ctx.save();
    ctx.fillStyle = 'rgba(35,32,28,.28)';
    var gap = 14, r = 2.4;
    for (var x = x1; x < x2; x += gap) { ctx.beginPath(); ctx.arc(x, y, r, 0, 6.283); ctx.fill(); }
    ctx.restore();
  }

  function wrapCenter(ctx, text, cx, y, maxW, lh) {
    var words = text.split(/\s+/), line = '', lines = [];
    words.forEach(function (w) {
      var t = line ? line + ' ' + w : w;
      if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = w; }
      else line = t;
    });
    if (line) lines.push(line);
    lines = lines.slice(-2); // max 2 sor
    var startY = y - (lines.length - 1) * lh;
    lines.forEach(function (l, i) { ctx.fillText(l, cx, startY + i * lh); });
  }

  function download() {
    var cv = $('preview');
    var data = collect();
    cv.toBlob(function (blob) {
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url; a.download = 'pasta-napi-menu-' + (data.menu_date || todayStr()) + '.png';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    }, 'image/png');
  }

  // ---------- init ----------
  function init() {
    $('f-date').value = todayStr();
    try { var p = localStorage.getItem('pasta-admin-pass'); if (p) $('f-pass').value = p; } catch (e) {}

    $('add-row').addEventListener('click', function () { addRow('', ''); draw(); });
    $('save').addEventListener('click', save);
    $('download').addEventListener('click', download);
    $('f-date').addEventListener('change', loadExisting);
    ['f-title', 'f-note'].forEach(function (id) { $(id).addEventListener('input', draw); });

    loadExisting();

    // fontok betöltése után újrarajzol (különben az első kép fallback fonttal jönne)
    if (document.fonts && document.fonts.ready) { document.fonts.ready.then(draw); }
    setTimeout(draw, 600);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
