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
