/* Kozos vagolap-masolas. A clipboard API szinkron hibat is dobhat (nem fokuszalt dokumentum,
   nem biztonsagos kontextus), ezert try/catch KELL: enelkul a kezelo megall, es a felhasznalo
   semmilyen visszajelzest nem kap. Bukasnal nem allitjuk, hogy sikerult. */
function uaMasolTartalek(szoveg) {
  try {
    var ta = document.createElement('textarea');
    ta.value = szoveg;
    ta.setAttribute('readonly', '');
    ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0;pointer-events:none';
    document.body.appendChild(ta);
    ta.select();
    if (ta.setSelectionRange) { ta.setSelectionRange(0, szoveg.length); }
    var siker = document.execCommand && document.execCommand('copy');
    document.body.removeChild(ta);
    return !!siker;
  } catch (e) { return false; }
}

function uaMasol(szoveg, jelzo, utolag) {
  var kesz = false;
  var mutat = function (uzenet) {
    jelzo.textContent = uzenet;
    jelzo.removeAttribute('hidden');
    setTimeout(function () { jelzo.setAttribute('hidden', ''); }, 3500);
  };
  var siker = function () { if (kesz) { return; } kesz = true; mutat('Vágólapra másolva.'); };
  var bukas = function () {
    if (kesz) { return; } kesz = true;
    if (uaMasolTartalek(szoveg)) { mutat('Vágólapra másolva.'); return; }
    mutat('A másolás nem ment, jelölje ki és másolja kézzel.');
    if (typeof utolag === 'function') { utolag(); }
  };
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      var p = navigator.clipboard.writeText(szoveg);
      if (p && typeof p.then === 'function') {
        p.then(siker, bukas);
        setTimeout(bukas, 1200);
      } else { siker(); }
    } else { bukas(); }
  } catch (e) { bukas(); }
}

