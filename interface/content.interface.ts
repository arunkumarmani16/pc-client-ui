/** What a piece of guidance is, and how the app renders it. Mirrors `ContentType`. */
export type ContentType = "VIDEO" | "ARTICLE" | "SUGGESTION" | "TIP"

/** Subject a piece belongs to. Mirrors `ContentCategory`. */
export type ContentCategory =
  | "NUTRITION"
  | "EXERCISE"
  | "MEDICAL"
  | "WELLNESS"
  | "BABY_DEVELOPMENT"
  | "PRECAUTIONS"
  | "GENERAL"

/**
 * One clip on a piece of guidance. Mirrors `PortalVideoResponse`.
 *
 * <p>The API has already picked which of a video's several possible routes to
 * use, so exactly one of `playbackUrl` and `embedUrl` is set: the first plays
 * in a `<video>` element, the second only inside the provider's own frame.
 */
export interface ContentVideo {
  videoId: string
  /** The uploader's filename, or the link itself. */
  title?: string | null
  durationSeconds?: number | null
  /** False while the provider is still processing; a player would error on it. */
  ready: boolean
  /**
   * Direct media. Relative (our own streaming route) or absolute (a CDN) —
   * pass it through `mediaUrl` before handing it to a player.
   */
  playbackUrl?: string | null
  hlsUrl?: string | null
  /** Set instead of `playbackUrl` when the video can only be shown in an iframe. */
  embedUrl?: string | null
  posterUrl?: string | null
}

/** What a document turned out to be. Mirrors `DocumentKind`. */
export type DocumentKind = "PDF" | "PRESENTATION" | "IMAGE"

/**
 * One page of a document, as a picture. Mirrors
 * `PortalDocumentResponse.Page`.
 *
 * <p>`widthPx` and `heightPx` are the rendered size, and they travel with the
 * page so the viewer can reserve its exact box before the image arrives.
 * Without them every slide is a zero-height box until it loads, and on a phone
 * that means the page being read jumps out from under the reader.
 */
export interface DocumentPage {
  /** 1-based, as it is shown: "3 of 12". */
  pageNumber: number
  /**
   * Where to fetch it. Relative (our own route) or absolute (a CDN) — pass it
   * through `mediaUrl` before putting it in an `<img>`.
   */
  imageUrl?: string | null
  widthPx?: number | null
  heightPx?: number | null
}

/**
 * A document on a piece of guidance, as the pages it was converted into.
 * Mirrors `PortalDocumentResponse`.
 *
 * <p>There is no file to download and no viewer to install: a PDF or slide
 * deck is rasterised on the server at upload, and what arrives here is a list
 * of pictures. That is the whole reason the feature works on a phone — an
 * image renders inline in the page she is already on, where a `.pptx` is a
 * download that may open in nothing at all.
 */
export interface ContentDocument {
  documentId: string
  /**
   * What the clinic called it — the heading over its pages.
   *
   * <p>Written by staff at upload, so it is a sentence rather than a filename.
   * The kind ("Slides", "Handout") is the fallback where a piece somehow has
   * none.
   */
  title: string
  kind: DocumentKind
  pageCount: number
  pages: DocumentPage[]
}

/** A piece of guidance as a mother reads it. Mirrors `PortalContentResponse`. */
export interface Content {
  contentId: string
  title: string
  contentType: ContentType
  /** "Video", "Article", "Suggestion", "Tip" — worded by the API. */
  typeLabel: string
  category: ContentCategory
  /** "Baby development", "Nutrition", ... — worded by the API. */
  categoryLabel: string

  /** Server-sanitised rich text; the body of the piece. */
  description?: string | null
  /** The one actionable line, when the piece carries one. */
  suggestion?: string | null

  videos: ContentVideo[]
  /** Documents to page through, shown as a slideshow. */
  documents: ContentDocument[]

  pregnancyMonth: number
  startWeek: number
  endWeek: number
  trimester: 1 | 2 | 3
  /** e.g. "Month 5 · weeks 17-20". */
  rangeLabel: string

  /**
   * Which language the piece's own words are actually in ("ta", "en").
   *
   * <p>From the API, which serves a translation only where the clinic has
   * approved one and it still matches the English it was made from. "en" under
   * a Tamil page therefore means "not translated yet" — a steady state, not a
   * failure, since nothing is translated at read time any more.
   */
  language?: string
}

/**
 * One week of guidance plus the week itself. Mirrors `PortalFeedResponse`.
 *
 * <p>`minWeek`/`maxWeek` travel with the feed rather than being hardcoded
 * here: the calendar allows weeks 41 and 42 so an overdue mother is not walked
 * off the end, and a second copy of that rule would drift from it.
 */
export interface Feed {
  week: number
  month: number
  trimester: 1 | 2 | 3
  rangeLabel: string
  /** True when the week being shown is the week she is actually in. */
  currentWeek: boolean
  /** The week she is in, whichever week is being shown. */
  thisWeek: number
  minWeek: number
  maxWeek: number
  items: Content[]
}

/** Filters the feed accepts. */
export interface FeedQuery {
  /** Omit for the week she is in today. */
  week?: number
  type?: ContentType
  category?: ContentCategory
  /**
   * The language to read in, e.g. "ta". A piece with no approved, current
   * translation comes back in English whatever this says, and `language` on
   * each piece reports which it actually was.
   */
  lang?: string
}

/**
 * One month of guidance, as `/guidance` reads it.
 *
 * <p>Not an API mirror: the API's feed is a week (`Feed`), and this is the
 * four of them a month covers, gathered by `getMonthFeed`. The month figures
 * are the client calendar's (`lib/pregnancy.ts`) rather than one week's, so a
 * month reads as its own span — "weeks 17–20" — and not as whichever week
 * happened to be asked for.
 */
export interface MonthFeed {
  month: number
  startWeek: number
  endWeek: number
  /** e.g. "weeks 17–20". */
  weeksLabel: string
  /** e.g. "Second trimester"; both, for the month that straddles two. */
  trimesterLabel: string
  /** True when this is the month the mother is actually in today. */
  currentMonth: boolean
  /** The month she is in, whichever month is being shown. */
  thisMonth: number
  /** The week she is in, for the one line that still speaks in weeks. */
  thisWeek: number
  minMonth: number
  maxMonth: number
  /** First month she can open: the one before hers. Earlier months are locked. */
  firstOpenMonth: number
  /** Last month she can open: the one after hers. Later months are locked. */
  lastOpenMonth: number
  /** Everything published for the month, in the order staff filed it. */
  items: Content[]
}
