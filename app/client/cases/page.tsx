"use client"

import { Card } from "@/components/ui/card"
import useSWR from "swr"
import { api } from "@/lib/api-client"
import { CaseStatusBadge } from "@/components/case-status-badge"

export default function ClientCasesPage() {
  const { data, isLoading } = useSWR("/api/cases", () => api.getCases())

  const cases = data?.cases || []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Mis casos</h1>
        <p className="text-muted-foreground mt-2">Supervisa el estado de tu caso migratorio</p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <Card key={i} className="p-6 animate-pulse">
              <div className="h-32 bg-muted rounded" />
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {cases.map((caseItem: any) => (
            <Card key={caseItem.id} className="p-6 hover:bg-muted/50 transition cursor-pointer">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">{caseItem.case_number}</h3>
                  <p className="text-sm text-muted-foreground mt-1 capitalize">
                    {caseItem.case_type?.replace("_", " ")}
                  </p>
                </div>
                <CaseStatusBadge status={caseItem.status} />
              </div>

              <p className="text-sm text-muted-foreground mb-4">{caseItem.title}</p>

              <div className="space-y-3">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-xs text-muted-foreground">Progreso del caso</span>
                    <span className="text-xs font-medium text-foreground">{caseItem.progress_percentage}%</span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${caseItem.progress_percentage}%` }}
                    />
                  </div>
                </div>

                {caseItem.filing_date && (
                  <p className="text-xs text-muted-foreground">
                    Presentado: {new Date(caseItem.filing_date).toLocaleDateString()}
                  </p>
                )}
              </div>
            </Card>
          ))}

          {cases.length === 0 && !isLoading && (
            <Card className="p-8">
              <div className="text-center text-muted-foreground">Todavía no tienes casos</div>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
