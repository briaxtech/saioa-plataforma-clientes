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
  const [error, setError] = useState("")

  useEffect(() => {
    applyBrandingTheme(organization?.branding)
  }, [organization?.branding])

  const heroBackground = useMemo(
    () => ({
      backgroundImage:
        "radial-gradient(circle at 18% 20%, rgba(255,255,255,0.12), transparent 32%), linear-gradient(135deg, var(--hero-from), var(--hero-to))",
      backgroundColor: "var(--hero-from)",
    }),
    [],
  )

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    try {
      await login(email, password, slug)

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
    <div className="flex min-h-screen items-center justify-center px-4 py-10" style={heroBackground}>
      <Card className="w-full max-w-md border border-white/15 bg-white/95 shadow-2xl backdrop-blur">
        <div className="p-8">
          <div className="mb-8 flex flex-col items-center text-center">
            <Logo className="mb-4 w-44" priority />
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
              Portal privado{slug ? ` · ${slug}` : ""}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
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
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-foreground">
                Correo electronico
              </label>
              <Input
                id="email"
                type="email"
                placeholder="equipo@tuagencia.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full"
                autoComplete="email"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-foreground">
                Contrasena
              </label>
              <Input
                id="password"
                type="password"
                placeholder="****************"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full"
                autoComplete="current-password"
              />
            </div>

            <p className="text-xs text-muted-foreground">
              Solo necesitas tu correo y contrasena; detectamos tu organizacion automaticamente.
            </p>

            <Button type="submit" className="mt-6 w-full bg-primary text-primary-foreground hover:bg-primary/90" disabled={isLoading}>
              {isLoading ? "Iniciando sesion..." : "Acceder al portal"}
            </Button>
          </form>

          <div className="mt-6 space-y-3 rounded-lg bg-muted p-4 text-xs text-muted-foreground">
            <div>
              <p className="mb-1 font-medium text-foreground">Administrador demo</p>
              <p>Correo: admin@demo.com</p>
              <p>Contrasena: demo123</p>
            </div>
            <div className="pt-2">
              <p className="mb-1 font-medium text-foreground">Administrador real</p>
              <p>Correo: admin@real.com</p>
              <p>Contrasena: demo123</p>
            </div>
            <p className="pt-2 text-[11px]">
              ?Necesitas ayuda para ingresar? Escribinos a{" "}
              <span className="font-medium text-foreground">{DEFAULT_SUPPORT_EMAIL}</span>
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}
