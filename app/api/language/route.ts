import { NextResponse } from "next/server"

import { HOME_PATH, languageCookie, safeRedirectPath } from "@/lib/auth/cookies"
import { isLanguage } from "@/lib/i18n"

/**
 * Changes the language the portal is read in.
 *
 * <p>A form post and a redirect rather than a client-side toggle: the language
 * decides what the server renders, so the page has to be asked for again
 * whatever happens. Doing it this way means the switcher also works before
 * hydration and with JavaScript off, which on a cheap phone on a bad
 * connection is not a hypothetical.
 *
 * <p>A language this build does not know is ignored and the cookie left alone,
 * so a hand-typed post cannot put the app into a state with no words in it.
 */
export async function POST(request: Request) {
  const form = await request.formData()
  const language = form.get("language")
  const next = safeRedirectPath(form.get("next")) ?? HOME_PATH

  // 303, so the browser follows with GET rather than re-posting this form to
  // the page it lands on.
  const response = NextResponse.redirect(new URL(next, request.url), 303)

  if (isLanguage(language)) {
    response.cookies.set(languageCookie(language))
  }
  return response
}
