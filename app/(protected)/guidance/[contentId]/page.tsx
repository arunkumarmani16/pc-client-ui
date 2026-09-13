import Link from "next/link"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { ArrowLeftIcon, LightbulbIcon } from "lucide-react"

import { GuidelineList } from "@/components/content/GuidelineList"
import { VideoPlayer } from "@/components/content/VideoPlayer"
import type { Content } from "@/interface"
import { GUIDANCE_PATH } from "@/lib/auth/cookies"
import { categoryStyle } from "@/lib/content"
import { copyFor, DEFAULT_LANGUAGE, type Language } from "@/lib/i18n"
import { currentLanguage } from "@/lib/language"
import { requireAuthConfig } from "@/lib/auth/session"
import { cn } from "@/lib/utils"
import { ApiError, getContent } from "@/service"

type Params = Promise<{ contentId: string }>

/**
 * One piece of guidance, read end to end.
 *
 * <p>Ordered the way it is used rather than the way it is stored: the video
 * first when there is one, then the explanation, then the single line to act
 * on, then the two lists. A mother who watches the clip and stops has still
 * had the point.
 */
export default async function ContentPage({ params }: { params: Params }) {
  const { contentId } = await params
  const language = await currentLanguage()
  const content = await loadContent(contentId, language)
  const copy = copyFor(language).content
  const { icon: CategoryIcon, chip } = categoryStyle(content.category)

  // The piece came back in a language other than the one she is reading in,
  // which means the clinic has not translated this one yet.
  const untranslated = content.language !== language

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
          <span className="rounded-full border px-2.5 py-1 text-xs text-muted-foreground">
            {content.typeLabel}
          </span>
        </div>

        <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
          {content.title}
        </h1>
        <p className="text-sm text-muted-foreground">{content.rangeLabel}</p>

        {untranslated && (
          // Said here rather than left to be noticed: a page of English in an
          // otherwise Tamil app should explain itself.
          <p
            className="rounded-lg border border-dashed px-3 py-2 text-xs text-muted-foreground"
            lang={content.language}
          >
            {copy.notTranslated}
          </p>
        )}
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
          <aside className="flex gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
            <LightbulbIcon className="mt-0.5 size-4.5 shrink-0 text-primary" />
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-primary">{copy.suggestion}</h2>
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
    const language = await currentLanguage()
    const content = await getContent(contentId, language, await requireAuthConfig())
    return { title: content.title }
  } catch {
    // The page itself reports the failure; a metadata lookup must not be what
    // decides that, so this falls back to a generic title and lets it.
    return { title: copyFor(DEFAULT_LANGUAGE).guidance.title }
  }
}

/**
 * The piece, or a 404 page.
 *
 * <p>A draft answers 404 exactly as a missing id does — the API will not tell
 * a mother that an unpublished piece exists, and neither does this.
 */
async function loadContent(contentId: string, language: Language): Promise<Content> {
  try {
    return await getContent(contentId, language, await requireAuthConfig())
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound()
    }
    throw error
  }
}
