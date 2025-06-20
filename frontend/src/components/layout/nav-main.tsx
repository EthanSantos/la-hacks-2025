"use client"

import { IconChevronDown, type Icon } from "@tabler/icons-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"

import {
  SidebarGroup as Group,
  SidebarGroupContent as GroupContent,
  SidebarGroupLabel as GroupLabel,
  SidebarMenu as Menu,
  SidebarMenuButton as MenuButton,
  SidebarMenuItem as MenuItem,
  SidebarMenuSub as MenuSub,
  SidebarMenuSubButton as MenuSubButton,
  SidebarMenuSubItem as MenuSubItem,
} from "@/components/ui/sidebar"

interface NavItem {
  title: string
  url: string
  icon?: Icon
  items?: {
    title: string
    url: string
    icon?: Icon
  }[]
}

export function NavMain({
  items,
}: {
  items: NavItem[]
}) {
  const pathname = usePathname()
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({
    "Moderation": true // Keep moderation open by default
  })

  const toggleItem = (title: string) => {
    setOpenItems(prev => ({
      ...prev,
      [title]: !prev[title]
    }))
  }

  const isActive = (url: string) => {
    if (url === "/") {
      return pathname === "/"
    }
    return pathname.startsWith(url)
  }

  return (
    <Group>
      <GroupLabel>MENU</GroupLabel>
      <GroupContent className="flex flex-col gap-2">
        <Menu>
          {items.map((item) => {
            const hasSubItems = item.items && item.items.length > 0
            const isItemActive = isActive(item.url)
            const isExpanded = openItems[item.title]

            return (
              <MenuItem key={item.title}>
                {hasSubItems ? (
                  <>
                    <MenuButton 
                      tooltip={item.title}
                      onClick={() => toggleItem(item.title)}
                      isActive={isItemActive}
                      className="group/collapsible"
                    >
                      {item.icon && <item.icon className="h-6 w-6" />}
                      <span>{item.title}</span>
                      <IconChevronDown className={`ml-auto h-4 w-4 transition-transform duration-200 ${
                        isExpanded ? "rotate-180" : ""
                      }`} />
                    </MenuButton>
                    {isExpanded && (
                      <MenuSub>
                        {item.items?.map((subItem) => (
                          <MenuSubItem key={subItem.title}>
                            <MenuSubButton 
                              asChild
                              isActive={pathname === subItem.url}
                            >
                              <Link href={subItem.url}>
                                {subItem.icon && <subItem.icon className="h-4 w-4" />}
                                <span>{subItem.title}</span>
                              </Link>
                            </MenuSubButton>
                          </MenuSubItem>
                        ))}
                      </MenuSub>
                    )}
                  </>
                ) : (
                  <MenuButton 
                    tooltip={item.title}
                    asChild
                    isActive={isActive(item.url)}
                  >
                    <Link href={item.url}>
                      {item.icon && <item.icon className="h-6 w-6" />}
                      <span>{item.title}</span>
                    </Link>
                  </MenuButton>
                )}
              </MenuItem>
            )
          })}
        </Menu>
      </GroupContent>
    </Group>
  )
}