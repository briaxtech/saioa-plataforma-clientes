"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Building2, CalendarClock, Flag, Mail, RefreshCw, Shield, ShieldCheck, Timer, TriangleAlert } from "lucide-react"
import { superadminFetch } from "@/lib/superadmin-client"

interface OrganizationDetailResponse {
  organization: {
    id: string
    name: string
    slug: string
    domain?: string | null
    is_active: boolean
    created_at?: string
    last_activity_at?: string | null
  }
  summary: {
    admins: number
    staff: number
    clients: number
    clientCount: number
    caseCount: number
  }
  cases: {
    caseCount: number
    casesByStatus: Array<{ status: string; count: number }>
    casesByLifecycle: Array<{ lifecycle_status: string; count: number }>
    casesByType: Array<{ case_type: string; count: number }>
    openCases: number
    avgCaseDurationDays: number | null
    upcomingDeadlines: Array<{ id: number; title: string; status: string; deadline_date?: string | null; case_type?: string }>
    overdueCases: Array<{ id: number; title: string; status: string; deadline_date?: string | null; case_type?: string }>
  }
  documents: {
    totalDocuments: number
    requiredDocuments: number
    pendingRequiredDocuments: number
    pendingDocuments: number
    documentsByStatus: Array<{ status: string; count: number }>
    averageRequiredPerCase: number
  }
  messaging: {
    messagesLast30Days: number
    readRateLast30Days: number
    casesWithoutRecentMessagesCount: number
    casesWithoutRecentMessages: Array<{ id: number; title: string; status: string; deadline_date?: string | null }>
  }
  keyDates: {
    activeKeyDates: number
    remindersScheduled: number
    remindersSentLast30Days: number
    remindersWithErrors: number
  }
}

