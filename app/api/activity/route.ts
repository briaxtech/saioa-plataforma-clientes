import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const caseId = searchParams.get("case_id")
    const limit = Number.parseInt(searchParams.get("limit") || "20")

    let query = `
      SELECT 
        a.*,
        u.name as user_name,
        c.case_number
      FROM activity_logs a
      LEFT JOIN users u ON a.user_id = u.id
      LEFT JOIN cases c ON a.case_id = c.id
      WHERE 1=1
    `

    const params: any[] = []

    if (user.role === "client") {
      // Client can only see their own case activities
      query += ` AND a.case_id IN (
        SELECT id FROM cases WHERE client_id = $${params.length + 1}
      )`
      params.push(user.id)
    }

    if (caseId) {
      query += ` AND a.case_id = $${params.length + 1}`
      params.push(caseId)
    }

    query += ` ORDER BY a.created_at DESC LIMIT $${params.length + 1}`
    params.push(limit)

    const activities = await sql.query(query, params)

    return NextResponse.json({ activities })
  } catch (error) {
    console.error("[v0] Failed to fetch activity logs:", error)
    return NextResponse.json({ error: "Failed to fetch activity logs" }, { status: 500 })
  }
}
