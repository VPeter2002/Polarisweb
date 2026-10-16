// POST { email, kod } -> { token, tag }
const { sb, randomToken, normalizeEmail, isValidEmail, json, fail } = require('../_lib/naptar');

// Half a year: the point of the e-mail code is that you type it once per device.
const SESSION_NAP = 180;
const MAX_PROBALKOZAS = 5;

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });
  try {
    const body = req.body || {};
    const email = normalizeEmail(body.email);
    const kod = String(body.kod || '').trim();
    if (!isValidEmail(email) || !/^\d{6}$/.test(kod)) {
      return json(res, 400, { error: 'Hiányzó vagy hibás adat.' });
    }

    const rows = await sb(
      `naptar_belepokodok?email=eq.${encodeURIComponent(email)}&felhasznalva=eq.false&order=created_at.desc&limit=1&select=id,kod,lejar,probalkozas`
    );
    const row = rows && rows[0];
    if (!row) return json(res, 400, { error: 'Kérj új kódot.' });
    if (new Date(row.lejar).getTime() < Date.now()) return json(res, 400, { error: 'A kód lejárt, kérj újat.' });
    if (row.probalkozas >= MAX_PROBALKOZAS) return json(res, 429, { error: 'Túl sok próbálkozás, kérj új kódot.' });

    if (row.kod !== kod) {
      await sb(`naptar_belepokodok?id=eq.${row.id}`, { method: 'PATCH', body: { probalkozas: row.probalkozas + 1 } });
      return json(res, 400, { error: 'Nem jó a kód.' });
    }

    const tagok = await sb(`naptar_tagok?email=eq.${encodeURIComponent(email)}&select=id,email,nev,szin,emlekezteto_kerek`);
    const tag = tagok && tagok[0];
    if (!tag) return json(res, 400, { error: 'Ez a cím nincs a társaságban.' });

    await sb(`naptar_belepokodok?id=eq.${row.id}`, { method: 'PATCH', body: { felhasznalva: true } });

    const token = randomToken();
    const lejar = new Date(Date.now() + SESSION_NAP * 86400000).toISOString();
    await sb('naptar_sessionok', { method: 'POST', body: { token, tag_id: tag.id, lejar } });
    await sb(`naptar_tagok?id=eq.${tag.id}`, { method: 'PATCH', body: { utolso_belepes: new Date().toISOString() } });

    return json(res, 200, { ok: true, token, tag });
  } catch (err) {
    return fail(res, err);
  }
};
