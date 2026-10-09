/**
 * Client-side mirror of `PregnancyCalendar` on the API — the month ↔ week
 * mapping guidance is authored in.
 *
 * <p>Staff write material a month at a time, but the feed is keyed by
 * gestational week, because a week is the only figure a mother's dates give
 * precisely. The portal reads by month, so it needs the mapping in front of
 * the request rather than after it: which weeks a month covers decides what is
 * fetched, and which month she is in decides which one opens by default.
 *
 * <p>Months are the obstetric (lunar) months of a 40-week pregnancy: four
 * weeks each, ten of them. Calendar months do not divide 40 weeks evenly, so
 * this is the convention that keeps the two units exactly in step — the same
 * reason the staff console carries its own copy in
 * `pc-ui/lib/pregnancy/pregnancy-calendar.ts`.
 *
 * <p>After the birth there is one more month, counted from the birth on the
 * same four-weeks-to-a-month scale: weeks 1–4 after the birth, and no further,
 * because her portal login ends a month after the due date. Every week is
 * therefore read within a stage — week 3 after the birth is not week 3 of the
 * pregnancy. To the reader the two run on as one line, ten months then the
 * one after the birth, which is what `timelineIndex` measures along.
 */

import type { ContentStage } from "@/interface"
import { strings, type Strings } from "@/lib/strings"

export const MIN_MONTH = 1
export const MAX_MONTH = 10

export const MIN_WEEK = 1
/** Two weeks past the due date, so content still reaches an overdue mother. */
export const MAX_WEEK = 42

/**
 * The first month after the birth, and only that — mirrors
 * `PregnancyCalendar.MAX_POST_DELIVERY_*` on the API.
 */
export const MAX_POST_DELIVERY_MONTH = 1
export const MAX_POST_DELIVERY_WEEK = 4

const WEEKS_PER_MONTH = 4

/** A month of one stage: where a page of the reader points. */
export interface MonthRef {
  stage: ContentStage
  month: number
}

/** Last month of a stage: 10 for a pregnancy, 12 after the birth. */
export function maxMonthOf(stage: ContentStage = "PREGNANCY"): number {
  return stage === "POST_DELIVERY" ? MAX_POST_DELIVERY_MONTH : MAX_MONTH
}

/** First week of a month within its stage: month 1 → week 1, month 5 → week 17. */
export function startWeekOf(month: number, stage: ContentStage = "PREGNANCY"): number {
  return (clampMonth(month, stage) - 1) * WEEKS_PER_MONTH + 1
}

/** Last week of a month within its stage, inclusive: month 1 → week 4, month 10 → week 40. */
export function endWeekOf(month: number, stage: ContentStage = "PREGNANCY"): number {
  return clampMonth(month, stage) * WEEKS_PER_MONTH
}

/**
 * The month a week falls in. Weeks 41 and 42 of a pregnancy have no month of
 * their own, so an overdue mother keeps reading as month 10 rather than
 * falling off the end.
 */
export function monthOf(week: number, stage: ContentStage = "PREGNANCY"): number {
  return clampMonth(Math.ceil(Math.max(week, MIN_WEEK) / WEEKS_PER_MONTH), stage)
}

/**
 * Same thresholds as the API's `gestationalAgeOf` — a mother shown as second
 * trimester must not be reading a month labelled first.
 */
export function trimesterOf(week: number): 1 | 2 | 3 {
  return week < 13 ? 1 : week < 27 ? 2 : 3
}

/**
 * A month held inside its stage, so a hand-edited URL cannot ask for month
 * 40. Anything that is not a number at all reads as the first month rather
 * than poisoning the week arithmetic downstream with `NaN`.
 */
export function clampMonth(month: number, stage: ContentStage = "PREGNANCY"): number {
  if (!Number.isFinite(month)) return MIN_MONTH
  return Math.min(Math.max(Math.trunc(month), MIN_MONTH), maxMonthOf(stage))
}

/**
 * Where a mother is, from her gestational week — the same rule as
 * `PortalContentServiceImpl.positionOf` on the API.
 *
 * <p>There is no delivery date on her record, so the birth is taken to be the
 * due date, and only once she is past week 42: before that she may still be
 * pregnant. After it, week 43 of the pregnancy reads as week 4 after the birth.
 */
