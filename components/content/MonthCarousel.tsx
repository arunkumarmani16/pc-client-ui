"use client"

import * as React from "react"
import Link from "next/link"
import { LockIcon } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * Where a month stands against the one she is in. Only the month either side
 * of hers can be opened. `finished` is a month already behind her and `locked`
 * one still ahead; both are shown but cannot be opened.
 */
export type MonthStatus = "finished" | "previous" | "current" | "next" | "locked"

/**
 * One month card in the strip.
 *
 * <p>Hrefs and wording are both built on the server; this only draws them.
 * That is why the labels arrive as strings rather than being assembled here
 * from the number: a client component that worded its own cards would have
 * to be shipped the whole string table to do it.
 */
export interface CarouselMonth {
  month: number
  /** "Month". */
  monthLabel: string
  /** e.g. "17–20", the weeks the month covers. */
  weeksLabel: string
  /** The whole card spelled out for a screen reader. */
  ariaLabel: string
  /** Absent on a locked month, which cannot be opened. */
  href?: string
  /** The month being read. */
  active: boolean
  status: MonthStatus
}

/** One week chip under the months, including the "All" one. */
export interface CarouselWeek {
  /** Undefined on the "All weeks" chip. */
  week?: number
  label: string
  /** The chip and its count spelled out for a screen reader. */
  ariaLabel: string
  href: string
  active: boolean
  current: boolean
  count: number
}

/**
 * A colour per open month: pink for the month she has finished, teal for the
 * one she is in, blue for the one ahead. Picked from tokens that already carry
 * a dark-mode variant, and kept clear of `caution`, which the app reserves for
 * warnings.
 */
const MONTH_TONES: Record<"previous" | "current" | "next", { idle: string; active: string }> = {
  previous: {
    idle: "border-blush/30 bg-blush-soft text-blush hover:border-blush/60",
    active: "border-blush bg-blush-soft text-blush ring-1 ring-blush",
  },
  current: {
    idle: "border-primary/40 bg-primary/10 text-primary hover:border-primary/70",
    active: "border-primary bg-primary/10 text-primary ring-1 ring-primary",
  },
  next: {
    idle: "border-info/30 bg-info-soft text-info hover:border-info/60",
    active: "border-info bg-info-soft text-info ring-1 ring-info",
  },
}

/**
 * Shut months. A finished one keeps a faded pink so the strip reads as done
 * behind her; one still ahead stays grey.
 */
const SHUT_TONES: Record<"finished" | "locked", string> = {
  finished: "border-blush/30 bg-blush-soft/50 text-blush/60",
  locked: "border-border bg-muted/40 text-muted-foreground/60",
}

/**
 * The month and week strip: a swipeable carousel rather than a page of tabs.
 *
 * <p>Ten months and four weeks are more than fit across a phone, and a grid
 * that wraps to two rows reads as a calendar to be studied rather than a rail
 * to be flicked through. On a laptop all ten months fit at once, so the same
 * markup is a full-width strip there and a carousel on a phone, with no second
 * layout to keep in step.
 *
 * <p>This is the one part of the reader that has to be a client component: the
 * selected month is centred after paint, which a server render cannot do.
 * Everything it draws is a plain `<Link>`, so it still works before hydration
 * and the browser's back button behaves — the selection lives in the URL, not
 * in this component.
 */
export function MonthCarousel({
  months,
  weeks,
}: {
  months: CarouselMonth[]
  weeks: CarouselWeek[]
}) {
  const activeMonth = months.find((entry) => entry.active)?.month

  return (
    <div className="space-y-2">
      <MonthRail months={months} activeMonth={activeMonth} />
      <WeekRail weeks={weeks} />
    </div>
  )
}

