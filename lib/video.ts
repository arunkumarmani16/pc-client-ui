/**
 * A stored `embedUrl` turned into something a frame can actually play.
 *
 * <p>Instagram serves its ordinary post pages with `X-Frame-Options: DENY`, so
 * the link a staff member pastes — `instagram.com/reel/<code>/` — sits in a
 * frame that never loads. Only the `/embed` route beneath it drops that header
 * and is meant to be framed. An Instagram card is portrait, too, where a
 * YouTube player is 16:9, so even once it loads, a reel put in a 16:9 box is
 * cropped to a band with its play button off the edge.
 *
 * <p>Both are answered here. Every other provider passes through untouched and
 * keeps the 16:9 box a player expects.
 */
export type Embed =
  /** Goes in an iframe. */
  | { kind: "frame"; url: string; portrait: boolean }
  /** Cannot be framed at all; offer the link rather than a box that stays blank. */
  | { kind: "link"; url: string }

/** Instagram's own ids: the character set its shortcodes are drawn from. */
const SHORTCODE = "[A-Za-z0-9_-]+"

const INSTAGRAM_HOST = String.raw`^https?://(?:www\.)?instagr(?:am\.com|\.am)/`

/**
 * The shapes a reel link actually arrives in. "Copy link" gives
 * `/reel/<code>/`, the address bar gives `/reels/<code>/`, and a reel opened
 * from a profile gives `/<username>/reel/<code>/`. A link that already names
 * the embed route is matched too, so it keeps its portrait box.
 *
 * <p>Anchored on what follows the code, so `/reels/videos/<id>/` — the reels
 * tab rather than a reel — cannot pass `videos` off as a shortcode.
 */
const INSTAGRAM_POST = new RegExp(
  INSTAGRAM_HOST +
    // A username may sit in front of the kind, but `share` never does: that is
    // a redirect id, not a username.
    String.raw`(?!share/)(?:[A-Za-z0-9._]+/)?` +
    `(p|reel|reels|tv)/(${SHORTCODE})` +
    String.raw`(?:/embed(?:/captioned)?)?/?(?:[?#]|$)`,
  "i"
)

const INSTAGRAM = new RegExp(INSTAGRAM_HOST, "i")

export function embedFor(url: string | null | undefined): Embed | null {
  if (!url) return null

  const match = url.match(INSTAGRAM_POST)
  if (match) {
    const [, kind, code] = match
    // Instagram's embed route is always "reel", even when the link says "reels".
    const route = kind.toLowerCase() === "reels" ? "reel" : kind.toLowerCase()
    return {
      kind: "frame",
      url: `https://www.instagram.com/${route}/${code}/embed`,
      portrait: true,
    }
  }

  // An Instagram link with no post in it: the newer `/share/<id>` redirect,
  // the reels tab, a profile. None has an embed route to rewrite to, and every
  // one of them answers a frame with `DENY`, so none is worth framing.
  if (INSTAGRAM.test(url)) return { kind: "link", url }

  return { kind: "frame", url, portrait: false }
}
