import { cn } from "@/lib/utils"

/**
 * A loading placeholder.
 *
 * <p>A sweep rather than a pulse. A block fading in and out at the same rate
 * as every other block on the page reads as a broken render; a sweep travelling
 * left to right reads as something arriving, and it tells you the whole set is
 * one operation. `shimmer` supplies the gradient and the animation, and `bg-muted`
 * stays underneath as the resting colour — it is what remains visible when the
 * viewer has asked for reduced motion and the sweep is stopped.
 */
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("shimmer rounded-md bg-muted", className)}
      {...props}
    />
  )
}

export { Skeleton }
