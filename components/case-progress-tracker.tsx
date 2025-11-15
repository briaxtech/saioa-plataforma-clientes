import { CheckCircle2, Circle, Clock } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface ProgressStep {
  id: string
  title: string
  description: string
  status: "completed" | "current" | "upcoming"
  date?: string
}

interface CaseProgressTrackerProps {
  steps: ProgressStep[]
}

export function CaseProgressTracker({ steps }: CaseProgressTrackerProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Progreso del caso</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {steps.map((step, index) => (
            <div key={step.id} className="flex gap-4">
              {/* Timeline connector */}
              <div className="flex flex-col items-center">
                {step.status === "completed" ? (
                  <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-white" />
                  </div>
                ) : step.status === "current" ? (
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                    <Clock className="w-5 h-5 text-white" />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full border-2 border-muted flex items-center justify-center">
                    <Circle className="w-5 h-5 text-muted-foreground" />
                  </div>
                )}
                {index < steps.length - 1 && (
                  <div className={`w-0.5 h-12 ${step.status === "completed" ? "bg-green-500" : "bg-muted"}`} />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 pb-8">
                <h4 className="font-semibold mb-1">{step.title}</h4>
                <p className="text-sm text-muted-foreground mb-1">{step.description}</p>
                {step.date && <p className="text-xs text-muted-foreground">{step.date}</p>}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
