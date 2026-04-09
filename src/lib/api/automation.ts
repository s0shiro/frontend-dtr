interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: string | null;
}

export interface GeofenceEntryPayload {
  latitude: number;
  longitude: number;
  accuracy?: number;
  distanceMeters?: number | null;
  enteredAt?: string;
}

export async function sendGeofenceEntryReminder(payload: GeofenceEntryPayload): Promise<void> {
  const response = await fetch("/api/v1/automation/geofence-entry", {
    method: "POST",
    credentials: "include",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const parsed = (await response.json().catch(() => null)) as ApiResponse<{ queued: boolean }> | null;

  if (!response.ok || !parsed?.success) {
    throw new Error(parsed?.error ?? "Failed to queue geofence reminder.");
  }
}
