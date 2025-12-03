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
import { Bell, Mail, Phone } from "lucide-react"
import { api, apiClient } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"
import { ImportClientsCard } from "@/components/admin/import-clients-card"

const priorityOptions = [
  { value: "low", label: "Baja" },
  { value: "medium", label: "Media" },
  { value: "high", label: "Alta" },
  { value: "urgent", label: "Urgente" },
]

const countryOptions = [
  { value: "Argentina", label: "Argentina", dialCode: "+54" },
  { value: "Chile", label: "Chile", dialCode: "+56" },
  { value: "Colombia", label: "Colombia", dialCode: "+57" },
  { value: "Mexico", label: "Mexico", dialCode: "+52" },
  { value: "Peru", label: "Peru", dialCode: "+51" },
  { value: "Uruguay", label: "Uruguay", dialCode: "+598" },
  { value: "Venezuela", label: "Venezuela", dialCode: "+58" },
  { value: "Espana", label: "Espana", dialCode: "+34" },
  { value: "Estados Unidos", label: "Estados Unidos", dialCode: "+1" },
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

type FormErrors = Partial<Record<keyof ClientFormState, string>>

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
  const [errors, setErrors] = useState<FormErrors>({})
  const { toast } = useToast()

  const {
    data: clientsData,
    mutate: mutateClients,
    isLoading,
  } = useSWR("/api/clients?archived=false", apiClient.get)

  const { data: caseTypesData } = useSWR("/api/case-types", () => api.getCaseTypes())
  const caseTypes = caseTypesData?.caseTypes || []
  const selectedType = caseTypes.find((type: any) => type.id === form.caseTypeId)
  const selectedCountry = useMemo(
    () => countryOptions.find((country) => country.value === form.country_of_origin),
    [form.country_of_origin],
  )

  const filteredClients = (clientsData?.clients || []).filter((client: any) => {
    const query = searchTerm.toLowerCase()
    return client.name?.toLowerCase().includes(query) || client.email?.toLowerCase().includes(query)
  })

  const resetForm = () => {
    setForm(emptyForm)
    setErrors({})
  }

  const clearFieldError = (field: keyof ClientFormState) => {
    setErrors((prev) => {
      if (!prev[field]) return prev
      const next = { ...prev }
      delete next[field]
      return next
    })
  }

  const updateField = (field: keyof ClientFormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    clearFieldError(field)
  }

  const validateForm = () => {
    const newErrors: FormErrors = {}
    const trimmedName = form.name.trim()
    const trimmedEmail = form.email.trim()
    const trimmedPhone = form.phone.trim()

    if (!trimmedName) {
      newErrors.name = "Ingresa el nombre del cliente."
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!trimmedEmail) {
      newErrors.email = "El correo es obligatorio."
    } else if (!emailPattern.test(trimmedEmail)) {
      newErrors.email = "El formato de correo no es valido."
    }

    if (!trimmedPhone) {
      newErrors.phone = "El telefono es obligatorio."
    } else if (!/^\+?[0-9][0-9\s-]{7,}$/.test(trimmedPhone)) {
      newErrors.phone = "Usa un telefono valido e incluye el prefijo."
    }

    if (!form.country_of_origin) {
      newErrors.country_of_origin = "Selecciona el pais de origen."
    }

    if (!form.caseTypeId) {
      newErrors.caseTypeId = "Selecciona el tipo de caso."
    }

    if (!form.priority) {
      newErrors.priority = "Selecciona la prioridad."
    }

    return newErrors
  }

  const handleCountryChange = (value: string) => {
    const nextCountry = countryOptions.find((country) => country.value === value)
    setForm((prev) => {
      const previousCountry = countryOptions.find((country) => country.value === prev.country_of_origin)
      const previousDial = previousCountry?.dialCode
      const nextDial = nextCountry?.dialCode
      let nextPhone = prev.phone

      if (!prev.phone.trim() && nextDial) {
        nextPhone = `${nextDial} `
      } else if (previousDial && nextDial && prev.phone.startsWith(previousDial)) {
        nextPhone = `${nextDial}${prev.phone.slice(previousDial.length)}`
      }

      return {
        ...prev,
        country_of_origin: value,
        phone: nextPhone,
      }
    })
    clearFieldError("country_of_origin")
  }

  const handlePhoneFocus = () => {
    if (form.phone.trim() || !selectedCountry?.dialCode) return
    updateField("phone", `${selectedCountry.dialCode} `)
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    const validationErrors = validateForm()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      toast({
        title: "Revisa los datos",
        description: "Hay campos que necesitan tu atencion.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const payload = {
        ...form,
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        notes: form.notes.trim(),
      }
      await api.createClient(payload)
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

      <ImportClientsCard caseTypes={caseTypes} onImported={mutateClients} />

      {showForm && (
        <Card className="p-6">
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-xs font-semibold uppercase text-muted-foreground">Nombre completo</label>
                <Input
                  value={form.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  aria-invalid={Boolean(errors.name)}
                  aria-describedby={errors.name ? "name-error" : undefined}
                  autoComplete="name"
                  className={errors.name ? "border-destructive focus-visible:ring-destructive" : ""}
                />
                {errors.name && (
                  <p id="name-error" className="mt-1 text-xs text-destructive">
                    {errors.name}
                  </p>
                )}
              </div>
              <div>
                <label className="text-xs font-semibold uppercase text-muted-foreground">Correo</label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={errors.email ? "email-error" : undefined}
                  autoComplete="email"
                  className={errors.email ? "border-destructive focus-visible:ring-destructive" : ""}
                />
                {errors.email && (
                  <p id="email-error" className="mt-1 text-xs text-destructive">
                    {errors.email}
                  </p>
                )}
              </div>
              <div>
                <label className="text-xs font-semibold uppercase text-muted-foreground">Telefono</label>
                <Input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                  onFocus={handlePhoneFocus}
                  aria-invalid={Boolean(errors.phone)}
                  aria-describedby={
                    errors.phone ? "phone-error" : selectedCountry ? "phone-hint" : undefined
                  }
                  autoComplete="tel"
                  placeholder="+34 600 000 000"
                  className={errors.phone ? "border-destructive focus-visible:ring-destructive" : ""}
                />
                {selectedCountry && !errors.phone && (
                  <p id="phone-hint" className="mt-1 text-xs text-muted-foreground">
                    Prefijo sugerido: {selectedCountry.dialCode}
                  </p>
                )}
                {errors.phone && (
                  <p id="phone-error" className="mt-1 text-xs text-destructive">
                    {errors.phone}
                  </p>
                )}
              </div>
              <div>
                <label className="text-xs font-semibold uppercase text-muted-foreground">Pais de origen</label>
                <Select value={form.country_of_origin} onValueChange={handleCountryChange}>
                  <SelectTrigger
                    className={errors.country_of_origin ? "border-destructive focus-visible:ring-destructive" : ""}
                    aria-invalid={Boolean(errors.country_of_origin)}
                    aria-describedby={errors.country_of_origin ? "country-error" : undefined}
                  >
                    <SelectValue placeholder="Selecciona una opcion" />
                  </SelectTrigger>
                  <SelectContent>
                    {countryOptions.map((country) => (
                      <SelectItem key={country.value} value={country.value}>
                        {country.label} ({country.dialCode})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.country_of_origin && (
                  <p id="country-error" className="mt-1 text-xs text-destructive">
                    {errors.country_of_origin}
                  </p>
                )}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-xs font-semibold uppercase text-muted-foreground">Tipo de caso</label>
                <Select
                  value={form.caseTypeId}
                  onValueChange={(value) => updateField("caseTypeId", value)}
                >
                  <SelectTrigger
                    className={`w-full ${errors.caseTypeId ? "border-destructive focus-visible:ring-destructive" : ""}`}
                    aria-invalid={Boolean(errors.caseTypeId)}
                    aria-describedby={errors.caseTypeId ? "case-type-error" : undefined}
                  >
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
                {errors.caseTypeId && (
                  <p id="case-type-error" className="mt-1 text-xs text-destructive">
                    {errors.caseTypeId}
                  </p>
                )}
              </div>
              <div>
                <label className="text-xs font-semibold uppercase text-muted-foreground">Prioridad</label>
                <Select
                  value={form.priority}
                  onValueChange={(value) => updateField("priority", value)}
                >
                  <SelectTrigger
                    className={`w-full ${errors.priority ? "border-destructive focus-visible:ring-destructive" : ""}`}
                    aria-invalid={Boolean(errors.priority)}
                    aria-describedby={errors.priority ? "priority-error" : undefined}
                  >
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
                {errors.priority && (
                  <p id="priority-error" className="mt-1 text-xs text-destructive">
                    {errors.priority}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase text-muted-foreground">Notas internas</label>
              <Textarea
                value={form.notes}
                onChange={(e) => updateField("notes", e.target.value)}
                className="min-h-[120px]"
                placeholder="Datos adicionales, contexto de la consulta, etc."
                aria-invalid={false}
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
