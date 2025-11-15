"use client"

import Link from "next/link"
import useSWR from "swr"
import { LifeBuoy, MessageSquare, Upload, UserRound } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { api } from "@/lib/api-client"

export default function ClientDashboard() {
  const { data: casesData } = useSWR("/api/cases", () => api.getCases())

  const cases = casesData?.cases || []
  const mainCase = cases[0]

  const { data: caseDetail } = useSWR(mainCase ? `/api/cases/${mainCase.id}` : null, () =>
    mainCase ? api.getCase(mainCase.id) : null,
  )

  const timeline = caseDetail?.case?.milestones || []

  if (!mainCase) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Bienvenido de nuevo a Sentir Extranjero</h1>
          <p className="mt-2 text-muted-foreground">Aqui encontraremos toda la informacion clave de tu tramite.</p>
        </div>
        <Card className="animate-pulse p-8">
          <div className="h-48 rounded bg-muted" />
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Bienvenido de nuevo a Sentir Extranjero</h1>
        <p className="mt-2 text-muted-foreground">Aqui veras el estado de tus gestiones y las acciones prioritarias.</p>
      </div>

      {/* Main Case Card */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 p-6 sm:p-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <div>
            <h2 className="mb-4 text-xl font-semibold text-foreground">Tu proceso en Espana</h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Numero de caso</p>
                <p className="font-semibold text-foreground">{mainCase.case_number}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tipo de caso</p>
                <p className="font-semibold capitalize text-foreground">{mainCase.case_type?.replace("_", " ")}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Estado actual</p>
                <p className="font-semibold capitalize text-primary">{mainCase.status?.replace("_", " ")}</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <p className="mb-2 text-sm text-muted-foreground">Progreso general</p>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-foreground">Avance</span>
                  <span className="text-sm font-bold text-primary">{mainCase.progress_percentage}%</span>
                </div>
                <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${mainCase.progress_percentage}%` }}
                  />
                </div>
              </div>
            </div>

            {mainCase.deadline_date && (
              <div className="pt-2">
                <p className="mb-1 text-sm text-muted-foreground">Proximo vencimiento</p>
                <p className="font-semibold text-foreground">{new Date(mainCase.deadline_date).toLocaleDateString()}</p>
              </div>
            )}

            <Link href="/client/cases">
              <Button className="mt-4 w-full bg-primary hover:bg-primary/90">Ver detalles completos</Button>
            </Link>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Timeline */}
        <div className="lg:col-span-2">
          <Card className="p-6">
            <h3 className="mb-6 text-lg font-semibold text-foreground">Cronologia del caso</h3>
            <div className="space-y-4">
              {timeline.map((item: any, index: number) => (
                <div key={item.id} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`h-3 w-3 rounded-full ${item.completed ? "bg-accent" : "bg-muted"}`} />
                    {index < timeline.length - 1 && <div className="my-1 h-12 w-0.5 bg-border" />}
                  </div>
                  <div className="pb-4">
                    <p className="text-sm font-medium text-foreground">{item.title}</p>
                    {item.description && <p className="mt-1 text-xs text-muted-foreground">{item.description}</p>}
                    {item.due_date && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {new Date(item.due_date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Attorney Contact */}
        <Card className="p-6">
          <h3 className="mb-4 text-lg font-semibold text-foreground">Tu abogado</h3>
          <div className="space-y-4">
            <div>
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <UserRound className="h-6 w-6" />
              </div>
              <h4 className="font-semibold text-foreground">{mainCase.staff_name || "Sin asignar"}</h4>
            </div>
            <Link href="/client/messages">
              <Button variant="outline" className="w-full bg-transparent">
                Enviar mensaje
              </Button>
            </Link>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Link href="/client/documents">
          <Card className="h-full cursor-pointer p-6 transition hover:bg-muted/50">
            <Upload className="mb-3 h-6 w-6 text-primary" />
            <h3 className="mb-1 font-semibold text-foreground">Subir documentos</h3>
            <p className="text-sm text-muted-foreground">Envia los documentos requeridos para tu caso</p>
          </Card>
        </Link>

        <Link href="/client/messages">
          <Card className="h-full cursor-pointer p-6 transition hover:bg-muted/50">
            <MessageSquare className="mb-3 h-6 w-6 text-primary" />
            <h3 className="mb-1 font-semibold text-foreground">Mensajes</h3>
            <p className="text-sm text-muted-foreground">Comunicate con tu abogado</p>
          </Card>
        </Link>

        <Card className="h-full p-6">
          <LifeBuoy className="mb-3 h-6 w-6 text-primary" />
          <h3 className="mb-1 font-semibold text-foreground">Soporte</h3>
          <p className="text-sm text-muted-foreground">Contactanos para recibir ayuda</p>
        </Card>
      </div>
    </div>
  )
}
