"use client"

import { useIsLoading } from "@/lib/store/loadingStore"
import { CircleLoader } from "@/components/ui/circle-loader"

export default function GlobalLoadingOverlay() {
  // The store registers itself with the API client on import, so every
  // browser call through it raises this overlay.
  const isLoading = useIsLoading()

  if (!isLoading) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className="animate-fade fixed inset-0 z-50 flex items-center justify-center bg-foreground/25 backdrop-blur-sm"
    >
      {/* The same ring and pane as the page loader, so every wait in the
          app looks like one thing. */}
      <div className="animate-rise glass-strong flex max-w-[calc(100vw-2rem)] flex-col items-center gap-3 rounded-3xl px-8 py-6">
        <CircleLoader size="lg" brand />
        <p className="text-center text-sm font-medium text-muted-foreground">
          Loading, please wait…
        </p>
      </div>
    </div>
  )
}
