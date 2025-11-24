import { type NextRequest, NextResponse } from "next/server"
import { sql, logActivity } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const cases = await sql`
      SELECT 
        c.*,
        client.name as client_name,
        client.email as client_email,
        client.phone as client_phone,
        client.country_of_origin,
        staff.name as staff_name,
        staff.email as staff_email,
        template.id as case_type_template_id,
        template.name as case_type_template_name,
        template.description as case_type_template_description,
        template.documents as case_type_template_documents,
        template.states as case_type_template_states,
        template.timeframe as case_type_template_timeframe
      FROM cases c
      LEFT JOIN users client ON c.client_id = client.id
      LEFT JOIN users staff ON c.assigned_staff_id = staff.id
      LEFT JOIN case_type_templates template 
        ON template.id = c.case_type_template_id
      WHERE c.id = ${id} AND c.organization_id = ${user.organization_id}
    `

    if (cases.length === 0) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 })
    }

    let caseData = cases[0]

    const normalizeJson = (value: any) => {
      if (!value) return []
      if (Array.isArray(value)) return value
      if (typeof value === "object") return value
      try {
        return JSON.parse(value)
      } catch {
        return []
      }
    }

    caseData.case_type_template_documents = normalizeJson(caseData.case_type_template_documents)
    caseData.case_type_template_states = normalizeJson(caseData.case_type_template_states)

    if (
      caseData.case_type_template_documents.length === 0 ||
      caseData.case_type_template_states.length === 0 ||
      !caseData.case_type_template_name
    ) {
      const fallbackTemplates = await sql`
        SELECT *
        FROM case_type_templates
        WHERE base_case_type = ${caseData.case_type} AND (organization_id = ${user.organization_id} OR organization_id IS NULL)
        ORDER BY created_at ASC
        LIMIT 1
      `
      if (fallbackTemplates.length > 0) {
        const fallback = fallbackTemplates[0]
        caseData = {
          ...caseData,
          case_type_template_id: caseData.case_type_template_id || fallback.id,
          case_type_template_name: caseData.case_type_template_name || fallback.name,
          case_type_template_description: caseData.case_type_template_description || fallback.description,
          case_type_template_documents:
            caseData.case_type_template_documents.length > 0
              ? caseData.case_type_template_documents
              : normalizeJson(fallback.documents),
          case_type_template_states:
            caseData.case_type_template_states.length > 0
              ? caseData.case_type_template_states
              : normalizeJson(fallback.states),
          case_type_template_timeframe: caseData.case_type_template_timeframe || fallback.timeframe,
        }
      }
    }

    // Check access permissions
    if (user.role === "client" && caseData.client_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Fetch milestones
    const milestonesRaw = await sql`
      SELECT * FROM case_milestones
      WHERE case_id = ${id} AND organization_id = ${user.organization_id}
      ORDER BY order_index
    `

    const parseJsonField = (value: any) => {
      if (!value) return null
      if (typeof value === "object") return value
      try {
        return JSON.parse(value)
      } catch {
        return null
      }
    }

    const milestones = milestonesRaw.map((stage: any) => ({
      ...stage,
      required_documents: parseJsonField(stage.required_documents) || [],
      subtasks: parseJsonField(stage.subtasks) || [],
    }))

    const eventsRaw = await sql`
      SELECT ce.*, u.name as author_name
      FROM case_events ce
      LEFT JOIN users u ON ce.created_by = u.id
      WHERE ce.case_id = ${id} AND ce.organization_id = ${user.organization_id}
      ORDER BY ce.occurred_at DESC, ce.id DESC
    `
    const events = eventsRaw.map((event: any) => ({
      ...event,
      attachments: parseJsonField(event.attachments) || [],
      metadata: parseJsonField(event.metadata) || {},
    }))

    const contacts = await sql`
      SELECT *
      FROM case_contacts
      WHERE case_id = ${id} AND organization_id = ${user.organization_id}
      ORDER BY created_at ASC
    `

    const keyDatesRaw = await sql`
      SELECT *
      FROM case_key_dates
      WHERE case_id = ${id} AND organization_id = ${user.organization_id}
      ORDER BY occurs_at ASC
    `

    const remindersRaw = await sql`
      SELECT *
      FROM case_key_date_reminders
      WHERE case_id = ${id} AND organization_id = ${user.organization_id}
    `

    const remindersByKeyDate = remindersRaw.reduce<Record<number, any>>((acc, reminder: any) => {
      if (reminder) {
        acc[reminder.key_date_id] = {
          ...reminder,
          send_to: parseJsonField(reminder.send_to) || [],
        }
      }
      return acc
    }, {})

    const keyDates = keyDatesRaw.map((entry: any) => ({
      ...entry,
      notify_emails: parseJsonField(entry.notify_emails) || [],
      reminder: remindersByKeyDate[entry.id] || null,
    }))

    return NextResponse.json({
      case: { ...caseData, milestones, events, contacts, key_dates: keyDates },
    })
  } catch (error) {
    console.error("[v0] Failed to fetch case:", error)
    return NextResponse.json({ error: "Failed to fetch case" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user || (user.role !== "admin" && user.role !== "staff")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    const updateFields: string[] = []
    const updateValues: any[] = []
    let paramIndex = 1

    const allowedFields = [
      "status",
      "priority",
      "title",
      "description",
      "filing_date",
      "deadline_date",
      "progress_percentage",
      "assigned_staff_id",
      "contact_name",
      "contact_email",
      "contact_phone",
      "internal_notes",
      "lifecycle_status",
    ]

    const lifecycleStatuses = new Set(["preparation", "submitted", "resolution", "completed"])

    for (const [key, value] of Object.entries(body)) {
      if (allowedFields.includes(key)) {
        if (key === "lifecycle_status" && !lifecycleStatuses.has(String(value))) {
          continue
        }
        updateFields.push(`${key} = $${paramIndex}`)
        updateValues.push(value)
        paramIndex++
      }
    }

    if (updateFields.length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 })
    }

    // updated_at sin parámetro adicional
    updateFields.push(`updated_at = NOW()`)

    // WHERE con id + organization_id
    const query = `
      UPDATE cases 
      SET ${updateFields.join(", ")}
      WHERE id = $${paramIndex} AND organization_id = $${paramIndex + 1}
      RETURNING *
    `

    // Añadimos id y organization_id como últimos parámetros
    updateValues.push(id, user.organization_id)

    const result = await sql.unsafe(query, updateValues)

    if (result.length === 0) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 })
    }

    await logActivity(
      user.organization_id,
      user.id,
      "case_updated",
      `Updated case ${result[0].case_number}`,
      Number(id),
    )

    return NextResponse.json({ case: result[0] })
  } catch (error) {
    console.error("Failed to update case:", error)
    return NextResponse.json({ error: "Failed to update case" }, { status: 500 })
  }
}
