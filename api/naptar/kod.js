// POST { email, nev?, meghivo_kod? } -> sends a 6 digit login code by email.
// An existing member needs no invite code; a new one does.
const { sb, sixDigitCode, normalizeEmail, isValidEmail, json, fail } = require('../_lib/naptar');
const { sendEmail } = require('../_lib/mailer');

const KOD_ELETTARTAM_PERC = 15;

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });
  try {
    const body = req.body || {};
    const email = normalizeEmail(body.email);
    const nev = String(body.nev || '').trim().slice(0, 60);
    const meghivoKod = String(body.meghivo_kod || '').trim();

    if (!isValidEmail(email)) return json(res, 400, { error: 'Adj meg egy érvényes e-mail címet.' });

    const tagok = await sb(`naptar_tagok?email=eq.${encodeURIComponent(email)}&select=id,nev,aktiv`);
    let tag = tagok && tagok[0];

    if (!tag) {
      const beall = await sb('naptar_beallitasok?id=eq.1&select=meghivo_kod,tarsasag_nev');
      const kell = (beall && beall[0] && beall[0].meghivo_kod) || '';
      if (!meghivoKod || meghivoKod.toUpperCase() !== kell.toUpperCase()) {
        return json(res, 403, { error: 'Ehhez meghívó kód kell. Kérd el attól, aki hívott.', kod_kell: true });
      }
      if (!nev) return json(res, 400, { error: 'Írd be a neved is, hogy a többiek lássák.', nev_kell: true });
      const created = await sb('naptar_tagok', {
        method: 'POST',
        body: { email, nev },
        prefer: 'return=representation',
      });
      tag = created && created[0];
    } else if (tag.aktiv === false) {
      return json(res, 403, { error: 'Ez a fiók le van tiltva.' });
    }

    const kod = sixDigitCode();
    const lejar = new Date(Date.now() + KOD_ELETTARTAM_PERC * 60000).toISOString();
    await sb('naptar_belepokodok', { method: 'POST', body: { email, kod, lejar } });

    await sendEmail({
      to: [email],
      subject: `${kod} a belépési kódod`,
      html: `
        <div style="font-family:system-ui,-apple-system,'Segoe UI',sans-serif;max-width:480px;margin:0 auto;padding:28px 24px;color:#1f1b16;">
          <p style="font-size:15px;margin:0 0 18px;">Szia${tag && tag.nev ? ' ' + tag.nev : ''}!</p>
          <p style="font-size:15px;line-height:1.6;margin:0 0 22px;">Ez a belépési kódod a közös naptárhoz. ${KOD_ELETTARTAM_PERC} percig él.</p>
          <div style="font-size:34px;font-weight:800;letter-spacing:10px;text-align:center;padding:18px 0;background:#f6f2ec;border-radius:14px;">${kod}</div>
          <p style="font-size:13px;line-height:1.6;color:#7a6f63;margin:22px 0 0;">Ha nem te kérted, nincs teendőd, a kóddal egyedül nem lehet mit kezdeni.</p>
        </div>`,
    });

    return json(res, 200, { ok: true, uj_tag: !tagok || !tagok[0] });
  } catch (err) {
    return fail(res, err);
  }
};
