import { AppHeader } from "@/components/global/AppHeader"
import { AppTabBar } from "@/components/global/AppNav"
import { requireSession } from "@/lib/auth/session"
import { copyFor } from "@/lib/i18n"
import { currentLanguage } from "@/lib/language"

/**
 * The shell around every signed-in page.
 *
 * <p>The session is resolved per request, so a deleted record or a lapsed
 * account cannot keep rendering pages. `requireSession` is cached for the
 * request, so a page inside this layout that also needs the patient calls it
 * again without a second API round trip.
 *
 * <p>Header and tab bar sit outside the scrolling `<main>`, so both stay put
 * while the page moves under them — and because the tab bar is laid out in the
 * flow rather than fixed over the content, no page has to reserve room for it.
 */
export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { patient } = await requireSession()

  // Resolved once for the shell and handed to both navigations, so the tab bar
  // and the header cannot end up in different languages.
  const language = await currentLanguage()
  const copy = copyFor(language).nav

  // Picked apart into plain strings rather than passed as the `nav` object it
  // comes from. That object holds `weekBadge`, a function, and a function
  // cannot cross into a client component — handing the whole thing over throws
  // at render and takes every page inside this layout down with it.
  const navLabels = {
    home: copy.home,
    guidance: copy.guidance,
    profile: copy.profile,
  }

  return (
    <div className="flex h-dvh flex-col bg-background" lang={language}>
      <AppHeader
        patient={patient}
        language={language}
        navLabels={navLabels}
        weekLabel={copy.weekBadge(patient.pregnancy.currentWeek)}
      />
      <main className="flex-1 overflow-x-hidden overflow-y-auto overscroll-contain">
        {children}
      </main>
      <AppTabBar labels={navLabels} />
    </div>
  )
}
