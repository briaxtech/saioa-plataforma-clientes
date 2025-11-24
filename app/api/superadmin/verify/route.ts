import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { verifySuperToken, getBearerToken } from "@/lib/superadmin-auth"

const resendApiKey = process.env.RESEND_API_KEY
const resendFrom = process.env.RESEND_FROM_EMAIL

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
}

function validateCode(code: string) {
  return /^[0-9]{6}$/.test(code)
}

async function sendEmail(to: string, code: string) {
  if (!resendApiKey || !resendFrom) return { sent: false, reason: "Resend no configurado" }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: resendFrom,
        to,
        subject: "Verifica tu cuenta",
        html: `<p>Tu codigo de verificacion es <strong>${code}</strong>. Vence en 15 minutos.</p>`,
      }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      console.error("[resend]", res.status, data)
      return { sent: false, reason: "Error al enviar" }
    }
    return { sent: true }
  } catch (error) {
    console.error("[resend]", error)
    return { sent: false, reason: "Excepcion al enviar" }
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = getBearerToken(request)
    const payload = await verifySuperToken(token || "")
    if (!payload || payload.role !== "superadmin") return unauthorized()

    const { email } = await request.json().catch(() => ({}))
    if (!email) return NextResponse.json({ error: "Email requerido" }, { status: 400 })

    const code = Math.floor(100000 + Math.random() * 900000).toString()
    const expires = new Date(Date.now() + 15 * 60 * 1000).toISOString()

    await sql`DELETE FROM tenant_signup_codes WHERE email = ${email.toLowerCase()}`
    await sql`
      INSERT INTO tenant_signup_codes (email, code, expires_at)
      VALUES (${email.toLowerCase()}, ${code}, ${expires})
    `

    const emailResult = await sendEmail(email, code)

    return NextResponse.json({ code: emailResult.sent ? undefined : code, email_sent: emailResult.sent })
  } catch (error) {
    console.error("[superadmin/verify/send]", error)
    return NextResponse.json({ error: "No se pudo generar el codigo" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { email, code } = await request.json().catch(() => ({}))
    if (!email || !code) return NextResponse.json({ error: "Email y codigo requeridos" }, { status: 400 })
    if (!validateCode(code)) return NextResponse.json({ error: "Codigo invalido" }, { status: 400 })

    const rows = await sql`
      SELECT * FROM tenant_signup_codes
      WHERE email = ${email.toLowerCase()} AND code = ${code} AND consumed_at IS NULL
      ORDER BY created_at DESC
      LIMIT 1
    `
    const entry = rows[0]
    if (!entry) return NextResponse.json({ error: "Codigo no valido" }, { status: 400 })

    if (entry.expires_at && new Date(entry.expires_at) < new Date()) {
      return NextResponse.json({ error: "Codigo expirado" }, { status: 400 })
    }

    await sql`UPDATE tenant_signup_codes SET consumed_at = NOW() WHERE id = ${entry.id}`

    const admins = await sql`SELECT organization_id FROM users WHERE email = ${email.toLowerCase()} LIMIT 1`
    if (admins.length > 0) {
      const orgId = admins[0].organization_id
      const verification = { email: email.toLowerCase(), verified_at: new Date().toISOString() }
      await (sql as any).unsafe(
        "UPDATE organizations SET metadata = COALESCE(metadata,'{}'::jsonb) || $2::jsonb WHERE id = $1",
        [orgId, JSON.stringify({ verification })],
      )
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("[superadmin/verify/confirm]", error)
    return NextResponse.json({ error: "No se pudo verificar el codigo" }, { status: 500 })
  }
}
