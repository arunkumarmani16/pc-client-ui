import { NextResponse } from "next/server"

import type { Session } from "@/interface"
import { accessTokenCookie } from "@/lib/auth/cookies"
import { ApiError, login } from "@/service"

/**
 * Signs a patient in.
 *
 * <p>The browser posts here rather than straight to the API because the token
 * has to land in an httpOnly cookie, and only a server response can set one.
 * The token itself is never returned to client script.
 */
export async function POST(request: Request) {
  let body: unknown

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ message: "Malformed request." }, { status: 400 })
  }

  const { username, password } = (body ?? {}) as Record<string, unknown>

  if (typeof username !== "string" || !username.trim() || typeof password !== "string" || !password) {
    return NextResponse.json(
      { message: "Enter your mobile number or email, and your password." },
      { status: 400 }
    )
  }

  try {
    const { token, expiresAt, patient } = await login({
      username: username.trim(),
      password,
    })

    const session: Session = { patient }
    const response = NextResponse.json(session)
    response.cookies.set(accessTokenCookie(token, expiresAt))
    return response
  } catch (error) {
    // The API's own 4xx messages are written for the person signing in, so
    // they pass through. Anything else (no connection, a 5xx) would carry
    // hostnames and paths, and becomes one generic line instead.
    if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
      return NextResponse.json(
        { message: error.message, fieldErrors: error.fieldErrors },
        { status: error.status }
      )
    }

    console.error("Login failed", error)
    return NextResponse.json(
      { message: "Could not reach the server. Please try again." },
      { status: 503 }
    )
  }
}
