import type { AxiosRequestConfig } from "axios"

import { httpClient } from "./http-client"

import type { PortalLoginRequest, PortalLoginResponse } from "@/interface"

const RESOURCE = "/portal"

/**
 * Exchanges a mother's credentials for a portal token. The only call that
 * works without one.
 *
 * <p>The token it returns is signed with the portal's own key and is not
 * accepted by any staff endpoint, so it cannot be replayed against the
 * console's API even if it leaks.
 *
 * <p>Called from the login route handler rather than the browser, because the
 * token has to land in an httpOnly cookie that client script cannot read.
 */
export async function login(
  input: PortalLoginRequest,
  config?: AxiosRequestConfig
): Promise<PortalLoginResponse> {
  const { data } = await httpClient.post<PortalLoginResponse>(
    `${RESOURCE}/login`,
    input,
    config
  )
  return data
}

/**
 * Puts the sign-out on the console's access trail. The API is stateless, so
 * this ends nothing by itself; it needs the token, so it has to be called
 * before the cookie is dropped.
 */
export async function logout(config?: AxiosRequestConfig): Promise<void> {
  await httpClient.post<void>(`${RESOURCE}/logout`, undefined, config)
}
