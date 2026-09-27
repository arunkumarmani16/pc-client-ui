import "server-only"

import { cache } from "react"
import { cookies } from "next/headers"

import { LANGUAGE_COOKIE } from "@/lib/auth/cookies"
import { DEFAULT_LANGUAGE, isLanguage, type Language } from "@/lib/translation/languages"

/**
 * The language this request is being rendered in.
 *
 * <p>Read from a cookie rather than from the URL: the choice is a property of
 * the reader, not of the page, so it should survive every link and bookmark
 * without being written into them. It also means the server render is already
 * in the right language, so nothing flashes in English first.
 *
 * <p>Cached for the request, so the layout, the page and its metadata read one
 * cookie between them.
 */
export const currentLanguage = cache(async (): Promise<Language> => {
  const chosen = (await cookies()).get(LANGUAGE_COOKIE)?.value

  // The cookie is not httpOnly, so it can be hand-edited. An unknown value
  // reads as English rather than breaking the page.
  return isLanguage(chosen) ? chosen : DEFAULT_LANGUAGE
})
