"use client"

import { CasesList } from "@/components/admin/cases-list"
import { StatsOverview } from "@/components/admin/stats-overview"
import { RecentActivity } from "@/components/admin/recent-activity"
import useSWR from "swr"
import { api } from "@/lib/api-client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"
import { useAuth } from "@/lib/auth-context"

const DEFAULT_APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "Tu agencia"

export default function AdminDashboard() {
  const { data: statsData } = useSWR("/api/stats", () => api.getStats())
  const { data: activityData } = useSWR("/api/activity?limit=10", () => api.getActivity({ limit: 10 }))
  const { organization } = useAuth()
  const workspaceName = organization?.name || DEFAULT_APP_NAME

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Panel {workspaceName}</h1>
          <p className="mt-2 text-muted-foreground">
            Bienvenido de nuevo, aquí tienes el resumen actualizado de los expedientes de {workspaceName}.
          </p>
        </div>
      </div>

      <StatsOverview stats={statsData?.stats} />

      <Card className="p-6">
        <Tabs defaultValue="cases" className="space-y-6">
          <TabsList className="w-full justify-start rounded-2xl bg-muted p-1">
            <TabsTrigger value="cases" className="flex-1 rounded-xl">
              Casos activos
            </TabsTrigger>
            <TabsTrigger value="activity" className="flex-1 rounded-xl">
              Actividad reciente
            </TabsTrigger>
          </TabsList>

          <TabsContent
            value="cases"
            className="mt-4 focus-visible:ring-0 focus-visible:ring-offset-0 data-[state=inactive]:hidden"
          >
            <CasesList variant="plain" />
          </TabsContent>
          <TabsContent
            value="activity"
            className="mt-4 focus-visible:ring-0 focus-visible:ring-offset-0 data-[state=inactive]:hidden"
          >
            <RecentActivity activities={activityData?.activities} variant="plain" />
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  )
}
