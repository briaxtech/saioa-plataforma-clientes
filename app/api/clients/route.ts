import { randomUUID, randomBytes } from "crypto"
import { type NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"
import bcrypt from "bcryptjs"
import { sql, logActivity } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "Tu agencia"
const APP_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_BASE_URL || "https://example.com"

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || (user.role !== "admin" && user.role !== "staff")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")
    const archivedParam = searchParams.get("archived")
    let archivedFilter: boolean | undefined

    if (archivedParam) {
      const normalized = archivedParam.toLowerCase()
      if (normalized === "true") archivedFilter = true
      if (normalized === "false") archivedFilter = false
    }

    let query = `
      SELECT 
        c.*,
        u.id as user_id,
        u.name,
        u.email,
        u.phone,
        u.country_of_origin,
        u.created_at as user_created_at,
        staff.name as staff_name
      FROM clients c
      JOIN users u ON c.user_id = u.id
      LEFT JOIN users staff ON c.assigned_staff_id = staff.id
      WHERE u.role = 'client' AND c.organization_id = $1
    `

    const params: any[] = [user.organization_id]

    if (search) {
      query += ` AND (u.name ILIKE $${params.length + 1} OR u.email ILIKE $${params.length + 1})`
      params.push(`%${search}%`)
    }

    if (archivedFilter === true) {
      query += " AND c.archived_at IS NOT NULL"
    } else if (archivedFilter === false) {
      query += " AND c.archived_at IS NULL"
    }

    query += " ORDER BY c.created_at DESC"

    const clients = await sql.unsafe(query, params)

    // Fetch unread notification counts
    const notifications = await sql`
      SELECT user_id, COUNT(*)::int AS unread_count
      FROM notifications
      WHERE is_read = FALSE AND organization_id = ${user.organization_id}
      GROUP BY user_id
    `

    const notificationMap = new Map<string, number>()
    notifications.forEach((row: any) => {
      notificationMap.set(row.user_id, row.unread_count)
    })

    const enrichedClients = clients.map((client: any) => ({
      ...client,
      unread_notifications: notificationMap.get(client.user_id) || 0,
    }))

    return NextResponse.json({ clients: enrichedClients })
  } catch (error) {
    console.error("[v0] Failed to fetch clients:", error)
    return NextResponse.json({ error: "Failed to fetch clients" }, { status: 500 })
  }
}

const parseJSONField = (value: any) => {
  if (Array.isArray(value)) return value
  if (typeof value === "string") {
    try {
      return JSON.parse(value)
    } catch {
      return []
    }
  }
  return value || []
}

const generateTemporaryPassword = (length = 12) => {
  const charset = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789"
  const randomBuffer = randomBytes(length)
  let password = ""

  for (let i = 0; i < length; i++) {
    password += charset[randomBuffer[i] % charset.length]
  }

  return password
}

