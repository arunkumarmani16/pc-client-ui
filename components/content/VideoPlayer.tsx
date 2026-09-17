import { ClockIcon, VideoOffIcon } from "lucide-react"

import type { ContentVideo } from "@/interface"
import { mediaUrl } from "@/lib/api/config"
import { formatDuration } from "@/lib/format"
import { strings } from "@/lib/strings"

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
export function VideoPlayer({ video }: { video: ContentVideo }) {
  const copy = strings.video
  const source = mediaUrl(video.playbackUrl)
  const hls = mediaUrl(video.hlsUrl)
  const embed = mediaUrl(video.embedUrl)
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

  if (!source && embed) {
    return (
      <Frame>
        <iframe
          src={embed}
          title={video.title ?? copy.fallbackTitle}
          allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen"
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
 * A 16:9 box that never outgrows its column.
 *
 * <p>`aspect-video` with `max-w-full` rather than a fixed height: the shell is
 * a phone-first column, and a player given its own dimensions is the usual way
 * a page ends up scrolling sideways.
 */
function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex aspect-video w-full max-w-full items-center justify-center overflow-hidden rounded-xl border bg-muted">
      {children}
    </div>
  )
}
