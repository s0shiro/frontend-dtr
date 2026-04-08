export interface DeviceLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export interface GeofenceEvaluation {
  distanceMeters: number | null;
  inside: boolean;
}

const OFFICE_LATITUDE = Number(process.env.NEXT_PUBLIC_OFFICE_LATITUDE ?? "");
const OFFICE_LONGITUDE = Number(process.env.NEXT_PUBLIC_OFFICE_LONGITUDE ?? "");
const OFFICE_RADIUS_METERS = Number(process.env.NEXT_PUBLIC_OFFICE_RADIUS_METERS ?? "50");

export function hasOfficeCoordinates(): boolean {
  return Number.isFinite(OFFICE_LATITUDE) && Number.isFinite(OFFICE_LONGITUDE);
}

function degreesToRadians(value: number): number {
  return (value * Math.PI) / 180;
}

export function getDistanceMeters(from: DeviceLocation): number | null {
  if (!hasOfficeCoordinates()) {
    return null;
  }

  const earthRadiusMeters = 6371e3;
  const dLat = degreesToRadians(OFFICE_LATITUDE - from.latitude);
  const dLon = degreesToRadians(OFFICE_LONGITUDE - from.longitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(degreesToRadians(from.latitude)) *
      Math.cos(degreesToRadians(OFFICE_LATITUDE)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(earthRadiusMeters * c);
}

export function evaluateOfficeGeofence(location: DeviceLocation): GeofenceEvaluation {
  const distanceMeters = getDistanceMeters(location);

  if (distanceMeters === null) {
    return {
      distanceMeters,
      inside: false,
    };
  }

  return {
    distanceMeters,
    inside: distanceMeters <= OFFICE_RADIUS_METERS,
  };
}

export function getCurrentLocation(options?: PositionOptions): Promise<DeviceLocation> {
  if (typeof window === "undefined" || !("geolocation" in navigator)) {
    return Promise.reject(new Error("Geolocation is not supported on this device."));
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: Number.isFinite(position.coords.accuracy)
            ? position.coords.accuracy
            : undefined,
        });
      },
      () => {
        reject(new Error("Location permission is required before clocking in/out."));
      },
      {
        enableHighAccuracy: true,
        timeout: 12_000,
        maximumAge: 0,
        ...options,
      },
    );
  });
}
