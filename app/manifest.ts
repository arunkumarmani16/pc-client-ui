import type { MetadataRoute } from "next"

/**
 * What makes the portal installable: "Add to Home Screen" gives it an icon,
 * its own window without the browser's address bar, and on an iPhone it is
 * the only way to receive notifications at all (Safari only offers push to a
 * site opened from the Home Screen).
 *
 * <p>Starts on Home, which sends a signed-out mother to the sign-in page the
 * usual way. The colours are the light theme's background and the brand teal
 * the icons are drawn in.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Pregnancy Care",
    short_name: "Pregnancy Care",
    description: "Follow your pregnancy week by week, with guidance and videos from your care team.",
    id: "/",
    start_url: "/home",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f7fafb",
    theme_color: "#006a6c",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  }
}
