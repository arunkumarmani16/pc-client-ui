import {
  getPushSettings,
  removePushSubscription,
  savePushSubscription,
} from "@/service/notification.service"

/**
 * This browser's side of push notifications: the service worker, the
 * permission prompt, and the subscription the API sends to.
 *
 * <p>Browser-only. Every export touches `navigator` or `window`, so call them
 * from effects and event handlers, never during render.
 */

/**
 * Where this device stands, which is what decides what the settings card
 * offers her.
 *
 * - `unsupported`: the browser cannot do push at all.
 * - `needs-install`: an iPhone or iPad, which can, but only for a site added
 *   to the Home Screen and opened from there (iOS 16.4 and later).
 * - `unavailable`: the server has no push keys, so there is nothing to offer.
 * - `denied`: she said no, and only the browser's settings can undo that.
 * - `off`: allowed or not yet asked, and not subscribed.
 * - `on`: this device rings.
 */
export type PushState = "unsupported" | "needs-install" | "unavailable" | "denied" | "off" | "on"

const SERVICE_WORKER_PATH = "/sw.js"

/**
 * Dispatched on `window` when something on the page changed what is unread,
 * so the bell re-reads its figure instead of waiting for its poll.
 */
export const NOTIFICATIONS_CHANGED_EVENT = "notifications:changed"

function isIos(): boolean {
  // iPadOS reports itself as a Mac; the touch points give it away.
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  )
}

