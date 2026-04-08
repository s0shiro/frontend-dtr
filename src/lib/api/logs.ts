export const logsQueryKey = (month?: string) =>
  month ? (["logs", "me", month] as const) : (["logs", "me"] as const);

interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: string | null;
}

export interface ClockPayload {
  note?: string;
  location?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  };
}

export interface LogItem {
  id: string;
  userId: string;
  clockInAt: string;
  clockOutAt: string | null;
  note: string | null;
  clockInLocationTag: "On-site" | "Remote";
  clockOutLocationTag: "On-site" | "Remote" | null;
  clockInDistanceMeters: number | null;
  clockOutDistanceMeters: number | null;
}

export interface HolidayItem {
  date: string;
  name: string;
}

export interface ListLogsData {
  logs: LogItem[];
  holidays: HolidayItem[];
  monthSummary: {
    month: string;
    workingDays: number;
    requiredMinutes: number;
    requiredHours: number;
  };
}

export interface ClockInData {
  id: string;
  userId: string;
  clockInAt: string;
  note: string | null;
  clockInLocationTag: "On-site" | "Remote";
  clockInDistanceMeters: number | null;
}

export interface ClockOutData {
  id: string;
  userId: string;
  clockOutAt: string;
  note: string | null;
  clockOutLocationTag: "On-site" | "Remote";
  clockOutDistanceMeters: number | null;
}

export interface AdjustLogTimePayload {
  target: "clockIn" | "clockOut";
  /** Absolute ISO 8601 timestamp to set */
  targetTime: string;
}

export interface CreateManualLogPayload {
  clockInAt: string;
  clockOutAt: string;
  note?: string;
}

async function logsRequest<T>(path: string, init: RequestInit): Promise<T> {
  const response = await fetch(`/api/v1/logs${path}`, {
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

export function listLogs(month?: string) {
  const path = month ? `/?month=${encodeURIComponent(month)}` : "/";

  return logsRequest<ListLogsData>(path, { method: "GET" });
}

export function clockInLog(payload: ClockPayload) {
  return logsRequest<ClockInData>("/clock-in", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function clockOutLog(payload: ClockPayload) {
  return logsRequest<ClockOutData>("/clock-out", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function deleteLog(id: string) {
  return logsRequest<{ id: string }>(`/${id}`, {
    method: "DELETE",
  });
}

export function adjustLogTime(id: string, payload: AdjustLogTimePayload) {
  return logsRequest<LogItem>(`/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function createManualLog(payload: CreateManualLogPayload) {
  return logsRequest<LogItem>("/manual", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
