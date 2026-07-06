const { escapeHtml, isValidEmail, sendEmail } = require('./_lib/mailer');
const { quoteAutoReply } = require('./_lib/templates');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const body = req.body || {};
  const {
    name, company, email, phone, message,
    businessType, pages, features, hasSite, budget,
    style, audience, brandColor, reference, // optional visual preferences
    website, // honeypot — real users never fill this
  } = body;

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

  const pagesText = Array.isArray(pages) && pages.length ? pages.join(', ') : '—';
  const featuresText = Array.isArray(features) && features.length ? features.join(', ') : '—';
  const styleText = Array.isArray(style) && style.length ? style.join(', ') : '—';

  const html = `
    <h2>Új ajánlatkérés — Polarisweb</h2>
    <p><strong>Név:</strong> ${escapeHtml(name)}</p>
    <p><strong>Vállalkozás:</strong> ${escapeHtml(company || '—')}</p>
    <p><strong>E-mail:</strong> ${escapeHtml(email)}</p>
    <p><strong>Telefon:</strong> ${escapeHtml(phone || '—')}</p>
    <hr>
    <p><strong>Vállalkozás típusa:</strong> ${escapeHtml(businessType || '—')}</p>
    <p><strong>Kért oldalak:</strong> ${escapeHtml(pagesText)}</p>
    <p><strong>Funkciók:</strong> ${escapeHtml(featuresText)}</p>
    <p><strong>Van már weboldala:</strong> ${escapeHtml(hasSite || '—')}</p>
    <p><strong>Havi keret:</strong> ${escapeHtml(budget || '—')}</p>
    <hr>
    <h3>Vizuális preferenciák</h3>
    <p><strong>Stílus:</strong> ${escapeHtml(styleText)}</p>
    <p><strong>Célközönség:</strong> ${escapeHtml(audience || '—')}</p>
    <p><strong>Márkaszín:</strong> ${escapeHtml(brandColor || '—')}</p>
    <p><strong>Referencia:</strong> ${escapeHtml(reference || '—')}</p>
    <hr>
    <p><strong>Megjegyzés:</strong><br>${escapeHtml(message || '—').replace(/\n/g, '<br>')}</p>
  `;

  try {
    await sendEmail({
      subject: `Új ajánlatkérés — ${name}`,
      html,
      replyTo: email,
    });

    try {
      const autoReply = quoteAutoReply({ name });
      await sendEmail({
        to: [email],
        subject: autoReply.subject,
        html: autoReply.html,
        replyTo: 'peter.veszpremi@polarisweb.hu',
      });
    } catch (autoReplyErr) {
      console.error('send-quote auto-reply error:', autoReplyErr);
    }

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('send-quote handler error:', err);
    if (err.code === 'CONFIG_MISSING') {
      res.status(500).json({ error: 'A szerver nincs megfelelően konfigurálva.' });
    } else if (err.code === 'RESEND_FAILED') {
      res.status(502).json({ error: 'Nem sikerült elküldeni az üzenetet. Próbálja újra később.' });
    } else {
      res.status(500).json({ error: 'Váratlan hiba történt.' });
    }
  }
};
