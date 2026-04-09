"use client";

import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { sendGeofenceEntryReminder } from "@/lib/api/automation";
import { useSession } from "@/lib/auth-client";
import { getMyOfficeConfig, officeConfigQueryKey } from "@/lib/api/users";
import { evaluateOfficeGeofence, hasOfficeCoordinates } from "@/lib/geolocation";

const ENTRY_NOTIFICATION_KEY = "dtr:last-geofence-inside";
const CLOCK_IN_PROMPT_KEY = "dtr:pending-clock-in-prompt";
const LAST_REMOTE_REMINDER_KEY = "dtr:last-remote-geofence-reminder";
const REMOTE_REMINDER_COOLDOWN_MS = 15 * 60 * 1000;

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

function shouldSendRemoteReminder(nowMs: number): boolean {
  const previous = Number(sessionStorage.getItem(LAST_REMOTE_REMINDER_KEY) ?? "0");

  if (Number.isNaN(previous) || nowMs - previous >= REMOTE_REMINDER_COOLDOWN_MS) {
    sessionStorage.setItem(LAST_REMOTE_REMINDER_KEY, String(nowMs));
    return true;
  }

  return false;
}

export function PwaRegistration() {
  const session = useSession();
  const isAuthenticated = Boolean(session.data?.user);

  const officeConfigQuery = useQuery({
    queryKey: officeConfigQueryKey(),
    queryFn: () => getMyOfficeConfig(),
    staleTime: 15_000,
    refetchInterval: 30_000,
    enabled: isAuthenticated,
  });

  const officeCoordinates = useMemo(() => {
    const data = officeConfigQuery.data;

    if (!data?.configured || data.latitude === null || data.longitude === null) {
      return null;
    }

    return {
      latitude: data.latitude,
      longitude: data.longitude,
      radiusMeters: data.radiusMeters,
    };
  }, [officeConfigQuery.data]);

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

    if (!hasOfficeCoordinates(officeCoordinates)) {
      return;
    }

    let previousInside = sessionStorage.getItem(ENTRY_NOTIFICATION_KEY) === "1";

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const evaluation = evaluateOfficeGeofence(
          {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          },
          officeCoordinates,
        );

        if (evaluation.inside && !previousInside) {
          sessionStorage.setItem(CLOCK_IN_PROMPT_KEY, "1");
          window.dispatchEvent(new CustomEvent("dtr:geofence-entry"));
          void showEntryNotification();

          const nowMs = Date.now();
          if (shouldSendRemoteReminder(nowMs)) {
            void sendGeofenceEntryReminder({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: Number.isFinite(position.coords.accuracy)
                ? position.coords.accuracy
                : undefined,
              distanceMeters: evaluation.distanceMeters,
              enteredAt: new Date(nowMs).toISOString(),
            }).catch(() => {
              // Keep geofence UX resilient even when webhook integration is unavailable.
            });
          }
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
  }, [officeCoordinates]);

  return null;
}
