"use client"

import type React from "react"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Logo } from "./logo"
import { cn } from "@/lib/utils"

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
  badge?: string
}

const DEFAULT_BRAND_NAME = process.env.NEXT_PUBLIC_APP_NAME || "Tu agencia"

interface AppSidebarProps {
  items: NavItem[]
  userType: "admin" | "client" | "superadmin"
  organizationName?: string
  logoUrl?: string | null
  homeHref?: string
  tagline?: string
  isFixed?: boolean
  onLogout?: () => Promise<void> | void
  onNavigate?: () => void
  className?: string
}

export function AppSidebar({
  items,
  userType,
  organizationName,
  logoUrl,
  homeHref,
  tagline,
  isFixed = false,
  onLogout,
  onNavigate,
  className,
}: AppSidebarProps) {
  const pathname = usePathname()
  const displayOrganization = organizationName || DEFAULT_BRAND_NAME
  const resolvedHome =
    homeHref ||
    (userType === "admin" ? "/admin/dashboard" : userType === "client" ? "/client/dashboard" : "/superadmin")
  const resolvedTagline =
    tagline ||
    (userType === "admin" ? "Portal equipo" : userType === "client" ? "Portal clientes" : "Panel propietario")

  const handleNavigate = () => {
    if (onNavigate) {
      onNavigate()
    }
  }

  const handleLogout = async () => {
    if (onLogout) {
      await onLogout()
    }
    handleNavigate()
  }

  return (
    <aside
      className={cn(
        "flex w-64 h-full flex-col border-r border-border bg-sidebar text-sidebar-foreground shadow-lg shadow-black/5 lg:overflow-y-auto",
        isFixed ? "lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:h-screen" : "",
        className,
      )}
    >
      {/* Logo */}
      <div className="bg-sidebar p-6 text-center">
        <Link
          href={resolvedHome}
          className="flex flex-col items-center gap-2 text-center"
          onClick={handleNavigate}
        >
          <div className="shrink-0">
            <Logo className="w-40" src={logoUrl || undefined} alt={displayOrganization} />
          </div>
          <div className="text-[11px] font-semibold uppercase tracking-wide text-sidebar-foreground/80">
            {resolvedTagline}
          </div>
        </Link>
      </div>
      <div className="mx-4 mb-4 h-1 rounded-full bg-gradient-to-r from-primary/60 via-primary to-primary/60" />

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-4 pb-4">
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex items-center justify-between rounded-2xl border border-transparent px-4 py-2.5 text-sm font-medium transition",
                  pathname === item.href
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-sidebar-foreground/90 hover:border-muted hover:bg-muted/40",
                )}
                onClick={handleNavigate}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={cn("text-base", pathname === item.href ? "text-primary-foreground" : "text-sidebar-foreground")}
                  >
                    {item.icon}
                  </span>
                  {item.label}
                </div>
                {item.badge && (
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-xs font-semibold",
                      pathname === item.href ? "bg-white/30 text-white" : "bg-accent/15 text-accent-foreground",
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Logout */}
      <div className="border-t border-border/60 p-4">
        <button
          type="button"
          onClick={handleLogout}
          className="w-full rounded-2xl border border-transparent px-4 py-2.5 text-sm font-semibold text-sidebar-foreground transition hover:border-muted hover:bg-muted/40"
        >
          Cerrar sesion
        </button>
      </div>
    </aside>
  )
}
