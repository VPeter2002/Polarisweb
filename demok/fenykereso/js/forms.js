document.addEventListener('DOMContentLoaded', function () {
  var forms = document.querySelectorAll('form[data-mailto], form[data-form]');

  // TODO (Resend bekotes kesobb): ez az EGYETLEN hely, ahol a valos kuldest be kell kotni.
  // Amikor kesz a Vercel serverless function (/api/fenykereso-contact) + RESEND_API_KEY env,
  // itt cserelheto a stub egy fetch('/api/fenykereso-contact', {method:'POST', body: JSON.stringify(payload)})-ra.
  function sendForm(payload) {
    // Demo-fazis: nincs valos kuldes, csak sikeres visszajelzest szimulalunk.
    return Promise.resolve({ ok: true });
  }

  forms.forEach(function (form) {
    var status = document.createElement('p');
    status.className = 'form-message';
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    status.hidden = true;
    form.appendChild(status);

    var successText = form.dataset.success ||
      'Koszonjuk a megkeresest. Hamarosan jelentkezunk.';

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      var payload = {};
      Array.prototype.forEach.call(form.elements, function (el) {
        if (!el.name || el.type === 'submit') return;
        payload[el.name] = el.value.trim();
      });

      sendForm(payload).then(function () {
        status.textContent = successText;
        status.classList.remove('error');
        status.classList.add('success');
        status.hidden = false;
        form.reset();
      });
    });
  });
});
