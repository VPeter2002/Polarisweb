/* Tarsasagi naptar -- frontend. Every read and write goes through /api/naptar/*,
   so the browser never holds a database key. */
(function () {
  'use strict';

  var API = '/api/naptar';
  var TOKEN_KEY = 'naptar-token';
  var HONAPOK = ['január', 'február', 'március', 'április', 'május', 'június', 'július', 'augusztus', 'szeptember', 'október', 'november', 'december'];
  var NAPOK = ['vasárnap', 'hétfő', 'kedd', 'szerda', 'csütörtök', 'péntek', 'szombat'];
  var CIMKE_NEV = { only_boys: 'Only boys', boys_and_girls: 'Boys and girls' };
  var SZINEK = ['#e0a458', '#7c83ff', '#6cc5a1', '#e8736a', '#c5a3db', '#5aa9e6', '#d9b04d', '#8fbf6a'];

  var state = {
    token: null, me: null, tagok: [], esemenyek: [],
    kurzor: new Date(), nezet: 'month', szurok: {}, email: '',
  };

  /* ---------- apro segedek ---------- */

  function $(sel, root) { return (root || document).querySelector(sel); }
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function pad(n) { return n < 10 ? '0' + n : String(n); }
  function napKulcs(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function maKulcs() { return napKulcs(new Date()); }
  function ora(d) { return pad(d.getHours()) + ':' + pad(d.getMinutes()); }
  function tagSzin(id) {
    var i = state.tagok.findIndex(function (t) { return t.id === id; });
    return SZINEK[(i < 0 ? 0 : i) % SZINEK.length];
  }
  function tagNev(id) {
    var t = state.tagok.filter(function (x) { return x.id === id; })[0];
    return t ? t.nev : 'valaki';
  }
  function initials(nev) {
    return String(nev || '?').trim().split(/\s+/).slice(0, 2).map(function (w) { return w[0]; }).join('').toUpperCase();
  }

  function toast(msg) {
    var root = $('#toastRoot');
    root.innerHTML = '';
    var t = el('div', 'toast', msg);
    root.appendChild(t);
    setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 3200);
  }

  async function api(path, opts) {
    var o = opts || {};
    var res = await fetch(API + path, {
      method: o.method || 'GET',
      headers: o.body ? { 'Content-Type': 'application/json' } : undefined,
      body: o.body ? JSON.stringify(o.body) : undefined,
    });
    var data = null;
    try { data = await res.json(); } catch (e) { /* empty body */ }
    if (!res.ok) {
      var err = new Error((data && data.error) || ('Hiba (' + res.status + ')'));
      err.status = res.status;
      err.data = data;
      throw err;
    }
    return data;
  }

  /* ---------- belepes ---------- */

  function authHiba(msg) {
    var box = $('#authError');
    if (!msg) { box.hidden = true; return; }
    box.textContent = msg;
    box.hidden = false;
    box.style.animation = 'none';
    void box.offsetWidth;
    box.style.animation = '';
  }

  function mutatAuth() {
    $('#authView').hidden = false;
    $('#appView').hidden = true;
    $('#newBtn') && ($('#newBtn').hidden = true);
  }

  async function kodotKer() {
    var btn = $('#sendCode');
    var email = $('#email').value.trim();
    if (!email) { authHiba('Add meg az e-mail címed.'); return; }
    authHiba('');
    btn.disabled = true;
    btn.textContent = 'Küldöm…';
    try {
      await api('/kod', { method: 'POST', body: {
        email: email,
        nev: $('#nev').value.trim(),
        meghivo_kod: $('#meghivo').value.trim(),
      } });
      state.email = email;
      $('#stepEmail').hidden = true;
      $('#stepCode').hidden = false;
      $('#authSub').textContent = 'Elküldtük a kódot ide: ' + email;
      $('#codeRow').firstElementChild.focus();
    } catch (err) {
      if (err.data && err.data.kod_kell) { $('#inviteField').hidden = false; $('#newFields').hidden = false; }
      if (err.data && err.data.nev_kell) { $('#newFields').hidden = false; }
      authHiba(err.message);
    } finally {
      btn.disabled = false;
      btn.textContent = 'Kódot kérek';
    }
  }

  async function belep() {
    var kod = Array.prototype.map.call($('#codeRow').children, function (i) { return i.value; }).join('');
    if (kod.length !== 6) { authHiba('Írd be mind a hat jegyet.'); return; }
    var btn = $('#verifyCode');
    btn.disabled = true;
    btn.textContent = 'Ellenőrzöm…';
    authHiba('');
    try {
      var r = await api('/belepes', { method: 'POST', body: { email: state.email, kod: kod } });
      state.token = r.token;
      try { localStorage.setItem(TOKEN_KEY, r.token); } catch (e) { /* private mode */ }
      await betolt();
    } catch (err) {
      authHiba(err.message);
      Array.prototype.forEach.call($('#codeRow').children, function (i) { i.value = ''; i.classList.remove('filled'); });
      $('#codeRow').firstElementChild.focus();
    } finally {
      btn.disabled = false;
      btn.textContent = 'Belépés';
    }
  }

  function kodMezok() {
    var inputs = Array.prototype.slice.call($('#codeRow').children);
    inputs.forEach(function (input, i) {
      input.addEventListener('input', function () {
        input.value = input.value.replace(/\D/g, '').slice(0, 1);
        input.classList.toggle('filled', !!input.value);
        if (input.value && i < inputs.length - 1) inputs[i + 1].focus();
        if (inputs.every(function (x) { return x.value; })) belep();
      });
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Backspace' && !input.value && i > 0) inputs[i - 1].focus();
      });
      input.addEventListener('paste', function (e) {
        e.preventDefault();
        var txt = (e.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, 6);
        txt.split('').forEach(function (ch, k) { if (inputs[k]) { inputs[k].value = ch; inputs[k].classList.add('filled'); } });
        if (txt.length === 6) belep();
      });
    });
  }

  /* ---------- adatok ---------- */

  async function betolt() {
    try {
      var d = await api('/adatok?token=' + encodeURIComponent(state.token));
      state.me = d.tag;
      state.tagok = d.tagok;
      state.esemenyek = d.esemenyek;
      document.title = d.tarsasag_nev;
      $('#appTitle').textContent = d.tarsasag_nev;
      $('#authView').hidden = true;
      $('#appView').hidden = false;
      var av = $('#meBtn');
      av.textContent = initials(state.me.nev);
      av.style.background = tagSzin(state.me.id);
      rajzol();
    } catch (err) {
      if (err.status === 401) {
        try { localStorage.removeItem(TOKEN_KEY); } catch (e) {}
        state.token = null;
        mutatAuth();
        return;
      }
      toast(err.message);
    }
  }

  /* ---------- szures ---------- */

  function szurt() {
    var f = state.szurok;
    var aktivCimkek = ['only_boys', 'boys_and_girls'].filter(function (c) { return f[c]; });
    return state.esemenyek.filter(function (e) {
      if (f.mine) {
        var benne = e.letrehozo_id === state.me.id
          || (e.resztvevok || []).some(function (r) { return r.tag_id === state.me.id; })
          || e.lathatosag === 'kozos';
        if (e.lathatosag === 'kozos' && e.letrehozo_id !== state.me.id) {
          benne = (e.resztvevok || []).some(function (r) { return r.tag_id === state.me.id && r.statusz === 'jon'; });
        }
        if (!benne) return false;
      }
      if (f.privat && e.lathatosag !== 'privat') return false;
      if (aktivCimkek.length && aktivCimkek.indexOf(e.cimke) < 0) return false;
      return true;
    });
  }

  function napokSzerint(lista) {
    var map = {};
    lista.forEach(function (e) {
      var k = napKulcs(new Date(e.kezdet));
      (map[k] = map[k] || []).push(e);
    });
    return map;
  }

  /* ---------- honap nezet ---------- */

  function rajzolHonap() {
    var grid = $('#grid');
    grid.innerHTML = '';
    var ev = state.kurzor.getFullYear();
    var ho = state.kurzor.getMonth();
    $('#monthTitle').innerHTML = HONAPOK[ho] + ' <span>' + ev + '</span>';

    var elso = new Date(ev, ho, 1);
    var eltolas = (elso.getDay() + 6) % 7; // hetfovel kezdunk
    var kezd = new Date(ev, ho, 1 - eltolas);
    var map = napokSzerint(szurt());
    var ma = maKulcs();

    for (var i = 0; i < 42; i++) {
      var d = new Date(kezd.getFullYear(), kezd.getMonth(), kezd.getDate() + i);
      var k = napKulcs(d);
      var cell = el('div', 'cell');
      cell.style.animationDelay = (i * 7) + 'ms';
      if (d.getMonth() !== ho) cell.classList.add('other');
      if (k === ma) cell.classList.add('today');
      cell.appendChild(el('div', 'daynum', String(d.getDate())));

      var napi = (map[k] || []).sort(function (a, b) { return new Date(a.kezdet) - new Date(b.kezdet); });
      napi.slice(0, 3).forEach(function (e) {
        var box = el('div', 'ev' + (e.lathatosag === 'privat' ? ' privat' : '') + (e.letrehozo_id === state.me.id ? ' mine' : ''));
        if (!e.egesz_napos) {
          var t = el('span', 't', ora(new Date(e.kezdet)));
          box.appendChild(t);
        }
        box.appendChild(document.createTextNode(e.cim));
        box.addEventListener('click', function (evt) { evt.stopPropagation(); reszletek(e); });
        cell.appendChild(box);
      });
      if (napi.length > 3) cell.appendChild(el('div', 'more', '+' + (napi.length - 3) + ' még'));

      (function (nap) {
        cell.addEventListener('click', function () { szerkeszto(null, nap); });
      })(d);
      grid.appendChild(cell);
    }
  }

  /* ---------- lista nezet ---------- */

  function rajzolLista() {
    var box = $('#listView');
    box.innerHTML = '';
    var most = new Date(); most.setHours(0, 0, 0, 0);
    var lista = szurt()
      .filter(function (e) { return new Date(e.kezdet) >= most; })
      .sort(function (a, b) { return new Date(a.kezdet) - new Date(b.kezdet); });

    if (!lista.length) {
      var ures = el('div', 'empty');
      ures.appendChild(el('div', 'big', 'Nincs előttünk semmi.'));
      ures.appendChild(el('div', null, 'Ez vagy nyugalom, vagy szervezési hiba. Tegyél fel egy programot.'));
      box.appendChild(ures);
      return;
    }

    var map = napokSzerint(lista);
    Object.keys(map).sort().forEach(function (k, idx) {
      var d = new Date(k + 'T12:00:00');
      var sor = el('div', 'list-day');
      sor.style.animationDelay = Math.min(idx * 45, 400) + 'ms';

      var bal = el('div', 'list-date' + (k === maKulcs() ? ' today' : ''));
      bal.appendChild(el('div', 'd', String(d.getDate())));
      bal.appendChild(el('div', 'm', HONAPOK[d.getMonth()].slice(0, 3) + ' · ' + NAPOK[d.getDay()].slice(0, 3)));
      sor.appendChild(bal);

      var jobb = el('div');
      map[k].forEach(function (e) { jobb.appendChild(esemenySor(e)); });
      sor.appendChild(jobb);
      box.appendChild(sor);
    });
  }

  function barok(erosseg, nagy) {
    var b = el('div', 'bars');
    for (var i = 1; i <= 5; i++) {
      var s = el('i');
      if (i <= erosseg) s.classList.add('on');
      b.appendChild(s);
    }
    if (nagy) b.classList.add('nagy');
    return b;
  }

  function esemenySor(e) {
    var row = el('div', 'row');
    var kezd = new Date(e.kezdet);
    row.appendChild(el('div', 'row-time', e.egesz_napos ? 'egész nap' : ora(kezd)));

    var main = el('div', 'row-main');
    main.appendChild(el('div', 'row-title', e.cim));
    var meta = el('div', 'row-meta');
    if (e.helyszin) meta.appendChild(el('span', null, e.helyszin));
    if (e.lathatosag === 'privat') {
      var p = el('span', 'dot-privat', '● privát');
      meta.appendChild(p);
    }
    meta.appendChild(el('span', null, tagNev(e.letrehozo_id) + ' hozta'));
    main.appendChild(meta);
    row.appendChild(main);

    if (e.cimke) row.appendChild(el('span', 'tag ' + e.cimke, CIMKE_NEV[e.cimke]));
    row.appendChild(barok(e.erosseg));
    row.addEventListener('click', function () { reszletek(e); });
    return row;
  }

  /* ---------- modal keret ---------- */

  // A modal pushol egy history-bejegyzest, hogy az Android vissza gomb (es a
  // bongeszo vissza nyila) bezarja, ne az elozo oldalra vigyen.
  var modalNyitva = false;

  function modal(tartalom) {
    var root = $('#modalRoot');
    root.innerHTML = '';
    var bd = el('div', 'backdrop');
    var m = el('div', 'modal');
    m.appendChild(tartalom);
    bd.appendChild(m);
    bd.addEventListener('click', function (e) { if (e.target === bd) zar(); });
    document.addEventListener('keydown', escZar);
    root.appendChild(bd);
    if (!modalNyitva) {
      modalNyitva = true;
      try { history.pushState({ naptarModal: true }, ''); } catch (e) { /* no history */ }
    }
    return m;
  }
  function escZar(e) { if (e.key === 'Escape') zar(); }
  function zar(visszaGombbol) {
    $('#modalRoot').innerHTML = '';
    document.removeEventListener('keydown', escZar);
    if (modalNyitva) {
      modalNyitva = false;
      // Ha gombbal zartunk, a sajat history-bejegyzest is le kell venni,
      // kulonben a kovetkezo vissza-nyomas nem csinal semmit.
      if (!visszaGombbol) { try { history.back(); } catch (e) {} }
    }
  }
  window.addEventListener('popstate', function () {
    if (modalNyitva) zar(true);
  });

  /* ---------- esemeny reszletek ---------- */

  function reszletek(e) {
    var box = el('div');
    var fej = el('div', 'modal-head');
    var cim = el('h2', null, e.cim);
    fej.appendChild(cim);
    if (e.cimke) fej.appendChild(el('span', 'tag ' + e.cimke, CIMKE_NEV[e.cimke]));
    box.appendChild(fej);

    var meta = el('div', 'detail-meta');
    var kezd = new Date(e.kezdet);
    var mikor = kezd.getDate() + '. ' + HONAPOK[kezd.getMonth()] + ', ' + NAPOK[kezd.getDay()];
    if (!e.egesz_napos) {
      mikor += ', ' + ora(kezd);
      if (e.veg) mikor += ' - ' + ora(new Date(e.veg));
    } else { mikor += ', egész nap'; }
    meta.appendChild(sorKV('Mikor', mikor));
    if (e.helyszin) meta.appendChild(sorKV('Hol', e.helyszin));
    meta.appendChild(sorKV('Ki hozta', tagNev(e.letrehozo_id)));
    meta.appendChild(sorKV('Kinek', e.lathatosag === 'kozos' ? 'Az egész társaságnak' : 'Privát, csak a résztvevőknek'));

    var ero = el('div', 'line');
    ero.appendChild(el('div', 'k', 'Erősség'));
    var erob = el('div');
    erob.appendChild(barok(e.erosseg));
    ero.appendChild(erob);
    meta.appendChild(ero);
    box.appendChild(meta);

    if (e.leiras) box.appendChild(el('div', 'detail-desc', e.leiras));

    // ki jon
    var reszt = e.resztvevok || [];
    if (reszt.length) {
      var who = el('div', 'who');
      reszt.forEach(function (r) {
        var s = el('span', r.statusz, tagNev(r.tag_id) + (r.statusz === 'jon' ? ' ✓' : r.statusz === 'talan' ? ' ?' : r.statusz === 'nem_jon' ? '' : ''));
        who.appendChild(s);
      });
      box.appendChild(who);
    }

    var sajat = (reszt.filter(function (r) { return r.tag_id === state.me.id; })[0] || {}).statusz;
    var rsvp = el('div', 'rsvp');
    rsvp.style.marginTop = '18px';
    [['jon', 'Jövök'], ['talan', 'Talán'], ['nem_jon', 'Nem megy']].forEach(function (p) {
      var b = el('button', sajat === p[0] ? 'on' : '', p[1]);
      b.addEventListener('click', async function () {
        try {
          await api('/reszvetel', { method: 'POST', body: { token: state.token, esemeny_id: e.id, statusz: p[0] } });
          zar();
          await betolt();
          toast(p[0] === 'jon' ? 'Ott vagy.' : p[0] === 'talan' ? 'Talán. Így is jó.' : 'Rendben, kimaradsz.');
        } catch (err) { toast(err.message); }
      });
      rsvp.appendChild(b);
    });
    box.appendChild(rsvp);

    var act = el('div', 'modal-actions');
    if (e.letrehozo_id === state.me.id) {
      var szerk = el('button', 'btn btn-ghost', 'Szerkesztés');
      szerk.addEventListener('click', function () { zar(); szerkeszto(e); });
      act.appendChild(szerk);
      var torol = el('button', 'btn btn-danger', 'Törlés');
      torol.addEventListener('click', async function () {
        if (!confirm('Biztosan törlöd? Ezt nem lehet visszacsinálni.')) return;
        try {
          await api('/esemeny', { method: 'POST', body: { token: state.token, action: 'delete', id: e.id } });
          zar(); await betolt(); toast('Törölve.');
        } catch (err) { toast(err.message); }
      });
      act.appendChild(torol);
    }
    var be = el('button', 'btn btn-ghost spacer', 'Bezár');
    be.addEventListener('click', zar);
    act.appendChild(be);
    box.appendChild(act);

    modal(box);
  }

  function sorKV(k, v) {
    var line = el('div', 'line');
    line.appendChild(el('div', 'k', k));
    line.appendChild(el('div', null, v));
    return line;
  }

  /* ---------- esemeny szerkeszto ---------- */

  function helyiIso(d) {
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + 'T' + pad(d.getHours()) + ':' + pad(d.getMinutes());
  }

  function szerkeszto(e, nap) {
    var uj = !e;
    var kezdD = e ? new Date(e.kezdet) : (function () {
      var d = nap ? new Date(nap) : new Date();
      d.setHours(19, 0, 0, 0);
      return d;
    })();
    var vegD = e && e.veg ? new Date(e.veg) : null;

    var form = el('div');
    form.appendChild(el('h2', null, uj ? 'Új program' : 'Program szerkesztése'));

    var f1 = el('div', 'field');
    f1.appendChild(el('label', null, 'Mi lesz?'));
    var cim = el('input', 'input');
    cim.placeholder = 'pl. Sörözés a Kertben';
    cim.value = e ? e.cim : '';
    f1.appendChild(cim);
    form.appendChild(f1);

    var sw = el('div', 'switch-row');
    var swBtn = el('button', 'switch' + (e && e.egesz_napos ? ' on' : ''));
    sw.appendChild(swBtn);
    sw.appendChild(el('span', null, 'Egész napos'));
    form.appendChild(sw);

    var two = el('div', 'two');
    var fk = el('div', 'field');
    fk.appendChild(el('label', null, 'Kezdés'));
    var kezd = el('input', 'input');
    kezd.type = 'datetime-local';
    kezd.value = helyiIso(kezdD);
    fk.appendChild(kezd);
    var fv = el('div', 'field');
    fv.appendChild(el('label', null, 'Vége (nem kötelező)'));
    var veg = el('input', 'input');
    veg.type = 'datetime-local';
    veg.value = vegD ? helyiIso(vegD) : '';
    fv.appendChild(veg);
    two.appendChild(fk); two.appendChild(fv);
    form.appendChild(two);

    var egeszNapos = !!(e && e.egesz_napos);
    function frissitTipus() {
      kezd.type = egeszNapos ? 'date' : 'datetime-local';
      veg.type = egeszNapos ? 'date' : 'datetime-local';
      if (egeszNapos) {
        kezd.value = kezd.value.slice(0, 10) || napKulcs(kezdD);
        veg.value = veg.value ? veg.value.slice(0, 10) : '';
      } else if (kezd.value.length === 10) {
        kezd.value = kezd.value + 'T19:00';
      }
      fv.style.opacity = egeszNapos ? '.5' : '1';
    }
    swBtn.addEventListener('click', function () {
      egeszNapos = !egeszNapos;
      swBtn.classList.toggle('on', egeszNapos);
      frissitTipus();
    });
    frissitTipus();

    var fh = el('div', 'field');
    fh.appendChild(el('label', null, 'Hol? (nem kötelező)'));
    var hely = el('input', 'input');
    hely.placeholder = 'pl. Nálam, vagy a szokásos hely';
    hely.value = e && e.helyszin ? e.helyszin : '';
    fh.appendChild(hely);
    form.appendChild(fh);

    var fl = el('div', 'field');
    fl.appendChild(el('label', null, 'Részletek (nem kötelező)'));
    var leiras = el('textarea', 'textarea');
    leiras.placeholder = 'Amit tudni érdemes: mit hozzatok, mikor indul a vonat, bármi.';
    leiras.value = e && e.leiras ? e.leiras : '';
    fl.appendChild(leiras);
    form.appendChild(fl);

    // lathatosag
    var fvis = el('div', 'field');
    fvis.appendChild(el('label', null, 'Kinek szól?'));
    var vis = el('div', 'pick');
    var privat = !!(e && e.lathatosag === 'privat');
    var bKozos = el('button', privat ? '' : 'on', 'Az egész társaságnak');
    var bPrivat = el('button', privat ? 'on' : '', 'Privát, kiválasztott emberekkel');
    vis.appendChild(bKozos); vis.appendChild(bPrivat);
    fvis.appendChild(vis);
    form.appendChild(fvis);

    // resztvevok
    var fp = el('div', 'field');
    fp.appendChild(el('label', null, 'Kivel?'));
    var people = el('div', 'people');
    var kivalasztott = {};
    (e && e.resztvevok ? e.resztvevok : []).forEach(function (r) { kivalasztott[r.tag_id] = true; });
    state.tagok.forEach(function (t) {
      if (t.id === state.me.id) return;
      var b = el('button', 'person' + (kivalasztott[t.id] ? ' on' : ''));
      var ini = el('span', 'ini', initials(t.nev));
      ini.style.background = tagSzin(t.id);
      b.appendChild(ini);
      b.appendChild(document.createTextNode(t.nev));
      b.addEventListener('click', function () {
        kivalasztott[t.id] = !kivalasztott[t.id];
        b.classList.toggle('on', kivalasztott[t.id]);
      });
      people.appendChild(b);
    });
    fp.appendChild(people);
    form.appendChild(fp);

    function frissitLathatosag() {
      bKozos.classList.toggle('on', !privat);
      bPrivat.classList.toggle('on', privat);
      fp.style.display = privat ? '' : 'none';
    }
    bKozos.addEventListener('click', function () { privat = false; frissitLathatosag(); });
    bPrivat.addEventListener('click', function () { privat = true; frissitLathatosag(); });
    frissitLathatosag();

    // cimke
    var fc = el('div', 'field');
    fc.appendChild(el('label', null, 'Címke'));
    var cpick = el('div', 'pick');
    var cimke = e && e.cimke ? e.cimke : null;
    var gombok = {};
    [['only_boys', 'Only boys'], ['boys_and_girls', 'Boys and girls'], [null, 'Nincs címke']].forEach(function (p) {
      var b = el('button', cimke === p[0] ? 'on' : '', p[1]);
      gombok[String(p[0])] = b;
      b.addEventListener('click', function () {
        cimke = p[0];
        Object.keys(gombok).forEach(function (k) { gombok[k].classList.toggle('on', k === String(cimke)); });
      });
      cpick.appendChild(b);
    });
    fc.appendChild(cpick);
    form.appendChild(fc);

    // erosseg
    var fe = el('div', 'field');
    fe.appendChild(el('label', null, 'Mennyire lesz erős?'));
    var wrap = el('div', 'strength-pick');
    var erosseg = e ? e.erosseg : 3;
    var cimkeSzoveg = ['', 'Csendes', 'Lazulás', 'Normál', 'Erős', 'Legendás'];
    var lbl = el('span', 'strength-label', cimkeSzoveg[erosseg]);
    // Ot kulon gomb, mindegyik ujjbarat meretu: a korabbi 7 pixeles savokat
    // telefonon nem lehetett eltalalni.
    var sor = el('div', 'strength-row');
    var gombok = [];
    for (var sz = 1; sz <= 5; sz++) {
      (function (ertek) {
        var g = el('button', 'strength-btn' + (ertek <= erosseg ? ' on' : ''));
        g.setAttribute('aria-label', ertek + ' - ' + cimkeSzoveg[ertek]);
        var rud = el('span', 'rud');
        rud.style.height = (20 + ertek * 14) + '%';
        g.appendChild(rud);
        g.addEventListener('click', function () {
          erosseg = ertek;
          gombok.forEach(function (x, k) { x.classList.toggle('on', k < erosseg); });
          lbl.textContent = cimkeSzoveg[erosseg];
        });
        gombok.push(g);
        sor.appendChild(g);
      })(sz);
    }
    wrap.appendChild(sor); wrap.appendChild(lbl);
    fe.appendChild(wrap);
    form.appendChild(fe);

    var act = el('div', 'modal-actions');
    var ment = el('button', 'btn', uj ? 'Mehet' : 'Mentés');
    var megse = el('button', 'btn btn-ghost', 'Mégse');
    megse.addEventListener('click', zar);
    act.appendChild(ment); act.appendChild(megse);
    form.appendChild(act);

    ment.addEventListener('click', async function () {
      if (!cim.value.trim()) { toast('Adj címet a programnak.'); cim.focus(); return; }
      if (!kezd.value) { toast('Mikor lesz?'); kezd.focus(); return; }
      var kezdIso = new Date(egeszNapos ? kezd.value + 'T00:00' : kezd.value).toISOString();
      var vegIso = veg.value ? new Date(egeszNapos ? veg.value + 'T23:59' : veg.value).toISOString() : null;
      var resztvevok = Object.keys(kivalasztott).filter(function (k) { return kivalasztott[k]; });
      if (privat && !resztvevok.length) { toast('Privát programhoz válaszd ki, kivel van.'); return; }

      ment.disabled = true;
      ment.textContent = 'Mentem…';
      try {
        await api('/esemeny', { method: 'POST', body: {
          token: state.token,
          action: uj ? 'create' : 'update',
          id: e ? e.id : undefined,
          cim: cim.value, leiras: leiras.value, helyszin: hely.value,
          kezdet: kezdIso, veg: vegIso, egesz_napos: egeszNapos,
          lathatosag: privat ? 'privat' : 'kozos',
          cimke: cimke, erosseg: erosseg,
          resztvevok: resztvevok,
        } });
        zar();
        await betolt();
        toast(uj ? 'Felkerült a naptárra.' : 'Mentve.');
      } catch (err) {
        toast(err.message);
        ment.disabled = false;
        ment.textContent = uj ? 'Mehet' : 'Mentés';
      }
    });

    modal(form);
    setTimeout(function () { cim.focus(); }, 80);
  }

  /* ---------- rajzolas ---------- */

  function rajzol() {
    if (state.nezet === 'month') {
      $('#monthView').hidden = false;
      $('#listView').hidden = true;
      rajzolHonap();
    } else {
      $('#monthView').hidden = true;
      $('#listView').hidden = false;
      var most = new Date();
      $('#monthTitle').innerHTML = 'Ami jön <span>' + most.getFullYear() + '</span>';
      rajzolLista();
    }
  }

  /* ---------- esemenykezelok ---------- */

  function kotes() {
    $('#sendCode').addEventListener('click', kodotKer);
    $('#email').addEventListener('keydown', function (e) { if (e.key === 'Enter') kodotKer(); });
    $('#verifyCode').addEventListener('click', belep);
    $('#backToEmail').addEventListener('click', function () {
      $('#stepCode').hidden = true;
      $('#stepEmail').hidden = false;
      $('#authSub').textContent = 'Add meg az e-mail címed, és küldünk egy belépési kódot. Jelszó nincs, és elég egyszer belépned.';
      authHiba('');
    });
    kodMezok();

    $('#prevBtn').addEventListener('click', function () {
      state.kurzor = new Date(state.kurzor.getFullYear(), state.kurzor.getMonth() - 1, 1);
      state.nezet = 'month'; frissitSeg(); rajzol();
    });
    $('#nextBtn').addEventListener('click', function () {
      state.kurzor = new Date(state.kurzor.getFullYear(), state.kurzor.getMonth() + 1, 1);
      state.nezet = 'month'; frissitSeg(); rajzol();
    });
    $('#todayBtn').addEventListener('click', function () {
      state.kurzor = new Date(); state.nezet = 'month'; frissitSeg(); rajzol();
    });
    Array.prototype.forEach.call($('#viewSeg').children, function (b) {
      b.addEventListener('click', function () {
        state.nezet = b.getAttribute('data-view');
        frissitSeg();
        rajzol();
      });
    });
    Array.prototype.forEach.call($('#filters').children, function (b) {
      b.addEventListener('click', function () {
        var k = b.getAttribute('data-filter');
        state.szurok[k] = !state.szurok[k];
        b.classList.toggle('on', state.szurok[k]);
        rajzol();
      });
    });
    $('#newBtn').addEventListener('click', function () { szerkeszto(null, null); });
    $('#meBtn').addEventListener('click', function () {
      if (!confirm('Kilépsz?')) return;
      try { localStorage.removeItem(TOKEN_KEY); } catch (e) {}
      location.reload();
    });

    document.addEventListener('keydown', function (e) {
      if (e.target && /input|textarea/i.test(e.target.tagName)) return;
      if (e.key === 'n' && !$('#appView').hidden) { e.preventDefault(); szerkeszto(null, null); }
    });
  }

  function frissitSeg() {
    Array.prototype.forEach.call($('#viewSeg').children, function (x) {
      x.classList.toggle('on', x.getAttribute('data-view') === state.nezet);
    });
  }

  /* ---------- indulas ---------- */

  window.addEventListener('error', function (e) {
    console.error('[naptar]', e.message);
  });
  window.addEventListener('unhandledrejection', function (e) {
    console.error('[naptar] promise', e.reason && e.reason.message);
  });

  kotes();
  try { state.token = localStorage.getItem(TOKEN_KEY); } catch (e) { state.token = null; }
  if (state.token) { betolt(); } else { mutatAuth(); }
})();
