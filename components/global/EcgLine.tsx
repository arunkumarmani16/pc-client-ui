import { cn } from "@/lib/utils"

/**
 * One resting-rhythm ECG trace, two beats wide, sweeping left to right.
 *
 * <p>Purely decorative — it reports no measurement and is hidden from
 * assistive technology. It exists because it is the one piece of motion that
 * says "clinical" without a label having to: a progress bar could belong to
 * any product, a rhythm strip could not.
 *
 * <p>Drawn as two copies of the same geometry. The lower one sits at a low
 * opacity as the unlit baseline the way a monitor shows the rest of its
 * sweep; the upper one is the dashed segment that travels along it. Splitting
 * them is what stops the line vanishing entirely between passes, which reads
 * as a dropped signal rather than a heartbeat.
 *
 * <p>`pathLength={100}` is load-bearing, not decoration: it renormalises the
 * path's length to 100 units so the dash lengths in the `ecg-trace` utility
 * match it exactly. Editing the `d` below is safe; removing that attribute is
 * not.
 */

/** Two beats — P wave, QRS complex, T wave — across a 240×48 box. */
const RHYTHM =
  "M0 24 H30 L40 18 L48 24 H56 L60 29 L66 6 L72 40 L77 24 H88 L98 16 L110 24 " +
  "H150 L160 18 L168 24 H176 L180 29 L186 6 L192 40 L197 24 H208 L218 16 L230 24 H240"

export function EcgLine({
  className,
  /** Seconds for one full sweep. Lower reads as busier. */
  duration = 2.6,
}: {
  className?: string
  duration?: number
}) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 240 48"
      // `none` rather than the default: the trace is a texture spanning
      // whatever width it is given, so letting it stretch is correct here and
      // preserving its aspect ratio would leave gaps at the ends.
      preserveAspectRatio="none"
      fill="none"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("h-8 w-full text-primary", className)}
      style={{ "--ecg-duration": `${duration}s` } as React.CSSProperties}
    >
      <path d={RHYTHM} stroke="currentColor" className="opacity-15" />
      <path d={RHYTHM} pathLength={100} stroke="currentColor" className="ecg-trace" />
    </svg>
  )
}
