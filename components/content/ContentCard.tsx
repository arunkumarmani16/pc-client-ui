import Link from "next/link"
import { BanIcon, PlayIcon, ThumbsUpIcon } from "lucide-react"

import { CategoryArt } from "@/components/content/CategoryArt"
import type { Content } from "@/interface"
import { GUIDANCE_PATH } from "@/lib/auth/cookies"
import { categoryStyle, previewOf, typeStyle } from "@/lib/content"
import { formatDuration } from "@/lib/format"
import { strings } from "@/lib/strings"
import { cn } from "@/lib/utils"

/**
 * One piece of guidance in the feed.
 *
 * <p>The whole card is the link rather than a "read more" at the bottom of it:
 * on a phone the card is the tap target, and a small link inside a big tile is
 * a smaller target for no reason.
 *
 * <p>Led by a picture rather than by its title. A mother who cannot read well
 * should still be able to pick out the one about food, the one about the baby,
 * and the one that is a video, so the topic is a cartoon, a video has a large
 * play button, and every count at the bottom carries a sign as well as a word.
 */
export function ContentCard({ content }: { content: Content }) {
  const copy = strings.content
  const { icon: CategoryIcon, chip, tint } = categoryStyle(content.category)
  const { icon: TypeIcon } = typeStyle(content.contentType)
  const preview = previewOf(content.description)
  const video = content.videos[0]
  const duration = formatDuration(video?.durationSeconds)

  return (
    <Link
      href={`${GUIDANCE_PATH}/${encodeURIComponent(content.contentId)}`}
      className="lift group flex flex-col overflow-hidden rounded-xl border bg-card outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <div className={cn("relative flex h-36 items-center justify-center", chip)}>
        <CategoryArt
          category={content.category}
          className="h-32 w-auto transition-transform duration-300 group-hover:scale-105"
        />

        <span className="absolute top-2.5 left-2.5 flex items-center gap-1.5 rounded-full bg-card/90 px-2.5 py-1 text-xs font-medium text-foreground shadow-sm">
          <CategoryIcon className={cn("size-4", tint)} aria-hidden />
          {content.categoryLabel}
        </span>

        {video && (
          // Big enough to be the thing she notices first: a video is the one
          // piece she can take in without reading at all.
          <span
            className="absolute right-2.5 bottom-2.5 flex items-center gap-1.5 rounded-full bg-primary py-1.5 pr-3 pl-2 text-xs font-semibold text-primary-foreground shadow-md"
            aria-hidden
          >
            <span className="flex size-7 items-center justify-center rounded-full bg-primary-foreground/20">
              <PlayIcon className="size-4 fill-current" />
            </span>
            {content.videos.length === 1
              ? (duration ?? copy.oneVideo)
              : `${content.videos.length} ${copy.videos}`}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <TypeIcon className="size-4" aria-hidden />
          {content.typeLabel}
        </span>

        <h3 className="mt-1 font-semibold leading-snug tracking-tight text-foreground group-hover:text-primary">
          {content.title}
        </h3>

        {preview && (
          <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
            {preview}
          </p>
        )}

        {/*
          What is inside, as signs first and counts second: a thumbs-up for
          things to do and a no-entry sign for things to avoid read the same in
          any language. Rendered only when there is something to say.
        */}
        {(content.dos.length > 0 || content.donts.length > 0) && (
          <div className="mt-auto flex flex-wrap items-center gap-2 pt-3 text-xs font-medium">
            {content.dos.length > 0 && (
              <span className="flex items-center gap-1.5 rounded-full bg-stable-soft py-1 pr-2.5 pl-1 text-stable">
                <span className="flex size-6 items-center justify-center rounded-full bg-stable/15">
                  <ThumbsUpIcon className="size-3.5" aria-hidden />
                </span>
                {copy.dos(content.dos.length)}
              </span>
            )}
            {content.donts.length > 0 && (
              <span className="flex items-center gap-1.5 rounded-full bg-caution-soft py-1 pr-2.5 pl-1 text-caution">
                <span className="flex size-6 items-center justify-center rounded-full bg-caution/15">
                  <BanIcon className="size-3.5" aria-hidden />
                </span>
                {copy.toAvoid(content.donts.length)}
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  )
}
