"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import useSWR from "swr"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Mail, Phone, MapPin, Users, FileText, Calendar, Clock, FolderOpen, ArrowUpRight } from "lucide-react"
import { apiClient } from "@/lib/api-client"

const PRIORITY_BADGE_STYLES: Record<string, string> = {
  low: "border-emerald-200 bg-emerald-50 text-emerald-700",
  medium: "border-sky-200 bg-sky-50 text-sky-700",
  high: "border-amber-200 bg-amber-50 text-amber-700",
  urgent: "border-rose-200 bg-rose-50 text-rose-700",
  default: "border-border bg-muted text-muted-foreground",
}

const formatDate = (value?: string | null) => {
  if (!value) return "Sin fecha"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "Sin fecha"
  return date.toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" })
}

const formatLabel = (value?: string | null) => {
  if (!value) return "Sin dato"
  return value
    .toString()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

const clampProgress = (value?: number | null) => {
  const parsed = typeof value === "number" ? value : Number(value ?? 0)
  if (Number.isNaN(parsed)) return 0
  return Math.min(100, Math.max(0, parsed))
}

export default function ClientDetailPage() {
  const params = useParams<{ clientId: string }>()
  const clientId = Array.isArray(params?.clientId) ? params?.clientId[0] : params?.clientId

  const { data, isLoading } = useSWR(clientId ? `/api/clients/${clientId}` : null, (url: string) => apiClient.get(url))
  const client = data?.client
  const cases = Array.isArray(client?.cases) ? client?.cases : []
  const primaryCase = cases[0]

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-32 animate-pulse rounded bg-muted" />
        <div className="h-64 animate-pulse rounded-xl bg-muted" />
      </div>
    )
  }

  if (!client) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-lg font-semibold text-foreground">No encontramos este cliente.</p>
        <Link href="/admin/clients">
          <Button variant="outline">Volver</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <Link href="/admin/clients" className="text-sm font-semibold text-primary">
            Volver a clientes
          </Link>
          <h1 className="mt-3 text-3xl font-semibold text-foreground">{client.name}</h1>
          <p className="text-sm text-muted-foreground">Cliente #{client.user_id || client.id}</p>
        </div>
        {primaryCase && client.id && (
          <Link href={`/admin/clients/${client.id}/cases/${primaryCase.id}`}>
            <Button>Ver expediente</Button>
          </Link>
        )}
        {client.notes && (
          <Badge variant="secondary" className="self-start text-xs uppercase">
            Notas activas
          </Badge>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6 space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Informacion de contacto</h2>
          <div className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              {client.email}
            </div>
            {client.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                {client.phone}
              </div>
            )}
            {client.country_of_origin && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {client.country_of_origin}
              </div>
            )}
            {client.staff_name && (
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Responsable: {client.staff_name}
              </div>
            )}
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Notas internas</h2>
          {client.notes ? (
            <p className="text-sm text-muted-foreground">{client.notes}</p>
          ) : (
            <p className="text-sm text-muted-foreground">Sin notas registradas.</p>
          )}
        </Card>
      </div>

      <Card className="space-y-5 p-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Casos asociados</h2>
          <p className="text-sm text-muted-foreground">
            {cases.length === 0 ? "No hay expedientes para este cliente" : `Gestionando ${cases.length} expediente(s)`}
          </p>
        </div>

        {cases.length === 0 ? (
          <p className="text-sm text-muted-foreground">Este cliente todavia no tiene casos activos.</p>
        ) : (
          <div className="space-y-5">
            {cases.map((caseItem: any) => {
              const documents = Array.isArray(caseItem.documents) ? caseItem.documents : []
              const milestones = Array.isArray(caseItem.milestones) ? caseItem.milestones : []
              const progressValue = clampProgress(caseItem.progress_percentage)

              return (
                <div
                  key={caseItem.id}
                  className="rounded-2xl border border-border/70 bg-card/60 p-5 shadow-sm transition hover:border-primary/40"
                >
                  <div className="flex flex-col gap-3 border-b border-dashed border-border/70 pb-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">
                        {caseItem.case_number}
                      </p>
                      <p className="text-xl font-semibold text-foreground">{caseItem.title}</p>
                      <p className="text-sm text-muted-foreground">
                        Tipo {formatLabel(caseItem.case_type)}
                        {caseItem.assigned_staff_name && (
                          <span className="ml-2">- Responsable {caseItem.assigned_staff_name}</span>
                        )}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase">
                      <Badge variant="secondary">{formatLabel(caseItem.status)}</Badge>
                      <Badge
                        variant="outline"
                        className={PRIORITY_BADGE_STYLES[caseItem.priority] || PRIORITY_BADGE_STYLES.default}
                      >
                        Prioridad {formatLabel(caseItem.priority)}
                      </Badge>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-6 lg:grid-cols-2">
                    <div className="space-y-4 text-sm text-muted-foreground">
                      <div>
                        <p className="text-xs font-semibold uppercase">Linea de tiempo</p>
                        <div className="mt-2 space-y-2">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="font-semibold text-foreground">{formatDate(caseItem.created_at)}</span>
                            <span className="text-xs uppercase text-muted-foreground">Creacion</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="font-semibold text-foreground">{formatDate(caseItem.updated_at)}</span>
                            <span className="text-xs uppercase text-muted-foreground">Ultima actualizacion</span>
                          </div>
                        </div>
                      </div>

                      <div className="grid gap-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span>Presentacion</span>
                          <span className="font-medium text-foreground">{formatDate(caseItem.filing_date)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Deadline</span>
                          <span className="font-medium text-foreground">{formatDate(caseItem.deadline_date)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Cierre estimado</span>
                          <span className="font-medium text-foreground">{formatDate(caseItem.completion_date)}</span>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between text-xs font-semibold uppercase text-muted-foreground">
                          <span>Progreso</span>
                          <span>{progressValue}%</span>
                        </div>
                        <div className="mt-2 h-2 rounded-full bg-muted">
                          <div
                            className="h-2 rounded-full bg-primary transition-all"
                            style={{ width: `${progressValue}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 text-sm text-muted-foreground">
                      <div>
                        <p className="text-xs font-semibold uppercase">Descripcion</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {caseItem.description || "Sin descripcion registrada."}
                        </p>
                      </div>

                      {milestones.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold uppercase">Etapas</p>
                          <ul className="mt-2 space-y-2">
                            {milestones.map((milestone: any) => (
                              <li key={milestone.id} className="flex items-start gap-3">
                                <span
                                  className={`mt-1 h-2.5 w-2.5 rounded-full ${
                                    milestone.completed ? "bg-primary" : "bg-muted-foreground/40"
                                  }`}
                                />
                                <div>
                                  <p className="font-semibold text-foreground">{milestone.title}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {milestone.description || "Sin descripcion"}
                                    {milestone.due_date && ` - Vence ${formatDate(milestone.due_date)}`}
                                  </p>
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div>
                        <p className="text-xs font-semibold uppercase">Documentos</p>
                        {documents.length === 0 ? (
                          <p className="mt-2 text-sm text-muted-foreground">Sin documentos cargados.</p>
                        ) : (
                          <ul className="mt-2 space-y-2">
                            {documents.slice(0, 3).map((doc: any) => (
                              <li
                                key={`${caseItem.id}-${doc.id}`}
                                className="flex items-center justify-between rounded-xl border border-dashed border-border/70 px-3 py-2"
                              >
                                <div>
                                  <p className="font-medium text-foreground">{doc.name}</p>
                                  <p className="text-xs text-muted-foreground">{formatLabel(doc.status)}</p>
                                </div>
                                <Button variant="ghost" size="sm" asChild>
                                  <a href={doc.file_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1">
                                    <FolderOpen className="h-4 w-4" />
                                    Abrir
                                  </a>
                                </Button>
                              </li>
                            ))}
                          </ul>
                        )}
                        {documents.length > 3 && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            +{documents.length - 3} documentos adicionales en este caso.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
                    <span>
                      Ultimo movimiento: <strong className="text-foreground">{formatDate(caseItem.updated_at)}</strong>
                    </span>
                    <Link
                      href={`/admin/clients/${client.id}/cases/${caseItem.id}`}
                      className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
                    >
                      Ver caso completo
                      <ArrowUpRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>

      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Documentos recibidos</h2>
        </div>
        {cases.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin documentos registrados todavia.</p>
        ) : (
          <ul className="space-y-2 text-sm text-muted-foreground">
            {cases.flatMap((caseItem: any) =>
              (caseItem.documents || []).map((doc: any) => (
                <li key={`${caseItem.id}-${doc.id}`} className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                  <div>
                    <p className="font-medium text-foreground">{doc.name}</p>
                    <p className="text-xs">{doc.status}</p>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <a href={doc.file_url} target="_blank" rel="noreferrer">
                      Abrir
                    </a>
                  </Button>
                </li>
              )),
            )}
          </ul>
        )}
      </Card>
    </div>
  )
}
