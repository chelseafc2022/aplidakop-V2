"use client"

import * as React from "react"
import {
  LogOut,
  User as UserIcon,
  Shield,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/stores/auth-store"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export function NavUser({
  user,
}: {
  user: {
    name: string
    email: string
    avatar: string
  }
}) {
  const { isMobile } = useSidebar()
  const router = useRouter()
  const { logout, user: authUser } = useAuthStore()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const handleLogout = async () => {
    await logout()
    router.push('/login')
  }

  const displayName = mounted ? (authUser?.nama || user.name) : "Pengguna"
  const displayRole = mounted ? (authUser?.role?.nama || "Tanpa Role") : "Administrator"
  const displayEmail = mounted ? (authUser?.email || user.email) : ""
  const displayInstansi = mounted ? (authUser?.instansiNama || "Instansi tidak tersedia") : "Instansi"

  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "AD"

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground cursor-pointer rounded-2xl border border-emerald-500/20 hover:border-emerald-500/40 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xs hover:bg-white dark:hover:bg-zinc-900 transition-all duration-200 p-2 shadow-xs"
            >
              <div className="relative shrink-0">
                <Avatar className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-600 to-teal-700 text-white font-medium flex items-center justify-center shadow-xs">
                  <AvatarFallback className="bg-transparent text-white text-xs font-bold">{initials}</AvatarFallback>
                </Avatar>
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-zinc-900 shadow-xs" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                <span suppressHydrationWarning className="truncate font-semibold text-slate-900 dark:text-slate-100">{displayName}</span>
                <span suppressHydrationWarning className="truncate text-[11px] text-muted-foreground flex items-center gap-1 font-medium">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  {displayRole}
                </span>
              </div>
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg bg-emerald-600 text-white font-medium flex items-center justify-center">
                  <AvatarFallback className="bg-emerald-600 text-white text-xs">{initials}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span suppressHydrationWarning className="truncate font-semibold">{displayName}</span>
                  <span suppressHydrationWarning className="truncate text-xs text-muted-foreground">{displayEmail}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem className="cursor-pointer">
                <UserIcon className="mr-2 h-4 w-4" />
                <span suppressHydrationWarning>{displayInstansi}</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                <Shield className="mr-2 h-4 w-4" />
                <span suppressHydrationWarning>Role: {displayRole}</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Keluar (Logout)</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
