import { randomBytes } from "crypto"
import { type NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { sql, logActivity } from "@/lib/db"
import { requireRole } from "@/lib/auth"

const generateTemporaryPassword = (length = 12) => {
  const charset = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*"
  const bytes = randomBytes(length)
  let password = ""
  for (let i = 0; i < length; i++) {
    password += charset[bytes[i] % charset.length]
  }
  return password
}

export async function GET(request: NextRequest) {
  try {
    const admin = await requireRole(["admin"])

    const { searchParams } = new URL(request.url)
    const role = searchParams.get("role")

    let query = "SELECT * FROM users WHERE organization_id = $1"
    const params: any[] = [admin.organization_id]

    if (role) {
      query += ` AND role = $${params.length + 1}`
      params.push(role)
    }

    query += " ORDER BY created_at DESC"

    const users = await sql.unsafe(query, params)

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
    const { email, name, role, phone, country_of_origin, password } = body

    if (!email || !name || !role) {
      return NextResponse.json({ error: "Email, name, and role are required" }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase()
    const existing = await sql`
      SELECT id FROM users WHERE email = ${normalizedEmail} AND organization_id = ${admin.organization_id}
    `
    if (existing.length > 0) {
      return NextResponse.json({ error: "Email already in use" }, { status: 409 })
    }

    const userId = `${role}-${Date.now()}`
    const temporaryPassword = password && typeof password === "string" ? password : generateTemporaryPassword()
    const passwordHash = await bcrypt.hash(temporaryPassword, 12)

    const result = await sql`
      INSERT INTO users (id, organization_id, email, name, role, phone, country_of_origin, password_hash)
      VALUES (${userId}, ${admin.organization_id}, ${normalizedEmail}, ${name}, ${role}, ${phone || null}, ${country_of_origin || null}, ${passwordHash})
      RETURNING *
    `

    const newUser = result[0]

    if (role === "client") {
      await sql`
        INSERT INTO clients (organization_id, user_id, assigned_staff_id)
        VALUES (${admin.organization_id}, ${userId}, ${admin.id})
      `
    }

    await logActivity(admin.organization_id, admin.id, "user_created", `Created new user: ${name}`)

    return NextResponse.json(
      { user: newUser, temporary_password: password ? undefined : temporaryPassword },
      { status: 201 },
    )
  } catch (error) {
    console.error("[v0] Failed to create user:", error)
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 })
  }
}
