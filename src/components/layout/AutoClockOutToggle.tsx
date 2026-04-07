"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getMyProfile, patchMySettings, userQueryKey } from "@/lib/api/users";
import { UserProfile } from "@/types/user";
import { useState, useEffect } from "react";
import { TimePickerPopover } from "@/components/history/TimePickerPopover";

function createDummyIso(timeHHmm: string): string {
  if (!timeHHmm) return new Date().toISOString();
  const [h, m] = timeHHmm.split(":");
  const d = new Date();
  d.setHours(Number(h), Number(m), 0, 0);
  return d.toISOString();
}

function extractTimeHHmm(isoString: string): string {
  const d = new Date(isoString);
  const h = d.getHours().toString().padStart(2, "0");
  const m = d.getMinutes().toString().padStart(2, "0");
  return `${h}:${m}`;
}

function formatTo12h(timeHHmm: string) {
  if (!timeHHmm) return "--:--";
  const [hStr, mStr] = timeHHmm.split(":");
  let h = parseInt(hStr, 10);
  const period = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${mStr} ${period}`;
}

export function AutoClockOutToggle() {
  const queryClient = useQueryClient();

  // Fetch the user's profile to get the autoClockOutEnabled state
  const { data: userProfile, isLoading } = useQuery({
    queryKey: userQueryKey(),
    queryFn: getMyProfile,
  });

  const mutation = useMutation({
    mutationFn: (newSettings: { autoClockOutEnabled?: boolean; autoClockOutAmTime?: string; autoClockOutPmTime?: string }) =>
      patchMySettings(newSettings),
    onMutate: async (newSettings) => {
      await queryClient.cancelQueries({ queryKey: userQueryKey() });

      const previousProfile = queryClient.getQueryData<UserProfile>(userQueryKey());

      if (previousProfile) {
        queryClient.setQueryData<UserProfile>(userQueryKey(), {
          ...previousProfile,
          ...newSettings,
        } as UserProfile);
      }

      return { previousProfile };
    },
    onError: (_err, _newSettings, context) => {
      if (context?.previousProfile) {
        queryClient.setQueryData(userQueryKey(), context.previousProfile);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: userQueryKey() });
    },
  });

  const enabled = userProfile?.autoClockOutEnabled ?? false;
  const isPending = isLoading || mutation.isPending;

  const [amTime, setAmTime] = useState("");
  const [pmTime, setPmTime] = useState("");

  useEffect(() => {
    if (userProfile) {
      setAmTime(userProfile.autoClockOutAmTime || "12:00");
      setPmTime(userProfile.autoClockOutPmTime || "18:00");
    }
  }, [userProfile]);

  const handleTimeConfirm = (type: "AM" | "PM", isoString: string) => {
    const value = extractTimeHHmm(isoString);
    if (type === "AM") {
      setAmTime(value);
      if (value !== userProfile?.autoClockOutAmTime) {
        mutation.mutate({ autoClockOutAmTime: value });
      }
    } else {
      setPmTime(value);
      if (value !== userProfile?.autoClockOutPmTime) {
        mutation.mutate({ autoClockOutPmTime: value });
      }
    }
  };

  return (
    <div className="flex items-center gap-2 mr-2 border-r border-control pr-3">
      {enabled && (
        <div className="flex items-center gap-2 mr-2">
          {/* AM Time Display & Editor */}
          <div className="flex items-center gap-1.5 bg-surface-100 border border-control rounded pl-2 h-[28px]">
            <span className="text-[11px] font-mono tabular-nums text-foreground">
              {formatTo12h(amTime)}
            </span>
            <div className="scale-90 origin-right">
              <TimePickerPopover
                currentTime={createDummyIso(amTime)}
                label="AM Target"
                onConfirm={(iso) => handleTimeConfirm("AM", iso)}
              />
            </div>
          </div>
          
          {/* PM Time Display & Editor */}
          <div className="flex items-center gap-1.5 bg-surface-100 border border-control rounded pl-2 h-[28px]">
            <span className="text-[11px] font-mono tabular-nums text-foreground">
              {formatTo12h(pmTime)}
            </span>
            <div className="scale-90 origin-right">
              <TimePickerPopover
                currentTime={createDummyIso(pmTime)}
                label="PM Target"
                onConfirm={(iso) => handleTimeConfirm("PM", iso)}
              />
            </div>
          </div>
        </div>
      )}
      <span className="hidden sm:inline text-xs text-light" id="auto-clock-out-label">
        Auto Clock-Out
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        aria-labelledby="auto-clock-out-label"
        onClick={() => mutation.mutate({ autoClockOutEnabled: !enabled })}
        disabled={isPending}
        className={`relative inline-flex h-[20px] w-[36px] items-center rounded-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${
          enabled ? "bg-surface-300 border border-control" : "bg-surface-200 border border-control"
        }`}
      >
        <span
          className={`pointer-events-none block h-3 w-3 rounded-sm bg-foreground ring-0 transition-transform ${
            enabled ? "translate-x-[20px] bg-foreground" : "translate-x-[3px] bg-light"
          }`}
        />
      </button>
    </div>
  );
}
