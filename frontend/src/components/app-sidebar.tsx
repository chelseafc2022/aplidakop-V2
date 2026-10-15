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
  UserRoundSearch,
  ListChecks,
  ClipboardCheck,
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useAuthStore } from "@/stores/auth-store"
import { isAdministratorRole } from "@/lib/auth-role"
import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
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
        /*
        {
          title: "Inovasi Smart City",
          url: "/inovasi",
          icon: Award,
        },
        */
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
      label: "Verifikasi Layanan",
      items: [
        {
          title: "Pendaftaran UMKM",
          url: "/verifikasi/pendaftaran-umkm",
          icon: ListChecks,
          administratorOnly: true,
        },
        {
          title: "Bantuan UMKM",
          url: "/verifikasi/bantuan-umkm",
          icon: ClipboardCheck,
          administratorOnly: true,
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
          administratorOnly: true,
        },
        {
          title: "Manajemen Pengguna",
          url: "/management/users",
          icon: Users,
          administratorOnly: true,
        },
      ],
    },
    {
      label: "Verifikasi Mendalam",
      items: [
        {
          title: "Verifikasi Koperasi",
          url: "/verifikasi/koperasi",
          icon: ShieldCheck,
          administratorOnly: true,
        },
        {
          title: "NIK Kembar UMKM",
          url: "/management/nik-kembar",
          icon: UserRoundSearch,
          administratorOnly: true,
        },
      ],
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user, checkAuth } = useAuthStore()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
    void checkAuth()
  }, [checkAuth])

  const isAdministrator = mounted && isAdministratorRole(user?.role?.nama)
  const visibleNavigationGroups = navigationData.navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter(
        (item) => !("administratorOnly" in item && item.administratorOnly) || isAdministrator,
      ),
    }))
    .filter((group) => group.items.length > 0)

  const currentUser = {
    name: mounted && user?.nama ? user.nama : "Pengguna",
    email: mounted ? (user?.email || (user?.username ? `@${user.username}` : "")) : "",
    avatar: "",
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="border-b border-emerald-500/15 p-2.5 sm:p-3">
        <Link
          href="/dashboard"
          className="flex flex-col items-center justify-center w-full rounded-2xl py-2 px-2 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xs border border-emerald-500/20 shadow-xs hover:border-emerald-500/40 hover:shadow-sm transition-all duration-200 group/logo"
          title="APLI DAKOP — Dashboard"
        >
          {/* Logo Resmi Lengkap (Expanded Mode) */}
          <div className="relative flex flex-col items-center justify-center w-full group-data-[collapsible=icon]:hidden">
            <Image
              src="/logo_with_text.png"
              alt="Logo Resmi APLI DAKOP Kab. Konawe Selatan"
              width={260}
              height={70}
              className="w-full h-auto max-h-[66px] object-contain drop-shadow-xs transition-transform duration-200 group-hover/logo:scale-[1.02]"
              priority
            />
          </div>
          {/* Logo Monogram Lambang Resmi (Collapsed Icon Mode) */}
          <div className="hidden group-data-[collapsible=icon]:flex items-center justify-center w-full py-0.5">
            <Image
              src="/logo_only.png"
              alt="APLI DAKOP"
              width={48}
              height={48}
              className="h-9 w-9 object-contain drop-shadow-xs transition-transform duration-200 group-hover/logo:scale-105"
              priority
            />
          </div>
        </Link>
      </SidebarHeader>
      <SidebarContent className="gap-0 py-2">
        {visibleNavigationGroups.map((group) => (
          <NavMain key={group.label} label={group.label} items={group.items} />
        ))}
      </SidebarContent>
      <SidebarFooter className="border-t border-emerald-500/15 p-2 sm:p-2.5">
        <NavUser user={currentUser} />
      </SidebarFooter>
    </Sidebar>
  )
}
