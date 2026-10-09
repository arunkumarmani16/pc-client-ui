"use client"

import * as React from "react"

import { isInstalled } from "@/lib/push"

/**
 * Installing the portal as an app: an icon on the phone, its own window, and
 * on an iPhone the only way to get notifications at all.
 *
 * <p>Chrome, Edge and Samsung Internet offer installation through
 * `beforeinstallprompt`, fired once and early, often before any component has
 * mounted. So it is caught here at module load and kept, and the menu item
 * reads it through {@link useInstall}. Safari on iPhone and iPad fires no such
 * event: it is installed by hand from the Share menu, so there the item shows
 * the steps instead.
 */

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

export type InstallState = {
  /** Already running as an installed app: nothing to offer. */
  installed: boolean
  /** The browser has an install prompt ready to show. */
  canPrompt: boolean
  /** iPhone or iPad in Safari: installed by hand from the Share menu. */
  manual: boolean
}

const SERVER_STATE: InstallState = { installed: false, canPrompt: false, manual: false }

let deferred: InstallPromptEvent | null = null
let installedNow = false
let state: InstallState = SERVER_STATE
const listeners = new Set<() => void>()

function isIos(): boolean {
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  )
}

function recompute() {
  const installed = installedNow || isInstalled()
  state = {
    installed,
    canPrompt: !installed && deferred !== null,
    manual: !installed && deferred === null && isIos(),
  }
  listeners.forEach((listener) => listener())
}

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (event) => {
    // Kept for our own button rather than the browser's mini-infobar.
    event.preventDefault()
    deferred = event as InstallPromptEvent
    recompute()
  })
  window.addEventListener("appinstalled", () => {
    deferred = null
    installedNow = true
    recompute()
  })
  recompute()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useInstall(): InstallState {
  return React.useSyncExternalStore(
    subscribe,
    () => state,
    () => SERVER_STATE
  )
}

/**
 * Shows the browser's install dialog. True if they installed. The prompt can
 * be used once, so it is let go whatever they chose; the browser offers a new
 * one later if they declined.
 */
export async function promptInstall(): Promise<boolean> {
  const event = deferred
  if (!event) return false
  deferred = null
  await event.prompt()
  const { outcome } = await event.userChoice
  recompute()
  return outcome === "accepted"
}
