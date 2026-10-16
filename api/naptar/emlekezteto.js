// Daily cron: sends a reminder for every event starting in the next 24-48h.
// Vercel calls it with an `x-vercel-cron` header; if CRON_SECRET is configured,
// the Bearer token must match instead. A repeated run cannot double-send,
// because every sent reminder is recorded in naptar_emlekeztetok.
const { sb, json, fail } = require('../_lib/naptar');
const { sendEmail, escapeHtml } = require('../_lib/mailer');

const MAX_LEVEL_FUTASONKENT = 80;
const DEMO_URL = 'https://www.polarisweb.hu/demok/naptar';

const CIMKE_SZOVEG = { only_bocs: 'Only bocs', bocs_and_girls: 'Bocs and girls' };

function jogosult(req) {
  const titok = process.env.CRON_SECRET;
  if (titok) {
    const auth = req.headers['authorization'] || '';
    return auth === `Bearer ${titok}`;
  }
  return Boolean(req.headers['x-vercel-cron']);
}

function magyarIdo(iso, egeszNapos) {
  const d = new Date(iso);
  const opts = egeszNapos
    ? { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Europe/Budapest' }
    : { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Budapest' };
  return new Intl.DateTimeFormat('hu-HU', opts).format(d);
}

module.exports = async function handler(req, res) {
  if (!jogosult(req)) return json(res, 401, { error: 'Unauthorized' });
  try {
    const most = Date.now();
    const tol = new Date(most + 24 * 3600000).toISOString();
    const ig = new Date(most + 48 * 3600000).toISOString();

    const esemenyek = await sb(
      `naptar_esemenyek?kezdet=gte.${tol}&kezdet=lt.${ig}&order=kezdet.asc&select=id,cim,leiras,helyszin,kezdet,egesz_napos,lathatosag,cimke,erosseg,letrehozo_id,resztvevok:naptar_resztvevok(tag_id,statusz)`
    );
    if (!esemenyek || !esemenyek.length) return json(res, 200, { ok: true, esemeny: 0, kuldve: 0 });

    const tagok = await sb('naptar_tagok?aktiv=eq.true&emlekezteto_kerek=eq.true&select=id,email,nev');
    const tagById = new Map((tagok || []).map((t) => [t.id, t]));

    const mar = await sb('naptar_emlekeztetok?select=esemeny_id,tag_id');
    const marKuldve = new Set((mar || []).map((r) => `${r.esemeny_id}:${r.tag_id}`));

    let kuldve = 0;
    const naplo = [];

    for (const ev of esemenyek) {
      const cimzettIds = ev.lathatosag === 'kozos'
        ? Array.from(tagById.keys())
        : Array.from(new Set([ev.letrehozo_id, ...(ev.resztvevok || []).map((r) => r.tag_id)]));

      for (const tid of cimzettIds) {
        if (kuldve >= MAX_LEVEL_FUTASONKENT) break;
        const tag = tagById.get(tid);
        if (!tag) continue;
        const kulcs = `${ev.id}:${tid}`;
        if (marKuldve.has(kulcs)) continue;

        const reszletek = [
          ['Mikor', magyarIdo(ev.kezdet, ev.egesz_napos)],
          ev.helyszin ? ['Hol', ev.helyszin] : null,
          ev.cimke ? ['Címke', CIMKE_SZOVEG[ev.cimke]] : null,
          ['Erősség', '●'.repeat(ev.erosseg) + '○'.repeat(5 - ev.erosseg)],
        ].filter(Boolean);

        try {
          await sendEmail({
            to: [tag.email],
            subject: `Holnap: ${ev.cim}`,
            html: `
              <div style="font-family:system-ui,-apple-system,'Segoe UI',sans-serif;max-width:520px;margin:0 auto;padding:28px 24px;color:#1f1b16;">
                <p style="font-size:15px;margin:0 0 6px;">Szia ${escapeHtml(tag.nev)}!</p>
                <p style="font-size:15px;line-height:1.6;margin:0 0 20px;">Holnap ez vár rád:</p>
                <div style="padding:20px 22px;background:#f6f2ec;border-radius:16px;">
                  <div style="font-size:19px;font-weight:700;margin-bottom:12px;">${escapeHtml(ev.cim)}</div>
                  ${reszletek.map(([k, v]) => `<div style="font-size:14px;margin:4px 0;"><strong>${k}:</strong> ${escapeHtml(v)}</div>`).join('')}
                  ${ev.leiras ? `<div style="font-size:14px;line-height:1.6;margin-top:12px;color:#5c5349;">${escapeHtml(ev.leiras)}</div>` : ''}
                </div>
                <p style="margin:24px 0 0;"><a href="${DEMO_URL}" style="display:inline-block;padding:12px 22px;background:#1f1b16;color:#fff;text-decoration:none;border-radius:999px;font-size:14px;font-weight:600;">Megnyitom a naptárat</a></p>
              </div>`,
          });
          naplo.push({ esemeny_id: ev.id, tag_id: tid });
          kuldve += 1;
        } catch (e) {
          // One failed address must not stop the whole run.
          console.error('[naptar-emlekezteto] send failed', tag.email, e && e.message);
        }
      }
    }

    if (naplo.length) await sb('naptar_emlekeztetok', { method: 'POST', body: naplo, prefer: 'resolution=merge-duplicates' });

    // Housekeeping: drop expired sessions and used login codes.
    const regen = new Date(most - 7 * 86400000).toISOString();
    await sb(`naptar_sessionok?lejar=lt.${new Date(most).toISOString()}`, { method: 'DELETE' });
    await sb(`naptar_belepokodok?created_at=lt.${regen}`, { method: 'DELETE' });

    return json(res, 200, { ok: true, esemeny: esemenyek.length, kuldve });
  } catch (err) {
    return fail(res, err);
  }
};
