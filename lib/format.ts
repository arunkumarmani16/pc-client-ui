/**
 * Fixed locale and time zone so the server and the client render the same
 * string; anything locale-dependent would trip a hydration mismatch. The same
 * format as the staff console, so a date reads identically in both.
 */
const DATE_FORMAT = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
})

export function formatDate(value?: string | null): string {
  return value ? DATE_FORMAT.format(new Date(value)) : "—"
}

/** "1 week", "3 weeks". */
export function plural(count: number, unit: string): string {
  return `${count} ${unit}${count === 1 ? "" : "s"}`
}

/**
 * A clip's running time as a player shows it: "4:32", or "1:02:40" once it
 * runs past an hour. Null while the provider has not measured it yet, which
 * the caller renders as nothing rather than as "0:00".
 */
export function formatDuration(seconds?: number | null): string | null {
  if (seconds == null || !Number.isFinite(seconds) || seconds < 0) return null

  const whole = Math.round(seconds)
  const hours = Math.floor(whole / 3600)
  const minutes = Math.floor((whole % 3600) / 60)
  const secs = whole % 60

  const pad = (value: number) => value.toString().padStart(2, "0")
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(secs)}` : `${minutes}:${pad(secs)}`
}

/** A measurement with its unit, or an em dash when it was never recorded. */
export function formatMeasure(value?: number | string | null, unit = ""): string {
  if (value == null || value === "") return "—"
  return unit ? `${value} ${unit}` : String(value)
}

/** Any blank-ish value as an em dash, so a detail row never renders empty. */
export function orDash(value?: string | null): string {
  return value && value.trim() ? value : "—"
}
