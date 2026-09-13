/**
 * The portal's own words, in each language it is read in.
 *
 * <p>Two things are translated in this app and they work differently. A piece
 * of guidance is translated by the clinic and reviewed before anyone sees it,
 * so it arrives from the API already in the right language (see
 * `PortalContentResponse.language`). The app's own furniture — "This month",
 * "All weeks", "Nothing published for week 18" — is translated here, because
 * it is written by us and there is nothing clinical to review.
 *
 * <p>A plain object rather than an i18n library: there are a few dozen strings,
 * the language is fixed for the whole server render, and nothing here needs
 * plural rules, lazy loading or a message compiler. The `Copy` type is what
 * keeps the languages in step — a string added to English that is missing from
 * Tamil will not compile.
 */

export type Language = "en" | "ta"

export const LANGUAGES = [
  { code: "en", label: "English", nativeLabel: "English" },
  { code: "ta", label: "Tamil", nativeLabel: "தமிழ்" },
] as const satisfies readonly { code: Language; label: string; nativeLabel: string }[]

/** The language content came back in, when the API says so; English otherwise. */
export const DEFAULT_LANGUAGE: Language = "en"

export function isLanguage(value: unknown): value is Language {
  return value === "en" || value === "ta"
}

/** "First", "Second", "Third" — the halves the trimester labels are built from. */
const EN_TRIMESTER = ["First", "Second", "Third"] as const
const TA_TRIMESTER = [
  "முதல் மூன்று மாதங்கள்",
  "இரண்டாம் மூன்று மாதங்கள்",
  "மூன்றாம் மூன்று மாதங்கள்",
] as const

const en = {
  nav: {
    home: "Home",
    guidance: "Guidance",
    profile: "My details",
    language: "Language",
    /** The figure in the header, which is the one thing there that is not a place. */
    weekBadge: (week: number) => `Week ${week}`,
  },

  guidance: {
    title: "Guidance",
    thisMonth: "This month",
    month: (month: number) => `Month ${month}`,
    monthAndWeek: (month: number, week: number) => `Month ${month} · week ${week}`,
    monthLabel: "Month",
    youAreHere: (week: number) => `You are here · week ${week}`,
    backToMonth: (month: number) => `Back to month ${month}`,
    previousMonth: "Previous month",
    nextMonth: "Next month",
    monthAria: (month: number, weeks: string) => `Month ${month}, weeks ${weeks}`,
    hereSuffix: " — you are here",
    allWeeks: "All weeks",
    week: (week: number) => `Week ${week}`,
    weekAria: (week: number, count: number) => `Week ${week}, ${count} pieces`,
    allWeeksAria: (count: number) => `All weeks, ${count} pieces`,
    weekYouAreIn: " — the week you are in",
    pregnancyMonth: "Pregnancy month",
    allTopics: "All",

    trimester: (trimester: 1 | 2 | 3) => `${EN_TRIMESTER[trimester - 1]} trimester`,
    /** Month 7 is the one that straddles: "Second into third trimester". */
    trimesterSpan: (from: 1 | 2 | 3, to: 1 | 2 | 3) =>
      `${EN_TRIMESTER[from - 1]} into ${EN_TRIMESTER[to - 1].toLowerCase()} trimester`,
    weeksLabel: (start: number, end: number) =>
      start === end ? `week ${start}` : `weeks ${start}–${end}`,

    nothingForMonth: (month: number) => `There is nothing published for month ${month} yet.`,
    nothingForWeek: (week: number) =>
      `Nothing published for week ${week} — do look at the rest of the month.`,
    nothingInTopicForWeek: (week: number) => `Nothing in this topic for week ${week}.`,
    nothingInTopicThisMonth: "Nothing in this topic this month.",
  },

  content: {
    allGuidance: "All guidance",
    video: "video",
    videos: "videos",
    oneVideo: "1 video",
    dos: (count: number) => `${count} ${count === 1 ? "do" : "dos"}`,
    toAvoid: (count: number) => `${count} to avoid`,
    doThis: "Do",
    avoidThis: "Avoid",
    suggestion: "Try this",
    /** Shown on a piece the clinic has not translated yet. */
    notTranslated: "Not translated yet — shown in English",
  },
}

