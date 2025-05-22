const CACHE_NAME = "static-v1";
const URLS_TO_CACHE = [
  "/",
  "/statistics",
  "/transactions",
  "/budget",
  "/web-app-manifest-192x192.png",
  "/web-app-manifest-512x512.png",
];

self.addEventListener("install", (event) => {
  console.log("Service Worker zainstalowany");
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(URLS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log("Service Worker aktywowany");
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => caches.delete(name))
        )
      )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request)
        .then((networkResponse) => {
          if (
            !networkResponse ||
            networkResponse.status !== 200 ||
            networkResponse.type !== "basic"
          ) {
            return networkResponse;
          }

          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return networkResponse;
        })
        .catch(() => {
          return new Response(
            "Brak połączenia i brak zapisanej strony offline.",
            {
              status: 503,
              statusText: "Service Unavailable",
              headers: new Headers({ "Content-Type": "text/plain" }),
            }
          );
        });
    })
  );
});

self.addEventListener("push", (event) => {
  const data = event.data?.json() || {};
  const title = data.title || "Powiadomienie";
  const body = data.body || "Masz nowe powiadomienie";

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: "/web-app-manifest-192x192.png",
      data: {
        url: data.url || "/",
      },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || "/";

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url === urlToOpen && "focus" in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

self.addEventListener("notificationclose", (event) => {
  console.log("Powiadomienie zostało zamknięte:", event.notification);
});
