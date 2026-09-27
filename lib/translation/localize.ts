import type { Content, MonthFeed } from "@/interface"
import { trimesterLabelOf, weeksLabelOf } from "@/lib/pregnancy"
import { stringsFor } from "@/lib/strings"
import { DEFAULT_LANGUAGE, type Language } from "@/lib/translation/languages"

/**
 * The app's own words, in the language a page is read in.
 *
 * <p>This used to be half of a module that also translated guidance, by
 * calling a hosted model from the server on every render. That half is gone:
 * the clinic's words are now translated once, when staff save a piece, and are
 * read by a clinician before a mother sees them — see the API's
 * {@code ContentTranslationService}. A piece therefore arrives already in the
 * right language, and `content.language` says which language that turned out
 * to be.
 *
 * <p>What is left here is the part that was never a translation problem: a
 * topic chip saying "Nutrition", a range reading "Month 5 · weeks 17-20". Those
 * are the app's furniture rather than the clinic's material, they are written
 * by hand in `lib/strings.ts`, and swapping them is a lookup with no network
 * and nothing to review.
 *
 * <p>Which is why they are applied to every piece on a page while the piece's
 * own words may still be English: a mother who has chosen Tamil gets a Tamil
 * app immediately, and each piece follows as the clinic approves it.
 */

/** Topic, kind and week range in the reader's language. No network involved. */
export function localizeContent(content: Content, language: Language): Content {
  if (language === DEFAULT_LANGUAGE) return content

  const copy = stringsFor(language).content
  return {
    ...content,
    typeLabel: copy.types[content.contentType] ?? content.typeLabel,
    categoryLabel: copy.categories[content.category] ?? content.categoryLabel,
    rangeLabel: copy.rangeLabel(content.pregnancyMonth, content.startWeek, content.endWeek),
  }
}

export function localizeContents(items: Content[], language: Language): Content[] {
  if (language === DEFAULT_LANGUAGE) return items
  return items.map((item) => localizeContent(item, language))
}

/** A month's own labels, plus its pieces' labels. */
export function localizeMonthFeed(feed: MonthFeed, language: Language): MonthFeed {
  if (language === DEFAULT_LANGUAGE) return feed

  const copy = stringsFor(language)
  return {
    ...feed,
    items: localizeContents(feed.items, language),
    weeksLabel: weeksLabelOf(feed.month, copy),
    trimesterLabel: trimesterLabelOf(feed.month, copy),
  }
}

/**
 * True when she chose a language and some of what is on screen is still
 * English.
 *
 * <p>The meaning of this has changed with the rest of the module, and it is
 * worth being precise about: it used to mean "a translation call failed", a
 * transient fault that a reload might fix. It now means "the clinic has not
 * approved a translation of this piece yet", which is a steady state and not a
 * fault at all. The UI should word it as waiting, not as broken.
 */
export function hasUntranslated(items: Content[], language: Language): boolean {
  return language !== DEFAULT_LANGUAGE && items.some((item) => item.language !== language)
}

