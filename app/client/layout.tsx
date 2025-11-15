"use client"

import { useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { Briefcase, FileText, LayoutDashboard, MessageSquare, UserRound } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { LayoutWrapper } from "@/components/layout-wrapper"

const clientNavItems = [
  { label: "Panel", href: "/client/dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
  { label: "Mis casos", href: "/client/cases", icon: <Briefcase className="h-4 w-4" /> },
  { label: "Documentos", href: "/client/documents", icon: <FileText className="h-4 w-4" /> },
  { label: "Mensajes", href: "/client/messages", icon: <MessageSquare className="h-4 w-4" />, badge: "2" },
  { label: "Perfil", href: "/client/profile", icon: <UserRound className="h-4 w-4" /> },
]

export default function ClientLayout({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isLoading) return

    if (!user) {
      router.replace("/login")
      return
    }

    if (user.role !== "client") {
      router.replace("/admin/dashboard")
    }
  }, [isLoading, user, router])

  if (isLoading || !user || user.role !== "client") {
    return (
      <div className="flex h-screen items-center justify-center text-muted-foreground">
        {isLoading ? "Cargando espacio de trabajo..." : "Redirigiendo..."}
      </div>
    )
  }

  return (
    <LayoutWrapper userType="client" navItems={clientNavItems}>
      {children}
    </LayoutWrapper>
  )
}
