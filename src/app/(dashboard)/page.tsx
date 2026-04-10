"use client";

import { useMemo, useState, useSyncExternalStore } from 'react';
import { BellRing } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { endOfWeek, format, isToday, startOfWeek } from 'date-fns';

import { ClockWidget } from '@/components/dashboard/ClockWidget';
import { DailyMotivationCard } from '@/components/dashboard/DailyMotivationCard';
import { SalaryWidget } from '@/components/dashboard/SalaryWidget';
import { ReleaseNotesDialog } from '@/components/layout/ReleaseNotesDialog';
import { Button } from '@/components/ui/button';
import { useSession } from '@/lib/auth-client';
import { listLogs, logsQueryKey } from '@/lib/api/logs';

function toHoursLabel(minutes: number): string {
  return `${(minutes / 60).toFixed(1)}h`;
}

function toDurationLabel(minutes: number): string {
  const safeMinutes = Math.max(0, Math.floor(minutes));
  const hours = Math.floor(safeMinutes / 60);
  const remainingMinutes = safeMinutes % 60;

  if (hours === 0) {
    return `${remainingMinutes}m`;
  }

  return `${hours}h ${remainingMinutes}m`;
}

function getGreetingLabel(now: Date): string {
  const hour = now.getHours();

  if (hour < 12) {
    return 'Good morning';
  }

  if (hour < 18) {
    return 'Good afternoon';
  }

  return 'Good evening';
}

