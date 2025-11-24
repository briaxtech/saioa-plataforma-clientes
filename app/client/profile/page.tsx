"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/lib/auth-context"
import { api } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"

const DEFAULT_SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "soporte@demo.com"

export default function ProfilePage() {
  const { user, organization } = useAuth()
  const { toast } = useToast()
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!form.currentPassword || !form.newPassword || !form.confirmPassword) {
      toast({ title: "Completa todos los campos", variant: "destructive" })
      return
    }

    if (form.newPassword !== form.confirmPassword) {
      toast({ title: "Las contrasenas no coinciden", variant: "destructive" })
      return
    }

    setIsSubmitting(true)
    try {
      await api.changePassword({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      })
      toast({ title: "Contrasena actualizada" })
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" })
    } catch (error: any) {
      toast({
        title: "No pudimos actualizar la contrasena",
        description: error?.message || "Intenta nuevamente.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Perfil y seguridad</h1>
        <p className="mt-2 text-muted-foreground">Actualiza tu contrasena y consulta los datos basicos de tu cuenta.</p>
      </div>

      <Card className="p-6">
        <h2 className="mb-6 text-lg font-semibold text-foreground">Datos de la cuenta</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-muted-foreground">Nombre completo</label>
            <Input value={user?.name || "Sin dato"} disabled />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-muted-foreground">Correo</label>
            <Input value={user?.email || "Sin dato"} disabled />
          </div>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          Si necesitas actualizar tus datos personales, escribinos a {organization?.support_email || DEFAULT_SUPPORT_EMAIL} para
          que podamos ayudarte.
        </p>
      </Card>

      <Card className="p-6">
        <h2 className="mb-6 text-lg font-semibold text-foreground">Cambiar contrasena</h2>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-muted-foreground">Contrasena actual</label>
            <Input
              type="password"
              autoComplete="current-password"
              value={form.currentPassword}
              onChange={(event) => handleChange("currentPassword", event.target.value)}
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-muted-foreground">Nueva contrasena</label>
              <Input
                type="password"
                autoComplete="new-password"
                value={form.newPassword}
                onChange={(event) => handleChange("newPassword", event.target.value)}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-muted-foreground">Confirmar contrasena</label>
              <Input
                type="password"
                autoComplete="new-password"
                value={form.confirmPassword}
                onChange={(event) => handleChange("confirmPassword", event.target.value)}
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            La contrasena debe tener al menos 8 caracteres, combinando letras y numeros. Puedes cambiarla cuando quieras desde
            esta pantalla.
          </p>
          <Button type="submit" className="mt-2" disabled={isSubmitting}>
            {isSubmitting ? "Guardando..." : "Actualizar contrasena"}
          </Button>
        </form>
      </Card>
    </div>
  )
}
