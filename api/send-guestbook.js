const { escapeHtml, sendEmail } = require('./_lib/mailer');

/**
 * Szulinapi oldal vendegkonyv -> email a cimzettnek.
 *
 * Ugyanaz a biztonsagi elv, mint a send-client-lead-nel: a cimzettet KIZAROLAG
 * ez a szerveroldali tabla dontheti el, a bongeszo csak egy kulcsot kuld. Igy a
 * vegpont nem valhat nyilt spam-tovabbitova a hitelesitett polarisweb.hu domainen.
 *
 * 'misi'   -> a valos cimzett (a szulinapos).
 * '_teszt' -> a sajat cimunk, hogy a lancot ellenorizni lehessen anelkul, hogy a
 *             szulinaposhoz teszt-level menne.
 */
const RECIPIENTS = {
  misi: { to: 'arboczm@gmail.com', label: 'Misi' },
  _teszt: { to: 'Peter.veszpremi@polarisweb.hu', label: 'Teszt' },
};

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Max-Age', '86400');

  if (req.method === 'OPTIONS') { res.status(204).end(); return; }
  if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return; }

  const body = req.body || {};
  const { key, name, message, website } = body;

  // Honeypot: valodi latogato sosem tolti ki.
  if (website) { res.status(200).json({ ok: true }); return; }

  const cfg = RECIPIENTS[String(key || '').trim()];
  if (!cfg) { res.status(400).json({ error: 'Ismeretlen cimzett-kulcs.' }); return; }

  const safeName = name && String(name).trim();
  const safeMsg = message && String(message).trim();
  if (!safeName || !safeMsg) {
    res.status(400).json({ error: 'Nev es uzenet kotelezo.' });
    return;
  }

  const html = `<!DOCTYPE html><html lang="hu"><body style="margin:0;padding:0;background:#fdf6ec;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fdf6ec;">
      <tr><td align="center" style="padding:28px 16px;">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="width:560px;max-width:560px;background:#ffffff;border:2px solid #f0c869;border-radius:16px;overflow:hidden;">
          <tr><td style="padding:22px 30px;background:#7a2f3a;">
            <div style="font-family:Segoe UI,Helvetica,Arial,sans-serif;font-size:20px;font-weight:800;color:#fdf6ec;">🎂 Szülinapi üzenet a weboldaladról</div>
          </td></tr>
          <tr><td style="padding:26px 30px 8px 30px;">
            <div style="font-family:Segoe UI,Helvetica,Arial,sans-serif;font-size:13px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#c85b3d;margin-bottom:8px;">Írta: ${escapeHtml(safeName)}</div>
            <div style="font-family:Segoe UI,Helvetica,Arial,sans-serif;font-size:16px;line-height:1.7;color:#2b2320;background:#fbeede;border-left:4px solid #c85b3d;padding:16px 18px;border-radius:0 8px 8px 0;">${escapeHtml(safeMsg).replace(/\n/g, '<br>')}</div>
          </td></tr>
          <tr><td style="padding:18px 30px 28px 30px;font-family:Segoe UI,Helvetica,Arial,sans-serif;font-size:12px;color:#9a8f86;">
            Ez az üzenet a szülinapi weboldalad vendégkönyvéből érkezett. Boldog szülinapot! 🎉
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body></html>`;

  try {
    await sendEmail({
      to: [cfg.to],
      subject: `🎂 Szülinapi üzenet: ${safeName}`,
      html,
    });
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('send-guestbook error:', err);
    res.status(500).json({ error: 'Az üzenet küldése nem sikerült.' });
  }
};
