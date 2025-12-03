const DOCUMENT_STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente",
  submitted: "En revision",
  approved: "Aprobado",
  rejected: "Rechazado",
  requires_action: "Requiere accion",
  not_required: "No requerido",
}

const fallbackLabel = (value: string) =>
  value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())

export const getDocumentStatusLabel = (status?: string | null) => {
  if (!status) return "Sin estado"
  const normalized = status.toLowerCase()
  return DOCUMENT_STATUS_LABELS[normalized] || fallbackLabel(normalized)
}

export const canOpenDocumentFile = (status?: string | null) => {
  if (!status) return true
  return status.toLowerCase() !== "pending"
}

export const getDocumentFileUrl = (doc?: { file_url?: string | null; signed_url?: string | null } | null) => {
  if (!doc) return null
  if (doc.signed_url) return doc.signed_url
  if (doc.file_url) return doc.file_url
  return null
}

export const documentHasFile = (doc?: { file_url?: string | null } | null) => Boolean(getDocumentFileUrl(doc))
