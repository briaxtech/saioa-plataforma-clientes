import { Badge } from "@/components/ui/badge"
import { ArrowUp, ArrowDown, Minus, AlertTriangle } from "lucide-react"

type Priority = "low" | "medium" | "high" | "urgent"

interface PriorityBadgeProps {
  priority: Priority | string
  showIcon?: boolean
}

const priorityConfig: Record<
  Priority,
  { label: string; className: string; icon: typeof ArrowUp }
> = {
  low: {
    label: "Baja",
    className: "bg-green-500/10 text-green-600 dark:bg-green-500/20 dark:text-green-400",
    icon: ArrowDown,
  },
  medium: {
    label: "Media",
    className: "bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400",
    icon: Minus,
  },
  high: {
    label: "Alta",
    className: "bg-red-500/10 text-red-600 dark:bg-red-500/20 dark:text-red-400",
    icon: ArrowUp,
  },
  urgent: {
    label: "Urgente",
    className: "bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-300",
    icon: AlertTriangle,
  },
}

export function PriorityBadge({ priority, showIcon = true }: PriorityBadgeProps) {
  const fallbackKey: Priority = "medium"
  const resolvedKey = (priority in priorityConfig ? (priority as Priority) : fallbackKey)
  const config = priorityConfig[resolvedKey]
  const Icon = config.icon

  return (
    <Badge variant="outline" className={`${config.className} border-0`}>
      {showIcon && <Icon className="mr-1 h-3 w-3" />}
      {config.label}
    </Badge>
  )
}
