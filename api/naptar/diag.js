// Temporary diagnostic endpoint: tells which Supabase role the configured key
// carries and whether a plain read sees any row. It never returns the key, any
// row content, or anything else private -- only a role name and two counts.
const { sb, json } = require('../_lib/naptar');

function kulcsSzerep(key) {
  if (!key) return 'nincs';
  if (key.startsWith('sb_secret_')) return 'secret (uj formatum)';
  if (key.startsWith('sb_publishable_')) return 'publishable (uj formatum)';
  var parts = key.split('.');
  if (parts.length !== 3) return 'ismeretlen formatum';
  try {
    var payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
    return String(payload.role || 'ismeretlen');
  } catch (e) {
    return 'nem olvashato JWT';
  }
}

module.exports = async function handler(req, res) {
  var out = {
    url_beallitva: Boolean(process.env.SUPABASE_URL),
    kulcs_beallitva: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    kulcs_szerepe: kulcsSzerep(process.env.SUPABASE_SERVICE_ROLE_KEY),
  };
  try {
    var b = await sb('naptar_beallitasok?select=id');
    out.beallitas_sorok = (b || []).length;
    var t = await sb('naptar_tagok?select=id');
    out.tag_sorok = (t || []).length;
  } catch (err) {
    out.db_hiba = err.code || 'ISMERETLEN';
  }
  return json(res, 200, out);
};
