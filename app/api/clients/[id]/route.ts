import { type NextRequest, NextResponse } from "next/server"
import { sql, logActivity } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user || (user.role !== "admin" && user.role !== "staff")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const clients = await sql`
      SELECT 
        c.*,
        u.*,
        staff.name as staff_name
      FROM clients c
      JOIN users u ON c.user_id = u.id
      LEFT JOIN users staff ON c.assigned_staff_id = staff.id
      WHERE u.id = ${id} AND c.organization_id = ${user.organization_id}
    `

    if (clients.length === 0) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 })
    }

    const client = clients[0]

    const cases = await sql`
      SELECT 
        c.*,
        staff.name AS assigned_staff_name,
        staff.email AS assigned_staff_email
      FROM cases c
      LEFT JOIN users staff ON c.assigned_staff_id = staff.id
      WHERE c.client_id = ${id} AND c.organization_id = ${user.organization_id}
      ORDER BY c.created_at DESC
    `

    const casesWithRelations = []
    for (const caseItem of cases) {
      const documents = await sql`
        SELECT *
        FROM documents
        WHERE case_id = ${caseItem.id} AND organization_id = ${user.organization_id}
        ORDER BY created_at DESC
      `

      const milestones = await sql`
        SELECT *
        FROM case_milestones
        WHERE case_id = ${caseItem.id} AND organization_id = ${user.organization_id}
        ORDER BY order_index ASC
      `

      casesWithRelations.push({ ...caseItem, documents, milestones })
    }

    return NextResponse.json({
      client: { ...client, cases: casesWithRelations },
    })
  } catch (error) {
    console.error("[v0] Failed to fetch client:", error)
    return NextResponse.json({ error: "Failed to fetch client" }, { status: 500 })
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

    const hasArchivedUpdate = Object.prototype.hasOwnProperty.call(body, "archived")
    const hasNotesUpdate = Object.prototype.hasOwnProperty.call(body, "notes")

    if (!hasArchivedUpdate && !hasNotesUpdate) {
      return NextResponse.json({ error: "Debes indicar algún cambio para el cliente." }, { status: 400 })
    }

    if (hasArchivedUpdate && typeof body.archived !== "boolean") {
      return NextResponse.json({ error: "Debe indicar si el cliente se archiva o se restaura." }, { status: 400 })
    }

    if (hasNotesUpdate && typeof body.notes !== "string" && body.notes !== null) {
      return NextResponse.json({ error: "Las notas deben ser texto o quedar vacías." }, { status: 400 })
    }

    const clients = await sql`
      SELECT c.*, u.name
      FROM clients c
      JOIN users u ON c.user_id = u.id
      WHERE u.id = ${id} AND c.organization_id = ${user.organization_id}
    `

    if (clients.length === 0) {
      return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 })
    }

    const archivedAt = hasArchivedUpdate ? (body.archived ? new Date() : null) : undefined
    const sanitizedNotes =
      hasNotesUpdate && typeof body.notes === "string"
        ? body.notes.trim() || null
        : hasNotesUpdate && body.notes === null
          ? null
          : undefined

    let updated
    if (hasArchivedUpdate && hasNotesUpdate) {
      updated = await sql`
        UPDATE clients
        SET archived_at = ${archivedAt}, notes = ${sanitizedNotes ?? null}, updated_at = NOW()
        WHERE user_id = ${id} AND organization_id = ${user.organization_id}
        RETURNING archived_at, notes
      `
    } else if (hasArchivedUpdate) {
      updated = await sql`
        UPDATE clients
        SET archived_at = ${archivedAt}, updated_at = NOW()
        WHERE user_id = ${id} AND organization_id = ${user.organization_id}
        RETURNING archived_at, notes
      `
    } else {
      updated = await sql`
        UPDATE clients
        SET notes = ${sanitizedNotes ?? null}, updated_at = NOW()
        WHERE user_id = ${id} AND organization_id = ${user.organization_id}
        RETURNING archived_at, notes
      `
    }

    if (hasArchivedUpdate) {
      await logActivity(
        user.organization_id,
        user.id,
        body.archived ? "client_archived" : "client_restored",
        `${body.archived ? "Archivaste" : "Restauraste"} al cliente ${clients[0].name}`,
      )
    }

    if (hasNotesUpdate) {
      await logActivity(user.organization_id, user.id, "client_notes_updated", `Actualizaste las notas de ${clients[0].name}`)
    }

    return NextResponse.json({
      archived_at: updated[0]?.archived_at ?? archivedAt ?? null,
      notes: updated[0]?.notes ?? sanitizedNotes ?? null,
    })
  } catch (error) {
    console.error("[v0] Failed to update client state:", error)
    return NextResponse.json({ error: "No se pudo actualizar el cliente" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Solo un administrador puede eliminar clientes" }, { status: 403 })
    }

    const { id } = await params

    const clients = await sql`
      SELECT c.*, u.name
      FROM clients c
      JOIN users u ON c.user_id = u.id
      WHERE u.id = ${id} AND c.organization_id = ${user.organization_id}
    `

    if (clients.length === 0) {
      return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 })
    }

    const client = clients[0]
    if (!client.archived_at) {
      return NextResponse.json({ error: "Primero debes mover el cliente al archivo." }, { status: 400 })
    }

    const cases = await sql`
      SELECT id FROM cases WHERE client_id = ${id} AND organization_id = ${user.organization_id}
    `

    for (const caseItem of cases) {
      await sql`DELETE FROM documents WHERE case_id = ${caseItem.id} AND organization_id = ${user.organization_id}`
      await sql`DELETE FROM case_key_date_reminders WHERE case_id = ${caseItem.id} AND organization_id = ${user.organization_id}`
      await sql`DELETE FROM case_key_dates WHERE case_id = ${caseItem.id} AND organization_id = ${user.organization_id}`
      await sql`DELETE FROM case_milestones WHERE case_id = ${caseItem.id} AND organization_id = ${user.organization_id}`
      await sql`DELETE FROM case_events WHERE case_id = ${caseItem.id} AND organization_id = ${user.organization_id}`
      await sql`DELETE FROM case_contacts WHERE case_id = ${caseItem.id} AND organization_id = ${user.organization_id}`
      await sql`DELETE FROM messages WHERE case_id = ${caseItem.id} AND organization_id = ${user.organization_id}`
      await sql`DELETE FROM notifications WHERE related_case_id = ${caseItem.id} AND organization_id = ${user.organization_id}`
      await sql`DELETE FROM activity_logs WHERE case_id = ${caseItem.id} AND organization_id = ${user.organization_id}`
    }

    await sql`DELETE FROM cases WHERE client_id = ${id} AND organization_id = ${user.organization_id}`
    await sql`DELETE FROM messages WHERE (sender_id = ${id} OR receiver_id = ${id}) AND organization_id = ${user.organization_id}`
    await sql`DELETE FROM notifications WHERE user_id = ${id} AND organization_id = ${user.organization_id}`
    await sql`DELETE FROM activity_logs WHERE user_id = ${id} AND organization_id = ${user.organization_id}`
    await sql`DELETE FROM clients WHERE user_id = ${id} AND organization_id = ${user.organization_id}`
    await sql`DELETE FROM users WHERE id = ${id} AND organization_id = ${user.organization_id}`

    await logActivity(user.organization_id, user.id, "client_deleted", `Eliminaste definitivamente a ${client.name}`)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Failed to delete client:", error)
    return NextResponse.json({ error: "No se pudo eliminar el cliente" }, { status: 500 })
  }
}
