"use client"

import Link from "next/link"
import useSWR from "swr"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { api } from "@/lib/api-client"
import { useAuth } from "@/lib/auth-context"

const DEFAULT_APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "Tu agencia"

export default function ClientDashboard() {
  const { data: casesData } = useSWR("/api/cases", () => api.getCases())
  const { organization } = useAuth()
  const workspaceName = organization?.name || DEFAULT_APP_NAME

  const cases = casesData?.cases || []
  const mainCase = cases[0]

  if (!mainCase) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Bienvenido de nuevo a {workspaceName}</h1>
          <p className="mt-2 text-muted-foreground">Aquí encontraremos toda la información clave de tu trámite.</p>
        </div>
        <Card className="animate-pulse p-8">
          <div className="h-48 rounded bg-muted" />
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Bienvenido de nuevo a {workspaceName}</h1>
        <p className="mt-2 text-muted-foreground">Aquí verás el estado de tus gestiones y las acciones prioritarias.</p>
      </div>

      {/* Main Case Card */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 p-6 sm:p-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <div>
            <h2 className="mb-4 text-xl font-semibold text-foreground">Tu proceso en Espana</h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Numero de caso</p>
                <p className="font-semibold text-foreground">{mainCase.case_number}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tipo de caso</p>
                <p className="font-semibold capitalize text-foreground">{mainCase.case_type?.replace("_", " ")}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Estado actual</p>
                <p className="font-semibold capitalize text-primary">{mainCase.status?.replace("_", " ")}</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <p className="mb-2 text-sm text-muted-foreground">Progreso general</p>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-foreground">Avance</span>
                  <span className="text-sm font-bold text-primary">{mainCase.progress_percentage}%</span>
                </div>
                <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${mainCase.progress_percentage}%` }}
                  />
                </div>
              </div>
            </div>

            {mainCase.deadline_date && (
              <div className="pt-2">
                <p className="mb-1 text-sm text-muted-foreground">Proximo vencimiento</p>
                <p className="font-semibold text-foreground">{new Date(mainCase.deadline_date).toLocaleDateString()}</p>
              </div>
            )}

            <Link href={`/client/cases/${mainCase.id}`}>
              <Button className="mt-4 w-full bg-primary hover:bg-primary/90">Ver detalles completos</Button>
            </Link>
          </div>
        </div>
      </Card>

    </div>
  )
}
