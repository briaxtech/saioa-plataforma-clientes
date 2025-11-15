import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
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
      WHERE u.id = ${id}
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
      WHERE c.client_id = ${id}
      ORDER BY c.created_at DESC
    `

    const casesWithRelations = []
    for (const caseItem of cases) {
      const documents = await sql`
        SELECT * FROM documents
        WHERE case_id = ${caseItem.id}
        ORDER BY created_at DESC
      `

      const milestones = await sql`
        SELECT * FROM case_milestones
        WHERE case_id = ${caseItem.id}
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
