/**
 * What `/portal/notifications` sends. Mirrors `NotificationResponse` and
 * `NotificationInboxResponse` on the API.
 */

export type NotificationKind = "MESSAGE" | "NEW_GUIDANCE" | "NEW_WEEK" | "NEW_MONTH" | "PATIENT_REGISTERED" | "TEST"

export interface AppNotification {
  id: number
  kind: NotificationKind
  /** Already in the language asked for, where the API words it itself. */
  title: string
  body: string
  /** A path in this app, or null for nowhere in particular. */
  url: string | null
  createdAt: string
  read: boolean
}

export interface NotificationInbox {
  items: AppNotification[]
  page: number
  size: number
  hasNext: boolean
  /** Across the whole inbox, not just this page: the figure on the bell. */
  unreadCount: number
}

/** Whether the server can push at all, and the key a browser subscribes with. */
export interface PushSettings {
  enabled: boolean
  publicKey: string | null
}
