document.addEventListener('DOMContentLoaded', function () {
  var forms = document.querySelectorAll('.contact-form');

  forms.forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var name = form.elements['name'].value.trim();
      var phone = form.elements['phone'].value.trim();
      var service = form.elements['service'].value;
      var message = form.elements['message'].value.trim();

      var subject = 'Ajánlatkérés: ' + service;
      var bodyLines = [
        'Név: ' + (name || '-'),
        'Telefon: ' + (phone || '-'),
        'Szolgáltatás: ' + service,
        '',
        'Üzenet:',
        message || '-'
      ];
      var body = bodyLines.join('\n');

      var mailto = 'mailto:balogh.mark83@gmail.com'
        + '?subject=' + encodeURIComponent(subject)
        + '&body=' + encodeURIComponent(body);

      window.location.href = mailto;
    });
  });
});