/** Opened from the Home Screen rather than in a browser tab. */
export function isInstalled(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

function hasPushApis(): boolean {
  return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window
}

/**
 * Registers the service worker, or returns the one already registered.
 *
 * <p>`updateViaCache: "none"` so a new `sw.js` is noticed on the next visit
 * rather than whenever the HTTP cache lets go of the old one.
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator)) return null
  try {
    return await navigator.serviceWorker.register(SERVICE_WORKER_PATH, {
      scope: "/",
      updateViaCache: "none",
    })
  } catch (error) {
    console.error("Service worker registration failed", error)
    return null
  }
}

async function currentSubscription(): Promise<PushSubscription | null> {
  const registration = await navigator.serviceWorker.getRegistration("/")
  return registration ? registration.pushManager.getSubscription() : null
}

export async function getPushState(): Promise<PushState> {
  if (!hasPushApis()) {
    return isIos() && !isInstalled() ? "needs-install" : "unsupported"
  }

  const settings = await getPushSettings().catch(() => null)
  if (!settings?.enabled || !settings.publicKey) return "unavailable"
  if (Notification.permission === "denied") return "denied"
  if (Notification.permission !== "granted") return "off"

  return (await currentSubscription()) ? "on" : "off"
}

/**
 * Asks for permission, subscribes, and tells the API. Call it straight from a
 * tap: Safari only shows the permission prompt in direct response to one, so
 * the prompt comes first and everything that waits on the network after it.
 */
export async function enablePush(language: string): Promise<PushState> {
  if (!hasPushApis()) return isIos() && !isInstalled() ? "needs-install" : "unsupported"
  setTurnedOffHere(false)

  const permission = await Notification.requestPermission()
  if (permission === "denied") return "denied"
  if (permission !== "granted") return "off"

  return (await subscribe(language)) ? "on" : "unavailable"
}

/**
 * Stops this device ringing, on the API and in the browser, and remembers
 * that it was turned off by hand so {@link keepPushOn} leaves it off.
 */
export async function disablePush(): Promise<void> {
  setTurnedOffHere(true)
  await unsubscribeHere()
}

/** Drops this device's subscription, on the API and in the browser. */
async function unsubscribeHere(): Promise<void> {
  const subscription = await currentSubscription()
  if (!subscription) return
  await removePushSubscription(subscription.endpoint).catch(() => {})
  await subscription.unsubscribe()
}

/**
 * Before signing out: the next person to sign in on this phone must not get
 * her notifications. Never throws, since nothing here may stand between
 * someone and the sign-out they asked for.
 */
export async function detachPush(): Promise<void> {
  try {
    if (hasPushApis()) await unsubscribeHere()
  } catch (error) {
    console.error("Could not detach push on sign out", error)
  }
}

/**
 * Keeps push on for whoever is signed in, from the moment the site opens.
 * Call once when the signed-in shell mounts; returns a cleanup for unmount.
 *
 * - Already allowed: the subscription is brought up to date silently.
 * - Not asked yet: the permission prompt comes up on the first tap or key
 *   press anywhere on the site. Not on load: Safari and Firefox ignore a
 *   prompt that no gesture asked for, and Chrome hides one behind a quiet
 *   icon, so asking on load would fail on half the devices it ran on.
 * - Blocked, or turned off on this device from the settings panel: left
 *   alone. Only the browser's settings can undo a block, and turning it off
 *   by hand is a choice the next visit should respect.
 * - The server has no push keys: nothing to ask for, so nothing is asked.
 */
export function keepPushOn(language: string): () => void {
  if (!hasPushApis() || turnedOffHere() || Notification.permission === "denied") {
    return () => {}
  }
  if (Notification.permission === "granted") {
    void syncPush(language)
    return () => {}
  }

  const gestures = ["click", "keydown"] as const
  let stopped = false
  const stop = () => {
    stopped = true
    gestures.forEach((type) => window.removeEventListener(type, ask, true))
  }
  // Runs inside the gesture's own handler, and `enablePush` calls
  // `requestPermission` before it awaits anything, so the browser still
  // counts the prompt as asked for by the tap.
  function ask() {
    stop()
    enablePush(language).catch((error) => reportPushError("Could not turn on notifications", error))
  }

  getPushSettings().then(
    (settings) => {
      if (stopped || !settings.enabled || !settings.publicKey) return
      // Capture, so a handler that stops propagation cannot swallow the tap.
      gestures.forEach((type) => window.addEventListener(type, ask, true))
    },
    () => {}
  )
  return stop
}

/**
 * Brings this device's subscription up to date with whoever is signed in,
 * without asking anything. Re-sent on every visit because the owner can change
 * (someone else may have signed in on this device since), and because the
 * browser renews the subscription when it likes. If permission was given once
 * and the subscription has since lapsed, a new one is made quietly.
 */
export async function syncPush(language: string): Promise<void> {
  if (!hasPushApis() || Notification.permission !== "granted") return
  try {
    await subscribe(language)
  } catch (error) {
    reportPushError("Could not sync push subscription", error)
  }
}

/**
 * Logs a push failure. An unreachable push service is the browser's condition,
 * not a fault here, and it recurs on every visit, so it is a warning rather
 * than an error: it does not raise the dev overlay or an error report on each
 * page opened.
 */
export function reportPushError(context: string, error: unknown): void {
  if (isPushServiceUnavailable(error)) {
    console.warn("Push notifications are unavailable in this browser: it could not reach its push service.", error)
  } else {
    console.error(context, error)
  }
}

/**
 * The browser could not reach its own push service, so it cannot subscribe
 * anyone, whatever this app does.
 *
 * <p>Chrome, Edge and Brave all reject `subscribe()` this way, with an
 * `AbortError` reading "Registration failed - push service error", when the
 * vendor's push servers are out of reach: Brave with "Use Google services for
 * push messaging" turned off, which is its default; a Chromium build without
 * Google's services; or a network, VPN or firewall that blocks them.
 */
export function isPushServiceUnavailable(error: unknown): boolean {
  return (
    (error instanceof DOMException || error instanceof Error) &&
    (error.name === "AbortError" || /push service/i.test(error.message))
  )
}

/**
 * Set when push is turned off by hand from the settings panel, so
 * {@link keepPushOn} does not switch it straight back on next visit. Per
 * device, like the subscription it stands for. Storage can be unavailable
 * (private windows, blocked site data); push then simply counts as not turned
 * off.
 */
const TURNED_OFF_KEY = "push:turned-off"

function turnedOffHere(): boolean {
  try {
    return window.localStorage.getItem(TURNED_OFF_KEY) === "1"
  } catch {
    return false
  }
}

function setTurnedOffHere(off: boolean): void {
  try {
    if (off) window.localStorage.setItem(TURNED_OFF_KEY, "1")
    else window.localStorage.removeItem(TURNED_OFF_KEY)
  } catch {
    // Without storage the choice lasts until the next visit, which is the
    // most a browser that will not store anything can give.
  }
}

/** Subscribes with the server's current key and saves it. False when the server has none. */
async function subscribe(language: string): Promise<boolean> {
  const settings = await getPushSettings()
  if (!settings.enabled || !settings.publicKey) return false

  // `ready`, not what `register` returns: on a first visit that registration
  // can still be installing, and subscribing on it fails with "no active
  // Service Worker".
  await registerServiceWorker()
  const registration = await activeRegistration()
  const serverKey = base64UrlToBytes(settings.publicKey)
  let subscription = await registration.pushManager.getSubscription()

  // Made with a key the server no longer holds, so nothing it sends can
  // reach it. Replace it rather than keep a subscription that never rings.
  if (subscription && !sameBytes(subscription.options.applicationServerKey, serverKey)) {
    await subscription.unsubscribe()
    subscription = null
  }

  subscription ??= await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: serverKey,
  })

  await savePushSubscription(subscription.toJSON(), language)
  return true
}

