import type { ContentCategory } from "@/interface"

/**
 * A cartoon for each category, so a piece can be told apart by its picture
 * before a word of it is read.
 *
 * <p>Many of the mothers reading this cannot read comfortably, and a small
 * icon beside a title still asks them to read the title. A picture of a bowl
 * of food or a baby says "this is about eating" or "this is about the baby" on
 * its own.
 *
 * <p>Drawn inline rather than loaded as images: nothing to upload or fetch,
 * sharp at any size, and the main shape takes `currentColor`, so it follows
 * the category colour of whatever it sits in, in light and dark mode alike.
 * Purely decorative to a screen reader — the category name is always written
 * beside it.
 */
export function CategoryArt({
  category,
  className,
}: {
  category: ContentCategory
  className?: string
}) {
  const Art = ART[category] ?? ART.GENERAL

  return (
    <svg viewBox="0 0 160 120" className={className} aria-hidden focusable="false">
      <ellipse cx="80" cy="113" rx="52" ry="5" fill="currentColor" opacity="0.15" />
      <Art />
    </svg>
  )
}

const SKIN = "#E8B48A"
const HAIR = "#3B2A20"
const RED = "#E5484D"
const GREEN = "#46A758"
const YELLOW = "#F5C400"
const PAPER = "#FFFFFF"
const STEEL = "#64748B"

/** A heart centred on (x, y), `size` wide either side. */
function heart(x: number, y: number, size: number): string {
  return `M${x} ${y + size * 0.9} C${x - size * 1.6} ${y - size * 0.1} ${x - size * 0.7} ${y - size * 1.2} ${x} ${y - size * 0.3} C${x + size * 0.7} ${y - size * 1.2} ${x + size * 1.6} ${y - size * 0.1} ${x} ${y + size * 0.9} Z`
}

/** A bowl of fruit and vegetables. */
function Nutrition() {
  return (
    <>
      <polygon points="106,34 122,40 98,92" fill="#F76B15" />
      <path
        d="M113 36 l-5 -12 M116 37 l3 -14 M119 39 l11 -8"
        stroke={GREEN}
        strokeWidth="4"
        strokeLinecap="round"
      />
      <circle cx="52" cy="54" r="16" fill={RED} />
      <path d="M52 38 c0 -6 4 -10 9 -11" stroke="#6B4423" strokeWidth="3" fill="none" strokeLinecap="round" />
      <ellipse cx="61" cy="33" rx="6" ry="3" fill={GREEN} transform="rotate(-30 61 33)" />
      <circle cx="70" cy="68" r="11" fill={GREEN} />
      <circle cx="90" cy="67" r="9" fill={YELLOW} />
      <path d="M36 70 h88 a44 30 0 0 1 -88 0 z" fill="currentColor" />
      <rect x="60" y="97" width="40" height="7" rx="3.5" fill="currentColor" />
      <path d="M48 78 q10 13 28 17" stroke={PAPER} strokeOpacity="0.5" strokeWidth="4" fill="none" strokeLinecap="round" />
    </>
  )
}

/** A pregnant woman stretching, arms raised. */
function Exercise() {
  return (
    <>
      <path d="M40 62 h10 M34 74 h13 M112 58 h12" stroke="currentColor" strokeOpacity="0.45" strokeWidth="3" strokeLinecap="round" />
      <path d="M72 52 L56 22 M88 52 L104 22" stroke={SKIN} strokeWidth="7" strokeLinecap="round" />
      <path d="M72 104 v8 M90 104 v8" stroke={SKIN} strokeWidth="6" strokeLinecap="round" />
      <path
        d="M71 48 H89 C92 58 94 64 96 68 C112 72 112 92 98 96 L100 104 H62 L68 70 C70 60 70 54 71 48 Z"
        fill="currentColor"
      />
      <circle cx="80" cy="36" r="11" fill={SKIN} />
      <path d="M68 36 C68 23 92 23 92 36 C88 30 72 30 68 36 Z" fill={HAIR} />
      <circle cx="76" cy="37.5" r="1.4" fill={HAIR} />
      <circle cx="84" cy="37.5" r="1.4" fill={HAIR} />
      <path d="M76 41.5 q4 3 8 0" stroke={HAIR} strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </>
  )
}

