import Link from "next/link"
import { LayersIcon, PlayIcon } from "lucide-react"

import { CategoryArt } from "@/components/content/CategoryArt"
import { LinkPending } from "@/components/global/LinkPending"
import type { Content } from "@/interface"
import { GUIDANCE_PATH } from "@/lib/auth/cookies"
import { categoryStyle, pageCountOf, previewOf, typeStyle } from "@/lib/content"
import { formatDuration } from "@/lib/format"
import type { Strings } from "@/lib/strings"
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
export function ContentCard({
  content,
  copy,
  deckCopy,
}: {
  content: Content
  /** The card's words, in the language the page is read in. */
  copy: Strings["content"]
  /**
   * The slideshow's words, for the page count.
   *
   * <p>Taken from there rather than given a second wording under `content`:
   * the card and the deck itself say the same thing about the same document,
   * and two translations of "12 pages" would eventually disagree.
   */
  deckCopy: Strings["deck"]
}) {
  const { icon: CategoryIcon, chip, tint } = categoryStyle(content.category)
  const { icon: TypeIcon } = typeStyle(content.contentType)
  const preview = previewOf(content.description)
  const video = content.videos[0]
  const duration = formatDuration(video?.durationSeconds)
  // Every page of every document, since the card says "how much to read" and
  // not "how many files" — two handouts of six pages is twelve pages to her.
  const pages = content.documents.reduce((sum, deck) => sum + deck.pageCount, 0)

  return (
    <Link
      href={`${GUIDANCE_PATH}/${encodeURIComponent(content.contentId)}`}
      className="lift group relative flex flex-col overflow-hidden rounded-2xl glass outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      {/* A teal glow around the tapped card while the piece is on its way,
          for when the article's loader has not been prefetched yet. */}
      <LinkPending
        className="inset-0 z-10 rounded-2xl"
        pendingClassName="animate-pulse bg-primary/5 ring-2 ring-primary/50 ring-inset"
      />
      <div className={cn("relative flex h-36 items-center justify-center", chip)}>
        <CategoryArt
          category={content.category}
          className="h-32 w-auto transition-transform duration-300 group-hover:scale-105"
        />

        <span className="absolute top-2.5 left-2.5 flex items-center gap-1.5 rounded-full glass-strong px-2.5 py-1 text-xs font-medium text-foreground">
          <CategoryIcon className={cn("size-4", tint)} aria-hidden />
          {content.categoryLabel}
        </span>

        {/*
          A deck is worth its own sign for the same reason a video is: it is
          something she can take in without reading a paragraph first, and the
          page count is what says whether it is a single handout or a set of
          slides. Placed opposite the video badge so a piece carrying both
          still reads at a glance.
        */}
        {pages > 0 && (
          <span className="absolute bottom-2.5 left-2.5 flex items-center gap-1.5 rounded-full glass-strong px-2.5 py-1 text-xs font-medium text-foreground">
            <LayersIcon className="size-4 text-muted-foreground" aria-hidden />
            {pageCountOf(deckCopy, pages)}
          </span>
        )}

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

      </div>
    </Link>
  )
}
