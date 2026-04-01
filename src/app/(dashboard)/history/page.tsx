"use client";

import { useMemo, useState } from "react";
import { Trash2 } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { DeleteDialog } from "@/components/history/DeleteDialog";
import { Input } from "@/components/ui/input";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { calculateLogStats } from "@/lib/calculations";
import {
  adjustLogTime,
  deleteLog,
  listLogs,
  logsQueryKey,
  type AdjustLogTimePayload,
  type LogItem,
} from "@/lib/api/logs";

function getDefaultMonth() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");

  return `${now.getFullYear()}-${month}`;
}

function toMonthKey(value: string) {
  const date = new Date(value);
  const month = String(date.getMonth() + 1).padStart(2, "0");

  return `${date.getFullYear()}-${month}`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(new Date(value));
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function getLocalDateKey(value: string) {
  const date = new Date(value);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${date.getFullYear()}-${month}-${day}`;
}

function getRowStatus(log: LogItem) {
  return log.clockOutAt ? "closed" : "open";
}

function getLogPeriod(log: LogItem) {
  const hour = new Date(log.clockInAt).getHours();
  return hour < 13 ? "am" : "pm";
}

function pickPeriodLog(current: LogItem | null, next: LogItem) {
  if (!current) {
    return next;
  }

  return new Date(next.clockInAt).getTime() < new Date(current.clockInAt).getTime()
    ? next
    : current;
}

interface DayRow {
  dateKey: string;
  amLog: LogItem | null;
  pmLog: LogItem | null;
}

export default function HistoryPage() {
  const [search, setSearch] = useState("");
  const [monthFilter, setMonthFilter] = useState(getDefaultMonth);
  const [deleteTarget, setDeleteTarget] = useState<LogItem | null>(null);
  const queryClient = useQueryClient();

  const logsQuery = useQuery({
    queryKey: logsQueryKey(monthFilter),
    queryFn: () => listLogs(monthFilter),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteLog(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: logsQueryKey() });
      setDeleteTarget(null);
    },
  });

  const adjustMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: AdjustLogTimePayload }) => {
      return adjustLogTime(id, payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: logsQueryKey() });
    },
  });

  const isMutating = deleteMutation.isPending || adjustMutation.isPending;

  const monthRows = useMemo(() => {
    return (logsQuery.data?.logs ?? []).filter((log) => {
      if (toMonthKey(log.clockInAt) !== monthFilter) {
        return false;
      }

      return true;
    });
  }, [logsQuery.data?.logs, monthFilter]);

  const groupedRows = useMemo(() => {
    const grouped = new Map<string, DayRow>();

    monthRows.forEach((log) => {
      const dateKey = getLocalDateKey(log.clockInAt);
      const existing = grouped.get(dateKey) ?? {
        dateKey,
        amLog: null,
        pmLog: null,
      };

      if (getLogPeriod(log) === "am") {
        existing.amLog = pickPeriodLog(existing.amLog, log);
      } else {
        existing.pmLog = pickPeriodLog(existing.pmLog, log);
      }

      grouped.set(dateKey, existing);
    });

    const query = search.trim().toLowerCase();
    const dayRows = Array.from(grouped.values()).sort((a, b) => {
      return new Date(b.dateKey).getTime() - new Date(a.dateKey).getTime();
    });

    if (!query) {
      return dayRows;
    }

    return dayRows.filter((row) => {
      const searchable = [
        formatDate(row.dateKey),
        row.amLog ? formatTime(row.amLog.clockInAt) : "",
        row.amLog?.clockOutAt ? formatTime(row.amLog.clockOutAt) : "",
        row.pmLog ? formatTime(row.pmLog.clockInAt) : "",
        row.pmLog?.clockOutAt ? formatTime(row.pmLog.clockOutAt) : "",
        row.amLog ? getRowStatus(row.amLog) : "",
        row.pmLog ? getRowStatus(row.pmLog) : "",
        row.amLog?.note ?? "",
        row.pmLog?.note ?? "",
        row.amLog?.id ?? "",
        row.pmLog?.id ?? "",
      ]
        .join(" ")
        .toLowerCase();

      return searchable.includes(query);
    });
  }, [monthRows, search]);

  const stats = useMemo(() => calculateLogStats(monthRows), [monthRows]);

  function handleAdjust(id: string, target: "clockIn" | "clockOut", minutesDelta: number) {
    adjustMutation.mutate({
      id,
      payload: {
        target,
        minutesDelta,
      },
    });
  }

  function handleDeleteConfirm() {
    if (!deleteTarget) {
      return;
    }

    deleteMutation.mutate(deleteTarget.id);
  }

  const errorMessage = logsQuery.error instanceof Error
    ? logsQuery.error.message
    : "Failed to load history logs.";

  return (
    <div className="flex-1 w-full p-4 md:p-8 max-w-[1200px] mx-auto space-y-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-normal tracking-tight text-foreground">history</h1>
          <span className="text-[10px] font-mono tracking-wider px-1.5 py-0.5 rounded outline outline-1 outline-border bg-surface-200 text-light uppercase">
            Logs
          </span>
        </div>
        <p className="text-xs text-light">Search and review your previous time entries by month.</p>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="bg-surface-100 border border-control rounded-md p-3 shadow-sm">
          <div className="text-[10px] font-mono uppercase tracking-wider text-light">Total Hours</div>
          <div className="mt-1 text-xl text-foreground">{stats.totalHoursRendered.toFixed(2)}</div>
          <div className="text-[10px] text-lighter">From closed logs in selected month</div>
        </div>
        <div className="bg-surface-100 border border-control rounded-md p-3 shadow-sm">
          <div className="text-[10px] font-mono uppercase tracking-wider text-light">Late Minutes</div>
          <div className="mt-1 text-xl text-foreground">{stats.lateMinutes}</div>
          <div className="text-[10px] text-lighter">Based on 8:00 AM expected start</div>
        </div>
        <div className="bg-surface-100 border border-control rounded-md p-3 shadow-sm">
          <div className="text-[10px] font-mono uppercase tracking-wider text-light">Undertime</div>
          <div className="mt-1 text-xl text-foreground">{stats.undertimeMinutes} min</div>
          <div className="text-[10px] text-lighter">Simple 8-hour daily requirement</div>
        </div>
      </div>

      <div className="w-full border border-control bg-surface-100 rounded-md shadow-sm overflow-hidden">
        <div className="border-b border-control bg-surface-100 p-4 flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
          <div className="flex flex-1 flex-col md:flex-row gap-3">
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search note, status, id, or time"
              className="w-full md:max-w-sm"
            />
            <div className="w-full md:w-auto">
              <p className="mb-1 text-[10px] font-mono uppercase tracking-wider text-light">Month</p>
              <input
                type="month"
                value={monthFilter}
                onChange={(e) => setMonthFilter(e.target.value || getDefaultMonth())}
                className="h-[28px] bg-surface-100 border border-control text-xs px-3 rounded-md min-w-[150px] text-light"
                aria-label="Select month"
              />
            </div>
          </div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-light">
            {groupedRows.length} day rows
          </span>
        </div>

        {logsQuery.isLoading ? (
          <div className="p-6 text-xs text-light">Loading history entries...</div>
        ) : null}

        {logsQuery.isError ? (
          <div className="p-6 text-xs text-destructive">{errorMessage}</div>
        ) : null}

        {!logsQuery.isLoading && !logsQuery.isError ? (
          groupedRows.length > 0 ? (
            <ScrollArea className="w-full">
              <table className="w-full">
                <thead className="bg-surface-200">
                  <tr>
                    <th className="h-8 px-3 text-left text-[11px] font-mono uppercase tracking-wider text-light">Date</th>
                    <th className="h-8 px-3 text-left text-[11px] font-mono uppercase tracking-wider text-light">AM In</th>
                    <th className="h-8 px-3 text-left text-[11px] font-mono uppercase tracking-wider text-light">AM Out</th>
                    <th className="h-8 px-3 text-left text-[11px] font-mono uppercase tracking-wider text-light">PM In</th>
                    <th className="h-8 px-3 text-left text-[11px] font-mono uppercase tracking-wider text-light">PM Out</th>
                    <th className="h-8 px-3 text-left text-[11px] font-mono uppercase tracking-wider text-light">Note</th>
                    <th className="h-8 px-3 text-left text-[11px] font-mono uppercase tracking-wider text-light">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {groupedRows.map((row) => {
                    const amStatus = row.amLog ? getRowStatus(row.amLog) : "";
                    const pmStatus = row.pmLog ? getRowStatus(row.pmLog) : "";
                    const notes = [row.amLog?.note, row.pmLog?.note].filter(Boolean).join(" | ");

                    return (
                      <tr key={row.dateKey} className="border-b border-control hover:bg-surface-200">
                        <td className="px-3 py-2 text-xs font-mono text-light">{formatDate(row.dateKey)}</td>
                        <td className="px-3 py-2 text-xs font-mono text-foreground">
                          {row.amLog ? (
                            <div className="flex items-center gap-1">
                              <span>{formatTime(row.amLog.clockInAt)}</span>
                              <button
                                type="button"
                                onClick={() => handleAdjust(row.amLog!.id, "clockIn", -1)}
                                disabled={isMutating}
                                className="h-[28px] w-[28px] text-[10px] bg-surface-200 hover:bg-surface-300 border border-control rounded flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                                aria-label="Decrease AM clock-in by 1 minute"
                              >
                                -
                              </button>
                              <button
                                type="button"
                                onClick={() => handleAdjust(row.amLog!.id, "clockIn", 1)}
                                disabled={isMutating}
                                className="h-[28px] w-[28px] text-[10px] bg-surface-200 hover:bg-surface-300 border border-control rounded flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                                aria-label="Increase AM clock-in by 1 minute"
                              >
                                +
                              </button>
                            </div>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="px-3 py-2 text-xs font-mono text-foreground">
                          {row.amLog?.clockOutAt ? (
                            <div className="flex items-center gap-1">
                              <span>{formatTime(row.amLog.clockOutAt)}</span>
                              <button
                                type="button"
                                onClick={() => handleAdjust(row.amLog!.id, "clockOut", -1)}
                                disabled={isMutating}
                                className="h-[28px] w-[28px] text-[10px] bg-surface-200 hover:bg-surface-300 border border-control rounded flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                                aria-label="Decrease AM clock-out by 1 minute"
                              >
                                -
                              </button>
                              <button
                                type="button"
                                onClick={() => handleAdjust(row.amLog!.id, "clockOut", 1)}
                                disabled={isMutating}
                                className="h-[28px] w-[28px] text-[10px] bg-surface-200 hover:bg-surface-300 border border-control rounded flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                                aria-label="Increase AM clock-out by 1 minute"
                              >
                                +
                              </button>
                            </div>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="px-3 py-2 text-xs font-mono text-foreground">
                          {row.pmLog ? (
                            <div className="flex items-center gap-1">
                              <span>{formatTime(row.pmLog.clockInAt)}</span>
                              <button
                                type="button"
                                onClick={() => handleAdjust(row.pmLog!.id, "clockIn", -1)}
                                disabled={isMutating}
                                className="h-[28px] w-[28px] text-[10px] bg-surface-200 hover:bg-surface-300 border border-control rounded flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                                aria-label="Decrease PM clock-in by 1 minute"
                              >
                                -
                              </button>
                              <button
                                type="button"
                                onClick={() => handleAdjust(row.pmLog!.id, "clockIn", 1)}
                                disabled={isMutating}
                                className="h-[28px] w-[28px] text-[10px] bg-surface-200 hover:bg-surface-300 border border-control rounded flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                                aria-label="Increase PM clock-in by 1 minute"
                              >
                                +
                              </button>
                            </div>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="px-3 py-2 text-xs font-mono text-foreground">
                          {row.pmLog?.clockOutAt ? (
                            <div className="flex items-center gap-1">
                              <span>{formatTime(row.pmLog.clockOutAt)}</span>
                              <button
                                type="button"
                                onClick={() => handleAdjust(row.pmLog!.id, "clockOut", -1)}
                                disabled={isMutating}
                                className="h-[28px] w-[28px] text-[10px] bg-surface-200 hover:bg-surface-300 border border-control rounded flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                                aria-label="Decrease PM clock-out by 1 minute"
                              >
                                -
                              </button>
                              <button
                                type="button"
                                onClick={() => handleAdjust(row.pmLog!.id, "clockOut", 1)}
                                disabled={isMutating}
                                className="h-[28px] w-[28px] text-[10px] bg-surface-200 hover:bg-surface-300 border border-control rounded flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                                aria-label="Increase PM clock-out by 1 minute"
                              >
                                +
                              </button>
                            </div>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="px-3 py-2 text-xs text-light">
                          <div className="flex items-center gap-2">
                            {notes || "-"}
                            {amStatus ? (
                              <span className={amStatus === "open" ? "text-warning" : "text"}>
                                AM {amStatus}
                              </span>
                            ) : null}
                            {pmStatus ? (
                              <span className={pmStatus === "open" ? "text-warning" : "text"}>
                                PM {pmStatus}
                              </span>
                            ) : null}
                          </div>
                        </td>
                        <td className="px-3 py-2 text-xs">
                          <div className="flex items-center gap-1">
                            {row.amLog ? (
                              <button
                                type="button"
                                onClick={() => setDeleteTarget(row.amLog)}
                                disabled={isMutating}
                                className="h-[28px] px-2 rounded border border-control flex items-center gap-1 text-destructive hover:bg-surface-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                aria-label="Delete AM log"
                              >
                                <Trash2 className="h-4 w-4" />
                                <span className="text-[10px] font-mono uppercase">AM</span>
                              </button>
                            ) : null}
                            {row.pmLog ? (
                              <button
                                type="button"
                                onClick={() => setDeleteTarget(row.pmLog)}
                                disabled={isMutating}
                                className="h-[28px] px-2 rounded border border-control flex items-center gap-1 text-destructive hover:bg-surface-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                aria-label="Delete PM log"
                              >
                                <Trash2 className="h-4 w-4" />
                                <span className="text-[10px] font-mono uppercase">PM</span>
                              </button>
                            ) : null}
                            {!row.amLog && !row.pmLog ? "-" : null}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          ) : (
            <div className="p-6 text-xs text-light">No entries found for the selected month and search query.</div>
          )
        ) : null}
      </div>

      <DeleteDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
          }
        }}
        title="Delete log entry"
        description={deleteTarget ? `This will remove the log from ${formatDate(deleteTarget.clockInAt)}.` : ""}
        isSubmitting={deleteMutation.isPending}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}