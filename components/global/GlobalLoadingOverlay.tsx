"use client"

import { useIsLoading } from "@/lib/store/loadingStore"
import { EcgLine } from "./EcgLine"

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
      {/*
        The same rhythm strip the staff console waits with, so both halves of
        the product wait in one voice. Faster than the resting rate on the
        login card: here it stands in for progress, and a slow sweep reads as
        a stall.
      */}
      <div className="animate-rise w-64 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border bg-card shadow-xl">
        <EcgLine duration={1.4} className="h-14 w-full" />
        <p className="border-t px-4 py-3 text-center text-sm text-muted-foreground">
          Loading, please wait…
        </p>
      </div>
    </div>
  )
}
