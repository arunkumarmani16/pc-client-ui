"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  BabyIcon,
  CalendarDaysIcon,
  BellOffIcon,
  BellRingIcon,
  BookOpenIcon,
  CheckCheckIcon,
  MessageSquareTextIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "@/components/ui/toast"
import type { AppNotification, NotificationKind } from "@/interface"
import {
  disablePush,
  enablePush,
  getPushState,
  isPushServiceUnavailable,
  NOTIFICATIONS_CHANGED_EVENT,
  pushErrorMessage,
  type PushState,
} from "@/lib/push"
import type { Strings } from "@/lib/strings"
import type { Language } from "@/lib/translation/languages"
import { cn } from "@/lib/utils"
import {
  clearAllNotifications,
  clearNotification,
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  sendTestPush,
} from "@/service/notification.service"

type Labels = Strings["notifications"]

const KIND_ICONS: Record<NotificationKind, React.ComponentType<{ className?: string }>> = {
  MESSAGE: MessageSquareTextIcon,
  NEW_GUIDANCE: BookOpenIcon,
  NEW_WEEK: BabyIcon,
  NEW_MONTH: CalendarDaysIcon,
  PATIENT_REGISTERED: MessageSquareTextIcon,
  TEST: BellRingIcon,
}

function announceChange() {
  window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED_EVENT))
}

/**
 * Her notification centre, shown in the bell's panel: the switch for whether
 * this phone rings, and everything the clinic and the app have told her.
 *
 * <p>Mounted each time the panel opens, so the list is read fresh then rather
 * than kept up to date in the background on every page.
 */
export function NotificationCenter({
  labels,
  language,
  onNavigate,
}: {
  labels: Labels
  language: Language
  /** Called before following a notification's link, so the panel can close. */
  onNavigate: () => void
}) {
  const router = useRouter()
  const [items, setItems] = React.useState<AppNotification[]>([])
  const [page, setPage] = React.useState(0)
  const [hasNext, setHasNext] = React.useState(false)
  const [loading, setLoading] = React.useState(true)
  const [failed, setFailed] = React.useState(false)
  const [loadingMore, setLoadingMore] = React.useState(false)

  const unread = items.some((item) => !item.read)

  /** Re-reads the first page: a push arrived while the page was open. */
  const reload = React.useCallback(async () => {
    try {
      const inbox = await getNotifications({ language }, { skipGlobalLoader: true })
      setItems(inbox.items)
      setPage(inbox.page)
      setHasNext(inbox.hasNext)
      setFailed(false)
    } catch {
      setFailed(true)
    } finally {
      setLoading(false)
    }
  }, [language])

  React.useEffect(() => {
    // Reading on open is the point of mounting with the panel.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void reload()
  }, [reload])

  React.useEffect(() => {
    const onWorkerMessage = (event: MessageEvent) => {
      if (event.data?.type === "notification-received") void reload()
    }
    navigator.serviceWorker?.addEventListener("message", onWorkerMessage)
    return () => navigator.serviceWorker?.removeEventListener("message", onWorkerMessage)
  }, [reload])

  async function loadMore() {
    setLoadingMore(true)
    try {
      const inbox = await getNotifications({ page: page + 1, language })
      setItems((current) => [...current, ...inbox.items])
      setPage(inbox.page)
      setHasNext(inbox.hasNext)
    } catch {
      toast.add({ type: "error", title: labels.loadFailed })
    } finally {
      setLoadingMore(false)
    }
  }

  async function open(item: AppNotification) {
    if (!item.read) {
      setItems((current) => current.map((n) => (n.id === item.id ? { ...n, read: true } : n)))
      await markNotificationRead(item.id).catch(() => {})
      announceChange()
    }
    if (item.url) {
      onNavigate()
      router.push(item.url)
    }
  }

  async function markAll() {
    setItems((current) => current.map((n) => ({ ...n, read: true })))
    try {
      await markAllNotificationsRead()
    } catch {
      toast.add({ type: "error", title: labels.failed })
      void reload()
    }
    announceChange()
  }

  async function clearOne(item: AppNotification) {
    setItems((current) => current.filter((n) => n.id !== item.id))
    try {
      await clearNotification(item.id)
    } catch {
      toast.add({ type: "error", title: labels.failed })
      void reload()
    }
    announceChange()
  }

  // Two taps, the first arming the second: clearing everything cannot be
  // undone, and a dialog over a panel is one layer too many on a phone.
  const [confirmingClear, setConfirmingClear] = React.useState(false)
  React.useEffect(() => {
    if (!confirmingClear) return
    const timer = window.setTimeout(() => setConfirmingClear(false), 3000)
    return () => window.clearTimeout(timer)
  }, [confirmingClear])

  async function clearAll() {
    if (!confirmingClear) {
      setConfirmingClear(true)
      return
    }
    setConfirmingClear(false)
    setItems([])
    setHasNext(false)
    try {
      await clearAllNotifications()
    } catch {
      toast.add({ type: "error", title: labels.failed })
      void reload()
    }
    announceChange()
  }

  return (
    <div className="flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 pb-6">
      <DeviceCard labels={labels} language={language} />

      <section className="overflow-hidden rounded-2xl glass">
        <div className="flex items-center justify-between gap-2 border-b px-2 py-1.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAll}
            disabled={items.length === 0}
            className={cn(confirmingClear && "bg-destructive/10 text-destructive hover:bg-destructive/15")}
          >
            <Trash2Icon />
            {confirmingClear ? labels.clearAllConfirm : labels.clearAll}
          </Button>
          <Button variant="ghost" size="sm" onClick={markAll} disabled={!unread}>
            <CheckCheckIcon />
            {labels.markAllRead}
          </Button>
        </div>

        {loading && items.length === 0 ? (
          <div className="flex justify-center px-4 py-8">
            <Spinner />
          </div>
        ) : failed && items.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">{labels.loadFailed}</p>
        ) : items.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">{labels.empty}</p>
        ) : (
          <ul className="divide-y">
            {items.map((item) => (
              <NotificationRow
                key={item.id}
                item={item}
                language={language}
                unreadLabel={labels.unread}
                clearLabel={labels.clear}
                onOpen={() => open(item)}
                onClear={() => clearOne(item)}
              />
            ))}
          </ul>
        )}

        {hasNext && (
          <div className="border-t p-2 text-center">
            <Button variant="ghost" size="sm" onClick={loadMore} disabled={loadingMore}>
              {loadingMore && <Spinner />}
              {labels.loadMore}
            </Button>
          </div>
        )}
      </section>

      <p className="text-center text-xs text-muted-foreground">{labels.autoClear}</p>
    </div>
  )
}

