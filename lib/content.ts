import {
  ActivityIcon,
  BabyIcon,
  DumbbellIcon,
  InfoIcon,
  SmileIcon,
  StethoscopeIcon,
  TriangleAlertIcon,
  UtensilsIcon,
  type LucideIcon,
} from "lucide-react"

import type { ContentCategory } from "@/interface"

/**
 * How a category looks, in one place.
 *
 * <p>The card, the detail page and the filter chips all draw the same category,
 * and three separate colour choices for "Precautions" would read as three
 * different things. The wording is not here on purpose — that comes from the
 * API as `categoryLabel`, so the portal and the console cannot disagree about
 * what a category is called.
 */
export const CATEGORY_STYLES: Record<
  ContentCategory,
  { icon: LucideIcon; chip: string; tint: string }
> = {
  NUTRITION: {
    icon: UtensilsIcon,
    chip: "bg-stable-soft text-stable",
    tint: "text-stable",
  },
  EXERCISE: {
    icon: DumbbellIcon,
    chip: "bg-info-soft text-info",
    tint: "text-info",
  },
  MEDICAL: {
    icon: StethoscopeIcon,
    chip: "bg-primary/10 text-primary",
    tint: "text-primary",
  },
  WELLNESS: {
    icon: SmileIcon,
    chip: "bg-blush-soft text-blush",
    tint: "text-blush",
  },
  BABY_DEVELOPMENT: {
    icon: BabyIcon,
    chip: "bg-blush-soft text-blush",
    tint: "text-blush",
  },
  // The one category that is a warning, and the only one coloured as one.
  PRECAUTIONS: {
    icon: TriangleAlertIcon,
    chip: "bg-caution-soft text-caution",
    tint: "text-caution",
  },
  GENERAL: {
    icon: InfoIcon,
    chip: "bg-muted text-muted-foreground",
    tint: "text-muted-foreground",
  },
}

/** Falls back to General for a category added to the API but not yet to this map. */
export function categoryStyle(category: ContentCategory) {
  return CATEGORY_STYLES[category] ?? CATEGORY_STYLES.GENERAL
}

/** The icon for a piece that has no category art of its own. */
export const FALLBACK_ICON = ActivityIcon

const TAG = /<[^>]*>/g
const WHITESPACE = /\s+/g

/** The handful of entities a rich-text editor actually emits. */
const ENTITIES: Record<string, string> = {
  "&nbsp;": " ",
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
}

/**
 * A one-line preview of a piece's body.
 *
 * <p>The body is HTML, and a card wants words. Tags are stripped rather than
 * rendered because a card is not the place for headings and lists — and
 * because the result goes into a text node, never back into the DOM as markup,
 * so stripping here is for legibility rather than for safety (the API has
 * already sanitised it).
 */
export function previewOf(html?: string | null, limit = 140): string | null {
  if (!html) return null

  let text = html.replace(TAG, " ")
  for (const [entity, char] of Object.entries(ENTITIES)) {
    text = text.split(entity).join(char)
  }
  text = text.replace(WHITESPACE, " ").trim()

  if (!text) return null
  if (text.length <= limit) return text

  // Cut at a word boundary so the ellipsis does not land mid-word.
  const cut = text.slice(0, limit)
  const lastSpace = cut.lastIndexOf(" ")
  return `${(lastSpace > limit * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`
}
