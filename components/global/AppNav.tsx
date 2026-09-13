"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { BookOpenIcon, HouseIcon, UserRoundIcon } from "lucide-react"

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
 * The three words, in the language of the request.
 *
 * <p>Passed in from the server rather than read from `lib/i18n` here: these are
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
              "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
              current
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
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
 * <p>A flex sibling of the scrolling area rather than a fixed overlay: laid
 * out in the flow it cannot cover the last card, so no page has to leave a gap
 * the height of the bar and no gap can be the wrong size. `pb-safe` clears the
 * iOS home indicator.
 */
export function AppTabBar({ labels }: { labels: NavLabels }) {
  const pathname = usePathname()

  return (
    <nav
      aria-label={labels.guidance}
      className="pb-safe flex shrink-0 border-t bg-card sm:hidden"
    >
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
              "flex min-h-14 flex-1 flex-col items-center justify-center gap-1 text-[0.6875rem] font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset",
              current ? "text-primary" : "text-muted-foreground"
            )}
          >
            <Icon className={cn("size-5", current && "fill-primary/10")} />
            {labels[key]}
          </Link>
        )
      })}
    </nav>
  )
}
