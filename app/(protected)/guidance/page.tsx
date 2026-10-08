import Link from "next/link"
import { redirect } from "next/navigation"
import type { Metadata } from "next"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"

import { ContentCard } from "@/components/content/ContentCard"
import {
  MonthCarousel,
  type CarouselMonth,
  type CarouselWeek,
  type MonthStatus,
} from "@/components/content/MonthCarousel"
import { PageHeader } from "@/components/global/PageHeader"
import type { Content, ContentCategory, ContentStage, MonthFeed } from "@/interface"
import { GUIDANCE_PATH } from "@/lib/auth/cookies"
import { categoryStyle } from "@/lib/content"
import {
  POST_DELIVERY_MONTHS,
  PREGNANCY_MONTHS,
  clampMonth,
  isMonthOpen,
  timelineIndex,
  weeksOf,
  type MonthRef,
} from "@/lib/pregnancy"
import { requireAuthConfig } from "@/lib/auth/session"
import { stringsFor, type Strings } from "@/lib/strings"
import { currentLanguage } from "@/lib/translation/current"
import { localizeContents, localizeMonthFeed } from "@/lib/translation/localize"
import { cn } from "@/lib/utils"
import { getMonthFeed } from "@/service"

export async function generateMetadata(): Promise<Metadata> {
  return { title: stringsFor(await currentLanguage()).guidance.title }
}

type Search = {
  /** `POST_DELIVERY` for the months after the birth; absent for the pregnancy. */
  stage?: string | string[]
  month?: string | string[]
  week?: string | string[]
  category?: string | string[]
}

/**
 * The month-by-month reader.
 *
 * <p>Organised by month because that is the unit the material is written in:
 * staff file a piece under a pregnancy month, so a month is a whole chapter
 * where a week was a slice of one that usually read the same as its
 * neighbours. The month is read in one request set and then narrowed here — by
 * week, by topic, or by both — so neither of those filters costs a round trip.
 *
 * <p>Three months can be opened: the one she is in, the one before and the one
 * after. The rest are shown locked. The window comes from `isMonthOpen` in
 * `lib/pregnancy.ts` rather than being written out here.
 *
 * <p>The ten months of the pregnancy run straight on into the one month after
 * the birth — the last she will read, since her login ends a month after the
 * due date — so the window crosses the delivery like any other month
 * boundary: in month 10, the month after the birth is the next one along.
 */
export default async function GuidancePage({
  searchParams,
}: {
  searchParams: Promise<Search>
}) {
  const params = await searchParams
  const category = categoryParam(params.category)
  const language = await currentLanguage()
  const words = stringsFor(language)
  const copy = words.guidance

  // Fetched unfiltered even when something is chosen: a month holds a handful
  // of pieces, and one read gives the list, the weeks that have anything in
  // them, and the topics that do. Filtering server-side instead would cost a
  // round trip per chip and still offer chips leading to empty pages.
  const requestedMonth = monthParam(params.month)
  const requested: MonthRef | undefined =
    requestedMonth === undefined
      ? undefined
      : { stage: stageParam(params.stage), month: requestedMonth }
  const feed = localizeMonthFeed(
    await getMonthFeed(requested, language, await requireAuthConfig()),
    language
  )

  // `getMonthFeed` serves her own month in place of a locked one. The URL is put
  // right as well, so the address bar never names a month the page is not showing.
  if (
    requested !== undefined &&
    (requested.stage !== feed.stage || clampMonth(requested.month, requested.stage) !== feed.month)
  ) {
    redirect(hrefFor(undefined, undefined, category))
  }

  const shown: MonthRef = { stage: feed.stage, month: feed.month }
  const week = weekParam(params.week, shown)

  // Each filter is counted against the other one's result, so a week chip
  // never promises pieces that the chosen topic has already ruled out, and a
  // topic chip never appears for a week that does not have it.
  const inWeek = week === undefined ? feed.items : feed.items.filter(covers(week))
  const inCategory = category
    ? feed.items.filter((item) => item.category === category)
    : feed.items
  // Only the app's own labels: the pieces arrive from the API already in
  // whichever language the clinic has approved them in.
  const items = localizeContents(
    week === undefined ? inCategory : inCategory.filter(covers(week)),
    language
  )

  return (
    <>
      <PageHeader
        title={feed.currentMonth ? copy.thisMonth : monthName(shown, words)}
        description={`${feed.trimesterLabel} · ${feed.weeksLabel}`}
      />

      <div className="space-y-4 px-4 py-4 sm:px-6 sm:py-6">
        <MonthNav feed={feed} week={week} category={category} words={words} />
        <CategoryFilter
          all={inWeek}
          month={shown}
          week={week}
          selected={category}
          allLabel={copy.allTopics}
        />

        {items.length === 0 ? (
          <p className="rounded-xl border border-dashed bg-card px-4 py-10 text-center text-sm leading-relaxed text-muted-foreground">
            {emptyMessage(feed, week, category, words)}
          </p>
        ) : (
          <div className="stagger grid gap-3 sm:grid-cols-2">
            {items.map((content) => (
              <ContentCard
                key={content.contentId}
                content={content}
                copy={words.content}
                deckCopy={words.deck}
              />
            ))}
          </div>
        )}
      </div>
    </>
  )
}

