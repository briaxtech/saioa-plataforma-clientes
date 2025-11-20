"use client"

import { useState } from "react"
import useSWR from "swr"
import { ArchiveRestore, Briefcase, Loader2, Trash2 } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { api, apiClient } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"

export default function ArchivePage() {
  const { data, isLoading, mutate } = useSWR("/api/clients?archived=true", apiClient.get)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [busyAction, setBusyAction] = useState<"restore" | "delete" | null>(null)
  const { toast } = useToast()

  const archivedClients = data?.clients || []

  const handleRestore = async (clientId: string, clientName: string) => {
    setBusyId(clientId)
    setBusyAction("restore")
    try {
      await api.updateClient(clientId, { archived: false })
      toast({ title: `${clientName} volvió al flujo activo.` })
      mutate()
    } catch (error: any) {
      toast({
        title: "No pudimos restaurar al cliente",
        description: error?.message || "Intenta nuevamente.",
        variant: "destructive",
      })
    } finally {
      setBusyId(null)
      setBusyAction(null)
    }
  }

  const handleDelete = async (clientId: string, clientName: string) => {
    const confirmed = window.confirm(
      `Esta acción eliminará definitivamente a ${clientName} y todos sus registros del sistema. No se puede deshacer.\n\n¿Deseas continuar?`,
    )
    if (!confirmed) return

    setBusyId(clientId)
    setBusyAction("delete")
    try {
      await api.deleteClient(clientId)
      toast({ title: `${clientName} fue eliminado de forma permanente.` })
      mutate()
    } catch (error: any) {
      toast({
        title: "No pudimos eliminar al cliente",
        description: error?.message || "Intenta nuevamente.",
        variant: "destructive",
      })
    } finally {
      setBusyId(null)
      setBusyAction(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Archivo</h1>
        <p className="mt-2 text-muted-foreground">
          Guarda aquí a los clientes con casos finalizados y mantené tu panel operativo más liviano.
        </p>
      </div>

      <Card className="space-y-3 border-dashed border-amber-300 bg-amber-50/40 p-6">
        <p className="text-sm text-amber-900">
          Eliminar un cliente desde esta sección borra definitivamente sus casos, documentos y mensajes históricos.
        </p>
        <p className="text-sm text-amber-900">Restauralo si necesitás retomar el expediente antes de volver a trabajar.</p>
      </Card>

      <Card className="p-0">
        {isLoading ? (
          <div className="space-y-2 p-6">
            <div className="h-12 w-full animate-pulse rounded-xl bg-muted" />
            <div className="h-12 w-full animate-pulse rounded-xl bg-muted" />
          </div>
        ) : archivedClients.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            No hay clientes archivados. Cuando muevas uno desde el panel principal se listará aquí.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-separate border-spacing-y-1 text-sm">
              <thead>
                <tr className="text-left text-xs font-semibold uppercase text-muted-foreground">
                  <th className="px-4 py-2">Cliente</th>
                  <th className="px-4 py-2">Correo</th>
                  <th className="px-4 py-2">Archivado</th>
                  <th className="px-4 py-2 text-center">Expedientes</th>
                  <th className="px-4 py-2 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {archivedClients.map((client: any) => (
                  <tr
                    key={client.user_id || client.id}
                    className="rounded-xl border border-transparent bg-card text-foreground transition hover:border-primary/40 hover:bg-muted/40"
                  >
                    <td className="px-4 py-2 font-semibold">{client.name}</td>
                    <td className="px-4 py-2 text-muted-foreground">{client.email}</td>
                    <td className="px-4 py-2 text-xs uppercase tracking-wide text-muted-foreground">
                      {client.archived_at ? new Date(client.archived_at).toLocaleDateString("es-AR") : "N/D"}
                    </td>
                    <td className="px-4 py-2 text-center">
                      <Badge variant="secondary" className="gap-1">
                        <Briefcase className="h-3.5 w-3.5" />
                        {client.case_count ?? 0} casos
                      </Badge>
                    </td>
                    <td className="space-x-2 px-4 py-2 text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="gap-2 text-emerald-700 hover:text-emerald-700"
                        disabled={busyId === (client.user_id || client.id)}
                        onClick={() => handleRestore(client.user_id || client.id, client.name)}
                      >
                        {busyId === (client.user_id || client.id) && busyAction === "restore" ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            Restaurando
                          </>
                        ) : (
                          <>
                            <ArchiveRestore className="h-3.5 w-3.5" />
                            Restaurar
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="gap-2"
                        disabled={busyId === (client.user_id || client.id)}
                        onClick={() => handleDelete(client.user_id || client.id, client.name)}
                      >
                        {busyId === (client.user_id || client.id) && busyAction === "delete" ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            Eliminando
                          </>
                        ) : (
                          <>
                            <Trash2 className="h-3.5 w-3.5" />
                            Eliminar
                          </>
                        )}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
