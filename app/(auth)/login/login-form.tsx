"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  AlertCircleIcon,
  EyeIcon,
  EyeOffIcon,
  LockIcon,
  MailIcon,
  SmartphoneIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { HOME_PATH } from "@/lib/auth/cookies"
import { cn } from "@/lib/utils"

/** Shape of the failure body the login route handler returns. */
type LoginFailure = { message?: string; fieldErrors?: Record<string, string> }

/**
 * How the patient identifies themselves. Both reach the same account: the API
 * matches the login against the email and, on digits alone, the mobile number.
 */
type LoginMethod = "phone" | "email"

const METHODS: { value: LoginMethod; label: string; icon: typeof MailIcon }[] = [
  { value: "phone", label: "Mobile number", icon: SmartphoneIcon },
  { value: "email", label: "Email", icon: MailIcon },
]

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** The message for a login that cannot be right, or null when it might be. */
function validateLogin(method: LoginMethod, value: string): string | null {
  if (method === "phone") {
    const digits = value.replace(/\D/g, "")
    if (!digits) return "Enter your mobile number."
    return digits.length < 10 || digits.length > 15
      ? "Enter your 10-digit mobile number."
      : null
  }

  if (!value.trim()) return "Enter your email address."
  return EMAIL_PATTERN.test(value.trim()) ? null : "Enter a valid email address."
}

export function LoginForm({ redirectTo }: { redirectTo?: string }) {
  const router = useRouter()

  const [method, setMethod] = React.useState<LoginMethod>("phone")
  // One value per method, so switching tabs never leaves an email sitting in
  // the phone box (or the reverse) and switching back restores what was typed.
  const [logins, setLogins] = React.useState<Record<LoginMethod, string>>({
    phone: "",
    email: "",
  })
  const [password, setPassword] = React.useState("")
  const [showPassword, setShowPassword] = React.useState(false)
  const [showHelp, setShowHelp] = React.useState(false)
  const [isSubmitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({})

  const inputRef = React.useRef<HTMLInputElement>(null)
  const login = logins[method]

  function chooseMethod(next: LoginMethod) {
    if (next === method) return
    setMethod(next)
    setError(null)
    setFieldErrors({})
    // The field changed under the patient; put the cursor back in it.
    requestAnimationFrame(() => inputRef.current?.focus())
  }

  function changeLogin(value: string) {
    // A phone field takes what people type into one (digits, spaces, a
    // leading +, dashes, brackets) and nothing else.
    const next = method === "phone" ? value.replace(/[^\d\s()+-]/g, "") : value
    setLogins((current) => ({ ...current, [method]: next }))
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setFieldErrors({})

    // Caught here rather than sent: the API would only answer with the
    // generic "incorrect username or password", which hides the real problem.
    const loginError = validateLogin(method, login)
    const passwordError = password ? null : "Enter your password."
    if (loginError || passwordError) {
      setFieldErrors({
        ...(loginError && { username: loginError }),
        ...(passwordError && { password: passwordError }),
      })
      return
    }

    const username = method === "phone" ? login.replace(/\D/g, "") : login.trim()
    setSubmitting(true)

    try {
      // Posts to our own route handler, not the API: only a server response
      // can set the httpOnly cookie the token lives in.
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      })

      if (!response.ok) {
        const failure = (await response.json().catch(() => null)) as LoginFailure | null
        setFieldErrors(failure?.fieldErrors ?? {})
        setError(failure?.message ?? "Could not sign you in. Please try again.")
        setSubmitting(false)
        return
      }

      // The cookie is set; a refresh makes the proxy and the layout see it.
      // Left submitting, so the button stays disabled until the next page
      // replaces this one rather than flickering back on in between.
      router.replace(redirectTo ?? HOME_PATH)
      router.refresh()
    } catch {
      setError("Could not reach the server. Check your connection and try again.")
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
      {error && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-2xl border border-destructive/30 bg-destructive/8 px-3 py-2.5 text-sm text-destructive"
        >
          <AlertCircleIcon className="mt-0.5 size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div
        role="radiogroup"
        aria-label="Sign in with"
        className="grid grid-cols-2 gap-1 rounded-full bg-muted/70 p-1 ring-1 ring-border"
      >
        {METHODS.map(({ value, label, icon: Icon }) => {
          const selected = value === method
          return (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => chooseMethod(value)}
              className={cn(
                "flex h-9 items-center justify-center gap-1.5 rounded-full text-sm font-medium transition-all focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                selected
                  ? "bg-card text-foreground shadow-sm ring-1 ring-blush/25"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className={cn("size-4", selected && "text-blush")} />
              {label}
            </button>
          )
        })}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="username">{method === "phone" ? "Mobile number" : "Email address"}</Label>
        <div className="relative">
          {method === "phone" ? (
            <SmartphoneIcon className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" />
          ) : (
            <MailIcon className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" />
          )}
          <Input
            ref={inputRef}
            id="username"
            name="username"
            type={method === "phone" ? "tel" : "email"}
            inputMode={method === "phone" ? "tel" : "email"}
            value={login}
            onChange={(event) => changeLogin(event.target.value)}
            placeholder={method === "phone" ? "98765 43210" : "you@example.com"}
            autoComplete={method === "phone" ? "tel" : "email"}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            autoFocus
            required
            className="h-11 rounded-full bg-background/60 pl-10"
            aria-invalid={Boolean(fieldErrors.username)}
            aria-describedby={fieldErrors.username ? "username-error" : undefined}
          />
        </div>
        {fieldErrors.username && (
          <p id="username-error" className="text-xs text-destructive">
            {fieldErrors.username}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <div className="flex items-baseline justify-between">
          <Label htmlFor="password">Password</Label>
          <button
            type="button"
            className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            aria-expanded={showHelp}
            onClick={() => setShowHelp((shown) => !shown)}
          >
            Forgot password?
          </button>
        </div>
        <div className="relative">
          <LockIcon className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="••••••"
            autoComplete="current-password"
            required
            className="h-11 rounded-full bg-background/60 pr-11 pl-10"
            aria-invalid={Boolean(fieldErrors.password)}
            aria-describedby={fieldErrors.password ? "password-error" : undefined}
          />
          <button
            type="button"
            onClick={() => setShowPassword((shown) => !shown)}
            className="absolute top-1/2 right-1.5 flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
          >
            {showPassword ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
          </button>
        </div>
        {fieldErrors.password && (
          <p id="password-error" className="text-xs text-destructive">
            {fieldErrors.password}
          </p>
        )}
        {/*
          Informational, so not in the red error banner: nothing has gone
          wrong. There is no self-service reset because patients never chose
          their password; the clinic set it up and can tell them what it is.
        */}
        {showHelp && (
          <p className="rounded-2xl bg-info-soft px-4 py-2.5 text-xs leading-relaxed text-info">
            Your clinic set up your login when you registered. Ask them and
            they can tell you your password.
          </p>
        )}
      </div>

      {/* A little more air above the primary action than between the fields. */}
      <Button
        type="submit"
        size="lg"
        className="mt-6 h-11 w-full rounded-full bg-gradient-to-r from-blush to-primary text-white shadow-lg shadow-blush/25 hover:opacity-90"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <Spinner />
            Signing in...
          </>
        ) : (
          "Sign in"
        )}
      </Button>
    </form>
  )
}
