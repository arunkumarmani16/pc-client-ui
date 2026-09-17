import type { Metadata } from "next"
import {
  BabyIcon,
  CalendarDaysIcon,
  HeartPulseIcon,
  PhoneIcon,
  ShieldCheckIcon,
  UserRoundIcon,
} from "lucide-react"

import { PageHeader } from "@/components/global/PageHeader"
import { requireSession } from "@/lib/auth/session"
import { formatDate, formatMeasure, orDash } from "@/lib/format"
import { strings } from "@/lib/strings"

export async function generateMetadata(): Promise<Metadata> {
  return { title: strings.profile.title }
}

/**
 * What the clinic has on record, in the words a mother would use for it.
 *
 * <p>Read-only by design: the register is the clinic's, and a correction has to
 * go through the person who can also check it. The page says so rather than
 * leaving her looking for an edit button.
 *
 * <p>Obstetric shorthand is spelled out — "Pregnancies, including this one"
 * rather than "Gravida 2" — and the clinical risk notes staff keep on the
 * record are not sent to this app at all: read without a clinician beside her
 * they alarm more than they inform.
 */
export default async function ProfilePage() {
  const { patient } = await requireSession()
  const { pregnancy } = patient

  const all = strings
  const copy = all.profile

  return (
    <>
      <PageHeader title={copy.title} description={copy.intro} />

      <div className="stagger space-y-4 px-4 py-4 sm:px-6 sm:py-6">
        <Card icon={<BabyIcon className="size-4" />} title={copy.thisPregnancy}>
          <Row
            label={copy.howFarAlong}
            value={all.pregnancy.age(pregnancy.weeks, pregnancy.days)}
          />
          <Row label={copy.stage} value={all.guidance.trimester(pregnancy.trimester)} />
          <Row
            label={copy.dueDate}
            value={formatDate(patient.eddDate)}
            hint={all.pregnancy.dueDate(pregnancy.daysUntilDueDate)}
          />
          <Row label={copy.lastPeriod} value={formatDate(patient.lmpDate)} />
        </Card>

        <Card icon={<HeartPulseIcon className="size-4" />} title={copy.history}>
          <Row label={copy.pregnancies} value={String(patient.gravida)} />
          <Row label={copy.births} value={String(patient.para)} />
          <Row label={copy.losses} value={String(patient.abortions)} />
          <Row label={copy.livingChildren} value={String(patient.livingChildren)} />
        </Card>

        <Card icon={<UserRoundIcon className="size-4" />} title={copy.aboutYou}>
          <Row label={copy.name} value={patient.fullName} />
          <Row
            label={copy.age}
            value={patient.age != null ? copy.years(patient.age) : "—"}
          />
          <Row label={copy.dateOfBirth} value={formatDate(patient.dateOfBirth)} />
          <Row label={copy.bloodGroup} value={orDash(patient.bloodGroup)} />
          <Row label={copy.height} value={formatMeasure(patient.heightCm, "cm")} />
          <Row label={copy.weight} value={formatMeasure(patient.weightKg, "kg")} />
          <Row label={copy.bloodPressure} value={orDash(patient.bloodPressure)} />
        </Card>

        <Card icon={<PhoneIcon className="size-4" />} title={copy.contact}>
          <Row label={copy.mobile} value={patient.mobileNumber} />
          <Row label={copy.email} value={orDash(patient.email)} />
          <Row label={copy.address} value={orDash(patient.address)} />
          <Row label={copy.spouse} value={orDash(patient.spouseName)} />
          <Row label={copy.emergencyContact} value={orDash(patient.emergencyContact)} />
        </Card>

        <Card icon={<ShieldCheckIcon className="size-4" />} title={copy.yourLogin}>
          <Row label={copy.signInWith} value={patient.username} />
          <Row
            label={copy.accessUntil}
            value={formatDate(patient.accountActiveUntil)}
            hint={copy.accessUntilHint}
          />
        </Card>

        <p className="flex items-start gap-2 px-1 text-xs leading-relaxed text-muted-foreground">
          <CalendarDaysIcon className="mt-0.5 size-3.5 shrink-0 text-primary" />
          {copy.correction}
        </p>
      </div>
    </>
  )
}

function Card({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="overflow-hidden rounded-xl border bg-card">
      <h2 className="flex items-center gap-2 border-b px-4 py-3 text-sm font-semibold text-foreground">
        <span className="text-primary">{icon}</span>
        {title}
      </h2>
      <dl className="divide-y">{children}</dl>
    </section>
  )
}

/**
 * One label and value.
 *
 * <p>Stacked on a phone and paired on a wider screen: a long address beside a
 * long label on a narrow column leaves both squeezed into a few characters
 * each.
 */
function Row({
  label,
  value,
  hint,
}: {
  label: string
  value: string
  hint?: string
}) {
  return (
    <div className="flex flex-col gap-0.5 px-4 py-3 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
      <dt className="shrink-0 text-sm text-muted-foreground">{label}</dt>
      <dd className="min-w-0 sm:text-right">
        <span className="text-sm font-medium break-words text-foreground">{value}</span>
        {hint && <span className="block text-xs text-muted-foreground">{hint}</span>}
      </dd>
    </div>
  )
}
