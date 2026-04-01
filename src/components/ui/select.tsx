import * as React from "react"

import { cn } from "@/lib/utils"

function Select({ className, ...props }: React.ComponentProps<"select">) {
  return (
    <select
      data-slot="select"
      className={cn(
        "h-[28px] w-full rounded-md border border-control bg-surface-200 px-3 text-xs text-light shadow-sm outline-none transition-colors focus:ring-1 focus:ring-brand disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export { Select }