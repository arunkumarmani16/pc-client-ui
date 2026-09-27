"use client"

import * as React from "react"
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ExpandIcon,
  ImageOffIcon,
  XIcon,
  ZoomInIcon,
  ZoomOutIcon,
} from "lucide-react"

import type { ContentDocument, DocumentPage } from "@/interface"
import { mediaUrl } from "@/lib/api/config"
import type { Strings } from "@/lib/strings"
import { pageCountOf } from "@/lib/content"
import { cn, fill } from "@/lib/utils"

/**
 * A handout or slide deck, read a page at a time.
 *
 * <p>What arrives from the API is already pictures — a PDF or {@code .pptx} is
 * rasterised on the server at upload — so there is nothing to download and no
 * viewer to install. This is what makes the feature work on a phone at all.
 *
 * <p>The paging is the browser's own. A horizontal scroll container with
 * {@code scroll-snap} gives a swipe that follows the finger, keeps its
 * momentum, snaps to a page and works with a trackpad, a mouse wheel and a
 * keyboard — all without a carousel library, a drag handler or a single
 * touch event of ours. The buttons and dots below it do nothing but scroll the
 * same container, so there is one notion of "which page" and it is the one the
 * browser already has.
 *
 * <p>A phone is the case it is designed around: full-bleed pages, one on
 * screen at a time, a counter under them, and a tap to go full screen where a
 * slide's small print becomes legible. The controls are placed and sized for a
 * thumb; the arrows exist for the desktop reading of the same page and are
 * kept out of the way on a narrow screen, where swiping is the natural thing
 * and an arrow over the picture would cover it.
 */
export function SlideDeck({
  document: deck,
  copy,
  label,
}: {
  document: ContentDocument
  copy: Strings["deck"]
  /** What this document is, in the reader's language — "Handout", "Slides". */
  label: string
}) {
  const [page, setPage] = React.useState(1)
  const [fullScreen, setFullScreen] = React.useState(false)

  // Nothing to page through. A document is only ever attached with pages, so
  // this is a defensive case rather than an expected one — but an empty rail
  // renders as a stray bordered box, which is worse than nothing.
  if (deck.pages.length === 0) return null

  const total = deck.pages.length

  return (
    <figure className="space-y-2">
      <div className="overflow-hidden rounded-xl border bg-muted">
        <PageRail
          pages={deck.pages}
          page={page}
          onPageChange={setPage}
          copy={copy}
          onOpen={() => setFullScreen(true)}
        />

        <DeckControls
          page={page}
          total={total}
          copy={copy}
          onGoTo={setPage}
          onOpen={() => setFullScreen(true)}
        />
      </div>

      {/*
        The length only. What the document is — "Handout", "Slides" — is the
        heading the page puts above this, and saying it again underneath would
        label the same box twice.
      */}
      <figcaption className="text-right text-xs tabular-nums text-muted-foreground">
        {pageCountOf(copy, total)}
      </figcaption>

      {fullScreen && (
        <FullScreenDeck
          pages={deck.pages}
          page={page}
          onPageChange={setPage}
          copy={copy}
          label={label}
          onClose={() => setFullScreen(false)}
        />
      )}
    </figure>
  )
}

/**
 * The scrolling rail of pages, shared by the inline deck and the full-screen
 * one.
 *
 * <p>`snap-mandatory` with each page at the container's own width is the whole
 * mechanism: a swipe cannot come to rest between two pages, so there is no
 * "half a slide" state to correct for. `overscroll-x-contain` stops a swipe
 * past the last page turning into the browser's back gesture, which on
 * Android is otherwise the reward for reaching the end of a deck.
 *
 * <p>The scrollbar is hidden rather than styled. On a phone there is none to
 * begin with, and on a desktop a bar under the pages reads as a second control
 * competing with the dots for the same job.
 */
