"use client"

import type React from "react"
import { useEffect, useMemo, useState, type ReactNode } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Menu, Repeat, ShieldCheck, X } from "lucide-react"
import { Logo } from "./logo"
import { AppSidebar } from "./app-sidebar"
import { OnboardingTour } from "./onboarding-tour"
import { useAuth } from "@/lib/auth-context"
import { applyBrandingTheme } from "@/lib/branding"
import { Button } from "@/components/ui/button"

interface LayoutWrapperProps {
  children: ReactNode
  userType: "admin" | "client"
  navItems: Array<{ label: string; href: string; icon: React.ReactNode; badge?: string }>
}

export function LayoutWrapper({ children, userType, navItems }: LayoutWrapperProps) {
  const router = useRouter()
  const { user, logout, organization, login } = useAuth()
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false)
  const [isSwitching, setIsSwitching] = useState(false)
  const [demoBannerVisible, setDemoBannerVisible] = useState(true)
  const logoUrl = organization?.branding?.logo_url || organization?.logo_url

  useEffect(() => {
    applyBrandingTheme(organization?.branding)
  }, [organization?.branding])

  const handleLogout = async () => {
    try {
      await logout()
    } finally {
      router.replace("/login")
    }
  }

  const demoConfig = useMemo(() => {
    const meta = (organization?.metadata || {}) as any
    return {
      isDemo: Boolean(meta?.is_demo || meta?.isDemo),
      limits: meta?.demo_limits || meta?.demoLimits || {
        uploadsPerDay: 3,
        messagesPerDay: 10,
        maxSizeMb: 1,
        ttlMinutes: 30,
      },
      accounts: meta?.demo_accounts || meta?.demoAccounts || {
        admin_email: "admin@demo.com",
        client_email: "cliente.demo@demo.com",
        password: "demo123",
      },
    }
  }, [organization?.metadata])

  const canSwitchDemo = demoConfig.isDemo && demoConfig.accounts?.password

  const handleSwitchRole = async (target: "admin" | "client") => {
    if (!organization || !canSwitchDemo) return
    const email = target === "admin" ? demoConfig.accounts?.admin_email : demoConfig.accounts?.client_email || demoConfig.accounts?.admin_email
    if (!email) return
    const slug = organization?.slug
    setIsSwitching(true)
    try {
      await login(email, demoConfig.accounts?.password, slug)
      router.replace(target === "admin" ? "/admin/dashboard" : "/client/dashboard")
    } catch (error) {
      console.error("No se pudo cambiar de rol demo", error)
    } finally {
      setIsSwitching(false)
    }
  }

  const closeMobileNav = () => setIsMobileNavOpen(false)

  return (
    <>
      <div className="flex min-h-screen bg-background lg:pl-64">
        <AppSidebar
          items={navItems}
          userType={userType}
          organizationName={organization?.name}
          logoUrl={logoUrl}
          onLogout={handleLogout}
          isFixed
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
                <Logo className="w-32" src={logoUrl || undefined} priority />
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Portal {userType === "admin" ? "equipo" : "clientes"}
                </span>
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

          <main className="flex-1 overflow-y-auto px-4 pb-16 pt-6 sm:p-6 lg:p-8">
            <div className="mx-auto w-full max-w-6xl space-y-6 pb-16">{children}</div>
          </main>
        </div>
      </div>

      {demoConfig.isDemo && (
        <div className="pointer-events-none fixed bottom-6 left-6 z-40 flex justify-start lg:left-10">
          {demoBannerVisible ? (
            <div className="pointer-events-auto flex max-w-xl flex-col gap-3 rounded-2xl border border-primary/40 bg-primary/20 px-4 py-4 text-sm text-foreground shadow-lg shadow-primary/15 backdrop-blur">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 inline-flex items-center justify-center rounded-full bg-primary/15 p-1 text-primary">
                  <ShieldCheck className="h-4 w-4" />
                </span>
                <div className="flex-1 space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-foreground">Modo demo activo</p>
                    <Button size="icon" variant="ghost" className="text-muted-foreground" onClick={() => setDemoBannerVisible(false)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-foreground/80">
                    Limite: {demoConfig.limits.uploadsPerDay} archivos/dia (max {demoConfig.limits.maxSizeMb}MB), {demoConfig.limits.messagesPerDay} mensajes/dia. Archivos se eliminan en {demoConfig.limits.ttlMinutes} min.
                  </p>
                  {canSwitchDemo && (
                    <div className="pt-1">
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-2 bg-white/90 text-foreground hover:bg-white"
                        onClick={() => handleSwitchRole(userType === "admin" ? "client" : "admin")}
                        disabled={isSwitching}
                      >
                        <Repeat className="h-4 w-4" />
                        {isSwitching ? "Cambiando..." : userType === "admin" ? "Ver como cliente demo" : "Ver como admin demo"}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <Button
              size="sm"
              className="pointer-events-auto rounded-full bg-primary text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary/90"
              onClick={() => setDemoBannerVisible(true)}
            >
              <ShieldCheck className="mr-2 h-4 w-4" />
              Demo activo
            </Button>
          )}
        </div>
      )}

      <OnboardingTour role={userType} userId={user?.id} isDemo={demoConfig.isDemo} demoLimits={demoConfig.limits} />

      {isMobileNavOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={closeMobileNav} aria-hidden="true" />
          <div className="fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] lg:hidden">
            <AppSidebar
              items={navItems}
              userType={userType}
              organizationName={organization?.name}
              logoUrl={logoUrl}
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
