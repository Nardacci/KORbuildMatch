/* KORbuild Match — service worker do protótipo.
 * Rede primeiro: sempre busca a versão nova e guarda uma cópia; sem internet, usa a cópia.
 * Assim o app instalado abre offline, mas nunca fica preso a uma versão antiga. */
var CACHE = 'korbuild-v1';
var ESSENCIAIS = ['./', 'index.html', 'demo.html', 'empresa.html', 'profissional.html', 'manifest.webmanifest',
  'assets/icons/icon-192.png', 'assets/icons/icon-512.png'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(ESSENCIAIS); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (nomes) {
    return Promise.all(nomes.filter(function (n) { return n !== CACHE; }).map(function (n) { return caches.delete(n); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(fetch(req).then(function (resp) {
    if (resp.ok) { var copia = resp.clone(); caches.open(CACHE).then(function (c) { c.put(req, copia); }); }
    return resp;
  }).catch(function () {
    return caches.match(req, { ignoreSearch: true }).then(function (r) { return r || caches.match('index.html'); });
  }));
});
