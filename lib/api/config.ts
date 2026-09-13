/**
 * Where the API lives, and how each side of the app reaches it.
 *
 * <p>Kept free of axios and `next/headers` so the proxy, which runs before
 * any route renders, can import it as well as the service layer.
 */

/**
 * Base URL of the Spring Boot API, including its `/api` context path.
 *
 * <p>Server-only: no `NEXT_PUBLIC_` prefix, because nothing in the browser
 * calls the API by this address. See {@link API_PROXY_PATH}.
 */
export const API_BASE_URL = process.env.API_BASE_URL ?? "http://localhost:8080/api"

/**
 * Same-origin prefix the browser reaches the API through.
 *
 * <p>The proxy rewrites `/api/backend/<path>` to `<API_BASE_URL>/<path>` and
 * attaches the patient's token as a bearer header on the way. The token stays
 * in an httpOnly cookie client script cannot read, and the API needs no CORS
 * entry for this app's origin.
 */
export const API_PROXY_PATH = "/api/backend"

/**
 * A media URL the browser can actually fetch.
 *
 * <p>The API returns two kinds. A video on a provider's CDN comes back
 * absolute and is used as it is. One this API streams itself comes back as a
 * path relative to the API root (`/portal/content/.../stream`), which means
 * nothing to a browser pointed at this app — it goes through the proxy
 * instead, which attaches the token.
 *
 * <p>Always the proxy path, never {@link API_BASE_URL}, even when this runs on
 * the server: the URL is rendered into an attribute the *browser* fetches, and
 * the browser has neither the API's address nor a token to send it.
 */
export function mediaUrl(url: string | null | undefined): string | null {
  if (!url) return null
  return url.startsWith("/") ? `${API_PROXY_PATH}${url}` : url
}
