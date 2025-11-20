
"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import useSWR from "swr"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { CaseStatusBadge } from "@/components/case-status-badge"
import { PriorityBadge } from "@/components/priority-badge"
import { api, apiClient } from "@/lib/api-client"
import {
  getDocumentStatusLabel,
  canOpenDocumentFile,
  documentHasFile,
  getDocumentFileUrl,
} from "@/lib/document-helpers"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth-context"
import {
  Activity as ActivityIcon,
  ArrowLeft,
  Bell,
  CalendarClock,
  Mail,
  MessageSquare,
  Paperclip,
  Pencil,
  Phone,
  Plus,
  Trash2,
  User,
  ExternalLink,
} from "lucide-react"

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

const STAGE_STATUS_BADGES: Record<
  string,
  {
    label: string
    className: string
  }
> = {
  pending: { label: "Pendiente", className: "bg-amber-100 text-amber-700" },
  in_progress: { label: "En proceso", className: "bg-sky-100 text-sky-700" },
  completed: { label: "Completado", className: "bg-emerald-100 text-emerald-700" },
  blocked: { label: "Bloqueado", className: "bg-rose-100 text-rose-700" },
}

const STAGE_STATUS_OPTIONS = [
  { label: "Pendiente", value: "pending" },
  { label: "En proceso", value: "in_progress" },
  { label: "Bloqueado", value: "blocked" },
  { label: "Completado", value: "completed" },
]

const CASE_LIFECYCLE_BADGES: Record<string, { label: string; className: string }> = {
  preparation: { label: "En preparación", className: "bg-amber-100 text-amber-700" },
  submitted: { label: "Presentado", className: "bg-sky-100 text-sky-700" },
  resolution: { label: "En resolución", className: "bg-purple-100 text-purple-700" },
  completed: { label: "Finalizado", className: "bg-emerald-100 text-emerald-700" },
}

const EVENT_TYPES = [
  { value: "estado", label: "Cambio de estado" },
  { value: "documento", label: "Documento" },
  { value: "recordatorio", label: "Recordatorio" },
  { value: "nota", label: "Nota interna" },
]

const DOCUMENT_STATUS_OPTIONS = [
  { value: "pending", label: "Pendiente de envío" },
  { value: "submitted", label: "Presentado" },
  { value: "approved", label: "Correcto" },
  { value: "requires_action", label: "Requiere reentrega" },
  { value: "rejected", label: "Observado" },
  { value: "not_required", label: "No requerido" },
]

const defaultEventDate = new Date().toISOString().slice(0, 10)

type AiMessage = {
  role: "user" | "assistant"
  content: string
  timestamp: string
}

const formatDateInputValue = (value?: string | null) => {
  if (!value) return ""
  return value.slice(0, 10)
}

const splitDateTime = (value?: string | null) => {
  if (!value) {
    return { date: "", time: "" }
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return { date: "", time: "" }
  }
  const datePart = date.toISOString().slice(0, 10)
  const timePart = date.toISOString().slice(11, 16)
  return { date: datePart, time: timePart }
}

const composeDateTime = (date: string, time?: string | null) => {
  if (!date) return null
  const safeTime = time && time.length >= 4 ? time : "09:00"
  const composed = new Date(`${date}T${safeTime}`)
  if (Number.isNaN(composed.getTime())) {
    return null
  }
  return composed.toISOString()
}

const parseEmailList = (value: string) =>
  value
    .split(/[,;\n]/)
    .map((email) => email.trim())
    .filter(Boolean)

