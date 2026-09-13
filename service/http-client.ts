import axios, { AxiosError, type AxiosInstance } from "axios"

import type { FormError, ProblemDetail } from "@/interface"
import { API_BASE_URL, API_PROXY_PATH } from "@/lib/api/config"

declare module "axios" {
  export interface AxiosRequestConfig {
    /** Set on a call that should not raise the global loading overlay. */
    skipGlobalLoader?: boolean
  }
}

/** What the overlay registers so requests can drive it. */
type LoadingListener = { start: () => void; stop: () => void }

let loadingListener: LoadingListener | null = null

/**
 * Connects the global loading overlay to this client.
 *
 * <p>Inverted on purpose: this module also runs on the server, where the
 * store (a `use client` module) cannot be called, so the overlay pushes its
 * counter in from the browser instead of being imported here. On the server no
 * listener is ever registered and the hooks below do nothing.
 */
export function setLoadingListener(listener: LoadingListener | null): void {
  loadingListener = listener
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    /** Per-field messages, when the failure was a validation error. */
    readonly fieldErrors?: Record<string, string>
  ) {
    super(message)
    this.name = "ApiError"
  }
}

/**
 * Single axios instance every service shares.
 *
 * <p>Where it points depends on which side is calling. On the server (server
 * components, route handlers) it goes straight to the API, and the caller
 * passes the patient's token as a bearer header; see `lib/auth/session`. In
 * the browser it goes to this app's own `/api/backend`, which the proxy
 * forwards to the API with the token taken from the httpOnly cookie. That is
 * same-origin, so the cookie rides along without `withCredentials` and no CORS
 * is involved.
 */
export const httpClient: AxiosInstance = axios.create({
  baseURL: typeof window === "undefined" ? API_BASE_URL : API_PROXY_PATH,
  headers: { "Content-Type": "application/json" },
  timeout: 15_000,
})

// Registered first so its response handlers run before the error mapping
// below: the count has to come back down whether the call succeeded or threw.
httpClient.interceptors.request.use((config) => {
  if (!config.skipGlobalLoader) {
    loadingListener?.start()
  }
  return config
})

httpClient.interceptors.response.use(
  (response) => {
    if (!response.config?.skipGlobalLoader) {
      loadingListener?.stop()
    }
    return response
  },
  (error: AxiosError) => {
    if (!error.config?.skipGlobalLoader) {
      loadingListener?.stop()
    }
    throw error
  }
)

/**
 * Collapses every axios failure into an ApiError so callers never have to know
 * whether the request died in transit or came back as an RFC 7807 problem.
 */
httpClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ProblemDetail>) => {
    const method = error.config?.method?.toUpperCase() ?? "GET"
    const path = error.config?.url ?? ""

    if (error.response) {
      const problem = error.response.data
      throw new ApiError(
        problem?.detail ?? `${method} ${path} failed with ${error.response.status}`,
        error.response.status,
        problem?.errors
      )
    }

    // No response at all: connection refused, DNS failure, timeout.
    throw new ApiError(error.message || `${method} ${path} failed`, 0)
  }
)

/** Turns a thrown error into something a form can render inline. */
export function toFormError(error: unknown): FormError {
  if (error instanceof ApiError) {
    return { message: error.message, fieldErrors: error.fieldErrors }
  }
  console.error("Request failed", error)
  return { message: "Could not reach the server. Please try again." }
}
