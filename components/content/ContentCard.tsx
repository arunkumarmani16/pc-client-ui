import Link from "next/link"
import { CheckIcon, PlayIcon, TriangleAlertIcon } from "lucide-react"

import type { Content } from "@/interface"
import { GUIDANCE_PATH } from "@/lib/auth/cookies"
import { categoryStyle, previewOf } from "@/lib/content"
import { copyFor, type Language } from "@/lib/i18n"
import { formatDuration } from "@/lib/format"
import { cn } from "@/lib/utils"

/**
 * One piece of guidance in the feed.
 *
 * <p>The whole card is the link rather than a "read more" at the bottom of it:
 * on a phone the card is the tap target, and a small link inside a big tile is
 * a smaller target for no reason.
 */
export function ContentCard({
  content,
  language,
}: {
  content: Content
  /**
   * The language the page is being read in. The card's own words follow it;
   * the title, the preview and the category name come from the API already in
   * whichever language it had for this piece.
   */
  language: Language
}) {
  const copy = copyFor(language).content
  const { icon: CategoryIcon, chip } = categoryStyle(content.category)
  const preview = previewOf(content.description)
  const video = content.videos[0]
  const duration = formatDuration(video?.durationSeconds)

  return (
    <Link
      href={`${GUIDANCE_PATH}/${encodeURIComponent(content.contentId)}`}
      className="lift group flex flex-col rounded-xl border bg-card p-4 outline-none focus-visible:ring-3 focus-visible:ring-ring/50 sm:p-5"
    >
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-lg",
            chip
          )}
          aria-hidden
        >
          <CategoryIcon className="size-4.5" />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-xs font-medium text-muted-foreground">
              {content.categoryLabel}
            </span>
            <span className="text-xs text-muted-foreground/60" aria-hidden>
              ·
            </span>
            <span className="text-xs text-muted-foreground">{content.typeLabel}</span>
          </div>

          <h3 className="mt-0.5 font-semibold leading-snug tracking-tight text-foreground group-hover:text-primary">
            {content.title}
          </h3>
        </div>
      </div>

      {preview && (
        <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
          {preview}
        </p>
      )}

      {/*
        A footer of what is inside, so a mother can tell a two-minute clip from
        a list of precautions before she opens it. Rendered only when there is
        something to say, so a plain article has no empty strip under it.
      */}
      {(content.videos.length > 0 ||
        content.dos.length > 0 ||
        content.donts.length > 0) && (
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
          {content.videos.length > 0 && (
            <span className="flex items-center gap-1">
              <PlayIcon className="size-3.5" />
              {content.videos.length === 1
                ? (duration ?? copy.oneVideo)
                : `${content.videos.length} ${copy.videos}`}
            </span>
          )}
          {content.dos.length > 0 && (
            <span className="flex items-center gap-1">
              <CheckIcon className="size-3.5 text-stable" />
              {copy.dos(content.dos.length)}
            </span>
          )}
          {content.donts.length > 0 && (
            <span className="flex items-center gap-1">
              <TriangleAlertIcon className="size-3.5 text-caution" />
              {copy.toAvoid(content.donts.length)}
            </span>
          )}
        </div>
      )}
    </Link>
  )
}
