export interface UserProfile {
  id: string;
  email: string;
  name: string;
  dailyRate: number | null;
}

export interface UpdateDailyRatePayload {
  dailyRate: number;
}