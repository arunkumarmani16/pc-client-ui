import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import type { Metadata } from "next"
import { ArrowLeftIcon, LightbulbIcon } from "lucide-react"

import { CategoryArt } from "@/components/content/CategoryArt"
import { SlideDeck } from "@/components/content/SlideDeck"
import { VideoPlayer } from "@/components/content/VideoPlayer"
import type { Content, DocumentKind } from "@/interface"
import { GUIDANCE_PATH } from "@/lib/auth/cookies"
import { categoryStyle, typeStyle } from "@/lib/content"
import { requireAuthConfig, requireSession } from "@/lib/auth/session"
import { isMonthOpen, monthOf } from "@/lib/pregnancy"
import { type Strings, stringsFor } from "@/lib/strings"
import { currentLanguage } from "@/lib/translation/current"
import { DEFAULT_LANGUAGE, type Language } from "@/lib/translation/languages"
import { localizeContent } from "@/lib/translation/localize"
import { cn } from "@/lib/utils"
import { ApiError, getContent } from "@/service"

type Params = Promise<{ contentId: string }>

/**
 * One piece of guidance, read end to end.
 *
 * <p>Ordered the way it is used rather than the way it is stored: the picture
 * of what it is about, then the video when there is one, then the explanation,
 * then the single line to act on. A mother who watches the clip and stops has
 * still had the point.
 */
export default async function ContentPage({ params }: { params: Params }) {
  const { contentId } = await params
  const language = await currentLanguage()
  const content = await loadContent(contentId, language)

  // A piece from a locked month is not opened by its link either: the month
  // strip hides it, and a shared or bookmarked URL must not be the way round.
  // `requireSession` is cached, so the layout has already paid for this lookup.
  const { patient } = await requireSession()
  if (!isMonthOpen(content.pregnancyMonth, monthOf(patient.pregnancy.currentWeek))) {
    redirect(GUIDANCE_PATH)
  }

  const words = stringsFor(language)
  const copy = words.content
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

        {/*
          Health advice she may act on, so a machine translation says it is
          one. A failed translation says nothing: the page is simply in
          English, and the notice only added noise.
        */}
        {language !== DEFAULT_LANGUAGE && content.language !== language && (
          <p className="text-xs text-muted-foreground">{copy.notTranslated}</p>
        )}
      </header>

      <div className="mt-6 space-y-6">
        {/*
          Headed, where a lone video would not need to be. A clip and a deck
          are both a bordered black-ish box on a phone, stacked with the same
          gap between them as everything else — so without a word above each,
          a deck under a video reads as part of the video rather than as the
          other thing she can do here.
        */}
        {content.videos.length > 0 && (
          <section className="space-y-3">
            <SectionHeading>{copy.watch}</SectionHeading>
            <div className="space-y-4">
              {content.videos.map((video) => (
                <VideoPlayer key={video.videoId} video={video} copy={words.video} />
              ))}
            </div>
          </section>
        )}

        {/*
          Above the written body, with the video. A deck or a handout is the
          material itself — the clinic's own slides — where the description
          below is the note around it, so a mother who reads the pages and
          stops has had the substance.

          One section per document rather than one for all of them: each
          carries its own heading, because a piece holding a slide deck and a
          handout is holding two different things and a single heading over
          both would name only one.
        */}
        {content.documents.map((deck) => (
          <section key={deck.documentId} className="space-y-3">
            {/*
              The clinic's own name for it, falling back to what kind of thing
              it is. A piece carrying two documents used to head both "Slides".
            */}
            <SectionHeading>{deck.title || deckLabel(deck.kind, words.deck)}</SectionHeading>
            <SlideDeck
              document={deck}
              copy={words.deck}
              label={deckLabel(deck.kind, words.deck)}
            />
          </section>
        ))}

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
      </div>
    </article>
  )
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { contentId } = await params
  const language = await currentLanguage()

  try {
    // Shares the page's translation: sentences already on their way are
    // awaited rather than asked for twice.
    const content = await getContent(contentId, language, await requireAuthConfig())
    return { title: content.title }
  } catch {
    // The page itself reports the failure; a metadata lookup must not be what
    // decides that, so this falls back to a generic title and lets it.
    return { title: stringsFor(language).guidance.title }
  }
}

/**
 * The word over a block of material — "Watch", "Handout", "Slides".
 *
 * <p>Deliberately quiet: small, uppercased and muted rather than a second
 * heading competing with the piece's own title. Its job is to divide, not to
 * be read.
 */
function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
      {children}
    </h2>
  )
}

/**
 * What to call a document above its pages.
 *
 * <p>Worded here rather than sent by the API, unlike `typeLabel` and
 * `categoryLabel`: those two name the clinic's own vocabulary and must read
 * the same in both apps, while this only says what a reader is looking at, and
 * is one of the app's own words — so it belongs in `lib/strings.ts` with the
 * rest of them and gets a real translation rather than a machine one.
 */
function deckLabel(kind: DocumentKind, copy: Strings["deck"]): string {
  if (kind === "PRESENTATION") return copy.presentation
  return kind === "IMAGE" ? copy.image : copy.pdf
}

/**
 * The piece, or a 404 page.
 *
 * <p>A draft answers 404 exactly as a missing id does — the API will not tell
 * a mother that an unpublished piece exists, and neither does this.
 */
async function loadContent(contentId: string, language: Language): Promise<Content> {
  let content: Content
  try {
    content = await getContent(contentId, language, await requireAuthConfig())
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound()
    }
    throw error
  }
  // The piece arrives in whichever language the clinic has approved; only the
  // app's own labels are swapped here.
  return localizeContent(content, language)
}
