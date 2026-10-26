const dns = require('node:dns').promises;

/**
 * Ingyenes weboldal-ellenorzo a /ellenorzes lap mogott.
 *
 * Ugyanazt meri, amit a belso scripts/jelenlet-audit.py, csak egy domainre:
 * feloldodik-e a DNS, valaszol-e a szerver, van-e HTTPS, mobil viewport,
 * kattinthato telefonszam, urlap, meres, sutibanner, adatkezelesi tajekoztato.
 *
 * KORLATOK, amiket a valasz is kimond:
 * - Csak a szerver altal kiszolgalt HTML-t latjuk. Ha a tartalom bongeszoben
 *   toltodik be, nem pontozunk, hanem jelezzuk hogy kezi ellenorzes kell.
 * - Egy elutasitott keres NEM halott oldal: DNS-sel es bongeszo-azonositoval
 *   kulon ellenorizzuk, kulonben elo oldalt mondanank halottnak.
 *
 * Visszaeles ellen: csak GET/POST egy domainre, 8 masodperces idokorlat,
 * 400 kB-ban levagott valasz, es semmilyen belso halozati cimet nem enged.
 */

const UA = 'PolariswebSiteCheck/1.0 (+https://www.polarisweb.hu/ellenorzes)';
const BROWSER_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
const TIMEOUT_MS = 12000;
const MAX_BYTES = 400_000;

const WEIGHTS = {
  reachable: 18, https: 8, mobile: 14, speed: 12, title: 5, description: 4,
  h1: 3, phone: 9, contact_form: 6, booking: 5, measurement: 6, consent: 4,
  privacy: 3, social: 3,
};

const LABELS = {
  https: 'Nincs HTTPS, a böngésző nem biztonságosnak jelöli',
  mobile: 'Mobilon nem jól jelenik meg, nincs viewport beállítás',
  title: 'Nincs oldalcím, a Google találatban üresen látszik',
  description: 'Nincs leírás, a Google maga vág ki egy mondatot',
  h1: 'Nincs főcím az oldalon',
  phone: 'A megnyitott oldalon nincs egy koppintással hívható telefonszám',
  contact_form: 'A megnyitott oldalon nincs kapcsolati űrlap',
  booking: 'A megnyitott oldalon nem lehet foglalni vagy időpontot kérni',
  measurement: 'Nincs mérés, nem derül ki honnan jönnek a látogatók',
  consent: 'A kiszolgált HTML-ben nincs sütibanner',
  privacy: 'Nincs adatkezelési tájékoztató',
  social: 'A megnyitott oldalon nincs kikötve közösségi oldal',
  slow: 'Lassan jelenik meg',
};

/* Amit NEM tudunk eldonteni a kiszolgalt HTML-bol. Ezek NEM hianyok: egy hamis
   "nincs sutibannere" mondat egy olyan cegnek, akinek van, elveszi a tobbi, igaz
   allitas hitelet is. Inkabb mondjuk meg, hogy kezzel kell megnezni. */
const UNKNOWN_LABELS = {
  consent: 'Sütibanner: ezt nem tudtuk eldönteni. A kiszolgált HTML-ben nincs, de az oldal futásidőben tölt be szkripteket (például Tag Managert), és a legtöbb sütibanner pontosan így jelenik meg. Böngészőben érdemes megnézni.',
  contact_form: 'Kapcsolati űrlap: ezt nem tudtuk eldönteni. Nincs form elem a HTML-ben, de vannak kitölthető mezők, tehát az űrlapot JavaScript is építheti.',
};

const OK_LABELS = {
  https: 'HTTPS rendben',
  mobile: 'Mobilra felkészítve',
  title: 'Van oldalcím',
  description: 'Van meta leírás',
  h1: 'Van főcím',
  phone: 'A telefonszám egy koppintással hívható',
  contact_form: 'Van kapcsolati űrlap',
  booking: 'Lehet foglalni vagy időpontot kérni',
  measurement: 'Van látogatottság-mérés',
  consent: 'Van sütibanner',
  privacy: 'Van adatkezelési tájékoztató',
  social: 'Közösségi oldal kikötve',
};