function MonthRail({
  months,
  activeMonth,
}: {
  months: CarouselMonth[]
  activeMonth?: number
}) {
  const rail = React.useRef<HTMLDivElement>(null)
  const selected = React.useRef<HTMLAnchorElement>(null)
  // First pass jumps, later ones glide: on arrival the strip should already be
  // in the right place, but a month picked from the strip should be seen to
  // move rather than teleport.
  const settled = React.useRef(false)

  React.useEffect(() => {
    const box = rail.current
    const card = selected.current
    if (!box || !card) return

    // Scrolled by hand rather than through `scrollIntoView`, which walks up the
    // ancestors and would drag the page itself sideways or vertically with it.
    box.scrollTo({
      left: Math.max(card.offsetLeft - (box.clientWidth - card.clientWidth) / 2, 0),
      behavior: settled.current ? "smooth" : "auto",
    })
    settled.current = true
  }, [activeMonth])

  const shape =
    "flex w-[4.5rem] shrink-0 snap-center flex-col items-center gap-0.5 rounded-xl border py-2 leading-none transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50"

  return (
    <div
      ref={rail}
      // `relative` so a card's `offsetLeft` is measured against this strip and
      // not against whatever happens to be positioned further up the page.
      className="no-scrollbar relative flex snap-x snap-mandatory gap-1.5 overflow-x-auto scroll-smooth"
    >
      {months.map((entry) => {
        if (entry.status === "finished" || entry.status === "locked" || !entry.href) {
          // Not a link, so there is nothing to tab to or tap that goes nowhere.
          // Still drawn, so she can see how far the months run.
          return (
            <span
              key={entry.month}
              role="link"
              aria-disabled="true"
              aria-label={entry.ariaLabel}
              className={cn(
                shape,
                "cursor-not-allowed border-dashed",
                SHUT_TONES[entry.status === "finished" ? "finished" : "locked"]
              )}
            >
              <LockIcon className="size-[0.5625rem]" aria-hidden />
              <span className="text-lg font-semibold tabular-nums">{entry.month}</span>
              <span className="text-[0.625rem] tabular-nums opacity-70">{entry.weeksLabel}</span>
            </span>
          )
        }

        const tone = MONTH_TONES[entry.status]

        return (
          <Link
            key={entry.month}
            ref={entry.active ? selected : undefined}
            href={entry.href}
            aria-current={entry.active ? "page" : undefined}
            // Spelled out for a screen reader, which has neither the weeks under
            // the number nor the colour marking which month this is.
            aria-label={entry.ariaLabel}
            className={cn(shape, entry.active ? tone.active : tone.idle)}
          >
            <span className="text-[0.5625rem] font-medium tracking-wide uppercase opacity-70">
              {entry.monthLabel}
            </span>
            <span className="text-lg font-semibold tabular-nums">{entry.month}</span>
            <span className="text-[0.625rem] tabular-nums opacity-70">{entry.weeksLabel}</span>
          </Link>
        )
      })}
    </div>
  )
}

/**
 * The weeks inside the month being read.
 *
 * <p>Counted, because the point of opening a week is to find what is in it:
 * a week with nothing under it says so before it is tapped rather than after.
 */
function WeekRail({ weeks }: { weeks: CarouselWeek[] }) {
  return (
    <div className="no-scrollbar flex gap-1.5 overflow-x-auto">
      {weeks.map((entry) => (
        <Link
          key={entry.week ?? "all"}
          href={entry.href}
          aria-current={entry.active ? "true" : undefined}
          aria-label={entry.ariaLabel}
          className={cn(
            "flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium whitespace-nowrap transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
            entry.active
              ? "border-primary bg-primary/10 text-primary"
              : "border-border bg-card text-muted-foreground hover:text-foreground",
            entry.current && !entry.active && "border-primary/40",
            // Nothing filed under it: still reachable, but not dressed up as
            // somewhere worth going.
            entry.count === 0 && !entry.active && "opacity-55"
          )}
        >
          {entry.label}
          <span
            className={cn(
              "rounded-full px-1.5 py-px text-[0.625rem] tabular-nums",
              entry.active ? "bg-primary/15" : "bg-muted"
            )}
            aria-hidden
          >
            {entry.count}
          </span>
        </Link>
      ))}
    </div>
  )
}
