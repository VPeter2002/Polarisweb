// POST { token, esemeny_id, statusz } -> upserts the member's own RSVP.
const { sb, tagFromToken, json, fail } = require('../_lib/naptar');

const STATUSZOK = ['meghivott', 'jon', 'talan', 'nem_jon'];

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });
  try {
    const body = req.body || {};
    const tag = await tagFromToken(body.token);
    if (!tag) return json(res, 401, { error: 'Lejárt a belépés, jelentkezz be újra.' });

    const esemenyId = String(body.esemeny_id || '');
    const statusz = STATUSZOK.includes(body.statusz) ? body.statusz : null;
    if (!esemenyId || !statusz) return json(res, 400, { error: 'Hiányzó adat.' });

    const rows = await sb(`naptar_esemenyek?id=eq.${encodeURIComponent(esemenyId)}&select=id,lathatosag,letrehozo_id,resztvevok:naptar_resztvevok(tag_id)`);
    const ev = rows && rows[0];
    if (!ev) return json(res, 404, { error: 'Nincs ilyen esemény.' });
    const lathatja = ev.lathatosag === 'kozos'
      || ev.letrehozo_id === tag.id
      || (ev.resztvevok || []).some((r) => r.tag_id === tag.id);
    if (!lathatja) return json(res, 403, { error: 'Ez az esemény nem a tiéd.' });

    await sb('naptar_resztvevok', {
      method: 'POST',
      body: { esemeny_id: esemenyId, tag_id: tag.id, statusz },
      prefer: 'resolution=merge-duplicates',
    });
    return json(res, 200, { ok: true });
  } catch (err) {
    return fail(res, err);
  }
};
