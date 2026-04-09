import type { UpdateDailyRatePayload, UserProfile } from "@/types/user";

export const userQueryKey = () => ["users", "me"] as const;
export const officeConfigQueryKey = () => ["users", "me", "office-config"] as const;
export const releaseNotesQueryKey = () => ["users", "me", "release-notes", "latest"] as const;

interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: string | null;
}

export interface OfficeConfig {
  latitude: number | null;
  longitude: number | null;
  radiusMeters: number;
  configured: boolean;
}

export interface ReleaseNotes {
  releaseId: string;
  releasedAt: string;
  title: string;
  highlights: string[];
}

async function usersRequest<T>(path: string, init: RequestInit): Promise<T> {
  const response = await fetch(`/api/v1/users${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
    cache: "no-store",
  });

  const payload = (await response.json()) as ApiResponse<T>;

  if (!response.ok || !payload.success || payload.data === null) {
    throw new Error(payload.error ?? "Request failed.");
  }

  return payload.data;
}

export function getMyProfile() {
  return usersRequest<UserProfile>("/me", { method: "GET" });
}

export function getMyOfficeConfig() {
  return usersRequest<OfficeConfig>("/me/office-config", { method: "GET" });
}

export function getMyLatestReleaseNotes() {
  return usersRequest<ReleaseNotes>("/me/release-notes/latest", { method: "GET" });
}

export function patchMyDailyRate(dailyRate: number) {
  const payload: UpdateDailyRatePayload = { dailyRate };

  return usersRequest<UserProfile>("/me/daily-rate", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function patchMySettings(settings: { autoClockOutEnabled?: boolean; autoClockOutAmTime?: string; autoClockOutPmTime?: string }) {
  return usersRequest<UserProfile>("/me/settings", {
    method: "PATCH",
    body: JSON.stringify(settings),
  });
}
