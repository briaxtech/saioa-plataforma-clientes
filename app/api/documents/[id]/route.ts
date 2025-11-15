import { type NextRequest, NextResponse } from "next/server"
import { sql, logActivity, createNotification } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

const STATUS_MESSAGES: Record<string, string> = {
  approved: "fue verificado correctamente",
  rejected: "fue rechazado",
  requires_action: "requiere cambios",
  submitted: "se registró",
  pending: "se marcó como pendiente",
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user || (user.role !== "admin" && user.role !== "staff")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { status, review_notes, is_required } = body

    const updateParts: string[] = []
    const values: any[] = []

    if (status) {
      updateParts.push(`status = $${updateParts.length + 1}`)
      values.push(status)
    }

    if (typeof review_notes !== "undefined") {
      updateParts.push(`review_notes = $${updateParts.length + 1}`)
      values.push(review_notes || null)
    }

    if (typeof is_required !== "undefined") {
      updateParts.push(`is_required = $${updateParts.length + 1}`)
      values.push(Boolean(is_required))
    }

    if (updateParts.length === 0) {
      return NextResponse.json({ error: "No fields provided to update" }, { status: 400 })
    }

    updateParts.push(`updated_at = NOW()`)
    const query = `
      UPDATE documents
      SET ${updateParts.join(", ")}
      WHERE id = $${values.length + 1}
      RETURNING *
    `
    values.push(id)

    const result = await sql.query(query, values)

    if (result.length === 0) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    const document = result[0]

    const cases = await sql`
      SELECT c.*, client.id as client_id, client.name as client_name
      FROM cases c
      JOIN users client ON c.client_id = client.id
      WHERE c.id = ${document.case_id}
    `

    if (cases.length > 0 && status) {
      const caseData = cases[0]

      await logActivity(user.id, "document_status_updated", `Actualizaste ${document.name} a ${status}`, document.case_id)

      await createNotification(
        caseData.client_id,
        "Estado de documento actualizado",
        `Tu documento "${document.name}" ${STATUS_MESSAGES[status] || "fue actualizado"}.`,
        "document",
        document.case_id,
      )
    }

    return NextResponse.json({ document })
  } catch (error) {
    console.error("[v0] Failed to update document:", error)
    return NextResponse.json({ error: "Failed to update document" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    // Get document to check permissions
    const documents = await sql`
      SELECT d.*, c.client_id
      FROM documents d
      JOIN cases c ON d.case_id = c.id
      WHERE d.id = ${id}
    `

    if (documents.length === 0) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    const document = documents[0]

    // Check permissions
    if (user.role === "client" && document.client_id !== user.id && document.uploaded_by !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await sql`DELETE FROM documents WHERE id = ${id}`

    await logActivity(user.id, "document_deleted", `Deleted document: ${document.name}`, document.case_id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Failed to delete document:", error)
    return NextResponse.json({ error: "Failed to delete document" }, { status: 500 })
  }
}
