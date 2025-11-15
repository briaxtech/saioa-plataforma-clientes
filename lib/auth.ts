import { cookies } from "next/headers"
import { sql } from "./db"
import type { User } from "./types"

export async function getCurrentUser(): Promise<User | null> {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get("user_id")?.value

    if (!userId) {
      return null
    }

    const users = await sql`
      SELECT * FROM users WHERE id = ${userId}
    `

    return (users[0] as User) || null
  } catch (error) {
    console.error("[v0] Failed to get current user:", error)
    return null
  }
}

export async function setUserSession(userId: string) {
  const cookieStore = await cookies()
  cookieStore.set("user_id", userId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 1 week
  })
}

export async function clearUserSession() {
  const cookieStore = await cookies()
  cookieStore.delete("user_id")
}

export async function requireAuth() {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error("Unauthorized")
  }
  return user
}

export async function requireRole(allowedRoles: User["role"][]) {
  const user = await requireAuth()
  if (!allowedRoles.includes(user.role)) {
    throw new Error("Forbidden")
  }
  return user
}
