"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { DownloadIcon, LogOutIcon } from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "@/components/ui/toast"
import type { Patient } from "@/interface"
import { LOGIN_PATH, SIGN_OUT_PATH } from "@/lib/auth/cookies"
import { promptInstall, useInstall } from "@/lib/install"
import { detachPush } from "@/lib/push"

/**
 * The menu's words. Passed in as plain strings
 * for the same reason as `NavLabels`: this is a client component, and the
 * dictionary stays on the server.
 */
export type AccountLabels = {
  menu: string
  signOut: string
  signingOut: string
  signOutFailed: string
  tryAgain: string
  install: string
  installed: string
  installIosTitle: string
  installIos: string
}

function initials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "?"
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : ""))
    .toUpperCase()
}

export function AccountMenu({ patient, labels }: { patient: Patient; labels: AccountLabels }) {
  const router = useRouter()
  const [isSigningOut, setSigningOut] = React.useState(false)
  const install = useInstall()

  async function installApp() {
    if (install.manual) {
      toast.add({ type: "info", title: labels.installIosTitle, description: labels.installIos })
      return
    }
    try {
      if (await promptInstall()) toast.add({ type: "success", title: labels.installed })
    } catch (error) {
      console.error("Install prompt failed", error)
      toast.add({ type: "error", title: labels.install, description: labels.tryAgain })
    }
  }

  async function signOut() {
    setSigningOut(true)
    try {
      // First, while the token still works: whoever signs in on this phone
      // next must not be woken by her notifications.
      await detachPush()

      // Records the sign-out with the API, then drops the httpOnly cookie.
      // The API is stateless, so there is nothing else to revoke; the token
      // simply stops being sent.
      const response = await fetch(SIGN_OUT_PATH, { method: "POST" })
      if (!response.ok) throw new Error(`Sign out failed with ${response.status}`)

      router.replace(LOGIN_PATH)
      router.refresh()
    } catch (error) {
      console.error("Sign out failed", error)
      toast.add({
        type: "error",
        title: labels.signOutFailed,
        description: labels.tryAgain,
      })
      setSigningOut(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={labels.menu}
        className="rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <Avatar>
          <AvatarFallback className="bg-primary/10 font-medium text-primary">
            {initials(patient.fullName)}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="px-1.5 py-1.5 font-normal">
            <span className="block truncate text-sm font-medium text-foreground">
              {patient.fullName}
            </span>
            <span className="block truncate text-xs text-muted-foreground">
              {patient.username}
            </span>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        {(install.canPrompt || install.manual) && (
          <DropdownMenuItem onClick={installApp}>
            <DownloadIcon />
            {labels.install}
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={signOut} disabled={isSigningOut}>
          <LogOutIcon />
          {isSigningOut ? labels.signingOut : labels.signOut}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
