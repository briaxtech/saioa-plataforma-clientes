"use client"

import { useRef, useState } from "react"
import { AlertTriangle, CheckCircle2, Download, FileSpreadsheet, UploadCloud } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { apiClient } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"

type ImportResult = {
  summary?: { totalRows?: number; created?: number; skipped?: number; errors?: number }
  created?: Array<{ email: string; name: string; temporaryPassword: string; caseNumber?: string; caseType?: string }>
  skipped?: Array<{ email?: string; row: number; reason: string }>
  errors?: Array<{ row: number; error: string }>
  warnings?: string[]
}

type CaseTypeOption = { id: string; name: string }

interface ImportClientsCardProps {
  caseTypes: CaseTypeOption[]
  onImported?: () => void
}

const priorityOptions = [
  { value: "medium", label: "Prioridad media" },
  { value: "high", label: "Prioridad alta" },
  { value: "urgent", label: "Urgente" },
  { value: "low", label: "Prioridad baja" },
]

export function ImportClientsCard({ caseTypes, onImported }: ImportClientsCardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [sendInvites, setSendInvites] = useState(true)
  const [defaultCaseTypeId, setDefaultCaseTypeId] = useState("")
  const [priority, setPriority] = useState("medium")
  const [result, setResult] = useState<ImportResult | null>(null)
  const { toast } = useToast()

  const downloadTemplate = () => {
    const headers = [
      "Nombre",
      "Correo",
      "Telefono",
      "Pais",
      "Notas",
      "Tipo de caso (id o nombre de plantilla)",
      "Prioridad (low/medium/high/urgent)",
    ]
    const sampleRows = [
      ["Maria Gomez", "maria@ejemplo.com", "+34 600 000 001", "Espana", "Seguimiento de reagrupacion", "residencia-familiares-ue", "medium"],
      ["Diego Perez", "diego@ejemplo.com", "+34 600 000 002", "Argentina", "Consulta laboral", "", "high"],
    ]

    const csvLines = [
      headers.join(","),
      ...sampleRows.map((row) =>
        row
          .map((value) => `"${String(value).replace(/"/g, '""')}"`)
          .join(","),
      ),
    ]
    const blob = new Blob([csvLines.join("\n")], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = "plantilla-importacion-clientes.csv"
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleFileUpload = async (file: File) => {
    const formData = new FormData()
    formData.append("file", file)
    formData.append("sendInvites", String(sendInvites))
    if (defaultCaseTypeId && defaultCaseTypeId !== "no_selection") {
      formData.append("caseTypeId", defaultCaseTypeId)
    }
    if (priority) {
      formData.append("priority", priority)
    }

    setIsImporting(true)
    try {
      const response = await apiClient.upload("/api/clients/import", formData)
      setResult(response as ImportResult)
      toast({
        title: `Importacion completa`,
        description: `Creados ${response.summary?.created || 0}, omitidos ${response.summary?.skipped || 0}.`,
      })
      onImported?.()
    } catch (error: any) {
      const message = error?.data?.error || error?.message || "No se pudo importar el archivo."
      toast({ title: "Error al importar", description: message, variant: "destructive" })
    } finally {
      setIsImporting(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const onFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      handleFileUpload(file)
    }
  }

  const lastCreated = result?.created || []
  const lastWarnings = result?.warnings || []
  const lastErrors = result?.errors || []

  return (
    <Card className="p-5">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Importar clientes desde Excel/CSV</h2>
          <p className="text-sm text-muted-foreground">
            Sube un archivo exportado de Excel o Google Sheets. No necesitas configurar OAuth ni conectores externos.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={downloadTemplate}>
            <Download className="mr-2 h-4 w-4" />
            Descargar plantilla
          </Button>
          <Button
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
          >
            <UploadCloud className="mr-2 h-4 w-4" />
            {isImporting ? "Importando..." : "Subir archivo"}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv, application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            className="hidden"
            onChange={onFileChange}
          />
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div className="rounded-lg border border-dashed border-border/70 p-3">
          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              className="h-4 w-4 accent-primary"
              checked={sendInvites}
              onChange={(e) => setSendInvites(e.target.checked)}
            />
            Enviar correo de acceso
          </label>
          <p className="mt-1 text-xs text-muted-foreground">
            Envia el correo de bienvenida con la contrasena temporal a cada cliente importado.
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-muted-foreground">Asignar tipo de caso</p>
          <Select value={defaultCaseTypeId} onValueChange={setDefaultCaseTypeId}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Opcional" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="no_selection">Sin caso automatico</SelectItem>
              {caseTypes.map((type) => (
                <SelectItem key={type.id} value={type.id}>
                  {type.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="mt-1 text-xs text-muted-foreground">
            Si no se indica en la fila, se usara este tipo de caso para crear el expediente y sus hitos.
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-muted-foreground">Prioridad de casos</p>
          <Select value={priority} onValueChange={setPriority}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {priorityOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="mt-1 text-xs text-muted-foreground">Se usa al crear casos desde la importacion.</p>
        </div>
      </div>

      {result?.summary && (
        <div className="mt-4 rounded-lg border border-border/70 bg-muted/40 p-3 text-sm">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span className="font-semibold">{result.summary.created || 0} creados</span>
            </div>
            <div className="text-muted-foreground">{result.summary.skipped || 0} omitidos</div>
            <div className="text-destructive">{result.summary.errors || 0} con error</div>
            <div className="text-muted-foreground">Total filas: {result.summary.totalRows || 0}</div>
          </div>

          {lastCreated.length > 0 && (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-muted-foreground">
                    <th className="pb-1 pr-3 font-semibold">Cliente</th>
                    <th className="pb-1 pr-3 font-semibold">Correo</th>
                    <th className="pb-1 pr-3 font-semibold">Contrasena temporal</th>
                    <th className="pb-1 pr-3 font-semibold">Caso</th>
                  </tr>
                </thead>
                <tbody>
                  {lastCreated.map((client) => (
                    <tr key={client.email} className="border-t border-border/60">
                      <td className="py-1 pr-3">{client.name}</td>
                      <td className="py-1 pr-3 text-muted-foreground">{client.email}</td>
                      <td className="py-1 pr-3 font-mono text-xs">{client.temporaryPassword}</td>
                      <td className="py-1 pr-3 text-muted-foreground">
                        {client.caseNumber ? `${client.caseNumber}${client.caseType ? ` - ${client.caseType}` : ""}` : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {(lastWarnings.length > 0 || lastErrors.length > 0) && (
            <div className="mt-3 space-y-2 text-xs">
              {lastWarnings.map((warning, idx) => (
                <div key={`warn-${idx}`} className="flex items-center gap-2 text-amber-700">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  <span>{warning}</span>
                </div>
              ))}
              {lastErrors.slice(0, 5).map((error) => (
                <div key={`${error.row}-${error.error}`} className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  <span>Fila {error.row}: {error.error}</span>
                </div>
              ))}
              {lastErrors.length > 5 && (
                <p className="text-muted-foreground">Mostrando los primeros 5 errores de {lastErrors.length}.</p>
              )}
            </div>
          )}
        </div>
      )}

      {!result?.summary && (
        <div className="mt-4 flex items-start gap-3 rounded-lg border border-dashed border-border/60 bg-muted/30 p-3 text-sm text-muted-foreground">
          <FileSpreadsheet className="mt-0.5 h-4 w-4" />
          <div>
            <p>Columnas sugeridas: Nombre, Correo, Telefono, Pais, Notas, Tipo de caso (id o nombre), Prioridad.</p>
            <p className="mt-1">Acepta .xlsx, .xls o .csv exportados desde Excel/Sheets.</p>
          </div>
        </div>
      )}
    </Card>
  )
}