function normalizeHost(input) {
  let s = String(input || '').trim().toLowerCase();
  s = s.replace(/^https?:\/\//, '').replace(/\/.*$/, '').replace(/:\d+$/, '');
  if (!/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(s)) return null;
  if (s.endsWith('.local') || s === 'localhost') return null;
  return s;
}

function isPrivateAddr(addr) {
  if (addr.includes(':')) return addr === '::1' || addr.startsWith('fc') || addr.startsWith('fd') || addr.startsWith('fe80');
  const p = addr.split('.').map(Number);
  if (p[0] === 10 || p[0] === 127 || p[0] === 0) return true;
  if (p[0] === 192 && p[1] === 168) return true;
  if (p[0] === 172 && p[1] >= 16 && p[1] <= 31) return true;
  if (p[0] === 169 && p[1] === 254) return true;
  return false;
}

async function fetchPage(url, ua) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  const started = Date.now();
  try {
    const res = await fetch(url, {
      redirect: 'follow',
      signal: ctrl.signal,
      headers: { 'User-Agent': ua, Accept: 'text/html,application/xhtml+xml', 'Accept-Language': 'hu,en;q=0.7' },
    });
    const buf = await res.arrayBuffer();
    const html = Buffer.from(buf.slice(0, MAX_BYTES)).toString('utf8');
    return { status: res.status, finalUrl: res.url, html, elapsed: (Date.now() - started) / 1000 };
  } catch (e) {
    return { status: null, finalUrl: url, html: '', elapsed: (Date.now() - started) / 1000, err: e.name };
  } finally {
    clearTimeout(t);
  }
}

/* A <title> gyakran HTML-entitast tartalmaz (&#8211;, &amp;, &nbsp;). A lap a
   kiirasnal escapeli az &-t, ezert az entitas NYERSEN latszana a felhasznalonak
   ("MayFly Fitness fooldal &#8211; Mayfly Fitness"). Itt oldjuk fel, egyszer. */
function decodeEntities(str) {
  return str
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&nbsp;/gi, ' ')
    .replace(/&ndash;/gi, '\u2013')
    .replace(/&mdash;/gi, '\u2014')
    .replace(/&quot;/gi, '"')
    .replace(/&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&amp;/gi, '&');
}

