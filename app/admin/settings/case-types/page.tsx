"use client"

import { useMemo, useState } from "react"
import useSWR from "swr"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { api } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"

interface CaseTypeForm {
  id: string
  name: string
  description: string
  documents: string[]
  states: string[]
  timeframe: string
  base_case_type: string
}

const emptyForm: CaseTypeForm = {
  id: "",
  name: "",
  description: "",
  documents: [],
  states: [],
  timeframe: "",
  base_case_type: "other",
}

const baseCaseOptions = [
  { value: "family", label: "Familiar / Comunitario" },
  { value: "employment", label: "Laboral" },
  { value: "asylum", label: "Asilo" },
  { value: "citizenship", label: "Nacionalidad" },
  { value: "visa", label: "Visado" },
  { value: "green_card", label: "Residencia general" },
  { value: "other", label: "Otro" },
]

export default function CaseTypesSettingsPage() {
  const { toast } = useToast()
  const { data, mutate } = useSWR("/api/case-types", () => api.getCaseTypes())
  const caseTypes = data?.caseTypes ?? []

  const [form, setForm] = useState<CaseTypeForm>(emptyForm)
  const [documentInput, setDocumentInput] = useState("")
  const [stateInput, setStateInput] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isEditing = useMemo(
    () => Boolean(form.id && caseTypes.some((type: any) => type.id === form.id)),
    [caseTypes, form.id],
  )

  const resetForm = () => {
    setForm(emptyForm)
    setDocumentInput("")
    setStateInput("")
  }

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast({ title: "Nombre requerido", description: "Debes ingresar un nombre.", variant: "destructive" })
      return
    }

    setIsSubmitting(true)
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        documents: form.documents,
        states: form.states,
        timeframe: form.timeframe.trim(),
        base_case_type: form.base_case_type,
      }

      if (isEditing) {
        await api.updateCaseType(form.id, payload)
        toast({ title: "Tipo actualizado" })
      } else {
        await api.createCaseType({ ...payload, id: form.id.trim() || undefined })
        toast({ title: "Tipo creado" })
      }

      resetForm()
      mutate()
    } catch (error: any) {
      toast({
        title: "No se pudo guardar",
        description: error?.message || "Intenta nuevamente.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (type: any) => {
    setForm({
      id: type.id,
      name: type.name || "",
      description: type.description || "",
      documents: Array.isArray(type.documents) ? type.documents : [],
      states: Array.isArray(type.states) ? type.states : [],
      timeframe: type.timeframe || "",
      base_case_type: type.base_case_type || "other",
    })
    setDocumentInput("")
    setStateInput("")
  }

  const handleDelete = async (id: string) => {
    try {
      await api.deleteCaseType(id)
      toast({ title: "Tipo eliminado" })
      if (form.id === id) resetForm()
      mutate()
    } catch (error: any) {
      toast({
        title: "No se pudo eliminar",
        description: error?.message || "Intenta nuevamente.",
        variant: "destructive",
      })
    }
  }

  const addDocument = () => {
    const trimmed = documentInput.trim()
    if (!trimmed) return
    setForm((prev) => ({ ...prev, documents: [...prev.documents, trimmed] }))
    setDocumentInput("")
  }

  const addState = () => {
    const trimmed = stateInput.trim()
    if (!trimmed) return
    setForm((prev) => ({ ...prev, states: [...prev.states, trimmed] }))
    setStateInput("")
  }

  const removeDocument = (doc: string) => {
    setForm((prev) => ({ ...prev, documents: prev.documents.filter((d) => d !== doc) }))
  }

  const removeState = (step: string) => {
    setForm((prev) => ({ ...prev, states: prev.states.filter((s) => s !== step) }))
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold text-foreground">Tipos de caso</h1>
        <p className="text-sm text-muted-foreground">
          Define plantillas con documentacion, plazos y etapas para reutilizar al crear clientes.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <Card className="p-6">
          <h2 className="mb-4 text-lg font-semibold text-foreground">Tipos configurados</h2>
          <div className="space-y-4">
            {caseTypes.map((type: any) => (
              <div key={type.id} className="rounded-2xl border border-border p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-semibold text-foreground">{type.name}</h3>
                    <p className="text-sm text-muted-foreground">{type.description}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(type)}>
                      Editar
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(type.id)}>
                      Eliminar
                    </Button>
                  </div>
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Documentos</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {(type.documents || []).map((doc: string) => (
                        <Badge key={doc} variant="secondary" className="text-xs">
                          {doc}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Etapas</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {(type.states || []).map((step: string) => (
                        <Badge key={step} variant="outline" className="text-xs">
                          {step}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                {type.timeframe && <p className="mt-3 text-xs text-muted-foreground">Plazo: {type.timeframe}</p>}
              </div>
            ))}

            {caseTypes.length === 0 && (
              <p className="text-sm text-muted-foreground">Todavia no registraste ningun tipo de caso.</p>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="mb-4 text-lg font-semibold text-foreground">
            {isEditing ? "Editar tipo de caso" : "Crear nuevo tipo de caso"}
          </h2>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold uppercase text-muted-foreground">Nombre</label>
              <Input value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase text-muted-foreground">Descripcion</label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                className="min-h-[80px]"
              />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase text-muted-foreground">Plazo estimado</label>
              <Input value={form.timeframe} onChange={(e) => setForm((prev) => ({ ...prev, timeframe: e.target.value }))} />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase text-muted-foreground">Clasificacion interna</label>
              <Select
                value={form.base_case_type}
                onValueChange={(value) => setForm((prev) => ({ ...prev, base_case_type: value }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecciona una opcion" />
                </SelectTrigger>
                <SelectContent>
                  {baseCaseOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase text-muted-foreground">Documentacion requerida</label>
              <div className="mt-2 flex gap-2">
                <Input
                  value={documentInput}
                  onChange={(e) => setDocumentInput(e.target.value)}
                  placeholder="Ej. Certificado de empadronamiento"
                />
                <Button type="button" onClick={addDocument}>
                  Anadir
                </Button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {form.documents.map((doc) => (
                  <Badge key={doc} variant="secondary" className="flex items-center gap-2 text-xs">
                    {doc}
                    <button type="button" onClick={() => removeDocument(doc)} className="text-xs">
                      x
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase text-muted-foreground">Etapas del flujo</label>
              <div className="mt-2 flex gap-2">
                <Input value={stateInput} onChange={(e) => setStateInput(e.target.value)} placeholder="Ej. Resolucion" />
                <Button type="button" onClick={addState}>
                  Anadir
                </Button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {form.states.map((state) => (
                  <Badge key={state} variant="outline" className="flex items-center gap-2 text-xs">
                    {state}
                    <button type="button" onClick={() => removeState(state)} className="text-xs">
                      x
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <Button className="flex-1" onClick={handleSubmit} disabled={isSubmitting}>
                {isEditing ? "Actualizar" : "Crear tipo"}
              </Button>
              {isEditing && (
                <Button type="button" variant="ghost" onClick={resetForm} disabled={isSubmitting}>
                  Cancelar
                </Button>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

