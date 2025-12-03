"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

export default function SuperAdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError("")
    setLoading(true)
    try {
      const res = await fetch("/api/superadmin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error((data as any)?.error || "No se pudo iniciar sesion")
      router.replace("/superadmin")
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo iniciar sesion")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#0f172a] via-[#0b1224] to-[#020617] px-4">
      <Card className="w-full max-w-md border border-white/5 bg-white/5 p-8 text-white shadow-2xl shadow-cyan-500/20 backdrop-blur-xl">
        <div className="mb-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-200/90">SuperAdmin</p>
          <h1 className="mt-2 text-2xl font-bold text-white">Acceso propietario</h1>
          <p className="text-sm text-white/70">Gestiona organizaciones y accesos globales.</p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-300/30 bg-red-500/10 p-3 text-sm text-red-100">
            {error}
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-white">Email</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="owner@saas.com"
              className="border-white/20 bg-white/5 text-white placeholder:text-white/60"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-white">Contrasena</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="********"
              className="border-white/20 bg-white/5 text-white placeholder:text-white/60"
            />
          </div>
          <Button type="submit" className="w-full bg-white text-foreground hover:bg-white/90" disabled={loading}>
            {loading ? "Ingresando..." : "Entrar"}
          </Button>
        </form>
      </Card>
    </div>
  )
}
