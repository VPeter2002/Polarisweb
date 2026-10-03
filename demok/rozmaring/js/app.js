/* Rozmaring Ajtódíszek & Dekor */
(function () {
  'use strict';

  var A = window.ROZMARING || { cimkek: {}, tetelek: [] };
  var mozgasCsokkentve = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* A képek útvonalát a kirenderelt markupból vezetjük le, nem hardcode-oljuk.
     Így a demo bármelyik alkönyvtárban működik, és a deploy-transzformáció sem
     tudja eltörni, mert az csak HTML-attribútumot ír át. */
  var ALAP = (function () {
    var elso = document.querySelector('.hero-kep img');
    var ut = elso ? elso.getAttribute('src') : 'img/';
    return ut.replace(/[^/]*$/, '');
  })();
  function kep(f) { return ALAP + f + '.jpg'; }

  /* ---------- fejléc ---------- */
  var fejlec = document.getElementById('fejlec');
  window.addEventListener('scroll', function () {
    fejlec.classList.toggle('tapad', window.scrollY > 12);
  }, { passive: true });

  var hamb = document.getElementById('hamburger');
  var menuMobil = document.getElementById('menuMobil');
  function menutZar() {
    hamb.classList.remove('nyit');
    hamb.setAttribute('aria-expanded', 'false');
    hamb.setAttribute('aria-label', 'Menü megnyitása');
    menuMobil.hidden = true;
  }
  hamb.addEventListener('click', function () {
    var nyit = hamb.classList.toggle('nyit');
    hamb.setAttribute('aria-expanded', nyit ? 'true' : 'false');
    hamb.setAttribute('aria-label', nyit ? 'Menü bezárása' : 'Menü megnyitása');
    menuMobil.hidden = !nyit;
  });
  menuMobil.addEventListener('click', function (e) {
    if (e.target.tagName === 'A') menutZar();
  });

  /* ---------- kategóriák ---------- */
  var LEIRAS = {
    koszoru: 'Teljes körkoszorú az ajtóra vagy a falra',
    karika: 'Kötélkarikára kötött, könnyedebb félkoszorú',
    csokor: 'Papírba csomagolt szárazvirág csokor',
    asztali: 'Kaspóba vagy ládikába kötött asztaldísz',
    ajandek: 'Kis csomagok, díszdobozok, ajándékkísérők'
  };
  var elKat = document.getElementById('kategoriak');
  Object.keys(A.cimkek).forEach(function (k) {
    var elsoKep = (A.tetelek.filter(function (t) { return t.k === k; })[0] || {}).f;
    if (!elsoKep) return;
    var db = A.tetelek.filter(function (t) { return t.k === k; }).length;
    var a = document.createElement('a');
    a.className = 'kat';
    a.href = '#galeria';
    a.setAttribute('data-kat', k);
    var im = document.createElement('img');
    im.src = kep(elsoKep);
    im.alt = A.cimkek[k];
    im.loading = 'lazy';
    im.decoding = 'async';
    var sz = document.createElement('div');
    sz.className = 'kat-szoveg';
    var h = document.createElement('h3'); h.textContent = A.cimkek[k];
    var s = document.createElement('span'); s.textContent = (LEIRAS[k] || '') + ' · ' + db + ' darab';
    sz.appendChild(h); sz.appendChild(s);
    a.appendChild(im); a.appendChild(sz);
    a.addEventListener('click', function () { szur(k); });
    elKat.appendChild(a);
  });

  /* ---------- szűrők és galéria ---------- */
  var elSzurok = document.getElementById('szurok');
  var elRacs = document.getElementById('galeriaRacs');
  var aktivSzuro = 'mind';

  function szuroGomb(kulcs, felirat) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'szuro' + (kulcs === aktivSzuro ? ' aktiv' : '');
    b.textContent = felirat;
    b.setAttribute('data-szuro', kulcs);
    b.addEventListener('click', function () { szur(kulcs); });
    return b;
  }
  elSzurok.appendChild(szuroGomb('mind', 'Mind'));
  Object.keys(A.cimkek).forEach(function (k) {
    elSzurok.appendChild(szuroGomb(k, A.cimkek[k]));
  });

  A.tetelek.forEach(function (t, i) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'darab';
    b.setAttribute('data-kat', t.k);
    b.setAttribute('data-i', i);
    var im = document.createElement('img');
    im.src = kep(t.f);
    im.alt = A.cimkek[t.k] + ' szárazvirágból';
    im.loading = 'lazy';
    im.decoding = 'async';
    var fed = document.createElement('span');
    fed.className = 'darab-fedo';
    fed.textContent = A.cimkek[t.k];
    b.appendChild(im); b.appendChild(fed);
    b.addEventListener('click', function () { nagyitoNyit(i); });
    elRacs.appendChild(b);
  });

  function szur(kulcs) {
    aktivSzuro = kulcs;
    Array.prototype.forEach.call(elSzurok.children, function (b) {
      b.classList.toggle('aktiv', b.getAttribute('data-szuro') === kulcs);
    });
    Array.prototype.forEach.call(elRacs.children, function (d) {
      var mutat = kulcs === 'mind' || d.getAttribute('data-kat') === kulcs;
      d.classList.toggle('rejtve', !mutat);
    });
  }

  /* ---------- nagyító ---------- */
  var nagyito = document.getElementById('nagyito');
  var nagyitoKep = document.getElementById('nagyitoKep');
  var nagyitoRendel = document.getElementById('nagyitoRendel');
  var aktualisIndex = 0;

  function lathatoIndexek() {
    return A.tetelek.map(function (t, i) { return i; }).filter(function (i) {
      return aktivSzuro === 'mind' || A.tetelek[i].k === aktivSzuro;
    });
  }

  function nagyitoNyit(i) {
    aktualisIndex = i;
    var t = A.tetelek[i];
    nagyitoKep.src = kep(t.f);
    nagyitoKep.alt = A.cimkek[t.k] + ' szárazvirágból';
    nagyito.hidden = false;
    document.body.style.overflow = 'hidden';
    nagyitoRendel.focus();
  }
  function nagyitoZar() {
    nagyito.hidden = true;
    document.body.style.overflow = '';
  }
  function lep(irany) {
    var lista = lathatoIndexek();
    var hol = lista.indexOf(aktualisIndex);
    if (hol === -1) return;
    nagyitoNyit(lista[(hol + irany + lista.length) % lista.length]);
  }
  document.getElementById('nagyitoBezar').addEventListener('click', nagyitoZar);
  document.getElementById('nagyitoElozo').addEventListener('click', function () { lep(-1); });
  document.getElementById('nagyitoKovetkezo').addEventListener('click', function () { lep(1); });
  nagyito.addEventListener('click', function (e) { if (e.target === nagyito) nagyitoZar(); });
  document.addEventListener('keydown', function (e) {
    if (nagyito.hidden) return;
    if (e.key === 'Escape') nagyitoZar();
    if (e.key === 'ArrowLeft') lep(-1);
    if (e.key === 'ArrowRight') lep(1);
  });
  nagyitoRendel.addEventListener('click', function () {
    valasztTermek(aktualisIndex);
    nagyitoZar();
  });

  /* ---------- űrlap ---------- */
  /* A rendelesnel KATEGORIAT valasztunk, nem konkret darabot: a galeriaban levo
     darabok mar elkeszultek, es pontosan ugyanolyat ugysem lehet ujra kotni. */
  var elTermek = document.getElementById('termek');
  var ures = document.createElement('option');
  ures.value = '';
  ures.textContent = 'Még nem tudom, segíts választani';
  elTermek.appendChild(ures);
  Object.keys(A.cimkek).forEach(function (k) {
    var o = document.createElement('option');
    o.value = k;
    o.textContent = A.cimkek[k];
    elTermek.appendChild(o);
  });
  function valasztTermek(i) {
    var t = A.tetelek[i];
    if (t) elTermek.value = t.k;
  }

  var urlap = document.getElementById('rendelesUrlap');
  var allapot = document.getElementById('urlapAllapot');
  var kuldGomb = document.getElementById('kuldGomb');

  urlap.addEventListener('submit', async function (e) {
    e.preventDefault();
    allapot.className = 'urlap-allapot';
    allapot.textContent = '';

    var nev = urlap.nev.value.trim();
    var email = urlap.email.value.trim();
    var uzenet = urlap.uzenet.value.trim();

    if (!nev || !email || !uzenet) {
      allapot.textContent = 'A név, az e-mail cím és az üzenet kell a küldéshez.';
      allapot.classList.add('rossz');
      return;
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      allapot.textContent = 'Az e-mail cím formátuma nem jó.';
      allapot.classList.add('rossz');
      return;
    }

    var valasztott = elTermek.value === ''
      ? 'Nem választott kategóriát, segítséget kér'
      : elTermek.options[elTermek.selectedIndex].textContent;

    kuldGomb.disabled = true;
    kuldGomb.textContent = 'Küldöm...';

    try {
      var valasz = await fetch('/api/send-client-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client: 'rozmaring',
          name: nev,
          email: email,
          phone: urlap.telefon.value.trim(),
          message: 'Érdekli: ' + valasztott + '\n\n' + uzenet,
          website: urlap.website.value
        })
      });
      if (!valasz.ok) throw new Error('hiba');
      allapot.textContent = 'Megkaptam, köszönöm. Hamarosan válaszolok.';
      allapot.classList.add('jo');
      urlap.reset();
    } catch (hiba) {
      /* Tartalék: ha a küldés elhasal, ne vesszen el az üzenet.
         A levelező megnyílik a már beírt szöveggel. */
      allapot.innerHTML = 'A küldés most nem sikerült. ' +
        '<a href="' + mailtoTartalek(nev, email, valasztott, uzenet) + '">Megnyitom levélben</a>';
      allapot.classList.add('rossz');
    } finally {
      kuldGomb.disabled = false;
      kuldGomb.textContent = 'Elküldöm';
    }
  });

  function mailtoTartalek(nev, email, termek, uzenet) {
    var torzs = 'Nev: ' + nev + '\nE-mail: ' + email + '\nErdekli: ' + termek + '\n\n' + uzenet;
    return 'mailto:?subject=' + encodeURIComponent('Rendelesi szandek a weboldalrol')
         + '&body=' + encodeURIComponent(torzs);
  }

  /* ---------- feltűnés görgetésre ---------- */
  var elemek = document.querySelectorAll('.feltun');
  if (!('IntersectionObserver' in window) || mozgasCsokkentve) {
    Array.prototype.forEach.call(elemek, function (el) { el.classList.add('lathato'); });
  } else {
    var megfigyelo = new IntersectionObserver(function (bejegyzesek) {
      bejegyzesek.forEach(function (b) {
        if (b.isIntersecting) { b.target.classList.add('lathato'); megfigyelo.unobserve(b.target); }
      });
    }, { threshold: 0, rootMargin: '0px 0px -6% 0px' });
    Array.prototype.forEach.call(elemek, function (el) { megfigyelo.observe(el); });
  }
})();
