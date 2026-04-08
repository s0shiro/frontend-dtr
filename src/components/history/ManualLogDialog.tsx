"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface ManualLogDialogProps {
  open: boolean;
  dateKey: string;
  period: "am" | "pm";
  isSubmitting?: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (payload: { clockInAt: string; clockOutAt: string; note?: string }) => void;
}

function toIsoFromDateTime(dateKey: string, time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  const date = new Date(`${dateKey}T00:00:00`);
  date.setHours(hours ?? 0, minutes ?? 0, 0, 0);
  return date.toISOString();
}

export function ManualLogDialog({
  open,
  dateKey,
  period,
  isSubmitting = false,
  onOpenChange,
  onConfirm,
}: ManualLogDialogProps) {
  const [clockInTime, setClockInTime] = useState(period === "am" ? "08:00" : "13:00");
  const [clockOutTime, setClockOutTime] = useState(period === "am" ? "12:00" : "17:00");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!open) {
      return;
    }

    if (period === "am") {
      setClockInTime("08:00");
      setClockOutTime("12:00");
    } else {
      setClockInTime("13:00");
      setClockOutTime("17:00");
    }
  }, [open, period]);

  function handleConfirm() {
    onConfirm({
      clockInAt: toIsoFromDateTime(dateKey, clockInTime),
      clockOutAt: toIsoFromDateTime(dateKey, clockOutTime),
      note: note.trim() || undefined,
    });
  }

  const periodLabel = period === "am" ? "AM" : "PM";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Add manual {periodLabel} log</DialogTitle>
          <DialogDescription>
            Use this when you forgot to tap but have a valid office logbook record for {dateKey}.
          </DialogDescription>
        </DialogHeader>

        <div className="px-5 py-4 bg-surface-100 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <p className="text-[10px] font-mono uppercase tracking-wider text-light">Clock In</p>
              <Input type="time" value={clockInTime} onChange={(event) => setClockInTime(event.target.value)} />
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-mono uppercase tracking-wider text-light">Clock Out</p>
              <Input type="time" value={clockOutTime} onChange={(event) => setClockOutTime(event.target.value)} />
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-[10px] font-mono uppercase tracking-wider text-light">Note (optional)</p>
            <Input
              value={note}
              onChange={(event) => setNote(event.target.value)}
              maxLength={255}
              placeholder="Optional note"
            />
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={isSubmitting}>
              Cancel
            </Button>
          </DialogClose>
          <Button type="button" onClick={handleConfirm} disabled={isSubmitting}>
            Save Manual Log
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
