import type { ContentCategory, ContentType } from "@/interface"
import type { Language } from "@/lib/translation/languages"

/**
 * The portal's own words: "This month", "All weeks", "Nothing published for
 * week 18" and the rest of the app's furniture, in each language it is read in.
 *
 * <p>Two things are translated in this app and they work differently. These
 * words are written by us, so they are translated here by hand. Guidance is
 * written by the clinic in English and translated on the API when staff save a
 * piece, where a clinician reviews it before it is published — so it arrives
 * already translated and nothing here touches it.
 *
 * <p>The `Strings` type is what keeps the languages in step: a string added to
 * English that is missing from Tamil will not compile.
 */

/** "First", "Second", "Third" — the halves the trimester labels are built from. */
const EN_TRIMESTER = ["First", "Second", "Third"] as const
const TA_TRIMESTER = [
  "முதல் மூன்று மாதங்கள்",
  "இரண்டாம் மூன்று மாதங்கள்",
  "மூன்றாம் மூன்று மாதங்கள்",
] as const

/**
 * How far the due date is, as a count and a unit: weeks past a fortnight, days
 * below it. The same thresholds as `PortalPatientResponse.dueDateLabel` on the
 * API, so the wording matches what the label said when it came from there.
 */
function dueDistance(daysUntilDueDate: number): { count: number; unit: "week" | "day" } {
  const absolute = Math.abs(daysUntilDueDate)
  return absolute >= 14
    ? { count: Math.floor(absolute / 7), unit: "week" }
    : { count: absolute, unit: "day" }
}

const enCount = (count: number, unit: string) => `${count} ${unit}${count === 1 ? "" : "s"}`

const TA_UNITS = {
  week: ["வாரம்", "வாரங்கள்"],
  day: ["நாள்", "நாட்கள்"],
} as const

const taCount = (count: number, unit: keyof typeof TA_UNITS) =>
  `${count} ${TA_UNITS[unit][count === 1 ? 0 : 1]}`