const mergeRecipientList = (current: string, candidates: string[]) => {
  const base = parseEmailList(current)
  const seen = new Set(base.map((email) => email.toLowerCase()))
  const next = [...base]
  candidates.forEach((email) => {
    const normalized = email.toLowerCase()
    if (email && !seen.has(normalized)) {
      seen.add(normalized)
      next.push(email)
    }
  })
  return next.join(", ")
}
export default function CaseDetailPage() {
  const params = useParams<{ clientId: string; caseId: string }>()
  const clientId = Array.isArray(params?.clientId) ? params?.clientId[0] : params?.clientId
  const caseId = Array.isArray(params?.caseId) ? params?.caseId[0] : params?.caseId
  const { toast } = useToast()
  const { user } = useAuth()

  const {
    data: caseResponse,
    isLoading: isCaseLoading,
    mutate: mutateCase,
  } = useSWR(caseId ? `/api/cases/${caseId}` : null, fetcher)
  const caseDetail = caseResponse?.case
  const stages = Array.isArray(caseDetail?.milestones) ? caseDetail.milestones : []
  const caseEvents = Array.isArray(caseDetail?.events) ? caseDetail.events : []

  const { data: documentsData, mutate: mutateDocuments } = useSWR(caseId ? `/api/documents?case_id=${caseId}` : null, fetcher)
  const documents = documentsData?.documents || []
  const requiredDocuments = documents.filter((doc: any) => doc.is_required)

  const { data: messagesData, mutate: mutateMessages } = useSWR(caseId ? `/api/messages?case_id=${caseId}` : null, fetcher)
  const messages = Array.isArray(messagesData?.messages)
    ? [...messagesData.messages].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    : []

  const { data: activityData } = useSWR(caseId ? `/api/activity?case_id=${caseId}` : null, fetcher)
  const activities = activityData?.activities || []

  const [summaryDescription, setSummaryDescription] = useState("")
  const [contactDraft, setContactDraft] = useState({
    contact_name: "",
    contact_email: "",
    contact_phone: "",
  })
  const [savingSummary, setSavingSummary] = useState(false)
  const [caseNotes, setCaseNotes] = useState("")
  const [savingNotes, setSavingNotes] = useState(false)
  const [caseDatesDraft, setCaseDatesDraft] = useState({
    filing_date: "",
    deadline_date: "",
  })
  const [savingDates, setSavingDates] = useState(false)
  const [caseContacts, setCaseContacts] = useState<any[]>([])
  const [contactForm, setContactForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    role: "",
    organization: "",
    notes: "",
  })
  const [contactEdits, setContactEdits] = useState<Record<number, any>>({})
  const [savingContactId, setSavingContactId] = useState<null | number | "new">(null)
  const [deletingContactId, setDeletingContactId] = useState<number | null>(null)
  const [caseKeyDates, setCaseKeyDates] = useState<any[]>([])
  const [keyDateDrafts, setKeyDateDrafts] = useState<Record<number, any>>({})
  const defaultTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
  const [newKeyDate, setNewKeyDate] = useState({
    title: "",
    description: "",
    type: "",
    date: "",
    time: "",
    location: "",
    duration_minutes: 60,
    recipient_emails: "",
    sendEmail: true,
    remind_minutes_before: 1440,
    email_subject: "",
    email_body: "",
    sync_to_calendar: true,
    timezone: defaultTimezone,
  })
  const [savingKeyDateId, setSavingKeyDateId] = useState<number | "new" | null>(null)
  const [deletingKeyDateId, setDeletingKeyDateId] = useState<number | null>(null)
  const [stageDrafts, setStageDrafts] = useState<Record<number, Record<string, any>>>({})
  const [savingStageId, setSavingStageId] = useState<number | null>(null)
  const [eventForm, setEventForm] = useState({
    title: "",
    type: "estado",
    description: "",
    occurred_at: defaultEventDate,
  })
  const [creatingEvent, setCreatingEvent] = useState(false)

  const [aiPrompt, setAiPrompt] = useState(
    "Revisa este PDF y dime si cumple con los requisitos del trámite. Indica faltas o incoherencias puntuales.",
  )
  const [aiDocumentId, setAiDocumentId] = useState("")
  const [aiLastResponse, setAiLastResponse] = useState<AiMessage | null>(null)
  const [aiIsAnalyzing, setAiIsAnalyzing] = useState(false)
  const analyzableDocuments = documents.filter((doc: any) => documentHasFile(doc))
  const selectedAiDocument = analyzableDocuments.find((doc: any) => String(doc.id) === aiDocumentId)
  const selectedAiDocumentUrl = getDocumentFileUrl(selectedAiDocument)

  const [newRequirementName, setNewRequirementName] = useState("")
  const [newRequirementStage, setNewRequirementStage] = useState("")
  const [newRequirementNotes, setNewRequirementNotes] = useState("")
  const [isCreatingRequirement, setIsCreatingRequirement] = useState(false)
  const [statusDrafts, setStatusDrafts] = useState<Record<number, string>>({})
  const [noteDrafts, setNoteDrafts] = useState<Record<number, string>>({})
  const [updatingDocId, setUpdatingDocId] = useState<number | null>(null)

  const [messageSubject, setMessageSubject] = useState("")
  const [messageBody, setMessageBody] = useState("")
  const [isSendingMessage, setIsSendingMessage] = useState(false)

  useEffect(() => {
    if (!caseDetail) return
    setSummaryDescription(caseDetail.description || "")
    setContactDraft({
      contact_name: caseDetail.contact_name || caseDetail.client_name || "",
      contact_email: caseDetail.contact_email || caseDetail.client_email || "",
      contact_phone: caseDetail.contact_phone || caseDetail.client_phone || "",
    })
    setCaseNotes(caseDetail.internal_notes || "")
    setCaseDatesDraft({
      filing_date: formatDateInputValue(caseDetail.filing_date),
      deadline_date: formatDateInputValue(caseDetail.deadline_date),
    })
    setCaseContacts(Array.isArray(caseDetail.contacts) ? caseDetail.contacts : [])
    setCaseKeyDates(Array.isArray(caseDetail.key_dates) ? caseDetail.key_dates : [])
  }, [caseDetail])
  const handleSaveSummary = async () => {
    if (!caseId) return
    const payload: Record<string, any> = {}
    const normalize = (value?: string | null) => (value?.trim() ? value.trim() : null)
    if ((caseDetail?.description || "") !== summaryDescription) {
      payload.description = normalize(summaryDescription)
    }
    if ((caseDetail?.contact_name || "") !== contactDraft.contact_name) {
      payload.contact_name = normalize(contactDraft.contact_name)
    }
    if ((caseDetail?.contact_email || "") !== contactDraft.contact_email) {
      payload.contact_email = normalize(contactDraft.contact_email)
    }
    if ((caseDetail?.contact_phone || "") !== contactDraft.contact_phone) {
      payload.contact_phone = normalize(contactDraft.contact_phone)
    }

    if (Object.keys(payload).length === 0) {
      toast({ title: "Nada para actualizar", description: "No detectamos cambios en el resumen." })
      return
    }

    setSavingSummary(true)
    try {
      await api.updateCase(String(caseId), payload)
      await mutateCase()
      toast({ title: "Resumen actualizado" })
    } catch (error: any) {
      toast({
        title: "No pudimos guardar",
        description: error?.message || "Intenta nuevamente.",
        variant: "destructive",
      })
    } finally {
      setSavingSummary(false)
    }
  }

  const handleSaveDates = async () => {
    if (!caseId) return
    if (
      formatDateInputValue(caseDetail?.filing_date) === caseDatesDraft.filing_date &&
      formatDateInputValue(caseDetail?.deadline_date) === caseDatesDraft.deadline_date
    ) {
      toast({ title: "Sin cambios", description: "No modificaste las fechas principales." })
      return
    }
    setSavingDates(true)
    try {
      await api.updateCase(String(caseId), {
        filing_date: caseDatesDraft.filing_date || null,
        deadline_date: caseDatesDraft.deadline_date || null,
      })
      await mutateCase()
      toast({ title: "Fechas actualizadas" })
    } catch (error: any) {
      toast({
        title: "No se pudieron guardar las fechas",
        description: error?.message || "Revisa la información ingresada.",
        variant: "destructive",
      })
    } finally {
      setSavingDates(false)
    }
  }

  const handleSaveNotes = async () => {
    if (!caseId) return
    if ((caseDetail?.internal_notes || "") === caseNotes) {
      toast({ title: "Sin cambios", description: "No modificaste las notas." })
      return
    }
    setSavingNotes(true)
    try {
      await api.updateCase(String(caseId), { internal_notes: caseNotes.trim() || null })
      await mutateCase()
      toast({ title: "Notas guardadas" })
    } catch (error: any) {
      toast({
        title: "No se pudieron guardar las notas",
        description: error?.message || "Revisa tu conexión.",
        variant: "destructive",
      })
    } finally {
      setSavingNotes(false)
    }
  }

  const sortKeyDates = (items: any[]) =>
    [...items].sort((a, b) => new Date(a.occurs_at).getTime() - new Date(b.occurs_at).getTime())

  const getSuggestedEmails = (target: "client" | "primary" | "contacts") => {
    if (!caseDetail) return []
    if (target === "client" && caseDetail.client_email) {
      return [caseDetail.client_email]
    }
    if (target === "primary" && caseDetail.contact_email) {
      return [caseDetail.contact_email]
    }
    if (target === "contacts") {
      return caseContacts.map((contact) => contact.email).filter(Boolean) as string[]
    }
    return []
  }

  const addSuggestedEmailsToNewForm = (target: "client" | "primary" | "contacts") => {
    const emails = getSuggestedEmails(target)
    if (emails.length === 0) {
      toast({ title: "Sin correos disponibles", description: "No encontramos datos para ese tipo de contacto." })
      return
    }
    setNewKeyDate((prev) => ({
      ...prev,
      recipient_emails: mergeRecipientList(prev.recipient_emails, emails),
    }))
  }

  const addSuggestedEmailsToDraft = (keyDateId: number, target: "client" | "primary" | "contacts") => {
    const emails = getSuggestedEmails(target)
    if (emails.length === 0) {
      toast({ title: "Sin correos disponibles" })
      return
    }
    setKeyDateDrafts((prev) => {
      const draft = prev[keyDateId]
      if (!draft) return prev
      return {
        ...prev,
        [keyDateId]: {
          ...draft,
          recipient_emails: mergeRecipientList(draft.recipient_emails, emails),
        },
      }
    })
  }

  const buildRecipientsPayload = (rawList: string) => {
    const emails = parseEmailList(rawList)
    const seen = new Set<string>()
    const recipients: { email: string; name?: string }[] = []
    emails.forEach((email) => {
      const normalized = email.toLowerCase()
      if (seen.has(normalized)) return
      seen.add(normalized)
      let name: string | undefined
      if (caseDetail?.client_email && caseDetail.client_email.toLowerCase() === normalized) {
        name = caseDetail.client_name || undefined
      } else if (caseDetail?.contact_email && caseDetail.contact_email.toLowerCase() === normalized) {
        name = caseDetail.contact_name || undefined
      } else {
        const extraContact = caseContacts.find(
          (contact) => typeof contact.email === "string" && contact.email.toLowerCase() === normalized,
        )
        if (extraContact) {
          name = extraContact.full_name
        }
      }
      recipients.push({ email, name })
    })
    return recipients
  }

  const buildKeyDateDraft = (entry: any) => {
    const { date, time } = splitDateTime(entry.occurs_at)
    const recipients =
      Array.isArray(entry.notify_emails) && entry.notify_emails.length > 0
        ? entry.notify_emails.map((recipient: any) => recipient.email).filter(Boolean).join(", ")
        : ""
    return {
      title: entry.title || "",
      description: entry.description || "",
      type: entry.type || "",
      date,
      time,
      location: entry.location || "",
      duration_minutes: entry.duration_minutes || 60,
      recipient_emails: recipients,
      sendEmail: Boolean(entry.notify_by_email),
      remind_minutes_before: entry.remind_minutes_before || 1440,
      email_subject: entry.email_subject || "",
      email_body: entry.email_body || "",
      sync_to_calendar: Boolean(entry.sync_to_calendar),
      timezone: entry.timezone || defaultTimezone,
    }
  }

  const handleCreateContact = async () => {
    if (!caseId) return
    if (!contactForm.full_name.trim()) {
      toast({ title: "Completa el nombre", variant: "destructive" })
      return
    }
    setSavingContactId("new")
    try {
      const response = await api.createCaseContact(caseId, contactForm)
      setCaseContacts((prev) => [...prev, response.contact])
      setContactForm({
        full_name: "",
        email: "",
        phone: "",
        role: "",
        organization: "",
        notes: "",
      })
      await mutateCase()
      toast({ title: "Contacto agregado" })
    } catch (error: any) {
      toast({
        title: "No se pudo agregar el contacto",
        description: error?.message || "Intenta nuevamente.",
        variant: "destructive",
      })
    } finally {
      setSavingContactId(null)
    }
  }

  const handleEditContactChange = (id: number, field: string, value: string) => {
    setContactEdits((prev) => ({
      ...prev,
      [id]: { ...(prev[id] || {}), [field]: value },
    }))
  }

  const handleStartEditContact = (contact: any) => {
    setContactEdits((prev) => ({
      ...prev,
      [contact.id]: {
        full_name: contact.full_name || "",
        email: contact.email || "",
        phone: contact.phone || "",
        role: contact.role || "",
        organization: contact.organization || "",
        notes: contact.notes || "",
      },
    }))
  }

  const handleCancelContactEdit = (id: number) => {
    setContactEdits((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
  }

  const handleSaveContactEdit = async (id: number) => {
    if (!caseId) return
    const draft = contactEdits[id]
    if (!draft) return
    setSavingContactId(id)
    try {
      const response = await api.updateCaseContact(caseId, id, draft)
      setCaseContacts((prev) => prev.map((contact) => (contact.id === id ? response.contact : contact)))
      handleCancelContactEdit(id)
      await mutateCase()
      toast({ title: "Contacto actualizado" })
    } catch (error: any) {
      toast({
        title: "No se pudo actualizar el contacto",
        description: error?.message || "Revisa la información.",
        variant: "destructive",
      })
    } finally {
      setSavingContactId(null)
    }
  }

  const handleDeleteContact = async (id: number) => {
    if (!caseId) return
    setDeletingContactId(id)
    try {
      await api.deleteCaseContact(caseId, id)
      setCaseContacts((prev) => prev.filter((contact) => contact.id !== id))
      await mutateCase()
      toast({ title: "Contacto eliminado" })
    } catch (error: any) {
      toast({
        title: "No se pudo eliminar",
        description: error?.message || "Revisa la conexión.",
        variant: "destructive",
      })
    } finally {
      setDeletingContactId(null)
    }
  }

  const handleCreateKeyDate = async () => {
    if (!caseId) return
    if (!newKeyDate.title.trim() || !newKeyDate.date) {
      toast({ title: "Completa título y fecha", variant: "destructive" })
      return
    }
    const occursAt = composeDateTime(newKeyDate.date, newKeyDate.time)
    if (!occursAt) {
      toast({ title: "Fecha invalida", variant: "destructive" })
      return
    }
    const recipients = buildRecipientsPayload(newKeyDate.recipient_emails)
    setSavingKeyDateId("new")
    try {
      const payload = {
        title: newKeyDate.title,
        description: newKeyDate.description || null,
        type: newKeyDate.type || null,
        occurs_at: occursAt,
        timezone: newKeyDate.timezone,
        location: newKeyDate.location || null,
        duration_minutes: Number(newKeyDate.duration_minutes) || 60,
        notify_by_email: newKeyDate.sendEmail && recipients.length > 0,
        notify_emails: recipients,
        remind_minutes_before: newKeyDate.sendEmail ? Number(newKeyDate.remind_minutes_before) || 1440 : null,
        email_subject: newKeyDate.email_subject || null,
        email_body: newKeyDate.email_body || null,
        sync_to_calendar: newKeyDate.sync_to_calendar,
      }
      const response = await api.createCaseKeyDate(caseId, payload)
      setCaseKeyDates((prev) => sortKeyDates([...prev, response.key_date]))
      await mutateCase()
      toast({ title: "Fecha clave creada" })
      setNewKeyDate((prev) => ({
        ...prev,
        title: "",
        description: "",
        type: "",
        date: "",
        time: "",
        location: "",
        duration_minutes: 60,
        recipient_emails: "",
        remind_minutes_before: 1440,
        email_subject: "",
        email_body: "",
      }))
    } catch (error: any) {
      toast({
        title: "No se pudo crear la fecha",
        description: error?.message || "Revisa los datos ingresados.",
        variant: "destructive",
      })
    } finally {
      setSavingKeyDateId(null)
    }
  }

  const handleStartKeyDateEdit = (entry: any) => {
    setKeyDateDrafts((prev) => ({
      ...prev,
      [entry.id]: prev[entry.id] || buildKeyDateDraft(entry),
    }))
  }

  const handleCancelKeyDateEdit = (keyDateId: number) => {
    setKeyDateDrafts((prev) => {
      const next = { ...prev }
      delete next[keyDateId]
      return next
    })
  }

  const handleSaveKeyDateEdit = async (keyDateId: number) => {
    if (!caseId) return
    const draft = keyDateDrafts[keyDateId]
    if (!draft) return
    if (!draft.title.trim() || !draft.date) {
      toast({ title: "Completa título y fecha", variant: "destructive" })
      return
    }
    const occursAt = composeDateTime(draft.date, draft.time)
    if (!occursAt) {
      toast({ title: "Fecha invalida", variant: "destructive" })
      return
    }
    const recipients = buildRecipientsPayload(draft.recipient_emails)
    setSavingKeyDateId(keyDateId)
    try {
      const payload = {
        title: draft.title,
        description: draft.description || null,
        type: draft.type || null,
        occurs_at: occursAt,
        timezone: draft.timezone,
        location: draft.location || null,
        duration_minutes: Number(draft.duration_minutes) || 60,
        notify_by_email: draft.sendEmail && recipients.length > 0,
        notify_emails: recipients,
        remind_minutes_before: draft.sendEmail ? Number(draft.remind_minutes_before) || 1440 : null,
        email_subject: draft.email_subject || null,
        email_body: draft.email_body || null,
        sync_to_calendar: draft.sync_to_calendar,
      }
      const response = await api.updateCaseKeyDate(caseId, keyDateId, payload)
      setCaseKeyDates((prev) => sortKeyDates(prev.map((entry) => (entry.id === keyDateId ? response.key_date : entry))))
      setKeyDateDrafts((prev) => {
        const next = { ...prev }
        delete next[keyDateId]
        return next
      })
      await mutateCase()
      toast({ title: "Fecha actualizada" })
    } catch (error: any) {
      toast({
        title: "No se pudo actualizar la fecha",
        description: error?.message || "Revisa los datos.",
        variant: "destructive",
      })
    } finally {
      setSavingKeyDateId(null)
    }
  }

  const handleDeleteKeyDate = async (keyDateId: number) => {
    if (!caseId) return
    setDeletingKeyDateId(keyDateId)
    try {
      await api.deleteCaseKeyDate(caseId, keyDateId)
      setCaseKeyDates((prev) => prev.filter((entry) => entry.id !== keyDateId))
      setKeyDateDrafts((prev) => {
        const next = { ...prev }
        delete next[keyDateId]
        return next
      })
      await mutateCase()
      toast({ title: "Fecha eliminada" })
    } catch (error: any) {
      toast({
        title: "No se pudo eliminar",
        description: error?.message || "Revisa la conexión.",
        variant: "destructive",
      })
    } finally {
      setDeletingKeyDateId(null)
    }
  }

  const handleStageDraftChange = (stage: any, field: string, rawValue: string) => {
    setStageDrafts((prev) => {
      const currentDraft = { ...(prev[stage.id] || {}) }
      const baseValue = (() => {
        if (field === "due_date") {
          return stage.due_date ? stage.due_date.slice(0, 10) : ""
        }
        if (field === "notes") {
          return stage.notes || ""
        }
        if (field === "assigned_staff_id") {
          return stage.assigned_staff_id || ""
        }
        if (field === "status") {
          return stage.status || ""
        }
        return stage[field] || ""
      })()
      const value = rawValue || ""
      if (value === (baseValue || "")) {
        delete currentDraft[field]
      } else {
        currentDraft[field] = field === "notes" ? value : value
      }
      if (Object.keys(currentDraft).length === 0) {
        const nextDrafts = { ...prev }
        delete nextDrafts[stage.id]
        return nextDrafts
      }
      return { ...prev, [stage.id]: currentDraft }
    })
  }

  const handleSaveStage = async (stage: any) => {
    if (!caseId) return
    const draft = stageDrafts[stage.id]
    if (!draft || Object.keys(draft).length === 0) {
      toast({ title: "Sin cambios", description: "Actualiza la etapa antes de guardar." })
      return
    }

    const payload: Record<string, any> = {}
    if (draft.status && draft.status !== stage.status) {
      payload.status = draft.status
    }
    if (draft.notes !== undefined) {
      payload.notes = draft.notes?.trim() ? draft.notes : null
    }
    if (draft.assigned_staff_id !== undefined) {
      payload.assigned_staff_id = draft.assigned_staff_id?.trim() ? draft.assigned_staff_id.trim() : null
    }
    if (draft.due_date !== undefined) {
      payload.due_date = draft.due_date ? new Date(draft.due_date).toISOString() : null
    }

    if (Object.keys(payload).length === 0) {
      toast({ title: "Sin cambios", description: "Selecciona un nuevo valor antes de guardar." })
      return
    }

    setSavingStageId(stage.id)
    try {
      await api.updateCaseStage(String(caseId), String(stage.id), payload)
      await mutateCase()
      setStageDrafts((prev) => {
        const next = { ...prev }
        delete next[stage.id]
        return next
      })
      toast({ title: "Etapa actualizada" })
    } catch (error: any) {
      toast({
        title: "No pudimos actualizar la etapa",
        description: error?.message || "Revisa los campos e intenta de nuevo.",
        variant: "destructive",
      })
    } finally {
      setSavingStageId(null)
    }
  }

  const handleCreateEvent = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!caseId) return
    if (!eventForm.title.trim()) {
      toast({ title: "Falta el título", description: "Describe el evento que quieres registrar.", variant: "destructive" })
      return
    }

    setCreatingEvent(true)
    try {
      await api.createCaseEvent(String(caseId), {
        title: eventForm.title.trim(),
        type: eventForm.type,
        description: eventForm.description.trim() || null,
        occurred_at: eventForm.occurred_at,
      })
      setEventForm({
        title: "",
        type: eventForm.type,
        description: "",
        occurred_at: defaultEventDate,
      })
      await mutateCase()
      toast({ title: "Evento registrado" })
    } catch (error: any) {
      toast({
        title: "No pudimos registrar el evento",
        description: error?.message || "Intenta nuevamente.",
        variant: "destructive",
      })
    } finally {
      setCreatingEvent(false)
    }
  }

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

  const handleSendMessage = async () => {
    const receiverId = caseDetail?.client_id || clientId
    if (!caseId || !receiverId) {
      toast({
        title: "No se puede enviar el mensaje",
        description: "No encontramos al destinatario de este caso.",
        variant: "destructive",
      })
      return
    }

    if (!messageBody.trim()) {
      toast({
        title: "Escribe un mensaje",
        description: "El mensaje no puede estar vacío.",
        variant: "destructive",
      })
      return
    }

    setIsSendingMessage(true)
    try {
      await apiClient.post("/api/messages", {
        case_id: Number(caseId),
        receiver_id: receiverId,
        subject: messageSubject.trim() || null,
        content: messageBody.trim(),
      })
      toast({ title: "Mensaje enviado", description: "El cliente fue notificado." })
      setMessageSubject("")
      setMessageBody("")
      mutateMessages()
    } catch (error: any) {
      toast({
        title: "No pudimos enviar el mensaje",
        description: error?.message || "Intenta nuevamente.",
        variant: "destructive",
      })
    } finally {
      setIsSendingMessage(false)
    }
  }

  const handleAnalyzeDocument = async () => {
    if (!selectedAiDocument) {
      toast({
        title: "Selecciona un documento",
        description: "Solo podemos analizar archivos ya cargados en el expediente.",
        variant: "destructive",
      })
      return
    }

    if (!documentHasFile(selectedAiDocument)) {
      toast({
        title: "Documento sin archivo",
        description: "Este registro no tiene un PDF asociado.",
        variant: "destructive",
      })
      return
    }

    if (!aiPrompt.trim()) {
      toast({
        title: "Escribe instrucciones",
        description: "Indica qué debe verificar el agente.",
        variant: "destructive",
      })
      return
    }

    setAiIsAnalyzing(true)
    try {
      const aiResponse = await apiClient.post("/api/ai/document-review", {
        prompt: aiPrompt.trim(),
        document_id: selectedAiDocument.id,
        case_id: caseId,
      })

      setAiLastResponse({
        role: "assistant",
        content: aiResponse?.result || "El agente no devolvió detalles.",
        timestamp: new Date().toISOString(),
      })
      toast({ title: "Análisis completado" })
    } catch (error: any) {
      console.error("AI review error", error)
      toast({
        title: "No pudimos analizar el documento",
        description: error?.message || "Intenta nuevamente en unos minutos.",
        variant: "destructive",
      })
    } finally {
      setAiIsAnalyzing(false)
    }
  }

  const handleResetAi = () => {
    setAiDocumentId("")
    setAiLastResponse(null)
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

  const lifecycleBadge = CASE_LIFECYCLE_BADGES[caseDetail.lifecycle_status] || CASE_LIFECYCLE_BADGES.preparation

  return (
    <div className="space-y-6">
      <Link href={`/admin/clients/${clientId}`} className="inline-flex items-center text-sm font-semibold text-primary">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Volver al cliente
      </Link>

      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">{caseDetail.case_number}</p>
          <h1 className="mt-2 text-3xl font-semibold text-foreground">{caseDetail.title}</h1>
          <p className="text-muted-foreground">
            Cliente {caseDetail.client_name || "Sin datos"} · Tipo {caseDetail.case_type?.replace("_", " ")}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <CaseStatusBadge status={caseDetail.status} />
          <PriorityBadge priority={caseDetail.priority} />
          <Badge className={`px-3 py-1 text-xs font-semibold ${lifecycleBadge.className}`}>{lifecycleBadge.label}</Badge>
        </div>
      </div>

      <Tabs defaultValue="summary" className="space-y-6">
        <TabsList>
          <TabsTrigger value="summary">Resumen</TabsTrigger>
          <TabsTrigger value="documents">Documentos</TabsTrigger>
          <TabsTrigger value="chat">Chat</TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="mt-6 space-y-6">
          <Card className="p-6 space-y-6">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Resumen operativo</h2>
                <p className="text-sm text-muted-foreground">Centraliza los datos del expediente y del cliente.</p>
              </div>
              <Badge variant="outline" className="flex items-center gap-1">
                <User className="h-3.5 w-3.5" />
                {caseDetail.staff_name || "Sin responsable"}
              </Badge>
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold uppercase text-muted-foreground">Descripción ampliada</label>
                  <Textarea
                    className="mt-2 min-h-[140px]"
                    value={summaryDescription}
                    onChange={(event) => setSummaryDescription(event.target.value)}
                    placeholder="Notas generales, contexto adicional o links útiles para este caso."
                  />
                </div>
                <div className="grid gap-4">
                  <div>
                    <label className="text-xs font-semibold uppercase text-muted-foreground">Contacto principal</label>
                    <Input
                      className="mt-1"
                      value={contactDraft.contact_name}
                      onChange={(event) => setContactDraft((prev) => ({ ...prev, contact_name: event.target.value }))}
                      placeholder="Nombre completo"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase text-muted-foreground">Correo alternativo</label>
                    <Input
                      className="mt-1"
                      type="email"
                      value={contactDraft.contact_email}
                      onChange={(event) => setContactDraft((prev) => ({ ...prev, contact_email: event.target.value }))}
                      placeholder="email@contacto.com"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase text-muted-foreground">Teléfono</label>
                    <Input
                      className="mt-1"
                      value={contactDraft.contact_phone}
                      onChange={(event) => setContactDraft((prev) => ({ ...prev, contact_phone: event.target.value }))}
                      placeholder="+34 600 000 000"
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button onClick={handleSaveSummary} disabled={savingSummary}>
                    {savingSummary ? "Guardando..." : "Guardar resumen"}
                  </Button>
                </div>
              </div>
              <div className="space-y-4">
                <div className="rounded-2xl border border-border/50 p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Datos del caso</p>
                  <div className="mt-3 grid gap-4 text-sm sm:grid-cols-2">
                    <div>
                      <p className="text-muted-foreground">Tipo</p>
                      <p className="font-semibold capitalize">{caseDetail.case_type?.replace("_", " ") || "Sin dato"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Prioridad</p>
                      <p className="font-semibold capitalize">{caseDetail.priority}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Creado</p>
                      <p className="font-semibold">{formatDate(caseDetail.created_at)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Última actualización</p>
                      <p className="font-semibold">{formatDate(caseDetail.updated_at)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Deadline actual</p>
                      <p className="font-semibold">{formatDate(caseDetail.deadline_date)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Ciclo</p>
                      <p className="font-semibold">{lifecycleBadge.label}</p>
                    </div>
                  </div>
                </div>
                <div className="rounded-2xl border border-border/50 p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Datos del cliente</p>
                  <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-primary" />
                      <span className="font-semibold text-foreground">{caseDetail.client_name || "Sin datos"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-primary" />
                      <span>{caseDetail.client_email || "Sin correo registrado"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-primary" />
                      <span>{caseDetail.client_phone || "Sin teléfono registrado"}</span>
                    </div>
                  </div>
                </div>
                <div className="rounded-2xl border border-border/50 p-4 shadow-sm space-y-4">
                  <div className="flex items-center gap-2">
                    <CalendarClock className="h-4 w-4 text-primary" />
                    <div>
                      <p className="text-sm font-semibold text-foreground">Fechas principales</p>
                      <p className="text-xs text-muted-foreground">Ajusta la presentación y el deadline general.</p>
                    </div>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <label className="text-xs font-semibold uppercase text-muted-foreground">Presentación</label>
                      <Input
                        type="date"
                        className="mt-1"
                        value={caseDatesDraft.filing_date}
                        onChange={(event) => setCaseDatesDraft((prev) => ({ ...prev, filing_date: event.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold uppercase text-muted-foreground">Deadline actual</label>
                      <Input
                        type="date"
                        className="mt-1"
                        value={caseDatesDraft.deadline_date}
                        onChange={(event) => setCaseDatesDraft((prev) => ({ ...prev, deadline_date: event.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button variant="secondary" onClick={handleSaveDates} disabled={savingDates}>
                      {savingDates ? "Guardando..." : "Guardar fechas"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </Card>
          <Card className="p-6 space-y-6">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Personas de contacto</h3>
                <p className="text-sm text-muted-foreground">Comparte información clave con familiares o gestores.</p>
              </div>
              <Badge variant="secondary">{caseContacts.length} registradas</Badge>
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-dashed border-border/70 p-4 space-y-3">
                <p className="text-sm font-semibold text-foreground">Agregar nueva persona</p>
                <Input
                  placeholder="Nombre completo"
                  value={contactForm.full_name}
                  onChange={(event) => setContactForm((prev) => ({ ...prev, full_name: event.target.value }))}
                />
                <div className="grid gap-3 md:grid-cols-2">
                  <Input
                    placeholder="Rol / relación"
                    value={contactForm.role}
                    onChange={(event) => setContactForm((prev) => ({ ...prev, role: event.target.value }))}
                  />
                  <Input
                    placeholder="Organización"
                    value={contactForm.organization}
                    onChange={(event) => setContactForm((prev) => ({ ...prev, organization: event.target.value }))}
                  />
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <Input
                    placeholder="Correo"
                    type="email"
                    value={contactForm.email}
                    onChange={(event) => setContactForm((prev) => ({ ...prev, email: event.target.value }))}
                  />
                  <Input
                    placeholder="Teléfono"
                    value={contactForm.phone}
                    onChange={(event) => setContactForm((prev) => ({ ...prev, phone: event.target.value }))}
                  />
                </div>
                <Textarea
                  placeholder="Notas internas"
                  value={contactForm.notes}
                  onChange={(event) => setContactForm((prev) => ({ ...prev, notes: event.target.value }))}
                />
                <div className="flex justify-end">
                  <Button onClick={handleCreateContact} disabled={savingContactId === "new"}>
                    {savingContactId === "new" ? "Guardando..." : "Agregar contacto"}
                  </Button>
                </div>
              </div>
              <div className="space-y-4">
                {caseContacts.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border/80 p-6 text-sm text-muted-foreground">
                    Todavía no hay personas asociadas a este expediente.
                  </div>
                ) : (
                  caseContacts.map((contact) => {
                    const draft = contactEdits[contact.id]
                    return (
                      <div key={contact.id} className="rounded-2xl border border-border/60 p-4 shadow-sm space-y-3">
                        {draft ? (
                          <div className="space-y-3">
                            <Input
                              placeholder="Nombre completo"
                              value={draft.full_name}
                              onChange={(event) => handleEditContactChange(contact.id, "full_name", event.target.value)}
                            />
                            <div className="grid gap-3 md:grid-cols-2">
                              <Input
                                placeholder="Rol"
                                value={draft.role}
                                onChange={(event) => handleEditContactChange(contact.id, "role", event.target.value)}
                              />
                              <Input
                                placeholder="Organización"
                                value={draft.organization}
                                onChange={(event) => handleEditContactChange(contact.id, "organization", event.target.value)}
                              />
                            </div>
                            <div className="grid gap-3 md:grid-cols-2">
                              <Input
                                placeholder="Correo"
                                value={draft.email}
                                onChange={(event) => handleEditContactChange(contact.id, "email", event.target.value)}
                              />
                              <Input
                                placeholder="Teléfono"
                                value={draft.phone}
                                onChange={(event) => handleEditContactChange(contact.id, "phone", event.target.value)}
                              />
                            </div>
                            <Textarea
                              placeholder="Notas"
                              value={draft.notes}
                              onChange={(event) => handleEditContactChange(contact.id, "notes", event.target.value)}
                            />
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="sm" onClick={() => handleCancelContactEdit(contact.id)}>
                                Cancelar
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleSaveContactEdit(contact.id)}
                                disabled={savingContactId === contact.id}
                              >
                                {savingContactId === contact.id ? "Guardando..." : "Guardar"}
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2">
                                <p className="text-lg font-semibold text-foreground">{contact.full_name}</p>
                                {contact.is_primary && <Badge variant="secondary">Principal</Badge>}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {[contact.role, contact.organization].filter(Boolean).join(" · ") || "Sin rol definido"}
                              </p>
                            </div>
                            <div className="space-y-1 text-sm text-muted-foreground">
                              {contact.email && (
                                <div className="flex items-center gap-2">
                                  <Mail className="h-4 w-4 text-primary" />
                                  <a href={`mailto:${contact.email}`} className="text-primary underline-offset-2 hover:underline">
                                    {contact.email}
                                  </a>
                                </div>
                              )}
                              {contact.phone && (
                                <div className="flex items-center gap-2">
                                  <Phone className="h-4 w-4 text-primary" />
                                  <span>{contact.phone}</span>
                                </div>
                              )}
                              {contact.notes && <p className="text-xs italic text-muted-foreground">{contact.notes}</p>}
                            </div>
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="sm" onClick={() => handleStartEditContact(contact)}>
                                <Pencil className="mr-1 h-4 w-4" />
                                Editar
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-rose-600 hover:text-rose-700"
                                onClick={() => handleDeleteContact(contact.id)}
                                disabled={deletingContactId === contact.id}
                              >
                                <Trash2 className="mr-1 h-4 w-4" />
                                {deletingContactId === contact.id ? "Eliminando" : "Eliminar"}
                              </Button>
                            </div>
                          </>
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </Card>
          <Card className="p-6 space-y-6">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Fechas clave y recordatorios</h3>
                <p className="text-sm text-muted-foreground">Automatiza recordatorios por email y sincroniza con Google Calendar.</p>
              </div>
              <Badge variant="outline" className="flex items-center gap-1">
                <CalendarClock className="h-4 w-4" />
                {caseKeyDates.length} programadas
              </Badge>
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-dashed border-border/70 p-4 space-y-3">
                <p className="text-sm font-semibold text-foreground">Registrar nueva fecha</p>
                <Input
                  placeholder="Título del hito"
                  value={newKeyDate.title}
                  onChange={(event) => setNewKeyDate((prev) => ({ ...prev, title: event.target.value }))}
                />
                <div className="grid gap-3 md:grid-cols-2">
                  <Input
                    type="date"
                    value={newKeyDate.date}
                    onChange={(event) => setNewKeyDate((prev) => ({ ...prev, date: event.target.value }))}
                  />
                  <Input
                    type="time"
                    value={newKeyDate.time}
                    onChange={(event) => setNewKeyDate((prev) => ({ ...prev, time: event.target.value }))}
                  />
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <Input
                    placeholder="Tipo"
                    value={newKeyDate.type}
                    onChange={(event) => setNewKeyDate((prev) => ({ ...prev, type: event.target.value }))}
                  />
                  <Input
                    placeholder="Ubicación / enlace"
                    value={newKeyDate.location}
                    onChange={(event) => setNewKeyDate((prev) => ({ ...prev, location: event.target.value }))}
                  />
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <Input
                    type="number"
                    min={15}
                    placeholder="Duración (min)"
                    value={newKeyDate.duration_minutes}
                    onChange={(event) => setNewKeyDate((prev) => ({ ...prev, duration_minutes: event.target.value }))}
                  />
                  <Input
                    placeholder="Zona horaria"
                    value={newKeyDate.timezone}
                    onChange={(event) => setNewKeyDate((prev) => ({ ...prev, timezone: event.target.value }))}
                  />
                </div>
                <Textarea
                  placeholder="Descripción interna"
                  value={newKeyDate.description}
                  onChange={(event) => setNewKeyDate((prev) => ({ ...prev, description: event.target.value }))}
                />
                <div>
                  <label className="text-xs font-semibold uppercase text-muted-foreground">Destinatarios del aviso</label>
                  <Textarea
                    className="mt-1"
                    placeholder="email1@ejemplo.com, email2@ejemplo.com"
                    value={newKeyDate.recipient_emails}
                    onChange={(event) => setNewKeyDate((prev) => ({ ...prev, recipient_emails: event.target.value }))}
                  />
                  <div className="mt-1 flex flex-wrap gap-2 text-xs">
                    <Button variant="secondary" size="sm" onClick={() => addSuggestedEmailsToNewForm("client")}>
                      Cliente
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => addSuggestedEmailsToNewForm("primary")}>
                      Contacto principal
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => addSuggestedEmailsToNewForm("contacts")}>
                      Contactos extra
                    </Button>
                  </div>
                </div>
                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border border-border"
                    checked={newKeyDate.sendEmail}
                    onChange={(event) => setNewKeyDate((prev) => ({ ...prev, sendEmail: event.target.checked }))}
                  />
                  Enviar recordatorio por email
                </label>
                {newKeyDate.sendEmail && (
                  <div className="grid gap-2">
                    <Input
                      type="number"
                      min={5}
                      placeholder="Minutos antes"
                      value={newKeyDate.remind_minutes_before}
                      onChange={(event) =>
                        setNewKeyDate((prev) => ({ ...prev, remind_minutes_before: event.target.value }))
                      }
                    />
                    <Input
                      placeholder="Asunto del email"
                      value={newKeyDate.email_subject}
                      onChange={(event) => setNewKeyDate((prev) => ({ ...prev, email_subject: event.target.value }))}
                    />
                    <Textarea
                      placeholder="Mensaje a enviar"
                      value={newKeyDate.email_body}
                      onChange={(event) => setNewKeyDate((prev) => ({ ...prev, email_body: event.target.value }))}
                    />
                  </div>
                )}
                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border border-border"
                    checked={newKeyDate.sync_to_calendar}
                    onChange={(event) => setNewKeyDate((prev) => ({ ...prev, sync_to_calendar: event.target.checked }))}
                  />
                  Sincronizar con Google Calendar
                </label>
                <div className="flex justify-end">
                  <Button onClick={handleCreateKeyDate} disabled={savingKeyDateId === "new"}>
                    {savingKeyDateId === "new" ? "Guardando..." : "Agregar fecha"}
                  </Button>
                </div>
              </div>
              <div className="space-y-4">
                {caseKeyDates.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border/70 p-6 text-sm text-muted-foreground">
                    Todavía no hay hitos cargados. Registra uno para comenzar a automatizar avisos.
                  </div>
                ) : (
                  caseKeyDates.map((keyDate) => {
                    const draft = keyDateDrafts[keyDate.id]
                    const reminder = keyDate.reminder
                    return (
                      <div key={keyDate.id} className="rounded-2xl border border-border/60 p-4 shadow-sm space-y-3">
                        {draft ? (
                          <div className="space-y-3">
                            <Input
                              placeholder="Título del hito"
                              value={draft.title}
                              onChange={(event) =>
                                setKeyDateDrafts((prev) => ({ ...prev, [keyDate.id]: { ...draft, title: event.target.value } }))
                              }
                            />
                            <div className="grid gap-3 md:grid-cols-2">
                              <Input
                                type="date"
                                value={draft.date}
                                onChange={(event) =>
                                  setKeyDateDrafts((prev) => ({ ...prev, [keyDate.id]: { ...draft, date: event.target.value } }))
                                }
                              />
                              <Input
                                type="time"
                                value={draft.time}
                                onChange={(event) =>
                                  setKeyDateDrafts((prev) => ({ ...prev, [keyDate.id]: { ...draft, time: event.target.value } }))
                                }
                              />
                            </div>
                            <Input
                              placeholder="Tipo"
                              value={draft.type}
                              onChange={(event) =>
                                setKeyDateDrafts((prev) => ({ ...prev, [keyDate.id]: { ...draft, type: event.target.value } }))
                              }
                            />
                            <Input
                              placeholder="Ubicación / enlace"
                              value={draft.location}
                              onChange={(event) =>
                                setKeyDateDrafts((prev) => ({ ...prev, [keyDate.id]: { ...draft, location: event.target.value } }))
                              }
                            />
                            <div className="grid gap-3 md:grid-cols-2">
                              <Input
                                type="number"
                                min={15}
                                placeholder="Duración (min)"
                                value={draft.duration_minutes}
                                onChange={(event) =>
                                  setKeyDateDrafts((prev) => ({
                                    ...prev,
                                    [keyDate.id]: { ...draft, duration_minutes: event.target.value },
                                  }))
                                }
                              />
                              <Input
                                placeholder="Zona horaria"
                                value={draft.timezone}
                                onChange={(event) =>
                                  setKeyDateDrafts((prev) => ({
                                    ...prev,
                                    [keyDate.id]: { ...draft, timezone: event.target.value },
                                  }))
                                }
                              />
                            </div>
                            <Textarea
                              placeholder="Descripción interna"
                              value={draft.description}
                              onChange={(event) =>
                                setKeyDateDrafts((prev) => ({
                                  ...prev,
                                  [keyDate.id]: { ...draft, description: event.target.value },
                                }))
                              }
                            />
                            <Textarea
                              placeholder="Destinatarios"
                              value={draft.recipient_emails}
                              onChange={(event) =>
                                setKeyDateDrafts((prev) => ({
                                  ...prev,
                                  [keyDate.id]: { ...draft, recipient_emails: event.target.value },
                                }))
                              }
                            />
                            <div className="flex flex-wrap gap-2 text-xs">
                              <Button variant="secondary" size="sm" onClick={() => addSuggestedEmailsToDraft(keyDate.id, "client")}>
                                Cliente
                              </Button>
                              <Button variant="secondary" size="sm" onClick={() => addSuggestedEmailsToDraft(keyDate.id, "primary")}>
                                Contacto principal
                              </Button>
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => addSuggestedEmailsToDraft(keyDate.id, "contacts")}
                              >
                                Contactos extra
                              </Button>
                            </div>
                            <label className="flex items-center gap-2 text-sm text-muted-foreground">
                              <input
                                type="checkbox"
                                className="h-4 w-4 rounded border border-border"
                                checked={draft.sendEmail}
                                onChange={(event) =>
                                  setKeyDateDrafts((prev) => ({
                                    ...prev,
                                    [keyDate.id]: { ...draft, sendEmail: event.target.checked },
                                  }))
                                }
                              />
                              Recordatorio por email
                            </label>
                            <label className="flex items-center gap-2 text-sm text-muted-foreground">
                              <input
                                type="checkbox"
                                className="h-4 w-4 rounded border border-border"
                                checked={draft.sync_to_calendar}
                                onChange={(event) =>
                                  setKeyDateDrafts((prev) => ({
                                    ...prev,
                                    [keyDate.id]: { ...draft, sync_to_calendar: event.target.checked },
                                  }))
                                }
                              />
                              Sincronizar con Google Calendar
                            </label>
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="sm" onClick={() => handleCancelKeyDateEdit(keyDate.id)}>
                                Cancelar
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleSaveKeyDateEdit(keyDate.id)}
                                disabled={savingKeyDateId === keyDate.id}
                              >
                                {savingKeyDateId === keyDate.id ? "Guardando..." : "Guardar"}
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-lg font-semibold text-foreground">{keyDate.title}</p>
                              {keyDate.type && <Badge variant="secondary">{keyDate.type}</Badge>}
                              {keyDate.sync_to_calendar && (
                                <Badge variant="outline" className="flex items-center gap-1">
                                  <CalendarClock className="h-3.5 w-3.5" />
                                  Calendar
                                </Badge>
                              )}
                              {keyDate.notify_by_email && (
                                <Badge variant="outline" className="flex items-center gap-1">
                                  <Bell className="h-3.5 w-3.5" />
                                  Auto email
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{formatDateTime(keyDate.occurs_at)}</p>
                            {reminder && (
                              <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-2 text-xs text-muted-foreground">
                                <Bell className="h-4 w-4" />
                                {reminder.status === "sent"
                                  ? `Recordatorio enviado ${formatDateTime(reminder.sent_at)}`
                                  : `Recordatorio programado para ${formatDateTime(reminder.send_at)}`}
                              </div>
                            )}
                            {keyDate.google_calendar_html_link && (
                              <a
                                href={keyDate.google_calendar_html_link}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-sm font-semibold text-primary"
                              >
                                <ExternalLink className="h-4 w-4" />
                                Ver en Google Calendar
                              </a>
                            )}
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="sm" onClick={() => handleStartKeyDateEdit(keyDate)}>
                                <Pencil className="mr-1 h-4 w-4" />
                                Editar
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-rose-600 hover:text-rose-700"
                                onClick={() => handleDeleteKeyDate(keyDate.id)}
                                disabled={deletingKeyDateId === keyDate.id}
                              >
                                <Trash2 className="mr-1 h-4 w-4" />
                                {deletingKeyDateId === keyDate.id ? "Eliminando" : "Eliminar"}
                              </Button>
                            </div>
                          </>
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </Card>
          <Card className="p-6 space-y-4">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Notas internas del expediente</h3>
                <p className="text-sm text-muted-foreground">Solo visibles para el equipo administrador.</p>
              </div>
              <Badge variant="secondary">Privado</Badge>
            </div>
            <Textarea
              className="min-h-[160px]"
              value={caseNotes}
              onChange={(event) => setCaseNotes(event.target.value)}
              placeholder="Registra decisiones, acuerdos o recordatorios clave."
            />
            <div className="flex justify-end">
              <Button onClick={handleSaveNotes} disabled={savingNotes}>
                {savingNotes ? "Guardando..." : "Guardar notas"}
              </Button>
            </div>
          </Card>
          <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
            <Card className="p-6 space-y-6">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Línea de tiempo inteligente</h3>
                  <p className="text-sm text-muted-foreground">
                    Gestiona las fases, plazos, notas internas y responsables desde un único lugar.
                  </p>
                </div>
                <Badge className={`px-3 py-1 text-xs font-semibold ${lifecycleBadge.className}`}>{lifecycleBadge.label}</Badge>
              </div>

              {stages.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border/70 p-6 text-center text-sm text-muted-foreground">
                  Todavía no hay etapas configuradas para este caso.
                </div>
              ) : (
                <div className="space-y-4">
                  {stages.map((stage: any) => {
                    const badge = STAGE_STATUS_BADGES[stage.status] || STAGE_STATUS_BADGES.pending
                    const drafts = stageDrafts[stage.id] || {}
                    const stageDirty = Boolean(stageDrafts[stage.id] && Object.keys(stageDrafts[stage.id]).length > 0)
                    return (
                      <div key={stage.id} className="rounded-2xl border border-border/70 p-4 shadow-sm">
                        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                          <div>
                            <p className="text-xs font-semibold uppercase text-muted-foreground">Fase {stage.order_index + 1}</p>
                            <p className="text-lg font-semibold text-foreground">{stage.title}</p>
                            {stage.description && <p className="text-sm text-muted-foreground">{stage.description}</p>}
                          </div>
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badge.className}`}>{badge.label}</span>
                        </div>

                        <div className="mt-4 grid gap-3 lg:grid-cols-3">
                          <div>
                            <label className="text-xs font-semibold uppercase text-muted-foreground">Estado</label>
                            <select
                              value={drafts.status ?? stage.status}
                              onChange={(event) => handleStageDraftChange(stage, "status", event.target.value)}
                              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                            >
                              {STAGE_STATUS_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="text-xs font-semibold uppercase text-muted-foreground">Fecha objetivo</label>
                            <Input
                              type="date"
                              className="mt-1"
                              value={drafts.due_date ?? (stage.due_date ? stage.due_date.slice(0, 10) : "")}
                              onChange={(event) => handleStageDraftChange(stage, "due_date", event.target.value)}
                            />
                          </div>
                          <div>
                            <label className="text-xs font-semibold uppercase text-muted-foreground">Responsable interno</label>
                            <Input
                              className="mt-1"
                              value={drafts.assigned_staff_id ?? (stage.assigned_staff_id || "")}
                              onChange={(event) => handleStageDraftChange(stage, "assigned_staff_id", event.target.value)}
                              placeholder="ID o correo del responsable"
                            />
                          </div>
                        </div>

                        <div className="mt-3">
                          <label className="text-xs font-semibold uppercase text-muted-foreground">Notas de seguimiento</label>
                          <Textarea
                            className="mt-1 min-h-[90px]"
                            value={drafts.notes ?? (stage.notes || "")}
                            onChange={(event) => handleStageDraftChange(stage, "notes", event.target.value)}
                            placeholder="Especifica bloqueos, requisitos o acuerdos pendientes."
                          />
                        </div>

                        {Array.isArray(stage.required_documents) && stage.required_documents.length > 0 && (
                          <div className="mt-3 rounded-2xl bg-muted/30 p-3 text-xs text-muted-foreground">
                            <p className="font-semibold text-foreground">Documentos requeridos:</p>
                            <ul className="mt-1 list-disc pl-4">
                              {stage.required_documents.map((doc: any, index: number) => (
                                <li key={`${stage.id}-doc-${index}`}>{typeof doc === "string" ? doc : doc?.name}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <div className="mt-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                          <p className="text-xs text-muted-foreground">
                            Última actualización: {formatDateTime(stage.completed_at || stage.created_at)}
                          </p>
                          <Button
                            size="sm"
                            onClick={() => handleSaveStage(stage)}
                            disabled={savingStageId === stage.id || !stageDirty}
                          >
                            {savingStageId === stage.id ? "Guardando..." : "Actualizar etapa"}
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
              <div className="rounded-2xl border border-dashed border-border/70 p-5">
                <form className="space-y-3" onSubmit={handleCreateEvent}>
                  <div className="flex items-center gap-2">
                    <Plus className="h-4 w-4 text-primary" />
                    <p className="text-sm font-semibold text-foreground">Registrar evento en la línea de tiempo</p>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <label className="text-xs font-semibold uppercase text-muted-foreground">Título</label>
                      <Input
                        className="mt-1"
                        value={eventForm.title}
                        onChange={(event) => setEventForm((prev) => ({ ...prev, title: event.target.value }))}
                        placeholder="Ej: Documento aprobado"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold uppercase text-muted-foreground">Tipo</label>
                      <select
                        value={eventForm.type}
                        onChange={(event) => setEventForm((prev) => ({ ...prev, type: event.target.value }))}
                        className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        {EVENT_TYPES.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <label className="text-xs font-semibold uppercase text-muted-foreground">Fecha del evento</label>
                      <Input
                        type="date"
                        className="mt-1"
                        value={eventForm.occurred_at}
                        onChange={(event) => setEventForm((prev) => ({ ...prev, occurred_at: event.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold uppercase text-muted-foreground">Descripción</label>
                      <Input
                        className="mt-1"
                        value={eventForm.description}
                        onChange={(event) => setEventForm((prev) => ({ ...prev, description: event.target.value }))}
                        placeholder="Opcional"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button type="submit" disabled={creatingEvent}>
                      {creatingEvent ? "Registrando..." : "Registrar evento"}
                    </Button>
                  </div>
                </form>

                <div className="mt-5 space-y-2">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">Eventos recientes</p>
                  {caseEvents.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Aún no registraste hitos manuales en este expediente.</p>
                  ) : (
                    <ul className="space-y-2 text-sm">
                      {caseEvents.slice(0, 6).map((event: any) => (
                        <li key={event.id} className="rounded-xl border border-border/60 px-3 py-2">
                          <p className="font-semibold text-foreground">{event.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDateTime(event.occurred_at)} · {event.author_name || "Equipo"}
                          </p>
                          {event.description && <p className="text-sm text-muted-foreground">{event.description}</p>}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </Card>

            <Card className="p-6 space-y-4">
              <div className="flex items-center gap-2">
                <ActivityIcon className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold text-foreground">Actividad reciente</h3>
              </div>
              {activities.length === 0 ? (
                <p className="text-sm text-muted-foreground">Todavía no hay movimientos registrados.</p>
              ) : (
                <ul className="space-y-3 text-sm">
                  {activities.slice(0, 8).map((activity: any) => (
                    <li key={activity.id} className="rounded-2xl border border-border/70 p-3">
                      <p className="font-medium text-foreground">{activity.description || activity.action}</p>
                      <p className="text-xs text-muted-foreground">{formatDateTime(activity.created_at)}</p>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="documents" className="mt-6 space-y-6">
          <Card className="p-6 space-y-5">
            <div className="flex items-center gap-2">
              <Paperclip className="h-5 w-5 text-primary" />
              <div>
                <h3 className="text-lg font-semibold text-foreground">Solicitar documentos</h3>
                <p className="text-sm text-muted-foreground">Crea nuevos requerimientos que el cliente verá inmediatamente.</p>
              </div>
            </div>
            <form className="grid gap-4 md:grid-cols-3" onSubmit={handleCreateRequirement}>
              <div className="md:col-span-1">
                <label className="text-xs font-semibold uppercase text-muted-foreground">Documento</label>
                <Input
                  className="mt-1"
                  value={newRequirementName}
                  onChange={(event) => setNewRequirementName(event.target.value)}
                  placeholder="Ej: Pasaporte vigente"
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase text-muted-foreground">Categoría / Etapa</label>
                <Input
                  className="mt-1"
                  value={newRequirementStage}
                  onChange={(event) => setNewRequirementStage(event.target.value)}
                  placeholder="Revisión documental"
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase text-muted-foreground">Notas para el cliente</label>
                <Input
                  className="mt-1"
                  value={newRequirementNotes}
                  onChange={(event) => setNewRequirementNotes(event.target.value)}
                  placeholder="Adjunta la versión firmada..."
                />
              </div>
              <div className="md:col-span-3 flex justify-end">
                <Button type="submit" disabled={isCreatingRequirement}>
                  {isCreatingRequirement ? "Creando..." : "Marcar como requerido"}
                </Button>
              </div>
            </form>
          </Card>

          <Card className="p-6 space-y-5">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Revisión asistida por IA</h3>
                <p className="text-sm text-muted-foreground">
                  Envía un PDF confidencial al agente privado de n8n y recibe un diagnóstico inmediato.
                </p>
              </div>
              <Badge variant="outline">IA</Badge>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase text-muted-foreground">Documento del expediente</label>
                <select
                  value={aiDocumentId}
                  onChange={(event) => setAiDocumentId(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Selecciona un documento con archivo</option>
                  {analyzableDocuments.map((doc: any) => (
                    <option key={doc.id} value={doc.id}>
                      {doc.name} · {getDocumentStatusLabel(doc.status)}
                    </option>
                  ))}
                </select>
                {selectedAiDocument ? (
                  <p className="text-xs text-muted-foreground">
                    Analizarás <span className="font-semibold text-foreground">{selectedAiDocument.name}</span> (
                    {getDocumentStatusLabel(selectedAiDocument.status)}).
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">Solo listamos documentos que ya tienen un archivo adjunto.</p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase text-muted-foreground">Instrucciones para el agente</label>
                <Textarea
                  className="min-h-[120px]"
                  value={aiPrompt}
                  onChange={(event) => setAiPrompt(event.target.value)}
                  placeholder="Describe qué debería verificar el asistente."
                />
              </div>
            </div>
            {selectedAiDocument && (
              <div className="rounded-2xl border border-border/70 bg-muted/20 p-4 text-sm text-muted-foreground">
                <p>
                  <span className="font-semibold text-foreground">{selectedAiDocument.name}</span> fue actualizado el{" "}
                  {formatDateTime(selectedAiDocument.updated_at)}.
                </p>
                <p>
                  Categoría: {selectedAiDocument.category || "Sin categoría"} · Estado:{" "}
                  {getDocumentStatusLabel(selectedAiDocument.status)}
                </p>
                {selectedAiDocumentUrl && canOpenDocumentFile(selectedAiDocument.status) && (
                  <Button variant="link" className="px-0 text-xs text-primary" asChild>
                    <a href={selectedAiDocumentUrl} target="_blank" rel="noreferrer">
                      Abrir en nueva pestaña
                    </a>
                  </Button>
                )}
              </div>
            )}
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <p className="text-xs text-muted-foreground">
                El PDF se descarga desde el expediente y se envía al flujo privado de n8n junto con el prompt.
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleResetAi} disabled={!aiDocumentId && !aiLastResponse}>
                  Limpiar
                </Button>
                <Button
                  onClick={handleAnalyzeDocument}
                  disabled={aiIsAnalyzing || !selectedAiDocument || !aiPrompt.trim()}
                >
                  {aiIsAnalyzing ? "Analizando..." : "Analizar con IA"}
                </Button>
              </div>
            </div>
            {aiLastResponse && (
              <div className="space-y-3 rounded-2xl border border-border/70 bg-muted/30 p-4">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Última respuesta</p>
                <div className="rounded-2xl border border-primary/40 bg-primary/5 px-4 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Agente</span>
                    <span className="text-[11px] text-muted-foreground">{formatDateTime(aiLastResponse.timestamp)}</span>
                  </div>
                  <p className="mt-1 whitespace-pre-line text-sm text-foreground">{aiLastResponse.content}</p>
                </div>
              </div>
            )}
          </Card>

          <Card className="p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Requerimientos activos</h3>
                <p className="text-sm text-muted-foreground">Gestiona el estado y las notas privadas.</p>
              </div>
              <Badge variant="secondary">{requiredDocuments.length} en seguimiento</Badge>
            </div>
            {requiredDocuments.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aún no solicitaste archivos para este caso.</p>
            ) : (
              <div className="space-y-4">
                {requiredDocuments.map((doc: any) => {
                  const selectedStatus = statusDrafts[doc.id] ?? doc.status
                  const noteValue = (noteDrafts[doc.id] ?? doc.review_notes) || ""
                  const fileUrl = getDocumentFileUrl(doc)
                  return (
                    <div key={doc.id} className="rounded-2xl border border-border/60 p-4">
                      <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                        <div>
                          <p className="text-xs font-semibold uppercase text-muted-foreground">{doc.category || "Documento requerido"}</p>
                          <p className="text-lg font-semibold text-foreground">{doc.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Estado actual: {getDocumentStatusLabel(doc.status)}
                          </p>
                          {doc.description && (
                            <p className="mt-1 text-xs text-amber-700">
                              Instrucciones para el cliente: {doc.description}
                            </p>
                          )}
                        </div>
                        {fileUrl && canOpenDocumentFile(doc.status) && (
                          <Button size="sm" variant="ghost" onClick={() => window.open(fileUrl, "_blank")}>
                            Ver último archivo
                          </Button>
                        )}
                      </div>
                      <div className="mt-4 grid gap-3 md:grid-cols-2">
                        <div>
                          <label className="text-xs font-semibold uppercase text-muted-foreground">Estado</label>
                          <select
                            value={selectedStatus}
                            onChange={(event) => setStatusDrafts((prev) => ({ ...prev, [doc.id]: event.target.value }))}
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
                          <label className="text-xs font-semibold uppercase text-muted-foreground">Notas internas</label>
                          <Textarea
                            value={noteValue}
                            onChange={(event) => setNoteDrafts((prev) => ({ ...prev, [doc.id]: event.target.value }))}
                            className="mt-1 min-h-[80px]"
                            placeholder="Explica qué falta o por qué fue rechazado."
                          />
                        </div>
                      </div>
                      <div className="mt-3 flex justify-end">
                        <Button type="button" size="sm" onClick={() => handleReviewUpdate(doc)} disabled={updatingDocId === doc.id}>
                          {updatingDocId === doc.id ? "Guardando..." : "Guardar cambios"}
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            <div className="space-y-3 border-t border-border/60 pt-4">
              <h3 className="text-sm font-semibold uppercase text-muted-foreground">Todos los documentos</h3>
              {documents.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aún no hay archivos en este expediente.</p>
              ) : (
                <ul className="space-y-3 text-sm">
                  {documents.map((doc: any) => {
                    const fileUrl = getDocumentFileUrl(doc)
                    return (
                      <li
                        key={doc.id}
                        className="flex flex-col gap-2 rounded-xl border border-border/70 px-3 py-2 md:flex-row md:items-center md:justify-between"
                      >
                        <div>
                          <p className="font-medium text-foreground">{doc.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Estado {getDocumentStatusLabel(doc.status)} {doc.uploader_name ? `- ${doc.uploader_name}` : ""}
                          </p>
                        </div>
                        {fileUrl && canOpenDocumentFile(doc.status) && (
                          <Button variant="outline" size="sm" asChild>
                            <a href={fileUrl} target="_blank" rel="noreferrer">
                              Abrir
                            </a>
                          </Button>
                        )}
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          </Card>
        </TabsContent>
        <TabsContent value="chat" className="mt-6">
          <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
            <Card className="p-6 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-semibold text-foreground">Conversaciones</h2>
                </div>
                {messages.length > 0 && <span className="text-xs text-muted-foreground">{messages.length} mensajes</span>}
              </div>

              <div className="rounded-2xl border border-border/70 bg-muted/30 p-4">
                {messages.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Todavía no se enviaron mensajes en este expediente.</p>
                ) : (
                  <div className="flex max-h-[420px] flex-col gap-3 overflow-y-auto pr-1">
                    {messages.map((message: any) => {
                      const isMine = user?.id ? String(message.sender_id) === String(user.id) : false
                      return (
                        <div key={message.id} className={`flex flex-col ${isMine ? "items-end text-right" : "items-start"}`}>
                          <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                            {isMine ? "Tu equipo" : message.sender_name || "Cliente"}
                          </div>
                          {message.subject && <p className="text-[11px] text-muted-foreground">{message.subject}</p>}
                          <div
                            className={`mt-1 w-fit max-w-[85%] rounded-2xl px-4 py-2 text-sm shadow-sm ${
                              isMine ? "bg-primary text-primary-foreground" : "bg-background text-foreground"
                            }`}
                          >
                            <p className="whitespace-pre-line">{message.content}</p>
                          </div>
                          <span className="mt-1 text-[11px] text-muted-foreground">{formatDateTime(message.created_at)}</span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </Card>

            <Card className="p-6 space-y-3">
              <p className="text-sm font-semibold text-foreground">Enviar mensaje al cliente</p>
              <Input
                placeholder="Asunto (opcional)"
                value={messageSubject}
                onChange={(event) => setMessageSubject(event.target.value)}
                disabled={isSendingMessage}
              />
              <Textarea
                placeholder="Escribe la respuesta..."
                rows={5}
                value={messageBody}
                onChange={(event) => setMessageBody(event.target.value)}
                disabled={isSendingMessage}
              />
              <Button type="button" onClick={handleSendMessage} disabled={isSendingMessage} className="w-full">
                {isSendingMessage ? "Enviando..." : "Enviar mensaje"}
              </Button>
              <p className="text-xs text-muted-foreground">
                El cliente recibirá una notificación instantánea en su portal privado.
              </p>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

