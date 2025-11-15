"use client"

import { useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import useSWR from "swr"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CaseStatusBadge } from "@/components/case-status-badge"
import { PriorityBadge } from "@/components/priority-badge"
import { CaseProgressTracker } from "@/components/case-progress-tracker"
import { apiClient } from "@/lib/api-client"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, CalendarDays, Clock, Mail, MessageSquare, Paperclip, Phone, UserRound } from "lucide-react"

const fetcher = (url: string) => apiClient.get(url)

const formatDate = (value?: string | null) => {
  if (!value) return "Sin fecha"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "Sin fecha"
  return date.toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" })
}

const formatDateTime = (value?: string | null) => {
  if (!value) return "Sin registro"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "Sin registro"
  return `${date.toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" })} ${date.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}`
}

const formatLabel = (value?: string | null) => {
  if (!value) return "Sin dato"
  return value
    .toString()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

const DOCUMENT_STATUS_OPTIONS = [
  { value: "pending", label: "Pendiente" },
  { value: "submitted", label: "Enviado" },
  { value: "approved", label: "Verificado" },
  { value: "requires_action", label: "Requiere revision" },
  { value: "rejected", label: "Rechazado" },
]

export default function CaseDetailPage() {
  const params = useParams<{ clientId: string; caseId: string }>()
  const clientId = Array.isArray(params?.clientId) ? params?.clientId[0] : params?.clientId
  const caseId = Array.isArray(params?.caseId) ? params?.caseId[0] : params?.caseId
  const { toast } = useToast()

  const {
    data: caseResponse,
    isLoading: isCaseLoading,
  } = useSWR(caseId ? `/api/cases/${caseId}` : null, (url: string) => fetcher(url))
  const caseDetail = caseResponse?.case

  const { data: documentsData, mutate: mutateDocuments } = useSWR(caseId ? `/api/documents?case_id=${caseId}` : null, fetcher)
  const documents = documentsData?.documents || []

  const { data: messagesData } = useSWR(caseId ? `/api/messages?case_id=${caseId}` : null, fetcher)
  const messages = Array.isArray(messagesData?.messages) ? [...messagesData.messages].sort((a, b) =>
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  ) : []

  const { data: activityData } = useSWR(caseId ? `/api/activity?case_id=${caseId}` : null, fetcher)
  const activities = activityData?.activities || []
  const requiredDocuments = documents.filter((doc: any) => doc.is_required)
  const otherDocuments = documents.filter((doc: any) => !doc.is_required)

  const [newRequirementName, setNewRequirementName] = useState("")
  const [newRequirementStage, setNewRequirementStage] = useState("")
  const [newRequirementNotes, setNewRequirementNotes] = useState("")
  const [isCreatingRequirement, setIsCreatingRequirement] = useState(false)
  const [statusDrafts, setStatusDrafts] = useState<Record<number, string>>({})
  const [noteDrafts, setNoteDrafts] = useState<Record<number, string>>({})
  const [updatingDocId, setUpdatingDocId] = useState<number | null>(null)

  const handleCreateRequirement = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!caseId || !newRequirementName.trim()) {
      toast({
        title: "Faltan datos",
        description: "Define el nombre del documento requerido.",
        variant: "destructive",
      })
      return
    }
    setIsCreatingRequirement(true)
    try {
      await apiClient.post("/api/documents/request", {
        case_id: Number(caseId),
        name: newRequirementName.trim(),
        description: newRequirementNotes.trim() || null,
        category: newRequirementStage.trim() || null,
      })
      setNewRequirementName("")
      setNewRequirementStage("")
      setNewRequirementNotes("")
      mutateDocuments()
      toast({ title: "Documento requerido", description: "El cliente ya fue notificado." })
    } catch (error: any) {
      toast({
        title: "No se pudo crear",
        description: error?.message || "Intenta nuevamente.",
        variant: "destructive",
      })
    } finally {
      setIsCreatingRequirement(false)
    }
  }

  const handleReviewUpdate = async (doc: any) => {
    if (!statusDrafts[doc.id] && noteDrafts[doc.id] === undefined) {
      return
    }

    const payload: Record<string, any> = {}
    if (statusDrafts[doc.id] && statusDrafts[doc.id] !== doc.status) {
      payload.status = statusDrafts[doc.id]
    }
    if (noteDrafts[doc.id] !== undefined && noteDrafts[doc.id] !== doc.review_notes) {
      payload.review_notes = noteDrafts[doc.id]
    }

    if (Object.keys(payload).length === 0) {
      return
    }

    setUpdatingDocId(doc.id)
    try {
      await apiClient.patch(`/api/documents/${doc.id}`, payload)
      mutateDocuments()
      toast({ title: "Documento actualizado" })
    } catch (error: any) {
      toast({
        title: "Error al actualizar",
        description: error?.message || "No fue posible guardar los cambios.",
        variant: "destructive",
      })
    } finally {
      setUpdatingDocId(null)
    }
  }

  if (isCaseLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="h-48 rounded-xl bg-muted lg:col-span-2" />
          <div className="h-48 rounded-xl bg-muted" />
        </div>
      </div>
    )
  }

  if (!caseDetail) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-lg font-semibold text-foreground">No encontramos este expediente.</p>
        <Link href={`/admin/clients/${clientId}`}>
          <Button variant="outline">Volver al cliente</Button>
        </Link>
      </div>
    )
  }

  const milestones = Array.isArray(caseDetail.milestones) ? caseDetail.milestones : []
  const firstPendingIndex = milestones.findIndex((step: any) => !step.completed)
  const progressSteps =
    milestones.length > 0
      ? milestones.map((milestone: any, index: number) => ({
          id: milestone.id?.toString() || `${index}`,
          title: milestone.title,
          description: milestone.description || "Sin descripcion",
          date: milestone.due_date ? `Vence ${formatDate(milestone.due_date)}` : undefined,
          status:
            firstPendingIndex === -1
              ? "completed"
              : index < firstPendingIndex
                ? "completed"
                : index === firstPendingIndex
                  ? "current"
                  : "upcoming",
        }))
      : []

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <Link
            href={`/admin/clients/${clientId}`}
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al cliente
          </Link>
          <h1 className="mt-3 text-3xl font-semibold text-foreground">{caseDetail.title}</h1>
          <p className="text-sm text-muted-foreground">
            Expediente {caseDetail.case_number} - {caseDetail.client_name}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <CaseStatusBadge status={caseDetail.status} />
          <PriorityBadge priority={caseDetail.priority} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="space-y-5 p-6 lg:col-span-2">
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">Resumen del caso</h2>
            <p className="text-sm text-muted-foreground">
              {caseDetail.description || "No hay descripcion registrada todavia."}
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-dashed border-border/70 p-4">
              <p className="text-xs font-semibold uppercase text-muted-foreground">Cliente</p>
              <p className="text-base font-semibold text-foreground">{caseDetail.client_name}</p>
              <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  {caseDetail.client_email}
                </div>
                {caseDetail.client_phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    {caseDetail.client_phone}
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-dashed border-border/70 p-4">
              <p className="text-xs font-semibold uppercase text-muted-foreground">Equipo asignado</p>
              <p className="text-base font-semibold text-foreground">
                {caseDetail.staff_name || "Sin asignar"}
              </p>
              {caseDetail.staff_email && (
                <p className="mt-1 text-sm text-muted-foreground">{caseDetail.staff_email}</p>
              )}
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs uppercase text-muted-foreground">
                <div>
                  <p className="text-[10px] tracking-wide">Creado</p>
                  <p className="text-sm font-semibold text-foreground">{formatDate(caseDetail.created_at)}</p>
                </div>
                <div>
                  <p className="text-[10px] tracking-wide">Ultimo cambio</p>
                  <p className="text-sm font-semibold text-foreground">{formatDate(caseDetail.updated_at)}</p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card className="space-y-5 p-6">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Fechas clave</h2>
          </div>
          <div className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-center justify-between rounded-xl border border-border/60 px-3 py-2">
              <span>Presentacion</span>
              <span className="font-semibold text-foreground">{formatDate(caseDetail.filing_date)}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-border/60 px-3 py-2">
              <span>Deadline</span>
              <span className="font-semibold text-foreground">{formatDate(caseDetail.deadline_date)}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-border/60 px-3 py-2">
              <span>Cierre estimado</span>
              <span className="font-semibold text-foreground">{formatDate(caseDetail.completion_date)}</span>
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between text-xs font-semibold uppercase text-muted-foreground">
              <span>Progreso actual</span>
              <span>{caseDetail.progress_percentage || 0}%</span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-muted">
              <div
                className="h-2 rounded-full bg-primary transition-all"
                style={{ width: `${Math.min(100, Math.max(0, Number(caseDetail.progress_percentage) || 0))}%` }}
              />
            </div>
          </div>
        </Card>
      </div>

      {progressSteps.length > 0 ? (
        <CaseProgressTracker steps={progressSteps} />
      ) : (
        <Card className="p-6">
          <p className="text-sm text-muted-foreground">Este caso aun no tiene hitos configurados.</p>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="space-y-5 p-6">
          <div className="flex items-center gap-2">
            <Paperclip className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Documentos del caso</h2>
          </div>

          <form onSubmit={handleCreateRequirement} className="space-y-3 rounded-2xl border border-dashed border-border/70 p-4">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-semibold text-foreground">Solicitar nuevo documento</span>
              <p className="text-xs text-muted-foreground">Define el archivo necesario para la siguiente etapa.</p>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="text-xs font-semibold uppercase text-muted-foreground">Nombre</label>
                <Input value={newRequirementName} onChange={(e) => setNewRequirementName(e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase text-muted-foreground">Etapa o categoria</label>
                <Input value={newRequirementStage} onChange={(e) => setNewRequirementStage(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase text-muted-foreground">Notas para el cliente</label>
              <Textarea
                value={newRequirementNotes}
                onChange={(e) => setNewRequirementNotes(e.target.value)}
                className="min-h-[80px]"
                placeholder="Ej: Necesitamos la version firmada por el consulado."
              />
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={isCreatingRequirement}>
                {isCreatingRequirement ? "Creando..." : "Marcar como requerido"}
              </Button>
            </div>
          </form>

          <div>
            <h3 className="text-sm font-semibold uppercase text-muted-foreground">Requerimientos activos</h3>
            {requiredDocuments.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">Aun no solicitaste archivos para este caso.</p>
            ) : (
              <div className="mt-3 space-y-4">
                {requiredDocuments.map((doc: any) => {
                  const selectedStatus = statusDrafts[doc.id] ?? doc.status
                  const noteValue = (noteDrafts[doc.id] ?? doc.review_notes) || ""
                  return (
                    <div key={doc.id} className="rounded-2xl border border-border/60 p-4">
                      <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                        <div>
                          <p className="text-xs font-semibold uppercase text-muted-foreground">
                            {doc.category || "Documento requerido"}
                          </p>
                          <p className="text-lg font-semibold text-foreground">{doc.name}</p>
                          <p className="text-xs text-muted-foreground">Estado actual: {formatLabel(doc.status)}</p>
                        </div>
                        {doc.file_url && (
                          <Button size="sm" variant="ghost" onClick={() => window.open(doc.file_url, "_blank")}>
                            Ver ultimo archivo
                          </Button>
                        )}
                      </div>
                      <div className="mt-4 grid gap-3 md:grid-cols-2">
                        <div>
                          <label className="text-xs font-semibold uppercase text-muted-foreground">Estado</label>
                          <select
                            value={selectedStatus}
                            onChange={(event) =>
                              setStatusDrafts((prev) => ({ ...prev, [doc.id]: event.target.value }))
                            }
                            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                          >
                            {DOCUMENT_STATUS_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-xs font-semibold uppercase text-muted-foreground">Notas de revision</label>
                          <Textarea
                            value={noteValue}
                            onChange={(event) => setNoteDrafts((prev) => ({ ...prev, [doc.id]: event.target.value }))}
                            className="mt-1 min-h-[80px]"
                            placeholder="Explica si falta algo o por qué fue rechazado."
                          />
                        </div>
                      </div>
                      <div className="mt-3 flex justify-end">
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => handleReviewUpdate(doc)}
                          disabled={updatingDocId === doc.id}
                        >
                          {updatingDocId === doc.id ? "Guardando..." : "Guardar cambios"}
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div className="space-y-3 border-t border-border/60 pt-4">
            <h3 className="text-sm font-semibold uppercase text-muted-foreground">Todos los documentos</h3>
            {documents.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aun no hay archivos en este expediente.</p>
            ) : (
              <ul className="space-y-3 text-sm">
                {documents.map((doc: any) => (
                  <li
                    key={doc.id}
                    className="flex flex-col gap-2 rounded-xl border border-border/70 px-3 py-2 md:flex-row md:items-center md:justify-between"
                  >
                    <div>
                      <p className="font-medium text-foreground">{doc.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Estado {formatLabel(doc.status)} {doc.uploader_name ? `- ${doc.uploader_name}` : ""}
                      </p>
                    </div>
                    {doc.file_url && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={doc.file_url} target="_blank" rel="noreferrer">
                          Abrir
                        </a>
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>

        <Card className="space-y-4 p-6">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Actividad reciente</h2>
          </div>
          {activities.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aun no hay movimientos para este caso.</p>
          ) : (
            <ul className="space-y-3 text-sm">
              {activities.slice(0, 6).map((activity: any) => (
                <li key={activity.id} className="rounded-2xl border border-border/60 p-3">
                  <p className="font-medium text-foreground">{activity.description || activity.action}</p>
                  <p className="text-xs text-muted-foreground">{formatDateTime(activity.created_at)}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card className="space-y-4 p-6">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Conversaciones</h2>
        </div>
        {messages.length === 0 ? (
          <p className="text-sm text-muted-foreground">Todavia no se enviaron mensajes en este expediente.</p>
        ) : (
          <div className="space-y-4">
            {messages.map((message: any) => (
              <div key={message.id} className="rounded-2xl border border-border/70 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <UserRound className="h-4 w-4 text-muted-foreground" />
                    {message.sender_name || "Usuario"}
                  </div>
                  <span className="text-xs text-muted-foreground">{formatDateTime(message.created_at)}</span>
                </div>
                {message.subject && (
                  <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {message.subject}
                  </p>
                )}
                <p className="mt-2 text-sm text-muted-foreground whitespace-pre-line">{message.content}</p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
