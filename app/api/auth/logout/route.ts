import { NextResponse } from "next/server"

import {
  ACCESS_TOKEN_COOKIE,
  LOGIN_PATH,
  REDIRECT_PARAM,
  safeRedirectPath,
} from "@/lib/auth/cookies"

/**
 * Signs the patient out. The API is stateless, so there is nothing to revoke:
 * dropping the cookie is the whole of it, and the token expires on its own.
 */
export async function POST() {
  const response = NextResponse.json({ ok: true })
  response.cookies.delete(ACCESS_TOKEN_COOKIE)
  return response
}

/**
 * The same, as a navigation. A server component that finds the token rejected
 * cannot clear the cookie itself (only a response can), so it redirects here
 * and this hands the patient on to the form without one.
 */
export async function GET(request: Request) {
  const next = safeRedirectPath(new URL(request.url).searchParams.get(REDIRECT_PARAM))
  const target = new URL(LOGIN_PATH, request.url)

  if (next) {
    target.searchParams.set(REDIRECT_PARAM, next)
  }

  const response = NextResponse.redirect(target)
  response.cookies.delete(ACCESS_TOKEN_COOKIE)
  return response
}