const buildWelcomeEmailHtml = ({
  clientName,
  appBaseUrl,
  clientEmail,
  temporaryPassword,
}: {
  clientName: string
  appBaseUrl: string
  clientEmail: string
  temporaryPassword: string
}) => {
  const normalizedBaseUrl = appBaseUrl.replace(/\/$/, "")
  const loginUrl = `${normalizedBaseUrl}/login`

  return `
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7fb;padding:32px 0;font-family:'Segoe UI',Arial,sans-serif;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 12px 40px rgba(15,23,42,0.08);">
          <tr>
            <td style="padding:40px;background:linear-gradient(120deg,#0d9488,#0891b2);color:#ffffff;">
              <h1 style="margin:0;font-size:28px;font-weight:600;">Bienvenido a ${APP_NAME}</h1>
              <p style="margin:12px 0 0;font-size:16px;opacity:0.9;">Ya podés seguir tu caso desde nuestra plataforma.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:40px;color:#0f172a;">
              <p style="font-size:16px;line-height:1.6;margin:0 0 16px;">Hola ${clientName},</p>
              <p style="font-size:16px;line-height:1.6;margin:0 0 16px;">
                Tu expediente ya fue creado en nuestro panel para clientes. Desde ahora vas a poder revisar el estado de tu trámite, subir documentación requerida y conversar directamente con tu abogada.
              </p>
              <div style="margin:24px 0;padding:20px;border:1px dashed #0d9488;border-radius:12px;background:#f0fdfa;">
                <p style="font-size:15px;margin:0 0 8px;">Podés ingresar con:</p>
                <p style="font-size:15px;margin:0;"><strong>Usuario:</strong> ${clientEmail}</p>
                <p style="font-size:15px;margin:8px 0 0;"><strong>Contraseña temporal:</strong> <span style="font-size:18px;letter-spacing:2px;">${temporaryPassword}</span></p>
                <p style="font-size:13px;margin:12px 0 0;color:#0f172a;">Por seguridad, te pedimos cambiar esta contraseña desde la sección "Perfil & Seguridad" apenas ingreses.</p>
              </div>
              <div style="margin:32px 0;text-align:center;">
                <a href="${loginUrl}" style="background:#0d9488;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:999px;font-size:15px;font-weight:600;display:inline-block;">
                  Ingresar a la plataforma
                </a>
              </div>
              <p style="font-size:15px;line-height:1.6;margin:0 0 16px;">
                Si necesitás asistencia adicional, respondé este correo o comunicate con nosotros. Estamos atentos para acompañarte en cada paso.
              </p>
              <p style="font-size:15px;margin:24px 0 0;">Equipo ${APP_NAME}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:24px;background:#f9fafb;text-align:center;">
              <img src="${normalizedBaseUrl}/logo.png" alt="${APP_NAME}" style="height:32px;margin-bottom:8px;" />
              <p style="margin:0;font-size:12px;color:#94a3b8;">© ${new Date().getFullYear()} ${APP_NAME} · Todos los derechos reservados</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
`
}

