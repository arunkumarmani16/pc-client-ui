import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import type { Metadata } from "next"
import { ArrowLeftIcon, LightbulbIcon } from "lucide-react"

import { CategoryArt } from "@/components/content/CategoryArt"
import { GuidelineList } from "@/components/content/GuidelineList"
import { VideoPlayer } from "@/components/content/VideoPlayer"
import type { Content } from "@/interface"
import { GUIDANCE_PATH } from "@/lib/auth/cookies"
import { categoryStyle, typeStyle } from "@/lib/content"
import { requireAuthConfig, requireSession } from "@/lib/auth/session"
import { isMonthOpen, monthOf } from "@/lib/pregnancy"
import { strings } from "@/lib/strings"
import { cn } from "@/lib/utils"
import { ApiError, getContent } from "@/service"

type Params = Promise<{ contentId: string }>

/**
 * One piece of guidance, read end to end.
 *
 * <p>Ordered the way it is used rather than the way it is stored: the picture
 * of what it is about, then the video when there is one, then the explanation,
 * then the single line to act on, then the two lists. A mother who watches the
 * clip and stops has still had the point.
 */
export default async function ContentPage({ params }: { params: Params }) {
  const { contentId } = await params
  const content = await loadContent(contentId)

  // A piece from a locked month is not opened by its link either: the month
  // strip hides it, and a shared or bookmarked URL must not be the way round.
  // `requireSession` is cached, so the layout has already paid for this lookup.
  const { patient } = await requireSession()
  if (!isMonthOpen(content.pregnancyMonth, monthOf(patient.pregnancy.currentWeek))) {
    redirect(GUIDANCE_PATH)
  }

  const copy = strings.content
  const { icon: CategoryIcon, chip } = categoryStyle(content.category)
  const { icon: TypeIcon } = typeStyle(content.contentType)

  return (
    <article className="mx-auto max-w-3xl px-4 py-4 sm:px-6 sm:py-6">
      <Link
        href={GUIDANCE_PATH}
        className="inline-flex items-center gap-1.5 rounded-md text-sm text-muted-foreground underline-offset-4 outline-none hover:text-foreground hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <ArrowLeftIcon className="size-4" />
        {copy.allGuidance}
      </Link>

      <header className="animate-rise mt-4 space-y-3">
        {/*
          The topic as a picture, before any of it has to be read. Kept shorter
          when there is a video, so the clip is still near the top of a phone.
        */}
        <div
          className={cn(
            "flex items-center justify-center rounded-2xl",
            content.videos.length > 0 ? "h-32 sm:h-40" : "h-44 sm:h-52",
            chip
          )}
        >
          <CategoryArt
            category={content.category}
            className={cn("w-auto", content.videos.length > 0 ? "h-28 sm:h-36" : "h-40 sm:h-48")}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
              chip
            )}
          >
            <CategoryIcon className="size-3.5" />
            {content.categoryLabel}
          </span>
          <span className="flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs text-muted-foreground">
            <TypeIcon className="size-3.5" aria-hidden />
            {content.typeLabel}
          </span>
        </div>

        <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
          {content.title}
        </h1>
        <p className="text-sm text-muted-foreground">{content.rangeLabel}</p>
      </header>

      <div className="mt-6 space-y-6">
        {content.videos.length > 0 && (
          <section className="space-y-4">
            {content.videos.map((video) => (
              <VideoPlayer key={video.videoId} video={video} />
            ))}
          </section>
        )}

        {content.description && (
          /*
            Server-sanitised HTML: RichTextSanitizer runs an allowlist pass on
            the way in, which is what makes rendering it here safe. `rich-text`
            gives the tags inside it their spacing — see app/globals.css.
          */
          <section
            className="rich-text text-foreground"
            dangerouslySetInnerHTML={{ __html: content.description }}
          />
        )}

        {content.suggestion && (
          // The one actionable line, given the weight it carries: a mother acts
          // on this, so it must not read as another paragraph of the body.
          <aside className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
            <span
              className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary"
              aria-hidden
            >
              <LightbulbIcon className="size-6" />
            </span>
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-primary">{copy.suggestion}</h2>
              <p className="mt-1 text-sm leading-relaxed text-foreground">
                {content.suggestion}
              </p>
            </div>
          </aside>
        )}

        {(content.dos.length > 0 || content.donts.length > 0) && (
          <div className="grid gap-3 sm:grid-cols-2">
            <GuidelineList kind="do" items={content.dos} heading={copy.doThis} />
            <GuidelineList kind="dont" items={content.donts} heading={copy.avoidThis} />
          </div>
        )}
      </div>
    </article>
  )
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { contentId } = await params

  try {
    const content = await getContent(contentId, await requireAuthConfig())
    return { title: content.title }
  } catch {
    // The page itself reports the failure; a metadata lookup must not be what
    // decides that, so this falls back to a generic title and lets it.
    return { title: strings.guidance.title }
  }
}

/**
 * The piece, or a 404 page.
 *
 * <p>A draft answers 404 exactly as a missing id does — the API will not tell
 * a mother that an unpublished piece exists, and neither does this.
 */
async function loadContent(contentId: string): Promise<Content> {
  try {
    return await getContent(contentId, await requireAuthConfig())
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound()
    }
    throw error
  }
}
