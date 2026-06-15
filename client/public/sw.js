// Service Worker FLUPSY PWA - KILL SWITCH
// Questo service worker NON memorizza piu nulla in cache.
// Il suo unico compito e' sbloccare i dispositivi rimasti su una versione
// vecchia dell'app: svuota tutte le cache, si disregistra da solo e
// ricarica le pagine aperte cosi' da scaricare sempre il codice piu' recente.

self.addEventListener('install', function() {
  // Attiva subito la nuova versione senza attendere
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  event.waitUntil((async function() {
    try {
      // 1. Elimina tutte le cache esistenti
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(function(name) {
        return caches.delete(name);
      }));

      // 2. Rimuove questo service worker
      await self.registration.unregister();

      // 3. Ricarica tutte le schede/finestre aperte per ottenere il codice nuovo
      const clients = await self.clients.matchAll({ type: 'window' });
      clients.forEach(function(client) {
        if ('navigate' in client) {
          client.navigate(client.url);
        }
      });
    } catch (err) {
      // In caso di errore non blocchiamo nulla: la prossima visita ritentera'
    }
  })());
});

// Non intercettiamo piu' le richieste di rete: tutto passa direttamente alla rete.
