const RESEND_ENDPOINT = 'https://api.resend.com/emails';

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const body = req.body || {};
  const {
    name, company, email, phone, message,
    businessType, pages, features, hasSite, budget,
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

  const apiKey = process.env.RESEND_API_KEY;
  const toEmail = process.env.TO_EMAIL;
  if (!apiKey || !toEmail) {
    console.error('Missing RESEND_API_KEY or TO_EMAIL environment variable');
    res.status(500).json({ error: 'A szerver nincs megfelelően konfigurálva.' });
    return;
  }

  const pagesText = Array.isArray(pages) && pages.length ? pages.join(', ') : '—';
  const featuresText = Array.isArray(features) && features.length ? features.join(', ') : '—';

  const html = `
    <h2>Új ajánlatkérés — polarisweb</h2>
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
    <p><strong>Megjegyzés:</strong><br>${escapeHtml(message || '—').replace(/\n/g, '<br>')}</p>
  `;

  try {
    const resendRes = await fetch(RESEND_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'polarisweb <onboarding@resend.dev>',
        to: [toEmail],
        reply_to: email,
        subject: `Új ajánlatkérés — ${name}`,
        html,
      }),
    });

    if (!resendRes.ok) {
      const errText = await resendRes.text();
      console.error('Resend error:', resendRes.status, errText);
      res.status(502).json({ error: 'Nem sikerült elküldeni az üzenetet. Próbálja újra később.' });
      return;
    }

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('send-quote handler error:', err);
    res.status(500).json({ error: 'Váratlan hiba történt.' });
  }
};
