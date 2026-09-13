"use client"

import * as React from "react"
import Link from "next/link"

import { cn } from "@/lib/utils"

/**
 * One month card in the strip.
 *
 * <p>Hrefs and wording are both built on the server; this only draws them.
 * That is why the labels arrive as strings rather than being assembled here
 * from the number: the app is read in more than one language, and a client
 * component that worded its own cards would have to be shipped the whole
 * dictionary to do it.
 */
export interface CarouselMonth {
  month: number
  /** "Month", or the same word in the language she is reading. */
  monthLabel: string
  /** e.g. "17–20", the weeks the month covers. */
  weeksLabel: string
  /** The whole card spelled out for a screen reader, in her language. */
  ariaLabel: string
  href: string
  /** The month being read. */
  active: boolean
  /** The month she is actually in, whichever one she is reading. */
  current: boolean
}

/** One week chip under the months, including the "All" one. */
export interface CarouselWeek {
  /** Undefined on the "All weeks" chip. */
  week?: number
  label: string
  /** The chip and its count spelled out for a screen reader, in her language. */
  ariaLabel: string
  href: string
  active: boolean
  current: boolean
  count: number
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

  return (
    <div
      ref={rail}
      // `relative` so a card's `offsetLeft` is measured against this strip and
      // not against whatever happens to be positioned further up the page.
      className="no-scrollbar relative flex snap-x snap-mandatory gap-1.5 overflow-x-auto scroll-smooth"
    >
      {months.map((entry) => (
        <Link
          key={entry.month}
          ref={entry.active ? selected : undefined}
          href={entry.href}
          aria-current={entry.active ? "page" : undefined}
          // Spelled out for a screen reader, which has neither the weeks under
          // the number nor the outline marking where she is.
          aria-label={entry.ariaLabel}
          className={cn(
            "flex w-[4.5rem] shrink-0 snap-center flex-col items-center gap-0.5 rounded-xl border py-2 leading-none transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
            entry.active
              ? "border-primary bg-primary/10 text-primary"
              : "border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground",
            // Her own month keeps a mark of its own while she reads another, so
            // the strip never loses where she actually is.
            entry.current && !entry.active && "border-primary/40"
          )}
        >
          <span className="text-[0.5625rem] font-medium tracking-wide uppercase opacity-70">
            {entry.monthLabel}
          </span>
          <span className="text-lg font-semibold tabular-nums">{entry.month}</span>
          <span className="text-[0.625rem] tabular-nums opacity-70">
            {entry.weeksLabel}
          </span>
        </Link>
      ))}
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
