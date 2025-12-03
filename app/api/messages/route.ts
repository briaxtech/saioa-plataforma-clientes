import { type NextRequest, NextResponse } from "next/server"
import { sql, logActivity, createNotification } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"
import { checkRateLimit, getClientIp } from "@/lib/rate-limit"

const DEMO_DEFAULTS = { uploadsPerDay: 3, messagesPerDay: 10, maxSizeMb: 1, ttlMinutes: 30 }

async function getDemoConfig(organizationId: string) {
  const orgRows = await sql`
    SELECT metadata
    FROM organizations
    WHERE id = ${organizationId}
  `
  const meta = (orgRows[0]?.metadata || {}) as any
  const isDemo = Boolean(meta?.is_demo || meta?.isDemo)
  const limits = meta?.demo_limits || meta?.demoLimits || DEMO_DEFAULTS
  return { isDemo, limits }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const ip = getClientIp(request)
    const rate = checkRateLimit({
      key: `messages:${user.organization_id}:${user.id}:${ip}`,
      limit: 30,
      windowMs: 10 * 60 * 1000,
    })
    if (!rate.ok) {
      return NextResponse.json({ error: "Demasiados mensajes en poco tiempo. Intenta mas tarde." }, { status: 429 })
    }

    const demoConfig = await getDemoConfig(user.organization_id)

    const { searchParams } = new URL(request.url)
    const caseId = searchParams.get("case_id")
    const limitParam = Number.parseInt(searchParams.get("limit") || "100")
    const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 200) : 100

    let query = `
      SELECT 
        m.*,
        sender.name as sender_name,
        sender.email as sender_email,
        receiver.name as receiver_name,
        receiver.email as receiver_email
      FROM messages m
      LEFT JOIN users sender ON m.sender_id = sender.id
      LEFT JOIN users receiver ON m.receiver_id = receiver.id
      WHERE m.organization_id = $1
    `

    const params: any[] = [user.organization_id]

    if (caseId) {
      query += ` AND m.case_id = $${params.length + 1}`
      params.push(caseId)
    }

    if (demoConfig.isDemo) {
      query += ` AND (m.sender_id = $${params.length + 1} OR m.receiver_id = $${params.length + 1})`
      params.push(user.id)
    } else if (user.role === "client") {
      query += ` AND (m.sender_id = $${params.length + 1} OR m.receiver_id = $${params.length + 1})`
      params.push(user.id)
    } else if (!caseId) {
      query += ` AND (m.sender_id = $${params.length + 1} OR m.receiver_id = $${params.length + 1})`
      params.push(user.id)
    }

    query += " ORDER BY m.created_at DESC"
    query += ` LIMIT $${params.length + 1}`
    params.push(limit)

    const messages = await sql.unsafe(query, params)

    return NextResponse.json({ messages })
  } catch (error) {
    console.error("[v0] Failed to fetch messages:", error)
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const demoConfig = await getDemoConfig(user.organization_id)

    const body = await request.json()
    const { case_id, receiver_id, subject, content } = body

    if (!case_id || !receiver_id || !content) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Verify case access
    const cases = await sql`
      SELECT c.*, client.name as client_name
      FROM cases c
      LEFT JOIN users client ON c.client_id = client.id
      WHERE c.id = ${case_id} AND c.organization_id = ${user.organization_id}
    `

    if (cases.length === 0) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 })
    }

    const caseData = cases[0]

    // Verify permissions
    if (user.role === "client" && caseData.client_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    if (demoConfig.isDemo) {
      const dailyRows = await sql`
        SELECT COUNT(*)::int AS count
        FROM messages
        WHERE organization_id = ${user.organization_id}
          AND sender_id = ${user.id}
          AND created_at::date = CURRENT_DATE
      `
      const dailyCount = dailyRows[0]?.count || 0
      const limit = demoConfig.limits.messagesPerDay ?? DEMO_DEFAULTS.messagesPerDay
      if (dailyCount >= limit) {
        return NextResponse.json(
          { error: `Limite diario de mensajes alcanzado en modo demo (${limit}).` },
          { status: 429 },
        )
      }
    }

    const result = await sql`
      INSERT INTO messages (organization_id, case_id, sender_id, receiver_id, subject, content)
      VALUES (${user.organization_id}, ${case_id}, ${user.id}, ${receiver_id}, ${subject || null}, ${content})
      RETURNING *
    `

    const message = result[0]

    // Log activity
    await logActivity(user.organization_id, user.id, "message_sent", `Sent message to ${receiver_id}`, Number(case_id))

    // Create notification for receiver
    await createNotification(
      user.organization_id,
      receiver_id,
      "Nuevo mensaje",
      `Tienes un nuevo mensaje de ${user.name}${subject ? `: ${subject}` : ""}`,
      "message",
      Number(case_id),
    )

    return NextResponse.json({ message }, { status: 201 })
  } catch (error) {
    console.error("[v0] Failed to send message:", error)
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 })
  }
}
