import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { verifySuperToken, getBearerToken } from "@/lib/superadmin-auth"

const SUPERADMIN_PATH = "/superadmin"
const LOGIN_PATH = "/superadmin/login"

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  if (!pathname.startsWith(SUPERADMIN_PATH)) return NextResponse.next()

  const isLogin = pathname.startsWith(LOGIN_PATH)
  const token = getBearerToken(request)
  const payload = token ? await verifySuperToken(token) : null

  if (!payload && !isLogin) {
    const url = new URL(LOGIN_PATH, request.url)
    return NextResponse.redirect(url)
  }

  if (payload && isLogin) {
    const url = new URL(SUPERADMIN_PATH, request.url)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/superadmin/:path*"],
}
