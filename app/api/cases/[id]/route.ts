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
        staff.email as staff_email
      FROM cases c
      LEFT JOIN users client ON c.client_id = client.id
      LEFT JOIN users staff ON c.assigned_staff_id = staff.id
      WHERE c.id = ${id}
    `

    if (cases.length === 0) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 })
    }

    const caseData = cases[0]

    // Check access permissions
    if (user.role === "client" && caseData.client_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Fetch milestones
    const milestones = await sql`
      SELECT * FROM case_milestones
      WHERE case_id = ${id}
      ORDER BY order_index
    `

    return NextResponse.json({
      case: { ...caseData, milestones },
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
    ]

    for (const [key, value] of Object.entries(body)) {
      if (allowedFields.includes(key)) {
        updateFields.push(`${key} = $${paramIndex}`)
        updateValues.push(value)
        paramIndex++
      }
    }

    if (updateFields.length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 })
    }

    updateFields.push(`updated_at = NOW()`)

    const query = `
      UPDATE cases 
      SET ${updateFields.join(", ")}
      WHERE id = $${paramIndex}
      RETURNING *
    `
    updateValues.push(id)

    const result = await sql.query(query, updateValues)

    if (result.length === 0) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 })
    }

    await logActivity(user.id, "case_updated", `Updated case ${result[0].case_number}`, Number(id))

    return NextResponse.json({ case: result[0] })
  } catch (error) {
    console.error("[v0] Failed to update case:", error)
    return NextResponse.json({ error: "Failed to update case" }, { status: 500 })
  }
}
