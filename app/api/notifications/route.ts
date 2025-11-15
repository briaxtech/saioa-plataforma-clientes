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
    const unreadOnly = searchParams.get("unread_only") === "true"

    let query = `
      SELECT * FROM notifications
      WHERE user_id = $1
    `

    const params: any[] = [user.id]

    if (unreadOnly) {
      query += " AND is_read = false"
    }

    query += " ORDER BY created_at DESC LIMIT 50"

    const notifications = await sql.query(query, params)

    return NextResponse.json({ notifications })
  } catch (error) {
    console.error("[v0] Failed to fetch notifications:", error)
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 })
  }
}
