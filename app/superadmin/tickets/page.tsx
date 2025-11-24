"use client"

import { useMemo, useState } from "react"
import useSWR from "swr"
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Filter,
  Inbox,
  MessageSquare,
  RefreshCw,
  Send,
  ShieldCheck,
  Users,
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { superadminFetch } from "@/lib/superadmin-client"

type TicketStatus = "open" | "in_progress" | "resolved"
type TicketPriority = "low" | "medium" | "high" | "urgent"

type TicketMessage = {
  id: string | number
  author: string
  author_role: "admin" | "superadmin"
  content: string
  created_at: string
}

type Ticket = {
  id: string
  subject: string
  organization_name?: string
  admin_name?: string
  status: TicketStatus
  priority: TicketPriority
  created_at?: string
  updated_at?: string
  messages?: TicketMessage[]
}

const statusLabels: Record<TicketStatus, { label: string; color: string }> = {
  open: { label: "Abierto", color: "bg-amber-100 text-amber-800" },
  in_progress: { label: "En curso", color: "bg-sky-100 text-sky-800" },
  resolved: { label: "Resuelto", color: "bg-emerald-100 text-emerald-800" },
}

const priorityLabels: Record<TicketPriority, { label: string; color: string }> = {
  low: { label: "Baja", color: "bg-slate-100 text-slate-700" },
  medium: { label: "Media", color: "bg-blue-100 text-blue-700" },
  high: { label: "Alta", color: "bg-amber-100 text-amber-800" },
  urgent: { label: "Urgente", color: "bg-rose-100 text-rose-700" },
}

const fetchTickets = async () => {
  const data = await superadminFetch("/api/superadmin/tickets")
  return (data as any)?.tickets || []
}

