import type { AxiosRequestConfig } from "axios"

import { httpClient } from "./http-client"

import type { Content, Feed, FeedQuery, MonthFeed, Patient } from "@/interface"
import {
  MAX_MONTH,
  MIN_MONTH,
  clampMonth,
  endWeekOf,
  isMonthOpen,
  monthOf,
  openMonthsAround,
  startWeekOf,
  trimesterLabelOf,
  weeksLabelOf,
  weeksOf,
} from "@/lib/pregnancy"

const RESOURCE = "/portal"

/**
 * The signed-in mother's own record.
 *
 * <p>No id is passed: the API takes the caller from the verified token. This
 * is what lets the portal stay out of the console's `/patients/**`, which is
 * staff-only — a patient token calling it now gets a 403.
 */
export async function getMe(config?: AxiosRequestConfig): Promise<Patient> {
  const { data } = await httpClient.get<Patient>(`${RESOURCE}/me`, config)
  return data
}

/**
 * A week of guidance. Defaults to the week she is in today; pass `week` to
 * read another one.
 *
 * <p>Undefined filters are dropped rather than sent empty, so the request URL
 * carries only what was actually asked for.
 */
export async function getFeed(
  query: FeedQuery = {},
  config?: AxiosRequestConfig
): Promise<Feed> {
  const { data } = await httpClient.get<Feed>(`${RESOURCE}/content`, {
    ...config,
    params: {
      ...(query.week !== undefined ? { week: query.week } : {}),
      ...(query.type ? { type: query.type } : {}),
      ...(query.category ? { category: query.category } : {}),
    },
  })
  return data
}

/**
 * A month of guidance. Defaults to the month she is in today; pass `month` to
 * read another one.
 *
 * <p>The API serves a week at a time, so a month is the weeks it covers read
 * together. Fetching only one of them would not do: a piece is filed under a
 * month but may be narrowed to part of it (`startWeek`/`endWeek`), so a
 * single week returns whatever spans that week and silently omits the rest of
 * the month. The weeks are requested in parallel and merged, since they are
 * independent of each other and a month is four of them (six for month 10,
 * which carries weeks 41 and 42 for an overdue mother).
 *
 * <p>Keyed by `contentId` on the way in: a piece written for the whole month
 * comes back in all four weeks, and a month that listed it four times would
 * read as four different pieces.
 */
export async function getMonthFeed(
  month?: number,
  config?: AxiosRequestConfig
): Promise<MonthFeed> {
  // The first request doubles as the lookup for which month she is in: asked
  // without a week it answers for today, and its `thisWeek` decides the month
  // the remaining weeks are read from. Resolving the month any other way would
  // cost a round trip that this one already pays for.
  const opening = await getFeed(
    month === undefined ? {} : { week: startWeekOf(month) },
    config
  )

  const thisMonth = monthOf(opening.thisWeek)
  const requested = month === undefined ? thisMonth : clampMonth(month)
  // Only her own month and the one either side of it can be read. A locked
  // month asked for by URL lands on her own month instead of being served.
  const resolved = isMonthOpen(requested, thisMonth) ? requested : thisMonth

  // The opening week is only reused when it belongs to the month being served:
  // after a locked month is turned away it holds that month's pieces, not these.
  const weeks = weeksOf(resolved)
  const reuseOpening = weeks.includes(opening.week)
  const rest = await Promise.all(
    weeks
      .filter((week) => !reuseOpening || week !== opening.week)
      .map((week) => getFeed({ week }, config))
  )

  const itemsById = new Map<string, Content>()
  for (const feed of reuseOpening ? [opening, ...rest] : rest) {
    for (const item of feed.items) {
      if (!itemsById.has(item.contentId)) itemsById.set(item.contentId, item)
    }
  }

  const { first: firstOpenMonth, last: lastOpenMonth } = openMonthsAround(thisMonth)
  const items = [...itemsById.values()].sort((left, right) => left.startWeek - right.startWeek)

  return {
    month: resolved,
    startWeek: startWeekOf(resolved),
    endWeek: endWeekOf(resolved),
    weeksLabel: weeksLabelOf(resolved),
    trimesterLabel: trimesterLabelOf(resolved),
    currentMonth: resolved === thisMonth,
    thisMonth,
    thisWeek: opening.thisWeek,
    minMonth: MIN_MONTH,
    maxMonth: MAX_MONTH,
    firstOpenMonth,
    lastOpenMonth,
    // Earliest week first, so a month that mixes whole-month material with a
    // piece written for its last fortnight still reads in order. The sort is
    // stable, so the API's own ordering within a week survives it.
    items,
  }
}

/** One piece of guidance. A draft answers 404, the same as a missing one. */
export async function getContent(
  contentId: string,
  config?: AxiosRequestConfig
): Promise<Content> {
  const { data } = await httpClient.get<Content>(
    `${RESOURCE}/content/${encodeURIComponent(contentId)}`,
    config
  )
  return data
}
