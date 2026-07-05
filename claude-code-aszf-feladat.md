# Feladat Claude Code-nak: ÁSZF oldal hozzáadása a Polarisweb oldalhoz

## Cél
Hozz létre egy új `aszf.html` oldalt a projektben, amely a mellékelt ÁSZF-tartalmat jeleníti meg, és illeszkedik a meglévő oldalak (index.html, pricing.html, adatkezeles.html) dizájnjához.

## Konkrét lépések

1. **Mintaként használd az `adatkezeles.html`-t.**
   Ez a legjobb kiindulópont, mert ez is egy hosszú, szöveges jogi oldal. Másold le a szerkezetét (fejléc/nav, lábléc, betűtípusok, színek, konténer-szélesség, tipográfia), és csak a fő tartalmi blokkot cseréld le az ÁSZF szövegére.

2. **Fájlnév:** `aszf.html` a projekt gyökerében (ott, ahol a többi .html van).

3. **Fejléc (`<head>`):**
   - `<title>Általános Szerződési Feltételek — Polarisweb</title>`
   - `<meta name="description" content="A Polarisweb weboldal-bérlési szolgáltatásának Általános Szerződési Feltételei.">`
   - Ugyanazokat a CSS-fájlokat / stílusokat töltsd be, mint az adatkezeles.html.

4. **Tartalom:** a mellékelt `aszf-polarisweb.md` fájl teljes tartalmát alakítsd át HTML-lé, a meglévő oldal tipográfiai elemeivel:
   - A `##` szintű címekből `<h2>`, a `###`-ekből `<h3>`.
   - A számozott pontok (7.1., 7.2. stb.) maradjanak bekezdésekként (`<p>`), a számozással együtt — NE alakítsd `<ol>`-lá, mert a pontszámok fixek és hivatkoznak egymásra.
   - A 6.1. pontban lévő táblázatot (Csomag / Minimum időszak) valódi `<table>`-ként jelenítsd meg, a meglévő oldal táblázatstílusával (ha van); ha nincs, adj neki egy egyszerű, letisztult stílust.
   - A felsorolások (a 7.7. pontban és a 2. pont fogalmi listájában) legyenek `<ul><li>`.
   - Az adatkezelési tájékoztatóra mutató link (15. pont) mutasson az `adatkezeles.html`-re.

5. **Lábléc-linkek frissítése MINDEN oldalon:**
   A footerben, ahol jelenleg az "Adatkezelési tájékoztató" link szerepel, tegyél mellé egy "ÁSZF" linket, ami az `aszf.html`-re mutat. Ezt írd át az összes oldalon: `index.html`, `portfolio.html`, `pricing.html`, `ajanlatkeres.html`, `adatkezeles.html`.

6. **Dátum:** az ÁSZF tetején lévő "Hatályos: 2026. 07. 01.-től" dátumot hagyd úgy, vagy cseréld a tényleges élesítés dátumára.

## Fontos
- NE találj ki új tartalmat és NE módosítsd a jogi szöveget — pontosan a mellékelt `aszf-polarisweb.md` tartalmát vidd fel.
- Ügyelj rá, hogy a mobilnézet is jól nézzen ki (a hosszú szöveg és a táblázat reszponzív legyen).
