"use client"

import * as React from "react"
import { usePathname, useRouter } from "next/navigation"
import { BellIcon } from "lucide-react"

import { NotificationCenter } from "@/components/global/NotificationCenter"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { OPEN_NOTIFICATIONS_PARAM } from "@/lib/auth/cookies"
import {
  NOTIFICATIONS_CHANGED_EVENT,
  registerServiceWorker,
  setAppBadge,
  keepPushOn,
} from "@/lib/push"
import type { Strings } from "@/lib/strings"
import type { Language } from "@/lib/translation/languages"
import { cn } from "@/lib/utils"
import { getUnreadCount } from "@/service/notification.service"

/** How often the figure is re-read while the portal sits open. */
const POLL_MS = 60_000

/** The header's `h-14`: the panel opens beneath it, leaving it in view. */
const HEADER_HEIGHT = "3.5rem"

/**
 * The bell in the header, with how many notifications are unread, and the
 * panel it opens: her notification centre slides in over whatever page she is
 * on, so reading a message does not lose her place.
 *
 * <p>Also where this device's push subscription is kept current, since it is
 * mounted on every signed-in page: the service worker is registered and push
 * is kept on. If she has allowed notifications the subscription is re-sent
 * with her language and her id; if she has not been asked yet, she is asked
 * on her first tap (see `keepPushOn`).
 *
 * <p>The figure is re-read on a slow poll, when the portal comes back to the
 * foreground, and at once when the service worker says a push arrived.
 */
export function NotificationBell({ labels, language }: { labels: Strings["notifications"]; language: Language }) {
  const router = useRouter()
  const pathname = usePathname()
  const [count, setCount] = React.useState(0)
  const [open, setOpen] = React.useState(false)

  const refresh = React.useCallback(() => {
    getUnreadCount().then(
      (unread) => {
        setCount(unread)
        setAppBadge(unread)
      },
      // A missed poll is not worth a toast; the next one will try again.
      () => {}
    )
  }, [])

  // Registers the worker, then keeps push on: subscribed silently if it is
  // already allowed, otherwise asked for on the first tap (see `keepPushOn`).
  React.useEffect(() => {
    let stop = () => {}
    let unmounted = false
    void registerServiceWorker().then(() => {
      if (!unmounted) stop = keepPushOn(language)
    })
    return () => {
      unmounted = true
      stop()
    }
  }, [language])

  // A push tapped with the app closed opens /notifications, which sends her
  // here with this flag: open the panel, then take the flag back off the URL
  // so a refresh does not open it again.
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (!params.has(OPEN_NOTIFICATIONS_PARAM)) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOpen(true)
    params.delete(OPEN_NOTIFICATIONS_PARAM)
    const rest = params.toString()
    router.replace(rest ? `${pathname}?${rest}` : pathname, { scroll: false })
  }, [pathname, router])

  React.useEffect(() => {
    refresh()
    const timer = window.setInterval(refresh, POLL_MS)
    const onVisible = () => {
      if (document.visibilityState === "visible") refresh()
    }
    const onWorkerMessage = (event: MessageEvent) => {
      if (event.data?.type?.startsWith?.("notification-")) refresh()
    }

    document.addEventListener("visibilitychange", onVisible)
    window.addEventListener(NOTIFICATIONS_CHANGED_EVENT, refresh)
    navigator.serviceWorker?.addEventListener("message", onWorkerMessage)
    return () => {
      window.clearInterval(timer)
      document.removeEventListener("visibilitychange", onVisible)
      window.removeEventListener(NOTIFICATIONS_CHANGED_EVENT, refresh)
      navigator.serviceWorker?.removeEventListener("message", onWorkerMessage)
    }
  }, [refresh])

  return (
    // Not modal: the panel opens under the header, which stays usable, and
    // the bell (a trigger, so tapping it again closes rather than reopens)
    // has to be reachable while it is open.
    <Sheet open={open} onOpenChange={setOpen} modal={false}>
      <SheetTrigger
        aria-label={count > 0 ? `${labels.bell} (${count})` : labels.bell}
        className={cn(
          "relative flex size-9 cursor-pointer items-center justify-center rounded-lg transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
          open ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
        )}
      >
        <BellIcon className="size-5" />
        {count > 0 && (
          // Blush, the brand's second colour, rather than destructive red: an
          // unread message from the clinic is news, not an error.
          <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-blush px-1 text-[0.625rem] leading-none font-semibold text-white tabular-nums ring-2 ring-card">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </SheetTrigger>

      {/* Full width on a phone, where a three-quarter panel leaves a strip
          too narrow to tap and too wide to ignore. Inline offsets rather than
          classes so they win over the sheet's own full-height inset. */}
      <SheetContent
        side="right"
        className="gap-0 data-[side=right]:w-full data-[side=right]:sm:max-w-md"
        style={{ top: HEADER_HEIGHT, bottom: 0, height: "auto" }}
        overlayProps={{ style: { top: HEADER_HEIGHT } }}
      >
        <SheetHeader className="pr-12">
          <SheetTitle className="text-lg font-semibold">{labels.title}</SheetTitle>
          <SheetDescription>{labels.intro}</SheetDescription>
        </SheetHeader>
        <NotificationCenter labels={labels} language={language} onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  )
}