export default function SuperadminTicketsPage() {
  const { data, isLoading, error, mutate } = useSWR<Ticket[]>("/api/superadmin/tickets", fetchTickets, {
    refreshInterval: 30_000,
  })
  const tickets = data || []

  const [statusFilter, setStatusFilter] = useState<TicketStatus | "all">("open")
  const [search, setSearch] = useState("")
  const [reply, setReply] = useState("")

  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      const matchesStatus = statusFilter === "all" ? true : ticket.status === statusFilter
      const q = search.trim().toLowerCase()
      const matchesSearch =
        !q ||
        ticket.subject.toLowerCase().includes(q) ||
        (ticket.organization_name || "").toLowerCase().includes(q) ||
        (ticket.admin_name || "").toLowerCase().includes(q)
      return matchesStatus && matchesSearch
    })
  }, [tickets, statusFilter, search])

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selectedTicket = filteredTickets.find((t) => t.id === selectedId) || filteredTickets[0]

  const handleSelect = (id: string) => {
    setSelectedId(id)
    setReply("")
  }

  const handleReply = async () => {
    if (!selectedTicket || !reply.trim()) return
    const payload = { content: reply.trim() }
    await superadminFetch(`/api/superadmin/tickets/${selectedTicket.id}/reply`, {
      method: "POST",
      body: JSON.stringify(payload),
    })
    setReply("")
    mutate()
  }

  const handleStatusChange = async (nextStatus: TicketStatus) => {
    if (!selectedTicket) return
    await superadminFetch(`/api/superadmin/tickets/${selectedTicket.id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status: nextStatus }),
    })
    mutate()
  }

  const statusCounts = useMemo(() => {
    return tickets.reduce(
      (acc, ticket) => {
        acc[ticket.status] += 1
        return acc
      },
      { open: 0, in_progress: 0, resolved: 0 },
    )
  }, [tickets])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">SuperAdmin</p>
          <h1 className="text-3xl font-bold text-foreground">Mesa de tickets</h1>
          <p className="text-sm text-muted-foreground">
            Centraliza consultas de administradores, responde en hilo y cierra cuando est�� resuelto.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => mutate()} disabled={isLoading}>
            <RefreshCw className="mr-2 h-4 w-4" />
            {isLoading ? "Actualizando..." : "Refrescar"}
          </Button>
          <Badge variant="secondary" className="gap-1">
            <MessageSquare className="h-4 w-4" />
            {tickets.length} tickets
          </Badge>
        </div>
      </div>

      {error && (
        <Card className="border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          No pudimos cargar los tickets: {error.message}
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-[1fr,2fr]">
        <Card className="space-y-4 p-4">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2">
              <Input
                placeholder="Buscar por asunto, organizaci��n o admin..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1"
              />
              <Filter className="hidden h-4 w-4 text-muted-foreground sm:block" />
            </div>
            <div className="flex flex-wrap gap-2">
              {(["all", "open", "in_progress", "resolved"] as const).map((status) => (
                <Button
                  key={status}
                  size="sm"
                  variant={statusFilter === status ? "default" : "outline"}
                  onClick={() => setStatusFilter(status)}
                  className="text-xs"
                >
                  {status === "all"
                    ? "Todos"
                    : status === "open"
                      ? `Abiertos (${statusCounts.open})`
                      : status === "in_progress"
                        ? `En curso (${statusCounts.in_progress})`
                        : `Resueltos (${statusCounts.resolved})`}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2 overflow-y-auto pr-1" style={{ maxHeight: "72vh" }}>
            {filteredTickets.map((ticket) => {
              const status = statusLabels[ticket.status]
              const priority = priorityLabels[ticket.priority]
              const isActive = selectedTicket?.id === ticket.id
              return (
                <button
                  key={ticket.id}
                  onClick={() => handleSelect(ticket.id)}
                  className={`w-full rounded-xl border p-3 text-left transition ${
                    isActive ? "border-primary bg-primary/5 shadow-sm" : "border-border hover:border-primary/40 hover:bg-muted/50"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-foreground">{ticket.subject}</p>
                    <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${status.color}`}>{status.label}</span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    {ticket.organization_name && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-muted/60 px-2 py-0.5">
                        <ShieldCheck className="h-3 w-3" />
                        {ticket.organization_name}
                      </span>
                    )}
                    {ticket.admin_name && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-muted/60 px-2 py-0.5">
                        <Users className="h-3 w-3" />
                        {ticket.admin_name}
                      </span>
                    )}
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 ${priority.color}`}>
                      <AlertTriangle className="h-3 w-3" />
                      {priority.label}
                    </span>
                  </div>
                  <div className="mt-1 text-[11px] text-muted-foreground">
                    Actualizado: {(ticket.updated_at || ticket.created_at || "").toString().slice(0, 16) || "Reciente"}
                  </div>
                </button>
              )
            })}

            {!isLoading && filteredTickets.length === 0 && (
              <div className="flex items-center justify-center rounded-xl border border-dashed border-border p-8 text-sm text-muted-foreground">
                <Inbox className="mr-2 h-4 w-4" />
                Sin tickets con estos filtros.
              </div>
            )}
          </div>
        </Card>

        <Card className="flex min-h-[540px] flex-col">
          {selectedTicket ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 p-4">
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Ticket</p>
                  <h2 className="text-xl font-semibold text-foreground">{selectedTicket.subject}</h2>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 ${statusLabels[selectedTicket.status].color}`}>
                      <Clock3 className="h-3 w-3" />
                      {statusLabels[selectedTicket.status].label}
                    </span>
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 ${priorityLabels[selectedTicket.priority].color}`}>
                      <AlertTriangle className="h-3 w-3" />
                      {priorityLabels[selectedTicket.priority].label}
                    </span>
                    {selectedTicket.organization_name && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-muted/60 px-2 py-0.5">
                        <ShieldCheck className="h-3 w-3" />
                        {selectedTicket.organization_name}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {selectedTicket.status !== "resolved" && (
                    <Button size="sm" variant="secondary" onClick={() => handleStatusChange("resolved")}>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Marcar resuelto
                    </Button>
                  )}
                  {selectedTicket.status === "open" && (
                    <Button size="sm" variant="outline" onClick={() => handleStatusChange("in_progress")}>
                      En curso
                    </Button>
                  )}
                  {selectedTicket.status === "resolved" && (
                    <Button size="sm" variant="outline" onClick={() => handleStatusChange("open")}>
                      Reabrir
                    </Button>
                  )}
                </div>
              </div>

              <div className="flex-1 space-y-4 overflow-y-auto p-4">
                {(selectedTicket.messages || []).map((message) => (
                  <div key={message.id} className="flex flex-col gap-1 rounded-xl border border-border/60 bg-muted/30 p-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-foreground">
                        {message.author} · {message.author_role === "admin" ? "Admin" : "SuperAdmin"}
                      </span>
                      <span className="text-muted-foreground">{new Date(message.created_at).toLocaleString()}</span>
                    </div>
                    <p className="text-sm text-foreground">{message.content}</p>
                  </div>
                ))}

                {(!selectedTicket.messages || selectedTicket.messages.length === 0) && (
                  <div className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">
                    A��n no hay mensajes en este ticket. Responde para iniciar el hilo.
                  </div>
                )}
              </div>

              <div className="border-t border-border/60 bg-muted/30 p-4">
                <Textarea
                  placeholder="Responder al administrador..."
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  className="min-h-[120px]"
                />
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="text-xs text-muted-foreground">Las respuestas quedan visibles para el admin asociado.</div>
                  <Button size="sm" onClick={handleReply} disabled={!reply.trim()}>
                    <Send className="mr-2 h-4 w-4" />
                    Enviar respuesta
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-muted-foreground">
              <MessageSquare className="h-6 w-6" />
              <p className="text-sm">Selecciona un ticket para verlo</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
