/* Polarisweb cookie consent (Google Consent Mode v2)
   A merés alapból tiltott (lásd a head-ben lévő gtag consent default blokkot).
   Ez a fájl csak a sávot kezeli és elfogadáskor engedélyezi az analytics_storage-t. */
(function () {
  'use strict';

  var KEY = 'pw-consent';
  var banner = null;

  function read() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }

  function write(value) {
    try { localStorage.setItem(KEY, value); } catch (e) {}
  }

  function grant() {
    if (typeof window.gtag === 'function') {
      window.gtag('consent', 'update', { analytics_storage: 'granted' });
    }
  }

  function deny() {
    if (typeof window.gtag === 'function') {
      window.gtag('consent', 'update', { analytics_storage: 'denied' });
    }
  }

  function close() {
    if (!banner) return;
    banner.classList.remove('is-visible');
    var node = banner;
    banner = null;
    setTimeout(function () { if (node && node.parentNode) node.parentNode.removeChild(node); }, 260);
  }

  function decide(value) {
    write(value);
    if (value === 'granted') grant(); else deny();
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
        '<p class="cookie-bar-text">Sütiket használunk. Az oldal működéséhez szükségeseken túl anonim látogatói statisztikát is gyűjtenénk (Google Analytics), hogy lássuk, mi érdekli a látogatókat. Ez csak akkor indul el, ha elfogadod. <a href="/adatkezeles">Részletek</a></p>' +
        '<div class="cookie-bar-actions">' +
          '<button type="button" class="btn btn-ghost-dark cookie-decline">Csak a szükségesek</button>' +
          '<button type="button" class="btn btn-white cookie-accept">Elfogadom</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(banner);
    banner.querySelector('.cookie-accept').addEventListener('click', function () { decide('granted'); });
    banner.querySelector('.cookie-decline').addEventListener('click', function () { decide('denied'); });
    requestAnimationFrame(function () { banner.classList.add('is-visible'); });
  }

  function init() {
    Array.prototype.forEach.call(
      document.querySelectorAll('[data-pw-consent-open]'),
      function (el) {
        el.addEventListener('click', function (event) { event.preventDefault(); build(); });
      }
    );
    if (!read()) build();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
