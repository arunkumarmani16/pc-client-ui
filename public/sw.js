/*
 * The portal's service worker: what makes a notification arrive like a phone
 * app's, with the portal closed.
 *
 * The API encrypts each notification to this browser and hands it to the
 * browser vendor's push service, which wakes the phone; the `push` handler
 * below then shows it. Tapping it opens the portal on the page it is about.
 *
 * Served from /public as it is, not bundled: a service worker's scope is the
 * folder its script is served from, so it has to sit at the root to see every
 * page. The proxy's matcher lets it past the sign-in redirect, and
 * next.config.ts stops it being cached so a new version is picked up on the
 * next visit.
 *
 * No offline caching. That is a separate decision with its own costs (stale
 * guidance after staff correct it), and nothing about notifications needs it.
 */

/** The portal's notification routes, reached through the app's own proxy. */
const API = "/api/backend/portal/notifications"

const ICON = "/icons/icon-192.png"
/** Android draws the status-bar icon from this one's alpha alone. */
const BADGE = "/icons/badge-96.png"

self.addEventListener("install", () => {
  // A new version takes over at once rather than after every tab has closed,
  // which on a phone can be never.
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener("push", (event) => {
  let data = {}
  try {
    data = event.data ? event.data.json() : {}
  } catch {
    data = { body: event.data ? event.data.text() : "" }
  }

  event.waitUntil(
    (async () => {
      await self.registration.showNotification(data.title || "Pregnancy Care", {
        body: data.body || "",
        icon: ICON,
        badge: BADGE,
        // A tag means a newer notification of the same kind replaces the
        // older one rather than stacking; renotify still buzzes for it.
        tag: data.tag || undefined,
        renotify: Boolean(data.tag),
        vibrate: [120, 60, 120],
        timestamp: Date.now(),
        data: { url: data.url || "/notifications", id: data.id },
      })

      // The count on the home-screen icon, once installed. Not every
      // platform has it, and none of them must fail the push over it.
      try {
        if (typeof data.badge === "number" && "setAppBadge" in self.navigator) {
          if (data.badge > 0) await self.navigator.setAppBadge(data.badge)
          else await self.navigator.clearAppBadge()
        }
      } catch {
        // Badging is decoration.
      }

      // An open portal refreshes its bell rather than waiting for its poll.
      const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true })
      for (const client of windows) {
        client.postMessage({ type: "notification-received", id: data.id })
      }
    })()
  )
})

self.addEventListener("notificationclick", (event) => {
  event.notification.close()
  const { url, id } = event.notification.data || {}
  const target = new URL(url || "/notifications", self.location.origin)

  event.waitUntil(
    (async () => {
      // Opening it is reading it. Same-origin, so the cookie rides along and
      // the proxy turns it into the token the API wants.
      if (id) {
        await fetch(`${API}/${encodeURIComponent(id)}/read`, { method: "POST" }).catch(() => {})
      }

      // Reuse an open portal window where there is one, the way tapping a
      // phone app's notification brings the app forward instead of opening
      // a second copy of it.
      const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true })
      for (const client of windows) {
        if (new URL(client.url).origin !== self.location.origin) continue
        try {
          const focused = await client.focus()
          await focused.navigate(target.href)
          focused.postMessage({ type: "notification-read", id })
          return
        } catch {
          // An uncontrolled window cannot be navigated; open a fresh one.
        }
      }
      await self.clients.openWindow(target.href)
    })()
  )
})

/*
 * The push service rotated this browser's subscription. Re-subscribes and
 * tells the API, so the phone does not go quiet until her next visit. Runs
 * with no page open, which is why it fetches the key itself.
 */
self.addEventListener("pushsubscriptionchange", (event) => {
  event.waitUntil(
    (async () => {
      const response = await fetch(`${API}/push`)
      if (!response.ok) return
      const settings = await response.json()
      if (!settings.enabled || !settings.publicKey) return

      const subscription = await self.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: base64UrlToBytes(settings.publicKey),
      })
      await fetch(`${API}/push/subscription`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        // No language: a worker cannot read the cookie it lives in. The next
        // time she opens the portal, it sends the one she reads in.
        body: JSON.stringify(subscription.toJSON()),
      })
    })().catch(() => {})
  )
})

function base64UrlToBytes(value) {
  const padded = (value + "=".repeat((4 - (value.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/")
  const raw = atob(padded)
  return Uint8Array.from(raw, (char) => char.charCodeAt(0))
}
