"use client"

import * as React from "react"
import {
  LayoutDashboard,
  Award,
  Store,
  Building2,
  Tag,
  Boxes,
  Coins,
  Wallet,
  BarChart3,
  LineChart,
  ShieldCheck,
  Users,
} from "lucide-react"
import Link from "next/link"
import { useAuthStore } from "@/stores/auth-store"
import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const navigationData = {
  navGroups: [
    {
      label: "Utama",
      items: [
        {
          title: "Dashboard",
          url: "/dashboard",
          icon: LayoutDashboard,
        },
        {
          title: "Inovasi Smart City",
          url: "/inovasi",
          icon: Award,
        },
      ],
    },
    {
      label: "Data Master",
      items: [
        {
          title: "Pelaku UMKM",
          url: "/pelaku-umkm",
          icon: Store,
        },
        {
          title: "Data Koperasi",
          url: "/koperasi",
          icon: Building2,
        },
        {
          title: "Jenis Usaha",
          url: "/master/jenis-usaha",
          icon: Tag,
        },
        {
          title: "Jenis Koperasi",
          url: "/master/jenis-koperasi",
          icon: Boxes,
        },
      ],
    },
    {
      label: "Pembiayaan",
      items: [
        {
          title: "Pembiayaan UMKM",
          url: "/pembiayaan/umkm",
          icon: Coins,
        },
        {
          title: "Pembiayaan Koperasi",
          url: "/pembiayaan/koperasi",
          icon: Wallet,
        },
      ],
    },
    {
      label: "Statistik & Laporan",
      items: [
        {
          title: "Statistik UMKM",
          url: "/statistik/umkm",
          icon: BarChart3,
        },
        {
          title: "Statistik Koperasi",
          url: "/statistik/koperasi",
          icon: LineChart,
        },
      ],
    },
    {
      label: "Manajemen & RBAC",
      items: [
        {
          title: "Manajemen Role & RBAC",
          url: "/management/roles",
          icon: ShieldCheck,
        },
        {
          title: "Manajemen Pengguna",
          url: "/management/users",
          icon: Users,
        },
      ],
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuthStore()

  const currentUser = {
    name: user?.nama || "Administrator",
    email: user?.username ? `@${user.username}` : "admin.dinkop@konaweselatankab.go.id",
    avatar: "",
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild className="cursor-pointer">
              <Link href="/dashboard" className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-bold shadow-md shadow-emerald-500/20">
                  <Store className="h-5 w-5" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-bold tracking-tight text-foreground">APLI DAKOP</span>
                  <span className="truncate text-xs text-muted-foreground font-medium">Kab. Konawe Selatan</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {navigationData.navGroups.map((group) => (
          <NavMain key={group.label} label={group.label} items={group.items} />
        ))}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={currentUser} />
      </SidebarFooter>
    </Sidebar>
  )
}
