import type { Patient } from "./patient.interface"

/** Credentials posted to the sign-in form. Mirrors `PortalLoginRequest`. */
export interface PortalLoginRequest {
  /** The email given at registration, or the mobile number when there was none. */
  username: string
  password: string
}

/** What `POST /portal/login` returns. Mirrors `PortalLoginResponse`. */
export interface PortalLoginResponse {
  token: string
  /** ISO-8601 instant the token stops being accepted. */
  expiresAt: string
  patient: Patient
}

/** The signed-in patient, as the UI carries them around. */
export interface Session {
  patient: Patient
}
