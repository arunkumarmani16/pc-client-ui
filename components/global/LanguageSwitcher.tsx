"use client"

import { usePathname, useSearchParams } from "next/navigation"
import { LanguagesIcon } from "lucide-react"

import { LANGUAGE_PATH } from "@/lib/auth/cookies"
import { LANGUAGES, type Language } from "@/lib/i18n"
import { cn } from "@/lib/utils"

/**
 * Switches the language the portal is read in.
 *
 * <p>A form rather than a button that calls something: the language decides
 * what the server renders, so the page is going to be fetched again either
 * way, and a plain post works before hydration and with JavaScript off.
 *
 * <p>With two languages this is one button showing the one she is not reading
 * in, which is the whole interaction — no menu to open, no state to explain.
 * A third language would make it two buttons, which is the point at which this
 * should become a menu instead.
 *
 * <p>It posts the page she is on, so switching leaves her exactly where she
 * was, on the same month and the same topic.
 */
export function LanguageSwitcher({
  current,
  className,
}: {
  current: Language
  className?: string
}) {
  const pathname = usePathname()
  const search = useSearchParams().toString()
  const next = search ? `${pathname}?${search}` : pathname

  const others = LANGUAGES.filter((language) => language.code !== current)

  return (
    <form action={LANGUAGE_PATH} method="post" className={cn("flex items-center", className)}>
      <input type="hidden" name="next" value={next} />

      {others.map((language) => (
        <button
          key={language.code}
          type="submit"
          name="language"
          value={language.code}
          // Named in its own script, because someone looking for Tamil is
          // looking for "தமிழ்" and not for the word "Tamil".
          lang={language.code}
          title={`${language.label} · ${language.nativeLabel}`}
          className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium text-muted-foreground transition-colors outline-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <LanguagesIcon className="size-4 shrink-0" />
          <span className="max-w-24 truncate">{language.nativeLabel}</span>
        </button>
      ))}
    </form>
  )
}
