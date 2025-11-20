import { type NextRequest, NextResponse } from "next/server"
import { sql, logActivity, createNotification } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || (user.role !== "admin" && user.role !== "staff")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { case_id, name, description, category } = body

    if (!case_id || !name) {
      return NextResponse.json({ error: "case_id and name are required" }, { status: 400 })
    }

    const cases = await sql`
      SELECT 
        c.id,
        c.case_number,
        c.client_id,
        client.name as client_name
      FROM cases c
      LEFT JOIN users client ON client.id = c.client_id
      WHERE c.id = ${case_id} AND c.organization_id = ${user.organization_id}
    `

    if (cases.length === 0) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 })
    }

    const caseData = cases[0]

    const result = await sql`
      INSERT INTO documents (
        organization_id, case_id, name, description, category, is_required, status
      )
      VALUES (
        ${user.organization_id}, ${case_id}, ${name}, ${description || null}, ${category || null}, TRUE, 'pending'
      )
      RETURNING *
    `

    const document = result[0]

    await logActivity(user.organization_id, user.id, "document_required", `Marcaste ${name} como requerido`, Number(case_id))

    await createNotification(
      user.organization_id,
      caseData.client_id,
      "Nuevo documento requerido",
      `${caseData.client_name || "Tu asesor"} necesita el documento "${name}" para el caso ${caseData.case_number}`,
      "document",
      Number(case_id),
    )

    return NextResponse.json({ document }, { status: 201 })
  } catch (error) {
    console.error("[v0] Failed to create document requirement:", error)
    return NextResponse.json({ error: "No se pudo crear el requerimiento" }, { status: 500 })
  }
}
