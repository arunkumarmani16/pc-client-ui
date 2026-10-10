import { BabyIcon, KeyRoundIcon } from "lucide-react"

import { safeRedirectPath } from "@/lib/auth/cookies"
import { LoginForm } from "./login-form"

export const metadata = {
  title: "Sign in",
  description: "Sign in to follow your pregnancy week by week.",
}

/** Nine moons, one per month, each a little fuller than the last. */
const MONTHS = [0.375, 0.45, 0.525, 0.6, 0.675, 0.75, 0.825, 0.9, 1]

/**
 * One centred card on a soft, warm ground.
 *
 * <p>Deliberately not the staff console's door. That one is clinical on
 * purpose: ECG paper, a monitor strip, a beating mark, square controls. A
 * patient is not at work and is not reading a monitor, so this one trades
 * the trace for growth: a blush-led ground, a nesting mark that breathes
 * rather than beats, nine months filling out under the title, and rounded,
 * pill-shaped controls. Someone who uses both should never wonder which one
 * they are on.
 */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>
}) {
  // Where the proxy wanted the patient to land before it bounced them here.
  const { next } = await searchParams

  return (
    <div className="glass-ambient relative h-full overflow-y-auto">
      {/*
        Decoration only. Blush leads here, where the console leads with teal,
        and the lights sit high and wide rather than in opposite corners.
        `fixed` with `overflow-hidden` keeps them from widening the page on a
        phone, and keeps them still if the card scrolls.
      */}
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="animate-breathe absolute -top-40 left-1/2 size-[30rem] -translate-x-1/2 rounded-full bg-blush blur-3xl sm:size-[40rem]" />
        <div
          className="animate-breathe absolute -bottom-40 -left-32 size-[22rem] rounded-full bg-caution blur-3xl sm:size-[28rem]"
          style={{ animationDelay: "-3s" }}
        />
        <div
          className="animate-breathe absolute -right-32 bottom-10 size-[20rem] rounded-full bg-primary blur-3xl sm:size-[26rem]"
          style={{ animationDelay: "-6s" }}
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
          <div className="glass-strong rounded-[2rem] px-6 pt-8 pb-6 sm:px-8 sm:pb-8">
            <div className="flex flex-col items-center text-center">
              {/*
                Rings nested around the mark, the way the console's mark sits
                on a trace: same family, different metaphor.
              */}
              <span aria-hidden className="relative flex size-20 items-center justify-center">
                <span className="animate-breathe absolute inset-0 rounded-full bg-blush" />
                <span className="absolute inset-2 rounded-full bg-blush-soft ring-1 ring-blush/20" />
                <span className="relative flex size-12 items-center justify-center rounded-full bg-gradient-to-br from-blush to-caution text-white shadow-lg shadow-blush/30">
                  <BabyIcon className="size-6" />
                </span>
              </span>

              <h1 className="mt-4 text-2xl font-semibold tracking-tight text-foreground">
                Welcome back
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Sign in to follow your pregnancy week by week
              </p>

              {/* Nine months, rising into place one after another. */}
              <div aria-hidden className="stagger mt-5 flex items-end gap-1.5">
                {MONTHS.map((scale, index) => (
                  <span
                    key={index}
                    className="block rounded-full bg-gradient-to-t from-blush to-blush/40"
                    style={{ width: `${scale * 0.875}rem`, height: `${scale * 0.875}rem` }}
                  />
                ))}
              </div>
            </div>

            <LoginForm redirectTo={safeRedirectPath(next) ?? undefined} />
          </div>

          {/*
            Patients do not choose their own login; the clinic creates it at
            registration. Saying so up front answers "what do I type here?"
            before it is asked.
          */}
          <p className="mt-6 flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
            <KeyRoundIcon className="size-3.5 shrink-0 text-blush" />
            Your clinic gave you these details when you registered.
          </p>
        </div>
      </div>
    </div>
  )
}