/**
 * English is deliberately not `as const`: literal types would make the shape
 * "the exact word Home", which no translation can satisfy.
 */
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
    lockedSuffix: " — locked",
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
    /** Heading over the clips, so the deck below them is plainly not one. */
    watch: "Watch",
    video: "video",
    videos: "videos",
    oneVideo: "1 video",
    suggestion: "Try this",

    /**
     * The API words these itself. Used only when reading in another language,
     * so a topic chip is named the same way on every page rather than however
     * a translation model happened to render it.
     */
    types: {
      VIDEO: "Video",
      ARTICLE: "Article",
      SUGGESTION: "Suggestion",
      TIP: "Tip",
    } satisfies Record<ContentType, string>,
    categories: {
      NUTRITION: "Nutrition",
      EXERCISE: "Exercise",
      MEDICAL: "Medical",
      WELLNESS: "Wellness",
      BABY_DEVELOPMENT: "Baby development",
      PRECAUTIONS: "Precautions",
      GENERAL: "General",
    } satisfies Record<ContentCategory, string>,
    rangeLabel: (month: number, start: number, end: number) =>
      `Month ${month} · ${start === end ? `week ${start}` : `weeks ${start}-${end}`}`,


    /**
     * Under a piece still shown in English on a Tamil page.
     *
     * <p>Worded as waiting rather than as a fault, because that is what it is:
     * the clinic translates a piece and a clinician checks it before it is
     * published, so an untranslated piece is one that has not reached the front
     * of that queue yet.
     */
    notTranslated: "Not yet available in Tamil — shown as your clinic wrote it.",
  },

  home: {
    title: "Home",
    hello: (name: string) => `Hello, ${name}`,
    intro: "Here is where your pregnancy is today.",
    howFarAlong: "How far along",
    progressAria: "Pregnancy progress",
    dueDate: "Due date",
    thisWeek: "This week",
    piecesForYou: (count: number): string =>
      count === 1 ? "piece of guidance for you" : "pieces of guidance for you",
    couldNotLoad: "Guidance could not be loaded",
    forWeek: (week: number) => `For week ${week}`,
    loadFailed:
      "We could not load your guidance just now. Please refresh the page, or try again in a moment.",
    nothingForWeek: (week: number) =>
      `There is nothing published for week ${week} yet. Your clinic adds material as your pregnancy goes on — do have a look at the other weeks in the meantime.`,
  },

  /**
   * How far along she is and when the baby is due, worded from the numbers
   * `/portal/me` returns.
   */
  pregnancy: {
    /** "24 weeks, 3 days". */
    age: (weeks: number, days: number) =>
      days === 0 ? enCount(weeks, "week") : `${enCount(weeks, "week")}, ${enCount(days, "day")}`,
    /** "In 16 weeks", "Today", "2 weeks ago". */
    dueDate: (daysUntilDueDate: number) => {
      if (daysUntilDueDate === 0) return "Today"
      const { count, unit } = dueDistance(daysUntilDueDate)
      return daysUntilDueDate > 0 ? `In ${enCount(count, unit)}` : `${enCount(count, unit)} ago`
    },
  },

  profile: {
    title: "My details",
    intro: "What your clinic has on record for you.",
    thisPregnancy: "This pregnancy",
    howFarAlong: "How far along",
    stage: "Stage",
    dueDate: "Due date",
    lastPeriod: "Last period began",
    history: "Pregnancy history",
    pregnancies: "Pregnancies, including this one",
    births: "Births after 20 weeks",
    losses: "Earlier losses",
    livingChildren: "Living children",
    aboutYou: "About you",
    name: "Name",
    age: "Age",
    years: (count: number) => enCount(count, "year"),
    dateOfBirth: "Date of birth",
    bloodGroup: "Blood group",
    height: "Height",
    weight: "Weight",
    bloodPressure: "Blood pressure",
    contact: "Contact",
    mobile: "Mobile",
    email: "Email",
    address: "Address",
    spouse: "Spouse",
    emergencyContact: "Emergency contact",
    yourLogin: "Your login",
    signInWith: "You sign in with",
    accessUntil: "Access until",
    accessUntilHint: "A month after your due date, to cover your first weeks at home.",
    correction:
      "Something here not right? Tell your clinic at your next visit and they will put it straight — these details can only be changed by them.",
  },

  /** Plain strings only: the layout hands this whole object to a client component. */
  account: {
    menu: "Account",
    signOut: "Sign out",
    signingOut: "Signing out...",
    signOutFailed: "Could not sign out",
    tryAgain: "Please try again.",
  },

  video: {
    preparing: "Still being prepared",
    nearlyReady: "This video is nearly ready. Please check back shortly.",
    unavailable: "This video is unavailable.",
    cannotPlay: "Your browser cannot play this video.",
    fallbackTitle: "Video",
    opensElsewhere: "This video plays on Instagram.",
    watchThere: "Watch on Instagram",
  },

  /**
   * The slideshow. Every one of these is read on a phone, by someone using one
   * thumb, so they are short and say what the control does rather than naming
   * it — "Next page", not "Advance carousel".
   *
   * <p>Templates rather than functions, unlike every other block here, and the
   * reason is the boundary they cross: the deck is a client component, so
   * React has to serialise these to reach it and a function has no serialised
   * form. `fill()` in `lib/utils.ts` puts the numbers in.
   */
  deck: {
    /** Names the whole thing for a screen reader, and labels the tap target. */
    slideshow: "Slideshow",
    pdf: "Handout",
    presentation: "Slides",
    image: "Picture",
    /** "3 of 12" — the one line that is always on screen. */
    pageOf: "{page} of {total}",
    onePage: "1 page",
    pages: "{count} pages",
    previousPage: "Previous page",
    nextPage: "Next page",
    goToPage: "Go to page {page}",
    /** On the inline deck, inviting the larger view. */
    tapToEnlarge: "Tap to enlarge",
    openFullScreen: "Open full screen",
    close: "Close",
    zoomIn: "Zoom in",
    zoomOut: "Zoom out",
    /** While a page's image is still coming down. */
    loading: "Loading page…",
    unavailable: "This page could not be shown.",
  },
}

export type Strings = typeof en

