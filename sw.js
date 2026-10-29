/* Small offline shell. Bump VERSION whenever you publish new content. */
var VERSION = 'ro-v1';
var SHELL = ['./', 'index.html', 'config.js', 'content.js', 'app.js', 'manifest.webmanifest',
  'assets/logo.png', 'assets/logo-white.png', 'assets/figtree.woff2', 'assets/newsreader.woff2', 'assets/newsreader-italic.woff2'];
self.addEventListener('install', function (e) { e.waitUntil(caches.open(VERSION).then(function (c) { return c.addAll(SHELL); }).then(function () { return self.skipWaiting(); })); });
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) { return Promise.all(ks.filter(function (k) { return k !== VERSION; }).map(function (k) { return caches.delete(k); })); }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  var r = e.request;
  if (r.method !== 'GET' || new URL(r.url).origin !== location.origin) return;   // API calls go straight to the network
  e.respondWith(caches.open(VERSION).then(function (c) {
    return c.match(r, { ignoreSearch: true }).then(function (hit) {
      var net = fetch(r).then(function (res) { if (res && res.ok) c.put(r, res.clone()); return res; }).catch(function () { return hit; });
      return hit || net;
    });
  }));
});
