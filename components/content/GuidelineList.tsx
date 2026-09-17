import { BanIcon, CheckIcon, ThumbsUpIcon, XIcon } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * The "do this" / "avoid this" lists.
 *
 * <p>Colour is not the only thing separating them — a tick and a cross carry
 * the same distinction, so the two lists still read apart in greyscale and for
 * anyone who cannot tell the green from the amber.
 *
 * <p>The signs are drawn large for the same reason the cards lead with a
 * picture: a mother who cannot read the heading should still see a thumbs-up
 * over one list and a no-entry sign over the other, and a filled tick or cross
 * beside every line.
 */
export function GuidelineList({
  kind,
  items,
  heading,
}: {
  kind: "do" | "dont"
  items: string[]
  /** "Do" / "Avoid". */
  heading: string
}) {
  if (items.length === 0) return null

  const isDo = kind === "do"
  const Sign = isDo ? ThumbsUpIcon : BanIcon
  const Mark = isDo ? CheckIcon : XIcon

  return (
    <section
      className={cn(
        "rounded-xl border p-4 sm:p-5",
        isDo ? "border-stable/25 bg-stable-soft/50" : "border-caution/25 bg-caution-soft/50"
      )}
    >
      <h2
        className={cn(
          "flex items-center gap-3 text-base font-semibold",
          isDo ? "text-stable" : "text-caution"
        )}
      >
        <span
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-full",
            isDo ? "bg-stable/15" : "bg-caution/15"
          )}
          aria-hidden
        >
          <Sign className="size-6" />
        </span>
        {heading}
      </h2>

      <ul className="mt-4 space-y-3">
        {items.map((item, index) => (
          <li key={index} className="flex items-start gap-3 text-sm leading-relaxed text-foreground">
            <span
              className={cn(
                "flex size-6 shrink-0 items-center justify-center rounded-full text-white",
                isDo ? "bg-stable" : "bg-caution"
              )}
              aria-hidden
            >
              <Mark className="size-4" strokeWidth={3} />
            </span>
            {/*
              Server-sanitised HTML: RichTextSanitizer runs an allowlist pass
              over each line on the way in, which is what makes rendering it
              here safe. Staff use it for the odd bold word or link.
            */}
            <span
              className="min-w-0 pt-px [&_a]:text-primary [&_a]:underline [&_strong]:font-semibold"
              dangerouslySetInnerHTML={{ __html: item }}
            />
          </li>
        ))}
      </ul>
    </section>
  )
}
