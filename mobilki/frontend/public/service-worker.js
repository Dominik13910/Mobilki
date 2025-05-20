self.addEventListener("install", function (event) {
  console.log("Service Worker installed");
  self.skipWaiting();
});

self.addEventListener("activate", function (event) {
  console.log("Service Worker activated");
});

self.addEventListener("push", function (event) {
  const data = event.data?.json() || {};
  const title = data.title || "Powiadomienie";
  const body = data.body || "Masz nowe powiadomienie";

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: "/icon-192x192.png",
    })
  );
});
