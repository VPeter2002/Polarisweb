/* Közös kassza. Havi albérlet és rezsi elszámolás kettőnek.
   Minden adat a böngészőben marad, szerver nincs mögötte. */
(function () {
  'use strict';

  var TAR = 'kozos-kassza-v1';

  var ALAP_TETELEK = [
    { nev: 'Albérleti díj', osszeg: 0, fizette: 'a' },
    { nev: 'Gáz', osszeg: 0, fizette: 'a' },
    { nev: 'Áram', osszeg: 0, fizette: 'a' },
    { nev: 'Víz', osszeg: 0, fizette: 'a' },
    { nev: 'Net', osszeg: 0, fizette: 'a' }
  ];

  function ujHonapAdat() {
    return { tetelek: JSON.parse(JSON.stringify(ALAP_TETELEK)) };
  }

  var adat = betolt();

  function betolt() {
    try {
      var m = localStorage.getItem(TAR);
      if (m) {
        var d = JSON.parse(m);
        if (d && d.honapok) return d;
      }
    } catch (e) { /* privát mód: alapértelmezéssel megyünk */ }
    return { nevA: 'Peti', nevB: 'Vera', aranyA: 50, honapok: {} };
  }

  function ment() {
    try { localStorage.setItem(TAR, JSON.stringify(adat)); } catch (e) { /* nem baj */ }
  }

  var ft = new Intl.NumberFormat('hu-HU');
  function forint(n) { return ft.format(Math.round(n)) + ' Ft'; }
  function nevA() { return (adat.nevA || '').trim() || 'Peti'; }
  function nevB() { return (adat.nevB || '').trim() || 'Vera'; }

  /* ---------- hónap ---------- */

  var elHonap = document.getElementById('honap');
  var mostanHonap = new Date().toISOString().slice(0, 7);
  var aktualis = mostanHonap;
  elHonap.value = aktualis;

  function honapAdat() {
    if (!adat.honapok[aktualis]) adat.honapok[aktualis] = ujHonapAdat();
    return adat.honapok[aktualis];
  }

  function honapLep(irany) {
    var r = aktualis.split('-');
    var d = new Date(parseInt(r[0], 10), parseInt(r[1], 10) - 1 + irany, 1);
    aktualis = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
    elHonap.value = aktualis;
    rajzol();
  }
  document.getElementById('elozoHonap').addEventListener('click', function () { honapLep(-1); });
  document.getElementById('kovetkezoHonap').addEventListener('click', function () { honapLep(1); });
  elHonap.addEventListener('change', function () {
    if (elHonap.value) { aktualis = elHonap.value; rajzol(); }
  });

  /* ---------- nevek és arány ---------- */

  var elNevA = document.getElementById('nevA');
  var elNevB = document.getElementById('nevB');
  var elArany = document.getElementById('aranyA');
  var elAranyKiiras = document.getElementById('aranyKiiras');

  elNevA.value = adat.nevA || 'Peti';
  elNevB.value = adat.nevB || 'Vera';
  elArany.value = adat.aranyA;

  elNevA.addEventListener('input', function () { adat.nevA = elNevA.value; ment(); rajzol(); });
  elNevB.addEventListener('input', function () { adat.nevB = elNevB.value; ment(); rajzol(); });
  elArany.addEventListener('input', function () {
    adat.aranyA = parseInt(elArany.value, 10); ment(); rajzol();
  });

  /* ---------- tételek ---------- */

  var elTetelek = document.getElementById('tetelek');
  var elUres = document.getElementById('uresTetel');

  document.getElementById('ujTetel').addEventListener('click', function () {
    honapAdat().tetelek.push({ nev: '', osszeg: 0, fizette: 'a' });
    ment(); rajzol();
    var mezok = elTetelek.querySelectorAll('.tetel input[type=text]');
    if (mezok.length) mezok[mezok.length - 1].focus();
  });

  function rajzolTetelek() {
    var t = honapAdat().tetelek;
    elTetelek.innerHTML = '';
    elUres.hidden = t.length > 0;

    t.forEach(function (tetel, i) {
      var sor = document.createElement('div');
      sor.className = 'tetel';

      var nev = document.createElement('input');
      nev.type = 'text';
      nev.value = tetel.nev;
      nev.placeholder = 'Mire ment el';
      nev.setAttribute('aria-label', 'Tétel megnevezése');
      nev.addEventListener('input', function () { tetel.nev = nev.value; ment(); osszegez(); });

      var osszeg = document.createElement('input');
      osszeg.type = 'number';
      osszeg.min = '0';
      osszeg.step = '100';
      osszeg.value = tetel.osszeg || '';
      osszeg.placeholder = '0';
      osszeg.setAttribute('aria-label', 'Összeg forintban');
      osszeg.addEventListener('input', function () {
        var v = parseFloat(osszeg.value);
        tetel.osszeg = isNaN(v) || v < 0 ? 0 : v;
        ment(); osszegez();
      });

      var ki = document.createElement('select');
      ki.setAttribute('aria-label', 'Ki fizette');
      [['a', nevA()], ['b', nevB()], ['fele', 'Felesben álltuk']].forEach(function (o) {
        var opt = document.createElement('option');
        opt.value = o[0];
        opt.textContent = o[1];
        if (tetel.fizette === o[0]) opt.selected = true;
        ki.appendChild(opt);
      });
      ki.addEventListener('change', function () { tetel.fizette = ki.value; ment(); osszegez(); });

      var torol = document.createElement('button');
      torol.type = 'button';
      torol.className = 'tetel-torol';
      torol.textContent = '×';
      torol.title = 'Tétel törlése';
      torol.setAttribute('aria-label', 'Tétel törlése');
      torol.addEventListener('click', function () {
        honapAdat().tetelek.splice(i, 1); ment(); rajzol();
      });

      sor.appendChild(nev);
      sor.appendChild(osszeg);
      sor.appendChild(ki);
      sor.appendChild(torol);
      elTetelek.appendChild(sor);
    });
  }

  /* ---------- összegzés ---------- */

  function osszegez() {
    var t = honapAdat().tetelek;
    var ossz = 0, fizetettA = 0, fizetettB = 0;

    t.forEach(function (x) {
      var o = x.osszeg || 0;
      ossz += o;
      if (x.fizette === 'a') fizetettA += o;
      else if (x.fizette === 'b') fizetettB += o;
      else { fizetettA += o / 2; fizetettB += o / 2; }
    });

    var aranyA = adat.aranyA / 100;
    var jarA = ossz * aranyA;
    var jarB = ossz - jarA;
    var kulonbseg = fizetettA - jarA;   /* pozitív: A többet fizetett, mint amennyi rá esik */

    elAranyKiiras.textContent = adat.aranyA + ' / ' + (100 - adat.aranyA);

    var el = document.getElementById('osszegzes');
    if (ossz === 0) {
      el.innerHTML = '<div class="card card-halk"><p class="halvany" style="margin:0">' +
        'Írd be a tételek összegét, és itt megjelenik, ki tartozik kinek.</p></div>';
      return;
    }

    var verdikt;
    if (Math.abs(kulonbseg) < 1) {
      verdikt = '<p class="verdikt">Kvittek vagytok. Szép munka.</p>';
    } else if (kulonbseg > 0) {
      verdikt = '<p class="verdikt">' + eszkap(nevB()) + ' tartozik ' + eszkap(nevA()) + ' felé ' +
                '<span class="osszeg">' + forint(kulonbseg) + '</span></p>';
    } else {
      verdikt = '<p class="verdikt">' + eszkap(nevA()) + ' tartozik ' + eszkap(nevB()) + ' felé ' +
                '<span class="osszeg">' + forint(-kulonbseg) + '</span></p>';
    }

    el.innerHTML =
      '<div class="osszegzes-doboz"><h2>' + honapCim() + '</h2>' + verdikt +
      '<p>A hónap összesen ' + forint(ossz) + ', ' + adat.aranyA + ' a ' + (100 - adat.aranyA) +
      ' arányban osztva.</p></div>' +
      '<div class="reszletek">' +
        kartya(eszkap(nevA()), fizetettA, jarA) +
        kartya(eszkap(nevB()), fizetettB, jarB) +
        '<div class="reszlet-kartya"><h3>A hónap összesen</h3>' +
          '<div class="ertek">' + forint(ossz) + '</div>' +
          '<div class="alcim">' + t.filter(function (x) { return (x.osszeg || 0) > 0; }).length +
          ' tétel</div></div>' +
      '</div>';
  }

  function kartya(nev, fizetett, jar) {
    var elteres = fizetett - jar;
    var alcim = Math.abs(elteres) < 1
      ? 'Pont annyit, amennyi rá esik'
      : (elteres > 0 ? forint(elteres) + '-tal többet fizetett' : forint(-elteres) + '-tal kevesebbet fizetett');
    return '<div class="reszlet-kartya"><h3>' + nev + '</h3>' +
      '<div class="ertek">' + forint(fizetett) + '</div>' +
      '<div class="alcim">Rá esik: ' + forint(jar) + '<br>' + alcim + '</div></div>';
  }

  function eszkap(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  var HONAPOK = ['január','február','március','április','május','június',
                 'július','augusztus','szeptember','október','november','december'];
  function honapCim() {
    var r = aktualis.split('-');
    return r[0] + '. ' + HONAPOK[parseInt(r[1], 10) - 1];
  }

  function rajzol() { rajzolTetelek(); osszegez(); }

  rajzol();
})();
