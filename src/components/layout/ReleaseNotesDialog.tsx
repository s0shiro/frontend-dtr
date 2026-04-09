"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getMyLatestReleaseNotes, releaseNotesQueryKey } from "@/lib/api/users";

const RELEASE_NOTES_STORAGE_KEY = "dtr:last-seen-release-id";

function getInitialSeenReleaseId() {
  if (typeof window === "undefined") {
    return "";
  }

  return window.localStorage.getItem(RELEASE_NOTES_STORAGE_KEY) ?? "";
}

export function ReleaseNotesDialog() {
  const [seenReleaseId, setSeenReleaseId] = useState(getInitialSeenReleaseId);

  const releaseNotesQuery = useQuery({
    queryKey: releaseNotesQueryKey(),
    queryFn: () => getMyLatestReleaseNotes(),
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });

  const release = releaseNotesQuery.data;
  const shouldShow = Boolean(release && release.releaseId !== seenReleaseId);

  const dismiss = () => {
    if (!release) {
      return;
    }

    window.localStorage.setItem(RELEASE_NOTES_STORAGE_KEY, release.releaseId);
    setSeenReleaseId(release.releaseId);
  };

  return (
    <Dialog open={shouldShow} onOpenChange={(open) => { if (!open) dismiss(); }}>
      <DialogContent className="max-w-[520px]">
        <DialogHeader>
          <div className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider text-brand">
            <Sparkles className="h-3 w-3" />
            Latest updates
          </div>
          <DialogTitle>{release?.title ?? "What’s new"}</DialogTitle>
          <DialogDescription>
            Here are the latest features you can use right now.
          </DialogDescription>
        </DialogHeader>

        <div className="px-5 py-4 bg-surface-100">
          <ul className="flex flex-col gap-2">
            {(release?.highlights ?? []).map((item, index) => (
              <li
                key={`${release?.releaseId ?? "release"}-${index}`}
                className="rounded-md border border-control bg-surface-200 px-2 py-1.5 text-xs text-light"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>

        <DialogFooter>
          <Button onClick={dismiss}>Got it</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
