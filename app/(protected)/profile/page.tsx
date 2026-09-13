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
import { formatDate, formatMeasure, orDash, plural } from "@/lib/format"

export const metadata = { title: "My details" }

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

  return (
    <>
      <PageHeader
        title="My details"
        description="What your clinic has on record for you."
      />

      <div className="stagger space-y-4 px-4 py-4 sm:px-6 sm:py-6">
        <Card icon={<BabyIcon className="size-4" />} title="This pregnancy">
          <Row label="How far along" value={pregnancy.ageLabel} />
          <Row label="Stage" value={pregnancy.trimesterLabel} />
          <Row
            label="Due date"
            value={formatDate(patient.eddDate)}
            hint={pregnancy.dueDateLabel}
          />
          <Row label="Last period began" value={formatDate(patient.lmpDate)} />
        </Card>

        <Card icon={<HeartPulseIcon className="size-4" />} title="Pregnancy history">
          <Row
            label="Pregnancies, including this one"
            value={String(patient.gravida)}
          />
          <Row label="Births after 20 weeks" value={String(patient.para)} />
          <Row label="Earlier losses" value={String(patient.abortions)} />
          <Row label="Living children" value={String(patient.livingChildren)} />
        </Card>

        <Card icon={<UserRoundIcon className="size-4" />} title="About you">
          <Row label="Name" value={patient.fullName} />
          <Row
            label="Age"
            value={patient.age != null ? plural(patient.age, "year") : "—"}
          />
          <Row label="Date of birth" value={formatDate(patient.dateOfBirth)} />
          <Row label="Blood group" value={orDash(patient.bloodGroup)} />
          <Row label="Height" value={formatMeasure(patient.heightCm, "cm")} />
          <Row label="Weight" value={formatMeasure(patient.weightKg, "kg")} />
          <Row label="Blood pressure" value={orDash(patient.bloodPressure)} />
        </Card>

        <Card icon={<PhoneIcon className="size-4" />} title="Contact">
          <Row label="Mobile" value={patient.mobileNumber} />
          <Row label="Email" value={orDash(patient.email)} />
          <Row label="Address" value={orDash(patient.address)} />
          <Row label="Spouse" value={orDash(patient.spouseName)} />
          <Row label="Emergency contact" value={orDash(patient.emergencyContact)} />
        </Card>

        <Card icon={<ShieldCheckIcon className="size-4" />} title="Your login">
          <Row label="You sign in with" value={patient.username} />
          <Row
            label="Access until"
            value={formatDate(patient.accountActiveUntil)}
            hint="A month after your due date, to cover your first weeks at home."
          />
        </Card>

        <p className="flex items-start gap-2 px-1 text-xs leading-relaxed text-muted-foreground">
          <CalendarDaysIcon className="mt-0.5 size-3.5 shrink-0 text-primary" />
          Something here not right? Tell your clinic at your next visit and they
          will put it straight — these details can only be changed by them.
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
