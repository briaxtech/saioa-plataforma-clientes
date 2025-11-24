import { NextRequest, NextResponse } from "next/server"
import { getBearerToken, verifySuperToken } from "@/lib/superadmin-auth"

export function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
}

export async function requireSuperAdmin(request: NextRequest) {
  const token = getBearerToken(request)
  const payload = await verifySuperToken(token || "")
  if (!payload || payload.role !== "superadmin") {
    return unauthorized()
  }
  return payload
}