const parseSenderAddress = (value: string): { email: string; name?: string } => {
  const trimmed = value.trim()
  const match = trimmed.match(/^(.*)<(.+)>$/)
  if (match) {
    return {
      email: match[2].trim(),
      name: match[1].trim().replace(/^"|"$/g, ""),
    }
  }

  return { email: trimmed, name: undefined }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || (user.role !== "admin" && user.role !== "staff")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const {
      name,
      email,
      phone,
      country_of_origin,
      notes,
      caseTypeId,
      priority = "medium",
    }: {
      name: string
      email: string
      phone?: string
      country_of_origin?: string
      notes?: string
      caseTypeId?: string
      priority?: string
    } = body
    const tenantId = user.organization_id

    if (!name || !email) {
      return NextResponse.json({ error: "Name and email are required" }, { status: 400 })
    }

    const existing = await sql`
      SELECT id FROM users WHERE email = ${email.toLowerCase()} AND organization_id = ${tenantId}
    `

    if (existing.length > 0) {
      return NextResponse.json({ error: "Email already in use" }, { status: 409 })
    }

    const temporaryPassword = generateTemporaryPassword()
    const passwordHash = await bcrypt.hash(temporaryPassword, 12)

    const newUserId = randomUUID()

    await sql`
      INSERT INTO users (id, organization_id, name, email, role, phone, country_of_origin, password_hash)
      VALUES (${newUserId}, ${tenantId}, ${name}, ${email.toLowerCase()}, 'client', ${phone || null}, ${
        country_of_origin || null
      }, ${passwordHash})
    `

    const clientResult = await sql`
      INSERT INTO clients (organization_id, user_id, assigned_staff_id, notes)
      VALUES (${tenantId}, ${newUserId}, ${user.id}, ${notes || null})
      RETURNING *
    `

    let createdCase: any = null

    if (caseTypeId) {
      const templates = await sql`
        SELECT *
        FROM case_type_templates
        WHERE id = ${caseTypeId} AND (organization_id = ${tenantId} OR organization_id IS NULL)
      `

      if (templates.length === 0) {
        return NextResponse.json({ error: "Case type not found" }, { status: 404 })
      }

      const template = templates[0]
      const prefixFromId = template.id
        ?.split("-")
        .slice(0, 2)
        .map((part: string) => part[0]?.toUpperCase())
        .join("")
      const generatedPrefix =
        prefixFromId && prefixFromId.length >= 2
          ? prefixFromId
          : template.name
              .split(" ")
              .map((word: string) => word[0])
              .join("")
              .slice(0, 3)
              .toUpperCase() || "CAS"

      const caseNumber = `${generatedPrefix}-${new Date().getFullYear()}-${String(
        Math.floor(Math.random() * 9999),
      ).padStart(4, "0")}`

      const baseCaseType = template.base_case_type || "other"

      const newCaseResult = await sql`
        INSERT INTO cases (
          case_number, client_id, assigned_staff_id, case_type,
          title, description, priority, case_type_template_id
        )
        VALUES (
          ${caseNumber}, ${newUserId}, ${user.id}, ${baseCaseType},
          ${template.name}, ${template.description || null}, ${priority}, ${caseTypeId}
        )
        RETURNING *
      `

      createdCase = newCaseResult[0]

      await sql`
      UPDATE clients
      SET case_count = case_count + 1
      WHERE user_id = ${newUserId} AND organization_id = ${tenantId}
      `

      const templateStates: string[] = parseJSONField(template.states)

      await Promise.all(
        templateStates.map((state: string, index: number) =>
          sql`
            INSERT INTO case_milestones (organization_id, case_id, title, order_index)
            VALUES (${tenantId}, ${createdCase.id}, ${state}, ${index + 1})
          `,
        ),
      )

      const templateDocuments: any[] = parseJSONField(template.documents)
      if (templateDocuments.length > 0) {
        const insertPromises = templateDocuments
          .map((entry: any, index: number) => {
            const docName = typeof entry === "string" ? entry : entry?.name
            if (!docName) return null
            const docCategory = typeof entry === "object" ? entry?.category || null : null
            const docDescription =
              typeof entry === "object" ? entry?.description || entry?.notes || entry?.instruction || null : null

              return sql`
                INSERT INTO documents (organization_id, case_id, name, description, category, is_required, status, created_at, updated_at)
                VALUES (${tenantId}, ${createdCase.id}, ${docName}, ${docDescription}, ${docCategory}, TRUE, 'pending', NOW(), NOW())
              `
          })
          .filter(Boolean)

        await Promise.all(insertPromises as Promise<any>[])
      }
    }

    await logActivity(tenantId, user.id, "client_created", `Creaste al cliente ${name}`, createdCase?.id)

    const resendApiKey = process.env.RESEND_API_KEY
    const emailFrom = process.env.RESEND_FROM_EMAIL || process.env.EMAIL_FROM

    if (resendApiKey && emailFrom) {
      const { email: senderEmail, name: senderName } = parseSenderAddress(emailFrom)

      if (senderEmail) {
        const appUrl = APP_BASE_URL
        const html = buildWelcomeEmailHtml({
          clientName: name,
          appBaseUrl: appUrl,
          clientEmail: email,
          temporaryPassword,
        })
        const resend = new Resend(resendApiKey)
        const fromAddress = senderName ? `${senderName} <${senderEmail}>` : senderEmail

        try {
          const sendResult = await resend.emails.send({
            from: fromAddress,
            to: [email],
            subject: `Tu acceso a ${APP_NAME}`,
            html,
          })
          console.info("[v0] Resend welcome email queued", {
            client: email,
            messageId: sendResult?.id || "no-id",
          })
        } catch (sendError) {
          console.error("[v0] Failed to send welcome email:", sendError)
        }
      } else {
        console.warn("[v0] Invalid RESEND_FROM_EMAIL/EMAIL_FROM format, skipping welcome email.")
      }
    } else {
      console.warn("[v0] Resend credentials missing (RESEND_API_KEY or RESEND_FROM_EMAIL/EMAIL_FROM), skipping welcome email.")
    }

    return NextResponse.json(
      {
        client: { ...clientResult[0], user_id: newUserId },
        case: createdCase,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("[v0] Failed to create client:", error)
    return NextResponse.json({ error: "Failed to create client" }, { status: 500 })
  }
}
