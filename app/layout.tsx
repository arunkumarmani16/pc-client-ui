import type { Metadata, Viewport } from "next"
import { Geist } from "next/font/google"

import "@/app/globals.css"
import GlobalLoadingOverlay from "@/components/global/GlobalLoadingOverlay"
import { Toaster } from "@/components/ui/toast"
import { cn } from "@/lib/utils"

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" })

export const metadata: Metadata = {
  title: {
    default: "Pregnancy Care",
    template: "%s | Pregnancy Care",
  },
  description:
    "Follow your pregnancy week by week, with guidance and videos from your care team.",
  applicationName: "Pregnancy Care",
  formatDetection: {
    // Stops iOS turning patient IDs, mobile numbers and gestational figures
    // into tel: links.
    telephone: false,
  },
}

/**
 * Separate from `metadata` because Next renders it as the viewport meta tag.
 *
 * <p>`maximumScale` is 5 rather than 1: pinch-zoom is an accessibility
 * affordance, and a patient reading guidance on a small phone is exactly who
 * needs it. `viewportFit: "cover"` lets the shell paint under the notch, which
 * the `px-safe` and `pb-safe` utilities then compensate for.
 */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7fafb" },
    { media: "(prefers-color-scheme: dark)", color: "#1a1e26" },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)}>
      {/*
        `h-dvh`, not `h-screen`: on a phone `100vh` is the viewport with the
        browser chrome hidden, so a fixed-height shell measured that way has
        its last row sitting behind the address bar until you scroll. The
        dynamic unit tracks the chrome as it collapses.
      */}
      <body className="h-dvh overflow-hidden">
        {children}
        <GlobalLoadingOverlay />
        <Toaster />
      </body>
    </html>
  )
}