/**
 * The shape every language has to fill. Taken from English rather than written
 * out, so adding a string in one place is enough to require it everywhere.
 *
 * <p>English is deliberately not `as const`: literal types would make the shape
 * "the exact word Home", which no translation can satisfy.
 */
type Copy = typeof en

const ta: Copy = {
  nav: {
    home: "முகப்பு",
    guidance: "வழிகாட்டுதல்",
    profile: "என் விவரங்கள்",
    language: "மொழி",
    weekBadge: (week) => `வாரம் ${week}`,
  },

  guidance: {
    title: "வழிகாட்டுதல்",
    thisMonth: "இந்த மாதம்",
    month: (month) => `மாதம் ${month}`,
    monthAndWeek: (month, week) => `மாதம் ${month} · வாரம் ${week}`,
    monthLabel: "மாதம்",
    youAreHere: (week) => `நீங்கள் இங்கே · வாரம் ${week}`,
    backToMonth: (month) => `மாதம் ${month} க்குத் திரும்பு`,
    previousMonth: "முந்தைய மாதம்",
    nextMonth: "அடுத்த மாதம்",
    monthAria: (month, weeks) => `மாதம் ${month}, வாரங்கள் ${weeks}`,
    hereSuffix: " — நீங்கள் இங்கே",
    allWeeks: "எல்லா வாரங்களும்",
    week: (week) => `வாரம் ${week}`,
    weekAria: (week, count) => `வாரம் ${week}, ${count} பகுதிகள்`,
    allWeeksAria: (count) => `எல்லா வாரங்களும், ${count} பகுதிகள்`,
    weekYouAreIn: " — நீங்கள் இருக்கும் வாரம்",
    pregnancyMonth: "கர்ப்ப மாதம்",
    allTopics: "அனைத்தும்",

    trimester: (trimester) => TA_TRIMESTER[trimester - 1],
    trimesterSpan: (from, to) => `${TA_TRIMESTER[from - 1]} முதல் ${TA_TRIMESTER[to - 1]} வரை`,
    weeksLabel: (start, end) =>
      start === end ? `வாரம் ${start}` : `வாரங்கள் ${start}–${end}`,

    nothingForMonth: (month) => `மாதம் ${month} க்கு இதுவரை எதுவும் வெளியிடப்படவில்லை.`,
    nothingForWeek: (week) =>
      `வாரம் ${week} க்கு எதுவும் இல்லை — மாதத்தின் மற்ற வாரங்களைப் பாருங்கள்.`,
    nothingInTopicForWeek: (week) => `வாரம் ${week} க்கு இந்தத் தலைப்பில் எதுவும் இல்லை.`,
    nothingInTopicThisMonth: "இந்த மாதம் இந்தத் தலைப்பில் எதுவும் இல்லை.",
  },

  content: {
    allGuidance: "அனைத்து வழிகாட்டுதல்கள்",
    video: "காணொளி",
    videos: "காணொளிகள்",
    oneVideo: "1 காணொளி",
    dos: (count) => `${count} செய்ய வேண்டியவை`,
    toAvoid: (count) => `${count} தவிர்க்க வேண்டியவை`,
    doThis: "செய்யுங்கள்",
    avoidThis: "தவிர்க்கவும்",
    suggestion: "இதைச் செய்து பாருங்கள்",
    notTranslated: "இன்னும் மொழிபெயர்க்கப்படவில்லை — ஆங்கிலத்தில் காட்டப்படுகிறது",
  },
}

const COPY: Record<Language, Copy> = { en, ta }

/** The words for a language. Unknown languages read as English. */
export function copyFor(language: Language | undefined): Copy {
  return COPY[language ?? DEFAULT_LANGUAGE] ?? en
}
