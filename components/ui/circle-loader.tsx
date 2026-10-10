import { HeartPulse } from "lucide-react"

import { cn } from "@/lib/utils"

const SIZES = {
  sm: "size-4",
  md: "size-8",
  lg: "size-16",
} as const

/**
 * The app's loading sign: a ring whose arc stretches and chases itself round.
 *
 * <p>Plain, it draws in `currentColor`, so it takes the colour of the text
 * around it (a button's label, a toast's icon slot). `brand` is for the big
 * waits: a teal arc with a slower blush ring turning the other way inside it,
 * around the beating heart from the login card.
 *
 * <p>Drawn rather than taken from the icon set so the arc can animate its
 * length as well as its angle; `pathLength={100}` is what lets the `hc-arc`
 * keyframes dash it without measuring the circle.
 */
export function CircleLoader({
  size = "sm",
  brand = false,
  className,
  ...props
}: React.ComponentProps<"span"> & { size?: keyof typeof SIZES; brand?: boolean }) {
  return (
    <span
      data-slot="circle-loader"
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center",
        SIZES[size],
        className
      )}
      {...props}
    >
      <svg viewBox="0 0 24 24" fill="none" className="absolute inset-0 size-full animate-orbit">
        <circle
          cx="12"
          cy="12"
          r="10"
          strokeWidth={brand ? 1.5 : 3}
          className={brand ? "stroke-primary/12" : "stroke-current opacity-20"}
        />
        <circle
          cx="12"
          cy="12"
          r="10"
          pathLength={100}
          strokeWidth={brand ? 1.5 : 3}
          strokeLinecap="round"
          className={cn("animate-arc", brand ? "stroke-primary" : "stroke-current")}
        />
      </svg>

      {brand && (
        <>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="absolute inset-[18%] size-[64%] animate-orbit-reverse"
          >
            <circle
              cx="12"
              cy="12"
              r="10"
              pathLength={100}
              strokeWidth={2}
              strokeLinecap="round"
              strokeDasharray="22 28"
              className="stroke-blush/70"
            />
          </svg>
          <HeartPulse className="relative size-[30%] animate-heartbeat text-primary" />
        </>
      )}
    </span>
  )
}
