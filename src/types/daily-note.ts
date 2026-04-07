export interface DailyNote {
  id: string;
  userId: string;
  date: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDailyNotePayload {
  date: string;
  content: string;
}

export interface UpdateDailyNotePayload {
  content: string;
}
