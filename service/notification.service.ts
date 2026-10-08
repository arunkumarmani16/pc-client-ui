import type { AxiosRequestConfig } from "axios"

import { httpClient } from "./http-client"

import type { NotificationInbox, PushSettings } from "@/interface"

const RESOURCE = "/portal/notifications"

/**
 * Background calls (the bell's poll, syncing the device) pass this so the
 * page does not dim behind the loading overlay every minute.
 */
const QUIET: AxiosRequestConfig = { skipGlobalLoader: true }

/** A page of her notifications, newest first, worded in `language`. */
export async function getNotifications(
  query: { page?: number; size?: number; language?: string } = {},
  config?: AxiosRequestConfig
): Promise<NotificationInbox> {
  const { data } = await httpClient.get<NotificationInbox>(RESOURCE, {
    ...config,
    params: {
      page: query.page ?? 0,
      size: query.size ?? 20,
      ...(query.language ? { lang: query.language } : {}),
    },
  })
  return data
}

export async function getUnreadCount(): Promise<number> {
  const { data } = await httpClient.get<{ unreadCount: number }>(`${RESOURCE}/unread-count`, QUIET)
  return data.unreadCount
}

export async function markNotificationRead(id: number): Promise<void> {
  await httpClient.post(`${RESOURCE}/${id}/read`, null, QUIET)
}

export async function markAllNotificationsRead(): Promise<void> {
  await httpClient.post(`${RESOURCE}/read-all`, null, QUIET)
}

/** Takes one out of her list. Hidden on the server, so it is never sent again. */
export async function clearNotification(id: number): Promise<void> {
  await httpClient.post(`${RESOURCE}/${id}/clear`, null, QUIET)
}

export async function clearAllNotifications(): Promise<void> {
  await httpClient.post(`${RESOURCE}/clear-all`, null, QUIET)
}

export async function getPushSettings(): Promise<PushSettings> {
  const { data } = await httpClient.get<PushSettings>(`${RESOURCE}/push`, QUIET)
  return data
}

/**
 * Tells the API this browser should ring for her, in `language`. Posts the
 * browser's own `PushSubscription` JSON as it is.
 */
export async function savePushSubscription(
  subscription: PushSubscriptionJSON,
  language: string
): Promise<void> {
  await httpClient.put(`${RESOURCE}/push/subscription`, { ...subscription, language }, QUIET)
}

export async function removePushSubscription(endpoint: string): Promise<void> {
  await httpClient.post(`${RESOURCE}/push/unsubscribe`, { endpoint }, QUIET)
}

/** Sends her a test, so she can see her phone ring. */
export async function sendTestPush(language: string): Promise<void> {
  await httpClient.post(`${RESOURCE}/push/test`, null, { params: { lang: language } })
}
