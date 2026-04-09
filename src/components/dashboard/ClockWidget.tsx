'use client';

import { useEffect, useMemo, useState } from 'react';
import { MapPin } from 'lucide-react';
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
import { LiveProximityMap } from '@/components/dashboard/LiveProximityMap';
import { getMyOfficeConfig, officeConfigQueryKey } from '@/lib/api/users';
import { evaluateOfficeGeofence, getCurrentLocation, hasOfficeCoordinates } from '@/lib/geolocation';

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Something went wrong.';
}

function getOpenLog(logs: LogItem[]) {
  return logs.find((log) => log.clockOutAt === null) ?? null;
}

const CLOCK_IN_PROMPT_KEY = 'dtr:pending-clock-in-prompt';

function getInitialGeoPromptState(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  return sessionStorage.getItem(CLOCK_IN_PROMPT_KEY) === '1';
}

export function ClockWidget() {
  const queryClient = useQueryClient();
  const [note, setNote] = useState('');
  const [locationError, setLocationError] = useState<string | null>(null);
  const [showGeoPrompt, setShowGeoPrompt] = useState(getInitialGeoPromptState);
  const [liveProximity, setLiveProximity] = useState<{
    latitude: number;
    longitude: number;
    accuracy?: number;
    distanceMeters: number | null;
    inside: boolean;
  } | null>(null);

  const logsQuery = useQuery({
    queryKey: logsQueryKey(),
    queryFn: () => listLogs(),
    refetchInterval: 60000,
  });

  const officeConfigQuery = useQuery({
    queryKey: officeConfigQueryKey(),
    queryFn: () => getMyOfficeConfig(),
    staleTime: 15_000,
    refetchInterval: 30_000,
  });

  const clockInMutation = useMutation({
    mutationFn: clockInLog,
    onSuccess: async () => {
      setNote('');
      setShowGeoPrompt(false);
      sessionStorage.removeItem(CLOCK_IN_PROMPT_KEY);
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

  const officeCoordinates = useMemo(() => {
    const data = officeConfigQuery.data;

    if (!data?.configured || data.latitude === null || data.longitude === null) {
      return null;
    }

    return {
      latitude: data.latitude,
      longitude: data.longitude,
      radiusMeters: data.radiusMeters,
    };
  }, [officeConfigQuery.data]);

  const officeReady = hasOfficeCoordinates(officeCoordinates);

  useEffect(() => {
    const onGeofenceEntry = () => {
      setShowGeoPrompt(true);
    };

    window.addEventListener('dtr:geofence-entry', onGeofenceEntry);

    return () => {
      window.removeEventListener('dtr:geofence-entry', onGeofenceEntry);
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !("geolocation" in navigator) || !officeReady) {
      return;
    }

    const applyPosition = (position: GeolocationPosition) => {
      const location = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: Number.isFinite(position.coords.accuracy) ? position.coords.accuracy : undefined,
      };

      const evaluation = evaluateOfficeGeofence(location, officeCoordinates);

      setLiveProximity({
        ...location,
        distanceMeters: evaluation.distanceMeters,
        inside: evaluation.inside,
      });
    };

    // Seed quickly so panel does not wait for watch callback timing.
    navigator.geolocation.getCurrentPosition(
      applyPosition,
      () => {
        // Permission can still be granted later; watch will continue listening.
      },
      {
        enableHighAccuracy: false,
        maximumAge: 20_000,
        timeout: 15_000,
      },
    );

    const watchId = navigator.geolocation.watchPosition(
      applyPosition,
      () => {
        // Ignore intermittent location errors and keep previous data.
      },
      {
        enableHighAccuracy: false,
        maximumAge: 20_000,
        timeout: 15_000,
      },
    );

    const onVisibilityChange = () => {
      if (document.visibilityState !== 'visible') {
        return;
      }

      navigator.geolocation.getCurrentPosition(
        applyPosition,
        () => {
          // Ignore refresh errors.
        },
        {
          enableHighAccuracy: false,
          maximumAge: 10_000,
          timeout: 10_000,
        },
      );
    };

    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      navigator.geolocation.clearWatch(watchId);
    };
  }, [officeCoordinates, officeReady]);

  async function handleGeoPromptClockIn() {
    await handleClockAction('in');
    setShowGeoPrompt(false);
    sessionStorage.removeItem(CLOCK_IN_PROMPT_KEY);
  }

  function dismissGeoPrompt() {
    setShowGeoPrompt(false);
    sessionStorage.removeItem(CLOCK_IN_PROMPT_KEY);
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

        <span className="ml-auto text-xs text-light inline-flex items-center gap-1">
          {isPending ? (
            'Syncing...'
          ) : hasActiveLog ? (
            <>
              <span className="relative inline-flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-brand" />
              </span>
              <span>{`Active since ${activeSince}`}</span>
            </>
          ) : (
            'Not clocked in'
          )}
        </span>
      </div>

      {showGeoPrompt && !hasActiveLog ? (
        <div className="rounded-md border border-brand/40 bg-surface-200 px-2 py-2 text-xs text-light flex items-center justify-between gap-2">
          <span>You entered the office radius. Ready to clock in?</span>
          <div className="flex items-center gap-2">
            <Button className="h-[28px]" onClick={() => void handleGeoPromptClockIn()} disabled={isPending}>
              Clock in now
            </Button>
            <Button variant="outline" className="h-[28px]" onClick={dismissGeoPrompt} disabled={isPending}>
              Dismiss
            </Button>
          </div>
        </div>
      ) : null}

      <div className="rounded-md border border-control bg-surface-100 p-2 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider text-light">
            <MapPin className="h-3 w-3" />
            Live proximity
          </div>
          <span className={officeReady ? 'text-[10px] text-brand' : 'text-[10px] text-lighter'}>
            {officeReady ? 'Geofence active' : 'Geofence not configured'}
          </span>
        </div>

        {officeCoordinates ? (
          <LiveProximityMap
            officeLocation={{
              latitude: officeCoordinates.latitude,
              longitude: officeCoordinates.longitude,
            }}
            userLocation={liveProximity
              ? {
                  latitude: liveProximity.latitude,
                  longitude: liveProximity.longitude,
                  accuracy: liveProximity.accuracy,
                }
              : null}
          />
        ) : (
          <p className="text-[10px] text-lighter">
            Office coordinates are not configured on the server.
          </p>
        )}

      </div>

      {errorMessage ? (
        <p className="text-xs text-destructive">{errorMessage}</p>
      ) : null}
    </div>
  );
}