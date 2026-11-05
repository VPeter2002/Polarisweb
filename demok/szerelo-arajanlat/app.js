/* Arajanlat osszeallito -- szerelo demo.
   Teljesen kliensoldali: nincs szerver, nincs kuldes. A sajat tetelek es a mentett
   ajanlatok a bongeszo localStorage-ban elnek. */
(function () {
  "use strict";

  /* ---------- hibajelzo: a csendes feher lap a legrosszabb hibaallapot ---------- */
  function hibaSav(uzenet, reszlet) {
    var d = document.createElement("div");
    d.setAttribute("data-hiba", reszlet || "");
    d.style.cssText = "position:fixed;left:0;right:0;bottom:0;z-index:99;background:#8d3511;color:#fff;padding:10px 16px;font:14px system-ui,sans-serif";
    d.textContent = uzenet;
    document.body.appendChild(d);
  }
  window.addEventListener("error", function (e) {
    hibaSav("Valami elromlott az oldalon. Frissíts rá, és ha megmarad, szólj nekünk.", e.message);
  });
  window.addEventListener("unhandledrejection", function (e) {
    hibaSav("Valami elromlott az oldalon. Frissíts rá, és ha megmarad, szólj nekünk.", String(e.reason));
  });

  /* ---------- tarolas ---------- */
  var KULCS_TETELEK = "szerelo-arajanlat-sajat-tetelek-v1";
  var KULCS_MENTETT = "szerelo-arajanlat-mentett-v1";
  var KULCS_FEJLEC = "szerelo-arajanlat-fejlec-v1";

  function olvas(kulcs, alap) {
    try {
      var s = localStorage.getItem(kulcs);
      return s ? JSON.parse(s) : alap;
    } catch (e) { return alap; }
  }
  function ir(kulcs, ertek) {
    try { localStorage.setItem(kulcs, JSON.stringify(ertek)); return true; }
    catch (e) { return false; }
  }

  /* ---------- minta-katalogus ----------
     Minta arak 2026-ra, tajekoztato jelleggel. A felhasznalo mindegyiket atirja. */
  var ALAP_KATALOGUS = [
    // viz
    { id: "v1", nev: "Csaptelep csere", egyseg: "db", ar: 12000, szakag: "viz", tipus: "munka" },
    { id: "v2", nev: "Mosdó beszerelése", egyseg: "db", ar: 18000, szakag: "viz", tipus: "munka" },
    { id: "v3", nev: "WC-csésze csere", egyseg: "db", ar: 22000, szakag: "viz", tipus: "munka" },
    { id: "v4", nev: "Zuhanykabin összeszerelés, beüzemelés", egyseg: "db", ar: 35000, szakag: "viz", tipus: "munka" },
    { id: "v5", nev: "Vízvezeték kiépítése falban", egyseg: "fm", ar: 6500, szakag: "viz", tipus: "munka" },
    { id: "v6", nev: "Lefolyóvezeték kiépítése", egyseg: "fm", ar: 5500, szakag: "viz", tipus: "munka" },
    { id: "v7", nev: "Bojler csere, bekötés", egyseg: "db", ar: 28000, szakag: "viz", tipus: "munka" },
    { id: "v8", nev: "Mosógép, mosogatógép bekötése", egyseg: "db", ar: 9000, szakag: "viz", tipus: "munka" },
    { id: "v9", nev: "Szifon csere", egyseg: "db", ar: 6000, szakag: "viz", tipus: "munka" },
    { id: "v10", nev: "Vízóra csere, plombálás ügyintézéssel", egyseg: "db", ar: 15000, szakag: "viz", tipus: "munka" },
    { id: "v11", nev: "Réz vízcső 15 mm, idomokkal", egyseg: "fm", ar: 2400, szakag: "viz", tipus: "anyag" },
    { id: "v12", nev: "PPR cső idomokkal", egyseg: "fm", ar: 1800, szakag: "viz", tipus: "anyag" },
    // gaz
    { id: "g1", nev: "Gázkészülék csere, beüzemelés", egyseg: "db", ar: 65000, szakag: "gaz", tipus: "munka" },
    { id: "g2", nev: "Gázvezeték kiépítése", egyseg: "fm", ar: 9000, szakag: "gaz", tipus: "munka" },
    { id: "g3", nev: "Konvektor leszerelése, kiszerelése", egyseg: "db", ar: 12000, szakag: "gaz", tipus: "munka" },
    { id: "g4", nev: "Gázszivárgás-vizsgálat", egyseg: "alkalom", ar: 18000, szakag: "gaz", tipus: "munka" },
    { id: "g5", nev: "Nyomáspróba, jegyzőkönyvvel", egyseg: "alkalom", ar: 25000, szakag: "gaz", tipus: "munka" },
    { id: "g6", nev: "Gázcső és idomok", egyseg: "fm", ar: 3600, szakag: "gaz", tipus: "anyag" },
    // villany
    { id: "e1", nev: "Szerelvénypont kiépítése (kapcsoló, konnektor)", egyseg: "pont", ar: 4500, szakag: "villany", tipus: "munka" },
    { id: "e2", nev: "Kapcsoló, konnektor csere", egyseg: "db", ar: 3500, szakag: "villany", tipus: "munka" },
    { id: "e3", nev: "Lámpatest felszerelése", egyseg: "db", ar: 6000, szakag: "villany", tipus: "munka" },
    { id: "e4", nev: "Elosztótábla csere, szerelés", egyseg: "db", ar: 55000, szakag: "villany", tipus: "munka" },
    { id: "e5", nev: "Falhoronyvágás", egyseg: "fm", ar: 2800, szakag: "villany", tipus: "munka" },
    { id: "e6", nev: "Kábelhúzás, kötések", egyseg: "fm", ar: 3200, szakag: "villany", tipus: "munka" },
    { id: "e7", nev: "Érintésvédelmi mérés, jegyzőkönyv", egyseg: "alkalom", ar: 22000, szakag: "villany", tipus: "munka" },
    { id: "e8", nev: "Villanyóra-kiállás készítése", egyseg: "db", ar: 45000, szakag: "villany", tipus: "munka" },
    { id: "e9", nev: "MM kábel 3x1,5", egyseg: "fm", ar: 420, szakag: "villany", tipus: "anyag" },
    { id: "e10", nev: "MM kábel 3x2,5", egyseg: "fm", ar: 650, szakag: "villany", tipus: "anyag" },
    { id: "e11", nev: "Süllyesztett szerelvénydoboz", egyseg: "db", ar: 320, szakag: "villany", tipus: "anyag" },
    // egyeb
    { id: "x1", nev: "Kiszállás, felmérés", egyseg: "alkalom", ar: 8000, szakag: "egyeb", tipus: "egyeb" },
    { id: "x2", nev: "Kiszállás vidékre", egyseg: "km", ar: 250, szakag: "egyeb", tipus: "egyeb" },
    { id: "x3", nev: "Bontás, törmelék elszállítása", egyseg: "m3", ar: 18000, szakag: "egyeb", tipus: "egyeb" },
    { id: "x4", nev: "Takarítás munka után", egyseg: "alkalom", ar: 9000, szakag: "egyeb", tipus: "egyeb" }
  ];

  var SABLONOK = [
    { nev: "Fürdőszoba felújítás", tetelek: [["v5",12],["v6",6],["v11",8],["v1",2],["v2",1],["v3",1],["v4",1],["v9",2],["x3",1],["x1",1]] },
    { nev: "Panellakás villany alapszerelés", tetelek: [["e1",38],["e5",45],["e9",80],["e10",40],["e11",38],["e4",1],["e7",1],["x1",1]] },
    { nev: "Bojler csere", tetelek: [["v7",1],["v5",2],["v11",2],["e7",1],["x1",1]] },
    { nev: "Gázkészülék csere", tetelek: [["g1",1],["g2",3],["g6",3],["g3",2],["g5",1],["x1",1]] },
    { nev: "Konyha felújítás", tetelek: [["v1",1],["v8",2],["v5",4],["e1",12],["e10",20],["e3",2],["x1",1]] },
    { nev: "Villanyóra-kiállás", tetelek: [["e8",1],["e4",1],["e7",1],["x1",1]] },
    { nev: "Üres ajánlat", tetelek: [] }
  ];

  var SZAKAG_NEV = { viz: "Víz", gaz: "Gáz", villany: "Villany", egyeb: "Egyéb" };
  var TIPUS_NEV = { munka: "Munkadíj", anyag: "Anyag", egyeb: "Egyéb" };

  /* ---------- allapot ---------- */
  var sajatTetelek = olvas(KULCS_TETELEK, []);
  var sorok = [];            // {nev, egyseg, ar, mennyiseg, szakag, tipus}
  var kovetkezoSorId = 1;

  function katalogus() { return ALAP_KATALOGUS.concat(sajatTetelek); }

  /* ---------- segedek ---------- */
  var FT = new Intl.NumberFormat("hu-HU", { maximumFractionDigits: 0 });
  function ft(n) { return FT.format(Math.round(n || 0)) + " Ft"; }
  function mennyisegSzoveg(n) {
    return new Intl.NumberFormat("hu-HU", { maximumFractionDigits: 2 }).format(n || 0);
  }
  function esc(s) {
    return String(s === undefined || s === null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function $(id) { return document.getElementById(id); }
  /* Ekezet nelkul is talaljon: telefonon a legtobben igy gepelnek. */
  function ekezetlen(sz) {
    return String(sz || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  }

  /* ---------- katalogus-lista ---------- */
  function katalogustRajzol() {
    var keres = ekezetlen($("kereso").value.trim());
    var szakag = $("kat-szuro").value;
    var lista = katalogus().filter(function (t) {
      if (szakag && t.szakag !== szakag) return false;
      if (keres && ekezetlen(t.nev).indexOf(keres) === -1) return false;
      return true;
    });
    var cel = $("katalogus");
    if (!lista.length) {
      cel.innerHTML = '<p class="ures">Nincs ilyen tétel. Vedd fel újként.</p>';
      return;
    }
    cel.innerHTML = lista.map(function (t) {
      var cimkeOsztaly = t.tipus === "anyag" ? "cimke anyag" : (t.tipus === "egyeb" ? "cimke egyeb" : "cimke");
      return '<button type="button" class="kat-sor" data-tetel="' + esc(t.id) + '">' +
        '<span class="nev">' + esc(t.nev) +
        '<small><span class="' + cimkeOsztaly + '">' + esc(TIPUS_NEV[t.tipus] || "") + '</span>' +
        esc(SZAKAG_NEV[t.szakag] || "") + ' · ' + esc(t.egyseg) + '</small></span>' +
        '<span class="ar szam">' + ft(t.ar) + '</span></button>';
    }).join("");
  }

  function tetelHozzaad(id, mennyiseg) {
    var t = katalogus().filter(function (x) { return x.id === id; })[0];
    if (!t) return;
    var meglevo = sorok.filter(function (s) { return s.forrasId === id; })[0];
    if (meglevo) {
      meglevo.mennyiseg += (mennyiseg || 1);
    } else {
      sorok.push({
        sorId: kovetkezoSorId++, forrasId: t.id, nev: t.nev, egyseg: t.egyseg,
        ar: t.ar, mennyiseg: mennyiseg || 1, szakag: t.szakag, tipus: t.tipus
      });
    }
    mindentRajzol();
  }

  /* ---------- tetel-tabla ---------- */
  function tetelekRajzol() {
    var test = $("tetelek");
    $("tetelek-ures").classList.toggle("rejtve", sorok.length > 0);
    if (!sorok.length) { test.innerHTML = ""; return; }

    var sorrend = ["munka", "anyag", "egyeb"];
    var html = "";
    sorrend.forEach(function (tipus) {
      var csoport = sorok.filter(function (s) { return s.tipus === tipus; });
      if (!csoport.length) return;
      html += '<tr class="kat-fej"><td colspan="6">' + esc(TIPUS_NEV[tipus]) + "</td></tr>";
      csoport.forEach(function (s) {
        html += "<tr>" +
          '<td data-c="Megnevezés"><input type="text" data-mezo="nev" data-sor="' + s.sorId + '" value="' + esc(s.nev) + '"></td>' +
          '<td data-c="Mennyiség"><input type="number" class="mennyi" min="0" step="0.5" data-mezo="mennyiseg" data-sor="' + s.sorId + '" value="' + s.mennyiseg + '"></td>' +
          '<td data-c="Egység"><input type="text" data-mezo="egyseg" data-sor="' + s.sorId + '" value="' + esc(s.egyseg) + '" style="width:82px"></td>' +
          '<td data-c="Egységár"><input type="number" class="egysegar" min="0" step="100" data-mezo="ar" data-sor="' + s.sorId + '" value="' + s.ar + '"></td>' +
          '<td class="j sor-osszeg szam" data-c="Összeg">' + ft(s.ar * s.mennyiseg) + "</td>" +
          '<td><button type="button" class="torol" data-torol="' + s.sorId + '" aria-label="Tétel törlése">&times;</button></td>' +
          "</tr>";
      });
    });
    test.innerHTML = html;
  }

  /* ---------- osszegzes ---------- */
  function osszegek() {
    var o = { munka: 0, anyag: 0, egyeb: 0 };
    sorok.forEach(function (s) { o[s.tipus] = (o[s.tipus] || 0) + s.ar * s.mennyiseg; });
    var alap = o.munka + o.anyag + o.egyeb;
    var kedvSzaz = Math.min(100, Math.max(0, parseFloat($("f-kedvezmeny").value) || 0));
    var kedv = alap * kedvSzaz / 100;
    var netto = alap - kedv;
    var afaSzaz = parseFloat($("f-afa").value) || 0;
    var afa = netto * afaSzaz / 100;
    return { munka: o.munka, anyag: o.anyag, egyeb: o.egyeb, alap: alap,
             kedvSzaz: kedvSzaz, kedv: kedv, netto: netto, afaSzaz: afaSzaz, afa: afa, brutto: netto + afa };
  }

  function osszegzestRajzol(o) {
    $("o-munka").textContent = ft(o.munka);
    $("o-anyag").textContent = ft(o.anyag);
    $("o-egyeb").textContent = ft(o.egyeb);
    $("o-kedvezmeny").textContent = o.kedv ? "-" + ft(o.kedv) : ft(0);
    $("o-netto").textContent = ft(o.netto);
    $("o-afa").textContent = o.afaSzaz ? ft(o.afa) : "alanyi adómentes";
    $("o-brutto").textContent = ft(o.brutto);
  }

  /* ---------- fejlec ---------- */
  var FEJLEC_MEZOK = ["f-ceg", "f-ceg-elerhetoseg", "f-ugyfel", "f-helyszin", "f-szam", "f-ervenyes", "f-megjegyzes"];
  function fejlecBeolvas() {
    var o = {};
    FEJLEC_MEZOK.forEach(function (id) { o[id] = $(id).value; });
    return o;
  }
  function fejlecBeallit(o) {
    FEJLEC_MEZOK.forEach(function (id) { if (o && o[id] !== undefined) $(id).value = o[id]; });
  }

  /* ---------- elonezet ---------- */
  function elonezetRajzol(o) {
    var f = fejlecBeolvas();
    var ma = new Date();
    var datum = ma.toLocaleDateString("hu-HU", { year: "numeric", month: "long", day: "numeric" });
    var ervenyes = new Date(ma.getTime() + (parseInt(f["f-ervenyes"], 10) || 30) * 86400000)
      .toLocaleDateString("hu-HU", { year: "numeric", month: "long", day: "numeric" });

    var sorHtml = "";
    ["munka", "anyag", "egyeb"].forEach(function (tipus) {
      var csoport = sorok.filter(function (s) { return s.tipus === tipus; });
      if (!csoport.length) return;
      sorHtml += '<tr class="kat-fej"><td colspan="4">' + esc(TIPUS_NEV[tipus]) + "</td></tr>";
      csoport.forEach(function (s) {
        sorHtml += "<tr><td>" + esc(s.nev) + "</td>" +
          '<td class="j szam">' + mennyisegSzoveg(s.mennyiseg) + " " + esc(s.egyseg) + "</td>" +
          '<td class="j szam">' + ft(s.ar) + "</td>" +
          '<td class="j szam">' + ft(s.ar * s.mennyiseg) + "</td></tr>";
      });
    });

    if (!sorok.length) {
      $("elonezet").innerHTML = '<p class="ures" style="padding:0">Az előnézet akkor jelenik meg, ha már van tétel az ajánlatban.</p>';
      return;
    }

    $("elonezet").innerHTML =
      '<div class="e-fej"><div><h3>Árajánlat</h3>' +
        "<div>" + esc(f["f-szam"] || "") + "</div></div>" +
        '<div class="jobb">Kelt: ' + esc(datum) + "<br>Érvényes: " + esc(ervenyes) + " napjáig</div></div>" +
      '<div class="e-felek"><div><b>Kiállító</b>' + esc(f["f-ceg"] || "A te vállalkozásod") +
        "<br>" + esc(f["f-ceg-elerhetoseg"] || "") + "</div>" +
        "<div><b>Megrendelő</b>" + esc(f["f-ugyfel"] || "") +
        "<br>" + esc(f["f-helyszin"] || "") + "</div></div>" +
      "<table><thead><tr><th>Megnevezés</th><th class=\"j\">Mennyiség</th><th class=\"j\">Egységár</th><th class=\"j\">Összeg</th></tr></thead><tbody>" +
        sorHtml + "</tbody></table>" +
      '<div class="osszegzes">' +
        (o.kedv ? "<div>Részösszeg</div><div class=\"szam\">" + ft(o.alap) + "</div>" +
                  "<div>Kedvezmény " + o.kedvSzaz + "%</div><div class=\"szam\">-" + ft(o.kedv) + "</div>" : "") +
        "<div>Nettó összesen</div><div class=\"szam\">" + ft(o.netto) + "</div>" +
        "<div>ÁFA" + (o.afaSzaz ? " " + o.afaSzaz + "%" : "") + "</div><div class=\"szam\">" +
          (o.afaSzaz ? ft(o.afa) : "alanyi adómentes") + "</div>" +
        '<div class="vegosszeg">Fizetendő</div><div class="vegosszeg szam">' + ft(o.brutto) + "</div></div>" +
      '<div class="e-lab">' + (f["f-megjegyzes"] ? esc(f["f-megjegyzes"]) + "<br><br>" : "") +
        "Ez az ajánlat tájékoztató jellegű, a helyszíni felmérés módosíthatja.</div>";
  }

  /* ---------- szoveges valtozat ---------- */
  function szovegesAjanlat(o) {
    var f = fejlecBeolvas();
    var s = ["ÁRAJÁNLAT " + (f["f-szam"] || ""), ""];
    if (f["f-ceg"]) s.push("Kiállító: " + f["f-ceg"]);
    if (f["f-ceg-elerhetoseg"]) s.push(f["f-ceg-elerhetoseg"]);
    if (f["f-ugyfel"]) s.push("Megrendelő: " + f["f-ugyfel"]);
    if (f["f-helyszin"]) s.push("Helyszín: " + f["f-helyszin"]);
    s.push("");
    ["munka", "anyag", "egyeb"].forEach(function (tipus) {
      var csoport = sorok.filter(function (x) { return x.tipus === tipus; });
      if (!csoport.length) return;
      s.push(TIPUS_NEV[tipus].toUpperCase());
      csoport.forEach(function (x) {
        s.push("  " + x.nev + "  " + mennyisegSzoveg(x.mennyiseg) + " " + x.egyseg +
               " x " + ft(x.ar) + " = " + ft(x.ar * x.mennyiseg));
      });
      s.push("");
    });
    if (o.kedv) { s.push("Részösszeg: " + ft(o.alap)); s.push("Kedvezmény " + o.kedvSzaz + "%: -" + ft(o.kedv)); }
    s.push("Nettó összesen: " + ft(o.netto));
    s.push("ÁFA" + (o.afaSzaz ? " " + o.afaSzaz + "%: " + ft(o.afa) : ": alanyi adómentes"));
    s.push("FIZETENDŐ: " + ft(o.brutto));
    if (f["f-megjegyzes"]) { s.push(""); s.push(f["f-megjegyzes"]); }
    return s.join("\n");
  }

  /* ---------- mentett ajanlatok ---------- */
  function mentettekRajzol() {
    var lista = olvas(KULCS_MENTETT, []);
    var cel = $("mentettek");
    if (!lista.length) { cel.innerHTML = '<p class="jegyzet" style="margin:0">Még nincs mentett ajánlat.</p>'; return; }
    cel.innerHTML = lista.map(function (m, i) {
      return '<div style="display:flex;align-items:center;gap:8px;padding:7px 0;border-top:1px solid var(--vonal)">' +
        '<span style="flex:1 1 auto;min-width:0"><b>' + esc(m.cim) + "</b><br>" +
        '<small style="color:var(--halvany)">' + esc(m.datum) + " · " + ft(m.brutto) + "</small></span>" +
        '<button type="button" class="gomb masodlagos" style="padding:6px 10px" data-betolt="' + i + '">Betöltés</button>' +
        '<button type="button" class="torol" data-mentett-torol="' + i + '" aria-label="Mentett ajánlat törlése">&times;</button></div>';
    }).join("");
  }

  function ment() {
    var o = osszegek();
    var f = fejlecBeolvas();
    var lista = olvas(KULCS_MENTETT, []);
    var cim = (f["f-ugyfel"] || "Névtelen megrendelő") + (f["f-szam"] ? " · " + f["f-szam"] : "");
    lista.unshift({
      cim: cim, datum: new Date().toLocaleString("hu-HU"), brutto: o.brutto,
      fejlec: f, sorok: sorok, kedvezmeny: $("f-kedvezmeny").value, afa: $("f-afa").value
    });
    if (!ir(KULCS_MENTETT, lista.slice(0, 20))) {
      hibaSav("Nem sikerült menteni: a böngésző tárhelye nem elérhető.", "localStorage");
      return;
    }
    mentettekRajzol();
  }

  function betolt(i) {
    var m = olvas(KULCS_MENTETT, [])[i];
    if (!m) return;
    sorok = (m.sorok || []).map(function (s) { s.sorId = kovetkezoSorId++; return s; });
    fejlecBeallit(m.fejlec);
    $("f-kedvezmeny").value = m.kedvezmeny || 0;
    $("f-afa").value = m.afa || "27";
    mindentRajzol();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  /* ---------- fo rajzolo ---------- */
  function mindentRajzol() {
    tetelekRajzol();
    var o = osszegek();
    osszegzestRajzol(o);
    elonezetRajzol(o);
    ir(KULCS_FEJLEC, fejlecBeolvas());
  }

  /* ---------- esemenyek ---------- */
  function esemenyek() {
    $("sablonok").innerHTML = SABLONOK.map(function (s, i) {
      return '<button type="button" class="sablon" data-sablon="' + i + '">' + esc(s.nev) + "</button>";
    }).join("");

    $("sablonok").addEventListener("click", function (e) {
      var g = e.target.closest("[data-sablon]");
      if (!g) return;
      var s = SABLONOK[parseInt(g.getAttribute("data-sablon"), 10)];
      sorok = [];
      s.tetelek.forEach(function (p) { tetelHozzaad(p[0], p[1]); });
      mindentRajzol();
    });

    $("katalogus").addEventListener("click", function (e) {
      var g = e.target.closest("[data-tetel]");
      if (g) tetelHozzaad(g.getAttribute("data-tetel"), 1);
    });

    $("kereso").addEventListener("input", katalogustRajzol);
    $("kat-szuro").addEventListener("change", katalogustRajzol);

    $("tetelek").addEventListener("input", function (e) {
      var be = e.target;
      var sorId = parseInt(be.getAttribute("data-sor"), 10);
      var mezo = be.getAttribute("data-mezo");
      if (!sorId || !mezo) return;
      var s = sorok.filter(function (x) { return x.sorId === sorId; })[0];
      if (!s) return;
      if (mezo === "mennyiseg" || mezo === "ar") {
        s[mezo] = Math.max(0, parseFloat(be.value) || 0);
        var sor = be.closest("tr");
        if (sor) sor.querySelector(".sor-osszeg").textContent = ft(s.ar * s.mennyiseg);
        var o = osszegek(); osszegzestRajzol(o); elonezetRajzol(o);
      } else {
        s[mezo] = be.value;
        s.forrasId = null;               /* atirt nev mar nem ugyanaz a katalogus-tetel */
        var o2 = osszegek(); elonezetRajzol(o2);
      }
    });

    $("tetelek").addEventListener("click", function (e) {
      var g = e.target.closest("[data-torol]");
      if (!g) return;
      var sorId = parseInt(g.getAttribute("data-torol"), 10);
      sorok = sorok.filter(function (x) { return x.sorId !== sorId; });
      mindentRajzol();
    });

    ["f-kedvezmeny", "f-afa"].forEach(function (id) {
      $(id).addEventListener("input", function () { var o = osszegek(); osszegzestRajzol(o); elonezetRajzol(o); });
      $(id).addEventListener("change", function () { var o = osszegek(); osszegzestRajzol(o); elonezetRajzol(o); });
    });
    FEJLEC_MEZOK.forEach(function (id) {
      $(id).addEventListener("input", function () { elonezetRajzol(osszegek()); ir(KULCS_FEJLEC, fejlecBeolvas()); });
    });

    /* uj tetel */
    var parbeszed = $("uj-tetel");
    $("uj-tetel-gomb").addEventListener("click", function () {
      $("uj-tetel-hiba").textContent = "";
      if (parbeszed.showModal) parbeszed.showModal(); else parbeszed.setAttribute("open", "");
    });
    $("uj-tetel-urlap").addEventListener("submit", function (e) {
      if (e.submitter && e.submitter.value === "megse") return;
      var nev = $("u-nev").value.trim();
      var egyseg = $("u-egyseg").value.trim() || "db";
      var ar = parseFloat($("u-ar").value);
      if (!nev || !(ar >= 0)) {
        e.preventDefault();
        $("uj-tetel-hiba").textContent = "A megnevezés és az egységár kitöltése kötelező.";
        return;
      }
      var t = {
        id: "s" + Date.now(), nev: nev, egyseg: egyseg, ar: ar,
        szakag: $("u-szakag").value, tipus: $("u-tipus").value
      };
      sajatTetelek.push(t);
      if (!ir(KULCS_TETELEK, sajatTetelek)) {
        hibaSav("Az új tétel bekerült az ajánlatba, de nem sikerült elmenteni a böngészőbe.", "localStorage");
      }
      $("u-nev").value = ""; $("u-ar").value = "";
      katalogustRajzol();
      tetelHozzaad(t.id, 1);
    });

    $("ment-gomb").addEventListener("click", ment);
    $("uj-gomb").addEventListener("click", function () {
      sorok = []; $("f-kedvezmeny").value = 0; mindentRajzol();
    });
    $("mentettek").addEventListener("click", function (e) {
      var b = e.target.closest("[data-betolt]");
      if (b) { betolt(parseInt(b.getAttribute("data-betolt"), 10)); return; }
      var t = e.target.closest("[data-mentett-torol]");
      if (t) {
        var lista = olvas(KULCS_MENTETT, []);
        lista.splice(parseInt(t.getAttribute("data-mentett-torol"), 10), 1);
        ir(KULCS_MENTETT, lista);
        mentettekRajzol();
      }
    });

    $("nyomtat-gomb").addEventListener("click", function () {
      if (!sorok.length) { hibaSav("Előbb tegyél tételt az ajánlatba.", "ures"); return; }
      window.print();
    });

    $("masol-gomb").addEventListener("click", function () {
      var szoveg = szovegesAjanlat(osszegek());
      var kesz = function () {
        var g = $("masol-gomb"); var regi = g.textContent;
        g.textContent = "Vágólapra másolva"; setTimeout(function () { g.textContent = regi; }, 1800);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(szoveg).then(kesz, function () { tartalekMasolas(szoveg, kesz); });
      } else { tartalekMasolas(szoveg, kesz); }
    });
  }

  function tartalekMasolas(szoveg, kesz) {
    var ta = document.createElement("textarea");
    ta.value = szoveg; ta.style.cssText = "position:fixed;left:-9999px";
    document.body.appendChild(ta); ta.select();
    try { document.execCommand("copy"); kesz(); } catch (e) { hibaSav("A másolás nem sikerült, jelöld ki kézzel.", String(e)); }
    document.body.removeChild(ta);
  }

  /* ---------- indulas ---------- */
  fejlecBeallit(olvas(KULCS_FEJLEC, null));
  esemenyek();
  katalogustRajzol();
  mentettekRajzol();
  var elsoSablon = SABLONOK[0];
  elsoSablon.tetelek.forEach(function (p) { tetelHozzaad(p[0], p[1]); });
  mindentRajzol();
})();
