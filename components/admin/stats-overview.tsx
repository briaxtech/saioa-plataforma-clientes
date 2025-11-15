import type { ReactNode } from "react"

import { Activity, Briefcase, FileWarning, UserRound } from "lucide-react"
import { Card } from "@/components/ui/card"

interface StatsOverviewProps {
  stats?: {
    totalCases: number
    activeCases: number
    totalClients: number
    pendingDocuments: number
  }
}

interface DisplayStat {
  label: string
  value: string
  icon: ReactNode
  highlight?: boolean
}

export function StatsOverview({ stats }: StatsOverviewProps) {
  if (!stats) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse p-6">
            <div className="h-20 rounded bg-muted" />
          </Card>
        ))}
      </div>
    )
  }

  const displayStats: DisplayStat[] = [
    {
      label: "Casos totales",
      value: stats.totalCases.toString(),
      icon: <Briefcase className="h-6 w-6 text-primary" />,
    },
    {
      label: "Casos activos",
      value: stats.activeCases.toString(),
      icon: <Activity className="h-6 w-6 text-primary" />,
    },
    {
      label: "Clientes totales",
      value: stats.totalClients.toString(),
      icon: <UserRound className="h-6 w-6 text-primary" />,
    },
    {
      label: "Documentos pendientes",
      value: stats.pendingDocuments.toString(),
      icon: <FileWarning className="h-6 w-6 text-amber-500" />,
      highlight: stats.pendingDocuments > 0,
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      {displayStats.map((stat) => (
        <Card
          key={stat.label}
          className={`p-6 ${stat.highlight ? "border-amber-200/60 bg-amber-50/60 dark:border-amber-500/30 dark:bg-amber-500/10" : ""}`}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
              <p className="mt-2 text-3xl font-bold text-foreground">{stat.value}</p>
            </div>
            <span className="rounded-full bg-muted p-3 text-foreground">{stat.icon}</span>
          </div>
        </Card>
      ))}
    </div>
  )
}
