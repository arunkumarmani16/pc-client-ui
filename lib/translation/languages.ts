/**
 * The languages the portal is read in.
 *
 * <p>Kept free of `server-only` and `next/headers` so the language switcher, a
 * client component, can import the list as well as the server.
 */

export type Language = "en" | "ta"

export const LANGUAGES = [
  { code: "en", label: "English", nativeLabel: "English" },
  { code: "ta", label: "Tamil", nativeLabel: "தமிழ்" },
] as const satisfies readonly { code: Language; label: string; nativeLabel: string }[]

/** What guidance is written in, and what the app reads in until she chooses. */
export const DEFAULT_LANGUAGE: Language = "en"

export function isLanguage(value: unknown): value is Language {
  return value === "en" || value === "ta"
}
