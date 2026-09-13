"use client"

import * as React from "react"
import { RotateCwIcon, TriangleAlertIcon } from "lucide-react"

import { Button } from "@/components/ui/button"

/**
 * What a page shows when rendering it throws, most often because the API
 * could not be reached while a server component was loading.
 *
 * <p>The copy is generic on purpose. In production a server error arrives here
 * with its message stripped, and the detail would mean nothing to a patient
 * anyway; it goes to the console, where the digest ties it to the server log.
 * `retry` re-fetches and re-renders the segment, which is the right first move
 * for an outage that has already passed.
 */
export default function ErrorBoundary({
  error,
  retry,
}: {
  error: Error & { digest?: string }
  retry: () => void
}) {
  React.useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex h-full flex-col items-center justify-center px-6 py-12 text-center">
      <span className="mb-5 flex size-14 items-center justify-center rounded-2xl bg-urgent-soft text-urgent">
        <TriangleAlertIcon className="size-7" />
      </span>
      <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
        Something went wrong
      </h1>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
        We couldn&rsquo;t load this page. Check your connection and try again.
      </p>
      <Button size="lg" className="mt-7 h-10 px-4" onClick={() => retry()}>
        <RotateCwIcon />
        Try again
      </Button>
    </div>
  )
}
