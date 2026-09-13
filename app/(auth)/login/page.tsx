import { HeartPulse, KeyRoundIcon } from "lucide-react"

import { EcgLine } from "@/components/global/EcgLine"
import { safeRedirectPath } from "@/lib/auth/cookies"
import { LoginForm } from "./login-form"

export const metadata = {
  title: "Sign in",
  description: "Sign in to follow your pregnancy week by week.",
}

/**
 * One centred card on a tinted ground, the same door the staff console has,
 * so a patient shown the console at the clinic recognises this as the same
 * service.
 *
 * <p>Colour, texture and motion carry the brand: a ground printed with ECG
 * paper, two soft lights breathing behind the card, and the mark beating at
 * the top of it.
 */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>
}) {
  // Where the proxy wanted the patient to land before it bounced them here.
  const { next } = await searchParams

  return (
    <div className="ecg-paper relative h-full overflow-y-auto bg-background">
      {/*
        Decoration only, and marked as such. `fixed` with `overflow-hidden`
        keeps the two lights from widening the page on a phone, and keeps them
        still if the card is tall enough to scroll.
      */}
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="animate-breathe absolute -top-32 -left-24 size-[26rem] rounded-full bg-primary blur-3xl sm:size-[34rem]" />
        {/* Offset so the two lights are never at full strength together. */}
        <div
          className="animate-breathe absolute -right-28 -bottom-36 size-[24rem] rounded-full bg-blush blur-3xl sm:size-[32rem]"
          style={{ animationDelay: "-4.5s" }}
        />
      </div>

      {/*
        `m-auto` on the card rather than `items-center` on the scroller: a
        centred flex child whose content outgrows the box (a phone in
        landscape, or an error pushing the form down) has its top clipped with
        no way to scroll back up to it.
      */}
      <div className="relative flex min-h-full flex-col px-4 py-8 sm:px-6 sm:py-12">
        <div className="animate-rise m-auto w-full max-w-sm">
          <div className="overflow-hidden rounded-2xl bg-card shadow-[0_1px_2px_rgba(0,0,0,0.04),0_16px_48px_-16px_color-mix(in_oklch,var(--primary),transparent_70%)] ring-1 ring-border">
            {/* Unhurried: nothing is loading, so a busy rate would be a lie. */}
            <EcgLine duration={3.4} className="h-12 w-full text-primary/70" />

            <div className="px-6 pb-6 sm:px-8 sm:pb-8">
              <div className="flex flex-col items-center text-center">
                {/* Pulled up over the trace so the mark interrupts the line. */}
                <span className="-mt-9 flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-blush text-primary-foreground shadow-lg ring-4 ring-card">
                  <HeartPulse className="size-6 animate-heartbeat" />
                </span>
                <h1 className="mt-4 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                  Pregnancy Care
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Sign in to follow your pregnancy week by week
                </p>
              </div>

              <LoginForm redirectTo={safeRedirectPath(next) ?? undefined} />
            </div>
          </div>

          {/*
            Patients do not choose their own login; the clinic creates it at
            registration. Saying so up front answers "what do I type here?"
            before it is asked.
          */}
          <p className="mt-6 flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
            <KeyRoundIcon className="size-3.5 shrink-0 text-primary" />
            Your clinic gave you these details when you registered.
          </p>
        </div>
      </div>
    </div>
  )
}
