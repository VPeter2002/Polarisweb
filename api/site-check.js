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
const TIMEOUT_MS = 8000;
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
  phone: 'A telefonszám nem hívható egy koppintással',
  contact_form: 'Nincs kapcsolati űrlap',
  booking: 'Nem lehet foglalni vagy időpontot kérni',
  measurement: 'Nincs mérés, nem derül ki honnan jönnek a látogatók',
  consent: 'Nincs sütibanner',
  privacy: 'Nincs adatkezelési tájékoztató',
  social: 'Nincs kikötve közösségi oldal',
  slow: 'Lassan jelenik meg',
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
    title: titleMatch ? titleMatch[1].replace(/\s+/g, ' ').trim().slice(0, 120) : '',
    description: /<meta[^>]+name=["']?description["']?[^>]+content=["'][^"']{10,}/i.test(html),
    h1: /<h1[\s>]/.test(low),
    phone: has('href=["\']tel:'),
    contact_form: has('<form[\\s>]'),
    booking: has('foglal', 'booking', 'reserv', 'idopontker', 'időpontkér', 'calendly\\.com', 'simplybook', 'booksy', 'salonic'),
    measurement: has('googletagmanager\\.com', 'google-analytics\\.com', 'gtag\\(', 'connect\\.facebook\\.net', 'fbq\\(', 'matomo', 'plausible\\.io', 'hotjar', 'clarity\\.ms'),
    consent: has('cookie[- ]?consent', 'cookiebot', 'cookieyes', 'sütiket', 'sutiket', 'cookie-?bar', "'consent'", '"consent"'),
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
      gaps: [], oks: [], limits: [],
    });
    return;
  }
  if (addrs.some((a) => isPrivateAddr(a.address))) {
    res.status(400).json({ error: 'Ez a cím nem vizsgálható.' });
    return;
  }

  // 2) Letoltes. Eloszor sajat azonositoval, aztan bongeszo-azonositoval.
  let page = await fetchPage('https://' + host + '/', UA);
  let httpsOk = page.status !== null;
  if (!httpsOk) page = await fetchPage('http://' + host + '/', UA);
  let blocksRobots = false;
  if (!(page.status && page.status < 400 && page.html)) {
    const retry = await fetchPage((httpsOk ? 'https://' : 'http://') + host + '/', BROWSER_UA);
    if (retry.status && retry.status < 400 && retry.html) {
      blocksRobots = true;
      page = retry;
    } else {
      res.status(200).json({
        domain: host, state: 'unreachable', score: null,
        headline: 'A domain létezik, de az oldal nem válaszol',
        detail: 'A szerver nem adott ki tartalmat' + (retry.status ? ' (' + retry.status + '-es hibakód)' : '') + '. Aki most keresi Önt, hibaüzenetet lát a weboldala helyén.',
        gaps: [], oks: [], limits: [],
      });
      return;
    }
  }

  const f = inspect(page.html);
  const jsRendered = f.visibleChars < 400 && (f.shell || !f.h1);
  if (jsRendered) {
    res.status(200).json({
      domain: host, state: 'js_rendered', score: null,
      headline: 'Ezt az oldalt gépileg nem tudtuk kiértékelni',
      detail: 'A tartalom a böngészőben töltődik be, ezért a szerver alig ad ki szöveget. Nem állítunk róla semmit: ezt kézzel kell megnézni.',
      gaps: [], oks: [], limits: ['A mérés a szerver által kiszolgált HTML-t vizsgálja.'],
    });
    return;
  }

  const https = (page.finalUrl || '').startsWith('https://');
  let score = WEIGHTS.reachable;
  const gaps = [];
  const oks = [];
  const checks = { https, mobile: f.mobile, title: !!f.title, description: f.description, h1: f.h1,
    phone: f.phone, contact_form: f.contact_form, booking: f.booking, measurement: f.measurement,
    consent: f.consent, privacy: f.privacy, social: f.social };
  for (const [key, ok] of Object.entries(checks)) {
    if (ok) { score += WEIGHTS[key]; oks.push(OK_LABELS[key]); }
    else gaps.push(LABELS[key]);
  }
  const sec = page.elapsed;
  if (sec <= 1.5) score += WEIGHTS.speed;
  else if (sec <= 3) score += Math.round(WEIGHTS.speed * 0.6);
  else if (sec <= 5) score += Math.round(WEIGHTS.speed * 0.25);
  else gaps.push(LABELS.slow + ' (' + sec.toFixed(1).replace('.', ',') + ' másodperc)');
  score = Math.min(100, score);

  const limits = ['A mérés a szerver által kiszolgált HTML-t vizsgálja, a JavaScriptből betöltő tartalmat nem látja.'];
  if (blocksRobots) limits.push('Az oldal a mérésünket tiltja, ezért böngésző-azonosítóval kértük le. Egyes eredmények ezért pontatlanok lehetnek.');

  res.status(200).json({
    domain: host, state: 'measured', score,
    headline: score >= 85 ? 'Ez az oldal alapvetően rendben van' : score >= 70 ? 'Működik, de van mit behozni' : 'Több fontos dolog hiányzik',
    detail: 'A mérés ' + sec.toFixed(1).replace('.', ',') + ' másodperc alatt futott le, és ' + (gaps.length ? gaps.length + ' hiányt talált.' : 'nem talált hiányt.'),
    title: f.title, elapsed: Number(sec.toFixed(2)),
    gaps, oks, limits,
  });
};