export function positionOf(gestationalWeek: number): { stage: ContentStage; week: number } {
  if (gestationalWeek <= MAX_WEEK) {
    return { stage: "PREGNANCY", week: Math.max(gestationalWeek, MIN_WEEK) }
  }
  return {
    stage: "POST_DELIVERY",
    week: Math.min(gestationalWeek - endWeekOf(MAX_MONTH) + 1, MAX_POST_DELIVERY_WEEK),
  }
}

/**
 * A month's place on the one line the reader shows: pregnancy months 1–10,
 * then the month after the birth as 11.
 */
export function timelineIndex({ stage, month }: MonthRef): number {
  return stage === "POST_DELIVERY" ? MAX_MONTH + clampMonth(month, stage) : clampMonth(month)
}

/** The month a step along the line lands on, or null past either end. */
export function stepMonth(from: MonthRef, delta: number): MonthRef | null {
  const index = timelineIndex(from) + delta
  if (index < MIN_MONTH || index > MAX_MONTH + MAX_POST_DELIVERY_MONTH) return null
  return index > MAX_MONTH
    ? { stage: "POST_DELIVERY", month: index - MAX_MONTH }
    : { stage: "PREGNANCY", month: index }
}

/** How many months either side of hers can be opened; everything further is locked. */
export const OPEN_MONTHS_AROUND = 1

/**
 * Whether a month can be read yet: the month she is in, the one before it and
 * the one after it, counted along the whole line — so month 10 of the
 * pregnancy and the first month after the birth are neighbours. Anything
 * further away is locked: shown, but not opened.
 */
export function isMonthOpen(month: MonthRef, thisMonth: MonthRef): boolean {
  return Math.abs(timelineIndex(month) - timelineIndex(thisMonth)) <= OPEN_MONTHS_AROUND
}

/**
 * Every week a month's content can be filed under.
 *
 * <p>Month 10 of a pregnancy carries weeks 41 and 42 as well as its own four:
 * they belong to no month of their own, and a piece written for an overdue
 * mother is filed under the last month there is. Anything published for them
 * would be unreachable if this stopped at week 40. The months after the birth
 * have no such tail.
 */
export function weeksOf(month: number, stage: ContentStage = "PREGNANCY"): number[] {
  const resolved = clampMonth(month, stage)
  const last =
    stage === "PREGNANCY" && resolved === MAX_MONTH ? MAX_WEEK : endWeekOf(resolved, stage)

  const weeks: number[] = []
  for (let week = startWeekOf(resolved, stage); week <= last; week += 1) {
    weeks.push(week)
  }
  return weeks
}

/**
 * e.g. `"weeks 17–20"`, the span a month's material is written for.
 *
 * <p>The numbers are the calendar's; the wording comes from `lib/strings.ts`.
 */
export function weeksLabelOf(
  month: number,
  words: Strings = strings,
  stage: ContentStage = "PREGNANCY"
): string {
  return words.guidance.weeksLabel(startWeekOf(month, stage), endWeekOf(month, stage))
}

/**
 * How a month reads in trimesters, or that it is after the birth.
 *
 * <p>Month 7 is the one that straddles: weeks 25 and 26 are second trimester
 * and 27 and 28 are third, so it is named as both rather than as whichever
 * end happened to be measured.
 */
export function trimesterLabelOf(
  month: number,
  words: Strings = strings,
  stage: ContentStage = "PREGNANCY"
): string {
  const copy = words.guidance
  if (stage === "POST_DELIVERY") return copy.afterBirth

  const first = trimesterOf(startWeekOf(month))
  const last = trimesterOf(endWeekOf(month))

  return first === last ? copy.trimester(first) : copy.trimesterSpan(first, last)
}

/** The months of a stage with their week spans, for the month picker. */
function monthsOfStage(stage: ContentStage) {
  return Array.from({ length: maxMonthOf(stage) }, (_, index) => {
    const month = index + 1

    return {
      stage,
      month,
      startWeek: startWeekOf(month, stage),
      endWeek: endWeekOf(month, stage),
    }
  })
}

/**
 * The ten months with their week spans, for the month picker.
 *
 * <p>Numbers only; the labels are worded by the page that shows them.
 */
export const PREGNANCY_MONTHS = monthsOfStage("PREGNANCY")

/** The one month after the birth, weeks counted from the birth. */
export const POST_DELIVERY_MONTHS = monthsOfStage("POST_DELIVERY")
