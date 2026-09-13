"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { AlertCircleIcon, EyeIcon, EyeOffIcon, LockIcon, UserIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { HOME_PATH } from "@/lib/auth/cookies"

/** Shape of the failure body the login route handler returns. */
type LoginFailure = { message?: string; fieldErrors?: Record<string, string> }

export function LoginForm({ redirectTo }: { redirectTo?: string }) {
  const router = useRouter()

  const [username, setUsername] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [showPassword, setShowPassword] = React.useState(false)
  const [showHelp, setShowHelp] = React.useState(false)
  const [isSubmitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({})

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setFieldErrors({})
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
          className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/8 px-3 py-2.5 text-sm text-destructive"
        >
          <AlertCircleIcon className="mt-0.5 size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="username">Mobile number or email</Label>
        <div className="relative">
          <UserIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="username"
            name="username"
            type="text"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="9876543210"
            autoComplete="username"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            autoFocus
            required
            className="h-10 pl-8.5"
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
          <LockIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="••••••"
            autoComplete="current-password"
            required
            className="h-10 pr-9 pl-8.5"
            aria-invalid={Boolean(fieldErrors.password)}
            aria-describedby={fieldErrors.password ? "password-error" : undefined}
          />
          <button
            type="button"
            onClick={() => setShowPassword((shown) => !shown)}
            className="absolute top-1/2 right-1 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
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
          <p className="rounded-lg bg-info-soft px-3 py-2 text-xs leading-relaxed text-info">
            Your clinic set up your login when you registered. Ask them and
            they can tell you your password.
          </p>
        )}
      </div>

      {/* A little more air above the primary action than between the fields. */}
      <Button type="submit" size="lg" className="mt-5 h-10 w-full" disabled={isSubmitting}>
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
