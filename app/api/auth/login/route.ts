import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { setUserSession } from "@/lib/auth"

const emailAliases: Record<string, string> = {
  "admin@sentirextranjero.com": "admin@legalcase.com",
  "ana.garcia@email.com": "john.doe@email.com",
  "carlos.ramirez@email.com": "sarah.chen@email.com",
  "fatima.ali@email.com": "ahmed.hassan@email.com",
  "valentina.gomez@email.com": "maria.silva@email.com",
}

async function findUserByEmail(email: string) {
  const users = await sql`
    SELECT * FROM users WHERE LOWER(email) = ${email.toLowerCase()}
  `
  return users[0]
}

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    // For demo purposes, we'll use simple email-based authentication
    // In production, you should use proper password hashing
    const normalizedEmail = String(email).trim().toLowerCase()
    let user = await findUserByEmail(normalizedEmail)

    if (!user) {
      const aliasEmail = emailAliases[normalizedEmail]
      if (aliasEmail) {
        user = await findUserByEmail(aliasEmail)
      }
    }

    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // Set session
    await setUserSession(user.id)

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    })
  } catch (error) {
    console.error("[v0] Login error:", error)
    return NextResponse.json({ error: "Failed to login" }, { status: 500 })
  }
}
