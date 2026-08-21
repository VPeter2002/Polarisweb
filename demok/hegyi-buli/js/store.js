/* Hegyi Buli – adat-réteg.
   Supabase-alapú KÖZÖS háttértár, hogy több telefonról ugyanazt a ranglistát
   és üzenőfalat lássa mindenki. Ha a hálózat/Supabase nem elérhető, automatikusan
   localStorage-re esik vissza (egy-eszközös mód), hogy sose törjön meg.
   Event-sourced: minden ital EGY sor -> nincs több-telefonos írási ütközés. */
window.HegyiStore = (function () {
  'use strict';

  var SUPABASE_URL = 'https://lyagqwuqzurkkvcnjqtg.supabase.co';
  var ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5YWdxd3VxenVya2t2Y25qcXRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5MDE2NzIsImV4cCI6MjA5NTQ3NzY3Mn0.tuoGksKYjjiaohdTaNt_vvnY1mB9IUpoQC3cAqA9-tU';
  var REST = SUPABASE_URL + '/rest/v1/';
  var DRINKS_TBL = 'hegyibuli_drinks';
  var MSG_TBL = 'hegyibuli_messages';

  // localStorage fallback (ha nincs háló / a táblák még nem léteznek)
  var LS_DRINKS = 'hegyibuli-drinks-3-';
  var LS_MSG = 'hegyibuli-messages-3';

  function readJSON(key, fb) {
    try { var r = localStorage.getItem(key); return r ? JSON.parse(r) : fb; }
    catch (e) { return fb; }
  }
  function writeJSON(key, v) { try { localStorage.setItem(key, JSON.stringify(v)); } catch (e) {} }

  function headers(extra) {
    var h = { 'apikey': ANON, 'Authorization': 'Bearer ' + ANON, 'Content-Type': 'application/json' };
    if (extra) Object.keys(extra).forEach(function (k) { h[k] = extra[k]; });
    return h;
  }
  function sb(path, opts) {
    return fetch(REST + path, opts).then(function (r) {
      if (!r.ok) throw new Error('supabase ' + r.status);
      return r.status === 204 ? null : r.json();
    });
  }

  // ---- DRINKS ----
  function getDrinks(profileId) {
    return sb(DRINKS_TBL + '?select=drink_key&profile_id=eq.' + encodeURIComponent(profileId), { headers: headers() })
      .then(function (rows) {
        var d = {}; rows.forEach(function (r) { d[r.drink_key] = (d[r.drink_key] || 0) + 1; }); return d;
      })
      .catch(function () { return readJSON(LS_DRINKS + profileId, {}); });
  }

  function addDrink(profileId, drinkKey) {
    return sb(DRINKS_TBL, {
      method: 'POST', headers: headers({ 'Prefer': 'return=minimal' }),
      body: JSON.stringify({ profile_id: profileId, drink_key: drinkKey })
    })
      .then(function () { return getDrinks(profileId); })
      .catch(function () {
        var d = readJSON(LS_DRINKS + profileId, {});
        d[drinkKey] = (d[drinkKey] || 0) + 1;
        writeJSON(LS_DRINKS + profileId, d);
        return d;
      });
  }

  function resetDrinks(profileId) {
    return sb(DRINKS_TBL + '?profile_id=eq.' + encodeURIComponent(profileId), {
      method: 'DELETE', headers: headers({ 'Prefer': 'return=minimal' })
    })
      .then(function () { return {}; })
      .catch(function () { writeJSON(LS_DRINKS + profileId, {}); return {}; });
  }

  function getAllDrinks(profileIds) {
    return sb(DRINKS_TBL + '?select=profile_id,drink_key', { headers: headers() })
      .then(function (rows) {
        var out = {}; profileIds.forEach(function (id) { out[id] = {}; });
        rows.forEach(function (r) {
          if (!out[r.profile_id]) out[r.profile_id] = {};
          out[r.profile_id][r.drink_key] = (out[r.profile_id][r.drink_key] || 0) + 1;
        });
        return out;
      })
      .catch(function () {
        var out = {}; profileIds.forEach(function (id) { out[id] = readJSON(LS_DRINKS + id, {}); }); return out;
      });
  }

  // ---- MESSAGES ----
  function getMessages() {
    return sb(MSG_TBL + '?select=name,msg,created_at&order=created_at.asc', { headers: headers() })
      .then(function (rows) { return rows.map(function (r) { return { name: r.name, msg: r.msg, ts: r.created_at }; }); })
      .catch(function () { return readJSON(LS_MSG, []); });
  }

  function addMessage(name, msg) {
    return sb(MSG_TBL, {
      method: 'POST', headers: headers({ 'Prefer': 'return=minimal' }),
      body: JSON.stringify({ name: name, msg: msg })
    })
      .then(function () { return getMessages(); })
      .catch(function () {
        var list = readJSON(LS_MSG, []);
        list.push({ name: name, msg: msg, ts: Date.now() });
        writeJSON(LS_MSG, list);
        return list;
      });
  }

  return {
    getDrinks: getDrinks,
    addDrink: addDrink,
    resetDrinks: resetDrinks,
    getAllDrinks: getAllDrinks,
    getMessages: getMessages,
    addMessage: addMessage
  };
})();
