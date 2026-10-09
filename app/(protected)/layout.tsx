import { AppHeader } from "@/components/global/AppHeader"
import { AppTabBar } from "@/components/global/AppNav"
import { LoadingLabelProvider } from "@/components/global/RouteLoading"
import { requireSession } from "@/lib/auth/session"
import { stringsFor } from "@/lib/strings"
import { currentLanguage } from "@/lib/translation/current"

/**
 * The shell around every signed-in page.
 *
 * <p>The session is resolved per request, so a deleted record or a lapsed
 * account cannot keep rendering pages. `requireSession` is cached for the
 * request, so a page inside this layout that also needs the patient calls it
 * again without a second API round trip.
 *
 * <p>Header and tab bar float over the scrolling `<main>` rather than beside
 * it, so the page moves underneath their glass and shows through it. `<main>`
 * still runs the full height and pads itself clear of both, so no page has to
 * reserve room for them: the padding scrolls with the content, which is what
 * lets the first card start below the header and the last one finish above
 * the tab bar, yet pass under either on the way.
 *
 * <p>The ambient ground is on this box rather than on `<main>` because this
 * box does not scroll, so the coloured lights stay where they are while the
 * glass slides over them.
 */
export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { patient } = await requireSession()

  // Resolved once for the shell, so the tab bar and the header cannot end up
  // in different languages.
  const language = await currentLanguage()
  const words = stringsFor(language)
  const copy = words.nav

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
    <div className="glass-ambient relative h-dvh overflow-hidden" lang={language}>
      <AppHeader
        patient={patient}
        navLabels={navLabels}
        // All plain strings already, so this one can cross as it is.
        accountLabels={words.account}
        language={language}
        languageLabel={copy.language}
        weekLabel={copy.weekBadge(patient.pregnancy.currentWeek)}
        // All plain strings, like the account labels.
        notificationLabels={words.notifications}
      />
      {/* `pt-14` is the header; the phone's bottom padding is the floating
          tab bar (3.75rem tall, 0.75rem off the edge) plus a little air, on
          top of the home indicator. */}
      <main className="h-full overflow-x-hidden overflow-y-auto overscroll-contain pt-14 pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] sm:pb-0">
        {/* Gives the page loader its word in her language. */}
        <LoadingLabelProvider label={copy.loading}>{children}</LoadingLabelProvider>
      </main>
      <AppTabBar labels={navLabels} />
    </div>
  )
}