const ta: Strings = {
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
    lockedSuffix: " — பூட்டப்பட்டது",
    allWeeks: "எல்லா வாரங்களும்",
    week: (week) => `வாரம் ${week}`,
    weekAria: (week, count) => `வாரம் ${week}, ${count} பகுதிகள்`,
    allWeeksAria: (count) => `எல்லா வாரங்களும், ${count} பகுதிகள்`,
    weekYouAreIn: " — நீங்கள் இருக்கும் வாரம்",
    pregnancyMonth: "கர்ப்ப மாதம்",
    allTopics: "அனைத்தும்",

    trimester: (trimester) => TA_TRIMESTER[trimester - 1],
    trimesterSpan: (from, to) => `${TA_TRIMESTER[from - 1]} முதல் ${TA_TRIMESTER[to - 1]} வரை`,
    weeksLabel: (start, end) => (start === end ? `வாரம் ${start}` : `வாரங்கள் ${start}–${end}`),

    nothingForMonth: (month) => `மாதம் ${month} க்கு இதுவரை எதுவும் வெளியிடப்படவில்லை.`,
    nothingForWeek: (week) =>
      `வாரம் ${week} க்கு எதுவும் இல்லை — மாதத்தின் மற்ற வாரங்களைப் பாருங்கள்.`,
    nothingInTopicForWeek: (week) => `வாரம் ${week} க்கு இந்தத் தலைப்பில் எதுவும் இல்லை.`,
    nothingInTopicThisMonth: "இந்த மாதம் இந்தத் தலைப்பில் எதுவும் இல்லை.",
  },

  content: {
    allGuidance: "அனைத்து வழிகாட்டுதல்கள்",
    watch: "பாருங்கள்",
    video: "காணொளி",
    videos: "காணொளிகள்",
    oneVideo: "1 காணொளி",
    suggestion: "இதைச் செய்து பாருங்கள்",

    types: {
      VIDEO: "காணொளி",
      ARTICLE: "கட்டுரை",
      SUGGESTION: "பரிந்துரை",
      TIP: "குறிப்பு",
    },
    categories: {
      NUTRITION: "ஊட்டச்சத்து",
      EXERCISE: "உடற்பயிற்சி",
      MEDICAL: "மருத்துவம்",
      WELLNESS: "நலவாழ்வு",
      BABY_DEVELOPMENT: "குழந்தை வளர்ச்சி",
      PRECAUTIONS: "முன்னெச்சரிக்கைகள்",
      GENERAL: "பொதுவானவை",
    },
    rangeLabel: (month, start, end) =>
      `மாதம் ${month} · ${start === end ? `வாரம் ${start}` : `வாரங்கள் ${start}-${end}`}`,


    notTranslated: "இது இன்னும் தமிழில் கிடைக்கவில்லை — உங்கள் மருத்துவமனை எழுதியபடி காட்டப்படுகிறது.",
  },

  home: {
    title: "முகப்பு",
    hello: (name) => `வணக்கம், ${name}`,
    intro: "இன்று உங்கள் கர்ப்பம் எந்த நிலையில் உள்ளது என்பது இங்கே.",
    howFarAlong: "எத்தனை வாரங்கள் ஆகியுள்ளன",
    progressAria: "கர்ப்ப முன்னேற்றம்",
    dueDate: "பிரசவ தேதி",
    thisWeek: "இந்த வாரம்",
    piecesForYou: (count) =>
      count === 1 ? "உங்களுக்கான வழிகாட்டுதல்" : "உங்களுக்கான வழிகாட்டுதல்கள்",
    couldNotLoad: "வழிகாட்டுதல்களை ஏற்ற முடியவில்லை",
    forWeek: (week) => `வாரம் ${week} க்கானவை`,
    loadFailed:
      "இப்போது உங்கள் வழிகாட்டுதல்களை ஏற்ற முடியவில்லை. பக்கத்தைப் புதுப்பிக்கவும், அல்லது சிறிது நேரம் கழித்து மீண்டும் முயற்சிக்கவும்.",
    nothingForWeek: (week) =>
      `வாரம் ${week} க்கு இதுவரை எதுவும் வெளியிடப்படவில்லை. உங்கள் கர்ப்பம் முன்னேறும்போது உங்கள் மருத்துவமனை புதிய தகவல்களைச் சேர்க்கும் — அதுவரை மற்ற வாரங்களைப் பாருங்கள்.`,
  },

  pregnancy: {
    age: (weeks, days) =>
      days === 0 ? taCount(weeks, "week") : `${taCount(weeks, "week")}, ${taCount(days, "day")}`,
    dueDate: (daysUntilDueDate) => {
      if (daysUntilDueDate === 0) return "இன்று"
      const { count, unit } = dueDistance(daysUntilDueDate)
      return daysUntilDueDate > 0
        ? `இன்னும் ${taCount(count, unit)}`
        : `${taCount(count, unit)} முன்பு`
    },
  },

  profile: {
    title: "என் விவரங்கள்",
    intro: "உங்கள் மருத்துவமனையில் உங்களைப் பற்றிப் பதிவு செய்யப்பட்டுள்ள விவரங்கள்.",
    thisPregnancy: "இந்தக் கர்ப்பம்",
    howFarAlong: "எத்தனை வாரங்கள் ஆகியுள்ளன",
    stage: "நிலை",
    dueDate: "பிரசவ தேதி",
    lastPeriod: "கடைசி மாதவிடாய் தொடங்கிய நாள்",
    history: "கர்ப்ப வரலாறு",
    pregnancies: "கர்ப்பங்கள் (இதையும் சேர்த்து)",
    births: "20 வாரங்களுக்குப் பிறகு நடந்த பிரசவங்கள்",
    losses: "முந்தைய கருச்சிதைவுகள்",
    livingChildren: "உயிருடன் உள்ள குழந்தைகள்",
    aboutYou: "உங்களைப் பற்றி",
    name: "பெயர்",
    age: "வயது",
    years: (count) => `${count} வயது`,
    dateOfBirth: "பிறந்த தேதி",
    bloodGroup: "இரத்த வகை",
    height: "உயரம்",
    weight: "எடை",
    bloodPressure: "இரத்த அழுத்தம்",
    contact: "தொடர்பு",
    mobile: "கைபேசி",
    email: "மின்னஞ்சல்",
    address: "முகவரி",
    spouse: "வாழ்க்கைத் துணை",
    emergencyContact: "அவசரத் தொடர்பு",
    yourLogin: "உங்கள் உள்நுழைவு",
    signInWith: "நீங்கள் உள்நுழைவது",
    accessUntil: "அணுகல் முடியும் நாள்",
    accessUntilHint:
      "பிரசவ தேதிக்குப் பிறகு ஒரு மாதம் வரை, வீட்டில் உங்கள் முதல் வாரங்களுக்காக.",
    correction:
      "இங்கே ஏதாவது தவறாக உள்ளதா? அடுத்த முறை மருத்துவமனைக்குச் செல்லும்போது சொல்லுங்கள், அவர்கள் சரி செய்வார்கள் — இந்த விவரங்களை அவர்களால் மட்டுமே மாற்ற முடியும்.",
  },

  account: {
    menu: "கணக்கு",
    signOut: "வெளியேறு",
    signingOut: "வெளியேறுகிறது...",
    signOutFailed: "வெளியேற முடியவில்லை",
    tryAgain: "மீண்டும் முயற்சிக்கவும்.",
  },

  video: {
    preparing: "இன்னும் தயாராகிறது",
    nearlyReady: "இந்தக் காணொளி விரைவில் தயாராகும். சிறிது நேரம் கழித்துப் பாருங்கள்.",
    unavailable: "இந்தக் காணொளி கிடைக்கவில்லை.",
    cannotPlay: "உங்கள் உலாவியில் இந்தக் காணொளியை இயக்க முடியாது.",
    fallbackTitle: "காணொளி",
    opensElsewhere: "இந்தக் காணொளி இன்ஸ்டாகிராமில் இயங்கும்.",
    watchThere: "இன்ஸ்டாகிராமில் பாருங்கள்",
  },

  deck: {
    slideshow: "படத்தொகுப்பு",
    pdf: "கையேடு",
    presentation: "படங்கள்",
    image: "படம்",
    pageOf: "{total} இல் {page}",
    onePage: "1 பக்கம்",
    pages: "{count} பக்கங்கள்",
    previousPage: "முந்தைய பக்கம்",
    nextPage: "அடுத்த பக்கம்",
    goToPage: "பக்கம் {page} க்குச் செல்",
    tapToEnlarge: "பெரிதாக்கத் தொடவும்",
    openFullScreen: "முழுத் திரையில் திற",
    close: "மூடு",
    zoomIn: "பெரிதாக்கு",
    zoomOut: "சிறிதாக்கு",
    loading: "பக்கம் ஏற்றப்படுகிறது…",
    unavailable: "இந்தப் பக்கத்தைக் காட்ட முடியவில்லை.",
  },
}

const STRINGS: Record<Language, Strings> = { en, ta }

/** The words for a language. */
export function stringsFor(language: Language): Strings {
  return STRINGS[language] ?? en
}

/** English, for code that has no reader to ask — the API's own wording is English too. */
export const strings = en
