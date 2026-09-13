import "server-only"

import { cache } from "react"
import { cookies } from "next/headers"

import { DEFAULT_LANGUAGE, isLanguage, type Language } from "@/lib/i18n"
import { LANGUAGE_COOKIE } from "@/lib/auth/cookies"

/**
 * The language this request is being rendered in.
 *
 * <p>Read from a cookie rather than from the URL. A `/ta/guidance` prefix would
 * put the choice in every link in the app and in every page a mother has
 * bookmarked, and a `?lang=` parameter would be lost the first time she
 * followed one — while the thing being chosen is a property of the reader, not
 * of the page. The cookie also means the server render is already in the right
 * language, so nothing flashes in English first.
 *
 * <p>Cached for the request, so the layout, the page and the components inside
 * it read one cookie between them.
 */
export const currentLanguage = cache(async (): Promise<Language> => {
  const chosen = (await cookies()).get(LANGUAGE_COOKIE)?.value

  // An unknown value reads as English rather than throwing: the cookie is not
  // httpOnly, so it is something a reader can edit, and a hand-edited language
  // should show her the app in English rather than break the page.
  return isLanguage(chosen) ? chosen : DEFAULT_LANGUAGE
})
