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
 */

import { strings } from "@/lib/strings"

export const MIN_MONTH = 1
export const MAX_MONTH = 10

export const MIN_WEEK = 1
/** Two weeks past the due date, so content still reaches an overdue mother. */
export const MAX_WEEK = 42

const WEEKS_PER_MONTH = 4

/** First gestational week of a month: month 1 → week 1, month 5 → week 17. */
export function startWeekOf(month: number): number {
  return (clampMonth(month) - 1) * WEEKS_PER_MONTH + 1
}

/** Last gestational week of a month, inclusive: month 1 → week 4, month 10 → week 40. */
export function endWeekOf(month: number): number {
  return clampMonth(month) * WEEKS_PER_MONTH
}

/**
 * The month a gestational week falls in. Weeks 41 and 42 have no month of
 * their own, so an overdue mother keeps reading as month 10 rather than
 * falling off the end.
 */
export function monthOf(week: number): number {
  return clampMonth(Math.ceil(Math.max(week, MIN_WEEK) / WEEKS_PER_MONTH))
}

/**
 * Same thresholds as the API's `gestationalAgeOf` — a mother shown as second
 * trimester must not be reading a month labelled first.
 */
export function trimesterOf(week: number): 1 | 2 | 3 {
  return week < 13 ? 1 : week < 27 ? 2 : 3
}

/**
 * A month held inside the calendar, so a hand-edited URL cannot ask for month
 * 40. Anything that is not a number at all reads as the first month rather
 * than poisoning the week arithmetic downstream with `NaN`.
 */
export function clampMonth(month: number): number {
  if (!Number.isFinite(month)) return MIN_MONTH
  return Math.min(Math.max(Math.trunc(month), MIN_MONTH), MAX_MONTH)
}

/** How many months either side of hers can be opened; everything further is locked. */
export const OPEN_MONTHS_AROUND = 1

/**
 * Whether a month can be read yet: the month she is in, the one before it and
 * the one after it. Anything further away is locked — shown, but not opened.
 */
export function isMonthOpen(month: number, thisMonth: number): boolean {
  return Math.abs(clampMonth(month) - clampMonth(thisMonth)) <= OPEN_MONTHS_AROUND
}

/** The first and last month she can open, held inside the calendar. */
export function openMonthsAround(thisMonth: number): { first: number; last: number } {
  const resolved = clampMonth(thisMonth)
  return {
    first: clampMonth(resolved - OPEN_MONTHS_AROUND),
    last: clampMonth(resolved + OPEN_MONTHS_AROUND),
  }
}

/**
 * Every gestational week a month's content can be filed under.
 *
 * <p>Month 10 carries weeks 41 and 42 as well as its own four: they belong to
 * no month of their own, and a piece written for an overdue mother is filed
 * under the last month there is. Anything published for them would be
 * unreachable if this stopped at week 40.
 */
export function weeksOf(month: number): number[] {
  const resolved = clampMonth(month)
  const last = resolved === MAX_MONTH ? MAX_WEEK : endWeekOf(resolved)

  const weeks: number[] = []
  for (let week = startWeekOf(resolved); week <= last; week += 1) {
    weeks.push(week)
  }
  return weeks
}

/**
 * e.g. `"weeks 17–20"`, the span a month's material is written for.
 *
 * <p>The numbers are the calendar's; the wording comes from `lib/strings.ts`.
 */
export function weeksLabelOf(month: number): string {
  return strings.guidance.weeksLabel(startWeekOf(month), endWeekOf(month))
}

/**
 * How a month reads in trimesters.
 *
 * <p>Month 7 is the one that straddles: weeks 25 and 26 are second trimester
 * and 27 and 28 are third, so it is named as both rather than as whichever
 * end happened to be measured.
 */
export function trimesterLabelOf(month: number): string {
  const first = trimesterOf(startWeekOf(month))
  const last = trimesterOf(endWeekOf(month))
  const copy = strings.guidance

  return first === last ? copy.trimester(first) : copy.trimesterSpan(first, last)
}

/**
 * The ten months with their week spans, for the month picker.
 *
 * <p>Numbers only; the labels are worded by the page that shows them.
 */
export const PREGNANCY_MONTHS = Array.from({ length: MAX_MONTH }, (_, index) => {
  const month = index + 1

  return {
    month,
    startWeek: startWeekOf(month),
    endWeek: endWeekOf(month),
  }
})