/** A clipboard with a heart on it and a stethoscope beside it. */
function Medical() {
  return (
    <>
      <rect x="46" y="24" width="62" height="80" rx="8" fill="currentColor" />
      <rect x="53" y="34" width="48" height="63" rx="4" fill={PAPER} />
      <rect x="65" y="17" width="24" height="13" rx="4" fill="currentColor" />
      <path d={heart(77, 56, 11)} fill={RED} />
      <path d="M62 80 h30 M62 88 h20" stroke="currentColor" strokeOpacity="0.4" strokeWidth="3" strokeLinecap="round" />
      <path d="M122 26 v30 q0 18 -16 18" stroke={STEEL} strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M116 26 h12" stroke={STEEL} strokeWidth="4" strokeLinecap="round" />
      <circle cx="102" cy="76" r="8" fill="#CBD5E1" stroke={STEEL} strokeWidth="3" />
    </>
  )
}

/** A woman sitting calmly, eyes closed and smiling, with hearts around her. */
function Wellness() {
  return (
    <>
      <path d={heart(38, 40, 7)} fill={RED} opacity="0.75" />
      <path d={heart(124, 30, 9)} fill={RED} />
      <path d={heart(128, 62, 5)} fill={RED} opacity="0.6" />
      <path d="M60 84 C60 60 64 52 70 52 H90 C98 52 108 66 100 84 Z" fill="currentColor" />
      <path d="M70 58 L52 88 M90 58 L108 88" stroke={SKIN} strokeWidth="6" strokeLinecap="round" />
      <ellipse cx="80" cy="94" rx="36" ry="10" fill="currentColor" />
      <circle cx="80" cy="38" r="12" fill={SKIN} />
      <circle cx="80" cy="24" r="5.5" fill={HAIR} />
      <path d="M67 38 C67 22 93 22 93 38 C90 30 70 30 67 38 Z" fill={HAIR} />
      <path d="M73 39.5 q2.5 2 5 0 M82 39.5 q2.5 2 5 0" stroke={HAIR} strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M76 44 q4 3 8 0" stroke={HAIR} strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </>
  )
}

/** A smiling baby's face wrapped in a blanket. */
function Baby() {
  return (
    <>
      <circle cx="36" cy="36" r="3" fill="currentColor" opacity="0.5" />
      <circle cx="126" cy="30" r="4" fill="currentColor" opacity="0.5" />
      <circle cx="132" cy="70" r="2.5" fill="currentColor" opacity="0.5" />
      <circle cx="46" cy="60" r="7" fill={SKIN} />
      <circle cx="114" cy="60" r="7" fill={SKIN} />
      <circle cx="80" cy="60" r="34" fill={SKIN} />
      <path d="M79 27 q-7 -10 4 -13 q-4 6 2 13" stroke={HAIR} strokeWidth="3" fill="none" strokeLinecap="round" />
      <circle cx="68" cy="58" r="3.5" fill={HAIR} />
      <circle cx="92" cy="58" r="3.5" fill={HAIR} />
      <circle cx="60" cy="70" r="5" fill="#F4A3B4" />
      <circle cx="100" cy="70" r="5" fill="#F4A3B4" />
      <path d="M70 73 q10 10 20 0" stroke={HAIR} strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M48 88 Q80 112 112 88 L116 110 H44 Z" fill="currentColor" />
    </>
  )
}

/** A warning sign: a rounded triangle with an exclamation mark. */
function Precautions() {
  return (
    <>
      <path
        d="M80 20 L126 98 H34 Z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="12"
        strokeLinejoin="round"
      />
      <rect x="74.5" y="44" width="11" height="32" rx="5.5" fill={PAPER} />
      <circle cx="80" cy="88" r="6.5" fill={PAPER} />
    </>
  )
}

/** A lit bulb: a good idea, a thing worth knowing. */
function General() {
  return (
    <>
      <path
        d="M80 16 V8 M46 30 L39 25 M114 30 L121 25 M42 54 H33 M118 54 H127"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <circle cx="80" cy="52" r="27" fill={YELLOW} />
      <path d="M69 46 q2 -11 13 -13" stroke={PAPER} strokeOpacity="0.8" strokeWidth="4" fill="none" strokeLinecap="round" />
      <rect x="67" y="76" width="26" height="17" rx="3" fill="#94A3B8" />
      <path d="M68 82 h24 M68 88 h24" stroke={STEEL} strokeWidth="2" />
      <rect x="72" y="94" width="16" height="7" rx="3.5" fill={STEEL} />
    </>
  )
}

const ART: Record<ContentCategory, () => React.JSX.Element> = {
  NUTRITION: Nutrition,
  EXERCISE: Exercise,
  MEDICAL: Medical,
  WELLNESS: Wellness,
  BABY_DEVELOPMENT: Baby,
  PRECAUTIONS: Precautions,
  GENERAL: General,
}
