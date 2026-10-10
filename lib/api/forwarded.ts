/**
 * Headers that tell the API who is really on the other end of a call a route
 * handler makes on the patient's behalf.
 *
 * <p>Sign-in and sign-out go browser → this server → API, so without these
 * the API would put this server's address and Node's user agent on every row
 * of the staff console's Patient Login History, and every mother would appear
 * to sign in from the same machine.
 */
export function forwardedClientHeaders(request: Request): Record<string, string> {
  const headers: Record<string, string> = {}

  // Behind a host's edge the original address is already in here; locally
  // there is none, and the API falls back to the socket's.
  const forwardedFor = request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip")
  if (forwardedFor) headers["X-Forwarded-For"] = forwardedFor

  const userAgent = request.headers.get("user-agent")
  if (userAgent) headers["User-Agent"] = userAgent

  return headers
}