function PageRail({
  pages,
  page,
  onPageChange,
  copy,
  onOpen,
  full = false,
}: {
  pages: DocumentPage[]
  /** 1-based. */
  page: number
  onPageChange: (page: number) => void
  copy: Strings["deck"]
  /** Tapping a page opens the larger view. Absent in that larger view itself. */
  onOpen?: () => void
  full?: boolean
}) {
  const railRef = React.useRef<HTMLDivElement>(null)
  // Where the rail itself actually is. Without it the effect below would
  // scroll the rail back to wherever React thinks the page is, every time a
  // swipe told React the page had changed — a swipe that fights itself.
  //
  // Starts at 0, which is no page: the first pass must always position the
  // rail, because a full-screen view opened on page 5 mounts with `page`
  // already at 5 and would otherwise sit on page 1 believing it was right.
  const scrolledTo = React.useRef(0)
  /** False until the rail has been positioned once. See the effect below. */
  const positioned = React.useRef(false)

  /**
   * Follows the rail: whichever page is nearest the middle is the page.
   *
   * <p>Rounded off the scroll position rather than watched with an
   * `IntersectionObserver`, because a snapping rail always comes to rest on an
   * exact multiple of its own width — the position *is* the index, and
   * anything more elaborate would be a second, slower way to learn the same
   * number.
   */
  function handleScroll() {
    const rail = railRef.current
    if (!rail || rail.clientWidth === 0) return

    const index = Math.round(rail.scrollLeft / rail.clientWidth) + 1
    const clamped = Math.min(Math.max(index, 1), pages.length)
    if (clamped !== scrolledTo.current) {
      scrolledTo.current = clamped
      onPageChange(clamped)
    }
  }

  // Moves the rail when something else changed the page — a button, a dot, an
  // arrow key, or the full-screen view opening on the page already being read.
  React.useEffect(() => {
    const rail = railRef.current
    if (!rail) return

    if (page === scrolledTo.current) {
      positioned.current = true
      return
    }

    // Instant on the first pass, so opening full screen lands on the page she
    // was reading instead of animating across the deck to reach it. Every pass
    // after that is a move she asked for, and should be seen to happen.
    const instant = !positioned.current
    positioned.current = true
    scrolledTo.current = page

    rail.scrollTo({
      left: (page - 1) * rail.clientWidth,
      behavior: instant ? "auto" : "smooth",
    })
  }, [page])

  return (
    <div
      ref={railRef}
      onScroll={handleScroll}
      role="group"
      aria-roledescription="carousel"
      aria-label={copy.slideshow}
      className={cn(
        "flex w-full snap-x snap-mandatory overflow-x-auto overscroll-x-contain",
        // No visible scrollbar: a phone has none anyway, and on a desktop it
        // duplicates the dots.
        "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        full && "h-full items-center"
      )}
    >
      {pages.map((item, index) => (
        <Page
          key={item.pageNumber}
          page={item}
          total={pages.length}
          copy={copy}
          onOpen={onOpen}
          full={full}
          // The first two eagerly, the rest as they are reached. A deck is a
          // dozen pictures and a mother is usually on mobile data, so pulling
          // all of them down for a document she may not open is the one thing
          // worth avoiding here. Two rather than one so the first swipe does
          // not land on an empty box.
          eager={index < 2}
        />
      ))}
    </div>
  )
}

/**
 * One page.
 *
 * <p>The box is sized from the page's own dimensions before the image arrives,
 * which is the point of the API sending them: without it the rail is a
 * zero-height strip that grows as each picture loads, and the page being read
 * jumps out from under the reader. A4 is the fallback, since a document whose
 * size went unrecorded is far more likely to be a handout than a slide.
 */
