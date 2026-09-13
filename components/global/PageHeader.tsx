import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * The title block at the top of a page.
 *
 * <p>Unbanded, with no background or bottom rule: the app header above it
 * already draws one, and a second bar directly beneath it reads as a doubled
 * header. It shares the content's horizontal padding so the title lines up
 * with the cards below it, and `animate-rise` gives each navigation a short
 * settle that marks the page as changed.
 */
export function PageHeader({
  title,
  description,
  actions,
  className,
}: {
  title: string
  description?: string
  actions?: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "animate-rise flex flex-wrap items-start justify-between gap-x-4 gap-y-3 px-4 pt-4 sm:px-6 sm:pt-6",
        className
      )}
    >
      <div className="min-w-0 space-y-1">
        <h1 className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">
          {title}
        </h1>
        {description && (
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {actions && (
        // flex-wrap rather than a breakpoint, so the actions share a row while
        // they fit and take their own when they stop fitting.
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          {actions}
        </div>
      )}
    </div>
  )
}
