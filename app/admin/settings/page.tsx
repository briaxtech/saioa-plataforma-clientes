"use client"

import { useEffect, useState } from "react"
import useSWR from "swr"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Logo } from "@/components/logo"
import { useAuth } from "@/lib/auth-context"
import { api } from "@/lib/api-client"
import { applyBrandingTheme, resolveBranding } from "@/lib/branding"
import { getTourStorageKeys, resetTourPreference } from "@/components/onboarding-tour"

type FormState = {
  name: string
  slug: string
  supportEmail: string
  logoUrl: string
  logoFile: File | null
}

export default function SettingsPage() {
  const { user } = useAuth()

  const [formState, setFormState] = useState<FormState>({
    name: "",
    slug: "",
    supportEmail: "",
    logoUrl: "",
    logoFile: null,
  })
  const [status, setStatus] = useState<string>("")
  const [error, setError] = useState<string>("")
  const [isSaving, setIsSaving] = useState(false)
  const [tourStatus, setTourStatus] = useState<string>("")
  const [tourDisabled, setTourDisabled] = useState<boolean>(false)

  const { data, isLoading, mutate } = useSWR("/api/settings/organization", api.getOrganizationSettings)
  const organization = data?.organization

  useEffect(() => {
    if (!organization) return
    const branding = resolveBranding({
      logo_url: organization.branding?.logo_url || organization.logo_url,
    })
    applyBrandingTheme(branding)
    setFormState({
      name: organization.name || "",
      slug: organization.slug || "",
      supportEmail: organization.support_email || "",
      logoUrl: organization.logo_url || organization.branding?.logo_url || "",
      logoFile: null,
    })
  }, [organization])

  useEffect(() => {
    if (typeof window === "undefined") return
    const keys = getTourStorageKeys("admin", user?.id)
    setTourDisabled(Boolean(localStorage.getItem(keys.disabled)))
  }, [user?.id])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setStatus("")
    setError("")
    setIsSaving(true)

    try {
      if (formState.logoFile) {
        const form = new FormData()
        form.append("name", formState.name.trim())
        form.append("slug", formState.slug.trim())
        form.append("support_email", formState.supportEmail.trim())
        form.append("logo_url", formState.logoUrl.trim())
        form.append("logo_file", formState.logoFile)

        await fetch("/api/settings/organization", {
          method: "PATCH",
          body: form,
        }).then(async (res) => {
          if (!res.ok) {
            const error = await res.json().catch(() => ({}))
            throw new Error(error.error || "No se pudo guardar la configuracion")
          }
        })
      } else {
        const payload = {
          name: formState.name.trim(),
          slug: formState.slug.trim(),
          support_email: formState.supportEmail.trim(),
          logo_url: formState.logoUrl.trim(),
        }
        await api.updateOrganizationSettings(payload)
      }

      await mutate()
      setStatus("Cambios guardados correctamente.")
      setFormState((prev) => ({ ...prev, logoFile: null }))
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron guardar los cambios.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleResetTour = () => {
    if (typeof window === "undefined") return
    resetTourPreference("admin", user?.id)
    setTourDisabled(false)
    setTourStatus("Tutorial habilitado de nuevo. Se mostrara al entrar al dashboard.")
    setTimeout(() => setTourStatus(""), 4000)
  }

  if (isLoading && !organization) {
    return <div className="text-muted-foreground">Cargando configuracion...</div>
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Configuracion</h1>
        <p className="text-muted-foreground mt-2">
          Unificamos la interfaz con el look de la home. Solo puedes actualizar tu identidad y logo.
        </p>
      </div>

      <Card className="p-6 space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Identidad</h2>
          <p className="text-sm text-muted-foreground">
            Nombre, slug publico, correo de soporte y logo principal para emails y portal.
          </p>
        </div>

        <div className="space-y-4">
          <label className="block text-sm font-medium text-foreground">
            Nombre de la organizacion
            <Input
              className="mt-2"
              value={formState.name}
              onChange={(event) => setFormState((prev) => ({ ...prev, name: event.target.value }))}
              placeholder="Ej: Agencia Demo"
            />
          </label>

          <label className="block text-sm font-medium text-foreground">
            Slug / subdominio
            <Input
              className="mt-2"
              value={formState.slug}
              onChange={(event) => setFormState((prev) => ({ ...prev, slug: event.target.value }))}
              placeholder="tu-agencia"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Tus usuarios ingresan en /{formState.slug || "tu-agencia"}/login
            </p>
          </label>

          <label className="block text-sm font-medium text-foreground">
            Correo de soporte
            <Input
              type="email"
              className="mt-2"
              value={formState.supportEmail}
              onChange={(event) => setFormState((prev) => ({ ...prev, supportEmail: event.target.value }))}
              placeholder="soporte@tu-dominio.com"
            />
          </label>

          <label className="block text-sm font-medium text-foreground">
            Logo (URL publica)
            <Input
              type="url"
              className="mt-2"
              value={formState.logoUrl}
              onChange={(event) => setFormState((prev) => ({ ...prev, logoUrl: event.target.value }))}
              placeholder="https://.../logo.png"
            />
          </label>

          <label className="block text-sm font-medium text-foreground">
            O sube un archivo
            <Input
              type="file"
              accept="image/*"
              className="mt-2"
              onChange={(event) => {
                const file = event.target.files?.[0]
                setFormState((prev) => ({
                  ...prev,
                  logoFile: file || null,
                }))
              }}
            />
            {formState.logoFile && (
              <p className="mt-1 text-xs text-muted-foreground">Archivo seleccionado: {formState.logoFile.name}</p>
            )}
          </label>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1.2fr,1fr]">
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Vista previa</h2>
              <p className="text-sm text-muted-foreground">
                La paleta y tipografia son fijas para que todo el producto siga el estilo de la home.
              </p>
            </div>
            <Logo className="w-36" src={formState.logoUrl || undefined} />
          </div>

          <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Panel</p>
            <p className="text-lg font-semibold text-foreground">Dashboard clientes</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Los colores se mantienen consistentes con la landing. Solo cambia tu logo en cabeceras, emails y portal.
            </p>
          </div>
        </Card>
      </div>

      <Card className="p-6 space-y-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold text-foreground">Tutorial guiado</h2>
          <p className="text-sm text-muted-foreground">
            Reactiva el recorrido modal si lo ocultaste. Solo afecta a tu usuario en este navegador.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" variant="outline" onClick={handleResetTour}>
            Re-habilitar tutorial
          </Button>
          <span className="text-sm text-muted-foreground">
            Estado: {tourDisabled ? "oculto hasta re-habilitar" : "se mostrara si no se completo"}
          </span>
          {tourStatus && <span className="text-sm text-emerald-600">{tourStatus}</span>}
        </div>
      </Card>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90" disabled={isSaving}>
          {isSaving ? "Guardando..." : "Guardar cambios"}
        </Button>
        {status && <span className="text-sm text-emerald-600">{status}</span>}
        {error && <span className="text-sm text-destructive">{error}</span>}
      </div>
    </form>
  )
}
