"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getMyProfile, patchMyDailyRate, userQueryKey } from "@/lib/api/users";
import { calculateLogStats } from "@/lib/calculations";
import type { LogItem } from "@/lib/api/logs";

const STANDARD_DAILY_MINUTES = 8 * 60;

function formatAmount(value: number): string {
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong.";
}

interface SalaryWidgetProps {
  logs: LogItem[];
}

export function SalaryWidget({ logs }: SalaryWidgetProps) {
  const queryClient = useQueryClient();
  const [dailyRateInput, setDailyRateInput] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const profileQuery = useQuery({
    queryKey: userQueryKey(),
    queryFn: getMyProfile,
    staleTime: 30_000,
  });

  const updateDailyRateMutation = useMutation({
    mutationFn: patchMyDailyRate,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: userQueryKey() });
    },
  });

  const storedDailyRate = profileQuery.data?.dailyRate ?? null;
  const displayedDailyRateInput =
    dailyRateInput ?? (storedDailyRate === null ? "" : storedDailyRate.toFixed(2));

  const stats = useMemo(() => calculateLogStats(logs), [logs]);
  const appliedDailyRate = updateDailyRateMutation.data?.dailyRate ?? storedDailyRate;
  const equivalentDaysWorked = stats.totalRenderedMinutes / STANDARD_DAILY_MINUTES;
  const totalCalculatedSalary = (appliedDailyRate ?? 0) * equivalentDaysWorked;

  const parsedInputRate = Number(displayedDailyRateInput);
  const roundedInputRate = Number.isFinite(parsedInputRate)
    ? Number(parsedInputRate.toFixed(2))
    : null;
  const hasRateChanged = roundedInputRate !== null && roundedInputRate !== storedDailyRate;

  const isSaving = updateDailyRateMutation.isPending;
  const isBusy = profileQuery.isLoading || isSaving;

  function handleSaveDailyRate() {
    const parsedRate = Number(displayedDailyRateInput);

    if (!Number.isFinite(parsedRate)) {
      setValidationError("Daily rate must be a valid number.");
      return;
    }

    if (parsedRate < 0) {
      setValidationError("Daily rate must be zero or greater.");
      return;
    }

    setValidationError(null);
    updateDailyRateMutation.mutate(Number(parsedRate.toFixed(2)));
  }

  const requestError = profileQuery.error ?? updateDailyRateMutation.error;

  return (
    <Card className="gap-3">
      <CardHeader>
        <CardTitle>salary</CardTitle>
        <CardDescription>
          Set your 8-hour daily rate and compute total salary from rendered DTR hours.
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-end">
          <div className="w-full md:max-w-[220px]">
            <label htmlFor="daily-rate" className="mb-1 block text-xs font-medium text-light">
              Daily rate (8h)
            </label>
            <Input
              id="daily-rate"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              value={displayedDailyRateInput}
              onChange={(event) => setDailyRateInput(event.target.value)}
              disabled={isBusy}
              placeholder="0.00"
            />
          </div>

          <Button
            variant="outline"
            onClick={handleSaveDailyRate}
            disabled={isBusy || !hasRateChanged}
          >
            {isSaving ? "Saving..." : "Save rate"}
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-md border border-control bg-surface-100 p-4 h-28 flex flex-col justify-between">
            <p className="text-[10px] font-mono uppercase tracking-wider text-light">rendered hours</p>
            <p className="text-2xl text-foreground tabular-nums">
              {stats.totalHoursRendered.toFixed(2)}
            </p>
          </div>

          <div className="rounded-md border border-control bg-surface-100 p-4 h-28 flex flex-col justify-between">
            <p className="text-[10px] font-mono uppercase tracking-wider text-light">equivalent days</p>
            <p className="text-2xl text-foreground tabular-nums">
              {equivalentDaysWorked.toFixed(2)}
            </p>
          </div>

          <div className="rounded-md border border-control bg-surface-100 p-4 h-28 flex flex-col justify-between">
            <p className="text-[10px] font-mono uppercase tracking-wider text-light">calculated salary</p>
            <p className="text-2xl text-foreground tabular-nums">
              {formatAmount(totalCalculatedSalary)}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between text-[10px] text-lighter">
          <span>
            Formula: ({stats.totalRenderedMinutes} rendered mins / {STANDARD_DAILY_MINUTES}) x daily rate.
          </span>
          <span>
            {appliedDailyRate === null ? "No daily rate set yet." : `Current rate: ${formatAmount(appliedDailyRate)}`}
          </span>
        </div>

        {validationError ? <p className="text-xs text-destructive">{validationError}</p> : null}
        {requestError ? <p className="text-xs text-destructive">{getErrorMessage(requestError)}</p> : null}
      </CardContent>
    </Card>
  );
}
