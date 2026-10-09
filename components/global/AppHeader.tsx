"use client"

import Link from "next/link"
import { HeartPulse } from "lucide-react"

import { AccountMenu, type AccountLabels } from "@/components/global/AccountMenu"
import { AppNavLinks, type NavLabels } from "@/components/global/AppNav"
import { LanguageSwitcher } from "@/components/global/LanguageSwitcher"
import { NotificationBell } from "@/components/global/NotificationBell"
import { Badge } from "@/components/ui/badge"
import type { Patient } from "@/interface"
import { HOME_PATH } from "@/lib/auth/cookies"
import type { Strings } from "@/lib/strings"
import type { Language } from "@/lib/translation/languages"

/**
 * The bar across the top of every signed-in page.
 *
 * <p>A top bar rather than the console's sidebar: the portal is used on a
 * phone first, and has a handful of destinations rather than a menu tree.
 *
 * <p>Frosted glass laid over the top of the scrolling page rather than a solid
 * bar above it, so the page shows through, blurred, as it passes underneath.
 * The `after` rule lays the console header's teal-to-blush hairline along its
 * bottom edge, the one place the brand appears on every screen without taking
 * up any room.
 */
export function AppHeader({
  patient,
  navLabels,
  accountLabels,
  language,
  languageLabel,
  weekLabel,
  notificationLabels,
}: {
  patient: Patient
  navLabels: NavLabels
  accountLabels: AccountLabels
  language: Language
  /** "Language", in the language she is reading in. */
  languageLabel: string
  /** "Week 24", already worded and numbered by the shell. */
  weekLabel: string
  /** The bell and its panel, in the language she is reading in. */
  notificationLabels: Strings["notifications"]
}) {
  return (
    <header className="glass-strong absolute inset-x-0 top-0 z-30 flex h-14 items-center gap-3 px-4 after:pointer-events-none after:absolute after:inset-x-0 after:-bottom-px after:h-px after:bg-gradient-to-r after:from-primary/50 after:via-blush/30 after:to-transparent sm:px-6">
      <Link
        href={HOME_PATH}
        className="flex min-w-0 items-center gap-2 rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-blush text-primary-foreground">
          <HeartPulse className="size-4" />
        </span>
        <span className="truncate text-sm font-semibold tracking-tight text-foreground">
          Pregnancy Care
        </span>
      </Link>

      {/* From `sm` up the destinations sit here; below it they are in the tab
          bar at the bottom of the shell, where a thumb can reach them. */}
      <div className="ml-2 hidden sm:flex">
        <AppNavLinks labels={navLabels} />
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-3">
        <LanguageSwitcher current={language} label={languageLabel} />

        {/*
          The figure a patient orients everything else by. `secondary` rather
          than one of the clinical variants: those mean states, and a week is
          not one.
        */}
        <Badge variant="secondary" className="tabular-nums">
          {weekLabel}
        </Badge>
        <NotificationBell labels={notificationLabels} language={language} />
        <AccountMenu patient={patient} labels={accountLabels} />
      </div>
    </header>
  )
}
