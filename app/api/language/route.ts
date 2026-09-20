import { NextResponse } from "next/server"

import { HOME_PATH, languageCookie, safeRedirectPath } from "@/lib/auth/cookies"
import { isLanguage } from "@/lib/translation/languages"

/**
 * Changes the language the portal is read in.
 *
 * <p>A form post and a redirect rather than a client-side toggle: the language
 * decides what the server renders, so the page has to be asked for again
 * whatever happens, and a plain post works before hydration and with
 * JavaScript off.
 *
 * <p>A language this build does not know is ignored and the cookie left alone.
 */
export async function POST(request: Request) {
  const form = await request.formData()
  const language = form.get("language")
  const next = safeRedirectPath(form.get("next")) ?? HOME_PATH

  // 303, so the browser follows with GET rather than re-posting the form.
  const response = NextResponse.redirect(new URL(next, request.url), 303)

  if (isLanguage(language)) {
    response.cookies.set(languageCookie(language))
  }
  return response
}