(function () {
  'use strict';

  // Mobil nav
  var burger = document.getElementById('burger');
  var navmob = document.getElementById('navmob');
  if (burger && navmob) {
    burger.addEventListener('click', function () {
      var open = navmob.hasAttribute('hidden');
      if (open) { navmob.removeAttribute('hidden'); } else { navmob.setAttribute('hidden', ''); }
      burger.classList.toggle('open', open);
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    navmob.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        navmob.setAttribute('hidden', '');
        burger.classList.remove('open');
        burger.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // Visszaszamlalas. A HTML-ben alapbol a datum all, tehat JS nelkul is olvashato marad.
  var el = document.getElementById('napok');
  var cap = document.getElementById('napok-cap');
  if (el && cap) {
    var nyitas = new Date(2026, 10, 4, 0, 0, 0); // 2026-11-04, lokalis ido
    var ma = new Date();
    var mail = new Date(ma.getFullYear(), ma.getMonth(), ma.getDate());
    var nap = Math.round((nyitas - mail) / 86400000);
    if (nap > 1) {
      el.textContent = nap + ' nap';
      cap.textContent = 'a nyilvános nyitásig, 2026. november 4.';
    } else if (nap === 1) {
      el.textContent = 'Holnap';
      cap.textContent = 'a nyilvános nyitás napja, 2026. november 4.';
    } else if (nap === 0) {
      el.textContent = 'Ma';
      cap.textContent = 'a nyilvános nyitás napja';
    } else {
      el.textContent = 'Megnyílt';
      cap.textContent = '2026. november 4. óta kereshető';
    }
  }
})();

/* ---- Kerelem-generator. Minden a bongeszoben marad, semmi nem megy ki innen. ---- */
(function () {
  'use strict';
  var form = document.getElementById('gen');
  if (!form) return;

  var v = function (id) {
    var el = document.getElementById(id);
    return el ? el.value.trim() : '';
  };
  var minoseg = function () {
    var r = form.querySelector('input[name="min"]:checked');
    return r ? r.value : 'sajat';
  };
  // A rokonsagi fok valaszto: amig ures, a tobbi mezo helyorzojehez igazodjon.
  var rokonSel = document.getElementById('e-rokon');
  var rokonJelol = function () { rokonSel.classList.toggle('ures', rokonSel.value === ''); };
  if (rokonSel) { rokonSel.addEventListener('change', rokonJelol); rokonJelol(); }

  var erintettBlokk = document.getElementById('erintett-blokk');
  var frissitBlokk = function () {
    var kell = minoseg() !== 'sajat';
    if (kell) { erintettBlokk.removeAttribute('hidden'); }
    else { erintettBlokk.setAttribute('hidden', ''); }
  };
  Array.prototype.forEach.call(form.querySelectorAll('input[name="min"]'), function (r) {
    r.addEventListener('change', frissitBlokk);
  });
  frissitBlokk();

  /* A csatolmany-lista a Betekintesi szabalyzat 1.8.2 pontjanak SAJAT felsorolasa szerint.
     Ami ott nev szerint nem szerepel (tavolabbi egyenesagbeli rokon), azt nem talaljuk ki. */
  var ROKON_CSAT = {
    'házastársa': ['Házastársként', 'Házassági és halotti anyakönyvi kivonat, vagy a halál tényét igazoló okirat, illetve holttá nyilvánítás.'],
    'élettársa': ['Élettársként', 'Halotti anyakönyvi kivonat, ügyféli nyilatkozat, két tanú egybehangzó nyilatkozata az élettársi közösségről, és két egymástól független tanú igazolása arról, hogy mettől meddig voltak élettársak.'],
    'gyermeke': ['Gyermekként', 'Születési és halotti anyakönyvi kivonat, vagy a halál tényét igazoló okirat.'],
    'szülője': ['Szülőként', 'Születési és halotti anyakönyvi kivonat, vagy a halál tényét igazoló okirat.'],
    'testvére': ['Testvérként', 'Születési és halotti anyakönyvi kivonat, vagy a halál tényét igazoló okirat.'],
    'egyéb egyeneságbeli rokona': ['Más egyeneságbeli rokonként', 'A szabályzat név szerint a házastársat, az élettársat, a gyermeket, a szülőt és a testvért sorolja fel, a távolabbi egyeneságbeli rokont nem. Hozzátartozóként Ön is jogosult lehet, de a leszármazást igazoló anyakönyvi kivonatokra és a halotti anyakönyvi kivonatra számítson, és a beadás előtt kérdezze meg az ügyfélszolgálatot.']
  };

  var H = '[kitöltendő]';
  var sor = function (cimke, ertek) { return '  ' + cimke + ': ' + (ertek || H); };
  var haVan = function (cimke, ertek) { return ertek ? '  ' + cimke + ': ' + ertek : null; };

  var keszit = function () {
    var m = minoseg();
    var sajat = m === 'sajat';
    var hianyzo = [];
    var kell = function (cimke, ertek) { if (!ertek) hianyzo.push(cimke); return ertek; };

    var HONAP = ['január', 'február', 'március', 'április', 'május', 'június',
                 'július', 'augusztus', 'szeptember', 'október', 'november', 'december'];
    var ma = new Date();
    var datum = ma.getFullYear() + '. ' + HONAP[ma.getMonth()] + ' ' + ma.getDate() + '.';

    var L = [];
    L.push('Állambiztonsági Szolgálatok Történeti Levéltára');
    L.push('1410 Budapest, Pf.: 119.');
    L.push('');
    L.push('Tárgy: betekintési kérelem');
    L.push('');
    L.push('Tisztelt Levéltár!');
    L.push('');
    L.push('Alulírott, az elmúlt rendszer titkosszolgálati tevékenységének feltárásáról és az');
    L.push('Állambiztonsági Szolgálatok Történeti Levéltára létrehozásáról szóló 2003. évi III.');
    L.push('törvény alapján betekintési kérelmet nyújtok be a Levéltárhoz.');
    L.push('');
    L.push('A kérelmező adatai:');
    L.push(sor('Név', kell('a kérelmező neve', v('k-nev'))));
    [haVan('Születési vagy leánykori név', v('k-szulnev'))].forEach(function (x) { if (x) L.push(x); });
    L.push(sor('Születési hely', kell('születési hely', v('k-szulhely'))));
    L.push(sor('Születési idő', kell('születési idő', v('k-szulido'))));
    L.push(sor('Anyja neve', kell('anyja neve', v('k-anyja'))));
    L.push(sor('Állandó lakcím', kell('állandó lakcím', v('k-lakcim'))));
    L.push('  Levelezési cím: ' + (v('k-levcim') || 'azonos az állandó lakcímmel'));
    L.push(sor('Telefonszám', kell('telefonszám', v('k-tel'))));
    [haVan('E-mail cím', v('k-email'))].forEach(function (x) { if (x) L.push(x); });
    L.push(sor('Személyazonosító okmány száma', kell('személyazonosító okmány száma', v('k-okmany'))));

    if (!sajat) {
      L.push('');
      L.push('Az érintett személy adatai, akire a kérelem vonatkozik:');
      L.push(sor('Név', kell('az érintett neve', v('e-nev'))));
      [haVan('Születési vagy leánykori név', v('e-szulnev'))].forEach(function (x) { if (x) L.push(x); });
      L.push(sor('Születési hely', kell('az érintett születési helye', v('e-szulhely'))));
      L.push(sor('Születési idő', kell('az érintett születési ideje', v('e-szulido'))));
      L.push(sor('Anyja neve', kell('az érintett anyja neve', v('e-anyja'))));
      if (m === 'elhunyt') {
        L.push(sor('Elhalálozás éve', kell('az elhalálozás éve', v('e-elhalt'))));
        L.push(sor('Rokonsági fok', kell('a rokonsági fok', v('e-rokon'))));
        // 1.5.3: a hazassag vagy eletkozosseg idotartama a kerelem kotelezo tartalma,
        // de csak hazastarsnal es elettarsnal ertelmezheto.
        var parkapcsolat = v('e-rokon') === 'házastársa' || v('e-rokon') === 'élettársa';
        if (parkapcsolat) {
          L.push(sor('A házasság vagy életközösség időtartama',
                     kell('a házasság vagy életközösség időtartama', v('e-egyutt'))));
        } else {
          [haVan('A házasság vagy életközösség időtartama', v('e-egyutt'))].forEach(function (x) { if (x) L.push(x); });
        }
      } else {
        [haVan('Rokonsági fok vagy jogviszony', v('e-rokon'))].forEach(function (x) { if (x) L.push(x); });
      }
    }

    var seged = [haVan('Az iratanyag keletkezésének feltételezett időszaka', v('s-idoszak')),
                 haVan('Foglalkozás, munkahely, lakcím ebben az időszakban', v('s-foglalkozas')),
                 haVan('A kérelem alapjául szolgáló esemény vagy tevékenység', v('s-esemeny'))]
                .filter(function (x) { return x; });
    if (seged.length) {
      L.push('');
      L.push('A keresést segítő adatok:');
      seged.forEach(function (x) { L.push(x); });
    }

    var talalt = [haVan('Fedőnév', v('n-fedonev')),
                  haVan('Dossziészám vagy levéltári jelzet', v('n-jelzet')),
                  haVan('Iratszám', v('n-iratszam'))]
                 .filter(function (x) { return x; });
    if (talalt.length) {
      L.push('');
      L.push('A nyilvános adatbázisban talált adatok:');
      talalt.forEach(function (x) { L.push(x); });
    }

    var bet = document.getElementById('c-betekintes').checked;
    var mas = document.getElementById('c-masolat').checked;
    if (!bet && !mas) { hianyzo.push('mit kér: betekintést vagy másolatot'); }
    var mit = bet && mas ? 'betekintést és másolatot' : (mas ? 'másolatot' : 'betekintést');
    var kire = sajat ? 'a személyemmel' : 'a fent megnevezett érintett személlyel';
    L.push('');
    L.push('Kérem, hogy ' + kire + ' kapcsolatba hozható, a Levéltár őrizetében lévő');
    L.push('iratokba ' + mit + ' biztosítani szíveskedjenek.');

    if (document.getElementById('c-nyilatkozat').checked) {
      L.push('');
      L.push('Nyilatkozom, hogy kívánom megismerni a jelentést készítő hálózati személy, illetve');
      L.push('operatív kapcsolat természetes személyazonosító adatait.');
    }

    L.push('');
    L.push('A személyazonosságom és a jogosultságom igazolására a Levéltár által kért okmányokat');
    L.push('bemutatom. Amennyiben a kérelmet azonosítás nélkül, elektronikus úton nyújtom be, a');
    L.push('másolatot személyesen veszem át, vagy aláírt eredeti példányt küldök postán.');
    L.push('');
    L.push('Kelt: ' + datum);
    L.push('');
    L.push('');
    L.push('                                        ..............................................');
    L.push('                                        ' + (v('k-nev') || H) + ', aláírás');

    // Csatolmanyok a szabalyzat szerint, agankent
    var cs = [];
    cs.push(['Minden kérelmezőtől', 'Személyazonosító okmány. A Levéltár az adatok valódiságának ellenőrzésére kéri.']);
    if (m === 'elhunyt') {
      var ag = ROKON_CSAT[v('e-rokon')];
      if (ag) { cs.push(ag); }
      cs.push(['Mikor kérik', 'A szabályzat szerint ezeket akkor kérik, ha az iratkeresés eredményes volt. A kérelmet tehát be lehet adni előbb is.']);
    }
    if (m === 'megh') {
      cs.push(['Meghatalmazottként', 'Két tanúval igazolt vagy közjegyző által hitelesített meghatalmazás. Ügyvéd esetén megbízás. A Levéltár saját meghatalmazás-nyomtatványa letölthető az ügyfélszolgálati oldalról.',
               { url: 'https://www.abtl.hu/ugyfelszolgalat', szoveg: 'abtl.hu/ugyfelszolgalat' }]);
    }
    return { szoveg: L.join('\n'), hianyzo: hianyzo, csatolmany: cs };
  };

  var out = document.getElementById('genout');
  var pre = document.getElementById('levelszoveg');
  var warn = document.getElementById('hiany');
  var csatLista = document.getElementById('csatolmany');

  document.getElementById('genbtn').addEventListener('click', function () {
    var r = keszit();
    pre.textContent = r.szoveg;

    if (r.hianyzo.length) {
      warn.textContent = 'A szabályzat szerint kötelező, de még üres: ' + r.hianyzo.join(', ') +
        '. A levélben ezeken a helyeken [kitöltendő] áll, kézzel is pótolható.';
      warn.removeAttribute('hidden');
    } else {
      warn.setAttribute('hidden', '');
    }

    csatLista.textContent = '';
    r.csatolmany.forEach(function (p) {
      var li = document.createElement('li');
      var s = document.createElement('span');
      s.className = 'ml';
      s.textContent = p[0];
      li.appendChild(s);
      li.appendChild(document.createTextNode(p[1]));
      if (p[2] && p[2].url) {
        li.appendChild(document.createTextNode(' '));
        var a = document.createElement('a');
        a.href = p[2].url; a.rel = 'noopener'; a.textContent = p[2].szoveg;
        li.appendChild(a);
      }
      csatLista.appendChild(li);
    });

    out.removeAttribute('hidden');
    out.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  var copyok = document.getElementById('copyok');
  var kijelol = function () {
    var r = document.createRange();
    r.selectNodeContents(pre);
    var sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(r);
  };
  document.getElementById('copybtn').addEventListener('click', function () {
    uaMasol(pre.textContent, copyok, kijelol);
  });
})();

/* ---- Megosztas, visszajelzes, kave. ----
   A KAVE_URL-t egyetlen helyen kell beallitani: ha ures, a kave-sor NEM jelenik meg,
   tehat nincs a lapon halott vagy kitalalt fizetesi link. */
(function () {
  'use strict';
  /* A tamogatas-oldal akkor jelenik meg a lapon, ha mar van bekotott fizetesi szolgaltato.
     Addig a sor rejtve marad: dead-end linket nem teszunk ki. Egy helyen kapcsolhato. */
  var TAMOGATAS_AKTIV = true;

  var sor = document.getElementById('kave-sor');
  if (sor && TAMOGATAS_AKTIV) { sor.removeAttribute('hidden'); }

  var linkbtn = document.getElementById('linkbtn');
  var linkok = document.getElementById('linkok');
  if (linkbtn && linkok) {
    linkbtn.addEventListener('click', function () {
      uaMasol(window.location.href.split('#')[0].split('?')[0], linkok);
    });
  }
})();
