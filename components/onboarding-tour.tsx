"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Check, HelpCircle, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

type TourRole = "admin" | "client"

type DemoLimits = {
  uploadsPerDay?: number
  messagesPerDay?: number
  maxSizeMb?: number
  ttlMinutes?: number
}

type TourStep = {
  title: string
  bullets: string[]
  href?: string
  cta?: string
}

export function getTourStorageKeys(role: TourRole, userId?: string | number) {
  const suffix = `${role}_${userId ?? "anon"}`
  return {
    seen: `tour_seen_${suffix}`,
    disabled: `tour_disabled_${suffix}`,
  }
}

export function resetTourPreference(role: TourRole, userId?: string | number) {
  if (typeof window === "undefined") return
  const keys = getTourStorageKeys(role, userId)
  localStorage.removeItem(keys.seen)
  localStorage.removeItem(keys.disabled)
}

const tourContent: Record<TourRole, TourStep[]> = {
  admin: [
    {
      title: "Panel en vivo",
      bullets: [
        "Aqui puedes ver el resumen del dia en la cabecera y las secciones Casos/Actividad con lo mas reciente.",
        "Las alertas se ordenan por casos activos para que priorices rapido.",
      ],
      href: "/admin/dashboard",
      cta: "Abrir panel",
    },
    {
      title: "Clientes y casos",
      bullets: [
        "Aqui puedes buscar y filtrar clientes, y crear uno nuevo con prioridad, tipo de caso y pais.",
        "En cada ficha ves todos sus casos y puedes archivarlos o recuperarlos cuando lo necesites.",
        "Dentro de un caso puedes ajustar etapas, fechas, notas internas y chatear con el cliente.",
      ],
      href: "/admin/clients",
      cta: "Ir a clientes",
    },
    {
      title: "Documentos y eventos",
      bullets: [
        "Aqui revisas documentos del caso: pendiente, en revision, aprobado o reentrega, todo en un mismo lugar.",
        "Puedes registrar eventos con fecha y hora para dejar un historial claro y ordenado.",
        "Los mensajes dentro del caso te dejan hablar con el cliente sin salir del panel.",
      ],
    },
    {
      title: "Archivo seguro",
      bullets: [
        "Cuando cierres un cliente, aqui lo mueves al Archivo para mantener limpio el panel principal.",
        "Desde Archivo puedes restaurar o eliminar definitivamente casos y documentos.",
      ],
      href: "/admin/archive",
      cta: "Ver archivo",
    },
    {
      title: "Plantillas y marca",
      bullets: [
        "En Tipos de caso defines pasos y documentos que se repiten para no armarlos cada vez.",
        "En Configuracion ajustas logo, colores, fuentes, slug y correo de soporte visibles para equipo y clientes.",
      ],
      href: "/admin/settings",
      cta: "Configurar marca",
    },
  ],
  client: [
    {
      title: "Panel y casos",
      bullets: [
        "Aqui ves el avance, estado y proximo vencimiento de tu caso principal.",
        "En Mis casos revisas cada expediente con su progreso y fechas importantes.",
      ],
      href: "/client/dashboard",
      cta: "Ver panel",
    },
    {
      title: "Documentos",
      bullets: [
        "Elige tu caso activo y sube archivos arrastrando o buscandolos desde tu equipo.",
        "En los requeridos ves el estado de cada documento: pendiente, revision, aprobado o reentrega.",
        "Si te piden otra version, usa el boton Subir nueva version en ese documento.",
      ],
      href: "/client/documents",
      cta: "Abrir documentos",
    },
    {
      title: "Mensajes",
      bullets: [
        "Aqui tienes tu bandeja de entrada con mensajes leidos y no leidos.",
        "Abre el hilo para ver el detalle y responder directo al equipo.",
      ],
      href: "/client/messages",
      cta: "Revisar mensajes",
    },
    {
      title: "Perfil y seguridad",
      bullets: [
        "Consulta tu nombre y correo asociados al portal.",
        "Actualiza tu contrasena cuando quieras; si necesitas cambiar datos personales, escribe a soporte.",
      ],
      href: "/client/profile",
      cta: "Ir a perfil",
    },
  ],
}

