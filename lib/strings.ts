/**
 * The portal's own words: "This month", "All weeks", "Nothing published for
 * week 18" and the rest of the app's furniture. Guidance itself is authored by
 * the clinic and arrives from the API as written.
 */

/** "First", "Second", "Third" — the halves the trimester labels are built from. */
const EN_TRIMESTER = ["First", "Second", "Third"] as const

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

export const strings = {
  nav: {
    home: "Home",
    guidance: "Guidance",
    profile: "My details",
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
    video: "video",
    videos: "videos",
    oneVideo: "1 video",
    dos: (count: number) => `${count} ${count === 1 ? "do" : "dos"}`,
    toAvoid: (count: number) => `${count} to avoid`,
    doThis: "Do",
    avoidThis: "Avoid",
    suggestion: "Try this",
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
  },
}
