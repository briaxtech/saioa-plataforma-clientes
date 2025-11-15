import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Clock, FileText, XCircle } from "lucide-react"
import type { CaseStatus } from "@/lib/types"

type LegacyStatus = "active" | "review" | "closed"
type SupportedStatus = CaseStatus | LegacyStatus

const statusConfig: Record<
  SupportedStatus,
  { label: string; className: string; icon: typeof CheckCircle2 }
> = {
  pending: {
    label: "Pendiente",
    className: "bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400",
    icon: Clock,
  },
  in_progress: {
    label: "En progreso",
    className: "bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400",
    icon: Clock,
  },
  under_review: {
    label: "En revisión",
    className: "bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400",
    icon: FileText,
  },
  approved: {
    label: "Aprobado",
    className: "bg-green-500/10 text-green-600 dark:bg-green-500/20 dark:text-green-400",
    icon: CheckCircle2,
  },
  rejected: {
    label: "Rechazado",
    className: "bg-red-500/10 text-red-600 dark:bg-red-500/20 dark:text-red-400",
    icon: XCircle,
  },
  completed: {
    label: "Completado",
    className: "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300",
    icon: CheckCircle2,
  },
  active: {
    label: "Activo",
    className: "bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400",
    icon: Clock,
  },
  review: {
    label: "En revisión",
    className: "bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400",
    icon: FileText,
  },
  closed: {
    label: "Cerrado",
    className: "bg-gray-500/10 text-gray-600 dark:bg-gray-500/20 dark:text-gray-400",
    icon: CheckCircle2,
  },
}

interface CaseStatusBadgeProps {
  status: SupportedStatus | string
  showIcon?: boolean
}

export function CaseStatusBadge({ status, showIcon = true }: CaseStatusBadgeProps) {
  const fallbackKey: SupportedStatus = "pending"
  const resolvedKey = (status in statusConfig ? (status as SupportedStatus) : fallbackKey)
  const config = statusConfig[resolvedKey]
  const Icon = config.icon

  return (
    <Badge variant="outline" className={`${config.className} border-0`}>
      {showIcon && <Icon className="mr-1 h-3 w-3" />}
      {config.label}
    </Badge>
  )
}
