"use client"

import Link from "next/link"
import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import useSWR from "swr"
import { api } from "@/lib/api-client"
import { CaseStatusBadge } from "@/components/case-status-badge"
import { PriorityBadge } from "@/components/priority-badge"

export function CasesList() {
  const [searchTerm, setSearchTerm] = useState("")

  const { data, isLoading } = useSWR("/api/cases", () => api.getCases())
  const cases = data?.cases || []

  const filteredCases = cases.filter((c: any) => {
    const search = searchTerm.toLowerCase()
    return (
      c.case_number.toLowerCase().includes(search) ||
      c.client_name?.toLowerCase().includes(search) ||
      c.title.toLowerCase().includes(search)
    )
  })

  return (
    <Card className="p-6">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold text-foreground">Casos activos</h2>
        <Button variant="outline" className="w-full sm:w-auto">
          Exportar
        </Button>
      </div>

      <Input
        placeholder="Buscar por numero de caso o nombre del cliente..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="mb-6"
      />

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse rounded-lg border border-border p-4">
              <div className="h-20 rounded bg-muted" />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredCases.map((caseItem: any) => (
            <Link
              href={`/admin/cases/${caseItem.id}`}
              key={caseItem.id}
              className="block rounded-2xl border border-border p-4 transition hover:border-primary/40 hover:bg-muted/40"
            >
              <div className="mb-3 flex items-start justify-between">
                <div>
                  <div className="mb-1 flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-foreground">{caseItem.client_name}</h3>
                    <CaseStatusBadge status={caseItem.status} />
                  </div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {caseItem.case_number}
                  </p>
                </div>
                <PriorityBadge priority={caseItem.priority} />
              </div>

              <div className="space-y-3">
                <div className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">{caseItem.title}</span>
                </div>

                <div>
                  <div className="mb-2 flex justify-between">
                    <span className="text-xs text-muted-foreground">Progreso</span>
                    <span className="text-xs font-medium text-foreground">{caseItem.progress_percentage}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${caseItem.progress_percentage}%` }}
                    />
                  </div>
                </div>

                {caseItem.deadline_date && (
                  <p className="text-xs text-muted-foreground">
                    Proximo vencimiento:{" "}
                    <span className="font-medium text-foreground">
                      {new Date(caseItem.deadline_date).toLocaleDateString()}
                    </span>
                  </p>
                )}
              </div>
            </Link>
          ))}

          {filteredCases.length === 0 && !isLoading && (
            <div className="py-8 text-center text-muted-foreground">No se encontraron casos</div>
          )}
        </div>
      )}
    </Card>
  )
}