function NotificationRow({
  item,
  language,
  unreadLabel,
  clearLabel,
  onOpen,
  onClear,
}: {
  item: AppNotification
  language: Language
  unreadLabel: string
  clearLabel: string
  onOpen: () => void
  onClear: () => void
}) {
  const Icon = KIND_ICONS[item.kind] ?? MessageSquareTextIcon

  return (
    // Two buttons side by side rather than one inside the other, which is
    // invalid and would open the notification on every clear.
    <li className={cn("flex items-start", !item.read && "bg-primary/5")}>
      <button
        type="button"
        onClick={onOpen}
        className="flex min-w-0 flex-1 items-start gap-3 py-3 pl-4 text-left transition-colors outline-none hover:bg-muted/60 focus-visible:bg-muted/60"
      >
        <span
          className={cn(
            "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full",
            item.read ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"
          )}
        >
          <Icon className="size-4" />
        </span>
        <span className="min-w-0 flex-1 space-y-0.5">
          <span className="flex items-start justify-between gap-2">
            <span
              className={cn(
                "text-sm text-foreground",
                item.read ? "font-medium" : "font-semibold"
              )}
            >
              {item.title}
            </span>
            <time
              dateTime={item.createdAt}
              className="shrink-0 pt-0.5 text-xs text-muted-foreground tabular-nums"
            >
              {timeAgo(item.createdAt, language)}
            </time>
          </span>
          <span className="block text-sm leading-relaxed text-muted-foreground">{item.body}</span>
        </span>
        {!item.read && (
          <span className="mt-2 size-2 shrink-0 rounded-full bg-blush">
            <span className="sr-only">{unreadLabel}</span>
          </span>
        )}
      </button>
      <button
        type="button"
        onClick={onClear}
        aria-label={`${clearLabel}: ${item.title}`}
        title={clearLabel}
        className="m-2 flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors outline-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <XIcon className="size-4" />
      </button>
    </li>
  )
}

