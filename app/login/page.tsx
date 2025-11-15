"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Logo } from "@/components/logo"
import { useAuth } from "@/lib/auth-context"

export default function LoginPage() {
  const router = useRouter()
  const { login, isLoading } = useAuth()
  const [email, setEmail] = useState("admin@sentirextranjero.com")
  const [password, setPassword] = useState("demo123")
  const [error, setError] = useState("")

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    try {
      await login(email, password)

      const response = await fetch("/api/auth/me")
      const { user } = await response.json()

      if (user.role === "admin" || user.role === "staff") {
        router.push("/admin/dashboard")
      } else {
        router.push("/client/dashboard")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo iniciar sesion. Intentalo de nuevo.")
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#031247] via-[#071f47] to-[#0d2b66] px-4 py-10">
      <Card className="w-full max-w-md border border-white/15 bg-white/95 shadow-2xl backdrop-blur">
        <div className="p-8">
          <div className="mb-8 flex flex-col items-center text-center">
            <Logo className="mb-4 w-44" priority />
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">Portal privado</p>
            <p className="mt-2 text-sm text-muted-foreground">Acompanamos cada expediente de extranjeria en Espana.</p>
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
                placeholder="miembros@sentirextranjero.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full"
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
              />
            </div>

            <Button type="submit" className="mt-6 w-full bg-primary text-primary-foreground hover:bg-primary/90" disabled={isLoading}>
              {isLoading ? "Iniciando sesion..." : "Acceder al portal"}
            </Button>
          </form>

          <div className="mt-6 space-y-3 rounded-lg bg-muted p-4 text-xs text-muted-foreground">
            <div>
              <p className="mb-1 font-medium text-foreground">Equipo Sentir Extranjero</p>
              <p>Correo: admin@sentirextranjero.com</p>
              <p>Contrasena: demo123</p>
            </div>
            <div>
              <p className="mb-1 font-medium text-foreground">Clientes</p>
              <p>Correo: ana.garcia@email.com</p>
              <p>Contrasena: demo123</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
