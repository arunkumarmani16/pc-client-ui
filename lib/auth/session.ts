import "server-only"

import { cache } from "react"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import type { AxiosRequestConfig } from "axios"

import type { Patient, Session } from "@/interface"
import { ACCESS_TOKEN_COOKIE, LOGIN_PATH, SIGN_OUT_PATH } from "@/lib/auth/cookies"
import { ApiError, getMe } from "@/service"

/** Answers that mean the token no longer speaks for anyone, as opposed to an outage. */
const SIGNED_OUT_STATUSES = new Set([401, 403, 404])

async function readToken(): Promise<string | undefined> {
  return (await cookies()).get(ACCESS_TOKEN_COOKIE)?.value || undefined
}

function bearer(token: string): AxiosRequestConfig {
  return { headers: { Authorization: `Bearer ${token}` } }
}

/**
 * Node has no browser cookie jar, and the API would not recognise this app's
 * cookie by name anyway (see `ACCESS_TOKEN_COOKIE`), so a server component
 * reads the token here and forwards it as a bearer header instead.
 *
 * Returns `null` when there is no token, which callers treat as signed out.
 */
export async function authConfig(): Promise<AxiosRequestConfig | null> {
  const token = await readToken()
  return token ? bearer(token) : null
}

/**
 * The same, for a page the proxy has already gated. Reaching one without a
 * token means the matcher missed it, so this sends the patient back to the
 * form rather than rendering a page that cannot load anything.
 */
export async function requireAuthConfig(): Promise<AxiosRequestConfig> {
  const config = await authConfig()

  if (!config) {
    redirect(LOGIN_PATH)
  }
  return config
}

/**
 * Who is signed in.
 *
 * <p>Read from `GET /portal/me`, which resolves the mother from the token
 * itself. This app used to decode the token's payload to find a patient id and
 * then fetch that record from the console's `GET /patients/{id}` — which only
 * worked because the API let a patient token into the staff endpoints. It no
 * longer does, and none of that is needed: an id the client never handles is
 * an id it cannot get wrong.
 *
 * <p>Still re-read on every request rather than trusted from the token, so a
 * deleted record or a lapsed account takes effect on the next page load
 * instead of whenever the token happens to expire. Wrapped in `cache` so the
 * layout and the page inside it share one lookup per request.
 */
export const requireSession = cache(async (): Promise<Session> => {
  const token = await readToken()
  if (!token) {
    redirect(LOGIN_PATH)
  }

  let patient: Patient
  try {
    patient = await getMe(bearer(token))
  } catch (error) {
    // A rejected token is a signed-out patient, not an outage — and so is a
    // staff token that found its way into this cookie, which the portal now
    // refuses outright. It leaves through the sign-out handler so the dead
    // cookie is gone before the form loads; going straight to the form would
    // only be bounced back here by the proxy.
    if (error instanceof ApiError && SIGNED_OUT_STATUSES.has(error.status)) {
      redirect(SIGN_OUT_PATH)
    }
    throw error
  }

  // The API refuses a login from a month past the due date, but a token issued
  // just before then would otherwise keep working until it expired.
  if (!patient.accountActive) {
    redirect(SIGN_OUT_PATH)
  }

  return { patient }
})
