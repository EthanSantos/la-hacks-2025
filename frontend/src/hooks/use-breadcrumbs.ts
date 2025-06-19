"use client"

import { usePathname } from "next/navigation"
import { useMemo } from "react"

interface BreadcrumbItem {
  label: string
  href: string
  isCurrentPage?: boolean
}

export function useBreadcrumbs(): BreadcrumbItem[] {
  const pathname = usePathname()

  return useMemo(() => {
    const segments = pathname.split('/').filter(Boolean)
    const breadcrumbs: BreadcrumbItem[] = []

    // Handle root path (dashboard)
    if (pathname === "/") {
      breadcrumbs.push({
        label: "Dashboard",
        href: "/",
        isCurrentPage: true
      })
      return breadcrumbs
    }

    // Always add home first for other routes
    breadcrumbs.push({
      label: "Dashboard",
      href: "/",
      isCurrentPage: false
    })

    // Handle specific routes
    if (segments.length > 0) {
      const firstSegment = segments[0]

      switch (firstSegment) {
        case "moderation":
          breadcrumbs.push({
            label: "Moderation",
            href: "/moderation",
            isCurrentPage: true
          })
          break

        case "analytics":
          breadcrumbs.push({
            label: "Analytics",
            href: "/analytics",
            isCurrentPage: true
          })
          break

        case "leaderboard":
          breadcrumbs.push({
            label: "Leaderboard",
            href: "/leaderboard",
            isCurrentPage: true
          })
          break

        default:
          // For any other routes, add them as-is
          segments.forEach((segment, index) => {
            const href = "/" + segments.slice(0, index + 1).join("/")
            const isLast = index === segments.length - 1
            
            breadcrumbs.push({
              label: segment.charAt(0).toUpperCase() + segment.slice(1),
              href,
              isCurrentPage: isLast
            })
          })
          break
      }
    }

    return breadcrumbs
  }, [pathname])
} 