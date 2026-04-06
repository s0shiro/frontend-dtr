"use client";

import { useState } from "react";
import { Clock } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select } from "@/components/ui/select";

interface TimePickerPopoverProps {
  /** ISO string of the current timestamp */
  currentTime: string;
  label: string;
  disabled?: boolean;
  /** Called with the absolute ISO target timestamp */
  onConfirm: (targetTime: string) => void;
}

function padTwo(n: number): string {
  return String(n).padStart(2, "0");
}

/** Convert 24h hour to 12h display hour (1-12) */
function to12h(hour24: number): number {
  const h = hour24 % 12;
  return h === 0 ? 12 : h;
}

/** Convert 12h hour + period back to 24h hour */
function to24h(hour12: number, period: "AM" | "PM"): number {
  if (period === "AM") {
    return hour12 === 12 ? 0 : hour12;
  } else {
    return hour12 === 12 ? 12 : hour12 + 12;
  }
}

export function TimePickerPopover({
  currentTime,
  label,
  disabled = false,
  onConfirm,
}: TimePickerPopoverProps) {
  const current = new Date(currentTime);

  function initState() {
    const h24 = current.getHours();
    return {
      hour12: to12h(h24),
      minute: current.getMinutes(),
      period: h24 < 12 ? ("AM" as const) : ("PM" as const),
    };
  }

  const [open, setOpen] = useState(false);
  const [hour12, setHour12] = useState(initState().hour12);
  const [minute, setMinute] = useState(initState().minute);
  const [period, setPeriod] = useState<"AM" | "PM">(initState().period);

  function handleOpen(next: boolean) {
    if (next) {
      const s = initState();
      setHour12(s.hour12);
      setMinute(s.minute);
      setPeriod(s.period);
    }
    setOpen(next);
  }

  function handleConfirm() {
    // Build the exact target Date: keep same calendar date, override time in local tz
    const d = new Date(currentTime);
    d.setHours(to24h(hour12, period), minute, 0, 0);
    onConfirm(d.toISOString());
    setOpen(false);
  }

  const hours12 = Array.from({ length: 12 }, (_, i) => i + 1); // 1–12
  const minutes = Array.from({ length: 60 }, (_, i) => i);

  // Preview in 12h format
  const previewHour = padTwo(hour12);
  const previewMinute = padTwo(minute);

  return (
    <Popover open={open} onOpenChange={handleOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          aria-label={`Edit ${label}`}
          className="h-[28px] w-[28px] rounded border border-control bg-surface-200 hover:bg-surface-300 flex items-center justify-center text-light hover:text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Clock className="h-3 w-3" />
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        side="bottom"
        sideOffset={4}
        className="w-64 p-0 bg-surface-100 border border-control rounded-md shadow-md overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-control bg-surface-200">
          <span className="text-[10px] font-mono uppercase tracking-wider text-light">{label}</span>
          <span className="text-[11px] font-mono text-foreground tabular-nums">
            {previewHour}:{previewMinute} {period}
          </span>
        </div>

        {/* Selectors */}
        <div className="grid grid-cols-3 gap-2 px-3 py-3">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-mono uppercase tracking-wider text-lighter">
              Hour
            </label>
            <Select
              value={String(hour12)}
              onChange={(e) => setHour12(Number(e.target.value))}
              aria-label="Select hour"
            >
              {hours12.map((h) => (
                <option key={h} value={h}>
                  {padTwo(h)}
                </option>
              ))}
            </Select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-mono uppercase tracking-wider text-lighter">
              Minute
            </label>
            <Select
              value={String(minute)}
              onChange={(e) => setMinute(Number(e.target.value))}
              aria-label="Select minute"
            >
              {minutes.map((m) => (
                <option key={m} value={m}>
                  {padTwo(m)}
                </option>
              ))}
            </Select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-mono uppercase tracking-wider text-lighter">
              Period
            </label>
            <Select
              value={period}
              onChange={(e) => setPeriod(e.target.value as "AM" | "PM")}
              aria-label="Select AM or PM"
            >
              <option value="AM">AM</option>
              <option value="PM">PM</option>
            </Select>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-2 px-3 py-2 border-t border-control bg-surface-200">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="h-[28px] px-3 rounded border border-control bg-surface-100 hover:bg-surface-300 text-[11px] font-mono text-light hover:text-foreground transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="h-[28px] px-3 rounded bg-brand hover:opacity-90 text-[11px] font-mono text-white transition-opacity"
          >
            Apply
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
