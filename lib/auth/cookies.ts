/**
 * Cookie and route contract shared by the login and logout route handlers,
 * the proxy and the login page. Kept free of `next/headers` so the proxy,
 * which runs before any route renders, can import it too.
 */

/**
 * The httpOnly cookie the patient's token lives in.
 *
 * <p>Deliberately not `access_token`, the name the staff console (pc-ui) uses.
 * Cookies are scoped by host, not by port, so with both apps on localhost they
 * would share one cookie: signing a patient in here would sign a member of
 * staff out of the console, and hand the console a token it cannot use.
 *
 * <p>The API never reads this cookie itself. The proxy and the server-side
 * session read it and forward the token as an `Authorization` header, which
 * the API accepts in place of its own cookie.
 */
export const ACCESS_TOKEN_COOKIE = "patient_access_token"

/** Where an unauthenticated visitor is sent. */
export const LOGIN_PATH = "/login"

/** Where a signed-in patient lands. */
export const HOME_PATH = "/home"

/** This week's guidance, and the week-by-week reader. */
export const GUIDANCE_PATH = "/guidance"

/** Her own registration details. */
export const PROFILE_PATH = "/profile"

/** Query parameter carrying the page the patient was trying to reach. */
export const REDIRECT_PARAM = "next"

/**
 * Route handler that drops the cookie and then lands on the form.
 *
 * <p>A session the API rejects has to leave through here rather than
 * redirecting straight to {@link LOGIN_PATH}: the proxy sends anyone holding a
 * cookie back off the login page, so a stale token would bounce between the
 * two until the browser gave up.
 */
export const SIGN_OUT_PATH = "/api/auth/logout"

/**
 * The redirect target if it is a page of ours, `null` otherwise.
 *
 * <p>Everything that honours {@link REDIRECT_PARAM} goes through this.
 * "//evil.com" and "/\evil.com" both start with a slash but browsers read them
 * as another site, and following either would make the login page an open
 * redirect.
 */
export function safeRedirectPath(next: unknown): string | null {
  if (typeof next !== "string" || !next.startsWith("/")) return null
  if (next.startsWith("//") || next.startsWith("/\\")) return null
  return next
}

/**
 * httpOnly so a cross-site script cannot read the token; SameSite=lax so it
 * still rides along on top-level navigations. Secure only in production, since
 * dev runs over plain http.
 */
export function accessTokenCookie(token: string, expiresAt: string) {
  return {
    name: ACCESS_TOKEN_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(expiresAt),
  }
}

