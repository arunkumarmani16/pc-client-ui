"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { BookOpenIcon, HouseIcon, UserRoundIcon } from "lucide-react"

import { LinkPending } from "@/components/global/LinkPending"
import { GUIDANCE_PATH, HOME_PATH, PROFILE_PATH } from "@/lib/auth/cookies"
import { cn } from "@/lib/utils"

/**
 * The portal's three destinations. Few enough to show all of them at once,
 * which is the point — a mother should never have to open a menu to find out
 * what this app does.
 */
const DESTINATIONS = [
  { href: HOME_PATH, key: "home", icon: HouseIcon },
  { href: GUIDANCE_PATH, key: "guidance", icon: BookOpenIcon },
  { href: PROFILE_PATH, key: "profile", icon: UserRoundIcon },
] as const

/**
 * The three words.
 *
 * <p>Passed in from the server rather than read from `lib/strings` here: these are
 * client components, and importing the dictionary would send every string in
 * the app to the browser to label three tabs.
 */
export type NavLabels = { home: string; guidance: string; profile: string }

/**
 * Whether a destination is the one being shown.
 *
 * <p>Prefix-matched rather than compared outright, so an article at
 * `/guidance/CNT001` keeps the Guidance tab lit. Home is exact: every path
 * would otherwise be "inside" it.
 */
function isCurrent(pathname: string, href: string): boolean {
  return href === HOME_PATH
    ? pathname === href
    : pathname === href || pathname.startsWith(`${href}/`)
}

/**
 * The header's own navigation, from the small breakpoint up.
 *
 * <p>Hidden on a phone, where {@link AppTabBar} carries the same three
 * destinations within thumb reach instead.
 */
export function AppNavLinks({ labels }: { labels: NavLabels }) {
  const pathname = usePathname()

  return (
    <nav aria-label={labels.guidance} className="hidden items-center gap-1 sm:flex">
      {DESTINATIONS.map(({ href, key, icon: Icon }) => {
        const current = isCurrent(pathname, href)

        return (
          <Link
            key={href}
            href={href}
            aria-current={current ? "page" : undefined}
            className={cn(
              "relative isolate flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
              current
                ? "liquid-drop text-primary"
                : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
            )}
          >
            <LinkPending
              className="inset-0 -z-10 rounded-full"
              pendingClassName="liquid-drop animate-pulse"
            />
            <Icon className="size-4" />
            {labels[key]}
          </Link>
        )
      })}
    </nav>
  )
}

/**
 * The phone's bottom tab bar.
 *
 * <p>A pill of glass floating just above the bottom edge, with the page
 * scrolling underneath it. The shell pads `<main>` by the pill's height, so
 * the last card can still be scrolled clear of it. Its offset from the bottom
 * takes whichever is larger, a small gap or the iOS home indicator, so it
 * clears the indicator without sitting a gap above it as well.
 *
 * <p>The current tab is marked by one liquid drop that slides between tabs
 * rather than by each tab lighting up on its own. The slight overshoot in its
 * easing is what makes it read as liquid settling instead of a box moving.
 */
export function AppTabBar({ labels }: { labels: NavLabels }) {
  const pathname = usePathname()
  const currentIndex = DESTINATIONS.findIndex(({ href }) => isCurrent(pathname, href))

  return (
    <nav
      aria-label={labels.guidance}
      className="glass-strong fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom,0px))] z-30 mx-auto flex max-w-sm rounded-full p-1.5 sm:hidden"
    >
      {/*
        Sized to one tab of the three (the pill less its padding, split three
        ways) and moved by whole widths of itself, so it lands exactly on the
        tab at any phone width. Hidden on a page that is not one of the three,
        rather than left parked on the last one visited.
      */}
      <span
        aria-hidden
        className={cn(
          "liquid-drop pointer-events-none absolute inset-y-1.5 left-1.5 w-[calc((100%-0.75rem)/3)] rounded-full transition-[transform,opacity] duration-500 ease-[cubic-bezier(0.34,1.45,0.5,1)]",
          currentIndex < 0 && "opacity-0"
        )}
        style={{ transform: `translateX(${Math.max(currentIndex, 0) * 100}%)` }}
      />

      {DESTINATIONS.map(({ href, key, icon: Icon }) => {
        const current = isCurrent(pathname, href)

        return (
          <Link
            key={href}
            href={href}
            aria-current={current ? "page" : undefined}
            className={cn(
              // A tall target: this is the one control used one-handed, on the
              // move, and 44px is the smallest that reliably gets hit.
              "relative isolate flex min-h-12 flex-1 flex-col items-center justify-center gap-0.5 rounded-full text-[0.6875rem] font-medium transition-[color,transform] outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset active:scale-95",
              current ? "text-primary" : "text-muted-foreground"
            )}
          >
            {/* A faint drop under the tapped tab until the page commits, when
                the real one slides across to take its place. */}
            <LinkPending
              className="inset-0 -z-10 rounded-full"
              pendingClassName="liquid-drop animate-pulse"
            />
            <Icon className={cn("size-5", current && "fill-primary/15")} />
            {labels[key]}
          </Link>
        )
      })}
    </nav>
  )
}
