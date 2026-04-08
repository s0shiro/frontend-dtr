"use client";

import { useEffect } from "react";

import { evaluateOfficeGeofence, hasOfficeCoordinates } from "@/lib/geolocation";

const ENTRY_NOTIFICATION_KEY = "dtr:last-geofence-inside";
const CLOCK_IN_PROMPT_KEY = "dtr:pending-clock-in-prompt";

async function showEntryNotification() {
  if (!("Notification" in window) || Notification.permission !== "granted") {
    return;
  }

  if (!("serviceWorker" in navigator)) {
    new Notification("You're on-site", {
      body: "You just entered the office perimeter. Don't forget to clock in.",
    });
    return;
  }

  const registration = await navigator.serviceWorker.getRegistration();

  if (registration) {
    await registration.showNotification("You're on-site", {
      body: "You just entered the office perimeter. Don't forget to clock in.",
      tag: "dtr-geofence-entry",
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
    });
    return;
  }

  // Fallback for browsers where service worker registration is unavailable.
  new Notification("You're on-site", {
    body: "You just entered the office perimeter. Don't forget to clock in.",
  });
}

export function PwaRegistration() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) {
      return;
    }

    if (process.env.NODE_ENV !== "production") {
      const unregisterInDev = async () => {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((registration) => registration.unregister()));
      };

      void unregisterInDev();
      return;
    }

    const registerServiceWorker = async () => {
      try {
        await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      } catch {
        // Ignore registration failures during local development or unsupported browsers.
      }
    };

    void registerServiceWorker();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (!("geolocation" in navigator)) {
      return;
    }

    if (!hasOfficeCoordinates()) {
      return;
    }

    let previousInside = sessionStorage.getItem(ENTRY_NOTIFICATION_KEY) === "1";

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const evaluation = evaluateOfficeGeofence({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });

        if (evaluation.inside && !previousInside) {
          sessionStorage.setItem(CLOCK_IN_PROMPT_KEY, "1");
          window.dispatchEvent(new CustomEvent("dtr:geofence-entry"));
          void showEntryNotification();
        }

        previousInside = evaluation.inside;
        sessionStorage.setItem(ENTRY_NOTIFICATION_KEY, evaluation.inside ? "1" : "0");
      },
      () => {
        // Ignore noisy geolocation errors while app remains usable.
      },
      {
        enableHighAccuracy: false,
        timeout: 15_000,
        maximumAge: 30_000,
      },
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  return null;
}
