"use client"

import { useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import useSWR from "swr"
import { LayoutDashboard, Layers3, Settings, Users } from "lucide-react"
import { LayoutWrapper } from "@/components/layout-wrapper"
import { useAuth } from "@/lib/auth-context"
import { api, apiClient } from "@/lib/api-client"

const ACTIVE_CASE_STATUSES = new Set(["pending", "in_progress", "under_review"])

export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter()
  const { user, isLoading } = useAuth()

  const { data: clientsData } = useSWR("/api/clients", apiClient.get)
  const { data: casesData } = useSWR("/api/cases", apiClient.get)
  const { data: activityData } = useSWR("/api/activity?limit=50", () => api.getActivity({ limit: 50 }))

  useEffect(() => {
    if (isLoading) return

    if (!user) {
      router.replace("/login")
      return
    }

    if (user.role !== "admin" && user.role !== "staff") {
      router.replace("/client/dashboard")
    }
  }, [isLoading, user, router])

  if (isLoading || !user || (user.role !== "admin" && user.role !== "staff")) {
    return (
      <div className="flex h-screen items-center justify-center text-muted-foreground">
        {isLoading ? "Cargando espacio de trabajo..." : "Redirigiendo..."}
      </div>
    )
  }

  const activeCaseIds = new Set(
    (casesData?.cases || [])
      .filter((caseItem: any) => ACTIVE_CASE_STATUSES.has(caseItem.status))
      .map((caseItem: any) => caseItem.id),
  )

  const notificationsCount = (activityData?.activities || []).filter(
    (activity: any) => !activity.case_id || activeCaseIds.has(activity.case_id),
  ).length

  const clientsCount = clientsData?.clients?.length ?? 0

  const navItems = [
    {
      label: "Panel",
      href: "/admin/dashboard",
      icon: <LayoutDashboard className="h-4 w-4" />,
      badge: notificationsCount ? String(notificationsCount) : undefined,
    },
    {
      label: "Clientes",
      href: "/admin/clients",
      icon: <Users className="h-4 w-4" />,
      badge: clientsCount ? String(clientsCount) : undefined,
    },
    {
      label: "Tipos de caso",
      href: "/admin/settings/case-types",
      icon: <Layers3 className="h-4 w-4" />,
    },
    {
      label: "Configuracion",
      href: "/admin/settings",
      icon: <Settings className="h-4 w-4" />,
    },
  ]

  return (
    <LayoutWrapper userType="admin" navItems={navItems}>
      {children}
    </LayoutWrapper>
  )
}
