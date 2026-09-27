import { ClockIcon, ExternalLinkIcon, VideoOffIcon } from "lucide-react"

import type { ContentVideo } from "@/interface"
import { mediaUrl } from "@/lib/api/config"
import { formatDuration } from "@/lib/format"
import type { Strings } from "@/lib/strings"
import { cn } from "@/lib/utils"
import { embedFor } from "@/lib/video"

/**
 * One clip.
 *
 * <p>A server component with no client JavaScript: the API has already decided
 * which of a video's routes to use, so this is a plain `<video>` element with
 * the browser's own controls. Those controls are the ones a mother already
 * knows, they work with a screen reader, and they cost nothing to ship.
 *
 * <p>`preload="metadata"` rather than `auto`: a page can carry several clips,
 * and pulling all of them down on load would spend a phone's data on videos
 * nobody pressed play on. Metadata is enough for the duration and the first
 * frame.
 */
export function VideoPlayer({
  video,
  copy,
}: {
  video: ContentVideo
  copy: Strings["video"]
}) {
  const source = mediaUrl(video.playbackUrl)
  const hls = mediaUrl(video.hlsUrl)
  const embed = embedFor(mediaUrl(video.embedUrl))
  const poster = mediaUrl(video.posterUrl) ?? undefined
  const duration = formatDuration(video.durationSeconds)

  // A provider that is still transcoding hands back a URL that errors when
  // played. Saying so is better than a broken player with no explanation.
  if (!video.ready) {
    return (
      <Frame>
        <div className="flex flex-col items-center gap-2 px-4 text-center">
          <ClockIcon className="size-6 text-muted-foreground" />
          <p className="text-sm font-medium text-foreground">{copy.preparing}</p>
          <p className="text-xs text-muted-foreground">{copy.nearlyReady}</p>
        </div>
      </Frame>
    )
  }

  // A link with no embed route behind it — Instagram's newer `/share/<id>`,
  // which only Instagram can resolve. A frame pointed at it lands on the post
  // page and its `DENY`, so she is handed the link rather than a blank box.
  if (!source && embed?.kind === "link") {
    return (
      <Frame>
        <div className="flex flex-col items-center gap-3 px-4 text-center">
          <ExternalLinkIcon className="size-6 text-muted-foreground" aria-hidden />
          <p className="text-sm text-muted-foreground">{copy.opensElsewhere}</p>
          <a
            href={embed.url}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md text-sm font-medium text-primary underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {copy.watchThere}
          </a>
        </div>
      </Frame>
    )
  }

  if (!source && embed?.kind === "frame") {
    return (
      <Frame portrait={embed.portrait}>
        <iframe
          src={embed.url}
          title={video.title ?? copy.fallbackTitle}
          // `autoplay` and `web-share` beyond what a bare file needs: a
          // provider's own player is the thing being handed the controls here,
          // and one refused permission shows as a player that will not start.
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
          allowFullScreen
          loading="lazy"
          className="absolute inset-0 size-full border-0"
        />
      </Frame>
    )
  }

  if (!source) {
    return (
      <Frame>
        <div className="flex flex-col items-center gap-2 px-4 text-center">
          <VideoOffIcon className="size-6 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">{copy.unavailable}</p>
        </div>
      </Frame>
    )
  }

  return (
    <figure className="space-y-2">
      <Frame>
        <video
          controls
          preload="metadata"
          poster={poster}
          playsInline
          className="absolute inset-0 size-full bg-black object-contain"
        >
          {/*
            The direct file first so every browser takes it. The HLS manifest
            is listed after it for Safari, which prefers a manifest when it is
            offered one — browsers that cannot play it skip the source rather
            than failing.
          */}
          <source src={source} />
          {hls && <source src={hls} type="application/vnd.apple.mpegurl" />}
          {copy.cannotPlay}
        </video>
      </Frame>

      {(video.title || duration) && (
        <figcaption className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
          <span className="min-w-0 truncate">{video.title}</span>
          {duration && <span className="shrink-0 tabular-nums">{duration}</span>}
        </figcaption>
      )}
    </figure>
  )
}

/**
 * A box that never outgrows its column.
 *
 * <p>`aspect-video` with `max-w-full` rather than a fixed height: the shell is
 * a phone-first column, and a player given its own dimensions is the usual way
 * a page ends up scrolling sideways.
 *
 * <p>`portrait` for a provider whose card is taller than it is wide — an
 * Instagram reel, where 16:9 would crop away the very controls she is meant to
 * press. Capped in width as well, so the tall box does not take a whole laptop
 * screen to say what a phone says in a column.
 */
function Frame({ portrait = false, children }: { portrait?: boolean; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        "relative flex w-full max-w-full items-center justify-center overflow-hidden rounded-xl border bg-muted",
        portrait ? "mx-auto aspect-[9/16] max-w-sm" : "aspect-video"
      )}
    >
      {children}
    </div>
  )
}
