interface LogCalculationInput {
  clockInAt: string;
  clockOutAt: string | null;
}

export interface LogCalculationStats {
  totalRenderedMinutes: number;
  totalHoursRendered: number;
  lateMinutes: number;
  undertimeMinutes: number;
}

const BLOCK_MINUTES = 4 * 60;

interface DayRange {
  start: Date;
  end: Date;
}

function toLocalDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function buildDaySchedule(date: Date): { am: DayRange; pm: DayRange } {
  const amStart = new Date(date);
  amStart.setHours(8, 0, 0, 0);

  const amEnd = new Date(date);
  amEnd.setHours(12, 0, 0, 0);

  const pmStart = new Date(date);
  pmStart.setHours(13, 0, 0, 0);

  const pmEnd = new Date(date);
  pmEnd.setHours(17, 0, 0, 0);

  return {
    am: { start: amStart, end: amEnd },
    pm: { start: pmStart, end: pmEnd },
  };
}

function getOverlapRange(start: Date, end: Date, block: DayRange): DayRange | null {
  const overlapStartMs = Math.max(start.getTime(), block.start.getTime());
  const overlapEndMs = Math.min(end.getTime(), block.end.getTime());

  if (overlapEndMs <= overlapStartMs) {
    return null;
  }

  return {
    start: new Date(overlapStartMs),
    end: new Date(overlapEndMs),
  };
}

function sumMergedOverlapMinutes(ranges: DayRange[]): number {
  if (ranges.length === 0) {
    return 0;
  }

  const sorted = [...ranges].sort((a, b) => a.start.getTime() - b.start.getTime());
  let totalMinutes = 0;
  let currentStart = sorted[0].start.getTime();
  let currentEnd = sorted[0].end.getTime();

  for (let index = 1; index < sorted.length; index += 1) {
    const nextStart = sorted[index].start.getTime();
    const nextEnd = sorted[index].end.getTime();

    if (nextStart > currentEnd) {
      totalMinutes += Math.floor((currentEnd - currentStart) / 60000);
      currentStart = nextStart;
      currentEnd = nextEnd;
      continue;
    }

    currentEnd = Math.max(currentEnd, nextEnd);
  }

  totalMinutes += Math.floor((currentEnd - currentStart) / 60000);

  return totalMinutes;
}

function getLateMinutesForBlock(clockIns: Date[], blockStart: Date): number {
  if (clockIns.length === 0) {
    return 0;
  }

  const firstClockIn = clockIns.reduce((earliest, value) => {
    if (value.getTime() < earliest.getTime()) {
      return value;
    }

    return earliest;
  });

  return Math.max(0, Math.floor((firstClockIn.getTime() - blockStart.getTime()) / 60000));
}

export function calculateLogStats(logs: LogCalculationInput[]): LogCalculationStats {
  const logsByDate = new Map<string, Array<{ clockIn: Date; clockOut: Date }>>();

  for (const log of logs) {
    if (!log.clockOutAt) {
      continue;
    }

    const clockIn = new Date(log.clockInAt);
    const clockOut = new Date(log.clockOutAt);

    if (Number.isNaN(clockIn.getTime()) || Number.isNaN(clockOut.getTime()) || clockOut <= clockIn) {
      continue;
    }

    const dateKey = toLocalDateKey(clockIn);
    const existingLogs = logsByDate.get(dateKey) ?? [];
    existingLogs.push({ clockIn, clockOut });
    logsByDate.set(dateKey, existingLogs);
  }

  let totalRenderedMinutes = 0;
  let lateMinutes = 0;
  let undertimeMinutes = 0;

  for (const dayLogs of logsByDate.values()) {
    const schedule = buildDaySchedule(dayLogs[0].clockIn);
    const amOverlaps: DayRange[] = [];
    const pmOverlaps: DayRange[] = [];
    const amClockIns: Date[] = [];
    const pmClockIns: Date[] = [];

    for (const log of dayLogs) {
      const amOverlap = getOverlapRange(log.clockIn, log.clockOut, schedule.am);
      if (amOverlap) {
        amOverlaps.push(amOverlap);
        amClockIns.push(log.clockIn);
      }

      const pmOverlap = getOverlapRange(log.clockIn, log.clockOut, schedule.pm);
      if (pmOverlap) {
        pmOverlaps.push(pmOverlap);
        pmClockIns.push(log.clockIn);
      }
    }

    const amMinutes = Math.min(BLOCK_MINUTES, sumMergedOverlapMinutes(amOverlaps));
    const pmMinutes = Math.min(BLOCK_MINUTES, sumMergedOverlapMinutes(pmOverlaps));

    totalRenderedMinutes += amMinutes + pmMinutes;
    lateMinutes += getLateMinutesForBlock(amClockIns, schedule.am.start);
    lateMinutes += getLateMinutesForBlock(pmClockIns, schedule.pm.start);
    undertimeMinutes += (BLOCK_MINUTES - amMinutes) + (BLOCK_MINUTES - pmMinutes);
  }

  return {
    totalRenderedMinutes,
    totalHoursRendered: Number((totalRenderedMinutes / 60).toFixed(2)),
    lateMinutes,
    undertimeMinutes,
  };
}