function inspect(html) {
  const low = html.toLowerCase();
  const headEnd = low.indexOf('</head>');
  const head = headEnd > 0 ? low.slice(0, headEnd + 7) : low.slice(0, 20000);
  const has = (...pats) => pats.some((p) => new RegExp(p).test(low));
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const text = html
    .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return {
    mobile: /<meta[^>]+name=["']?viewport/.test(head),
    title: titleMatch ? decodeEntities(titleMatch[1]).replace(/\s+/g, ' ').trim().slice(0, 120) : '',
    description: /<meta[^>]+name=["']?description["']?[^>]+content=["'][^"']{10,}/i.test(html),
    h1: /<h1[\s>]/.test(low),
    phone: has('href=["\']tel:'),
    contact_form: has('<form[\\s>]'),
    form_fields: (low.match(/<(input|textarea|select)[\s>]/g) || []).length,
    booking: has('foglal', 'booking', 'reserv', 'idopontker', 'időpontkér', 'calendly\\.com', 'simplybook', 'booksy', 'salonic'),
    measurement: has('googletagmanager\\.com', 'google-analytics\\.com', 'gtag\\(', 'connect\\.facebook\\.net', 'fbq\\(', 'matomo', 'plausible\\.io', 'hotjar', 'clarity\\.ms'),
    /* Ismert sutibanner-megoldasok nyomai a kiszolgalt HTML-ben. A lista bovitese
       a hamis negativot szukiti, de nem szunteti meg: lasd consent_injector. */
    consent: has('cookie[- ]?consent', 'cookiebot', 'cookieyes', 'cookie-?law-?info', 'cky-',
      'complianz', 'cmplz', 'borlabs', 'moove_gdpr', 'iubenda', 'onetrust', 'termly',
      'usercentrics', 'cookiefirst', 'klaro', 'osano', 'cookie-?notice', 'gdpr-?cookie',
      'sütiket', 'sutiket', 'cookie-?bar', "'consent'", '"consent"'),
    /* Ami futasidoben BARMIT betolthet, tehat a bannert is. A wp-consent-api maga
       csak egy hid a pluginok kozott, nem mutat savot, de a jelenlete azt jelzi,
       hogy az oldal foglalkozik a hozzajarulassal. */
    consent_injector: has('googletagmanager\\.com', 'gtm\\.js', 'gtag\\(',
      'wp-consent-api', 'consent_api', 'cdn\\.segment\\.com'),
    privacy: has('adatkezel', 'adatvédelm', 'privacy', 'gdpr'),
    social: has('facebook\\.com/(?!tr|plugins)', 'instagram\\.com/', 'linkedin\\.com/(in|company)/', 'tiktok\\.com/@'),
    visibleChars: text.length,
    shell: /<div[^>]+id=["']?(root|app|__next|__nuxt)["']?/.test(low),
  };
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST' && req.method !== 'GET') {
    res.status(405).json({ error: 'Csak GET vagy POST.' });
    return;
  }
  const raw = req.method === 'POST' ? (req.body && req.body.domain) : (req.query && req.query.domain);
  const host = normalizeHost(raw);
  if (!host) {
    res.status(400).json({ error: 'Adjon meg egy érvényes domaint, például: pelda.hu' });
    return;
  }

  // 1) DNS. Ha nem oldodik fel, az oldal megszunt, es ezt biztosan tudjuk.
  let addrs = [];
  try {
    addrs = await dns.lookup(host, { all: true });
  } catch {
    res.status(200).json({
      domain: host, state: 'dns_gone', score: null,
      headline: 'Ez a domain már nem működik',
      detail: 'A böngésző nem is talál szervert ezen a címen, tehát aki rákeres a cégre és erre a címre jut, üres kézzel távozik. A katalógusok és a kereső viszont gyakran még évekig hirdetik a régi címet.',
      gaps: [], oks: [], unknowns: [], limits: [],
    });
    return;
  }
  if (addrs.some((a) => isPrivateAddr(a.address))) {
    res.status(400).json({ error: 'Ez a cím nem vizsgálható.' });
    return;
  }

  // 2) Letoltes. Vegigprobaljuk az ertelmes valtozatokat, mert egy oldal gyakran
  // csak www-vel szolgal ki, es sok szerver az automatikus kereseket szuri.
  // FONTOS: ha DNS feloldodik, de mi nem jutunk be, azt NEM allitjuk halottnak.
  // Egy elo oldalrol azt mondani hogy nem mukodik, a legrosszabb hiba, amit ez
  // az eszkoz elkovethet. Ilyenkor azt mondjuk: mi nem tudtuk lemerni.
  const bare = host.replace(/^www\./, '');
  const candidates = [
    ['https://' + host + '/', UA],
    ['https://' + host + '/', BROWSER_UA],
    ['http://' + host + '/', BROWSER_UA],
  ];
  if (!host.startsWith('www.')) {
    candidates.push(['https://www.' + bare + '/', BROWSER_UA]);
  }
  let page = null;
  let lastStatus = null;
  let usedBrowserUa = false;
  for (const [url, ua] of candidates) {
    const r = await fetchPage(url, ua);
    if (r.status) lastStatus = r.status;
    if (r.status && r.status < 400 && r.html) {
      page = r;
      usedBrowserUa = ua === BROWSER_UA;
      break;
    }
  }
  const blocksRobots = usedBrowserUa;
  if (!page) {
    // A hibakodot ERTELMEZZUK, mert nem mindegyik jelent hibas oldalt.
    // 403 / 406 / 429 / 451: a szerver a MI kereset utasitotta el, az oldal
    // bongeszobol jo eseggel hibatlanul mukodik. Ezt nem szabad ugy irni,
    // mintha a cég oldala lenne rossz.
    const blocked = [401, 403, 406, 409, 429, 451].includes(lastStatus);
    const missing = [404, 410].includes(lastStatus);
    const serverErr = lastStatus >= 500;
    let state = 'fetch_failed';
    let headline = 'Ezt az oldalt nem tudtuk lemérni';
    let detail = 'A domain létezik, tehát nem szűnt meg, de a mérésünk nem jutott be. Nyissa meg böngészőben: ha ott működik, akkor az oldallal nincs baj, csak mi nem láttuk.';
    if (blocked) {
      state = 'blocked';
      headline = 'Az oldal a mérésünket elutasította';
      detail = 'A szerver ' + lastStatus + '-es kóddal visszautasította a kérésünket. Ez jellemzően védelem az automatikus látogatók ellen, tehát az oldal böngészőből nagy valószínűséggel hibátlanul működik. Erről az oldalról ezért nem állítunk semmit.';
    } else if (missing) {
      state = 'http_error';
      headline = 'A megadott címen nincs oldal';
      detail = 'A domain működik, de a kiszolgáló ' + lastStatus + '-es kóddal válaszolt, vagyis ezen a címen nem talált tartalmat. Aki ide jut a keresőből, hibaüzenetet lát a weboldal helyett.';
    } else if (serverErr) {
      state = 'http_error';
      headline = 'A kiszolgáló hibát ad';
      detail = 'A domain működik, de a szerver ' + lastStatus + '-es hibával válaszolt. Ha ez nem pillanatnyi zavar, akkor az érdeklődői is hibaüzenetet látnak.';
    }
    res.status(200).json({
      domain: host, state, score: null, headline, detail,
      gaps: [], oks: [], unknowns: [],
      limits: ['Erről az oldalról szándékosan nem állítunk semmit, mert nem tudtuk megvizsgálni.'],
    });
    return;
  }

  const f = inspect(page.html);
  const jsRendered = f.visibleChars < 400 && (f.shell || !f.h1);
  if (jsRendered) {
    res.status(200).json({
      domain: host, state: 'js_rendered', score: null,
      headline: 'Ezt az oldalt gépileg nem tudtuk kiértékelni',
      detail: 'A tartalom a böngészőben töltődik be, ezért a szerver alig ad ki szöveget. Nem állítunk róla semmit: ezt kézzel kell megnézni.',
      gaps: [], oks: [], unknowns: [], limits: ['A mérés a szerver által kiszolgált HTML-t vizsgálja.'],
    });
    return;
  }

  const https = (page.finalUrl || '').startsWith('https://');
  let score = WEIGHTS.reachable;
  const gaps = [];
  const oks = [];
  const unknowns = [];

  /* HAROM allapot, nem ketto. A 'null' azt jelenti: nem tudtuk eldonteni.
     Ilyenkor NEM irunk hianyt (az lenne a draga hiba, mert ez a szoveg idegen
     ceghez is eljut), es a tetelt KIVESSZUK A PONTOZASBOL is: sem levonas, sem
     jovairas. A sulyok osszege pontosan 100, ezert eleg a nevezobol kivonni az
     eldonthetetlen tetelek sulyat, es a vegen visszaskalazni 100-ra. Igy a pont
     azt meri, amit tenylegesen megneztunk. A tenyallas az unknowns listaba kerul. */
  const formOk = f.contact_form || f.form_fields >= 3;
  const checks = { https, mobile: f.mobile, title: !!f.title, description: f.description, h1: f.h1,
    phone: f.phone,
    /* CSAK akkor eldonthetetlen, ha TENYLEGESEN latunk kitoltheto mezot. A
       futasideju betolto (GTM) jelenlete onmagaban NEM eleg: ha nulla mezo van,
       az "eldonthetetlen" szoveg szo szerint azt allitana, hogy "vannak
       kitoltheto mezok", vagyis olyan tenyt mondana ki, amit nem lattunk.
       Merve 2026-10-26: a mayflyfitness.hu fooldalan 0 input/select/textarea
       van es GTM igen, es az eszkoz pontosan ezt a hamis mondatot adta ki,
       plusz 90 pontot 84 helyett. */
    contact_form: formOk ? true : (f.form_fields > 0 ? null : false),
    booking: f.booking, measurement: f.measurement,
    consent: f.consent ? true : (f.consent_injector ? null : false),
    privacy: f.privacy, social: f.social };
  let maxScore = 100;
  for (const [key, ok] of Object.entries(checks)) {
    if (ok === true) { score += WEIGHTS[key]; oks.push(OK_LABELS[key]); }
    else if (ok === null) { maxScore -= WEIGHTS[key]; unknowns.push(UNKNOWN_LABELS[key]); }
    else gaps.push(LABELS[key]);
  }
  const sec = page.elapsed;
  if (sec <= 1.5) score += WEIGHTS.speed;
  else if (sec <= 3) score += Math.round(WEIGHTS.speed * 0.6);
  else if (sec <= 5) score += Math.round(WEIGHTS.speed * 0.25);
  else gaps.push(LABELS.slow + ' (' + sec.toFixed(1).replace('.', ',') + ' másodperc)');
  score = Math.min(100, Math.round((score / maxScore) * 100));

  const limits = ['A mérés a szerver által kiszolgált HTML-t vizsgálja, a JavaScriptből betöltő tartalmat nem látja.'];
  if (unknowns.length) limits.push('A pontszám csak abból számol, amit géppel el lehetett dönteni; az eldönthetetlen tételek sem pontot nem adnak, sem nem vonnak le.');
  if (blocksRobots) limits.push('Az oldal a mérésünket tiltja, ezért böngésző-azonosítóval kértük le. Egyes eredmények ezért pontatlanok lehetnek.');

  res.status(200).json({
    domain: host, state: 'measured', score,
    headline: score >= 85 ? 'Ez az oldal alapvetően rendben van' : score >= 70 ? 'Működik, de van mit behozni' : 'Több fontos dolog hiányzik',
    detail: 'A mérés ' + sec.toFixed(1).replace('.', ',') + ' másodperc alatt futott le, és '
      + (gaps.length ? gaps.length + ' hiányt talált' : 'nem talált hiányt')
      + (unknowns.length ? ', ' + unknowns.length + ' dolgot pedig gépileg nem lehetett eldönteni.' : '.'),
    title: f.title, elapsed: Number(sec.toFixed(2)),
    gaps, oks, unknowns, limits,
  });
};
