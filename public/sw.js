/**
 * JESic Meet - Service Worker per Notifiche Push Reali & PWA
 * Supporta Web Push in background su Smartphone (Android, iOS PWA) e Desktop (Chrome, Edge, Safari, Firefox).
 */

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Ascolto delle Notifiche Push in background
self.addEventListener('push', (event) => {
  let data = {
    title: 'JESic Meet',
    body: 'Hai una nuova notifica',
    icon: '/logo.png',
    badge: '/logo.png',
    data: { url: '/' },
    tag: 'jesic-notification',
  };

  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch (err) {
      data.body = event.data.text();
    }
  }

  const notificationOptions = {
    body: data.body,
    icon: data.icon || '/logo.png',
    badge: data.badge || '/logo.png',
    data: data.data || { url: '/' },
    tag: data.tag || 'jesic-push',
    renotify: true,
    vibrate: [200, 100, 200],
    actions: [
      {
        action: 'open',
        title: 'Apri',
      },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'JESic Meet', notificationOptions)
  );
});

// Click sulla notifica: apre o porta in primo piano l'applicazione
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Se c'è già una finestra aperta, portala in primo piano e naviga
      for (const client of windowClients) {
        if ('focus' in client) {
          if (client.url && 'navigate' in client) {
            client.navigate(targetUrl);
          }
          return client.focus();
        }
      }

      // Se non c'è nessuna finestra aperta, aprine una nuova
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
