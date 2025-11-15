"use client"

import { Button } from "@/components/ui/button"
import { CasesList } from "@/components/admin/cases-list"
import { StatsOverview } from "@/components/admin/stats-overview"
import { RecentActivity } from "@/components/admin/recent-activity"
import useSWR from "swr"
import { api } from "@/lib/api-client"

export default function AdminDashboard() {
  const { data: statsData } = useSWR("/api/stats", () => api.getStats())
  const { data: activityData } = useSWR("/api/activity?limit=10", () => api.getActivity({ limit: 10 }))

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Panel Sentir Extranjero</h1>
          <p className="mt-2 text-muted-foreground">Bienvenido de nuevo, aqui tienes el resumen actualizado de los expedientes.</p>
        </div>
        <Button className="w-full bg-primary hover:bg-primary/90 md:w-auto">+ Nuevo caso</Button>
      </div>

      <StatsOverview stats={statsData?.stats} />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <CasesList />
        </div>

        <div>
          <RecentActivity activities={activityData?.activities} />
        </div>
      </div>
    </div>
  )
}
