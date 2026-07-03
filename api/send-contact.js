const { escapeHtml, isValidEmail, sendEmail } = require('./_lib/mailer');
const { contactAutoReply } = require('./_lib/templates');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const body = req.body || {};
  const { name, company, email, message, website } = body; // website = honeypot

  if (website) {
    res.status(200).json({ ok: true });
    return;
  }

  if (!name || !String(name).trim() || !email || !String(email).trim()) {
    res.status(400).json({ error: 'Név és e-mail cím megadása kötelező.' });
    return;
  }

  if (!isValidEmail(email)) {
    res.status(400).json({ error: 'Kérjük, adjon meg egy érvényes e-mail címet.' });
    return;
  }

  const html = `
    <h2>Új üzenet a kapcsolati űrlapról — polarisweb</h2>
    <p><strong>Név:</strong> ${escapeHtml(name)}</p>
    <p><strong>Vállalkozás és weboldal:</strong> ${escapeHtml(company || '—')}</p>
    <p><strong>E-mail:</strong> ${escapeHtml(email)}</p>
    <hr>
    <p><strong>Üzenet:</strong><br>${escapeHtml(message || '—').replace(/\n/g, '<br>')}</p>
  `;

  try {
    await sendEmail({
      subject: `Új üzenet — ${name}`,
      html,
      replyTo: email,
    });

    try {
      const autoReply = contactAutoReply({ name });
      await sendEmail({
        to: [email],
        subject: autoReply.subject,
        html: autoReply.html,
        replyTo: 'peter.veszpremi@polarisweb.hu',
      });
    } catch (autoReplyErr) {
      console.error('send-contact auto-reply error:', autoReplyErr);
    }

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('send-contact handler error:', err);
    if (err.code === 'CONFIG_MISSING') {
      res.status(500).json({ error: 'A szerver nincs megfelelően konfigurálva.' });
    } else if (err.code === 'RESEND_FAILED') {
      res.status(502).json({ error: 'Nem sikerült elküldeni az üzenetet. Próbálja újra később.' });
    } else {
      res.status(500).json({ error: 'Váratlan hiba történt.' });
    }
  }
};
