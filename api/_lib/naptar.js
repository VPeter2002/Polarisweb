// Shared helpers for the Tarsasagi naptar demo.
// Every database call goes through PostgREST with the service_role key, so this
// file must never be imported from anything that runs in the browser.

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function configMissing() {
  return !SUPABASE_URL || !SERVICE_KEY;
}

async function sb(path, { method = 'GET', body, prefer } = {}) {
  if (configMissing()) {
    const err = new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    err.code = 'CONFIG_MISSING';
    throw err;
  }
  const headers = {
    apikey: SERVICE_KEY,
    Authorization: `Bearer ${SERVICE_KEY}`,
    'Content-Type': 'application/json',
  };
  if (prefer) headers.Prefer = prefer;
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) {
    const err = new Error(`Supabase ${res.status}: ${text}`);
    err.code = 'DB_FAILED';
    throw err;
  }
  return text ? JSON.parse(text) : null;
}

function randomToken(bytes = 32) {
  return require('crypto').randomBytes(bytes).toString('hex');
}

function sixDigitCode() {
  // crypto.randomInt avoids the modulo bias a plain Math.random would carry.
  return String(require('crypto').randomInt(0, 1000000)).padStart(6, '0');
}

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
}

// Resolves a session token to its member row, or null. Expired tokens are
// treated as missing (and left in place; the daily cron prunes them).
async function tagFromToken(token) {
  if (!token || typeof token !== 'string' || token.length < 32) return null;
  const rows = await sb(
    `naptar_sessionok?token=eq.${encodeURIComponent(token)}&select=token,lejar,tag:naptar_tagok(id,email,nev,szin,emlekezteto_kerek)`
  );
  const row = rows && rows[0];
  if (!row) return null;
  if (new Date(row.lejar).getTime() < Date.now()) return null;
  return row.tag || null;
}

function json(res, status, payload) {
  res.status(status).json(payload);
}

function fail(res, err) {
  if (err && err.code === 'CONFIG_MISSING') {
    json(res, 503, { error: 'A naptár még nincs beállítva (hiányzó adatbázis-kulcs).' });
    return;
  }
  console.error('[naptar]', err && err.message);
  json(res, 500, { error: 'Váratlan hiba történt. Próbáld újra.' });
}

module.exports = {
  sb, randomToken, sixDigitCode, normalizeEmail, isValidEmail,
  tagFromToken, json, fail, configMissing,
};
