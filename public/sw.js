// Service worker minimal : requis pour l'installabilité PWA (et donc pour
// le Web Share Target). Stratégie réseau d'abord, sans cache applicatif —
// l'app reste une SPA en ligne, le SW ne sert qu'à rendre l'app
// installable et à recevoir les partages.
self.addEventListener("install", () => self.skipWaiting())
self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim())
})
self.addEventListener("fetch", () => {
  // Passthrough réseau : aucune interception nécessaire.
})
