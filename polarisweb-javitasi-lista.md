# Polarisweb — javítási / fejlesztési feladatlista

Forrás: https://polarisweb-gamma.vercel.app (index.html, portfolio.html, pricing.html, ajanlatkeres.html, adatkezeles.html)

## 🔴 Sürgős / hiba jellegű

1. **`index.html` — helykitöltő szöveg élesben.**
   A "Ki áll a Polarisweb mögött" szekcióban ez a szöveg jelenik meg: `Portré képe itt lesz`. Ez placeholder, ami élő oldalon amatőr benyomást kelt. Cserélni kell egy valódi fotóra (vagy legalább egy stílusos illusztrációra/monogramra, amíg nincs fotó).

2. **Footer / kapcsolat elérhetőségek hiányosak a legtöbb oldalon.**
   Az `adatkezeles.html`-en szerepel telefonszám (`+36 70 671 3002`) és adószám/nyilvántartási szám (Veszprémi Péter E.V., adószám: 91513195-1-38), de ezek **nincsenek kiírva** az `index.html`, `portfolio.html`, `pricing.html` lábléceiben, pedig a hero szövegben szerepel "akár hívjon" — jelenleg nincs hova hívni. Javaslat: a footer "Kapcsolat" blokkba kerüljön be a telefonszám is (a teljes céges adatok maradhatnak csak az adatkezelési oldalon).

3. **Halott social linkek.** `Instagram` és `LinkedIn` linkek minden aloldal láblécében `#`-re mutatnak. Vagy be kell kötni a valós URL-eket, vagy el kell rejteni ezeket az ikonokat, amíg nincs tartalom mögöttük.

## 🟠 Tartalmi / konverziós javaslatok

4. **Portfólió szekció → ideiglenes "Hamarosan" állapot.**
   Mivel az oldal most készült el és még nincsenek lezárt referenciamunkák, **ne szerepeljen kitalált/fiktív cégnév, testimonial vagy statisztika** — ez hiteltelenné tenné az oldalt, ha kiderül. Helyette:
   - Az `index.html` "Legutóbbi munkáink" blokkja és a `portfolio.html` teljes tartalma cserélendő egy **"Hamarosan"** placeholder szekcióra: pl. 1 nagyobb kártya/blokk ezzel a szöveggel: *"Jelenleg dolgozunk az első referenciamunkáinkon — hamarosan itt mutatjuk be őket."*
   - A jelenlegi kitalált cégnevek (pl. étterem/rendelő/stúdió típusú kártyák) és a Kovács Anna-féle testimonial **törlendő vagy egyértelműen jelölendő**, amíg nincs mögötte valós ügyfél.
   - A "40+ élő weboldal / 14 nap / 99,9% üzemidő" típusú statisztika-blokkot is érdemes kivenni vagy átfogalmazni addig, amíg nincs mögötte valós adat (pl. helyette egy egyszerűbb, nem számszerű ígéret: "Gyors indulás, teljes körű támogatás").
   - Alternatíva statisztika helyett: fókuszálni lehet a folyamatra/garanciákra (pl. "14 napos indulási vállalás", "havi karbantartás benne van az árban") — ezek nem igényelnek meglévő ügyfélbázist ahhoz, hogy hitelesek legyenek, mert ezek a *szolgáltatás* jellemzői, nem eredmények.
   - Később, ahogy elkészülnek az első munkák, ez a szekció egyszerűen visszaalakítható valódi portfólió-kártyákra/képernyőképekre.

5. **Csomagok tartalma ellentmond egymásnak index vs. pricing között.**
   - Az `index.html` "Mit tartalmaz" szekció úgy állítja be, mintha *minden* csomagban benne lenne a "Korlátlan szerkesztés" és a "Negyedéves frissítés".
   - A `pricing.html` szerint viszont a **Kezdő csomag csak "Havi 2 kör módosítást"** kap (nem korlátlant), és a **negyedéves dizájn-frissítés csak a Prémium csomagnál** szerepel.
   → Ezt egységesíteni kell: vagy pontosítani kell az index.html "Mit tartalmaz" szekció szövegét (pl. "a csomagtól függően"), vagy a csomagokat kell módosítani, hogy tényleg minden csomagban benne legyen, amit a hero rész ígér.

6. **CTA-szövegek nem konzisztensek.** A nav "Weboldal indítása" és a hero "Ingyenes demo kérése" ugyanarra a `#contact` szekcióra visz, de más-más ígéretet fogalmaz meg (demo vs. azonnali indítás). Érdemes egységesíteni a szóhasználatot, hogy ne keltsen zavart, mire számíthat a látogató kattintás után.

7. **`ajanlatkeres.html` — az űrlap logikája nincs teljesen kidolgozva a kinyert szöveg alapján.**
   Az 1. lépésben lévő "Havi keret weboldalra" választási lehetőségek (20-40e / 40-80e / 80e+ / Még nem tudom) és az "Összegzés" mezők (Vállalkozás típusa / Kért oldalak / Funkciók / Havi keret) között nincs egyértelmű összefüggés a kivont tartalom alapján — érdemes átnézni, hogy az 5 lépéses folyamat helyesen tölti-e fel az összegzést lépésről lépésre.

## 🟡 SEO / technikai

8. **`<title>` tagek túl generikusak.** Pl. "Polarisweb — Prémium weboldal, bérelve" nem tartalmaz kulcsszót. Javaslat: title-ök bővítése kulcsszóval, pl. "Polarisweb — Weboldal bérlés kisvállalkozásoknak Magyarországon".

9. **Nincs FAQPage structured data (schema.org)** a GYIK szekciókhoz (`index.html` és `pricing.html` is tartalmaz GYIK blokkot). Mivel a cég SEO szolgáltatást is árul, ez könnyen implementálható, közvetlen SEO-előny (Google FAQ rich snippet).

10. **GYIK linkek eltérően viselkednek oldalanként.** Az `index.html`-en a nav "GYIK" linkje `#faq`-ra megy (jó, mert ott van a szekció), de a `pricing.html` navigációjában is `#faq` szerepel — ellenőrizni kell, hogy a pricing oldalon tényleg létezik-e `id="faq"` szekció, különben törött horgonylink.

## 🟢 Kisebb finomítások

11. Az árazási kártyáknál (`pricing.html`) jó, hogy checkmarkos lista van — érdemes ugyanezt a 2-3 kulcsfunkciót rövidítve megjeleníteni már az `index.html` árazás-kártyáin is, hogy ne kelljen továbbklikkelni döntéshez.
12. Meta description-ök jók és tömörek, ezt tartani kell az esetlegesen bővülő aloldalaknál is.
