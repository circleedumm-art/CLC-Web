/* CLC service worker. Keeps the app opening quickly and shows a friendly page when there is no signal.
   It never stores Firebase data or logins. It tries the network first, so website updates appear straight away.
   If you ever need to force everyone to refresh, change the version number below. */
const VERSION = "clc-v2";
const SHELL = ["index.html", "offline.html", "style.css", "common.js", "defaults.js", "firebase-config.js", "app.js", "festive.js", "ripple.js", "logo.png", "logo-dark.png",
  "icons/icon-192.png", "icons/icon-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => Promise.all(SHELL.map(u => c.add(u).catch(() => {})))).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== location.origin) return;   // Firebase, fonts etc. go straight to the network
  e.respondWith((async () => {
    try {
      const res = await fetch(req);
      if (res.ok) { const c = await caches.open(VERSION); c.put(req, res.clone()); }
      return res;
    } catch (err) {
      // The portals need Firebase online, so offline they show the friendly page instead of a half-loaded screen.
      if (req.mode === "navigate" && /(student|teacher|admin)\.html$/.test(url.pathname)) return caches.match("offline.html");
      const hit = await caches.match(req);
      if (hit) return hit;
      if (req.mode === "navigate") return (await caches.match("index.html")) || caches.match("offline.html");
      return Response.error();
    }
  })());
});
