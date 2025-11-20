import { type NextRequest, NextResponse } from "next/server"
import { sql, logActivity } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

async function loadCase(caseId: string | number, organizationId: string) {
  const rows = await sql`
    SELECT id, client_id
    FROM cases
    WHERE id = ${caseId} AND organization_id = ${organizationId}
  `
  return rows.at(0)
}

const allowedFields = new Set(["full_name", "email", "phone", "role", "organization", "organization_name", "notes", "is_primary"])

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string; contactId: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user || (user.role !== "admin" && user.role !== "staff")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id, contactId } = await params
    const caseRow = await loadCase(id, user.organization_id)
    if (!caseRow) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 })
    }

    const body = await request.json()
    const updates: string[] = []
    const values: any[] = []
    let paramIndex = 1

    for (const [key, value] of Object.entries(body)) {
      if (!allowedFields.has(key)) continue
      const column = key === "organization" ? "organization_name" : key
      updates.push(`${column} = $${paramIndex}`)
      values.push(key === "full_name" || typeof value === "string" ? (value as string).trim() : value)
      paramIndex++
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 })
    }

    updates.push(`updated_at = NOW()`)

    const query = `
      UPDATE case_contacts
      SET ${updates.join(", ")}
      WHERE id = $${paramIndex} AND case_id = $${paramIndex + 1} AND organization_id = $${paramIndex + 2}
      RETURNING *
    `
    values.push(contactId, caseRow.id, user.organization_id)
    const result = await sql.unsafe(query, values)
    if (result.length === 0) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 })
    }

    await logActivity(
      user.organization_id,
      user.id,
      "case_contact_updated",
      `Actualizó ${result[0].full_name}`,
      Number(id),
      {
        contact_id: result[0].id,
      },
    )

    return NextResponse.json({
      contact: {
        ...result[0],
        organization: result[0].organization_name || null,
      },
    })
  } catch (error) {
    console.error("[v0] Failed to update contact:", error)
    return NextResponse.json({ error: "Failed to update contact" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string; contactId: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user || (user.role !== "admin" && user.role !== "staff")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id, contactId } = await params
    const caseRow = await loadCase(id, user.organization_id)
    if (!caseRow) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 })
    }

    const deleted = await sql`
      DELETE FROM case_contacts
      WHERE id = ${contactId} AND case_id = ${caseRow.id} AND organization_id = ${user.organization_id}
      RETURNING *
    `
    if (deleted.length === 0) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 })
    }

    await logActivity(
      user.organization_id,
      user.id,
      "case_contact_deleted",
      `Eliminó ${deleted[0].full_name}`,
      Number(id),
      {
        contact_id: deleted[0].id,
      },
    )

    return NextResponse.json({
      contact: {
        ...deleted[0],
        organization: deleted[0].organization_name || null,
      },
    })
  } catch (error) {
    console.error("[v0] Failed to delete contact:", error)
    return NextResponse.json({ error: "Failed to delete contact" }, { status: 500 })
  }
}
