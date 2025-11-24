"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Building2, CalendarClock, ChartLine, PauseCircle, RefreshCw, ShieldCheck, Sparkles, UserRound } from "lucide-react"
import { superadminFetch } from "@/lib/superadmin-client"

interface TenantRow {
  id: string
  name: string
  slug: string
  logo_url?: string | null
  is_active?: boolean
  created_at?: string
  user_count?: number
}

interface DashboardData {
  organizations: {
    total: number
    active: number
    newLast7: number
    newLast30: number
  }
  users: {
    total: number
    admins: number
    staff: number
    clients: number
    newLast30: number
  }
  cases: {
    total: number
    newToday: number
    newLast7: number
    open: number
    completedLast30: number
  }
  messages: {
    today: number
    readRateLast30Days: number
    totalLast30: number
  }
  documents: {
    last7Days: number
    pending: number
    requiredPending: number
    totalStorageUsed: number
  }
  charts: {
    orgsPerWeek: Array<{ week: string; count: number }>
    casesPerDay: Array<{ day: string; count: number }>
    casesByType: Array<{ type: string; count: number }>
    casesByStatus: Array<{ status: string; count: number }>
  }
}

export default function SuperAdminDashboard() {
  const [tenants, setTenants] = useState<TenantRow[]>([])
  const [loadingTenants, setLoadingTenants] = useState(true)
  const [loadingDashboard, setLoadingDashboard] = useState(true)
  const [dashboard, setDashboard] = useState<DashboardData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [dashboardError, setDashboardError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [createdCode, setCreatedCode] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"overview" | "access">("overview")
  const [form, setForm] = useState({ name: "", email: "", password: "", palette: "ocean", logo_url: "" })
  const [otpEmail, setOtpEmail] = useState("")
  const [otpCode, setOtpCode] = useState("")
  const [otpMessage, setOtpMessage] = useState<string | null>(null)
  const [otpSending, setOtpSending] = useState(false)
  const [otpVerifying, setOtpVerifying] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  const loadTenants = async () => {
    try {
      setLoadingTenants(true)
      const data = await superadminFetch("/api/superadmin")
      setTenants((data as any)?.tenants || [])
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron cargar los tenants")
    } finally {
      setLoadingTenants(false)
    }
  }

  const loadDashboard = async () => {
    try {
      setLoadingDashboard(true)
      const data = await superadminFetch("/api/superadmin/dashboard")
      setDashboard(data as DashboardData)
      setDashboardError(null)
    } catch (err) {
      setDashboardError(err instanceof Error ? err.message : "No se pudieron cargar las metricas")
    } finally {
      setLoadingDashboard(false)
    }
  }

  useEffect(() => {
    loadTenants()
    loadDashboard()
  }, [])

  useEffect(() => {
    const syncTabFromHash = () => {
      if (typeof window === "undefined") return
      const hash = window.location.hash.replace("#", "")
      if (hash === "crear" || hash === "verificacion") {
        setActiveTab("access")
      } else {
        setActiveTab("overview")
      }
    }

    syncTabFromHash()
    window.addEventListener("hashchange", syncTabFromHash)
    return () => window.removeEventListener("hashchange", syncTabFromHash)
  }, [])

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault()
    setCreating(true)
    setError(null)
    setCreatedCode(null)
    setOtpMessage(null)
    try {
      const res = await superadminFetch("/api/superadmin", {
        method: "PUT",
        body: JSON.stringify({ ...form, logo_url: form.logo_url || null }),
      })
      setCreatedCode((res as any)?.verification_code || null)
      setForm({ name: "", email: "", password: "", palette: "ocean", logo_url: "" })
      setOtpEmail((res as any)?.admin?.email || "")
      await loadTenants()
      await loadDashboard()
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear el tenant")
    } finally {
      setCreating(false)
    }
  }

  const sendOtp = async () => {
    if (!otpEmail) {
      setOtpMessage("Ingresa un email para enviar el codigo")
      return
    }
    setOtpSending(true)
    setOtpMessage(null)
    try {
      const res = await superadminFetch("/api/superadmin/verify", {
        method: "POST",
        body: JSON.stringify({ email: otpEmail }),
      })
      setOtpMessage(res.email_sent ? "Codigo enviado por email" : `Codigo: ${res.code}`)
    } catch (err) {
      setOtpMessage(err instanceof Error ? err.message : "No se pudo enviar el codigo")
    } finally {
      setOtpSending(false)
    }
  }

  const verifyOtp = async () => {
    if (!otpEmail || !otpCode) {
      setOtpMessage("Ingresa email y codigo")
      return
    }
    setOtpVerifying(true)
    setOtpMessage(null)
    try {
      await superadminFetch("/api/superadmin/verify", {
        method: "PUT",
        body: JSON.stringify({ email: otpEmail, code: otpCode }),
      })
      setOtpMessage("Verificacion confirmada")
      setOtpCode("")
      await loadTenants()
    } catch (err) {
      setOtpMessage(err instanceof Error ? err.message : "No se pudo verificar el codigo")
    } finally {
      setOtpVerifying(false)
    }
  }

  const toggleStatus = async (id: string, action: "activate" | "suspend") => {
    setStatusMessage(null)
    try {
      await superadminFetch("/api/superadmin/tenants", {
        method: "PATCH",
        body: JSON.stringify({ id, action }),
      })
      setStatusMessage("Estado actualizado")
      await loadTenants()
    } catch (err) {
      setStatusMessage(err instanceof Error ? err.message : "No se pudo actualizar el estado")
    }
  }

  const totalTenants = tenants.length
  const activeTenants = tenants.filter((tenant) => tenant.is_active !== false).length
  const suspendedTenants = totalTenants - activeTenants
  const totalUsers = tenants.reduce((sum, tenant) => sum + (tenant.user_count || 0), 0)
  const latestTenant = tenants[0]

  const formatNumber = (value?: number | null) => {
    if (value === undefined || value === null || Number.isNaN(value)) return "—"
    return value.toLocaleString("es-ES")
  }

  const refreshAll = async () => {
    await Promise.all([loadDashboard(), loadTenants()])
  }

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent px-6 py-6 sm:px-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">SuperAdmin</p>
            <h1 className="text-3xl font-bold text-foreground">Dashboard maestro de tenants</h1>
            <p className="text-sm text-muted-foreground max-w-2xl">
              Controla altas, verificaciones y estado de cada espacio SaaS. Los accesos se emiten con codigo OTP y se pueden reactivar al instante.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" size="sm" onClick={refreshAll} disabled={loadingTenants || loadingDashboard}>
              <RefreshCw className="mr-2 h-4 w-4" />
              {loadingTenants || loadingDashboard ? "Actualizando..." : "Refrescar"}
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setActiveTab("access")
                if (typeof window !== "undefined") window.location.hash = "crear"
              }}
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Nuevo tenant
            </Button>
          </div>
        </div>
      </div>

      {error && <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>}
      {dashboardError && (
        <div className="rounded-lg border border-amber-200/60 bg-amber-50 px-4 py-3 text-sm text-amber-700">Algunas metricas no cargaron: {dashboardError}</div>
      )}
      {statusMessage && <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{statusMessage}</div>}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <Card className="p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Organizaciones totales</p>
              <p className="mt-2 text-3xl font-bold">{formatNumber(dashboard?.organizations.total)}</p>
            </div>
            <span className="rounded-full bg-primary/10 p-3 text-primary">
              <Building2 className="h-5 w-5" />
            </span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
            <div className="rounded-lg bg-muted/60 p-2">
              <p className="text-muted-foreground">Activas</p>
              <p className="font-semibold text-foreground">{formatNumber(dashboard?.organizations.active)}</p>
            </div>
            <div className="rounded-lg bg-muted/60 p-2">
              <p className="text-muted-foreground">Ultimos 30 dias</p>
              <p className="font-semibold text-foreground">{formatNumber(dashboard?.organizations.newLast30)}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Usuarios</p>
              <p className="mt-2 text-3xl font-bold">{formatNumber(dashboard?.users.total)}</p>
            </div>
            <span className="rounded-full bg-primary/10 p-3 text-primary">
              <UserRound className="h-5 w-5" />
            </span>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-3 text-xs">
            <div className="rounded-lg bg-muted/60 p-2">
              <p className="text-muted-foreground">Admins</p>
              <p className="font-semibold text-foreground">{formatNumber(dashboard?.users.admins)}</p>
            </div>
            <div className="rounded-lg bg-muted/60 p-2">
              <p className="text-muted-foreground">Staff</p>
              <p className="font-semibold text-foreground">{formatNumber(dashboard?.users.staff)}</p>
            </div>
            <div className="rounded-lg bg-muted/60 p-2">
              <p className="text-muted-foreground">Clientes</p>
              <p className="font-semibold text-foreground">{formatNumber(dashboard?.users.clients)}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Casos</p>
              <p className="mt-2 text-3xl font-bold">{formatNumber(dashboard?.cases.total)}</p>
            </div>
            <span className="rounded-full bg-primary/10 p-3 text-primary">
              <ChartLine className="h-5 w-5" />
            </span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
            <div className="rounded-lg bg-muted/60 p-2">
              <p className="text-muted-foreground">Abiertos</p>
              <p className="font-semibold text-foreground">{formatNumber(dashboard?.cases.open)}</p>
            </div>
            <div className="rounded-lg bg-muted/60 p-2">
              <p className="text-muted-foreground">Completados 30d</p>
              <p className="font-semibold text-foreground">{formatNumber(dashboard?.cases.completedLast30)}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Docs & Mensajes</p>
              <p className="mt-2 text-3xl font-bold">{formatNumber(dashboard?.documents.pending)}</p>
            </div>
            <span className="rounded-full bg-primary/10 p-3 text-primary">
              <ShieldCheck className="h-5 w-5" />
            </span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
            <div className="rounded-lg bg-muted/60 p-2">
              <p className="text-muted-foreground">Msgs hoy</p>
              <p className="font-semibold text-foreground">{formatNumber(dashboard?.messages.today)}</p>
            </div>
            <div className="rounded-lg bg-muted/60 p-2">
              <p className="text-muted-foreground">Lectura 30d</p>
              <p className="font-semibold text-foreground">
                {dashboard ? `${dashboard.messages.readRateLast30Days.toFixed(1)}%` : "—"}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-2">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold">Nuevas organizaciones (8 semanas)</h3>
              <p className="text-sm text-muted-foreground">Serie semanal, listo para conectar a charts.</p>
            </div>
            <span className="rounded-full bg-muted p-2 text-foreground">
              <Building2 className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {(dashboard?.charts?.orgsPerWeek || []).map((item) => (
              <div key={item.week} className="rounded-lg border border-border/60 bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground">{item.week}</p>
                <p className="text-xl font-semibold">{item.count}</p>
              </div>
            ))}
            {!dashboard && <p className="text-sm text-muted-foreground">Cargando serie...</p>}
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold">Distribucion por tipo</h3>
              <p className="text-sm text-muted-foreground">Conteo de casos por case_type.</p>
            </div>
            <span className="rounded-full bg-muted p-2 text-foreground">
              <ChartLine className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-4 space-y-2">
            {(dashboard?.charts?.casesByType || []).map((item) => (
              <div key={item.type} className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2">
                <span className="text-sm capitalize text-foreground">{item.type.replace("_", " ")}</span>
                <span className="text-sm font-semibold">{item.count}</span>
              </div>
            ))}
            {!dashboard && <p className="text-sm text-muted-foreground">Cargando distribucion...</p>}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold">Nuevos casos (30 dias)</h3>
              <p className="text-sm text-muted-foreground">Conteo diario listo para graficar o exportar.</p>
            </div>
            <span className="rounded-full bg-muted p-2 text-foreground">
              <ChartLine className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3">
            {(dashboard?.charts?.casesPerDay || []).slice(-9).map((item) => (
              <div key={item.day} className="rounded-lg border border-border/60 bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground">{item.day}</p>
                <p className="text-xl font-semibold">{item.count}</p>
              </div>
            ))}
            {!dashboard && <p className="text-sm text-muted-foreground">Cargando casos por dia...</p>}
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold">Casos por estado</h3>
              <p className="text-sm text-muted-foreground">Distribucion por status (texto, listo para grafica).</p>
            </div>
            <span className="rounded-full bg-muted p-2 text-foreground">
              <ShieldCheck className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-4 space-y-2">
            {(dashboard?.charts?.casesByStatus || []).map((item) => (
              <div key={item.status} className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2">
                <span className="text-sm capitalize text-foreground">{item.status.replace("_", " ")}</span>
                <span className="text-sm font-semibold">{item.count}</span>
              </div>
            ))}
            {!dashboard && <p className="text-sm text-muted-foreground">Cargando estados...</p>}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="p-4 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Tenants activos</p>
              <p className="mt-1 text-3xl font-bold text-foreground">{loadingTenants ? "-" : activeTenants}</p>
            </div>
            <span className="rounded-full bg-primary/15 p-3 text-primary">
              <ShieldCheck className="h-5 w-5" />
            </span>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Con acceso vigente y produccion habilitada.</p>
        </Card>

        <Card className="p-4 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Tenants suspendidos</p>
              <p className="mt-1 text-3xl font-bold text-foreground">{loadingTenants ? "-" : suspendedTenants}</p>
            </div>
            <span className="rounded-full bg-amber-100 p-3 text-amber-600">
              <PauseCircle className="h-5 w-5" />
            </span>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Bloqueados temporalmente por SuperAdmin.</p>
        </Card>

        <Card className="p-4 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Usuarios totales</p>
              <p className="mt-1 text-3xl font-bold text-foreground">{loadingTenants ? "-" : totalUsers}</p>
            </div>
            <span className="rounded-full bg-primary/10 p-3 text-primary">
              <UserRound className="h-5 w-5" />
            </span>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Sumatoria de usuarios por tenant.</p>
        </Card>

        <Card className="p-4 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Tenants totales</p>
              <p className="mt-1 text-3xl font-bold text-foreground">{loadingTenants ? "-" : totalTenants}</p>
            </div>
            <span className="rounded-full bg-primary/10 p-3 text-primary">
              <Building2 className="h-5 w-5" />
            </span>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Organizaciones creadas en el sistema.</p>
        </Card>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as "overview" | "access")}
        className="space-y-6"
      >
        <TabsList className="w-full justify-start rounded-2xl bg-muted p-1">
          <TabsTrigger value="overview" className="flex-1 rounded-xl">
            Resumen y control
          </TabsTrigger>
          <TabsTrigger value="access" className="flex-1 rounded-xl">
            Altas y verificacion
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value="overview"
          className="space-y-6 focus-visible:ring-0 focus-visible:ring-offset-0 data-[state=inactive]:hidden"
        >
          <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
            <Card id="tenants" className="p-6">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Tenants creados</h3>
                  <p className="text-sm text-muted-foreground">Estados operativos y accesos directos.</p>
                </div>
                <Button variant="secondary" size="sm" onClick={() => setActiveTab("access")}>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Crear desde aqui
                </Button>
              </div>

              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-muted-foreground">
                      <th className="py-2 pr-4">Nombre</th>
                      <th className="py-2 pr-4">Slug</th>
                      <th className="py-2 pr-4">Usuarios</th>
                      <th className="py-2 pr-4">Estado</th>
                      <th className="py-2 pr-4">Creado</th>
                      <th className="py-2 pr-4">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingTenants && (
                      <tr>
                        <td className="py-4 text-muted-foreground" colSpan={6}>
                          Cargando tenants...
                        </td>
                      </tr>
                    )}
                    {!loadingTenants &&
                      tenants.map((tenant) => (
                        <tr key={tenant.id} className="border-t border-border/60">
                          <td className="py-2 pr-4 font-medium text-foreground">{tenant.name}</td>
                          <td className="py-2 pr-4 text-muted-foreground">{tenant.slug}</td>
                          <td className="py-2 pr-4">{tenant.user_count ?? "-"}</td>
                          <td className="py-2 pr-4">
                            <span
                              className={`rounded-full px-2 py-1 text-xs font-semibold ${
                                tenant.is_active === false
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-emerald-100 text-emerald-700"
                              }`}
                            >
                              {tenant.is_active === false ? "Suspendido" : "Activo"}
                            </span>
                          </td>
                          <td className="py-2 pr-4 text-muted-foreground">
                            {(tenant as any).created_at?.slice(0, 10) || "-"}
                          </td>
                          <td className="py-2 pr-4 space-x-2">
                            {tenant.is_active === false ? (
                              <Button variant="secondary" size="sm" onClick={() => toggleStatus(tenant.id, "activate")}>
                                Activar
                              </Button>
                            ) : (
                              <Button variant="outline" size="sm" onClick={() => toggleStatus(tenant.id, "suspend")}>
                                Suspender
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    {tenants.length === 0 && !loadingTenants && (
                      <tr>
                        <td className="py-4 text-muted-foreground" colSpan={6}>
                          No hay tenants aun.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>

            <Card className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-base font-semibold">Ultimo movimiento</h4>
                  <p className="text-sm text-muted-foreground">Detalle rapido del ultimo tenant creado.</p>
                </div>
                <span className="rounded-full bg-primary/10 p-3 text-primary">
                  <CalendarClock className="h-5 w-5" />
                </span>
              </div>

              {latestTenant ? (
                <div className="space-y-3 rounded-xl border border-border/60 bg-muted/40 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold">{latestTenant.name}</p>
                      <p className="text-xs text-muted-foreground">Slug: {latestTenant.slug}</p>
                    </div>
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-semibold ${
                        latestTenant.is_active === false ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      {latestTenant.is_active === false ? "Suspendido" : "Activo"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Usuarios: {latestTenant.user_count ?? "—"}</span>
                    <span>Creado: {(latestTenant as any).created_at?.slice(0, 10) || "—"}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Usa el tab <span className="font-semibold text-foreground">Altas y verificacion</span> para enviar OTP o reactivar accesos.
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Crea el primer tenant para ver actividad reciente.</p>
              )}
            </Card>
          </div>
        </TabsContent>

        <TabsContent
          value="access"
          className="space-y-6 focus-visible:ring-0 focus-visible:ring-offset-0 data-[state=inactive]:hidden"
        >
          <div className="grid gap-6 lg:grid-cols-[7fr,5fr]">
            <Card id="crear" className="p-6">
              <h3 className="text-lg font-semibold">Nuevo tenant</h3>
              <p className="mb-4 text-sm text-muted-foreground">
                Se creara el admin inicial, la marca base y se enviara un codigo de verificacion por email.
              </p>
              <form onSubmit={handleCreate} className="grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium">Nombre</label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Empresa o persona"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Email admin</label>
                  <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Contrasena</label>
                  <Input
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required
                  />
                  <p className="text-[11px] text-muted-foreground">8+ caracteres, letra, numero y simbolo.</p>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Paleta</label>
                  <Select value={form.palette} onValueChange={(palette) => setForm({ ...form, palette })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona paleta" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ocean">Ocean (light/dark)</SelectItem>
                      <SelectItem value="plum">Plum (light/dark)</SelectItem>
                      <SelectItem value="slate">Slate (light/dark)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Logo (URL opcional)</label>
                  <Input
                    value={form.logo_url}
                    onChange={(e) => setForm({ ...form, logo_url: e.target.value })}
                    placeholder="https://.../logo.png"
                  />
                </div>
                <div className="md:col-span-2 flex flex-wrap items-center gap-3">
                  <Button type="submit" disabled={creating}>
                    {creating ? "Creando..." : "Crear tenant"}
                  </Button>
                  {createdCode && <span className="text-sm text-emerald-600">Codigo de verificacion: {createdCode}</span>}
                </div>
              </form>
            </Card>

            <Card id="verificacion" className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Verificar codigo</h3>
                  <p className="text-sm text-muted-foreground">Envia o confirma el OTP del admin inicial.</p>
                </div>
                <span className="rounded-full bg-primary/10 p-3 text-primary">
                  <ShieldCheck className="h-5 w-5" />
                </span>
              </div>
              <div className="grid items-end gap-3 sm:grid-cols-[2fr,1fr,auto]">
                <div>
                  <label className="mb-1 block text-sm font-medium">Email</label>
                  <Input value={otpEmail} onChange={(e) => setOtpEmail(e.target.value)} placeholder="admin@tenant.com" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Codigo</label>
                  <Input value={otpCode} onChange={(e) => setOtpCode(e.target.value)} placeholder="123456" />
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="secondary" onClick={sendOtp} disabled={otpSending}>
                    {otpSending ? "Enviando..." : "Enviar codigo"}
                  </Button>
                  <Button type="button" onClick={verifyOtp} disabled={otpVerifying}>
                    {otpVerifying ? "Verificando..." : "Confirmar"}
                  </Button>
                </div>
              </div>
              {otpMessage && <p className="text-sm text-muted-foreground">{otpMessage}</p>}
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
