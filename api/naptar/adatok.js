// GET ?token=... -> { tag, tagok, esemenyek }
// A private event is only returned to its creator and its invited members;
// the filtering happens here, never in the browser.
const { sb, tagFromToken, json, fail } = require('../_lib/naptar');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return json(res, 405, { error: 'Method not allowed' });
  try {
    const token = (req.query && req.query.token) || '';
    const tag = await tagFromToken(token);
    if (!tag) return json(res, 401, { error: 'Lejárt a belépés, jelentkezz be újra.' });

    const tagok = await sb('naptar_tagok?aktiv=eq.true&select=id,nev,email,szin&order=nev.asc');

    // Everything from a month back, so the list view can show the recent past.
    const hatar = new Date(Date.now() - 31 * 86400000).toISOString();
    const esemenyek = await sb(
      `naptar_esemenyek?kezdet=gte.${hatar}&order=kezdet.asc&select=id,cim,leiras,helyszin,kezdet,veg,egesz_napos,lathatosag,cimke,erosseg,letrehozo_id,created_at,resztvevok:naptar_resztvevok(tag_id,statusz)`
    );

    const lathato = (esemenyek || []).filter((e) => {
      if (e.lathatosag === 'kozos') return true;
      if (e.letrehozo_id === tag.id) return true;
      return (e.resztvevok || []).some((r) => r.tag_id === tag.id);
    });

    const beall = await sb('naptar_beallitasok?id=eq.1&select=tarsasag_nev');
    return json(res, 200, {
      ok: true,
      tag,
      tagok: tagok || [],
      esemenyek: lathato,
      tarsasag_nev: (beall && beall[0] && beall[0].tarsasag_nev) || 'Bobr naptár',
    });
  } catch (err) {
    return fail(res, err);
  }
};
