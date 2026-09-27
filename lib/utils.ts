import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Fills `{name}` placeholders in a template string.
 *
 * <p>Most of this app's wording is a function in `lib/strings.ts`, which is
 * the nicer shape — it is type-checked and cannot be called with the wrong
 * arguments. But a function cannot be handed to a client component: React has
 * to serialise everything that crosses that boundary, and a closure has no
 * serialised form. So the few strings a client component reads are templates
 * instead, and this is what turns them back into sentences.
 *
 * <p>An unknown placeholder is left as it stands rather than blanked. A stray
 * `{count}` in the middle of a sentence is a bug someone will notice and fix;
 * a silently empty gap reads as a translation that was simply written badly.
 */
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (placeholder, name: string) =>
    name in values ? String(values[name]) : placeholder
  )
}
