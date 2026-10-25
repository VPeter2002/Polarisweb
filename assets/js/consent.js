/* Polarisweb cookie consent (Google Consent Mode v2 + Meta Pixel)
   Minden mérés alapból tiltott (lásd a head-ben lévő gtag consent default blokkot).
   Ez a fájl kezeli a sávot, és csak a megadott hozzájárulás szerint indítja el:
     - statisztika  -> gtag consent update analytics_storage
     - marketing    -> a Meta Pixel szkript CSAK itt, hozzájárulás után töltődik be
   A sávon egy döntés van (elfogad / csak a szükségesek), de a két hozzájárulás KÜLÖN kulcsban
   tárolódik, ezért a 2026-10-25 előtti, csak statisztikára adott igen NEM jelent marketing-igent:
   azoknál a sáv újra előjön. */
(function () {
  'use strict';

  var KEY_STATS = 'pw-consent';       // 'granted' | 'denied'  (meglévő kulcs, jelentése változatlan)
  var KEY_ADS = 'pw-consent-ads';     // 'granted' | 'denied'
  var META_PIXEL_ID = '1812012276747838';

  var banner = null;
  var pixelLoaded = false;

  function read(key) {
    try { return localStorage.getItem(key); } catch (e) { return null; }
  }

  function write(key, value) {
    try { localStorage.setItem(key, value); } catch (e) {}
  }

  function statsUpdate(value) {
    if (typeof window.gtag === 'function') {
      window.gtag('consent', 'update', { analytics_storage: value });
    }
  }

  /* A Meta Pixel szkriptje addig NEM töltődik be, amíg nincs marketing-hozzájárulás,
     tehát hozzájárulás előtt a connect.facebook.net felé egyetlen kérés sem megy. */
  function loadPixel() {
    if (pixelLoaded) return;
    pixelLoaded = true;
    /* eslint-disable */
    !function (f, b, e, v, n, t, s) {
      if (f.fbq) return; n = f.fbq = function () {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
      };
      if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0';
      n.queue = []; t = b.createElement(e); t.async = !0;
      t.src = v; s = b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t, s);
    }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
    /* eslint-enable */
    window.fbq('init', META_PIXEL_ID);
    window.fbq('track', 'PageView');
  }

  function close() {
    if (!banner) return;
    banner.classList.remove('is-visible');
    var node = banner;
    banner = null;
    setTimeout(function () { if (node && node.parentNode) node.parentNode.removeChild(node); }, 260);
  }

  function decide(stats, ads) {
    write(KEY_STATS, stats ? 'granted' : 'denied');
    write(KEY_ADS, ads ? 'granted' : 'denied');
    statsUpdate(stats ? 'granted' : 'denied');
    if (ads) loadPixel();
    close();
  }

  function build() {
    if (banner) return;
    banner = document.createElement('div');
    banner.className = 'cookie-bar';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-live', 'polite');
    banner.setAttribute('aria-label', 'Sütikre vonatkozó beállítások');
    banner.innerHTML =
      '<div class="cookie-bar-inner">' +
        '<p class="cookie-bar-text">Sütiket használunk. Az oldal működéséhez szükségeseken túl kettőhöz kérünk engedélyt: összesített látogatói statisztika (Google Analytics), valamint a Facebook- és Instagram-hirdetéseink eredményének mérése és hirdetési célközönségek képzése (Meta Pixel). Egyik sem indul el, amíg nem fogadod el. <a href="/adatkezeles">Részletek</a></p>' +
        '<div class="cookie-bar-actions">' +
          '<button type="button" class="btn btn-ghost-dark cookie-decline">Csak a szükségesek</button>' +
          '<button type="button" class="btn btn-white cookie-accept">Elfogadom</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(banner);
    banner.querySelector('.cookie-accept').addEventListener('click', function () { decide(true, true); });
    banner.querySelector('.cookie-decline').addEventListener('click', function () { decide(false, false); });
    requestAnimationFrame(function () { banner.classList.add('is-visible'); });
  }

  function init() {
    Array.prototype.forEach.call(
      document.querySelectorAll('[data-pw-consent-open]'),
      function (el) {
        el.addEventListener('click', function (event) { event.preventDefault(); build(); });
      }
    );

    /* A korábbi döntéseket érvényesítjük újratöltéskor. */
    if (read(KEY_STATS) === 'granted') statsUpdate('granted');
    if (read(KEY_ADS) === 'granted') loadPixel();

    /* A sáv akkor is előjön, ha csak az EGYIK döntés van meg: aki korábban csak a
       statisztikáról döntött, azt a marketingről meg kell kérdezni. */
    if (!read(KEY_STATS) || !read(KEY_ADS)) build();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
