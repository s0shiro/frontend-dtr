import {
  DailyNote,
  CreateDailyNotePayload,
  UpdateDailyNotePayload,
} from "../../types/daily-note";

export const dailyNotesQueryKey = (month?: string) =>
  month ? (["daily-notes", "me", month] as const) : (["daily-notes", "me"] as const);

export const dailyNoteQueryKey = (date: string) =>
  ["daily-note", "me", date] as const;

interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: string | null;
}

export interface ListDailyNotesData {
  notes: DailyNote[];
}

async function dailyNotesRequest<T>(
  path: string,
  init: RequestInit
): Promise<T> {
  const response = await fetch(`/api/v1/daily-notes${path}`, {
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

export function listDailyNotes(month: string) {
  const path = `/?month=${encodeURIComponent(month)}`;
  return dailyNotesRequest<ListDailyNotesData>(path, { method: "GET" });
}

export function getDailyNote(date: string) {
  const path = `/${encodeURIComponent(date)}`;
  return dailyNotesRequest<DailyNote>(path, { method: "GET" });
}

export function createDailyNote(payload: CreateDailyNotePayload) {
  return dailyNotesRequest<DailyNote>("/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateDailyNote(
  id: string,
  payload: UpdateDailyNotePayload
) {
  return dailyNotesRequest<DailyNote>(`/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deleteDailyNote(id: string) {
  return dailyNotesRequest<{ id: string }>(`/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}
