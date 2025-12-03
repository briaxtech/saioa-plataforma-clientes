import crypto from "crypto"
import bcrypt from "bcryptjs"
import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { signSuperToken, verifySuperToken, getBearerToken } from "@/lib/superadmin-auth"

const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

const PALETTE_PRESETS: Record<string, any> = {
  ocean: {
    palette: {
      primary: "#0891b2",
      primaryForeground: "#012a3a",
      accent: "#0ea5e9",
      accentForeground: "#012a3a",
      background: "#f3fbff",
      foreground: "#0b1a36",
      card: "#ffffff",
      cardForeground: "#0b1a36",
      sidebar: "#012a3a",
      sidebarForeground: "#eaf6ff",
      border: "#cfe6f6",
      muted: "#e0f2fe",
      mutedForeground: "#0f2d4a",
    },
    dark: {
      primary: "#38bdf8",
      primaryForeground: "#012a3a",
      accent: "#0ea5e9",
      accentForeground: "#012a3a",
      background: "#02131f",
      foreground: "#e8f5ff",
      card: "#0a1c2c",
      cardForeground: "#e8f5ff",
      sidebar: "#02131f",
      sidebarForeground: "#e8f5ff",
      border: "#0e2638",
      muted: "#0b1f30",
      mutedForeground: "#cde7ff",
    },
  },
  plum: {
    palette: {
      primary: "#9b5de5",
      primaryForeground: "#1f0b33",
      accent: "#f15bb5",
      accentForeground: "#1f0b33",
      background: "#fdf4ff",
      foreground: "#2b113f",
      card: "#ffffff",
      cardForeground: "#2b113f",
      sidebar: "#2b113f",
      sidebarForeground: "#fdf4ff",
      border: "#e9d8fd",
      muted: "#f3e8ff",
      mutedForeground: "#311047",
    },
    dark: {
      primary: "#c084fc",
      primaryForeground: "#1f0b33",
      accent: "#f472b6",
      accentForeground: "#1f0b33",
      background: "#130720",
      foreground: "#f5e9ff",
      card: "#1f1230",
      cardForeground: "#f5e9ff",
      sidebar: "#0f0818",
      sidebarForeground: "#f5e9ff",
      border: "#261431",
      muted: "#1c0f28",
      mutedForeground: "#e7d5ff",
    },
  },
  slate: {
    palette: {
      primary: "#0f172a",
      primaryForeground: "#e2e8f0",
      accent: "#475569",
      accentForeground: "#e2e8f0",
      background: "#f7f9fc",
      foreground: "#0f172a",
      card: "#ffffff",
      cardForeground: "#0f172a",
      sidebar: "#0f172a",
      sidebarForeground: "#e2e8f0",
      border: "#e2e8f0",
      muted: "#e2e8f0",
      mutedForeground: "#111827",
    },
    dark: {
      primary: "#1f2937",
      primaryForeground: "#e5e7eb",
      accent: "#334155",
      accentForeground: "#e5e7eb",
      background: "#020617",
      foreground: "#e5e7eb",
      card: "#0b1224",
      cardForeground: "#e5e7eb",
      sidebar: "#020617",
      sidebarForeground: "#e5e7eb",
      border: "#111827",
      muted: "#0f172a",
      mutedForeground: "#e5e7eb",
    },
  },
}

async function ensureSlug(name: string) {
  const base = slugify(name) || "tenant"
  let slug = base
  let attempts = 0
  while (true) {
    const rows = await sql`SELECT id FROM organizations WHERE slug = ${slug} LIMIT 1`
    if (rows.length === 0) return slug
    attempts += 1
    slug = `${base}-${attempts + 1}`
  }
}

function validatePassword(password: string) {
  return PASSWORD_REGEX.test(password)
}

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
}

async function requireSuperAdmin(request: NextRequest) {
  const token = getBearerToken(request)
  const payload = await verifySuperToken(token || "")
  if (!payload || payload.role !== "superadmin") {
    return unauthorized()
  }
  return payload
}

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()
    if (!email || !password) {
      return NextResponse.json({ error: "Email y password requeridos" }, { status: 400 })
    }

    const rows = await sql`SELECT id, email, password_hash, status FROM super_admins WHERE email = ${email.toLowerCase()} LIMIT 1`
    if (!rows.length) return NextResponse.json({ error: "Credenciales invalidas" }, { status: 401 })

    const admin = rows[0]
    if (admin.status !== "active") return NextResponse.json({ error: "Cuenta bloqueada" }, { status: 403 })

    const ok = await bcrypt.compare(password, admin.password_hash)
    if (!ok) return NextResponse.json({ error: "Credenciales invalidas" }, { status: 401 })

    const token = await signSuperToken({ role: "superadmin", sub: admin.id, email: admin.email })
    await sql`UPDATE super_admins SET last_login_at = NOW() WHERE id = ${admin.id}`

    const response = NextResponse.json({ token, superadmin: { id: admin.id, email: admin.email } })
    response.cookies.set("superadmin_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8,
    })
    return response
  } catch (error) {
    console.error("[superadmin/login]", error)
    return NextResponse.json({ error: "No se pudo iniciar sesion" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  const auth = await requireSuperAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
    const tenants = await sql<any[]>`
      SELECT o.*, COUNT(u.*) as user_count
      FROM organizations o
      LEFT JOIN users u ON u.organization_id = o.id
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `
    return NextResponse.json({ tenants })
  } catch (error) {
    console.error("[superadmin/tenants]", error)
    return NextResponse.json({ error: "No se pudieron cargar los tenants" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const auth = await requireSuperAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
    const body = await request.json()
    const { name, email, password, palette = "ocean", logo_url } = body || {}

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Nombre, email y password son requeridos" }, { status: 400 })
    }
    if (!validatePassword(password)) {
      return NextResponse.json({ error: "La contrasena debe tener 8+ caracteres, letras, numeros y simbolo" }, { status: 400 })
    }

    const slug = await ensureSlug(name)
    const organizationId = crypto.randomUUID()
    const userId = crypto.randomUUID()
    const passwordHash = await bcrypt.hash(password, 10)

    const preset = PALETTE_PRESETS[palette] || PALETTE_PRESETS.ocean
    const branding = { palette: preset.palette, darkPalette: preset.dark, logo_url: logo_url || null }

    await sql`INSERT INTO organizations (id, name, slug, logo_url, metadata, is_active) VALUES (${organizationId}, ${name}, ${slug}, ${logo_url || null}, ${JSON.stringify({ branding })}, true)`

    await sql`
      INSERT INTO users (id, organization_id, email, name, role, password_hash)
      VALUES (${userId}, ${organizationId}, ${email.toLowerCase()}, ${name}, 'admin', ${passwordHash})
    `

    const code = Math.floor(100000 + Math.random() * 900000).toString()
    const expires = new Date(Date.now() + 15 * 60 * 1000)
    await sql`
      INSERT INTO tenant_signup_codes (email, code, expires_at)
      VALUES (${email.toLowerCase()}, ${code}, ${expires.toISOString()})
    `

    return NextResponse.json({
      organization: { id: organizationId, name, slug, logo_url: logo_url || null },
      admin: { id: userId, email: email.toLowerCase(), role: "admin" },
      verification_code: code,
      preset: palette,
    })
  } catch (error) {
    console.error("[superadmin/create-tenant]", error)
    return NextResponse.json({ error: "No se pudo crear el tenant" }, { status: 500 })
  }
}
