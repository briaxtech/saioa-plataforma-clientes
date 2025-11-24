"use client"

import { useEffect, useMemo, useState } from "react"
import useSWR from "swr"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Logo } from "@/components/logo"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/lib/auth-context"
import { cn } from "@/lib/utils"
import { api } from "@/lib/api-client"
import { applyBrandingTheme, resolveBranding } from "@/lib/branding"
import { getTourStorageKeys, resetTourPreference } from "@/components/onboarding-tour"
import type { BrandingSettings } from "@/lib/types"

type PaletteForm = {
  primary: string
  accent: string
  background: string
  foreground: string
  card: string
  sidebar: string
  border: string
  muted: string
}

type FormState = {
  name: string
  slug: string
  supportEmail: string
  logoUrl: string
  logoFile: File | null
  palette: PaletteForm
  typography: {
    fontSans: string
    fontHeading: string
  }
}

type FontOption = {
  label: string
  value: string
  sample?: string
}

const COLOR_FIELDS: Array<{ key: keyof PaletteForm; label: string }> = [
  { key: "primary", label: "Color primario" },
  { key: "accent", label: "Color acento" },
  { key: "background", label: "Fondo" },
  { key: "card", label: "Tarjetas" },
  { key: "foreground", label: "Texto base" },
  { key: "sidebar", label: "Barra lateral" },
  { key: "border", label: "Bordes y entradas" },
  { key: "muted", label: "Areas suaves" },
]

const FONT_OPTIONS: FontOption[] = [
  { label: "Geist", value: '"Geist", sans-serif', sample: "Titulos modernos y limpios" },
  { label: "Inter", value: '"Inter", sans-serif', sample: "Textos claros y funcionales" },
  { label: "Poppins", value: '"Poppins", sans-serif', sample: "Redondeada y cercana" },
  { label: "Space Grotesk", value: '"Space Grotesk", sans-serif', sample: "Tecnologica y minimal" },
  { label: "Merriweather", value: '"Merriweather", serif', sample: "Clasica con serifa" },
  { label: "Work Sans", value: '"Work Sans", sans-serif', sample: "Equilibrada para interfaz" },
]

