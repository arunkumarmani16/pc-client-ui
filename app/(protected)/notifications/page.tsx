import { redirect } from "next/navigation"

import { HOME_PATH, OPEN_NOTIFICATIONS_PARAM } from "@/lib/auth/cookies"

/**
 * Notifications are a panel off the header's bell now, not a page. This path
 * is kept because pushes already on phones open it when tapped (sw.js), and
 * it sends her home with the panel open.
 */
export default function NotificationsPage() {
  redirect(`${HOME_PATH}?${OPEN_NOTIFICATIONS_PARAM}=open`)
}