export default function OrganizationDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const organizationId = params?.id

  const [data, setData] = useState<OrganizationDetailResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const formatDate = (value?: string | null) => {
    if (!value) return "-"
    try {
      return new Date(value).toLocaleDateString("es-ES", { year: "numeric", month: "short", day: "numeric" })
    } catch {
      return value
    }
  }

  const load = async () => {
    if (!organizationId) return
    try {
      setLoading(true)
      const res = await superadminFetch(`/api/superadmin/organizations/${organizationId}`)
      setData(res as OrganizationDetailResponse)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron cargar los detalles")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizationId])

  if (!organizationId) {
    return <div className="p-4 text-sm text-muted-foreground">No se encontro el identificador de la organizacion.</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">SuperAdmin</p>
          <h1 className="text-2xl font-bold text-foreground">Organizacion</h1>
          <p className="text-sm text-muted-foreground">Panel detallado de un tenant individual.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => router.push("/superadmin/organizations")}>
            Volver
          </Button>
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className="mr-2 h-4 w-4" />
            {loading ? "Actualizando..." : "Refrescar"}
          </Button>
        </div>
      </div>

      {error && <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>}

      <Card className="p-4 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-bold text-foreground">{data?.organization.name || "..."}</h2>
              <span
                className={`rounded-full px-2 py-1 text-xs font-semibold ${
                  data?.organization.is_active ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-800"
                }`}
              >
                {data?.organization.is_active ? "Activo" : "Inactivo"}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              {data?.organization.domain || data?.organization.slug} · Creado {formatDate(data?.organization.created_at)}
            </p>
            <p className="text-xs text-muted-foreground">
              Ultima actividad: {formatDate(data?.organization.last_activity_at)}
            </p>
          </div>
          <div className="flex flex-wrap gap-3 text-sm">
            <div className="rounded-xl bg-muted/60 px-3 py-2">Admins: {data?.summary.admins ?? "—"}</div>
            <div className="rounded-xl bg-muted/60 px-3 py-2">Staff: {data?.summary.staff ?? "—"}</div>
            <div className="rounded-xl bg-muted/60 px-3 py-2">Clientes: {data?.summary.clients ?? "—"}</div>
            <div className="rounded-xl bg-muted/60 px-3 py-2">Casos: {data?.summary.caseCount ?? "—"}</div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4 sm:p-5">
          <p className="text-sm text-muted-foreground">Casos abiertos</p>
          <p className="mt-2 text-3xl font-bold text-foreground">{data?.cases.openCases ?? "—"}</p>
          <p className="text-xs text-muted-foreground">Status distintos a completado/rechazado.</p>
        </Card>
        <Card className="p-4 sm:p-5">
          <p className="text-sm text-muted-foreground">Duracion promedio</p>
          <p className="mt-2 text-3xl font-bold text-foreground">
            {data?.cases.avgCaseDurationDays ? `${data.cases.avgCaseDurationDays.toFixed(1)}d` : "—"}
          </p>
          <p className="text-xs text-muted-foreground">Desde creacion a cierre.</p>
        </Card>
        <Card className="p-4 sm:p-5">
          <p className="text-sm text-muted-foreground">Documentos requeridos</p>
          <p className="mt-2 text-3xl font-bold text-foreground">{data?.documents.requiredDocuments ?? "—"}</p>
          <p className="text-xs text-muted-foreground">Pendientes: {data?.documents.pendingRequiredDocuments ?? "—"}</p>
        </Card>
        <Card className="p-4 sm:p-5">
          <p className="text-sm text-muted-foreground">Mensajes 30d</p>
          <p className="mt-2 text-3xl font-bold text-foreground">{data?.messaging.messagesLast30Days ?? "—"}</p>
          <p className="text-xs text-muted-foreground">Lectura: {data ? `${data.messaging.readRateLast30Days}%` : "—"}</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold">Casos por status</h3>
              <p className="text-sm text-muted-foreground">Distribucion general para este tenant.</p>
            </div>
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div className="mt-4 space-y-2">
            {(data?.cases.casesByStatus || []).map((item) => (
              <div key={item.status} className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2">
                <span className="text-sm capitalize text-foreground">{item.status.replace("_", " ")}</span>
                <span className="text-sm font-semibold">{item.count}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold">Casos por lifecycle / tipo</h3>
              <p className="text-sm text-muted-foreground">Resumido por lifecycle_status y case_type.</p>
            </div>
            <ShieldCheck className="h-5 w-5 text-primary" />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div className="space-y-2 rounded-lg border border-border/60 p-3">
              <p className="text-xs font-semibold text-muted-foreground">Lifecycle</p>
              {(data?.cases.casesByLifecycle || []).map((item) => (
                <div key={item.lifecycle_status} className="flex items-center justify-between text-sm">
                  <span className="capitalize">{item.lifecycle_status.replace("_", " ")}</span>
                  <span className="font-semibold">{item.count}</span>
                </div>
              ))}
            </div>
            <div className="space-y-2 rounded-lg border border-border/60 p-3">
              <p className="text-xs font-semibold text-muted-foreground">Tipo</p>
              {(data?.cases.casesByType || []).map((item) => (
                <div key={item.case_type} className="flex items-center justify-between text-sm">
                  <span className="capitalize">{item.case_type.replace("_", " ")}</span>
                  <span className="font-semibold">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold">Fechas limite (prox. 30d)</h3>
              <p className="text-sm text-muted-foreground">Fechas criticas próximas y vencidas.</p>
            </div>
            <CalendarClock className="h-5 w-5 text-primary" />
          </div>
          <div className="mt-4 space-y-2">
            {(data?.cases.upcomingDeadlines || []).map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2">
                <div className="space-y-1">
                  <p className="text-sm font-semibold">{item.title}</p>
                  <p className="text-xs text-muted-foreground">Vence: {formatDate(item.deadline_date)}</p>
                </div>
                <span className="text-xs font-semibold text-foreground">{item.status}</span>
              </div>
            ))}
            {(data?.cases.upcomingDeadlines || []).length === 0 && <p className="text-sm text-muted-foreground">Sin fechas proximas.</p>}
          </div>
          <div className="mt-4 space-y-2 rounded-lg border border-border/60 bg-amber-50/60 p-3 text-xs text-amber-800">
            <p className="font-semibold">Atrasados</p>
            {(data?.cases.overdueCases || []).map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-2 rounded-lg bg-white/60 px-2 py-1">
                <span className="text-foreground">{item.title}</span>
                <span className="text-[11px] font-semibold text-amber-700">{formatDate(item.deadline_date)}</span>
              </div>
            ))}
            {(data?.cases.overdueCases || []).length === 0 && <p>No hay casos atrasados.</p>}
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold">Documentos</h3>
              <p className="text-sm text-muted-foreground">Estado general de documentos cargados.</p>
            </div>
            <Flag className="h-5 w-5 text-primary" />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-muted/40 p-3">
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-2xl font-bold">{data?.documents.totalDocuments ?? "—"}</p>
            </div>
            <div className="rounded-lg bg-muted/40 p-3">
              <p className="text-xs text-muted-foreground">Promedio requeridos / caso</p>
              <p className="text-2xl font-bold">
                {data ? data.documents.averageRequiredPerCase.toFixed(1) : "—"}
              </p>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            {(data?.documents.documentsByStatus || []).map((item) => (
              <div key={item.status} className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2 text-sm">
                <span className="capitalize">{item.status.replace("_", " ")}</span>
                <span className="font-semibold">{item.count}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold">Mensajeria</h3>
              <p className="text-sm text-muted-foreground">Interaccion reciente y casos silenciosos.</p>
            </div>
            <Mail className="h-5 w-5 text-primary" />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-muted/40 p-3">
              <p className="text-xs text-muted-foreground">Msgs 30d</p>
              <p className="text-2xl font-bold">{data?.messaging.messagesLast30Days ?? "—"}</p>
            </div>
            <div className="rounded-lg bg-muted/40 p-3">
              <p className="text-xs text-muted-foreground">Lectura 30d</p>
              <p className="text-2xl font-bold">
                {data ? `${data.messaging.readRateLast30Days}%` : "—"}
              </p>
            </div>
          </div>
          <div className="mt-4 rounded-lg border border-border/60 bg-muted/30 p-3 text-sm">
            Casos sin mensajes recientes (14d): <strong>{data?.messaging.casesWithoutRecentMessagesCount ?? "—"}</strong>
          </div>
          <div className="mt-3 grid gap-2">
            {(data?.messaging.casesWithoutRecentMessages || []).slice(0, 6).map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2 text-xs">
                <span className="font-semibold text-foreground">{item.title}</span>
                <span className="text-muted-foreground">{item.status}</span>
              </div>
            ))}
            {(data?.messaging.casesWithoutRecentMessages || []).length === 0 && (
              <p className="text-xs text-muted-foreground">Todos los casos tienen comunicacion reciente.</p>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold">Fechas clave & recordatorios</h3>
              <p className="text-sm text-muted-foreground">Alertas configuradas y errores.</p>
            </div>
            <Timer className="h-5 w-5 text-primary" />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-muted/40 p-3">
              <p className="text-xs text-muted-foreground">Fechas activas</p>
              <p className="text-2xl font-bold">{data?.keyDates.activeKeyDates ?? "—"}</p>
            </div>
            <div className="rounded-lg bg-muted/40 p-3">
              <p className="text-xs text-muted-foreground">Recordatorios</p>
              <p className="text-2xl font-bold">{data?.keyDates.remindersScheduled ?? "—"}</p>
            </div>
            <div className="rounded-lg bg-muted/40 p-3">
              <p className="text-xs text-muted-foreground">Enviados 30d</p>
              <p className="text-2xl font-bold">{data?.keyDates.remindersSentLast30Days ?? "—"}</p>
            </div>
            <div className="rounded-lg bg-amber-50/60 p-3">
              <p className="text-xs text-amber-800">Errores</p>
              <p className="text-2xl font-bold text-amber-800">{data?.keyDates.remindersWithErrors ?? "—"}</p>
              <div className="mt-1 flex items-center gap-1 text-[11px] text-amber-800">
                <TriangleAlert className="h-3 w-3" /> Revise logs de recordatorios
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
