import { type NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { sql, logActivity } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

const isValidPassword = (value: string) => {
  if (!value || value.length < 8) return false
  const hasLetter = /[A-Za-z]/.test(value)
  const hasNumber = /\d/.test(value)
  return hasLetter && hasNumber
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { currentPassword, newPassword } = await request.json()

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "Debes completar ambos campos" }, { status: 400 })
    }

    if (!isValidPassword(newPassword)) {
      return NextResponse.json(
        { error: "La nueva contraseña debe tener al menos 8 caracteres, con letras y números." },
        { status: 400 },
      )
    }

    const rows = await sql`
      SELECT password_hash FROM users WHERE id = ${user.id}
    `

    const passwordHash = rows[0]?.password_hash
    if (!passwordHash) {
      return NextResponse.json({ error: "Todavía no hay una contraseña configurada para este usuario." }, { status: 400 })
    }

    const isMatch = await bcrypt.compare(currentPassword, passwordHash)
    if (!isMatch) {
      return NextResponse.json({ error: "La contraseña actual no es correcta." }, { status: 401 })
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12)

    await sql`
      UPDATE users
      SET password_hash = ${hashedPassword}, updated_at = NOW()
      WHERE id = ${user.id}
    `

    await logActivity(user.organization_id, user.id, "password_updated", "Actualizaste tu contraseña desde el portal")

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Failed to update password:", error)
    return NextResponse.json({ error: "No se pudo actualizar la contraseña." }, { status: 500 })
  }
}
