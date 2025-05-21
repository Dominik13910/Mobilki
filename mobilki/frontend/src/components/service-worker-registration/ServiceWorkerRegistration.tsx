"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/service-worker.js")
        .then((reg) => {
          console.log("Service Worker zarejestrowany:", reg);
        })
        .catch((err) => {
          console.error("Błąd rejestracji SW:", err);
        });
    }
  }, []);

  return null;
}
