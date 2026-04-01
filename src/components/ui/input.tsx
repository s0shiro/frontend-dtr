import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-[28px] w-full min-w-0 rounded-md border border-control bg-surface-100 px-3 py-1 text-xs text-light shadow-sm transition-colors outline-none file:inline-flex file:h-[28px] file:border-0 file:bg-transparent file:text-xs file:font-medium file:text-light placeholder:text-muted-foreground focus-visible:border-brand focus-visible:ring-1 focus-visible:ring-brand disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-1 aria-invalid:ring-destructive",
        className
      )}
      {...props}
    />
  )
}

export { Input }
