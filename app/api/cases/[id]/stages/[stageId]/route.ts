import { type NextRequest, NextResponse } from "next/server"
import { sql, logActivity } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

const STAGE_STATUSES = new Set(["pending", "in_progress", "completed", "blocked"])

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string; stageId: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user || (user.role !== "admin" && user.role !== "staff")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id, stageId } = await params
    const body = await request.json()

    const allowedFields = [
      "title",
      "description",
      "due_date",
      "status",
      "assigned_staff_id",
      "notes",
      "required_documents",
      "subtasks",
    ]

    const updates: string[] = []
    const values: any[] = []
    let index = 1

    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(body, field)) {
        let value = body[field]
        if (field === "status") {
          if (!STAGE_STATUSES.has(String(value))) {
            continue
          }
        }

        if (field === "required_documents" || field === "subtasks") {
          value = value ? JSON.stringify(value) : null
        }

        updates.push(`${field} = $${index}`)
        values.push(value)
        index++
      }
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: "No hay datos para actualizar" }, { status: 400 })
    }

    let completedStatusClause = ""
    if (body.status) {
      if (body.status === "completed") {
        completedStatusClause = ", completed = TRUE, completed_at = COALESCE(completed_at, NOW())"
      } else {
        completedStatusClause = ", completed = FALSE, completed_at = NULL"
      }
    }

    const query = `
      UPDATE case_milestones
      SET ${updates.join(", ")}${completedStatusClause}
      WHERE id = $${index} AND case_id = $${index + 1} AND organization_id = $${index + 2}
      RETURNING *
    `

    values.push(stageId, id, user.organization_id)

    const result = await sql.unsafe(query, values)
    if (result.length === 0) {
      return NextResponse.json({ error: "Stage not found" }, { status: 404 })
    }

    const updatedStage = result[0]
    const parseJsonField = (value: any) => {
      if (!value) return []
      if (typeof value === "object") return value
      try {
        return JSON.parse(value)
      } catch {
        return []
      }
    }
    const stageResponse = {
      ...updatedStage,
      required_documents: parseJsonField(updatedStage.required_documents),
      subtasks: parseJsonField(updatedStage.subtasks),
    }
    await logActivity(user.organization_id, user.id, "case_stage_updated", `Actualizaste la etapa "${updatedStage.title}"`, Number(id), {
      stage_id: updatedStage.id,
      status: updatedStage.status,
    })

    return NextResponse.json({ stage: stageResponse })
  } catch (error) {
    console.error("[v0] Failed to update case stage:", error)
    return NextResponse.json({ error: "No pudimos actualizar la etapa" }, { status: 500 })
  }
}
