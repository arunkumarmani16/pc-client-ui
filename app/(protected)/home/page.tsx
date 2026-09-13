import Link from "next/link"
import { ArrowRightIcon, BookOpenIcon, CalendarDaysIcon } from "lucide-react"

import { ContentCard } from "@/components/content/ContentCard"
import { PageHeader } from "@/components/global/PageHeader"
import type { Feed } from "@/interface"
import type { Language } from "@/lib/i18n"
import { GUIDANCE_PATH } from "@/lib/auth/cookies"
import { requireAuthConfig, requireSession } from "@/lib/auth/session"
import { currentLanguage } from "@/lib/language"
import { formatDate } from "@/lib/format"
import { getFeed } from "@/service"

export const metadata = { title: "Home" }

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

  // The preview cards are the same component the guidance page uses, so they
  // follow her language even though this page's own prose does not yet.
  const language = await currentLanguage()
  const feed = await previewFeed(language)

  return (
    <>
      <PageHeader
        title={`Hello, ${patient.firstName}`}
        description="Here is where your pregnancy is today."
      />

      <div className="space-y-4 px-4 py-4 sm:space-y-6 sm:px-6 sm:py-6">
        <ProgressCard
          week={pregnancy.currentWeek}
          ageLabel={pregnancy.ageLabel}
          trimesterLabel={pregnancy.trimesterLabel}
          progressPercent={pregnancy.progressPercent}
        />

        <div className="stagger grid gap-3 sm:grid-cols-2">
          <SummaryCard
            icon={<CalendarDaysIcon className="size-4" />}
            label="Due date"
            value={formatDate(patient.eddDate)}
            hint={pregnancy.dueDateLabel}
          />
          <SummaryCard
            icon={<BookOpenIcon className="size-4" />}
            label="This week"
            value={feed ? `${feed.items.length}` : "—"}
            hint={
              feed
                ? feed.items.length === 1
                  ? "piece of guidance for you"
                  : "pieces of guidance for you"
                : "Guidance could not be loaded"
            }
          />
        </div>

        <section className="space-y-3">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="font-semibold tracking-tight text-foreground">
              For week {pregnancy.currentWeek}
            </h2>
            {feed && feed.items.length > PREVIEW_COUNT && (
              <Link
                href={GUIDANCE_PATH}
                // Not "see all 3": this preview is the week, and `/guidance`
                // opens the whole month around it, which is usually more.
                // A count here would be contradicted by the page it leads to.
                className="flex shrink-0 items-center gap-1 rounded-md text-sm font-medium text-primary underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                All guidance
                <ArrowRightIcon className="size-3.5" />
              </Link>
            )}
          </div>

          {feed === null ? (
            <Notice>
              We could not load your guidance just now. Please refresh the page,
              or try again in a moment.
            </Notice>
          ) : feed.items.length === 0 ? (
            <Notice>
              There is nothing published for week {pregnancy.currentWeek} yet.
              Your clinic adds material as your pregnancy goes on — do have a
              look at the other weeks in the meantime.
            </Notice>
          ) : (
            <div className="stagger grid gap-3 sm:grid-cols-2">
              {feed.items.slice(0, PREVIEW_COUNT).map((content) => (
                <ContentCard key={content.contentId} content={content} language={language} />
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
async function previewFeed(language: Language): Promise<Feed | null> {
  try {
    return await getFeed({ lang: language }, await requireAuthConfig())
  } catch (error) {
    console.error("Could not load the week's guidance", error)
    return null
  }
}

/** The one figure everything else is read against, given the room to say so. */
function ProgressCard({
  week,
  ageLabel,
  trimesterLabel,
  progressPercent,
}: {
  week: number
  ageLabel: string
  trimesterLabel: string
  progressPercent: number
}) {
  return (
    <section className="animate-rise overflow-hidden rounded-xl border bg-card">
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2 p-4 sm:p-5">
        <div>
          <h2 className="text-sm text-muted-foreground">How far along</h2>
          <p className="mt-1 text-3xl font-semibold tracking-tight text-foreground tabular-nums">
            Week {week}
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
        aria-label="Pregnancy progress"
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
