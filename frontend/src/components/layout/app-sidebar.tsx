"use client"

import * as React from "react"
import Link from "next/link"
import {
  IconChartBar,
  IconDashboard,
  IconHelp,
  IconListDetails,
  IconSettings,
  IconUsers,
  IconStack2,
  IconMessage,
  IconHistory,
} from "@tabler/icons-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { NavMain } from "./nav-main"
import { NavSecondary } from "./nav-secondary"
import { NavUser } from "./nav-user"

const BloomLogo = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 502.74 502.74"
    xmlns="http://www.w3.org/2000/svg"
    fill="#009982"
  >
    <g>
      <path d="m430.4 72.34c-46.66-46.65-108.68-72.34-174.66-72.34s-128 25.69-174.66 72.34c-46.65 46.66-72.34 108.68-72.34 174.66 0 34.28 6.88 67.42 20.47 98.56l-29.21 157.18 157.18-29.21c31.14 13.59 64.28 20.47 98.56 20.47 65.98 0 128-25.69 174.66-72.34 46.65-46.66 72.34-108.68 72.34-174.66s-25.69-128-72.34-174.66zm-111.72 182.6c-5.87 23.49-24.49 41.76-47.94 47.31v59.65c17.4-14.38 39.01-23.31 62.43-25.19l8.15-.66 2.41 29.9-8.15.66c-28.52 2.3-53.38 18.85-66.51 44.27h-26.66c-13.13-25.42-37.99-41.97-66.51-44.27l-8.15-.66 2.41-29.9 8.15.66c23.42 1.88 45.03 10.81 62.43 25.19v-59.65c-23.45-5.55-42.07-23.82-47.94-47.31-28.32-7.08-49.06-32.69-49.06-62.94s20.74-55.86 49.06-62.94c7.08-28.32 32.69-49.06 62.94-49.06s55.86 20.74 62.94 49.06c28.32 7.08 49.06 32.69 49.06 62.94s-20.74 55.86-49.06 62.94z"/>
      <path d="m304.75 157.17-13.46-.72-.72-13.46c-.98-18.5-16.28-32.99-34.83-32.99s-33.85 14.49-34.83 32.99l-.72 13.46-13.46.72c-18.5.98-32.99 16.28-32.99 34.83s14.49 33.85 32.99 34.83l13.46.72.72 13.46c.98 18.5 16.28 32.99 34.83 32.99s33.85-14.49 34.83-32.99l.72-13.46 13.46-.72c18.5-.98 32.99-16.28 32.99-34.83s-14.49-33.85-32.99-34.83zm-34.01 49.33h-30v-30h30z"/>
    </g>
  </svg>
)

const data = {
  user: {
    name: "Bloom Admin",
    email: "admin@bloom.roblox",
    avatar: "/avatars/admin.jpg",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/",
      icon: IconDashboard,
    },
    {
      title: "Moderation",
      url: "/moderation",
      icon: IconListDetails,
    },
    {
      title: "Analytics",
      url: "/analytics",
      icon: IconChartBar,
    },
    {
      title: "Leaderboard",
      url: "/leaderboard",
      icon: IconUsers,
    },
  ],
  navSecondary: [
    // Removed Settings, Get Help, and dark mode switch
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props} className="bg-background text-primary">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <Link href="/" className="flex items-center gap-2">
                <BloomLogo className="!size-5" />
                <span className="text-xl font-semibold" style={{ fontFamily: 'ClashGrotesk, system-ui, sans-serif' }}>Bloom</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        {/* navSecondary is now empty, so don't render it */}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}