function getReadableTextColor(hex: string) {
  const value = hex?.startsWith("#") ? hex.slice(1) : hex
  if (!value || (value.length !== 6 && value.length !== 3)) {
    return "#0b1a36"
  }

  const normalized = value.length === 3 ? value.split("").map((c) => c + c).join("") : value
  const r = parseInt(normalized.substring(0, 2), 16)
  const g = parseInt(normalized.substring(2, 4), 16)
  const b = parseInt(normalized.substring(4, 6), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255

  return luminance > 0.6 ? "#0b1a36" : "#ffffff"
}

function buildBrandingFromForm(form: FormState): BrandingSettings {
  return {
    logo_url: form.logoUrl,
    palette: {
      primary: form.palette.primary,
      primaryForeground: getReadableTextColor(form.palette.primary),
      accent: form.palette.accent,
      accentForeground: getReadableTextColor(form.palette.accent),
      background: form.palette.background,
      foreground: form.palette.foreground,
      card: form.palette.card,
      cardForeground: getReadableTextColor(form.palette.card),
      sidebar: form.palette.sidebar,
      sidebarForeground: getReadableTextColor(form.palette.sidebar),
      border: form.palette.border,
      muted: form.palette.muted,
      mutedForeground: getReadableTextColor(form.palette.muted),
    },
    typography: {
      fontSans: form.typography.fontSans,
      fontHeading: form.typography.fontHeading,
    },
  }
}

function FontSelector({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (next: string) => void
}) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-foreground">{label}</p>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full justify-between">
          <SelectValue placeholder="Selecciona una fuente" />
        </SelectTrigger>
        <SelectContent>
          {FONT_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value} className="flex flex-col items-start">
              <span style={{ fontFamily: option.value }} className="text-sm font-semibold text-foreground">
                {option.label}
              </span>
              {option.sample && (
                <span style={{ fontFamily: option.value }} className="text-[11px] text-muted-foreground">
                  {option.sample}
                </span>
              )}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

export default function SettingsPage() {
  const defaultBranding = useMemo(() => resolveBranding(), [])
  const { user } = useAuth()

  const [formState, setFormState] = useState<FormState>({
    name: "",
    slug: "",
    supportEmail: "",
    logoUrl: "",
    logoFile: null,
    palette: {
      primary: defaultBranding.palette.primary,
      accent: defaultBranding.palette.accent,
      background: defaultBranding.palette.background,
      foreground: defaultBranding.palette.foreground,
      card: defaultBranding.palette.card,
      sidebar: defaultBranding.palette.sidebar,
      border: defaultBranding.palette.border,
      muted: defaultBranding.palette.muted,
    },
    typography: {
      fontSans: defaultBranding.typography.fontSans,
      fontHeading: defaultBranding.typography.fontHeading,
    },
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

    const resolvedBranding = resolveBranding({
      ...(organization.branding || {}),
      logo_url: organization.branding?.logo_url || organization.logo_url,
    })

    setFormState({
      name: organization.name || "",
      slug: organization.slug || "",
      supportEmail: organization.support_email || "",
      logoUrl: organization.logo_url || organization.branding?.logo_url || "",
      logoFile: null,
      palette: {
        primary: resolvedBranding.palette.primary,
        accent: resolvedBranding.palette.accent,
        background: resolvedBranding.palette.background,
        foreground: resolvedBranding.palette.foreground,
        card: resolvedBranding.palette.card,
        sidebar: resolvedBranding.palette.sidebar,
        border: resolvedBranding.palette.border,
        muted: resolvedBranding.palette.muted,
      },
      typography: {
        fontSans: resolvedBranding.typography.fontSans,
        fontHeading: resolvedBranding.typography.fontHeading,
      },
    })
  }, [organization])

  useEffect(() => {
    applyBrandingTheme(buildBrandingFromForm(formState))
  }, [formState])

  useEffect(() => {
    if (typeof window === "undefined") return
    const keys = getTourStorageKeys("admin", user?.id)
    setTourDisabled(Boolean(localStorage.getItem(keys.disabled)))
  }, [user?.id])

  const handleColorChange = (key: keyof PaletteForm, value: string) => {
    setFormState((prev) => ({
      ...prev,
      palette: {
        ...prev.palette,
        [key]: value,
      },
    }))
  }

  const handleTypographyChange = (key: "fontSans" | "fontHeading", value: string) => {
    setFormState((prev) => ({
      ...prev,
      typography: {
        ...prev.typography,
        [key]: value,
      },
    }))
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setStatus("")
    setError("")
    setIsSaving(true)

    try {
      const brandingPayload = buildBrandingFromForm(formState)

      if (formState.logoFile) {
        const form = new FormData()
        form.append("name", formState.name.trim())
        form.append("slug", formState.slug.trim())
        form.append("support_email", formState.supportEmail.trim())
        form.append("logo_url", formState.logoUrl.trim())
        form.append("branding", JSON.stringify(brandingPayload))
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
          branding: brandingPayload,
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
        <p className="text-muted-foreground mt-2">Personaliza el espacio de tu organizacion y el portal de clientes.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr,1fr]">
        <Card className="p-6 space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Identidad</h2>
            <p className="text-sm text-muted-foreground">Nombre, slug publico, correo de soporte y logo principal.</p>
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
              <p className="mt-1 text-xs text-muted-foreground">Tus usuarios ingresan en /{formState.slug || "tu-agencia"}/login</p>
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

        <Card className="p-6 space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Colores y fuentes</h2>
            <p className="text-sm text-muted-foreground">Define la paleta que veran tu equipo y tus clientes.</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {COLOR_FIELDS.map(({ key, label }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-foreground">{label}</label>
                <div className="mt-2 flex items-center gap-3">
                  <Input
                    type="color"
                    value={formState.palette[key]}
                    onChange={(event) => handleColorChange(key, event.target.value)}
                    className="h-10 w-16 cursor-pointer p-1"
                  />
                  <Input
                    value={formState.palette[key]}
                    onChange={(event) => handleColorChange(key, event.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="grid gap-6">
            <FontSelector
              label="Fuente base"
              value={formState.typography.fontSans}
              onChange={(next) => handleTypographyChange("fontSans", next)}
            />
            <FontSelector
              label="Fuente de titulos"
              value={formState.typography.fontHeading}
              onChange={(next) => handleTypographyChange("fontHeading", next)}
            />
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr,1fr]">
        <Card className="p-6 space-y-4" style={{ fontFamily: formState.typography.fontSans }}>
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2
                className="text-lg font-semibold text-foreground"
                style={{ fontFamily: formState.typography.fontHeading }}
              >
                Vista previa rapida
              </h2>
              <p className="text-sm text-muted-foreground">Asi se vera el portal con la paleta elegida.</p>
            </div>
            <Logo className="w-36" src={formState.logoUrl || undefined} />
          </div>

          <div
            className="rounded-2xl border border-border bg-card p-4 shadow-sm"
            style={{ fontFamily: formState.typography.fontSans }}
          >
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Panel</p>
                <p
                  className="text-lg font-semibold text-foreground"
                  style={{ fontFamily: formState.typography.fontHeading }}
                >
                  Dashboard clientes
                </p>
              </div>
              <span className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">Activo</span>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-border bg-background p-3">
                <p
                  className="text-sm font-semibold text-foreground"
                  style={{ fontFamily: formState.typography.fontHeading }}
                >
                  Tarjetas
                </p>
                <p className="text-xs text-muted-foreground">Estados, KPI y graficos usan los colores primarios.</p>
              </div>
              <div className="rounded-xl border border-border bg-background p-3">
                <p
                  className="text-sm font-semibold text-foreground"
                  style={{ fontFamily: formState.typography.fontHeading }}
                >
                  Mensajes y docs
                </p>
                <p className="text-xs text-muted-foreground">Las CTA usan Primario/Acento.</p>
              </div>
            </div>
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
          {isSaving ? "Guardando..." : "Guardar marca"}
        </Button>
        {status && <span className="text-sm text-emerald-600">{status}</span>}
        {error && <span className="text-sm text-destructive">{error}</span>}
      </div>
    </form>
  )
}
