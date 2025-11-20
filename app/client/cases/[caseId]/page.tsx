"use client"

import { useState, type ChangeEvent } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import useSWR from "swr"
import { ArrowLeft, CalendarDays, Clock, MessageSquare, Paperclip, UserRound } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { CaseStatusBadge } from "@/components/case-status-badge"
import { PriorityBadge } from "@/components/priority-badge"
import { apiClient } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth-context"

const fetcher = (url: string) => apiClient.get(url)

const formatDate = (value?: string | null) => {
  if (!value) return "Sin fecha"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "Sin fecha"
  return date.toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" })
}

const formatDateTime = (value?: string | null) => {
  if (!value) return ""
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  return `${date.toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" })} ${date.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}`
}

const DOCUMENT_STATUS: Record<string, { label: string; className: string }> = {
  pending: { label: "Pendiente", className: "bg-amber-100 text-amber-700" },
  submitted: { label: "Enviado", className: "bg-sky-100 text-sky-700" },
  approved: { label: "Verificado", className: "bg-emerald-100 text-emerald-700" },
  requires_action: { label: "Requiere revision", className: "bg-rose-100 text-rose-700" },
  rejected: { label: "Rechazado", className: "bg-red-100 text-red-700" },
}

export default function ClientCaseDetailPage() {
  const params = useParams<{ caseId: string }>()
  const caseId = Array.isArray(params?.caseId) ? params?.caseId[0] : params?.caseId
  const { toast } = useToast()
  const { user } = useAuth()

  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")
  const [sendingMessage, setSendingMessage] = useState(false)
  const [uploadingDocId, setUploadingDocId] = useState<number | null>(null)

  const {
    data: caseResponse,
    isLoading: isCaseLoading,
  } = useSWR(caseId ? `/api/cases/${caseId}` : null, fetcher)
  const caseDetail = caseResponse?.case

  const { data: documentsData, mutate: mutateDocuments } = useSWR(
    caseId ? `/api/documents?case_id=${caseId}` : null,
    fetcher,
  )
  const documents = documentsData?.documents || []

  const { data: messagesData, mutate: mutateMessages } = useSWR(
    caseId ? `/api/messages?case_id=${caseId}` : null,
    fetcher,
  )
  const messages = Array.isArray(messagesData?.messages)
    ? [...messagesData.messages].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      )
    : []

  const milestones = Array.isArray(caseDetail?.milestones) ? caseDetail?.milestones : []
  const requiredDocuments = documents.filter((doc: any) => doc.is_required)
  const optionalDocuments = documents.filter((doc: any) => !doc.is_required)
  const templateDocuments = Array.isArray(caseDetail?.case_type_template_documents)
    ? caseDetail.case_type_template_documents
    : []
  const templateStates = Array.isArray(caseDetail?.case_type_template_states)
    ? caseDetail.case_type_template_states
    : []
  const templateTimeframe = caseDetail?.case_type_template_timeframe as string | undefined

  const handleSendMessage = async () => {
    if (!caseId || !caseDetail?.assigned_staff_id) {
      toast({
        title: "Sin destinatario",
        description: "Aun no tienes un abogado asignado para este caso.",
        variant: "destructive",
      })
      return
    }

    if (!message.trim()) {
      toast({
        title: "Escribe un mensaje",
        description: "Cuéntanos qué necesitas para enviar la consulta.",
        variant: "destructive",
      })
      return
    }

    setSendingMessage(true)
    try {
      await apiClient.post("/api/messages", {
        case_id: Number(caseId),
        receiver_id: caseDetail.assigned_staff_id,
        subject: subject.trim() || `Consulta sobre ${caseDetail.case_number}`,
        content: message.trim(),
      })
      toast({
        title: "Mensaje enviado",
        description: "Tu abogado fue notificado.",
      })
      setSubject("")
      setMessage("")
      mutateMessages()
    } catch (error: any) {
      toast({
        title: "No se pudo enviar",
        description: error?.message || "Intenta nuevamente.",
        variant: "destructive",
      })
    } finally {
      setSendingMessage(false)
    }
  }

  const handleDocumentUpload = async (doc: any, file: File) => {
    if (!caseId) return
    setUploadingDocId(doc.id)
    const formData = new FormData()
    formData.append("case_id", caseId)
    formData.append("document_id", doc.id.toString())
    formData.append("name", doc.name || "Documento requerido")
    formData.append("file", file)

    try {
      await apiClient.upload("/api/documents", formData)
      toast({
        title: "Documento enviado",
        description: `${doc.name} se subió correctamente.`,
      })
      mutateDocuments()
    } catch (error: any) {
      toast({
        title: "No se pudo subir",
        description: error?.message || "Revisa el archivo e intenta nuevamente.",
        variant: "destructive",
      })
    } finally {
      setUploadingDocId(null)
    }
  }

  const handleDocumentInput = (doc: any, event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      handleDocumentUpload(doc, file)
    }
    event.target.value = ""
  }

  if (isCaseLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="h-64 animate-pulse rounded-xl bg-muted" />
        <div className="h-48 animate-pulse rounded-xl bg-muted" />
      </div>
    )
  }

  if (!caseDetail) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-lg font-semibold text-foreground">No encontramos este expediente.</p>
        <Link href="/client/dashboard">
          <Button variant="outline">Volver al panel</Button>
        </Link>
      </div>
    )
  }

  const progress = typeof caseDetail.progress_percentage === "number" ? caseDetail.progress_percentage : 0
  const assignedStaffName = caseDetail.staff_name || "Tu abogado"
  const assignedStaffEmail = caseDetail.staff_email

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/client/dashboard" className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
          <ArrowLeft className="h-4 w-4" />
          Volver al panel
        </Link>
        <Badge variant="outline" className="text-sm">
          Caso #{caseDetail.case_number}
        </Badge>
      </div>

      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 p-6">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-4">
            <div>
              <p className="text-xs text-muted-foreground">Tipo de caso</p>
              <p className="text-lg font-semibold capitalize text-foreground">
                {caseDetail.case_type?.replace(/_/g, " ") || "General"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Estado actual</p>
              <div className="mt-1 flex items-center gap-2">
                <CaseStatusBadge status={caseDetail.status} />
                {caseDetail.priority && <PriorityBadge priority={caseDetail.priority} />}
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Asignado a</p>
              <div className="mt-2 flex items-center gap-2 text-sm font-semibold text-foreground">
                <UserRound className="h-4 w-4 text-primary" />
                {assignedStaffName}
              </div>
              {assignedStaffEmail && (
                <p className="text-xs text-muted-foreground mt-1">{assignedStaffEmail}</p>
              )}
            </div>
          </div>

          <div className="space-y-3 lg:col-span-2">
            <div>
              <p className="text-xs text-muted-foreground">Progreso general</p>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">Avance</span>
                <span className="text-sm font-bold text-primary">{progress}%</span>
              </div>
              <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-white/40">
                <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl bg-white/60 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <CalendarDays className="h-4 w-4 text-primary" />
                  Presentado
                </div>
                <p className="mt-1 text-lg font-semibold text-foreground">{formatDate(caseDetail.filing_date)}</p>
              </div>
              <div className="rounded-xl bg-white/60 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Clock className="h-4 w-4 text-primary" />
                  Próximo vencimiento
                </div>
                <p className="mt-1 text-lg font-semibold text-foreground">{formatDate(caseDetail.deadline_date)}</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Plantilla asignada</p>
            <h3 className="text-xl font-semibold text-foreground">
              {caseDetail.case_type_template_name || "Residencia comunitaria"}
            </h3>
            {caseDetail.case_type_template_description && (
              <p className="mt-2 text-sm text-muted-foreground">
                {caseDetail.case_type_template_description}
              </p>
            )}
          </div>
          {templateTimeframe && (
            <Badge variant="secondary" className="w-fit">
              {templateTimeframe}
            </Badge>
          )}
        </div>
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Etapas del tramite</p>
            <div className="mt-3 space-y-2">
              {templateStates.length === 0 && (
                <p className="text-sm text-muted-foreground">Aun no definimos las etapas de este tramite.</p>
              )}
              {templateStates.map((state: string, index: number) => (
                <div key={state} className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-muted-foreground">{index + 1}.</span>
                  <p className="text-sm text-foreground">{state}</p>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Documentos base solicitados
            </p>
            <div className="mt-3 space-y-2">
              {templateDocuments.length === 0 && (
                <p className="text-sm text-muted-foreground">No hay documentos predefinidos para este tipo de caso.</p>
              )}
              {templateDocuments.map((doc: string) => (
                <div key={doc} className="flex items-center gap-2 text-sm text-foreground">
                  <Paperclip className="h-4 w-4 text-primary" />
                  <span>{doc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="mb-4 text-lg font-semibold text-foreground">Cronología del caso</h3>
        <div className="space-y-4">
          {milestones.length === 0 && (
            <p className="text-sm text-muted-foreground">Aún no hay hitos registrados para este caso.</p>
          )}
          {milestones.map((milestone: any, index: number) => (
            <div key={milestone.id ?? index} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className={`h-3 w-3 rounded-full ${milestone.completed ? "bg-primary" : "bg-muted"}`} />
                {index < milestones.length - 1 && <div className="my-1 h-12 w-0.5 bg-border" />}
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{milestone.title}</p>
                {milestone.description && (
                  <p className="mt-1 text-xs text-muted-foreground">{milestone.description}</p>
                )}
                <p className="mt-1 text-xs text-muted-foreground">{formatDate(milestone.due_date)}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">Documentos requeridos</h3>
            <Badge variant="secondary">
              {requiredDocuments.filter((doc: any) => doc.status !== "approved").length} pendientes
            </Badge>
          </div>
          <div className="space-y-4">
            {requiredDocuments.length === 0 && (
              <p className="text-sm text-muted-foreground">El abogado aún no solicitó documentos.</p>
            )}
            {requiredDocuments.map((doc: any) => {
              const statusInfo = DOCUMENT_STATUS[doc.status] || DOCUMENT_STATUS.pending

              return (
                <div key={doc.id} className="rounded-xl border border-border p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-foreground">{doc.name}</p>
                      {doc.description && (
                        <p className="text-xs text-muted-foreground mt-1">{doc.description}</p>
                      )}
                    </div>
                    <Badge className={`${statusInfo.className} border-transparent`}>{statusInfo.label}</Badge>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Última actualización: {formatDate(doc.updated_at)}
                  </p>

                  {doc.status !== "approved" && (
                    <div className="mt-3">
                      <input
                        id={`file-${doc.id}`}
                        type="file"
                        className="hidden"
                        onChange={(event) => handleDocumentInput(doc, event)}
                      />
                      <label htmlFor={`file-${doc.id}`}>
                        <span className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-primary px-3 py-1 text-sm font-medium text-primary hover:bg-primary/10">
                          <Paperclip className="h-4 w-4" />
                          {uploadingDocId === doc.id ? "Subiendo..." : "Subir archivo"}
                        </span>
                      </label>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="mb-4 text-lg font-semibold text-foreground">Documentos enviados</h3>
          <div className="space-y-3">
            {optionalDocuments.length === 0 && (
              <p className="text-sm text-muted-foreground">Aún no cargaste documentación adicional.</p>
            )}
            {optionalDocuments.map((doc: any) => {
              const statusInfo = DOCUMENT_STATUS[doc.status] || DOCUMENT_STATUS.submitted
              return (
                <div key={doc.id} className="rounded-lg border border-border p-3">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{doc.name}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(doc.created_at)}</p>
                    </div>
                    <Badge className={`${statusInfo.className} border-transparent`}>{statusInfo.label}</Badge>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <div className="mb-5 flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Mensajes del caso</h3>
        </div>

        <div className="space-y-4 rounded-xl border border-border bg-muted/30 p-4">
          {messages.length === 0 && (
            <p className="text-sm text-muted-foreground">Todavía no hay mensajes para este expediente.</p>
          )}
          {messages.map((msg: any) => (
            <div key={msg.id} className="rounded-lg bg-background/70 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-foreground">
                  {msg.sender_id === user?.id ? "Tú" : msg.sender_name || "Tu abogado"}
                </p>
                <span className="text-xs text-muted-foreground">{formatDateTime(msg.created_at)}</span>
              </div>
              {msg.subject && <p className="mt-1 text-xs font-medium text-muted-foreground">{msg.subject}</p>}
              <p className="mt-2 text-sm text-foreground whitespace-pre-line">{msg.content}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 space-y-3 rounded-xl border border-dashed border-border p-4">
          <p className="text-sm font-semibold text-foreground">Enviar mensaje al abogado</p>
          <Input placeholder="Asunto (opcional)" value={subject} onChange={(e) => setSubject(e.target.value)} />
          <Textarea
            placeholder="Escribe tu consulta o actualización..."
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <Button
            className="bg-primary hover:bg-primary/90"
            onClick={handleSendMessage}
            disabled={sendingMessage}
          >
            {sendingMessage ? "Enviando..." : "Enviar mensaje"}
          </Button>
        </div>
      </Card>
    </div>
  )
}
