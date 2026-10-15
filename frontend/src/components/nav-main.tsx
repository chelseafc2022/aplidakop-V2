"use client"

import { ChevronRight, type LucideIcon } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"

export interface NavMainItem {
  title: string
  url: string
  icon?: LucideIcon
  isActive?: boolean
  badge?: string
  administratorOnly?: boolean
  items?: {
    title: string
    url: string
    isActive?: boolean
    badge?: string
  }[]
}

export function NavMain({
  label,
  items,
}: {
  label: string
  items: NavMainItem[]
}) {
  const pathname = usePathname()

  // Check if item or any subitem is active
  const isItemActive = (item: NavMainItem) => {
    if (item.isActive) return true
    if (pathname === item.url) return true
    if (item.url !== "/dashboard" && item.url !== "/" && pathname.startsWith(item.url + "/")) {
      return true
    }
    return false
  }

  const shouldBeOpen = (item: NavMainItem) => {
    if (isItemActive(item)) return true
    return item.items?.some((subItem) => pathname === subItem.url || pathname.startsWith(subItem.url + "/")) || false
  }

  return (
    <SidebarGroup className="py-1.5">
      <SidebarGroupLabel className="text-[10px] font-bold uppercase tracking-wider text-emerald-900/70 dark:text-emerald-400/80 px-3 py-1 flex items-center gap-2 select-none">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/70 shrink-0" />
        <span className="shrink-0">{label}</span>
        <span className="h-[1px] flex-1 bg-emerald-500/15" />
      </SidebarGroupLabel>
      <SidebarMenu className="gap-1 px-1">
        {items.map((item) => {
          const active = isItemActive(item)
          const hasChildren = Boolean(item.items?.length)

          return (
            <Collapsible
              key={item.title}
              asChild
              defaultOpen={shouldBeOpen(item)}
              className="group/collapsible"
            >
              <SidebarMenuItem>
                {hasChildren ? (
                  <>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton
                        tooltip={item.title}
                        className={cn(
                          "relative cursor-pointer transition-all duration-200 group/btn font-medium rounded-xl h-9 px-3",
                          active
                            ? "bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white font-semibold shadow-md shadow-emerald-700/20"
                            : "text-slate-700 dark:text-slate-300 hover:text-emerald-950 dark:hover:text-emerald-100 hover:bg-emerald-500/10"
                        )}
                      >
                        {active && (
                          <span className="absolute left-1 top-2 bottom-2 w-1 bg-white/90 rounded-full shadow-xs" />
                        )}
                        {item.icon && (
                          <item.icon
                            className={cn(
                              "size-4 shrink-0 transition-colors",
                              active
                                ? "text-white stroke-[2.25] drop-shadow-xs"
                                : "text-emerald-700/80 dark:text-emerald-400/80 group-hover/btn:text-emerald-900 dark:group-hover/btn:text-emerald-200"
                            )}
                          />
                        )}
                        <span className="truncate">{item.title}</span>
                        <ChevronRight
                          className={cn(
                            "ml-auto size-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90",
                            active ? "text-white/80" : "text-muted-foreground/70"
                          )}
                        />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub className="border-l-2 border-emerald-500/25 dark:border-emerald-500/35 ml-4.5 pl-2.5 my-1 space-y-0.5">
                        {item.items?.map((subItem) => {
                          const isSubActive = pathname === subItem.url
                          return (
                            <SidebarMenuSubItem key={subItem.title}>
                              <SidebarMenuSubButton
                                asChild
                                className={cn(
                                  "relative cursor-pointer text-xs rounded-lg py-1.5 px-2.5 transition-all duration-150",
                                  isSubActive
                                    ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold shadow-xs"
                                    : "text-slate-600 dark:text-slate-400 hover:text-emerald-900 dark:hover:text-emerald-200 hover:bg-emerald-500/10"
                                )}
                                isActive={isSubActive}
                              >
                                <Link
                                  href={subItem.url}
                                  target={(item.title === "Auth Pages" || item.title === "Errors") ? "_blank" : undefined}
                                  rel={(item.title === "Auth Pages" || item.title === "Errors") ? "noopener noreferrer" : undefined}
                                  className="flex items-center gap-2 w-full"
                                >
                                  {isSubActive ? (
                                    <span className="w-1.5 h-1.5 rounded-full bg-white shadow-xs shrink-0" />
                                  ) : (
                                    <span className="w-1 h-1 rounded-full bg-emerald-600/40 shrink-0" />
                                  )}
                                  <span className="truncate">{subItem.title}</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          )
                        })}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </>
                ) : (
                  <SidebarMenuButton
                    asChild
                    tooltip={item.title}
                    className={cn(
                      "relative cursor-pointer transition-all duration-200 group/btn font-medium rounded-xl h-9 px-3",
                      active
                        ? "bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white font-semibold shadow-md shadow-emerald-700/20"
                        : "text-slate-700 dark:text-slate-300 hover:text-emerald-950 dark:hover:text-emerald-100 hover:bg-emerald-500/10"
                    )}
                    isActive={active}
                  >
                    <Link href={item.url} className="flex items-center gap-2 w-full">
                      {active && (
                        <span className="absolute left-1 top-2 bottom-2 w-1 bg-white/90 rounded-full shadow-xs" />
                      )}
                      {item.icon && (
                        <item.icon
                          className={cn(
                            "size-4 shrink-0 transition-colors",
                            active
                              ? "text-white stroke-[2.25] drop-shadow-xs"
                              : "text-emerald-700/80 dark:text-emerald-400/80 group-hover/btn:text-emerald-900 dark:group-hover/btn:text-emerald-200"
                          )}
                        />
                      )}
                      <span className="truncate">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                )}
              </SidebarMenuItem>
            </Collapsible>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
