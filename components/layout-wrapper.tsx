"use client"

import type React from "react"

import { useState, type ReactNode } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Menu } from "lucide-react"
import { AppSidebar } from "./app-sidebar"
import { Logo } from "./logo"
import { useAuth } from "@/lib/auth-context"

interface LayoutWrapperProps {
  children: ReactNode
  userType: "admin" | "client"
  navItems: Array<{ label: string; href: string; icon: React.ReactNode; badge?: string }>
}

export function LayoutWrapper({ children, userType, navItems }: LayoutWrapperProps) {
  const router = useRouter()
  const { logout, organization } = useAuth()
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false)

  const handleLogout = async () => {
    try {
      await logout()
    } finally {
      router.replace("/login")
    }
  }

  const closeMobileNav = () => setIsMobileNavOpen(false)

  return (
    <>
      <div className="flex min-h-screen bg-background">
        <AppSidebar
          items={navItems}
          userType={userType}
          organizationName={organization?.name}
          onLogout={handleLogout}
          className="hidden lg:flex lg:w-64"
        />

        <div className="flex min-h-screen flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-border bg-background/95 px-4 py-3 backdrop-blur lg:hidden">
            <div className="flex items-center justify-between gap-4">
              <button
                type="button"
                className="rounded-lg border border-border p-2 text-foreground transition hover:bg-muted"
                onClick={() => setIsMobileNavOpen(true)}
                aria-label="Abrir menu lateral"
              >
                <Menu className="h-5 w-5" />
              </button>

              <Link
                href={userType === "admin" ? "/admin/dashboard" : "/client/dashboard"}
                className="flex flex-1 flex-col items-center gap-1 text-center"
              >
                <Logo className="w-32" priority />
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Portal {userType === "admin" ? "equipo" : "clientes"}
                </span>
                {organization?.name && <span className="text-[11px] text-muted-foreground/70">{organization.name}</span>}
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                className="text-sm font-semibold text-primary transition hover:text-primary/80"
              >
                Salir
              </button>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto px-4 py-6 sm:p-6 lg:p-8">
            <div className="mx-auto w-full max-w-6xl">{children}</div>
          </main>
        </div>
      </div>

      {isMobileNavOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={closeMobileNav} aria-hidden="true" />
          <div className="fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] lg:hidden">
            <AppSidebar
              items={navItems}
              userType={userType}
              organizationName={organization?.name}
              onLogout={handleLogout}
              onNavigate={closeMobileNav}
              className="h-full w-full"
            />
          </div>
        </>
      )}
    </>
  )
}