/**
 * Back a month, forward a month, straight to any month or any week of it, and
 * a way home to the current one.
 *
 * <p>The arrows and the carousel are both here rather than either on its own:
 * the arrows are how a mother moves while she is reading, and the carousel is
 * how she reaches month 8 from her fifth without passing through three months
 * she did not ask for.
 */
function MonthNav({
  feed,
  week,
  category,
  words,
}: {
  feed: MonthFeed
  week?: number
  category?: ContentCategory
  words: Strings
}) {
  // Bounded by the open months rather than the calendar, so an arrow never
  // steps into a locked month. Worked out by `getMonthFeed`, which is where
  // the step across the birth from month 10 is known about.
  const { previous, next } = feed
  const copy = words.guidance
  const afterBirth = feed.stage === "POST_DELIVERY"
  const hereAfterBirth = feed.thisStage === "POST_DELIVERY"

  return (
    <nav aria-label={copy.pregnancyMonth} className="space-y-2 rounded-xl border bg-card p-2">
      <div className="flex items-center justify-between gap-3">
        <Step
          href={previous === null ? null : hrefFor(previous, undefined, category)}
          label={copy.previousMonth}
        >
          <ChevronLeftIcon className="size-4" />
        </Step>

        <div className="min-w-0 text-center">
          <p className="text-sm font-semibold tracking-tight text-foreground tabular-nums">
            {week === undefined
              ? monthName({ stage: feed.stage, month: feed.month }, words)
              : afterBirth
                ? copy.afterBirthAndWeek(week)
                : copy.monthAndWeek(feed.month, week)}
          </p>
          {feed.currentMonth ? (
            // The one line still spoken in weeks: the month is what she reads,
            // but the week is how her clinic and her own notes describe her.
            <p className="text-xs text-primary">
              {hereAfterBirth
                ? copy.youAreHereAfterBirth(feed.thisWeek)
                : copy.youAreHere(feed.thisWeek)}
            </p>
          ) : (
            <Link
              href={hrefFor(undefined, undefined, category)}
              className="rounded text-xs text-muted-foreground underline-offset-4 outline-none hover:text-foreground hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {hereAfterBirth
                ? copy.backToAfterBirth
                : copy.backToMonth(feed.thisMonth)}
            </Link>
          )}
        </div>

        <Step
          href={next === null ? null : hrefFor(next, undefined, category)}
          label={copy.nextMonth}
        >
          <ChevronRightIcon className="size-4" />
        </Step>
      </div>

      <MonthCarousel
        months={monthCards(feed, category, words)}
        weeks={weekChips(feed, week, category, words)}
      />
    </nav>
  )
}

/**
 * The month cards — the ten of the pregnancy, then one "After birth" card for
 * the month after the delivery: hers, the one before and the one after open,
 * each in its own colour, and the rest locked.
 *
 * <p>A month always opens whole: the week is dropped from the link because
 * week 18 means nothing once month 7 is the one being read, and carrying it
 * across would land her on an empty page.
 */
