"use client"

import type React from "react"
import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Logo } from "@/components/logo"
import { useAuth } from "@/lib/auth-context"
import { applyBrandingTheme } from "@/lib/branding"

const DEFAULT_APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "Tu agencia"
const DEFAULT_SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "soporte@example.com"

export function LoginView({ slug }: { slug?: string }) {
  const router = useRouter()
  const { login, isLoading, organization } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [space, setSpace] = useState(slug || "")
  const [error, setError] = useState("")

  useEffect(() => {
    applyBrandingTheme(organization?.branding)
  }, [organization?.branding])

  const heroBackground = useMemo(
    () => ({
      backgroundImage:
        "radial-gradient(circle at 20% 20%, rgba(124,58,237,0.25), transparent 30%), radial-gradient(circle at 80% 10%, rgba(6,182,212,0.18), transparent 26%), linear-gradient(135deg, #080a14, #0f172a 45%, #111827)",
      backgroundColor: "#080a14",
    }),
    [],
  )

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    try {
      const normalizedSlug = space.trim()
      await login(email, password, normalizedSlug)

      const response = await fetch("/api/auth/me")

      if (!response.ok) {
        router.push("/admin/dashboard")
        return
      }

      const data = await response.json()
      const user = data?.user

      if (user?.role === "admin" || user?.role === "staff") {
        router.push("/admin/dashboard")
      } else if (user?.role === "client") {
        router.push("/client/dashboard")
      } else {
        router.push("/admin/dashboard")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo iniciar sesion. Intentalo de nuevo.")
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="absolute inset-0" style={heroBackground} />
      <div className="relative mx-auto flex min-h-screen max-w-6xl items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md border border-white/15 bg-[#0a0a0f]/90 shadow-2xl backdrop-blur">
          <div className="p-8 text-white">
            <div className="mb-8 flex flex-col items-center text-center">
              <Logo className="mb-4 w-44" priority />
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">
                Portal seguro{slug ? ` - ${slug}` : ""}
              </p>
              <p className="mt-2 text-sm text-white/70">
                Gestiona clientes y expedientes de {DEFAULT_APP_NAME} en un solo lugar.
              </p>
            </div>

            {error && (
              <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-white">
                  Correo electronico
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="equipo@tuagencia.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border-white/15 bg-[#050507] text-white placeholder:text-white/50 focus:border-brand-purple focus:ring-brand-purple/40"
                  autoComplete="email"
                />
              </div>

              <div>
                <label htmlFor="slug" className="mb-1.5 block text-sm font-medium text-white">
                  Espacio (slug)
                </label>
                <Input
                  id="slug"
                  type="text"
                  placeholder="demo, real, acme..."
                  value={space}
                  onChange={(e) => setSpace(e.target.value)}
                  className="w-full border-white/15 bg-[#050507] text-white placeholder:text-white/50 focus:border-brand-purple focus:ring-brand-purple/40"
                  autoComplete="organization"
                />
              </div>

              <div>
                <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-white">
                  Contrasena
                </label>
                <Input
                  id="password"
                  type="password"
                  placeholder="****************"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border-white/15 bg-[#050507] text-white placeholder:text-white/50 focus:border-brand-purple focus:ring-brand-purple/40"
                  autoComplete="current-password"
                />
              </div>

              <p className="text-xs text-white/60">
                Ingresa el slug de tu organizacion (p. ej. <span className="font-medium text-white">demo</span>) junto con tus credenciales.
              </p>

              <Button
                type="submit"
                className="mt-6 w-full bg-gradient-to-r from-brand-blue via-brand-purple to-brand-cyan text-white shadow-[0_10px_30px_-10px_rgba(124,58,237,0.7)] transition hover:shadow-[0_14px_34px_-10px_rgba(124,58,237,0.9)]"
                disabled={isLoading}
              >
                {isLoading ? "Iniciando sesion..." : "Acceder al portal"}
              </Button>
            </form>

            {process.env.NEXT_PUBLIC_SHOW_DEMO_CREDENTIALS !== "false" && process.env.NODE_ENV !== "production" && (
              <div className="mt-6 space-y-3 rounded-lg bg-[#0f172a] p-4 text-xs text-white/70 border border-white/10">
                <div>
                  <p className="mb-1 font-medium text-white">Administrador demo</p>
                  <p>Correo: admin@demo.com</p>
                  <p>Contrasena: demo123</p>
                  <p>Slug: demo</p>
                </div>
                <div className="pt-2">
                  <p className="mb-1 font-medium text-white">Administrador real</p>
                  <p>Correo: admin@real.com</p>
                  <p>Contrasena: demo123</p>
                  <p>Slug: real</p>
                </div>
                <p className="pt-2 text-[11px]">
                  Necesitas ayuda para ingresar? Escribinos a{" "}
                  <span className="font-medium text-white">{DEFAULT_SUPPORT_EMAIL}</span>
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
