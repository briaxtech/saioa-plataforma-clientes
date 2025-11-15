import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    // Mark message as read
    const result = await sql`
      UPDATE messages
      SET status = 'read', read_at = NOW()
      WHERE id = ${id} AND receiver_id = ${user.id}
      RETURNING *
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 })
    }

    return NextResponse.json({ message: result[0] })
  } catch (error) {
    console.error("[v0] Failed to update message:", error)
    return NextResponse.json({ error: "Failed to update message" }, { status: 500 })
  }
}