function monthCards(
  feed: MonthFeed,
  category: ContentCategory | undefined,
  words: Strings
): CarouselMonth[] {
  const copy = words.guidance
  const suffix: Record<MonthStatus, string> = {
    finished: copy.lockedSuffix,
    previous: ` — ${copy.previousMonth}`,
    current: copy.hereSuffix,
    next: ` — ${copy.nextMonth}`,
    locked: copy.lockedSuffix,
  }
  const here: MonthRef = { stage: feed.thisStage, month: feed.thisMonth }

  return [...PREGNANCY_MONTHS, ...POST_DELIVERY_MONTHS].map((entry) => {
    const weeksLabel = `${entry.startWeek}–${entry.endWeek}`
    const status = statusOf(entry, here)
    const afterBirth = entry.stage === "POST_DELIVERY"

    return {
      id: `${entry.stage}-${entry.month}`,
      month: entry.month,
      afterBirth,
      monthLabel: afterBirth ? copy.afterBirth : copy.monthLabel,
      weeksLabel,
      // Built here rather than in the carousel: the strip is a client
      // component, and shipping it a dictionary to assemble one sentence from
      // would send every string in the app to the browser to save five words.
      ariaLabel:
        (afterBirth
          ? copy.monthAfterBirthAria(weeksLabel)
          : copy.monthAria(entry.month, weeksLabel)) + suffix[status],
      href:
        status === "locked" || status === "finished"
          ? undefined
          : hrefFor(entry, undefined, category),
      active: entry.stage === feed.stage && entry.month === feed.month,
      status,
    }
  })
}

/**
 * Where a month stands against hers, measured along the whole line so the
 * birth is just another month boundary. Anything beyond the one either side is
 * shut: `finished` when it is already behind her, `locked` when still ahead.
 */
function statusOf(month: MonthRef, here: MonthRef): MonthStatus {
  const distance = timelineIndex(month) - timelineIndex(here)
  if (distance === 0) return "current"
  if (!isMonthOpen(month, here)) return distance < 0 ? "finished" : "locked"
  return distance < 0 ? "previous" : "next"
}

/**
 * "All" plus one chip per week of the month being read.
 *
 * <p>Weeks 41 and 42 belong to no month of their own and are carried by month
 * 10, so they are offered only when something is actually filed under them, or
 * when she is in one — an empty pair of chips on every tenth month would read
 * as a defect rather than as provision for going overdue.
 */
function weekChips(
  feed: MonthFeed,
  selected: number | undefined,
  category: ContentCategory | undefined,
  words: Strings
): CarouselWeek[] {
  const copy = words.guidance
  const inCategory = category
    ? feed.items.filter((item) => item.category === category)
    : feed.items

  const shown: MonthRef = { stage: feed.stage, month: feed.month }
  // Her week only marks a chip on her own side of the birth: week 6 after it
  // is not week 6 of the pregnancy.
  const herWeek = feed.stage === feed.thisStage ? feed.thisWeek : undefined

  const chips: CarouselWeek[] = [
    {
      label: copy.allWeeks,
      ariaLabel: copy.allWeeksAria(inCategory.length),
      href: hrefFor(shown, undefined, category),
      active: selected === undefined,
      current: false,
      count: inCategory.length,
    },
  ]

  for (const week of weeksOf(feed.month, feed.stage)) {
    const overdueWeek = week > feed.endWeek
    if (overdueWeek && week !== herWeek && !feed.items.some(covers(week))) continue

    const count = inCategory.filter(covers(week)).length

    chips.push({
      week,
      label: copy.week(week),
      ariaLabel: copy.weekAria(week, count) + (week === herWeek ? copy.weekYouAreIn : ""),
      href: hrefFor(shown, week, category),
      active: week === selected,
      current: week === herWeek,
      count,
    })
  }

  return chips
}

/**
 * One arrow. Rendered as a disabled span rather than a link at the ends of the
 * range, so there is nothing to tab to that would go nowhere.
 */
function Step({
  href,
  label,
  children,
}: {
  href: string | null
  label: string
  children: React.ReactNode
}) {
  const shape =
    "flex size-9 shrink-0 items-center justify-center rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50"

  if (!href) {
    return (
      <span aria-hidden className={cn(shape, "text-muted-foreground/35")}>
        {children}
      </span>
    )
  }

  return (
    <Link
      href={href}
      aria-label={label}
      className={cn(shape, "text-muted-foreground transition-colors hover:bg-muted hover:text-foreground")}
    >
      {children}
    </Link>
  )
}

/**
 * Topic chips for what is being shown.
 *
 * <p>Only categories the month — or the week, once one is chosen — actually
 * has, so no chip leads to an empty page. Hidden entirely when there is
 * nothing to narrow: one chip beside "All" is a control that cannot change
 * anything.
 */
