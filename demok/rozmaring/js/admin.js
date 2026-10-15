/* Rozmaring Ajtódíszek & Dekor, termékkezelő felület.

   Nincs szerver mögötte: a böngészőben szerkeszt, és a végén leteszi a kész
   js/termekek.js fájlt. A félkész munka a böngésző tárolójában marad, hogy egy
   véletlen frissítés ne vigye el.

   A képek útvonalát itt is a kirenderelt markupból vezetjük le (#alapKep), mert a
   demo-deploy csak a HTML-attribútumot írja át, a JS-ben épített utat nem. */
(function () {
  'use strict';

  var TAROLO_KULCS = 'rozmaring-admin-piszkozat';
  var ELES = window.ROZMARING || { cimkek: {}, tetelek: [] };

  /* A kategória-leírások eddig az app.js-ben álltak. Innentől a katalógus része,
     hogy a néni is tudja szerkeszteni; az app.js ezt használja, ha megvan. */
  var ALAP_LEIRAS = {
    koszoru: 'Teljes körkoszorú az ajtóra vagy a falra',
    karika: 'Kötélkarikára kötött, könnyedebb félkoszorú',
    csokor: 'Papírba csomagolt szárazvirág csokor',
    asztali: 'Kaspóba vagy ládikába kötött asztaldísz',
    ajandek: 'Kis csomagok, díszdobozok, ajándékkísérők'
  };

  var ALAP_UT = (function () {
    var el = document.getElementById('alapKep');
    var ut = el ? el.getAttribute('src') : 'img/';
    return ut.replace(/[^/]*$/, '');
  })();

  var allapot = null;      /* { cimkek, leirasok, tetelek } */
  var aktivSzuro = 'mind';
  var mutatRejtetteket = true;

  /* ---------- segédek ---------- */

  function masolat(x) { return JSON.parse(JSON.stringify(x)); }

  function elesAllapot() {
    var a = { cimkek: masolat(ELES.cimkek || {}), leirasok: {}, tetelek: [] };
    Object.keys(a.cimkek).forEach(function (k) {
      a.leirasok[k] = (ELES.leirasok && ELES.leirasok[k]) || ALAP_LEIRAS[k] || '';
    });
    (ELES.tetelek || []).forEach(function (t) { a.tetelek.push(masolat(t)); });
    return a;
  }

  function kulcsosit(szoveg) {
    var ekezet = 'áéíóöőúüűÁÉÍÓÖŐÚÜŰ', sima = 'aeiooouuuaeiooouuu';
    var s = String(szoveg).toLowerCase().split('').map(function (c) {
      var i = ekezet.indexOf(c);
      return i === -1 ? c : sima[i];
    }).join('');
    return s.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  }

  function darabszam(k) {
    return allapot.tetelek.filter(function (t) { return t.k === k; }).length;
  }

  function kepUt(t) {
    if (t._elonezet) return t._elonezet;
    return ALAP_UT + t.f + '-kicsi.jpg';
  }

  /* ---------- piszkozat ---------- */

  function piszkozatMent() {
    try {
      var tiszta = {
        ido: new Date().toISOString(),
        adat: {
          cimkek: allapot.cimkek,
          leirasok: allapot.leirasok,
          tetelek: allapot.tetelek.map(tisztaTetel)
        }
      };
      localStorage.setItem(TAROLO_KULCS, JSON.stringify(tiszta));
    } catch (hiba) { /* tele van vagy tiltva: a felület ettől még működik */ }
  }

  function piszkozatOlvas() {
    try {
      var nyers = localStorage.getItem(TAROLO_KULCS);
      return nyers ? JSON.parse(nyers) : null;
    } catch (hiba) { return null; }
  }

  function piszkozatTorol() {
    try { localStorage.removeItem(TAROLO_KULCS); } catch (hiba) { /* nem baj */ }
  }

  /* A futás közbeni mezők (előnézet, fájl) nem mennek se a tárolóba, se a kész fájlba. */
  function tisztaTetel(t) {
    var ki = { f: t.f, k: t.k };
    if (t.n) ki.n = t.n;
    if (t.ar) ki.ar = t.ar;
    if (t.rejtve) ki.rejtve = true;
    return ki;
  }

  /* ---------- kirajzolás ---------- */

  function mindentRajzol() {
    szamokRajzol();
    kategoriakRajzol();
    szurokRajzol();
    termekekRajzol();
    feltoltendokRajzol();
    elonezetRajzol();
  }

  function szamokRajzol() {
    var cel = document.getElementById('szamok');
    cel.innerHTML = '';
    var rejtett = allapot.tetelek.filter(function (t) { return t.rejtve; }).length;
    var arNelkul = allapot.tetelek.filter(function (t) { return !t.ar; }).length;
    var sorok = [
      [allapot.tetelek.length - rejtett, 'látszik az oldalon'],
      [rejtett, rejtett === 1 ? 'elrejtve' : 'elrejtve'],
      [Object.keys(allapot.cimkek).length, 'kategória'],
      [arNelkul, 'nincs ára megadva']
    ];
    sorok.forEach(function (s) {
      var d = document.createElement('div');
      d.className = 'admin-szam';
      var b = document.createElement('b'); b.textContent = s[0];
      var sp = document.createElement('span'); sp.textContent = s[1];
      d.appendChild(b); d.appendChild(sp);
      cel.appendChild(d);
    });
  }

  function kategoriakRajzol() {
    var cel = document.getElementById('kategoriaLista');
    cel.innerHTML = '';
    Object.keys(allapot.cimkek).forEach(function (k) {
      var sor = document.createElement('div');
      sor.className = 'admin-kat';

      var nev = document.createElement('input');
      nev.type = 'text';
      nev.value = allapot.cimkek[k];
      nev.setAttribute('aria-label', 'Kategória neve');
      nev.addEventListener('input', function () {
        allapot.cimkek[k] = nev.value;
        piszkozatMent(); szurokRajzol(); termekekRajzol(); elonezetRajzol();
      });

      var leiras = document.createElement('input');
      leiras.type = 'text';
      leiras.value = allapot.leirasok[k] || '';
      leiras.placeholder = 'Rövid leírás a kezdőlapra';
      leiras.setAttribute('aria-label', 'Kategória leírása');
      leiras.addEventListener('input', function () {
        allapot.leirasok[k] = leiras.value;
        piszkozatMent(); elonezetRajzol();
      });

      var db = document.createElement('span');
      db.className = 'admin-kat-db';
      db.textContent = darabszam(k) + ' termék';

      var torol = document.createElement('button');
      torol.type = 'button';
      torol.className = 'agomb agomb-apro agomb-veszely';
      torol.textContent = 'Törlés';
      if (darabszam(k) > 0) {
        torol.disabled = true;
        torol.title = 'Előbb a benne lévő termékeket kell máshova tenni vagy törölni.';
        torol.style.opacity = '.4';
      }
      torol.addEventListener('click', function () {
        if (darabszam(k) > 0) return;
        if (!confirm('Biztosan törlöd ezt a kategóriát: ' + allapot.cimkek[k] + '?')) return;
        delete allapot.cimkek[k];
        delete allapot.leirasok[k];
        if (aktivSzuro === k) aktivSzuro = 'mind';
        piszkozatMent(); mindentRajzol();
      });

      sor.appendChild(nev); sor.appendChild(leiras);
      sor.appendChild(db); sor.appendChild(torol);
      cel.appendChild(sor);
    });
  }

  function szurokRajzol() {
    var cel = document.getElementById('adminSzurok');
    cel.innerHTML = '';
    var gombok = [['mind', 'Mind (' + allapot.tetelek.length + ')']];
    Object.keys(allapot.cimkek).forEach(function (k) {
      gombok.push([k, allapot.cimkek[k] + ' (' + darabszam(k) + ')']);
    });
    gombok.forEach(function (g) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'admin-szuro' + (g[0] === aktivSzuro ? ' aktiv' : '');
      b.textContent = g[1];
      b.addEventListener('click', function () {
        aktivSzuro = g[0];
        szurokRajzol(); termekekRajzol();
      });
      cel.appendChild(b);
    });
  }

  function lathatoIndexek() {
    var ki = [];
    allapot.tetelek.forEach(function (t, i) {
      if (aktivSzuro !== 'mind' && t.k !== aktivSzuro) return;
      if (!mutatRejtetteket && t.rejtve) return;
      ki.push(i);
    });
    return ki;
  }

  function termekekRajzol() {
    var cel = document.getElementById('termekLista');
    cel.innerHTML = '';
    var lathato = lathatoIndexek();

    if (!lathato.length) {
      var ures = document.createElement('p');
      ures.className = 'admin-sugo';
      ures.textContent = 'Ebben a nézetben most nincs termék.';
      cel.appendChild(ures);
      return;
    }

    lathato.forEach(function (i, helyAListaban) {
      cel.appendChild(termekSor(i, helyAListaban, lathato));
    });
  }

  function termekSor(i, helyAListaban, lathato) {
    var t = allapot.tetelek[i];
    var sor = document.createElement('div');
    sor.className = 'admin-termek' + (t.rejtve ? ' rejtett' : '');

    /* kép */
    if (t._elonezet || t.f) {
      var kep = document.createElement('img');
      kep.src = kepUt(t);
      kep.alt = '';
      kep.loading = 'lazy';
      /* Ha nincs kicsinyitett valtozat, a teljes meretu kep a tartalek. */
      kep.addEventListener('error', function kezelo() {
        kep.removeEventListener('error', kezelo);
        kep.src = t._elonezet || (ALAP_UT + t.f + '.jpg');
      });
      sor.appendChild(kep);
    } else {
      var nincs = document.createElement('div');
      nincs.className = 'admin-termek-nincskep';
      nincs.textContent = 'nincs kép';
      sor.appendChild(nincs);
    }

    /* név és fájlnév */
    var nevDoboz = document.createElement('div');
    nevDoboz.className = 'admin-termek-nev';
    var nev = document.createElement('input');
    nev.type = 'text';
    nev.value = t.n || '';
    nev.placeholder = 'Név (nem kötelező)';
    nev.maxLength = 60;
    nev.setAttribute('aria-label', 'A termék neve');
    nev.style.width = '100%';
    nev.addEventListener('input', function () {
      t.n = nev.value.trim();
      if (!t.n) delete t.n;
      piszkozatMent(); elonezetRajzol();
    });
    var fajl = document.createElement('span');
    fajl.className = 'admin-termek-fajl';
    fajl.textContent = t.f + '.jpg' + (t._fajl ? '  (még feltöltésre vár)' : '');
    nevDoboz.appendChild(nev); nevDoboz.appendChild(fajl);
    sor.appendChild(nevDoboz);

    /* ár */
    var arDoboz = document.createElement('div');
    arDoboz.className = 'admin-termek-ar';
    var ar = document.createElement('input');
    ar.type = 'number';
    ar.min = '0';
    ar.step = '100';
    ar.value = t.ar || '';
    ar.placeholder = 'ár';
    ar.setAttribute('aria-label', 'A termék ára forintban');
    ar.addEventListener('input', function () {
      var szam = parseInt(ar.value, 10);
      if (szam > 0) t.ar = szam; else delete t.ar;
      piszkozatMent(); szamokRajzol(); elonezetRajzol();
    });
    var ft = document.createElement('span'); ft.textContent = 'Ft';
    arDoboz.appendChild(ar); arDoboz.appendChild(ft);
    sor.appendChild(arDoboz);

    /* kategória */
    var katDoboz = document.createElement('div');
    katDoboz.className = 'admin-termek-kat';
    var kat = document.createElement('select');
    kat.setAttribute('aria-label', 'A termék kategóriája');
    kat.style.width = '100%';
    Object.keys(allapot.cimkek).forEach(function (k) {
      var o = document.createElement('option');
      o.value = k; o.textContent = allapot.cimkek[k];
      if (k === t.k) o.selected = true;
      kat.appendChild(o);
    });
    kat.addEventListener('change', function () {
      t.k = kat.value;
      piszkozatMent(); mindentRajzol();
    });
    katDoboz.appendChild(kat);
    sor.appendChild(katDoboz);

    /* műveletek */
    var muv = document.createElement('div');
    muv.className = 'admin-termek-muveletek';

    muv.appendChild(ikonGomb('↑', 'Feljebb', helyAListaban === 0, function () {
      cserel(i, lathato[helyAListaban - 1]);
    }));
    muv.appendChild(ikonGomb('↓', 'Lejjebb', helyAListaban === lathato.length - 1, function () {
      cserel(i, lathato[helyAListaban + 1]);
    }));

    var rejt = ikonGomb(t.rejtve ? '🚫' : '👁', t.rejtve ? 'Elrejtve, kattints a megmutatáshoz' : 'Látszik, kattints az elrejtéshez', false, function () {
      if (t.rejtve) delete t.rejtve; else t.rejtve = true;
      piszkozatMent(); mindentRajzol();
    });
    if (t.rejtve) rejt.classList.add('aktiv');
    muv.appendChild(rejt);

    muv.appendChild(ikonGomb('🗑', 'Törlés a listából', false, function () {
      if (!confirm('Biztosan kiveszed ezt a terméket a listából?\n\nA kép fájlja marad, csak a weboldalon nem jelenik meg többé.')) return;
      allapot.tetelek.splice(i, 1);
      piszkozatMent(); mindentRajzol();
    }));

    sor.appendChild(muv);
    return sor;
  }

  function ikonGomb(jel, cim, tiltva, muvelet) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'admin-ikongomb';
    b.textContent = jel;
    b.title = cim;
    b.setAttribute('aria-label', cim);
    if (tiltva) b.disabled = true;
    else b.addEventListener('click', muvelet);
    return b;
  }

  function cserel(a, b) {
    var seged = allapot.tetelek[a];
    allapot.tetelek[a] = allapot.tetelek[b];
    allapot.tetelek[b] = seged;
    piszkozatMent(); termekekRajzol(); elonezetRajzol();
  }

  /* ---------- új termék ---------- */

  function ujKepekBeolvas(fajlok) {
    var sorban = Array.prototype.slice.call(fajlok);
    sorban.forEach(function (fajl) {
      var alapnev = kulcsosit(fajl.name.replace(/\.[^.]+$/, ''));
      if (!alapnev) alapnev = 'termek-' + Date.now();
      var utkozes = allapot.tetelek.some(function (t) { return t.f === alapnev; });
      if (utkozes) alapnev = alapnev + '-' + (allapot.tetelek.length + 1);

      var olvaso = new FileReader();
      olvaso.onload = function () {
        allapot.tetelek.push({
          f: alapnev,
          k: aktivSzuro !== 'mind' ? aktivSzuro : Object.keys(allapot.cimkek)[0],
          _elonezet: olvaso.result,
          _fajl: fajl
        });
        piszkozatMent();
        mindentRajzol();
      };
      olvaso.readAsDataURL(fajl);
    });
  }

  function feltoltendokRajzol() {
    var cel = document.getElementById('feltoltendok');
    var varok = allapot.tetelek.filter(function (t) { return t._fajl; });
    if (!varok.length) { cel.hidden = true; cel.innerHTML = ''; return; }

    cel.hidden = false;
    cel.innerHTML = '';
    var cim = document.createElement('strong');
    cim.textContent = 'Ezeket a képeket kell feltölteni az oldal img mappájába:';
    cel.appendChild(cim);

    var lista = document.createElement('ul');
    varok.forEach(function (t) {
      var li = document.createElement('li');
      li.textContent = 'img/' + t.f + '.jpg  ';
      var g = document.createElement('button');
      g.type = 'button';
      g.className = 'agomb agomb-apro';
      g.textContent = 'Kép letöltése ezen a néven';
      g.addEventListener('click', function () { kepLetolt(t); });
      li.appendChild(g);
      lista.appendChild(li);
    });
    cel.appendChild(lista);
  }

  /* A telefonról jövő kép sokszor 4000 pixel széles. A weboldalnak ennyi nem kell,
     ezért letöltés előtt 1400 pixelre húzzuk vissza és JPEG-be mentjük. */
  function kepLetolt(t) {
    var kep = new Image();
    kep.onload = function () {
      var maxSzel = 1400;
      var aranySzel = Math.min(kep.width, maxSzel);
      var aranyMag = Math.round(kep.height * (aranySzel / kep.width));
      var vaszon = document.createElement('canvas');
      vaszon.width = aranySzel; vaszon.height = aranyMag;
      vaszon.getContext('2d').drawImage(kep, 0, 0, aranySzel, aranyMag);
      vaszon.toBlob(function (blob) {
        letolt(blob, t.f + '.jpg');
      }, 'image/jpeg', 0.86);
    };
    kep.src = t._elonezet;
  }

  /* ---------- mentés ---------- */

  function fajlSzoveg() {
    var adat = {
      cimkek: allapot.cimkek,
      leirasok: allapot.leirasok,
      tetelek: allapot.tetelek.map(tisztaTetel)
    };
    var fej = '/* Rozmaring termékkatalógus.\n' +
      '   Ezt a fájlt a termékkezelő felület (admin.html) írta, ' +
      new Date().toLocaleDateString('hu-HU') + '\n' +
      '   Kézzel is szerkeszthető, de a felület egyszerűbb. */\n';
    return fej + 'window.ROZMARING = ' + JSON.stringify(adat, null, 1) + ';\n';
  }

  function elonezetRajzol() {
    document.getElementById('elonezet').textContent = fajlSzoveg();
  }

  function letolt(blob, nev) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = nev;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
  }

  function allapotUzenet(szoveg, jo) {
    var el = document.getElementById('mentesAllapot');
    el.textContent = szoveg;
    el.className = 'admin-allapot ' + (jo ? 'jo' : 'rossz');
  }

  function mentes() {
    letolt(new Blob([fajlSzoveg()], { type: 'text/javascript' }), 'termekek.js');
    var varok = allapot.tetelek.filter(function (t) { return t._fajl; }).length;
    allapotUzenet(
      'Letöltve: termekek.js. Ezt kell feltölteni az oldal js mappájába.' +
      (varok ? ' Plusz ' + varok + ' kép vár feltöltésre, lásd a termékeknél.' : ''),
      true
    );
  }

  function masol() {
    var szoveg = fajlSzoveg();
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(szoveg).then(function () {
        allapotUzenet('A fájl tartalma a vágólapon van.', true);
      }, function () { masolTartalek(szoveg); });
    } else {
      masolTartalek(szoveg);
    }
  }

  function masolTartalek(szoveg) {
    var ta = document.createElement('textarea');
    ta.value = szoveg;
    ta.style.position = 'fixed'; ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    var sikerult = false;
    try { sikerult = document.execCommand('copy'); } catch (hiba) { sikerult = false; }
    document.body.removeChild(ta);
    allapotUzenet(sikerult ? 'A fájl tartalma a vágólapon van.' : 'A másolás nem sikerült, használd a letöltést.', sikerult);
  }

  /* ---------- indulás ---------- */

  function indul() {
    allapot = elesAllapot();

    var piszkozat = piszkozatOlvas();
    if (piszkozat && piszkozat.adat) {
      allapot = {
        cimkek: piszkozat.adat.cimkek || allapot.cimkek,
        leirasok: piszkozat.adat.leirasok || allapot.leirasok,
        tetelek: piszkozat.adat.tetelek || allapot.tetelek
      };
      var sav = document.getElementById('piszkozatSav');
      var mikor = piszkozat.ido ? new Date(piszkozat.ido).toLocaleString('hu-HU') : 'korábban';
      document.getElementById('piszkozatSzoveg').textContent =
        'Egy el nem mentett munkamenetet töltöttem vissza (' + mikor + '). Ha ezt nem akarod, vissza lehet állni.';
      sav.hidden = false;
    }

    document.getElementById('piszkozatElvet').addEventListener('click', function () {
      if (!confirm('Eldobjuk a piszkozatot, és visszaállunk arra, ami most az oldalon van?')) return;
      piszkozatTorol();
      allapot = elesAllapot();
      document.getElementById('piszkozatSav').hidden = true;
      mindentRajzol();
      allapotUzenet('Visszaálltunk az élesben lévő állapotra.', true);
    });

    document.getElementById('ujKatGomb').addEventListener('click', function () {
      var mezo = document.getElementById('ujKatNev');
      var nev = mezo.value.trim();
      if (!nev) { mezo.focus(); return; }
      var kulcs = kulcsosit(nev);
      if (!kulcs) { mezo.focus(); return; }
      if (allapot.cimkek[kulcs]) {
        allapotUzenet('Ilyen kategória már van: ' + allapot.cimkek[kulcs], false);
        return;
      }
      allapot.cimkek[kulcs] = nev;
      allapot.leirasok[kulcs] = '';
      mezo.value = '';
      piszkozatMent(); mindentRajzol();
    });

    document.getElementById('rejtettekIs').addEventListener('change', function () {
      mutatRejtetteket = this.checked;
      termekekRajzol();
    });

    document.getElementById('ujKepek').addEventListener('change', function () {
      if (this.files && this.files.length) ujKepekBeolvas(this.files);
      this.value = '';
    });

    document.getElementById('mentesGomb').addEventListener('click', mentes);
    document.getElementById('mentesGomb2').addEventListener('click', mentes);
    document.getElementById('masolGomb').addEventListener('click', masol);

    mindentRajzol();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', indul);
  else indul();
})();
