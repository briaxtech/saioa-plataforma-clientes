import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

const parseArray = (value: any) => {
  if (Array.isArray(value)) return value
  if (typeof value === "string") {
    try {
      return JSON.parse(value)
    } catch {
      return []
    }
  }
  return value || []
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user || (user.role !== "admin" && user.role !== "staff")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { name, description, documents, states, timeframe, base_case_type } = body

    const existing = await sql`
      UPDATE case_type_templates
      SET
        name = COALESCE(${name}, name),
        description = COALESCE(${description}, description),
        documents =
          CASE WHEN ${documents !== undefined}
            THEN ${documents !== undefined ? JSON.stringify(documents) : null}::jsonb
            ELSE documents
          END,
        states =
          CASE WHEN ${states !== undefined}
            THEN ${states !== undefined ? JSON.stringify(states) : null}::jsonb
            ELSE states
          END,
        timeframe = COALESCE(${timeframe}, timeframe),
        base_case_type = COALESCE(${base_case_type}, base_case_type),
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `

    if (existing.length === 0) {
      return NextResponse.json({ error: "Case type not found" }, { status: 404 })
    }

    const template = existing[0]
    return NextResponse.json({
      caseType: {
        ...template,
        documents: parseArray(template.documents),
        states: parseArray(template.states),
      },
    })
  } catch (error) {
    console.error("[v0] Failed to update case type:", error)
    return NextResponse.json({ error: "Failed to update case type" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user || (user.role !== "admin" && user.role !== "staff")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    await sql`DELETE FROM case_type_templates WHERE id = ${id}`

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Failed to delete case type:", error)
    return NextResponse.json({ error: "Failed to delete case type" }, { status: 500 })
  }
}
