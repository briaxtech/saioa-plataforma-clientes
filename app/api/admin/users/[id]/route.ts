import { type NextRequest, NextResponse } from "next/server"
import { sql, logActivity } from "@/lib/db"
import { requireRole } from "@/lib/auth"

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireRole(["admin"])
    const { id } = await params
    const body = await request.json()

    const updateFields: string[] = []
    const updateValues: any[] = []
    let paramIndex = 1

    const allowedFields = ["name", "email", "phone", "role", "address", "country_of_origin"]

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
      UPDATE users 
      SET ${updateFields.join(", ")}
      WHERE id = $${paramIndex}
      RETURNING *
    `
    updateValues.push(id)

    const result = await sql.query(query, updateValues)

    if (result.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    await logActivity(admin.id, "user_updated", `Updated user: ${result[0].name}`)

    return NextResponse.json({ user: result[0] })
  } catch (error) {
    console.error("[v0] Failed to update user:", error)
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireRole(["admin"])
    const { id } = await params

    const users = await sql`SELECT * FROM users WHERE id = ${id}`

    if (users.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const user = users[0]

    await sql`DELETE FROM users WHERE id = ${id}`

    await logActivity(admin.id, "user_deleted", `Deleted user: ${user.name}`)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Failed to delete user:", error)
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 })
  }
}
