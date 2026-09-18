/* Need To Pee - offline shell (v1) */
var CACHE = 'ntp-v1';
var BASE = self.registration.scope.replace(location.origin, '').replace(/\/$/, '');
var ASSETS = [
  BASE + '/', BASE + '/index.html', BASE + '/data/toilets.json', BASE + '/manifest.webmanifest',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
];
self.addEventListener('install', function(e){
  e.waitUntil(caches.open(CACHE).then(function(c){
    return Promise.all(ASSETS.map(function(u){ return c.add(new Request(u, { mode: 'cors' })).catch(function(){}); }));
  }).then(function(){ return self.skipWaiting(); }));
});
self.addEventListener('activate', function(e){
  e.waitUntil(caches.keys().then(function(ks){
    return Promise.all(ks.filter(function(k){ return k !== CACHE; }).map(function(k){ return caches.delete(k); }));
  }).then(function(){ return self.clients.claim(); }));
});
self.addEventListener('fetch', function(e){
  if (e.request.method !== 'GET') return;
  // a terkep-csempeket nem cache-eljuk elore, de ha van, adjuk vissza
  e.respondWith(
    caches.match(e.request).then(function(hit){
      if (hit) return hit;
      return fetch(e.request).then(function(res){
        if (res && res.ok && /toilets\.json$/.test(e.request.url)){
          var copy = res.clone();
          caches.open(CACHE).then(function(c){ c.put(e.request, copy); });
        }
        return res;
      }).catch(function(){ return hit; });
    })
  );
});