/**
 * The registration once its worker is active. `ready` never settles if the
 * worker failed to install, so it is given a limit rather than leaving the
 * button spinning.
 */
async function activeRegistration(): Promise<ServiceWorkerRegistration> {
  let timer: number | undefined
  const timeout = new Promise<never>((_, reject) => {
    timer = window.setTimeout(
      () => reject(new Error("The notification service worker did not start. Reload the page and try again.")),
      10_000
    )
  })
  try {
    return await Promise.race([navigator.serviceWorker.ready, timeout])
  } finally {
    window.clearTimeout(timer)
  }
}

/**
 * Why turning notifications on failed, in words worth showing: the browser's
 * own errors name the cause ("push service error") but not what to do.
 */
export function pushErrorMessage(error: unknown): string {
  const response = (error as { response?: { status?: number; data?: { detail?: string } } })?.response
  if (response) {
    return response.data?.detail || `The server refused it (HTTP ${response.status ?? "error"}).`
  }
  if (error instanceof DOMException || error instanceof Error) {
    if (error.name === "NotAllowedError") {
      return "Notifications are blocked for this site. Allow them in the browser's site settings."
    }
    if (isPushServiceUnavailable(error)) {
      return "This browser could not reach its push service. Check your connection, or try Chrome or Edge with its Google/Microsoft services allowed."
    }
    return error.message || "Please try again."
  }
  return "Please try again."
}

function base64UrlToBytes(value: string): Uint8Array<ArrayBuffer> {
  const padded = (value + "=".repeat((4 - (value.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/")
  const raw = atob(padded)
  const bytes = new Uint8Array(new ArrayBuffer(raw.length))
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i)
  return bytes
}

function sameBytes(left: ArrayBuffer | null, right: Uint8Array): boolean {
  if (!left) return false
  const view = new Uint8Array(left)
  return view.length === right.length && view.every((byte, index) => byte === right[index])
}

/** The count on the home-screen icon while the app is open. Silently absent where unsupported. */
export function setAppBadge(count: number): void {
  const nav = navigator as Navigator & {
    setAppBadge?: (count?: number) => Promise<void>
    clearAppBadge?: () => Promise<void>
  }
  try {
    if (count > 0) void nav.setAppBadge?.(count)?.catch(() => {})
    else void nav.clearAppBadge?.()?.catch(() => {})
  } catch {
    // Badging is decoration.
  }
}