/**
 * Whether this phone rings, and the switch for it. What it offers follows
 * the device's state: see {@link PushState}.
 */
function DeviceCard({ labels, language }: { labels: Labels; language: Language }) {
  const [state, setState] = React.useState<PushState | null>(null)
  const [busy, setBusy] = React.useState(false)

  React.useEffect(() => {
    void getPushState().then(setState)
  }, [])

  // Nothing to offer, so nothing to show: the server has push turned off.
  if (state === null || state === "unavailable") return null

  async function turnOn() {
    setBusy(true)
    try {
      setState(await enablePush(language))
    } catch (error) {
      // The toast already says what to do about an unreachable push service;
      // only anything else is a fault worth an error in the console.
      if (isPushServiceUnavailable(error)) console.warn("Push service unreachable", error)
      else console.error("Could not turn on notifications", error)
      toast.add({ type: "error", title: labels.failed, description: pushErrorMessage(error) })
    } finally {
      setBusy(false)
    }
  }

  async function turnOff() {
    setBusy(true)
    try {
      await disablePush()
      setState("off")
    } catch (error) {
      console.error("Could not turn off notifications", error)
      toast.add({ type: "error", title: labels.failed })
    } finally {
      setBusy(false)
    }
  }

  async function test() {
    try {
      await sendTestPush(language)
      toast.add({ type: "success", title: labels.testSent })
    } catch {
      toast.add({ type: "error", title: labels.failed })
    }
  }

  // Only the states she has to do something about get words; on and off
  // are said by the switch itself.
  const help = {
    on: null,
    off: null,
    denied: labels.stateDenied,
    unsupported: labels.stateUnsupported,
    "needs-install": labels.stateNeedsInstall,
  }[state]
  const switchable = state === "on" || state === "off"
  const on = state === "on"

  return (
    <section className="rounded-2xl glass px-3 py-2.5">
      <div className="flex items-center gap-2.5">
        {on ? (
          <BellRingIcon className="size-4 shrink-0 text-primary" />
        ) : (
          <BellOffIcon className="size-4 shrink-0 text-muted-foreground" />
        )}
        <span id="device-switch-label" className="min-w-0 flex-1 text-sm font-medium text-foreground">
          {labels.deviceSwitch}
        </span>
        {on && (
          <Button variant="ghost" size="sm" onClick={test} className="shrink-0 text-xs">
            {labels.sendTest}
          </Button>
        )}
        {switchable &&
          (busy ? (
            <Spinner className="shrink-0" />
          ) : (
            <button
              type="button"
              role="switch"
              aria-checked={on}
              aria-labelledby="device-switch-label"
              title={on ? labels.turnOff : labels.turnOn}
              onClick={on ? turnOff : turnOn}
              className={cn(
                "relative inline-flex h-6 w-10 shrink-0 cursor-pointer items-center rounded-full transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                on ? "bg-primary" : "bg-muted-foreground/30"
              )}
            >
              <span
                className={cn(
                  "inline-block size-5 rounded-full bg-white shadow-sm transition-transform",
                  on ? "translate-x-[1.125rem]" : "translate-x-0.5"
                )}
              />
            </button>
          ))}
      </div>
      {help && <p className="pt-1.5 pl-6.5 text-xs leading-relaxed text-muted-foreground">{help}</p>}
    </section>
  )
}

/**
 * "5 minutes ago", "yesterday", in her language. The browser's own wording,
 * so Tamil comes from the platform rather than from a table kept here.
 */
function timeAgo(iso: string, language: Language): string {
  const seconds = Math.round((new Date(iso).getTime() - Date.now()) / 1000)
  const format = new Intl.RelativeTimeFormat(language, { numeric: "auto" })
  const steps: [Intl.RelativeTimeFormatUnit, number][] = [
    ["second", 60],
    ["minute", 60],
    ["hour", 24],
    ["day", 7],
    ["week", 4.35],
    ["month", 12],
  ]

  let value = seconds
  for (const [unit, size] of steps) {
    if (Math.abs(value) < size) return format.format(Math.round(value), unit)
    value /= size
  }
  return format.format(Math.round(value), "year")
}
