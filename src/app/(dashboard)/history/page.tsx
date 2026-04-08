"use client";

import { useMemo, useState } from "react";
import { Download, Printer, Trash2 } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { DeleteDialog } from "@/components/history/DeleteDialog";
import { ManualLogDialog } from "@/components/history/ManualLogDialog";
import { TimePickerPopover } from "@/components/history/TimePickerPopover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { calculateLogStats } from "@/lib/calculations";
import { buildCsvContent, downloadTextFile } from "@/lib/dtr-export";
import {
  adjustLogTime,
  createManualLog,
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

function getLocalDateKey(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${date.getFullYear()}-${month}-${day}`;
}

function getRowStatus(log: LogItem) {
  return log.clockOutAt ? "closed" : "open";
}

function getLogPeriod(log: LogItem) {
  const hour = new Date(log.clockInAt).getHours();
  return hour < 12 ? "am" : "pm";
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
  dayLogs: LogItem[];
  isHoliday: boolean;
  holidayName: string | null;
  isWeekend: boolean;
}

function formatMonthLabel(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "long",
    year: "numeric",
  }).format(new Date(`${value}-01`));
}

function getRenderedMinutes(log: LogItem, now: Date) {
  const clockIn = new Date(log.clockInAt);
  const clockOut = log.clockOutAt ? new Date(log.clockOutAt) : now;
  const end = Number.isNaN(clockOut.getTime()) ? now : clockOut;

  return Math.max(0, Math.floor((end.getTime() - clockIn.getTime()) / 60000));
}

function getMonthStart(month: string) {
  return new Date(`${month}-01T00:00:00`);
}

function buildVisibleDateKeys(month: string): string[] {
  const start = getMonthStart(month);

  if (Number.isNaN(start.getTime())) {
    return [];
  }

  const endOfMonth = new Date(start);
  endOfMonth.setMonth(endOfMonth.getMonth() + 1);
  endOfMonth.setDate(0);
  endOfMonth.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const finalDay = endOfMonth.getTime() < today.getTime() ? endOfMonth : today;

  if (finalDay.getTime() < start.getTime()) {
    return [];
  }

  const cursor = new Date(start);
  const keys: string[] = [];

  while (cursor.getTime() <= finalDay.getTime()) {
    keys.push(getLocalDateKey(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  return keys;
}

function getDayType(row: DayRow) {
  if (row.isHoliday) {
    return row.holidayName ? `Holiday · ${row.holidayName}` : "Holiday";
  }

  if (row.isWeekend) {
    return "Weekend";
  }

  return "Working Day";
}

function isPeriodCovered(row: DayRow, period: "am" | "pm") {
  const blockStart = new Date(`${row.dateKey}T${period === "am" ? "08:00:00" : "13:00:00"}`);
  const blockEnd = new Date(`${row.dateKey}T${period === "am" ? "12:00:00" : "17:00:00"}`);

  return row.dayLogs.some((log) => {
    if (!log.clockOutAt) {
      return false;
    }

    const logStart = new Date(log.clockInAt);
    const logEnd = new Date(log.clockOutAt);

    return logStart.getTime() < blockEnd.getTime() && logEnd.getTime() > blockStart.getTime();
  });
}

export default function HistoryPage() {
  const [search, setSearch] = useState("");
  const [monthFilter, setMonthFilter] = useState(getDefaultMonth);
  const [deleteTarget, setDeleteTarget] = useState<LogItem | null>(null);
  const [manualTarget, setManualTarget] = useState<{ dateKey: string; period: "am" | "pm" } | null>(null);
  const queryClient = useQueryClient();

  const logsQuery = useQuery({
    queryKey: logsQueryKey(monthFilter),
    queryFn: () => listLogs(monthFilter),
    refetchInterval: 60000,
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

  const manualCreateMutation = useMutation({
    mutationFn: createManualLog,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: logsQueryKey() });
      setManualTarget(null);
    },
  });

  const isMutating = deleteMutation.isPending || adjustMutation.isPending || manualCreateMutation.isPending;

  const monthRows = useMemo(() => {
    return (logsQuery.data?.logs ?? []).filter((log) => {
      if (toMonthKey(log.clockInAt) !== monthFilter) {
        return false;
      }

      return true;
    });
  }, [logsQuery.data?.logs, monthFilter]);

  const holidayNameByDate = useMemo(() => {
    return new Map((logsQuery.data?.holidays ?? []).map((holiday) => [holiday.date, holiday.name]));
  }, [logsQuery.data?.holidays]);

  const holidayDates = useMemo(() => {
    return new Set(holidayNameByDate.keys());
  }, [holidayNameByDate]);

  const groupedRows = useMemo(() => {
    const grouped = new Map<string, DayRow>();

    const visibleDateKeys = buildVisibleDateKeys(monthFilter);

    visibleDateKeys.forEach((dateKey) => {
      const date = new Date(`${dateKey}T00:00:00`);
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;

      grouped.set(dateKey, {
        dateKey,
        amLog: null,
        pmLog: null,
        dayLogs: [],
        isHoliday: holidayDates.has(dateKey),
        holidayName: holidayNameByDate.get(dateKey) ?? null,
        isWeekend,
      });
    });

    monthRows.forEach((log) => {
      const dateKey = getLocalDateKey(log.clockInAt);
      const existing = grouped.get(dateKey);

      if (!existing) {
        return;
      }

      existing.dayLogs.push(log);

      if (getLogPeriod(log) === "am") {
        existing.amLog = pickPeriodLog(existing.amLog, log);
      } else {
        existing.pmLog = pickPeriodLog(existing.pmLog, log);
      }
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
        getDayType(row),
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
        row.amLog?.clockInLocationTag ?? "",
        row.pmLog?.clockInLocationTag ?? "",
      ]
        .join(" ")
        .toLowerCase();

      return searchable.includes(query);
    });
  }, [holidayDates, holidayNameByDate, monthFilter, monthRows, search]);

  const stats = useMemo(
    () =>
      calculateLogStats(monthRows, {
        holidays: Array.from(holidayDates),
        month: monthFilter,
      }),
    [holidayDates, monthFilter, monthRows],
  );
  const monthLabel = useMemo(() => formatMonthLabel(monthFilter), [monthFilter]);

  function buildExportRows() {
    const now = new Date();

    return groupedRows.map((row) => {
      const amMinutes = row.amLog ? getRenderedMinutes(row.amLog, now) : 0;
      const pmMinutes = row.pmLog ? getRenderedMinutes(row.pmLog, now) : 0;

      return [
        row.dateKey,
        getDayType(row),
        row.amLog ? formatTime(row.amLog.clockInAt) : "",
        row.amLog?.clockOutAt ? formatTime(row.amLog.clockOutAt) : "",
        row.pmLog ? formatTime(row.pmLog.clockInAt) : "",
        row.pmLog?.clockOutAt ? formatTime(row.pmLog.clockOutAt) : "",
        row.amLog ? getRowStatus(row.amLog) : "",
        row.pmLog ? getRowStatus(row.pmLog) : "",
        row.amLog?.note ?? "",
        row.pmLog?.note ?? "",
        ((amMinutes + pmMinutes) / 60).toFixed(2),
      ];
    });
  }

  function handleExportCsv() {
    const exportedRows = buildExportRows();
    const exportedLogs = groupedRows.flatMap((row) => [row.amLog, row.pmLog].filter(Boolean) as LogItem[]);
    const exportStats = calculateLogStats(exportedLogs, {
      holidays: Array.from(holidayDates),
      month: monthFilter,
    });
    const csvContent = buildCsvContent({
      title: "DTR Monthly Export",
      summary: [
        ["Month", monthLabel],
        [
          "Generated",
          new Intl.DateTimeFormat(undefined, {
            dateStyle: "medium",
            timeStyle: "short",
          }).format(new Date()),
        ],
        ["Visible Days", String(groupedRows.length)],
        ["Total Hours", exportStats.totalHoursRendered.toFixed(2)],
        ["Late Minutes", String(exportStats.lateMinutes)],
        ["Undertime Minutes", String(exportStats.undertimeMinutes)],
        ["Required Hours", exportStats.requiredHours.toFixed(2)],
      ],
      header: [
        "Date",
        "Day Type",
        "AM In",
        "AM Out",
        "PM In",
        "PM Out",
        "AM Status",
        "PM Status",
        "AM Note",
        "PM Note",
        "Rendered Hours",
      ],
      rows: exportedRows,
    });

    downloadTextFile(`dtr-${monthFilter}.csv`, csvContent, "text/csv;charset=utf-8");
  }

  function handlePrintPdf() {
    window.print();
  }

  function handleAdjust(id: string, target: "clockIn" | "clockOut", targetTime: string) {
    adjustMutation.mutate({
      id,
      payload: {
        target,
        targetTime,
      },
    });
  }

  function handleDeleteConfirm() {
    if (!deleteTarget) {
      return;
    }

    deleteMutation.mutate(deleteTarget.id);
  }

  function handleManualConfirm(payload: { clockInAt: string; clockOutAt: string; note?: string }) {
    manualCreateMutation.mutate(payload);
  }

  const errorMessage = logsQuery.error instanceof Error
    ? logsQuery.error.message
    : "Failed to load history logs.";

  return (
    <div className="flex-1 w-full p-4 md:p-8 max-w-[1200px] mx-auto space-y-6 print:max-w-none print:p-0">
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-normal tracking-tight text-foreground">history</h1>
              <span className="text-[10px] font-mono tracking-wider px-1.5 py-0.5 rounded outline outline-1 outline-border bg-surface-200 text-light uppercase">
                Logs
              </span>
            </div>
            <p className="text-xs text-light">Search and review your previous time entries by month.</p>
          </div>

          <div className="print:hidden flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="min-w-[140px] justify-between">
                  Export DTR
                  <Download className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem onSelect={handleExportCsv}>
                  <Download className="h-4 w-4" />
                  Download CSV
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={handlePrintPdf}>
                  <Printer className="h-4 w-4" />
                  Save as PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
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
        <div className="bg-surface-100 border border-control rounded-md p-3 shadow-sm">
          <div className="text-[10px] font-mono uppercase tracking-wider text-light">Required Hours</div>
          <div className="mt-1 text-xl text-foreground">{logsQuery.data?.monthSummary.requiredHours.toFixed(2) ?? '0.00'}</div>
          <div className="text-[10px] text-lighter">
            {logsQuery.data?.monthSummary.workingDays ?? 0} working days ({logsQuery.data?.holidays.length ?? 0} holidays)
          </div>
        </div>
      </div>

      {(logsQuery.data?.holidays.length ?? 0) > 0 ? (
        <div className="rounded-md border border-control bg-surface-100 p-3">
          <p className="text-[10px] font-mono uppercase tracking-wider text-light">Recognized Holidays</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {(logsQuery.data?.holidays ?? []).map((holiday) => (
              <span key={holiday.date} className="rounded bg-surface-200 px-2 py-1 text-[10px] text-light">
                {holiday.date} · {holiday.name}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      <div className="w-full border border-control bg-surface-100 rounded-md shadow-sm overflow-hidden print:border-0 print:shadow-none">
        <div className="print:hidden border-b border-control bg-surface-100 p-4 flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
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
                    <th className="h-8 px-3 text-left text-[11px] font-mono uppercase tracking-wider text-light">Day Type</th>
                    <th className="h-8 px-3 text-left text-[11px] font-mono uppercase tracking-wider text-light">AM In</th>
                    <th className="h-8 px-3 text-left text-[11px] font-mono uppercase tracking-wider text-light">AM Out</th>
                    <th className="h-8 px-3 text-left text-[11px] font-mono uppercase tracking-wider text-light">PM In</th>
                    <th className="h-8 px-3 text-left text-[11px] font-mono uppercase tracking-wider text-light">PM Out</th>
                    <th className="h-8 px-3 text-left text-[11px] font-mono uppercase tracking-wider text-light">Note</th>
                    <th className="print:hidden h-8 px-3 text-left text-[11px] font-mono uppercase tracking-wider text-light">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {groupedRows.map((row) => {
                    const amStatus = row.amLog ? getRowStatus(row.amLog) : "";
                    const pmStatus = row.pmLog ? getRowStatus(row.pmLog) : "";
                    const notes = [row.amLog?.note, row.pmLog?.note].filter(Boolean).join(" | ");
                    const locationTags = [
                      row.amLog ? `AM ${row.amLog.clockInLocationTag}` : null,
                      row.pmLog ? `PM ${row.pmLog.clockInLocationTag}` : null,
                    ].filter(Boolean).join(" · ");
                    const dayType = getDayType(row);
                    const hasLogs = Boolean(row.amLog || row.pmLog);
                    const amCovered = isPeriodCovered(row, "am");
                    const pmCovered = isPeriodCovered(row, "pm");

                    return (
                      <tr key={row.dateKey} className="border-b border-control hover:bg-surface-200">
                        <td className="px-3 py-2 text-xs font-mono text-light">{formatDate(row.dateKey)}</td>
                        <td className="px-3 py-2 text-xs text-light">
                          <span className={row.isHoliday ? "text-brand" : row.isWeekend ? "text-warning" : "text-light"}>
                            {dayType}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-xs font-mono text-foreground">
                          {row.amLog ? (
                            <div className="flex items-center gap-1.5">
                              <span>{formatTime(row.amLog.clockInAt)}</span>
                              <TimePickerPopover
                                currentTime={row.amLog.clockInAt}
                                label="AM In"
                                disabled={isMutating}
                                onConfirm={(targetTime) => handleAdjust(row.amLog!.id, "clockIn", targetTime)}
                              />
                            </div>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="px-3 py-2 text-xs font-mono text-foreground">
                          {row.amLog?.clockOutAt ? (
                            <div className="flex items-center gap-1.5">
                              <span>{formatTime(row.amLog.clockOutAt)}</span>
                              <TimePickerPopover
                                currentTime={row.amLog.clockOutAt}
                                label="AM Out"
                                disabled={isMutating}
                                onConfirm={(targetTime) => handleAdjust(row.amLog!.id, "clockOut", targetTime)}
                              />
                            </div>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="px-3 py-2 text-xs font-mono text-foreground">
                          {row.pmLog ? (
                            <div className="flex items-center gap-1.5">
                              <span>{formatTime(row.pmLog.clockInAt)}</span>
                              <TimePickerPopover
                                currentTime={row.pmLog.clockInAt}
                                label="PM In"
                                disabled={isMutating}
                                onConfirm={(targetTime) => handleAdjust(row.pmLog!.id, "clockIn", targetTime)}
                              />
                            </div>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="px-3 py-2 text-xs font-mono text-foreground">
                          {row.pmLog?.clockOutAt ? (
                            <div className="flex items-center gap-1.5">
                              <span>{formatTime(row.pmLog.clockOutAt)}</span>
                              <TimePickerPopover
                                currentTime={row.pmLog.clockOutAt}
                                label="PM Out"
                                disabled={isMutating}
                                onConfirm={(targetTime) => handleAdjust(row.pmLog!.id, "clockOut", targetTime)}
                              />
                            </div>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="px-3 py-2 text-xs text-light">
                          <div className="flex items-center gap-2">
                            {notes || (hasLogs ? "-" : row.isHoliday ? "No entry required (holiday)" : row.isWeekend ? "No entry required (weekend)" : "No entry yet")}
                            {locationTags ? <span className="text-brand">{locationTags}</span> : null}
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
                        <td className="print:hidden px-3 py-2 text-xs">
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
                            {!amCovered && !row.isHoliday && !row.isWeekend ? (
                              <button
                                type="button"
                                onClick={() => setManualTarget({ dateKey: row.dateKey, period: "am" })}
                                disabled={isMutating}
                                className="h-[28px] px-2 rounded border border-control flex items-center gap-1 text-light hover:bg-surface-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                aria-label="Add AM manual log"
                              >
                                <span className="text-[10px] font-mono uppercase">+ AM</span>
                              </button>
                            ) : null}
                            {!pmCovered && !row.isHoliday && !row.isWeekend ? (
                              <button
                                type="button"
                                onClick={() => setManualTarget({ dateKey: row.dateKey, period: "pm" })}
                                disabled={isMutating}
                                className="h-[28px] px-2 rounded border border-control flex items-center gap-1 text-light hover:bg-surface-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                aria-label="Add PM manual log"
                              >
                                <span className="text-[10px] font-mono uppercase">+ PM</span>
                              </button>
                            ) : null}
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
            <div className="p-6 text-xs text-light">No visible day rows yet for the selected month and search query.</div>
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

      <ManualLogDialog
        open={manualTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setManualTarget(null);
          }
        }}
        dateKey={manualTarget?.dateKey ?? getLocalDateKey(new Date())}
        period={manualTarget?.period ?? "am"}
        isSubmitting={manualCreateMutation.isPending}
        onConfirm={handleManualConfirm}
      />
    </div>
  );
}