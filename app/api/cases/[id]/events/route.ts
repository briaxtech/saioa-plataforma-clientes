import { type NextRequest, NextResponse } from "next/server"
import { sql, logActivity } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user || (user.role !== "admin" && user.role !== "staff")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const caseRows = await sql`
      SELECT id
      FROM cases
      WHERE id = ${id} AND organization_id = ${user.organization_id}
    `
    if (caseRows.length === 0) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 })
    }
    const body = await request.json()
    const { title, type, description, occurred_at, attachments, metadata } = body

    if (!title || !type) {
      return NextResponse.json({ error: "Debes indicar titulo y tipo del evento." }, { status: 400 })
    }

    const occurredAt = occurred_at ? new Date(occurred_at) : new Date()

    const [event] = await sql`
      INSERT INTO case_events (organization_id, case_id, type, title, description, occurred_at, created_by, attachments, metadata)
      VALUES (
        ${user.organization_id},
        ${id},
        ${type},
        ${title},
        ${description || null},
        ${occurredAt},
        ${user.id},
        ${attachments ? JSON.stringify(attachments) : "[]"},
        ${metadata ? JSON.stringify(metadata) : null}
      )
      RETURNING *
    `

    await logActivity(
      user.organization_id,
      user.id,
      "case_event_created",
      `Registraste "${title}" en la linea de tiempo`,
      Number(id),
      {
        event_id: event.id,
        type,
      },
    )

    const parseJson = (value: any, fallback: any) => {
      if (!value) return fallback
      if (typeof value === "object") return value
      try {
        return JSON.parse(value)
      } catch {
        return fallback
      }
    }

    return NextResponse.json({
      event: {
        ...event,
        author_name: user.name,
        attachments: parseJson(event.attachments, []),
        metadata: parseJson(event.metadata, {}),
      },
    })
  } catch (error) {
    console.error("[v0] Failed to create case event:", error)
    return NextResponse.json({ error: "No pudimos registrar el evento" }, { status: 500 })
  }
}
