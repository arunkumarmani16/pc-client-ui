import { NextResponse, type NextRequest } from "next/server"

import { API_BASE_URL, API_PROXY_PATH } from "@/lib/api/config"
import {
  ACCESS_TOKEN_COOKIE,
  HOME_PATH,
  LOGIN_PATH,
  REDIRECT_PARAM,
  safeRedirectPath,
} from "@/lib/auth/cookies"

/**
 * Front door for every page request, and the browser's only route to the API.
 * Runs before any route renders.
 *
 * <p>For pages this only checks that a token is *present*: it is a redirect,
 * not the security boundary. The API verifies the signature on every call, so
 * a forged cookie gets someone as far as a page that immediately fails to load.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  const token = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value

  if (pathname.startsWith(`${API_PROXY_PATH}/`)) {
    return forwardToApi(request, token)
  }

  if (pathname === LOGIN_PATH) {
    // Already signed in: skip the form and go where they were headed.
    if (token) {
      const next = safeRedirectPath(request.nextUrl.searchParams.get(REDIRECT_PARAM))
      return NextResponse.redirect(new URL(next ?? HOME_PATH, request.url))
    }
    return NextResponse.next()
  }

  if (!token) {
    const url = new URL(LOGIN_PATH, request.url)
    // Remember the destination so signing in resumes it.
    if (pathname !== "/") {
      url.searchParams.set(REDIRECT_PARAM, `${pathname}${search}`)
    }
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

/**
 * Hands a browser call on to the API with the token attached.
 *
 * <p>A rewrite rather than a route handler that re-issues the request, so
 * Next proxies the body and the response as they are, and nothing here has to
 * know about ranges, uploads or encodings.
 *
 * <p>A missing token is not an error at this layer. The call goes on without
 * one and the API answers 401 itself, the same failure a server component
 * would see.
 */
function forwardToApi(request: NextRequest, token: string | undefined) {
  const { pathname, search } = request.nextUrl
  const target = new URL(`${API_BASE_URL}${pathname.slice(API_PROXY_PATH.length)}${search}`)

  const headers = new Headers(request.headers)
  // This app's cookies are not the API's business; the token goes as a header.
  headers.delete("cookie")
  // The browser stamps its origin on writes. Passed through, it would make
  // the API treat this server's call as a cross-origin one and refuse it,
  // since this app is not (and need not be) in its CORS allow-list.
  headers.delete("origin")
  if (token) {
    headers.set("authorization", `Bearer ${token}`)
  } else {
    headers.delete("authorization")
  }

  return NextResponse.rewrite(target, { request: { headers } })
}

export const config = {
  /**
   * Everything except Next's own assets, static images and the auth route
   * handlers, since login has to stay reachable while signed out.
   * `/api/backend` is deliberately inside the match: the forwarding happens
   * here.
   */
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
