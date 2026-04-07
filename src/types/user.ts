export interface UserProfile {
  id: string;
  email: string;
  name: string;
  dailyRate: number | null;
  autoClockOutEnabled: boolean;
  autoClockOutAmTime: string | null;
  autoClockOutPmTime: string | null;
}

export interface UpdateDailyRatePayload {
  dailyRate: number;
}