function Page({
  page,
  total,
  copy,
  onOpen,
  full,
  eager,
}: {
  page: DocumentPage
  total: number
  copy: Strings["deck"]
  onOpen?: () => void
  full?: boolean
  eager: boolean
}) {
  const source = mediaUrl(page.imageUrl)
  const ratio =
    page.widthPx && page.heightPx ? `${page.widthPx} / ${page.heightPx}` : "210 / 297"

  const image = source ? (
    /*
      A plain <img> rather than next/image: these come from the API proxy or a
      CDN, neither of which is in next.config's image domains, and the pages
      are already rendered at the width they are shown at — the optimiser would
      add a round trip to re-do work the server has done.
    */
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={source}
      alt={fill(copy.pageOf, { page: page.pageNumber, total })}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      className={cn("size-full object-contain", full ? "bg-black" : "bg-white")}
    />
  ) : (
    <span className="flex flex-col items-center gap-2 text-center text-xs text-muted-foreground">
      <ImageOffIcon className="size-5" aria-hidden />
      {copy.unavailable}
    </span>
  )

  return (
    <div
      className={cn(
        "flex w-full shrink-0 snap-center snap-always items-center justify-center",
        full && "h-full"
      )}
      // A slide is one item of a set, and a screen reader should say so rather
      // than reading twelve unlabelled pictures in a row.
      role="group"
      aria-roledescription="slide"
      aria-label={fill(copy.pageOf, { page: page.pageNumber, total })}
      style={full ? undefined : { aspectRatio: ratio }}
    >
      {onOpen && source ? (
        // The whole page is the tap target. On a phone the picture is what a
        // thumb lands on, and a small "enlarge" link in a corner of it would be
        // a smaller target for no reason — the button in the bar below is for
        // anyone who does not think to tap the picture.
        <button
          type="button"
          onClick={onOpen}
          aria-label={copy.openFullScreen}
          className="size-full cursor-zoom-in outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset"
        >
          {image}
        </button>
      ) : (
        image
      )}
    </div>
  )
}

/**
 * The bar under the inline deck: where you are, and every way to move.
 *
 * <p>Three controls for one job, on purpose, because they are not for the same
 * reader. The dots are a phone's — they say how long the deck is at a glance
 * and are close enough to the thumb to jump with. The arrows are a desktop's,
 * where there is nothing to swipe. The counter is for everyone and is the only
 * one that survives a deck too long to draw dots for.
 */
function DeckControls({
  page,
  total,
  copy,
  onGoTo,
  onOpen,
}: {
  page: number
  total: number
  copy: Strings["deck"]
  onGoTo: (page: number) => void
  onOpen: () => void
}) {
  return (
    <div className="flex items-center gap-2 border-t bg-card px-2 py-2">
      <RailButton
        label={copy.previousPage}
        disabled={page <= 1}
        onClick={() => onGoTo(page - 1)}
      >
        <ChevronLeftIcon className="size-4" />
      </RailButton>

      <div className="flex min-w-0 flex-1 items-center justify-center gap-2">
        {/*
          Dots only while they still mean something. Past a dozen they are a
          row of specks too small to aim at and too many to count, so a long
          deck gets a progress bar instead — which says the same thing
          (how far through) without pretending each page is reachable in one
          tap.
        */}
        {total <= 12 ? (
          <div className="flex items-center gap-1.5">
            {Array.from({ length: total }, (_, index) => index + 1).map((number) => (
              <button
                key={number}
                type="button"
                onClick={() => onGoTo(number)}
                aria-label={fill(copy.goToPage, { page: number })}
                aria-current={number === page}
                // A 6px dot inside a 24px target: the thing to hit is bigger
                // than the thing you see, which is the only way a row of dots
                // is usable with a thumb.
                className="flex size-6 items-center justify-center rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <span
                  className={cn(
                    "block rounded-full transition-all",
                    number === page
                      ? "size-2 bg-primary"
                      : "size-1.5 bg-muted-foreground/40"
                  )}
                />
              </button>
            ))}
          </div>
        ) : (
          <div className="h-1 w-full max-w-32 overflow-hidden rounded-full bg-muted-foreground/20">
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-200"
              style={{ width: `${(page / total) * 100}%` }}
            />
          </div>
        )}

        <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
          {fill(copy.pageOf, { page, total })}
        </span>
      </div>

      <RailButton label={copy.openFullScreen} onClick={onOpen}>
        <ExpandIcon className="size-4" />
      </RailButton>

      <RailButton
        label={copy.nextPage}
        disabled={page >= total}
        onClick={() => onGoTo(page + 1)}
      >
        <ChevronRightIcon className="size-4" />
      </RailButton>
    </div>
  )
}

/**
 * The full-screen reading view.
 *
 * <p>The reason it exists is small print. A slide is written for a projector
 * and a handout for A4, and either one shrunk into a phone's column has text
 * at the edge of legibility — so the deck is not really readable until it can
 * fill the screen and then be zoomed into.
 *
 * <p>Zoom is a toggle rather than a pinch. A pinch inside a snapping rail
 * fights it: the same two fingers mean "scale this page" and "go to the next
 * one", and the browser has to guess. The toggle swaps the rail for a single
 * page at double width in a plain scrolling box, where panning is ordinary
 * scrolling and there is nothing left to guess.
 */
