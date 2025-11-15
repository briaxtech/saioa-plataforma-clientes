"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import useSWR from "swr"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Mail, Phone, FileText, Bell } from "lucide-react"
import { api, apiClient } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"

const priorityOptions = [
  { value: "low", label: "Baja" },
  { value: "medium", label: "Media" },
  { value: "high", label: "Alta" },
  { value: "urgent", label: "Urgente" },
]

interface ClientFormState {
  name: string
  email: string
  phone: string
  country_of_origin: string
  notes: string
  caseTypeId: string
  priority: string
}

const emptyForm: ClientFormState = {
  name: "",
  email: "",
  phone: "",
  country_of_origin: "",
  notes: "",
  caseTypeId: "",
  priority: "medium",
}

export default function ClientsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [form, setForm] = useState<ClientFormState>(emptyForm)
  const [showForm, setShowForm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const {
    data: clientsData,
    mutate: mutateClients,
    isLoading,
  } = useSWR("/api/clients", apiClient.get)

  const { data: caseTypesData } = useSWR("/api/case-types", () => api.getCaseTypes())
  const caseTypes = caseTypesData?.caseTypes || []
  const selectedType = caseTypes.find((type: any) => type.id === form.caseTypeId)

  const filteredClients = (clientsData?.clients || []).filter((client: any) => {
    const query = searchTerm.toLowerCase()
    return client.name?.toLowerCase().includes(query) || client.email?.toLowerCase().includes(query)
  })

  const resetForm = () => {
    setForm(emptyForm)
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!form.name.trim() || !form.email.trim()) {
      toast({ title: "Campos incompletos", description: "Nombre y correo son obligatorios.", variant: "destructive" })
      return
    }

    setIsSubmitting(true)
    try {
      await api.createClient(form)
      toast({ title: "Cliente creado" })
      mutateClients()
      resetForm()
      setShowForm(false)
    } catch (error: any) {
      toast({
        title: "No se pudo crear",
        description: error?.message || "Intenta nuevamente.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const docsPreview = useMemo(() => {
    if (!selectedType) return []
    return Array.isArray(selectedType.documents) ? selectedType.documents : []
  }, [selectedType])

  const statesPreview = useMemo(() => {
    if (!selectedType) return []
    return Array.isArray(selectedType.states) ? selectedType.states : []
  }, [selectedType])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Clientes</h1>
          <p className="mt-2 text-muted-foreground">Administra a tus clientes, sus expedientes y documentos asociados.</p>
        </div>
        <Button className="w-full md:w-auto" onClick={() => setShowForm((prev) => !prev)}>
          {showForm ? "Cerrar formulario" : "+ Agregar cliente"}
        </Button>
      </div>

      {showForm && (
        <Card className="p-6">
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-xs font-semibold uppercase text-muted-foreground">Nombre completo</label>
                <Input value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase text-muted-foreground">Correo</label>
                <Input type="email" value={form.email} onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase text-muted-foreground">Telefono</label>
                <Input value={form.phone} onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase text-muted-foreground">Pais de origen</label>
                <Input
                  value={form.country_of_origin}
                  onChange={(e) => setForm((prev) => ({ ...prev, country_of_origin: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-xs font-semibold uppercase text-muted-foreground">Tipo de caso</label>
                <Select
                  value={form.caseTypeId}
                  onValueChange={(value) => setForm((prev) => ({ ...prev, caseTypeId: value }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecciona una opcion" />
                  </SelectTrigger>
                  <SelectContent>
                    {caseTypes.map((type: any) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase text-muted-foreground">Prioridad</label>
                <Select value={form.priority} onValueChange={(value) => setForm((prev) => ({ ...prev, priority: value }))}>
                  <SelectTrigger className="w-full">
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
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase text-muted-foreground">Notas internas</label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                className="min-h-[120px]"
                placeholder="Datos adicionales, contexto de la consulta, etc."
              />
            </div>

            {selectedType && (
              <div className="rounded-2xl border border-dashed border-border/70 bg-muted/30 p-4 text-sm text-muted-foreground">
                <p className="font-semibold text-foreground">{selectedType.name}</p>
                {selectedType.timeframe && <p className="text-xs">Plazo estimado: {selectedType.timeframe}</p>}
                {docsPreview.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-semibold uppercase">Documentacion sugerida</p>
                    <ul className="mt-1 list-disc space-y-1 pl-4">
                      {docsPreview.map((doc: string) => (
                        <li key={doc}>{doc}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {statesPreview.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-semibold uppercase">Etapas</p>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {statesPreview.map((state: string) => (
                        <Badge key={state} variant="outline" className="text-xs">
                          {state}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-3">
              <Button type="submit" className="flex-1" disabled={isSubmitting}>
                Guardar cliente
              </Button>
              <Button type="button" variant="ghost" onClick={() => setShowForm(false)} disabled={isSubmitting}>
                Cancelar
              </Button>
            </div>
          </form>
        </Card>
      )}

      <Card className="p-6">
        <div className="mb-6">
          <Input placeholder="Buscar clientes..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        ) : filteredClients.length > 0 ? (
          <div className="space-y-6">
            <div className="space-y-3 md:hidden">
              {filteredClients.map((client: any) => (
                <details
                  key={`mobile-${client.user_id || client.id}`}
                  className="group rounded-2xl border border-border/60 bg-card px-4 py-3 shadow-sm open:shadow-md"
                >
                  <summary className="flex cursor-pointer items-center justify-between gap-3 text-left text-sm font-semibold text-foreground">
                    <div className="flex flex-1 flex-col">
                      <span>{client.name}</span>
                      <span className="text-xs font-normal text-muted-foreground">{client.email}</span>
                    </div>
                    <Badge
                      variant={(client.unread_notifications || 0) > 0 ? "default" : "outline"}
                      className="shrink-0"
                    >
                      {client.unread_notifications || 0}
                    </Badge>
                  </summary>
                  <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{client.email}</span>
                    </div>
                    {client.phone && (
                      <div className="flex items-center gap-2 text-xs">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{client.phone}</span>
                      </div>
                    )}
                    <p className="text-xs uppercase tracking-wide">
                      Pais: <span className="font-semibold text-foreground">{client.country_of_origin || "N/D"}</span>
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs uppercase tracking-wide">Casos</span>
                      <Badge variant={client.case_count > 0 ? "secondary" : "outline"}>{client.case_count || 0}</Badge>
                    </div>
                    <Link
                      href={`/admin/clients/${client.user_id || client.id}`}
                      className="inline-flex w-full items-center justify-center rounded-xl border border-border bg-background px-3 py-2 text-sm font-semibold text-primary shadow-sm transition hover:bg-primary hover:text-white"
                    >
                      Ver detalle
                    </Link>
                  </div>
                </details>
              ))}
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full border-separate border-spacing-y-1 text-sm">
                <thead>
                  <tr className="text-left text-xs font-semibold uppercase text-muted-foreground">
                    <th className="px-3 py-2">Cliente</th>
                    <th className="px-3 py-2">Contacto</th>
                    <th className="px-3 py-2">Pais</th>
                    <th className="px-3 py-2">Casos</th>
                    <th className="px-3 py-2">
                      <span className="sr-only">Notificaciones</span>
                      <Bell aria-hidden className="h-4 w-4 text-muted-foreground" />
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClients.map((client: any) => (
                    <tr
                      key={client.user_id || client.id}
                      className="rounded-lg border border-transparent bg-card text-foreground transition hover:border-primary/40 hover:bg-muted/40"
                    >
                      <td className="px-3 py-2 font-semibold">
                        <Link
                          href={`/admin/clients/${client.user_id || client.id}`}
                          className="text-primary hover:underline"
                        >
                          {client.name}
                        </Link>
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {client.email}
                        </div>
                        {client.phone && (
                          <div className="mt-1 flex items-center gap-1 text-xs">
                            <Phone className="h-3 w-3" />
                            {client.phone}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2 text-xs uppercase tracking-wide text-muted-foreground">
                        {client.country_of_origin || "N/D"}
                      </td>
                      <td className="px-3 py-2">
                        <Badge variant={client.case_count > 0 ? "secondary" : "outline"}>
                          {client.case_count || 0}
                        </Badge>
                      </td>
                      <td className="px-3 py-2">
                        <Badge variant={(client.unread_notifications || 0) > 0 ? "default" : "outline"}>
                          {client.unread_notifications || 0}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <p className="py-8 text-center text-muted-foreground">No se encontraron clientes</p>
        )}
      </Card>
    </div>
  )
}
