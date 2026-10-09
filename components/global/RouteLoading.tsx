"use client"

import * as React from "react"
import { HeartPulse } from "lucide-react"

import { EcgLine } from "@/components/global/EcgLine"

/**
 * The word the loader shows and reads out, in the language the shell is in.
 *
 * <p>Handed down by the layout rather than read from the language cookie in
 * each `loading.tsx`: a loading file that reads a cookie becomes dynamic, and
 * a dynamic fallback cannot be prefetched, which would leave a tap waiting on
 * the server for the very thing that is meant to answer it at once.
 */
const LoadingLabel = React.createContext("Loading…")

export function LoadingLabelProvider({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return <LoadingLabel.Provider value={label}>{children}</LoadingLabel.Provider>
}

/**
 * What a page shows while the server prepares it.
 *
 * <p>The product's own mark rather than a sketch of the page to come: the
 * heart beating over an ECG sweep, the same pairing the login card and the
 * request overlay use, so every wait in the app looks like one thing. A bar
 * runs along the foot of the header as well, so the wait is still visible
 * when the card is scrolled away or the page is mostly off screen.
 *
 * <p>Held back for a beat before it fades in. A page the server answers within
 * that beat swaps straight in without the loader flashing up in between,
 * which on a fast connection is most of them.
 */
export function PageLoader() {
  const label = React.useContext(LoadingLabel)

  return (
    <div
      role="status"
      aria-live="polite"
      className="animate-fade flex min-h-[60dvh] items-center justify-center px-4 py-10 [animation-delay:120ms]"
    >
      {/* Fixed to the header's bottom edge; `<main>` is not transformed, so
          `fixed` here still means the viewport. */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-14 z-30 h-0.5 overflow-hidden"
      >
        <div className="h-full w-2/5 animate-progress rounded-full bg-gradient-to-r from-transparent via-primary to-blush" />
      </div>

      <div className="animate-rise glass-strong w-56 overflow-hidden rounded-3xl">
        <div className="flex flex-col items-center px-6 pt-6">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-blush text-primary-foreground shadow-lg">
            <HeartPulse className="size-6 animate-heartbeat" />
          </span>
        </div>
        {/* Quicker than the login card's resting trace: here it stands in
            for progress, and a slow sweep reads as a stall. */}
        <EcgLine duration={1.6} className="mt-3 h-10 w-full text-primary/80" />
        <p className="px-6 pt-1 pb-5 text-center text-sm font-medium text-muted-foreground">
          {label}
        </p>
      </div>
    </div>
  )
}
