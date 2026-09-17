import Link from "next/link"
import type { Metadata } from "next"
import { ArrowRightIcon, BookOpenIcon, CalendarDaysIcon } from "lucide-react"

import { ContentCard } from "@/components/content/ContentCard"
import { PageHeader } from "@/components/global/PageHeader"
import type { Feed } from "@/interface"
import { GUIDANCE_PATH } from "@/lib/auth/cookies"
import { requireAuthConfig, requireSession } from "@/lib/auth/session"
import { formatDate } from "@/lib/format"
import { strings } from "@/lib/strings"
import { getFeed } from "@/service"

export async function generateMetadata(): Promise<Metadata> {
  return { title: strings.home.title }
}

/** How many pieces the home page previews before sending her to the full week. */
const PREVIEW_COUNT = 3

/**
 * Where a signed-in mother lands: how far along she is, when the baby is due,
 * and the first of what the clinic has published for this week.
 *
 * <p>The feed is previewed rather than listed in full — this page answers
 * "where am I?", and `/guidance` answers "what should I read?".
 */
export default async function HomePage() {
  // Cached for the request, so this shares the layout's lookup.
  const { patient } = await requireSession()
  const { pregnancy } = patient

  const copy = strings
  const feed = await previewFeed()

  return (
    <>
      <PageHeader title={copy.home.hello(patient.firstName)} description={copy.home.intro} />

      <div className="space-y-4 px-4 py-4 sm:space-y-6 sm:px-6 sm:py-6">
        <ProgressCard
          heading={copy.home.howFarAlong}
          weekLabel={copy.nav.weekBadge(pregnancy.currentWeek)}
          ageLabel={copy.pregnancy.age(pregnancy.weeks, pregnancy.days)}
          trimesterLabel={copy.guidance.trimester(pregnancy.trimester)}
          progressLabel={copy.home.progressAria}
          progressPercent={pregnancy.progressPercent}
        />

        <div className="stagger grid gap-3 sm:grid-cols-2">
          <SummaryCard
            icon={<CalendarDaysIcon className="size-4" />}
            label={copy.home.dueDate}
            value={formatDate(patient.eddDate)}
            hint={copy.pregnancy.dueDate(pregnancy.daysUntilDueDate)}
          />
          <SummaryCard
            icon={<BookOpenIcon className="size-4" />}
            label={copy.home.thisWeek}
            value={feed ? `${feed.items.length}` : "—"}
            hint={feed ? copy.home.piecesForYou(feed.items.length) : copy.home.couldNotLoad}
          />
        </div>

        <section className="space-y-3">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="font-semibold tracking-tight text-foreground">
              {copy.home.forWeek(pregnancy.currentWeek)}
            </h2>
            {feed && feed.items.length > PREVIEW_COUNT && (
              <Link
                href={GUIDANCE_PATH}
                // Not "see all 3": this preview is the week, and `/guidance`
                // opens the whole month around it, which is usually more.
                // A count here would be contradicted by the page it leads to.
                className="flex shrink-0 items-center gap-1 rounded-md text-sm font-medium text-primary underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                {copy.content.allGuidance}
                <ArrowRightIcon className="size-3.5" />
              </Link>
            )}
          </div>

          {feed === null ? (
            <Notice>{copy.home.loadFailed}</Notice>
          ) : feed.items.length === 0 ? (
            <Notice>{copy.home.nothingForWeek(pregnancy.currentWeek)}</Notice>
          ) : (
            <div className="stagger grid gap-3 sm:grid-cols-2">
              {feed.items.slice(0, PREVIEW_COUNT).map((content) => (
                <ContentCard key={content.contentId} content={content} />
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  )
}

/**
 * This week's feed, or null if it could not be fetched.
 *
 * <p>Swallowed on purpose: the two readings above it — how far along she is
 * and when the baby is due — come from the session and are the reason she
 * opened the app. A content outage should cost her the list, not the page.
 */
async function previewFeed(): Promise<Feed | null> {
  try {
    return await getFeed({}, await requireAuthConfig())
  } catch (error) {
    console.error("Could not load the week's guidance", error)
    return null
  }
}

/** The one figure everything else is read against, given the room to say so. */
function ProgressCard({
  heading,
  weekLabel,
  ageLabel,
  trimesterLabel,
  progressLabel,
  progressPercent,
}: {
  heading: string
  weekLabel: string
  ageLabel: string
  trimesterLabel: string
  progressLabel: string
  progressPercent: number
}) {
  return (
    <section className="animate-rise overflow-hidden rounded-xl border bg-card">
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2 p-4 sm:p-5">
        <div>
          <h2 className="text-sm text-muted-foreground">{heading}</h2>
          <p className="mt-1 text-3xl font-semibold tracking-tight text-foreground tabular-nums">
            {weekLabel}
          </p>
          <p className="mt-0.5 text-sm text-muted-foreground">{ageLabel}</p>
        </div>
        <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
          {trimesterLabel}
        </span>
      </div>

      {/*
        Labelled as a progress bar rather than left as decoration, so it is
        announced instead of skipped. The visible figures above it carry the
        same information for anyone who cannot see the fill.
      */}
      <div
        role="progressbar"
        aria-valuenow={progressPercent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={progressLabel}
        className="h-1.5 w-full bg-muted"
      >
        <div
          className="animate-fill h-full rounded-r-full bg-gradient-to-r from-primary to-blush"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </section>
  )
}

function SummaryCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode
  label: string
  value: string
  hint: string
}) {
  return (
    <section className="rounded-xl border bg-card p-4 sm:p-5">
      <h2 className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <span className="text-primary">{icon}</span>
        {label}
      </h2>
      <p className="mt-1 text-2xl font-semibold tracking-tight text-foreground tabular-nums">
        {value}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">{hint}</p>
    </section>
  )
}

function Notice({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-xl border border-dashed bg-card px-4 py-6 text-center text-sm leading-relaxed text-muted-foreground">
      {children}
    </p>
  )
}
