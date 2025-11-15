import { type NextRequest, NextResponse } from "next/server"
import { sql, logActivity } from "@/lib/db"
import { requireRole } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    await requireRole(["admin"])

    const { searchParams } = new URL(request.url)
    const role = searchParams.get("role")

    let query = "SELECT * FROM users WHERE 1=1"
    const params: any[] = []

    if (role) {
      query += ` AND role = $${params.length + 1}`
      params.push(role)
    }

    query += " ORDER BY created_at DESC"

    const users = await sql.query(query, params)

    return NextResponse.json({ users })
  } catch (error) {
    console.error("[v0] Failed to fetch users:", error)
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireRole(["admin"])

    const body = await request.json()
    const { email, name, role, phone, country_of_origin } = body

    if (!email || !name || !role) {
      return NextResponse.json({ error: "Email, name, and role are required" }, { status: 400 })
    }

    // Generate user ID
    const userId = `${role}-${Date.now()}`

    const result = await sql`
      INSERT INTO users (id, email, name, role, phone, country_of_origin)
      VALUES (${userId}, ${email}, ${name}, ${role}, ${phone || null}, ${country_of_origin || null})
      RETURNING *
    `

    const newUser = result[0]

    // If creating a client, also create client record
    if (role === "client") {
      await sql`
        INSERT INTO clients (user_id, assigned_staff_id)
        VALUES (${userId}, ${admin.id})
      `
    }

    await logActivity(admin.id, "user_created", `Created new user: ${name}`)

    return NextResponse.json({ user: newUser }, { status: 201 })
  } catch (error) {
    console.error("[v0] Failed to create user:", error)
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 })
  }
}
