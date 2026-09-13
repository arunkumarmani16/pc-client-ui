import { CheckIcon, XIcon } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * The "do this" / "avoid this" lists.
 *
 * <p>Colour is not the only thing separating them — a tick and a cross carry
 * the same distinction, so the two lists still read apart in greyscale and for
 * anyone who cannot tell the green from the amber.
 */
export function GuidelineList({
  kind,
  items,
  heading,
}: {
  kind: "do" | "dont"
  items: string[]
  /** "Do" / "Avoid", in the language the page is being read in. */
  heading: string
}) {
  if (items.length === 0) return null

  const isDo = kind === "do"
  const Icon = isDo ? CheckIcon : XIcon

  return (
    <section
      className={cn(
        "rounded-xl border p-4 sm:p-5",
        isDo ? "border-stable/25 bg-stable-soft/50" : "border-caution/25 bg-caution-soft/50"
      )}
    >
      <h2
        className={cn(
          "flex items-center gap-2 text-sm font-semibold",
          isDo ? "text-stable" : "text-caution"
        )}
      >
        <span
          className={cn(
            "flex size-5 items-center justify-center rounded-full",
            isDo ? "bg-stable/15" : "bg-caution/15"
          )}
          aria-hidden
        >
          <Icon className="size-3.5" />
        </span>
        {heading}
      </h2>

      <ul className="mt-3 space-y-2.5">
        {items.map((item, index) => (
          <li key={index} className="flex gap-2.5 text-sm leading-relaxed text-foreground">
            <Icon
              className={cn(
                "mt-0.5 size-4 shrink-0",
                isDo ? "text-stable" : "text-caution"
              )}
              aria-hidden
            />
            {/*
              Server-sanitised HTML: RichTextSanitizer runs an allowlist pass
              over each line on the way in, which is what makes rendering it
              here safe. Staff use it for the odd bold word or link.
            */}
            <span
              className="min-w-0 [&_a]:text-primary [&_a]:underline [&_strong]:font-semibold"
              dangerouslySetInnerHTML={{ __html: item }}
            />
          </li>
        ))}
      </ul>
    </section>
  )
}
