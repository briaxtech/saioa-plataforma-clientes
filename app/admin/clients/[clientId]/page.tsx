"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import useSWR from "swr"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Archive, ArrowUpRight, Calendar, Clock, Loader2, Mail, MapPin, Phone, Users } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { api, apiClient } from "@/lib/api-client"

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

  const { data, isLoading, mutate } = useSWR(clientId ? `/api/clients/${clientId}` : null, (url: string) => apiClient.get(url))
  const { toast } = useToast()
  const [isArchiving, setIsArchiving] = useState(false)
  const [notesValue, setNotesValue] = useState("")
  const [isSavingNotes, setIsSavingNotes] = useState(false)
  const [notesSynced, setNotesSynced] = useState(false)
  const client = data?.client
  const cases = Array.isArray(client?.cases) ? client?.cases : []

  useEffect(() => {
    if (typeof client?.notes === "undefined") return
    setNotesValue(client?.notes ?? "")
    setNotesSynced(true)
  }, [client?.notes])

  const handleArchiveClient = async () => {
    if (!client) return
    const targetId = client.user_id || client.id
    if (!targetId) return

    const confirmed = window.confirm(
      `¿Seguro que deseas mover a ${client.name} al archivo? Podrás restaurarlo desde la sección Archivo cuando lo necesites.`,
    )
    if (!confirmed) return

    setIsArchiving(true)
    try {
      await api.updateClient(String(targetId), { archived: true })
      toast({ title: `${client.name} ahora está en Archivo.` })
      await mutate()
    } catch (error: any) {
      toast({
        title: "No pudimos archivar al cliente",
        description: error?.message || "Intenta nuevamente.",
        variant: "destructive",
      })
    } finally {
      setIsArchiving(false)
    }
  }

  const handleSaveNotes = async () => {
    if (!client) return
    const targetId = client.user_id || client.id
    if (!targetId) return

    const trimmed = notesValue.trim()
    const payload = trimmed.length === 0 ? null : notesValue

    setIsSavingNotes(true)
    try {
      await api.updateClient(String(targetId), { notes: payload })
      toast({ title: "Notas internas actualizadas." })
      await mutate()
    } catch (error: any) {
      toast({
        title: "No pudimos guardar las notas",
        description: error?.message || "Intenta nuevamente.",
        variant: "destructive",
      })
    } finally {
      setIsSavingNotes(false)
    }
  }

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

  const normalizedClientNotes = client.notes ?? ""
  const notesChanged = notesSynced ? notesValue !== normalizedClientNotes : false
  const canSaveNotes = notesSynced && notesChanged

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
      </div>

      <div className="space-y-6">
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
          <div>
            <h2 className="text-lg font-semibold text-foreground">Notas internas</h2>
            <p className="text-sm text-muted-foreground">Solo visibles para el equipo administrador.</p>
          </div>
          <Textarea
            value={notesValue}
            onChange={(event) => setNotesValue(event.target.value)}
            placeholder="Registra acuerdos internos, contexto o seguimientos pendientes."
            className="min-h-[140px]"
          />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">Estas notas no se comparten con el cliente.</p>
            <Button onClick={handleSaveNotes} disabled={!canSaveNotes || isSavingNotes}>
              {isSavingNotes && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar notas
            </Button>
          </div>
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

                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
                    <span>
                      Ultimo movimiento: <strong className="text-foreground">{formatDate(caseItem.updated_at)}</strong>
                    </span>
                    <Button asChild size="sm" className="gap-1">
                      <Link href={`/admin/clients/${client.id}/cases/${caseItem.id}`} className="inline-flex items-center">
                        Ver caso completo
                        <ArrowUpRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>

      <Card className="space-y-4 border border-dashed border-amber-200 bg-amber-50/40 p-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Mover al archivo</h2>
          <p className="text-sm text-amber-900">
            Usa esta acción cuando el caso ya no requiera seguimiento activo. Podrás restaurarlo desde la sección Archivo si
            vuelve a ser necesario.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {client.archived_at ? (
            <Badge variant="secondary" className="w-full justify-center sm:w-auto">
              {`Archivado el ${formatDate(client.archived_at)}`}
            </Badge>
          ) : (
            <Button
              type="button"
              variant="outline"
              className="w-full gap-2 border-amber-300 text-amber-900 hover:bg-amber-100 sm:w-auto"
              onClick={handleArchiveClient}
              disabled={isArchiving}
            >
              {isArchiving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Archivando...
                </>
              ) : (
                <>
                  <Archive className="h-4 w-4" />
                  Mover a archivo
                </>
              )}
            </Button>
          )}
          <p className="text-xs text-amber-900">
            Esta acción no elimina al usuario; sólo lo oculta del panel principal.
          </p>
        </div>
      </Card>
    </div>
  )
}
