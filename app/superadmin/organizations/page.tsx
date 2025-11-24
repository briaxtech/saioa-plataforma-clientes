"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Building2, Filter, RefreshCw, Search } from "lucide-react"
import { superadminFetch } from "@/lib/superadmin-client"

interface OrganizationRow {
  id: string
  name: string
  slug: string
  domain?: string | null
  is_active: boolean
  created_at?: string
  last_activity_at?: string | null
  admin_count?: number
  staff_count?: number
  client_count?: number
  case_count?: number
}

const defaultFilters = {
  status: "all",
  activity: "all",
  sort: "created_desc",
  createdFrom: "",
  createdTo: "",
}

export default function SuperAdminOrganizationsPage() {
  const [organizations, setOrganizations] = useState<OrganizationRow[]>([])
  const [filters, setFilters] = useState(defaultFilters)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const formatDate = (value?: string | null) => {
    if (!value) return "-"
    try {
      return new Date(value).toLocaleDateString("es-ES", { year: "numeric", month: "short", day: "numeric" })
    } catch {
      return value
    }
  }

  const loadOrganizations = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filters.status !== "all") params.set("status", filters.status)
      if (filters.activity !== "all") params.set("activity", filters.activity)
      if (filters.sort) params.set("sort", filters.sort)
      if (filters.createdFrom) params.set("createdFrom", filters.createdFrom)
      if (filters.createdTo) params.set("createdTo", filters.createdTo)

      const data = await superadminFetch(`/api/superadmin/organizations?${params.toString()}`)
      setOrganizations((data as any)?.organizations || [])
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron cargar las organizaciones")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOrganizations()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.status, filters.activity, filters.sort, filters.createdFrom, filters.createdTo])

  const setFilter = (key: keyof typeof filters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const resetFilters = () => setFilters({ ...defaultFilters })

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">SuperAdmin</p>
          <h1 className="text-2xl font-bold text-foreground">Organizaciones</h1>
          <p className="text-sm text-muted-foreground">Panorama de tenants con filtros, actividad y acciones rapidas.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadOrganizations} disabled={loading}>
            <RefreshCw className="mr-2 h-4 w-4" />
            {loading ? "Actualizando..." : "Refrescar"}
          </Button>
          <Button variant="secondary" size="sm" onClick={resetFilters}>
            <Filter className="mr-2 h-4 w-4" />
            Limpiar
          </Button>
        </div>
      </div>

      {error && <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>}

      <Card className="p-4 sm:p-6 space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground">Estado</label>
            <Select value={filters.status} onValueChange={(value) => setFilter("status", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Activos</SelectItem>
                <SelectItem value="inactive">Inactivos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground">Actividad</label>
            <Select value={filters.activity} onValueChange={(value) => setFilter("activity", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Actividad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="stale30">Sin actividad 30d</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground">Orden</label>
            <Select value={filters.sort} onValueChange={(value) => setFilter("sort", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_desc">Creacion (recientes)</SelectItem>
                <SelectItem value="created_asc">Creacion (antiguas)</SelectItem>
                <SelectItem value="name_asc">Nombre A-Z</SelectItem>
                <SelectItem value="name_desc">Nombre Z-A</SelectItem>
                <SelectItem value="activity_desc">Actividad reciente</SelectItem>
                <SelectItem value="cases_desc">Casos (mas)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground">Creado desde</label>
            <Input type="date" value={filters.createdFrom} onChange={(e) => setFilter("createdFrom", e.target.value)} />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground">Creado hasta</label>
            <Input type="date" value={filters.createdTo} onChange={(e) => setFilter("createdTo", e.target.value)} />
          </div>
        </div>
      </Card>

      <Card className="p-4 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold">Listado de organizaciones</h3>
            <p className="text-sm text-muted-foreground">{organizations.length} resultados</p>
          </div>
          <span className="rounded-full bg-muted p-2 text-foreground">
            <Search className="h-4 w-4" />
          </span>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground">
                <th className="py-2 pr-4">Nombre</th>
                <th className="py-2 pr-4">Dominio / Slug</th>
                <th className="py-2 pr-4">Estado</th>
                <th className="py-2 pr-4">Creado</th>
                <th className="py-2 pr-4">Ult. actividad</th>
                <th className="py-2 pr-4">Admins</th>
                <th className="py-2 pr-4">Staff</th>
                <th className="py-2 pr-4">Clientes</th>
                <th className="py-2 pr-4">Casos</th>
                <th className="py-2 pr-4">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td className="py-4 text-muted-foreground" colSpan={10}>
                    Cargando organizaciones...
                  </td>
                </tr>
              )}

              {!loading &&
                organizations.map((org) => (
                  <tr key={org.id} className="border-t border-border/60">
                    <td className="py-2 pr-4 font-semibold">{org.name}</td>
                    <td className="py-2 pr-4 text-muted-foreground">{org.domain || org.slug}</td>
                    <td className="py-2 pr-4">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-semibold ${
                          org.is_active ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {org.is_active ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="py-2 pr-4 text-muted-foreground">{formatDate(org.created_at)}</td>
                    <td className="py-2 pr-4 text-muted-foreground">{formatDate(org.last_activity_at)}</td>
                    <td className="py-2 pr-4">{org.admin_count ?? "-"}</td>
                    <td className="py-2 pr-4">{org.staff_count ?? "-"}</td>
                    <td className="py-2 pr-4">{org.client_count ?? "-"}</td>
                    <td className="py-2 pr-4">{org.case_count ?? "-"}</td>
                    <td className="py-2 pr-4">
                      <Link
                        href={`/superadmin/organizations/${org.id}`}
                        className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold transition hover:border-primary hover:text-primary"
                      >
                        <Building2 className="h-4 w-4" />
                        Ver detalle
                      </Link>
                    </td>
                  </tr>
                ))}

              {!loading && organizations.length === 0 && (
                <tr>
                  <td className="py-4 text-center text-muted-foreground" colSpan={10}>
                    No hay organizaciones con los filtros seleccionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