export default function DashboardPage() {
  const [reminderMessage, setReminderMessage] = useState<string | null>(null);
  const session = useSession();
  const logsQuery = useQuery({
    queryKey: logsQueryKey(),
    queryFn: () => listLogs(),
    staleTime: 30_000,
    refetchInterval: 60000,
  });

  const summary = useMemo(() => {
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
    const logs = logsQuery.data?.logs ?? [];

    let todayMinutes = 0;
    let weekMinutes = 0;
    let todaySessions = 0;
    let weekSessions = 0;

    for (const log of logs) {
      const clockIn = new Date(log.clockInAt);

      if (Number.isNaN(clockIn.getTime())) {
        continue;
      }

      const clockOut = log.clockOutAt ? new Date(log.clockOutAt) : now;
      const end = Number.isNaN(clockOut.getTime()) ? now : clockOut;
      const elapsedMinutes = Math.max(0, Math.floor((end.getTime() - clockIn.getTime()) / 60000));

      if (isToday(clockIn)) {
        todayMinutes += elapsedMinutes;
        todaySessions += 1;
      }

      if (clockIn >= weekStart && clockIn <= weekEnd) {
        weekMinutes += elapsedMinutes;
        weekSessions += 1;
      }
    }

    return {
      todayMinutes,
      weekMinutes,
      todaySessions,
      weekSessions,
      weeklyTargetMinutes: 40 * 60,
      weekRangeLabel: `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d')}`,
    };
  }, [logsQuery.data?.logs]);

  const weeklyProgress = Math.min(
    100,
    Math.round((summary.weekMinutes / Math.max(1, summary.weeklyTargetMinutes)) * 100),
  );

  const isClient = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const greetingName = isClient
    ? session.data?.user?.name?.trim() ?? session.data?.user?.email?.split('@')[0] ?? 'there'
    : 'there';
  const greetingLabel = isClient ? getGreetingLabel(new Date()) : 'Hello';

  async function handleEnableReminders() {
    if (typeof window === 'undefined' || !("Notification" in window)) {
      setReminderMessage('Notifications are not supported on this browser.');
      return;
    }

    const permission = await Notification.requestPermission();

    if (permission !== 'granted') {
      setReminderMessage('Please allow notifications for geofence reminders.');
      return;
    }

    setReminderMessage('Reminders enabled. We will notify you when you enter office radius.');
  }

  return (
    <>
      <ReleaseNotesDialog />
      <div className="flex-1 w-full p-4 md:p-8 max-w-[1200px] mx-auto space-y-8">
        <header className="flex flex-col gap-6">
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-normal tracking-tight text-foreground">
                  {greetingLabel}, {greetingName}
                </h1>
                <span className="text-[10px] font-mono tracking-wider px-1.5 py-0.5 rounded outline outline-1 outline-border bg-surface-200 text-light uppercase">
                  Dashboard
                </span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={() => void handleEnableReminders()}
              className="px-2 sm:px-3"
              aria-label="Enable reminders"
            >
              <BellRing data-icon="inline-start" />
              <span className="hidden sm:inline">Reminders</span>
            </Button>
          </div>

          {reminderMessage ? <p className="text-[10px] text-lighter">{reminderMessage}</p> : null}
        </header>

        <section className="w-full border border-control bg-surface-100 rounded-md shadow-sm p-4 md:p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-foreground">today</p>
            <span className="text-[10px] font-mono tracking-wider px-2 py-1 rounded bg-surface-200 text-light uppercase">
              digital time record
            </span>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_1fr] gap-6 items-start">
            <ClockWidget />
            <SalaryWidget logs={logsQuery.data?.logs ?? []} />
          </div>

          <div className="border-t border-control pt-3 text-[10px] text-lighter">
            Tip: use this screen as your daily start and end touchpoint.
          </div>
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-[1.5fr_1fr] gap-4">
          <div className="w-full border border-control bg-surface-100 rounded-md shadow-sm p-4 md:p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-foreground">weekly progress</p>
              <span className="text-[10px] font-mono tracking-wider px-2 py-1 rounded bg-surface-200 text-light uppercase">
                week {summary.weekRangeLabel}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-surface-100 border border-control p-4 rounded-md shadow-sm h-32 flex flex-col justify-between">
                <div className="text-[10px] font-mono uppercase tracking-wider text-light">today hours</div>
                <div className="text-2xl text-foreground tabular-nums">{toHoursLabel(summary.todayMinutes)}</div>
                <div className="text-xs text-light">{summary.todaySessions} session(s) logged today</div>
              </div>

              <div className="bg-surface-100 border border-control p-4 rounded-md shadow-sm h-32 flex flex-col justify-between">
                <div className="text-[10px] font-mono uppercase tracking-wider text-light">week hours</div>
                <div className="text-2xl text-foreground tabular-nums">{toHoursLabel(summary.weekMinutes)}</div>
                <div className="text-xs text-light">{summary.weekSessions} session(s) this week</div>
              </div>

              <div className="bg-surface-100 border border-control p-4 rounded-md shadow-sm h-32 flex flex-col justify-between">
                <div className="text-[10px] font-mono uppercase tracking-wider text-light">weekly target</div>
                <div className="text-2xl text-foreground tabular-nums">
                  {toHoursLabel(summary.weeklyTargetMinutes)}
                </div>
                <div className="text-xs text-light">standard baseline for full-time week</div>
              </div>

              <div className="bg-surface-100 border border-control p-4 rounded-md shadow-sm h-32 flex flex-col justify-between">
                <div className="text-[10px] font-mono uppercase tracking-wider text-light">remaining</div>
                <div className="text-2xl text-foreground tabular-nums">
                  {toDurationLabel(summary.weeklyTargetMinutes - summary.weekMinutes)}
                </div>
                <div className="text-xs text-light">{weeklyProgress}% of weekly target completed</div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="h-1.5 w-full rounded-full bg-surface-200 overflow-hidden">
                <div
                  className="h-full bg-brand transition-all duration-500"
                  style={{ width: `${weeklyProgress}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[10px] text-lighter">
                <span>
                  {logsQuery.isFetching ? 'Refreshing summary...' : 'Summary updates from your latest clock activity.'}
                </span>
                <span>
                  {logsQuery.isError ? 'Could not load logs.' : `${summary.weekSessions} entries in current week`}
                </span>
              </div>
            </div>
          </div>

          <DailyMotivationCard />
        </section>
      </div>
    </>
  );
}
