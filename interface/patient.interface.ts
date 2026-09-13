/**
 * Where the pregnancy is today. Mirrors `PortalPatientResponse.Pregnancy`.
 *
 * <p>The labels are built by the API rather than here so the portal and the
 * staff console cannot end up describing the same week in two different ways.
 */
export interface Pregnancy {
  weeks: number
  days: number
  /** Calendar-month approximation ("about 6 months along"). */
  months: number
  trimester: 1 | 2 | 3
  /** Negative once the due date has passed. */
  daysUntilDueDate: number
  /** The week the feed is built for: `weeks`, floored at 1. */
  currentWeek: number
  /** 0-100, for the progress bar. Caps at 100 for an overdue mother. */
  progressPercent: number
  /** "Second trimester". */
  trimesterLabel: string
  /** "24 weeks, 3 days". */
  ageLabel: string
  /** "In 16 weeks", "Today", "2 weeks ago". */
  dueDateLabel: string
}

/**
 * The signed-in mother's own record, as `POST /portal/login` and
 * `GET /portal/me` return it. Mirrors `PortalPatientResponse`.
 *
 * <p>Narrower than the console's `PatientResponse`: the portal is not sent
 * `riskNotes` (clinical shorthand written by staff for staff), who registered
 * the record, or its deletion flag.
 */
export interface Patient {
  patientId: string
  fullName: string
  /** Just the first word of the name, for "Hello, Priya". */
  firstName: string
  age?: number | null
  dateOfBirth?: string | null
  mobileNumber: string
  /** The login itself: her email, or her mobile number when she gave none. */
  username: string
  email?: string | null
  address?: string | null
  bloodGroup?: string | null
  spouseName?: string | null
  emergencyContact?: string | null

  /** Total pregnancies, this one included. */
  gravida: number
  /** Deliveries past 20 weeks. */
  para: number
  abortions: number
  livingChildren: number

  /** Last menstrual period, the anchor every gestational figure is derived from. */
  lmpDate: string
  /** Estimated due date: Naegele's rule unless sonography-corrected. */
  eddDate: string
  heightCm?: number | null
  weightKg?: number | null
  bloodPressure?: string | null

  /** Whether the login currently works, as of now. */
  accountActive: boolean
  /** One month past the due date; the login stops working after this. */
  accountActiveUntil: string

  pregnancy: Pregnancy
}
