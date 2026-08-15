document.addEventListener('DOMContentLoaded', function () {
  var CLIENT = 'balogh-mark-villany';
  var ENDPOINT = 'https://www.polarisweb.hu/api/send-client-lead';

  var forms = document.querySelectorAll('.contact-form');

  forms.forEach(function (form) {
    var btn = form.querySelector('button[type="submit"]');
    var btnText = btn ? btn.textContent : '';
    var note = document.createElement('p');
    note.className = 'form-note';
    note.setAttribute('role', 'status');
    note.hidden = true;
    if (btn && btn.parentNode) btn.parentNode.appendChild(note);

    function say(text, kind) {
      note.textContent = text;
      note.className = 'form-note ' + (kind || '');
      note.hidden = false;
    }

    /* Ha a kuldes barmiert nem megy (halozat, lejart API-kulcs, kikapcsolt
       funkcio), a beirt szoveg NE vesszen el: megnyitjuk a levelezot ugyanazzal
       a tartalommal. Ez volt az eredeti viselkedes, most tartalek szerepben. */
    function mailtoFallback(data) {
      var body = [
        'Név: ' + (data.name || '-'),
        'Telefon: ' + (data.phone || '-'),
        'E-mail: ' + (data.email || '-'),
        'Szolgáltatás: ' + data.service,
        '',
        'Üzenet:',
        data.message || '-'
      ].join('\n');
      window.location.href = 'mailto:balogh.mark83@gmail.com'
        + '?subject=' + encodeURIComponent('Ajánlatkérés: ' + data.service)
        + '&body=' + encodeURIComponent(body);
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var data = {
        client: CLIENT,
        name: form.elements['name'].value.trim(),
        phone: form.elements['phone'].value.trim(),
        service: form.elements['service'].value,
        message: form.elements['message'].value.trim()
      };

      /* Az email opcionalis: csak akkor kuldjuk, ha ki van toltve. Ures stringet
         nem kuldunk, mert a szerver azt hibas cimnek venne. */
      var emailEl = form.elements['email'];
      var emailVal = emailEl ? emailEl.value.trim() : '';
      if (emailVal) data.email = emailVal;

      if (!data.name) { say('Kérem, adja meg a nevét.', 'is-error'); return; }
      if (!data.phone) { say('Kérem, adjon meg egy telefonszámot, hogy vissza tudjak jelezni.', 'is-error'); return; }
      if (emailVal && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) {
        say('Az e-mail cím nem tűnik érvényesnek. Javítsa, vagy hagyja üresen.', 'is-error');
        return;
      }

      if (btn) { btn.disabled = true; btn.textContent = 'Küldés...'; }
      say('Küldés folyamatban...', '');

      fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
        .then(function (res) { return res.json().then(function (j) { return { ok: res.ok, body: j }; }); })
        .then(function (r) {
          if (!r.ok) throw new Error((r.body && r.body.error) || 'send failed');
          form.reset();
          say('Köszönöm, megkaptam. Hamarosan visszajelzek.', 'is-ok');
        })
        .catch(function (err) {
          console.error('lead submit failed:', err);
          say('A küldés most nem sikerült, ezért megnyitom a levelezőjét a beírt szöveggel.', 'is-error');
          mailtoFallback(data);
        })
        .finally(function () {
          if (btn) { btn.disabled = false; btn.textContent = btnText; }
        });
    });
  });
});
