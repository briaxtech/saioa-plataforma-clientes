import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

export async function POST() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await sql`
      UPDATE notifications
      SET is_read = true
      WHERE user_id = ${user.id} AND is_read = false
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Failed to mark all notifications as read:", error)
    return NextResponse.json({ error: "Failed to mark all notifications as read" }, { status: 500 })
  }
}
