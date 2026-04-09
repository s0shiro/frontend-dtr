export interface DeviceLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export interface GeofenceEvaluation {
  distanceMeters: number | null;
  inside: boolean;
}

export interface OfficeCoordinates {
  latitude: number;
  longitude: number;
  radiusMeters: number;
}

export function hasOfficeCoordinates(officeCoordinates: OfficeCoordinates | null): boolean {
  return Boolean(officeCoordinates);
}

function degreesToRadians(value: number): number {
  return (value * Math.PI) / 180;
}

export function getDistanceMeters(
  from: DeviceLocation,
  officeCoordinates: OfficeCoordinates | null,
): number | null {
  if (!officeCoordinates) {
    return null;
  }

  const earthRadiusMeters = 6371e3;
  const dLat = degreesToRadians(officeCoordinates.latitude - from.latitude);
  const dLon = degreesToRadians(officeCoordinates.longitude - from.longitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(degreesToRadians(from.latitude)) *
      Math.cos(degreesToRadians(officeCoordinates.latitude)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(earthRadiusMeters * c);
}

export function evaluateOfficeGeofence(
  location: DeviceLocation,
  officeCoordinates: OfficeCoordinates | null,
): GeofenceEvaluation {
  const distanceMeters = getDistanceMeters(location, officeCoordinates);

  if (distanceMeters === null || officeCoordinates === null) {
    return {
      distanceMeters,
      inside: false,
    };
  }

  return {
    distanceMeters,
    inside: distanceMeters <= officeCoordinates.radiusMeters,
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
