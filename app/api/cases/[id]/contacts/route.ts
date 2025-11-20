import { type NextRequest, NextResponse } from "next/server"
import { sql, logActivity } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

async function loadCase(caseId: string | number, organizationId: string) {
  const rows = await sql`
    SELECT id, client_id, title, case_number, assigned_staff_id
    FROM cases
    WHERE id = ${caseId} AND organization_id = ${organizationId}
  `
  return rows.at(0)
}

function normalizeString(value?: string | null) {
  return value?.trim() ? value.trim() : null
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const { id } = await params
    const caseRow = await loadCase(id, user.organization_id)
    if (!caseRow) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 })
    }
    if (user.role === "client" && caseRow.client_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    const contacts = await sql`
      SELECT *
      FROM case_contacts
      WHERE case_id = ${caseRow.id} AND organization_id = ${user.organization_id}
      ORDER BY created_at ASC
    `
    const normalized = contacts.map((contact: any) => ({
      ...contact,
      organization: contact.organization_name || null,
    }))
    return NextResponse.json({ contacts: normalized })
  } catch (error) {
    console.error("[v0] Failed to fetch contacts:", error)
    return NextResponse.json({ error: "Failed to fetch contacts" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user || (user.role !== "admin" && user.role !== "staff")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const { id } = await params
    const caseRow = await loadCase(id, user.organization_id)
    if (!caseRow) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 })
    }

    const body = await request.json()
    const fullName = normalizeString(body.full_name)
    if (!fullName) {
      return NextResponse.json({ error: "El nombre es obligatorio" }, { status: 400 })
    }

    const contact = await sql`
      INSERT INTO case_contacts (
        organization_id, case_id, full_name, email, phone, role, organization_name, notes, is_primary
      )
      VALUES (
        ${user.organization_id},
        ${caseRow.id},
        ${fullName},
        ${normalizeString(body.email)},
        ${normalizeString(body.phone)},
        ${normalizeString(body.role)},
        ${normalizeString(body.organization)},
        ${normalizeString(body.notes)},
        ${Boolean(body.is_primary)}
      )
      RETURNING *
    `

    const created = contact[0]
    await logActivity(user.organization_id, user.id, "case_contact_added", `Agregó ${created.full_name} como contacto`, caseRow.id, {
      contact_id: created.id,
    })

    return NextResponse.json(
      {
        contact: {
          ...created,
          organization: created.organization_name || null,
        },
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("[v0] Failed to create contact:", error)
    return NextResponse.json({ error: "Failed to create contact" }, { status: 500 })
  }
}
