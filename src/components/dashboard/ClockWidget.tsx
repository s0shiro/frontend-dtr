'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  clockInLog,
  clockOutLog,
  listLogs,
  logsQueryKey,
  type LogItem,
} from '@/lib/api/logs';

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

  const logsQuery = useQuery({
    queryKey: logsQueryKey(),
    queryFn: () => listLogs(),
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

  const actionError = clockInMutation.error ?? clockOutMutation.error;
  const errorMessage = actionError
    ? getErrorMessage(actionError)
    : logsQuery.error
      ? getErrorMessage(logsQuery.error)
      : null;

  const activeSince = activeLog
    ? new Date(activeLog.clockInAt).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

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
          onClick={() => clockInMutation.mutate(notePayload)}
          disabled={isPending || hasActiveLog}
        >
          Clock In
        </Button>

        <Button
          variant="outline"
          onClick={() => clockOutMutation.mutate(notePayload)}
          disabled={isPending || !hasActiveLog}
        >
          Clock Out
        </Button>

        <span className="ml-auto text-xs text-light">
          {isPending ? 'Syncing...' : hasActiveLog ? `Active since ${activeSince}` : 'Not clocked in'}
        </span>
      </div>

      {errorMessage ? (
        <p className="text-xs text-destructive">{errorMessage}</p>
      ) : null}
    </div>
  );
}