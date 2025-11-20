import type { ReactNode } from "react"

import { Bell, Briefcase, FileCheck2, FileClock, FileText, MessageSquare, UserRound } from "lucide-react"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface RecentActivityProps {
  activities?: Array<{
    id: number
    action: string
    description?: string
    user_name?: string
    case_number?: string
    created_at: string
  }>
  variant?: "card" | "plain"
  className?: string
}

const typeIcons: Record<string, ReactNode> = {
  document_uploaded: <FileText className="h-4 w-4" />,
  document_approved: <FileCheck2 className="h-4 w-4" />,
  document_status_updated: <FileClock className="h-4 w-4" />,
  case_created: <Briefcase className="h-4 w-4" />,
  case_updated: <Bell className="h-4 w-4" />,
  message_sent: <MessageSquare className="h-4 w-4" />,
  user_created: <UserRound className="h-4 w-4" />,
  default: <Bell className="h-4 w-4" />,
}

export function RecentActivity({ activities, variant = "card", className }: RecentActivityProps) {
  const loadingState = (
    <div className="space-y-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="animate-pulse">
          <div className="h-12 rounded bg-muted" />
        </div>
      ))}
    </div>
  )

  const listContent = activities && (
    <div className="space-y-4">
      {activities.map((activity) => {
        const icon = typeIcons[activity.action] || typeIcons.default
        return (
          <div key={activity.id} className="flex gap-3">
            <div className="mt-1 rounded-full bg-muted p-2 text-primary">{icon}</div>
            <div className="min-w-0 flex-1">
              <p className="break-words text-sm text-foreground">
                {activity.description || activity.action}
                {activity.case_number && ` (${activity.case_number})`}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {new Date(activity.created_at).toLocaleDateString()} a las{" "}
                {new Date(activity.created_at).toLocaleTimeString()}
              </p>
            </div>
          </div>
        )
      })}

      {activities.length === 0 && (
        <div className="py-4 text-center text-sm text-muted-foreground">Sin actividad reciente</div>
      )}
    </div>
  )

  const content = (
    <>
      <h2 className="mb-6 text-lg font-semibold text-foreground">Actividad reciente</h2>
      {activities ? listContent : loadingState}
    </>
  )

  if (variant === "plain") {
    return <div className={className}>{content}</div>
  }

  return <Card className={cn("p-6", className)}>{content}</Card>
}
