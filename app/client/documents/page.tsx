"use client"

import type React from "react"
import { useEffect, useMemo, useState } from "react"
import useSWR from "swr"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { apiClient } from "@/lib/api-client"
import { Upload, FileText } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const DOCUMENT_STATUS_STYLES: Record<string, { label: string; className: string }> = {
  pending: {
    label: "Pendiente",
    className: "bg-amber-500/10 text-amber-700",
  },
  submitted: {
    label: "Enviado",
    className: "bg-blue-500/10 text-blue-700",
  },
  approved: {
    label: "Verificado",
    className: "bg-green-500/10 text-green-700",
  },
  rejected: {
    label: "Rechazado",
    className: "bg-red-500/10 text-red-600",
  },
  requires_action: {
    label: "Requiere revision",
    className: "bg-rose-500/10 text-rose-600",
  },
}

const formatDate = (value?: string) => {
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

  const { data: documents, mutate } = useSWR("/api/documents", apiClient.get)
  const { data: cases } = useSWR("/api/cases", apiClient.get)

  const caseOptions = cases?.cases ?? []

  useEffect(() => {
    if (!selectedCaseId && caseOptions.length > 0) {
      setSelectedCaseId(caseOptions[0].id.toString())
    }
  }, [caseOptions, selectedCaseId])

  const currentCase = useMemo(() => {
    return caseOptions.find((item: any) => item.id.toString() === selectedCaseId) || caseOptions[0]
  }, [caseOptions, selectedCaseId])

  const handleFileUpload = async (files: FileList, options?: { documentId?: string; overrideName?: string }) => {
    if (!currentCase) {
      toast({
        title: "Sin caso activo",
        description: "Necesitas un caso activo para subir documentos",
        variant: "destructive",
      })
      return
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
          description: `${options?.overrideName || file.name} se cargó correctamente`,
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

  const uploadedDocuments = documents?.documents ?? []
  const documentsForCurrentCase = selectedCaseId
    ? uploadedDocuments.filter((doc: any) => doc.case_id?.toString() === selectedCaseId)
    : uploadedDocuments
  const requiredDocuments = documentsForCurrentCase.filter((doc: any) => doc.is_required)
  const standaloneDocuments = documentsForCurrentCase.filter((doc: any) => !doc.is_required)

  const handleRequirementFile = (doc: any) => (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
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
          <p className="text-sm text-muted-foreground">
            Te avisaremos cada vez que el equipo solicite un archivo nuevo.
          </p>
        </div>
        {requiredDocuments.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aun no tienes documentos pendientes.</p>
        ) : (
          <div className="space-y-4">
            {requiredDocuments.map((doc: any) => {
              const statusConfig = DOCUMENT_STATUS_STYLES[doc.status] || DOCUMENT_STATUS_STYLES.pending
              const hasFile = Boolean(doc.file_url)
              return (
                <div
                  key={doc.id}
                  className="rounded-2xl border border-border/70 bg-card/50 p-4 shadow-sm"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-muted-foreground">{doc.category || "Requerido"}</p>
                      <p className="text-lg font-semibold text-foreground">{doc.name}</p>
                      <div className="mt-1 text-xs text-muted-foreground">
                        Última actualización: {formatDate(doc.updated_at || doc.created_at) || "Reciente"}
                      </div>
                    </div>
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusConfig.className}`}>
                      {statusConfig.label}
                    </span>
                  </div>
                  {doc.review_notes && (
                    <p className="mt-3 text-sm text-rose-600">Nota del equipo: {doc.review_notes}</p>
                  )}
                  <div className="mt-4 flex flex-wrap gap-3">
                    {doc.file_url && (
                      <Button size="sm" variant="ghost" onClick={() => window.open(doc.file_url, "_blank")}>
                        Ver archivo
                      </Button>
                    )}
                    <label>
                      <input type="file" className="hidden" onChange={handleRequirementFile(doc)} />
                      <Button size="sm" variant={hasFile ? "outline" : "default"} disabled={uploading}>
                        {hasFile ? "Reemplazar archivo" : "Subir archivo"}
                      </Button>
                    </label>
                  </div>
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
                    <span className={`rounded px-2 py-1 text-xs font-medium ${statusConfig.className}`}>
                      {statusConfig.label}
                    </span>
                    {doc.file_url && (
                      <Button size="sm" variant="ghost" onClick={() => window.open(doc.file_url, "_blank")}>
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