function FullScreenDeck({
  pages,
  page,
  onPageChange,
  copy,
  label,
  onClose,
}: {
  pages: DocumentPage[]
  page: number
  onPageChange: (page: number) => void
  copy: Strings["deck"]
  label: string
  onClose: () => void
}) {
  const [zoomed, setZoomed] = React.useState(false)
  const total = pages.length

  // Escape closes, and the arrow keys page. A keyboard reader gets the rail's
  // own scrolling anyway; these are the shortcuts anyone would try first.
  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose()
      if (zoomed) return
      if (event.key === "ArrowLeft" && page > 1) onPageChange(page - 1)
      if (event.key === "ArrowRight" && page < total) onPageChange(page + 1)
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [page, total, zoomed, onClose, onPageChange])

  // The page behind must not scroll under the overlay — on a phone that shows
  // as the deck moving and the article sliding past behind it at once.
  React.useEffect(() => {
    const previous = window.document.body.style.overflow
    window.document.body.style.overflow = "hidden"
    return () => {
      window.document.body.style.overflow = previous
    }
  }, [])

  const current = pages[page - 1]
  const source = mediaUrl(current?.imageUrl)

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={label}
      className="fixed inset-0 z-50 flex flex-col bg-black"
    >
      {/*
        The bar is over the picture rather than beside it, because a phone
        held upright has no width to spare. Padded for the notch and the home
        indicator with the safe-area insets, so neither eats a control.
      */}
      <header className="flex items-center justify-between gap-2 px-2 pt-[max(0.5rem,env(safe-area-inset-top))] pb-2 text-white">
        <span className="min-w-0 flex-1 truncate px-2 text-sm">{label}</span>
        <OverlayButton
          label={zoomed ? copy.zoomOut : copy.zoomIn}
          onClick={() => setZoomed((on) => !on)}
        >
          {zoomed ? <ZoomOutIcon className="size-5" /> : <ZoomInIcon className="size-5" />}
        </OverlayButton>
        <OverlayButton label={copy.close} onClick={onClose}>
          <XIcon className="size-5" />
        </OverlayButton>
      </header>

      <div className="min-h-0 flex-1">
        {zoomed && source ? (
          // One page, twice as wide as the screen, in a box that scrolls both
          // ways. Panning is then just scrolling, with the momentum and the
          // bounds a browser already gives it.
          <div className="size-full overflow-auto overscroll-contain">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={source}
              alt={fill(copy.pageOf, { page, total })}
              className="w-[200%] max-w-none"
            />
          </div>
        ) : (
          <PageRail
            pages={pages}
            page={page}
            onPageChange={onPageChange}
            copy={copy}
            full
          />
        )}
      </div>

      <footer className="flex items-center justify-center gap-4 px-2 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] text-white">
        <OverlayButton
          label={copy.previousPage}
          disabled={zoomed || page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeftIcon className="size-5" />
        </OverlayButton>
        <span className="min-w-16 text-center text-sm tabular-nums">
          {fill(copy.pageOf, { page, total })}
        </span>
        <OverlayButton
          label={copy.nextPage}
          disabled={zoomed || page >= total}
          onClick={() => onPageChange(page + 1)}
        >
          <ChevronRightIcon className="size-5" />
        </OverlayButton>
      </footer>
    </div>
  )
}

/** A control in the bar under the inline deck. */
function RailButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string
  disabled?: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      // size-9 is the smallest a thumb reliably hits; the icon inside is
      // smaller, so the row still reads as light.
      className="flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-30"
    >
      {children}
    </button>
  )
}

/** The same, on the black of the full-screen view. */
function OverlayButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string
  disabled?: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="flex size-11 shrink-0 items-center justify-center rounded-full bg-white/10 text-white outline-none transition-colors hover:bg-white/20 focus-visible:ring-3 focus-visible:ring-white/50 disabled:pointer-events-none disabled:opacity-30"
    >
      {children}
    </button>
  )
}
