"use client"

import type React from "react"
import { useEffect, useMemo, useState } from "react"
import useSWR from "swr"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { apiClient } from "@/lib/api-client"
import { canOpenDocumentFile, documentHasFile, getDocumentFileUrl } from "@/lib/document-helpers"
import { Upload, FileText, AlertTriangle } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/lib/auth-context"

const DOCUMENT_STATUS_STYLES: Record<string, { label: string; className: string }> = {
  pending: {
    label: "Pendiente",
    className: "bg-amber-500/10 text-amber-700",
  },
  submitted: {
    label: "En revision",
    className: "bg-blue-500/10 text-blue-700",
  },
  approved: {
    label: "Validado",
    className: "bg-green-500/10 text-green-700",
  },
  rejected: {
    label: "Rechazado",
    className: "bg-red-500/10 text-red-600",
  },
  requires_action: {
    label: "Requiere reentrega",
    className: "bg-rose-500/10 text-rose-600",
  },
  not_required: {
    label: "No requerido",
    className: "bg-slate-200 text-slate-600",
  },
}

const formatDate = (value?: string | null) => {
  if (!value) return ""
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  return date.toLocaleDateString()
}

export default function DocumentsPage() {
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [selectedCaseId, setSelectedCaseId] = useState<string>("")
  const { toast } = useToast()
  const { organization } = useAuth()

  const demoConfig = useMemo(() => {
    const meta = (organization?.metadata || {}) as any
    return {
      isDemo: Boolean(meta?.is_demo || meta?.isDemo),
      limits: meta?.demo_limits || meta?.demoLimits || {
        uploadsPerDay: 3,
        messagesPerDay: 10,
        maxSizeMb: 1,
        ttlMinutes: 30,
      },
    }
  }, [organization?.metadata])

  const { data: documentsData, mutate } = useSWR("/api/documents", apiClient.get)
  const { data: casesData } = useSWR("/api/cases", apiClient.get)

  const caseOptions = useMemo(() => casesData?.cases ?? [], [casesData?.cases])

  useEffect(() => {
    if (!selectedCaseId && caseOptions.length > 0) {
      setSelectedCaseId(caseOptions[0].id.toString())
    }
  }, [caseOptions, selectedCaseId])

  const currentCase = useMemo(() => {
    return caseOptions.find((item: any) => item.id.toString() === selectedCaseId) || caseOptions[0]
  }, [caseOptions, selectedCaseId])

  const isToday = (value?: string | null) => {
    if (!value) return false
    const date = new Date(value)
    const now = new Date()
    return (
      !Number.isNaN(date.getTime()) &&
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth() &&
      date.getDate() === now.getDate()
    )
  }

  const uploadedDocuments = useMemo(() => documentsData?.documents ?? [], [documentsData?.documents])
  const todayUploads = useMemo(() => {
    if (!demoConfig.isDemo) return 0
    return uploadedDocuments.filter((doc: any) => isToday((doc as any).created_at || (doc as any).createdAt)).length
  }, [demoConfig.isDemo, uploadedDocuments])

  const handleFileUpload = async (files: FileList, options?: { documentId?: string; overrideName?: string }) => {
    if (!currentCase) {
      toast({
        title: "Sin caso activo",
        description: "Necesitas un caso activo para subir documentos",
        variant: "destructive",
      })
      return
    }

    if (demoConfig.isDemo) {
      const limit = demoConfig.limits.uploadsPerDay ?? 3
      if (todayUploads >= limit || todayUploads + files.length > limit) {
        toast({
          title: "Limite de archivos en modo demo",
          description: `Puedes subir hasta ${limit} archivos por dia. Intenta nuevamente manana.`,
          variant: "destructive",
        })
        return
      }

      const overSized = Array.from(files).find((file) => file.size > (demoConfig.limits.maxSizeMb ?? 1) * 1024 * 1024)
      if (overSized) {
        toast({
          title: "Archivo demasiado grande",
          description: `El maximo en demo es ${demoConfig.limits.maxSizeMb ?? 1}MB por archivo.`,
          variant: "destructive",
        })
        return
      }
    }

    setUploading(true)

    const tasks = Array.from(files).map(async (file) => {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("case_id", currentCase.id.toString())
      formData.append("name", options?.overrideName || file.name)
      if (options?.documentId) {
        formData.append("document_id", options.documentId.toString())
      } else {
        formData.append("document_type", file.name)
      }

      try {
        await apiClient.upload("/api/documents", formData)
        toast({
          title: "Documento enviado",
          description: `${options?.overrideName || file.name} se cargo correctamente`,
        })
      } catch (error) {
        toast({
          title: "Error al subir",
          description: `No se pudo subir ${options?.overrideName || file.name}`,
          variant: "destructive",
        })
      }
    })

    await Promise.all(tasks)
    setUploading(false)
    mutate()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files) {
      handleFileUpload(e.dataTransfer.files)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFileUpload(e.target.files)
      e.target.value = ""
    }
  }

  const documentsForCurrentCase = selectedCaseId
    ? uploadedDocuments.filter((doc: any) => doc.case_id?.toString() === selectedCaseId)
    : uploadedDocuments
  const requiredDocuments = documentsForCurrentCase.filter((doc: any) => doc.is_required)
  const standaloneDocuments = documentsForCurrentCase.filter((doc: any) => !doc.is_required)

  const canUploadRequirement = (doc: any) => doc && ["pending", "requires_action"].includes(doc.status)

  const handleRequirementFile = (doc: any) => (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      if (!canUploadRequirement(doc)) {
        toast({
          title: "Documento en revision",
          description: "Espera a que el equipo revise o pida una nueva version antes de reemplazar el archivo.",
          variant: "default",
        })
        event.target.value = ""
        return
      }

      if (demoConfig.isDemo) {
        const limit = demoConfig.limits.uploadsPerDay ?? 3
        if (todayUploads >= limit) {
          toast({
            title: "Limite de archivos en modo demo",
            description: `Puedes subir hasta ${limit} archivos por dia. Intenta nuevamente manana.`,
            variant: "destructive",
          })
          event.target.value = ""
          return
        }
      }

      if (doc.status === "pending") {
        const confirmed = window.confirm(
          "Una vez que envies este archivo no podras cambiarlo hasta que el equipo lo revise. Deseas continuar?",
        )
        if (!confirmed) {
          event.target.value = ""
          return
        }
      }

      handleFileUpload(event.target.files, { documentId: doc.id.toString(), overrideName: doc.name })
      event.target.value = ""
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Documentos</h1>
        <p className="mt-2 text-muted-foreground">Sube y monitorea los archivos que necesita tu caso.</p>
      </div>

      <Card className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-semibold text-foreground">Caso activo</h3>
          <p className="text-sm text-muted-foreground">Elige el expediente con el que vas a trabajar.</p>
        </div>
        <Select value={selectedCaseId} onValueChange={setSelectedCaseId} disabled={caseOptions.length === 0}>
          <SelectTrigger className="w-full sm:w-64">
            <SelectValue placeholder="Sin casos disponibles" />
          </SelectTrigger>
          <SelectContent>
            {caseOptions.map((caseItem: any) => (
              <SelectItem key={caseItem.id} value={caseItem.id.toString()}>
                {caseItem.case_number} - {caseItem.case_type?.replace("_", " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Card>

      {demoConfig.isDemo && (
        <Card className="flex flex-col gap-2 border-amber-200 bg-amber-50/60 p-4 text-sm text-amber-900">
          <div className="flex items-center gap-2 font-semibold">
            <AlertTriangle className="h-4 w-4" />
            Modo demo
          </div>
          <p>
            Limites: {demoConfig.limits.uploadsPerDay} archivos/dia, maximo {demoConfig.limits.maxSizeMb}MB cada uno. Los archivos
            se eliminan automaticamente despues de {demoConfig.limits.ttlMinutes} minutos.
          </p>
          <p>Subiste hoy: {todayUploads}/{demoConfig.limits.uploadsPerDay}.</p>
        </Card>
      )}

      <Card
        className={`border-2 border-dashed p-12 text-center transition ${isDragging ? "border-primary bg-primary/5" : "border-border"}`}
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        <Upload className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
        <h3 className="mb-2 text-lg font-semibold text-foreground">Subir documentos adicionales</h3>
        <p className="mb-6 text-muted-foreground">Arrastra tus archivos o haz clic para buscarlos.</p>
        <label htmlFor="file-upload">
          <Button className="bg-primary hover:bg-primary/90" disabled={uploading}>
            {uploading ? "Subiendo..." : "Seleccionar archivos"}
          </Button>
        </label>
        <input id="file-upload" type="file" multiple onChange={handleFileSelect} className="hidden" />
      </Card>

      <Card className="p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-foreground">Documentos requeridos</h3>
          <p className="text-sm text-muted-foreground">Te avisaremos cada vez que el equipo solicite un archivo nuevo.</p>
        </div>
        {requiredDocuments.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aun no tienes documentos pendientes.</p>
        ) : (
          <div className="space-y-4">
            {requiredDocuments.map((doc: any) => {
              const statusConfig = DOCUMENT_STATUS_STYLES[doc.status] || DOCUMENT_STATUS_STYLES.pending
              const hasFile = documentHasFile(doc)
              const fileUrl = getDocumentFileUrl(doc)
              const canUpload = canUploadRequirement(doc)
              const uploadLabel = doc.status === "requires_action" ? "Subir nueva version" : "Subir archivo"
              return (
                <div key={doc.id} className="rounded-2xl border border-border/70 bg-card/50 p-4 shadow-sm">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-muted-foreground">{doc.category || "Requerido"}</p>
                      <p className="text-lg font-semibold text-foreground">{doc.name}</p>
                      <div className="mt-1 text-xs text-muted-foreground">
                        Ultima actualizacion: {formatDate(doc.updated_at || doc.created_at) || "Reciente"}
                      </div>
                    </div>
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusConfig.className}`}>
                      {statusConfig.label}
                    </span>
                  </div>
                  {doc.description && <p className="mt-2 text-sm text-amber-800">Instrucciones: {doc.description}</p>}
                  {doc.review_notes && <p className="mt-3 text-sm text-rose-600">Nota del equipo: {doc.review_notes}</p>}
                  {doc.status === "requires_action" && (
                    <p className="mt-2 text-xs text-rose-700">
                      Necesitamos una nueva version de este archivo. Subila con el boton de {uploadLabel}.
                    </p>
                  )}
                  <div className="mt-4 flex flex-wrap gap-3">
                    {fileUrl && canOpenDocumentFile(doc.status) && (
                      <Button size="sm" variant="ghost" onClick={() => window.open(fileUrl, "_blank")}>
                        Ver archivo
                      </Button>
                    )}
                    {doc.status === "not_required" ? (
                      <span className="text-xs text-muted-foreground">Este documento ya no es necesario.</span>
                    ) : canUpload ? (
                      <label>
                        <input type="file" className="hidden" onChange={handleRequirementFile(doc)} disabled={uploading} />
                        <Button size="sm" variant={hasFile ? "outline" : "default"} disabled={uploading}>
                          {uploadLabel}
                        </Button>
                      </label>
                    ) : (
                      <Button size="sm" variant="outline" disabled>
                        {doc.status === "approved" ? "Validado" : doc.status === "submitted" ? "En revision" : "No disponible"}
                      </Button>
                    )}
                  </div>
                  {!canUpload && doc.status === "submitted" && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Estamos revisando tu archivo. Te avisaremos si necesitamos que subas una nueva version.
                    </p>
                  )}
                  {!canUpload && doc.status === "approved" && (
                    <p className="mt-2 text-xs text-emerald-700">Archivo aprobado. No necesitas realizar acciones.</p>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </Card>

      <Card className="p-6">
        <h3 className="mb-6 text-lg font-semibold text-foreground">Historial de documentos enviados</h3>
        {standaloneDocuments.length === 0 ? (
          <p className="py-8 text-center text-muted-foreground">Todavia no subiste archivos adicionales.</p>
        ) : (
          <div className="space-y-3">
            {standaloneDocuments.map((doc: any) => {
              const statusConfig = DOCUMENT_STATUS_STYLES[doc.status] || DOCUMENT_STATUS_STYLES.pending
              const fileUrl = getDocumentFileUrl(doc)
              return (
                <div
                  key={doc.id}
                  className="flex items-center justify-between rounded-lg border border-border p-4 transition hover:bg-muted/50"
                >
                  <div className="flex items-center gap-4">
                    <FileText className="h-8 w-8 text-muted-foreground" />
                    <div>
                      <h4 className="font-medium text-foreground">{doc.name}</h4>
                      <div className="mt-1 flex gap-4 text-xs text-muted-foreground">
                        <span>{formatDate(doc.updated_at || doc.created_at) || "Reciente"}</span>
                        {doc.file_size && <span>{(Number(doc.file_size) / 1024 / 1024).toFixed(2)} MB</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`rounded px-2 py-1 text-xs font-medium ${statusConfig.className}`}>{statusConfig.label}</span>
                    {fileUrl && canOpenDocumentFile(doc.status) && (
                      <Button size="sm" variant="ghost" onClick={() => window.open(fileUrl, "_blank")}>
                        Ver
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}
