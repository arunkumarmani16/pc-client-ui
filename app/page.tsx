import { redirect } from "next/navigation"

import { HOME_PATH } from "@/lib/auth/cookies"

/** The proxy has already sent a signed-out visitor to the login form. */
export default function Root() {
  redirect(HOME_PATH)
}
