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
  userType: "admin" | "client"
  organizationName?: string
  onLogout?: () => Promise<void> | void
  onNavigate?: () => void
  className?: string
}

export function AppSidebar({ items, userType, organizationName, onLogout, onNavigate, className }: AppSidebarProps) {
  const pathname = usePathname()
  const displayOrganization = organizationName || DEFAULT_BRAND_NAME

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
        "flex w-64 flex-col border-r border-border bg-white text-[#031247] shadow-lg shadow-[#010b1c]/5",
        className,
      )}
    >
      {/* Logo */}
      <div className="bg-white p-6 text-center">
        <Link
          href={userType === "admin" ? "/admin/dashboard" : "/client/dashboard"}
          className="flex flex-col items-center gap-2 text-center"
          onClick={handleNavigate}
        >
          <div className="shrink-0">
            <Logo className="w-40" />
          </div>
          <div className="text-[11px] font-semibold uppercase tracking-wide text-[#031247]/70">
            Portal {userType === "admin" ? "equipo" : "clientes"}
          </div>
          <p className="text-[11px] font-medium text-[#031247]/50">{displayOrganization}</p>
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
                    : "text-[#031247] hover:border-[#dbe4ff] hover:bg-[#f4f6ff]",
                )}
                onClick={handleNavigate}
              >
                <div className="flex items-center gap-3">
                  <span className={cn("text-base", pathname === item.href ? "text-primary-foreground" : "text-[#031247]")}>
                    {item.icon}
                  </span>
                  {item.label}
                </div>
                {item.badge && (
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-xs font-semibold",
                      pathname === item.href ? "bg-white/30 text-white" : "bg-[#e8f5f6] text-[#02616d]",
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
      <div className="border-t border-[#e1e7f5] p-4">
        <button
          type="button"
          onClick={handleLogout}
          className="w-full rounded-2xl border border-transparent px-4 py-2.5 text-sm font-semibold text-[#031247] transition hover:border-[#dbe4ff] hover:bg-[#f4f6ff]"
        >
          Cerrar sesion
        </button>
      </div>
    </aside>
  )
}
