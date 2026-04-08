'use client';

import { useMemo, useState } from 'react';
import { BellRing } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  clockInLog,
  clockOutLog,
  listLogs,
  logsQueryKey,
  type ClockPayload,
  type LogItem,
} from '@/lib/api/logs';
import { getCurrentLocation, hasOfficeCoordinates } from '@/lib/geolocation';

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Something went wrong.';
}

function getOpenLog(logs: LogItem[]) {
  return logs.find((log) => log.clockOutAt === null) ?? null;
}

export function ClockWidget() {
  const queryClient = useQueryClient();
  const [note, setNote] = useState('');
  const [locationError, setLocationError] = useState<string | null>(null);

  const logsQuery = useQuery({
    queryKey: logsQueryKey(),
    queryFn: () => listLogs(),
    refetchInterval: 60000,
  });

  const clockInMutation = useMutation({
    mutationFn: clockInLog,
    onSuccess: async () => {
      setNote('');
      await queryClient.invalidateQueries({ queryKey: logsQueryKey() });
    },
  });

  const clockOutMutation = useMutation({
    mutationFn: clockOutLog,
    onSuccess: async () => {
      setNote('');
      await queryClient.invalidateQueries({ queryKey: logsQueryKey() });
    },
  });

  const activeLog = useMemo(() => {
    return getOpenLog(logsQuery.data?.logs ?? []);
  }, [logsQuery.data?.logs]);

  const isPending = logsQuery.isFetching || clockInMutation.isPending || clockOutMutation.isPending;
  const hasActiveLog = Boolean(activeLog);

  const notePayload = useMemo(() => {
    const trimmed = note.trim();
    if (!trimmed) {
      return {};
    }

    return { note: trimmed };
  }, [note]);

  async function buildClockPayload(): Promise<ClockPayload> {
    const location = await getCurrentLocation();
    setLocationError(null);

    return {
      ...notePayload,
      location,
    };
  }

  async function handleClockAction(action: 'in' | 'out') {
    try {
      const payload = await buildClockPayload();

      if (action === 'in') {
        await clockInMutation.mutateAsync(payload);
      } else {
        await clockOutMutation.mutateAsync(payload);
      }
    } catch (error) {
      setLocationError(getErrorMessage(error));
    }
  }

  const actionError = clockInMutation.error ?? clockOutMutation.error;
  const errorMessage = locationError
    ?? (actionError
      ? getErrorMessage(actionError)
      : logsQuery.error
        ? getErrorMessage(logsQuery.error)
        : null);

  const activeSince = activeLog
    ? new Date(activeLog.clockInAt).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  const latestLog = logsQuery.data?.logs[0];
  const latestLocationTag = latestLog?.clockOutLocationTag ?? latestLog?.clockInLocationTag ?? null;
  const latestDistance = latestLog?.clockOutDistanceMeters ?? latestLog?.clockInDistanceMeters ?? null;

  async function handleEnableNotifications() {
    if (typeof window === 'undefined' || !("Notification" in window)) {
      setLocationError('Notifications are not supported on this browser.');
      return;
    }

    const permission = await Notification.requestPermission();

    if (permission !== 'granted') {
      setLocationError('Please allow notifications to receive geofence reminders.');
      return;
    }

    setLocationError(null);
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Optional note"
          className="w-full md:w-[220px]"
          disabled={isPending}
        />

        <Button
          onClick={() => handleClockAction('in')}
          disabled={isPending || hasActiveLog}
        >
          Clock In
        </Button>

        <Button
          variant="outline"
          onClick={() => handleClockAction('out')}
          disabled={isPending || !hasActiveLog}
        >
          Clock Out
        </Button>

        <Button
          variant="outline"
          onClick={handleEnableNotifications}
          className="gap-1"
        >
          <BellRing className="h-3 w-3" />
          Reminders
        </Button>

        <span className="ml-auto text-xs text-light">
          {isPending ? 'Syncing...' : hasActiveLog ? `Active since ${activeSince}` : 'Not clocked in'}
        </span>
      </div>

      <div className="flex items-center justify-between gap-2 text-[10px] text-lighter">
        <span>
          {latestLocationTag
            ? `Last tap: ${latestLocationTag}${latestDistance !== null ? ` (${latestDistance}m from office)` : ''}`
            : 'No location-tagged taps yet.'}
        </span>
        <span>
          {hasOfficeCoordinates() ? 'Geofence active' : 'Set NEXT_PUBLIC_OFFICE_* to enable on-site detection'}
        </span>
      </div>

      {errorMessage ? (
        <p className="text-xs text-destructive">{errorMessage}</p>
      ) : null}
    </div>
  );
}