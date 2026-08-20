/* Hegyi Buli – adat-réteg.
   Most localStorage-dzsel dolgozik, de MINDEN függvény Promise-t ad vissza,
   így ha később közös háttértár (pl. Supabase) kell, csak ez a fájl cserélődik,
   a UI (app.js) API-ja nem változik. */
window.HegyiStore = (function () {
  'use strict';

  var DRINKS_PREFIX = 'hegyibuli-drinks-';
  var MESSAGES_KEY = 'hegyibuli-messages';

  function readJSON(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }
  function writeJSON(key, val) {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch (e) {}
  }

  function getDrinks(profileId) {
    return Promise.resolve(readJSON(DRINKS_PREFIX + profileId, {}));
  }

  function addDrink(profileId, drinkKey) {
    var d = readJSON(DRINKS_PREFIX + profileId, {});
    d[drinkKey] = (d[drinkKey] || 0) + 1;
    writeJSON(DRINKS_PREFIX + profileId, d);
    return Promise.resolve(d);
  }

  function resetDrinks(profileId) {
    writeJSON(DRINKS_PREFIX + profileId, {});
    return Promise.resolve({});
  }

  function getAllDrinks(profileIds) {
    var out = {};
    profileIds.forEach(function (id) {
      out[id] = readJSON(DRINKS_PREFIX + id, {});
    });
    return Promise.resolve(out);
  }

  function getMessages() {
    return Promise.resolve(readJSON(MESSAGES_KEY, []));
  }

  function addMessage(name, msg) {
    var list = readJSON(MESSAGES_KEY, []);
    list.push({ name: name, msg: msg, ts: Date.now() });
    writeJSON(MESSAGES_KEY, list);
    return Promise.resolve(list);
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
