"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { LayoutDashboard, Building2, ShieldCheck, Sparkles, Menu, MessageSquare } from "lucide-react"
import { clearSuperadminToken, getSuperadminToken } from "@/lib/superadmin-client"
import { AppSidebar } from "@/components/app-sidebar"
import { Logo } from "@/components/logo"
import { Button } from "@/components/ui/button"

const navItems = [
  { label: "Dashboard", href: "/superadmin", icon: <LayoutDashboard className="h-4 w-4" /> },
  { label: "Organizaciones", href: "/superadmin/organizations", icon: <Building2 className="h-4 w-4" /> },
  { label: "Tickets", href: "/superadmin/tickets", icon: <MessageSquare className="h-4 w-4" /> },
  { label: "Verificacion", href: "/superadmin#verificacion", icon: <ShieldCheck className="h-4 w-4" /> },
  { label: "Altas", href: "/superadmin#crear", icon: <Sparkles className="h-4 w-4" /> },
]

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const isLoginPage = pathname?.startsWith("/superadmin/login")
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false)
  const [hasToken, setHasToken] = useState(false)

  useEffect(() => {
    if (isLoginPage) return
    const token = getSuperadminToken()
    if (!token) {
      router.replace("/superadmin/login")
      return
    }
    setHasToken(true)
  }, [isLoginPage, router])

  const handleLogout = () => {
    clearSuperadminToken()
    router.replace("/superadmin/login")
  }

  const closeMobileNav = () => setIsMobileNavOpen(false)

  if (isLoginPage) {
    return <>{children}</>
  }

  if (!hasToken) {
    return null
  }

  return (
    <>
      <div className="flex min-h-screen bg-background text-foreground lg:pl-64">
        <AppSidebar
          items={navItems}
          userType="superadmin"
          organizationName="SuperAdmin"
          homeHref="/superadmin"
          tagline="Panel propietario"
          isFixed
          onLogout={handleLogout}
          onNavigate={closeMobileNav}
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

              <Link href="/superadmin" className="flex flex-1 flex-col items-center gap-1 text-center">
                <Logo className="w-32" alt="Panel SuperAdmin" />
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Panel propietario</span>
              </Link>

              <Button variant="ghost" size="sm" onClick={handleLogout}>
                Salir
              </Button>
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
              userType="superadmin"
              organizationName="SuperAdmin"
              homeHref="/superadmin"
              tagline="Panel propietario"
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