function CategoryFilter({
  all,
  month,
  week,
  selected,
  allLabel,
}: {
  all: Content[]
  month: MonthRef
  week?: number
  selected?: ContentCategory
  /** "All"; every other chip is worded by the API. */
  allLabel: string
}) {
  const present: ContentCategory[] = []
  for (const item of all) {
    if (!present.includes(item.category)) present.push(item.category)
  }

  if (present.length < 2) return null

  const labelOf = (category: ContentCategory) =>
    all.find((item) => item.category === category)?.categoryLabel ?? category

  return (
    // Scrolls sideways within its own strip on a narrow phone rather than
    // wrapping to three rows of chips above the content.
    <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
      <Chip href={hrefFor(month, week, undefined)} active={!selected}>
        {allLabel}
      </Chip>

      {present.map((category) => {
        const { icon: Icon, chip } = categoryStyle(category)
        const active = selected === category

        return (
          <Chip
            key={category}
            href={hrefFor(month, week, active ? undefined : category)}
            active={active}
            activeClass={chip}
          >
            <Icon className="size-3.5" />
            {labelOf(category)}
          </Chip>
        )
      })}
    </div>
  )
}

function Chip({
  href,
  active,
  activeClass = "bg-primary/10 text-primary",
  children,
}: {
  href: string
  active: boolean
  activeClass?: string
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "true" : undefined}
      className={cn(
        "flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        active
          ? cn("border-transparent", activeClass)
          : "border-border bg-card text-muted-foreground hover:text-foreground"
      )}
    >
      {children}
    </Link>
  )
}

/** Whether a piece covers a given week of the stage being read. */
function covers(week: number) {
  return (item: Content) => item.startWeek <= week && item.endWeek >= week
}

/** Says which of the three filters came up empty, rather than only that something did. */
function emptyMessage(
  feed: MonthFeed,
  week: number | undefined,
  category: ContentCategory | undefined,
  words: Strings
): string {
  const copy = words.guidance

  if (feed.items.length === 0) {
    return feed.stage === "POST_DELIVERY"
      ? copy.nothingAfterBirth
      : copy.nothingForMonth(feed.month)
  }
  if (week !== undefined) {
    return category ? copy.nothingInTopicForWeek(week) : copy.nothingForWeek(week)
  }
  return copy.nothingInTopicThisMonth
}

/** "Month 5", or "First month after birth". */
function monthName({ stage, month }: MonthRef, words: Strings): string {
  return stage === "POST_DELIVERY"
    ? words.guidance.monthAfterBirth
    : words.guidance.month(month)
}

/**
 * A link back to this page, keeping whichever of the three filters still
 * applies. A pregnancy month carries no `stage`, so the links that existed
 * before there were months after the birth still read the same.
 */
function hrefFor(
  month: MonthRef | undefined,
  week: number | undefined,
  category: ContentCategory | undefined
): string {
  const query = new URLSearchParams()
  if (month !== undefined) {
    if (month.stage === "POST_DELIVERY") query.set("stage", month.stage)
    query.set("month", String(month.month))
  }
  if (week !== undefined) query.set("week", String(week))
  if (category) query.set("category", category)

  const search = query.toString()
  return search ? `${GUIDANCE_PATH}?${search}` : GUIDANCE_PATH
}

/**
 * A month outside the calendar is dropped rather than argued with —
 * `getMonthFeed` clamps whatever it is given anyway.
 */
function monthParam(value: string | string[] | undefined): number | undefined {
  const raw = Array.isArray(value) ? value[0] : value
  if (!raw) return undefined

  const month = Number.parseInt(raw, 10)
  return Number.isFinite(month) ? month : undefined
}

/**
 * A week is only honoured when it belongs to the month being read: a link
 * carrying week 18 into month 7 would otherwise filter everything away and
 * leave a page that looks broken rather than empty.
 */
function weekParam(value: string | string[] | undefined, month: MonthRef): number | undefined {
  const raw = Array.isArray(value) ? value[0] : value
  if (!raw) return undefined

  const week = Number.parseInt(raw, 10)
  return weeksOf(month.month, month.stage).includes(week) ? week : undefined
}

/** Anything but the months after the birth reads as the pregnancy. */
function stageParam(value: string | string[] | undefined): ContentStage {
  const raw = Array.isArray(value) ? value[0] : value
  return raw === "POST_DELIVERY" ? "POST_DELIVERY" : "PREGNANCY"
}

const CATEGORIES: ContentCategory[] = [
  "NUTRITION",
  "EXERCISE",
  "MEDICAL",
  "WELLNESS",
  "BABY_DEVELOPMENT",
  "PRECAUTIONS",
  "GENERAL",
]

function categoryParam(value: string | string[] | undefined): ContentCategory | undefined {
  const raw = Array.isArray(value) ? value[0] : value
  return CATEGORIES.find((category) => category === raw)
}
