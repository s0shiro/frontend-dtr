"use client";

import { useQuery } from "@tanstack/react-query";
import { Quote } from "lucide-react";

import {
  dailyMotivationQueryKey,
  getMyDailyMotivation,
} from "@/lib/api/users";

export function DailyMotivationCard() {
  const motivationQuery = useQuery({
    queryKey: dailyMotivationQueryKey(),
    queryFn: () => getMyDailyMotivation(),
    staleTime: 6 * 60 * 60_000,
    refetchInterval: 6 * 60 * 60_000,
  });

  return (
    <section className="w-full border border-control bg-surface-100 rounded-md shadow-sm p-3 md:p-4">
      <div className="flex items-start gap-2">
        <div className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-md border border-control bg-surface-200">
          <Quote className="h-3 w-3 text-brand" />
        </div>

        <div className="flex flex-col gap-1">
          <p className="text-[10px] font-mono uppercase tracking-wider text-light">Daily motivation</p>
          <p className="text-xs text-foreground">
            {motivationQuery.data?.quote ?? "Stay consistent today—every accurate log moves you forward."}
          </p>
          <p className="text-[10px] text-lighter">
            — {motivationQuery.data?.author ?? "DTR Coach"}
          </p>
        </div>
      </div>
    </section>
  );
}
