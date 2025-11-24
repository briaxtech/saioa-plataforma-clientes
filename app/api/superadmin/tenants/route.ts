import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { verifySuperToken, getBearerToken } from "@/lib/superadmin-auth"

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
}

export async function PATCH(request: NextRequest) {
  try {
    const token = getBearerToken(request)
    const payload = await verifySuperToken(token || "")
    if (!payload || payload.role !== "superadmin") return unauthorized()

    const { id, action } = await request.json().catch(() => ({}))
    if (!id || !action) return NextResponse.json({ error: "id y action requeridos" }, { status: 400 })
    if (!["suspend", "activate"].includes(action)) return NextResponse.json({ error: "action invalida" }, { status: 400 })

    const isActive = action === "activate"
    await sql`UPDATE organizations SET is_active = ${isActive} WHERE id = ${id}`

    return NextResponse.json({ ok: true, id, is_active: isActive })
  } catch (error) {
    console.error("[superadmin/tenants/status]", error)
    return NextResponse.json({ error: "No se pudo actualizar el estado" }, { status: 500 })
  }
}
