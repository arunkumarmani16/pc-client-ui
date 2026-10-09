"use client"

import { useLinkStatus } from "next/link"

import { cn } from "@/lib/utils"

/**
 * Immediate proof that a tap landed, for the moments a `loading.tsx` cannot
 * cover: on a slow network the page loader may not have been prefetched yet, and
 * until it arrives nothing on screen would change.
 *
 * <p>Must sit inside a `<Link>` (that is whose status it reads), and the link
 * must be positioned, since this fills it. Always rendered and faded rather
 * than mounted on demand, so it can never shift the layout. The delay applies
 * only on the way in: a navigation that resolves within it shows nothing.
 */
export function LinkPending({
  className,
  pendingClassName,
}: {
  /** Shape and look, e.g. `inset-0 rounded-full liquid-drop`. */
  className?: string
  /** Classes worn only while pending, such as an animation. */
  pendingClassName?: string
}) {
  const { pending } = useLinkStatus()

  return (
    <span
      aria-hidden
      className={cn(
        "pointer-events-none absolute opacity-0 transition-opacity duration-200",
        className,
        pending && cn("opacity-100 delay-100", pendingClassName)
      )}
    />
  )
}