export function OnboardingTour({
  role,
  userId,
  isDemo = false,
  demoLimits,
}: {
  role: TourRole
  userId?: string | number
  isDemo?: boolean
  demoLimits?: DemoLimits
}) {
  const storageKeys = useMemo(() => getTourStorageKeys(role, userId), [role, userId])
  const [open, setOpen] = useState(false)
  const [hasSeen, setHasSeen] = useState(false)
  const [isDisabled, setIsDisabled] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [dontShowAgain, setDontShowAgain] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return
    const disabled = localStorage.getItem(storageKeys.disabled)
    if (disabled) {
      setIsDisabled(true)
      setHasSeen(true)
      setOpen(false)
      return
    }

    const seen = localStorage.getItem(storageKeys.seen)
    if (!seen) {
      setOpen(true)
      setCurrentStep(0)
    }
    setHasSeen(Boolean(seen))
  }, [storageKeys.disabled, storageKeys.seen])

  const markSeen = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem(storageKeys.seen, "1")
    }
    setHasSeen(true)
    setOpen(false)
  }

  const markDisabled = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem(storageKeys.disabled, "1")
      localStorage.setItem(storageKeys.seen, "1")
    }
    setIsDisabled(true)
    setHasSeen(true)
    setOpen(false)
  }

  const handleFinish = () => {
    if (dontShowAgain) {
      markDisabled()
      return
    }
    markSeen()
  }

  const steps = useMemo(() => {
    const base = tourContent[role]
    if (!isDemo) return base

    const limitsText = [
      `Sube hasta ${demoLimits?.uploadsPerDay ?? 3} archivos al dia (max ${demoLimits?.maxSizeMb ?? 1}MB c/u).`,
      `Solo ${demoLimits?.messagesPerDay ?? 10} mensajes al dia en modo demo.`,
      `Los archivos se eliminan automaticamente despues de ${demoLimits?.ttlMinutes ?? 30} minutos.`,
    ]

    const intro: TourStep = {
      title: "Modo demo y limites",
      bullets: limitsText,
    }

    return [intro, ...base]
  }, [demoLimits?.maxSizeMb, demoLimits?.messagesPerDay, demoLimits?.ttlMinutes, demoLimits?.uploadsPerDay, isDemo, role])

  const isLastStep = currentStep === steps.length - 1
  const progress = Math.round(((currentStep + 1) / steps.length) * 100)

  if (isDisabled) return null

  return (
    <>
      {!open && (
        <div className="fixed bottom-4 right-4 z-[70]">
          <Button
            variant={hasSeen ? "outline" : "default"}
            size="sm"
            className="shadow-lg shadow-primary/20"
            onClick={() => {
              setOpen(true)
              setCurrentStep(0)
              setDontShowAgain(false)
            }}
          >
            <HelpCircle className="mr-2 h-4 w-4" />
            Guia rapida
          </Button>
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-[80]">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" aria-hidden="true" onClick={() => setOpen(false)} />
          <div className="relative z-[81] flex min-h-screen items-center justify-center px-4 py-10">
            <Card className="relative w-full max-w-3xl border-primary/30 bg-background/95 shadow-2xl shadow-primary/20">
              <div className="flex items-start justify-between gap-4 border-b border-border/60 px-6 py-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    Recorrido {role === "admin" ? "admin" : "cliente"}
                  </p>
                  <h3 className="text-xl font-semibold text-foreground">Guia rapida para empezar</h3>
                  <p className="text-xs text-muted-foreground">Pasos simples para que sepas donde ir.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-md p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                  aria-label="Cerrar recorrido"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="relative px-6 pb-6 pt-4">
                <div className="mb-4 h-1 w-full overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
                </div>

                <div className="space-y-3">
                  <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                    Paso {currentStep + 1} de {steps.length}
                  </div>
                  <p className="text-lg font-semibold text-foreground">{steps[currentStep]?.title}</p>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    {steps[currentStep]?.bullets.map((bullet) => (
                      <li key={bullet} className="flex gap-2">
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary/60" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                  {steps[currentStep]?.href && (
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="mt-1 w-fit border-primary/40 text-primary hover:bg-primary/10"
                      onClick={markSeen}
                    >
                      <Link href={steps[currentStep]?.href || "#"}>{steps[currentStep]?.cta || "Abrir seccion"}</Link>
                    </Button>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-3 border-t border-border/60 px-6 py-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-2">
                  {isLastStep && (
                    <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-border text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                        checked={dontShowAgain}
                        onChange={(event) => setDontShowAgain(event.target.checked)}
                      />
                      No mostrar mas este tutorial
                    </label>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
                    Cerrar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentStep((prev) => Math.max(prev - 1, 0))}
                    disabled={currentStep === 0}
                  >
                    Anterior
                  </Button>
                  <Button size="sm" onClick={() => (isLastStep ? handleFinish() : setCurrentStep((prev) => prev + 1))}>
                    {isLastStep ? "Listo" : "Siguiente"}
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}
    </>
  )
}
