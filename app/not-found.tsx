import Link from "next/link"
import { ArrowLeftIcon, CompassIcon } from "lucide-react"

import { HOME_PATH } from "@/lib/auth/cookies"

export const metadata = { title: "Page not found" }

/**
 * `h-full` rather than `min-h-screen`: the root body is a fixed-height,
 * `overflow-hidden` shell, so anything taller than the viewport here would be
 * clipped with no way to scroll to it.
 */
export default function NotFound() {
  return (
    <div className="flex h-full flex-col items-center justify-center px-6 py-12 text-center">
      <span className="mb-5 flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
        <CompassIcon className="size-7" />
      </span>
      <p className="text-sm font-medium tracking-widest text-muted-foreground uppercase">
        Error 404
      </p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
        This page doesn&rsquo;t exist
      </h1>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
        The link may be out of date. Everything else is still where you left it.
      </p>
      <Link
        href={HOME_PATH}
        className="mt-7 inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/85 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
      >
        <ArrowLeftIcon className="size-4" />
        Back to home
      </Link>
    </div>
  )
}
