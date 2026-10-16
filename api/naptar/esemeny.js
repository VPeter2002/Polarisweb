// POST { token, action: 'create'|'update'|'delete', ... }
// Only the creator may change or delete an event.
const { sb, tagFromToken, json, fail } = require('../_lib/naptar');

const CIMKEK = ['only_boys', 'boys_and_girls'];

function tisztitErosseg(value) {
  const n = parseInt(value, 10);
  if (!Number.isFinite(n)) return 3;
  return Math.min(5, Math.max(1, n));
}

function mezok(body) {
  const cim = String(body.cim || '').trim().slice(0, 120);
  const lathatosag = body.lathatosag === 'privat' ? 'privat' : 'kozos';
  const cimke = CIMKEK.includes(body.cimke) ? body.cimke : null;
  return {
    cim,
    leiras: String(body.leiras || '').trim().slice(0, 2000) || null,
    helyszin: String(body.helyszin || '').trim().slice(0, 160) || null,
    kezdet: body.kezdet,
    veg: body.veg || null,
    egesz_napos: !!body.egesz_napos,
    lathatosag,
    cimke,
    erosseg: tisztitErosseg(body.erosseg),
  };
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });
  try {
    const body = req.body || {};
    const tag = await tagFromToken(body.token);
    if (!tag) return json(res, 401, { error: 'Lejárt a belépés, jelentkezz be újra.' });

    const action = body.action || 'create';

    if (action === 'delete') {
      const id = String(body.id || '');
      const rows = await sb(`naptar_esemenyek?id=eq.${encodeURIComponent(id)}&select=id,letrehozo_id`);
      const ev = rows && rows[0];
      if (!ev) return json(res, 404, { error: 'Nincs ilyen esemény.' });
      if (ev.letrehozo_id !== tag.id) return json(res, 403, { error: 'Csak az tudja törölni, aki létrehozta.' });
      await sb(`naptar_esemenyek?id=eq.${encodeURIComponent(id)}`, { method: 'DELETE' });
      return json(res, 200, { ok: true });
    }

    const adat = mezok(body);
    if (!adat.cim) return json(res, 400, { error: 'Adj címet az eseménynek.' });
    if (!adat.kezdet || Number.isNaN(new Date(adat.kezdet).getTime())) {
      return json(res, 400, { error: 'Hiányzik vagy hibás a kezdés időpontja.' });
    }
    if (adat.veg && new Date(adat.veg).getTime() < new Date(adat.kezdet).getTime()) {
      return json(res, 400, { error: 'A vége nem lehet korábban, mint a kezdés.' });
    }

    // Who is invited. For a shared event this stays empty: everyone sees it.
    const resztvevoIds = Array.isArray(body.resztvevok)
      ? body.resztvevok.filter((v) => typeof v === 'string').slice(0, 100)
      : [];
    if (adat.lathatosag === 'privat' && resztvevoIds.length === 0) {
      return json(res, 400, { error: 'Privát eseményhez válaszd ki, kivel van a program.' });
    }

    if (action === 'update') {
      const id = String(body.id || '');
      const rows = await sb(`naptar_esemenyek?id=eq.${encodeURIComponent(id)}&select=id,letrehozo_id`);
      const ev = rows && rows[0];
      if (!ev) return json(res, 404, { error: 'Nincs ilyen esemény.' });
      if (ev.letrehozo_id !== tag.id) return json(res, 403, { error: 'Csak az tudja szerkeszteni, aki létrehozta.' });
      await sb(`naptar_esemenyek?id=eq.${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: { ...adat, updated_at: new Date().toISOString() },
      });
      await sb(`naptar_resztvevok?esemeny_id=eq.${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (resztvevoIds.length) {
        await sb('naptar_resztvevok', {
          method: 'POST',
          body: resztvevoIds.map((tid) => ({ esemeny_id: id, tag_id: tid })),
        });
      }
      return json(res, 200, { ok: true, id });
    }

    const created = await sb('naptar_esemenyek', {
      method: 'POST',
      body: { ...adat, letrehozo_id: tag.id },
      prefer: 'return=representation',
    });
    const uj = created && created[0];
    if (uj && resztvevoIds.length) {
      await sb('naptar_resztvevok', {
        method: 'POST',
        body: resztvevoIds.map((tid) => ({ esemeny_id: uj.id, tag_id: tid })),
      });
    }
    return json(res, 200, { ok: true, id: uj && uj.id });
  } catch (err) {
    return fail(res, err);
  }
};
