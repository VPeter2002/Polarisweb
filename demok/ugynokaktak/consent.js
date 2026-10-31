/* Suti-hozzajarulas (Google Consent Mode v2).
   A lap EGYETLEN sutitipust hasznal: analitika (GA4). Technikai suti nincs,
   mert nincs mogotte szerver, bejelentkezes vagy kosar.

   A dontes localStorage-ban el, lap-sajat kulccsal: a demo a polarisweb.hu
   origin alatt fut, ahol a fo oldal a `pw-consent` kulcsot hasznalja, es a
   kettonek nem szabad osszekeverednie. (2026-10-31.) */
(function () {
  'use strict';
  var KULCS = 'ua-consent';

  function olvas() {
    try { return localStorage.getItem(KULCS); } catch (e) { return null; }
  }
  function ir(ertek) {
    try { localStorage.setItem(KULCS, ertek); } catch (e) { /* privat ablak: nem baj */ }
  }
  function gtagBiztos() {
    return (typeof window.gtag === 'function') ? window.gtag : function () {
      (window.dataLayer = window.dataLayer || []).push(arguments);
    };
  }
  function frissit(engedve) {
    gtagBiztos()('consent', 'update', { analytics_storage: engedve ? 'granted' : 'denied' });
  }

  var sav = null;

  function elrejt() {
    if (sav) { sav.setAttribute('hidden', ''); }
  }

  function dont(engedve) {
    ir(engedve ? 'granted' : 'denied');
    frissit(engedve);
    elrejt();
  }

  function epit() {
    if (sav) { sav.removeAttribute('hidden'); return; }
    sav = document.createElement('div');
    sav.className = 'cookie-bar';
    sav.setAttribute('role', 'dialog');
    sav.setAttribute('aria-label', 'Sütik');
    sav.innerHTML =
      '<div class="cookie-in">' +
      '<p class="cookie-txt">Az Ügynökakták oldal sütiket és más technológiákat használ ' +
      'látogatói statisztikához. Csak az elfogadás után indulnak el. ' +
      '<a href="adatkezeles.html">Süti-tájékoztató</a></p>' +
      '<div class="cookie-btns">' +
      '<button type="button" class="btn btn-s btn-ghost" data-ua-consent="no">Csak a szükségesek</button>' +
      '<button type="button" class="btn btn-s" data-ua-consent="yes">Elfogadom</button>' +
      '</div></div>';
    document.body.appendChild(sav);
    sav.addEventListener('click', function (e) {
      var b = e.target.closest ? e.target.closest('[data-ua-consent]') : null;
      if (!b) { return; }
      dont(b.getAttribute('data-ua-consent') === 'yes');
    });
  }

  function indul() {
    var mentett = olvas();
    if (mentett === 'granted') { frissit(true); }
    else if (mentett === 'denied') { frissit(false); }
    else { epit(); }

    // A visszavonas/ujragondolas utja: barmely ilyen elem ujra elohozza a savot.
    var nyitok = document.querySelectorAll('[data-ua-consent-open]');
    for (var i = 0; i < nyitok.length; i++) {
      nyitok[i].addEventListener('click', function (e) {
        e.preventDefault();
        epit();
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', indul);
  } else {
    indul();
  }
})();
