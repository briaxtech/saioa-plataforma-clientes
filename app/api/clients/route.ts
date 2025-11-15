import { randomUUID } from "crypto"
import { type NextRequest, NextResponse } from "next/server"
import { sql, logActivity } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"
import { ensureCaseDriveFolder, ensureClientDriveFolder } from "@/lib/google-drive-service"

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || (user.role !== "admin" && user.role !== "staff")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")

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
      WHERE u.role = 'client'
    `

    const params: any[] = []

    if (search) {
      query += ` AND (u.name ILIKE $1 OR u.email ILIKE $1)`
      params.push(`%${search}%`)
    }

    query += " ORDER BY c.created_at DESC"

  const clients = await sql.query(query, params)

  // Fetch unread notification counts
  const notifications = await sql`
    SELECT user_id, COUNT(*)::int AS unread_count
    FROM notifications
    WHERE is_read = FALSE
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

    if (!name || !email) {
      return NextResponse.json({ error: "Name and email are required" }, { status: 400 })
    }

    const existing = await sql`
      SELECT id FROM users WHERE email = ${email}
    `

    if (existing.length > 0) {
      return NextResponse.json({ error: "Email already in use" }, { status: 409 })
    }

    const newUserId = randomUUID()

    await sql`
      INSERT INTO users (id, name, email, role, phone, country_of_origin)
      VALUES (${newUserId}, ${name}, ${email}, 'client', ${phone || null}, ${country_of_origin || null})
    `

    const clientResult = await sql`
      INSERT INTO clients (user_id, assigned_staff_id, notes)
      VALUES (${newUserId}, ${user.id}, ${notes || null})
      RETURNING *
    `

    let clientDriveFolderId = clientResult[0].drive_folder_id
    try {
      clientDriveFolderId = await ensureClientDriveFolder(name, clientDriveFolderId || undefined)
      if (clientDriveFolderId && !clientResult[0].drive_folder_id) {
        await sql`
          UPDATE clients
          SET drive_folder_id = ${clientDriveFolderId}
          WHERE user_id = ${newUserId}
        `
      }
    } catch (driveError) {
      console.error("[v0] Failed to create client drive folder:", driveError)
    }

    let createdCase: any = null

    if (caseTypeId) {
      const templates = await sql`
        SELECT * FROM case_type_templates WHERE id = ${caseTypeId}
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
          title, description, priority
        )
        VALUES (
          ${caseNumber}, ${newUserId}, ${user.id}, ${baseCaseType},
          ${template.name}, ${template.description || null}, ${priority}
        )
        RETURNING *
      `

      createdCase = newCaseResult[0]

      if (clientDriveFolderId) {
        try {
          const caseFolderId = await ensureCaseDriveFolder(caseNumber, clientDriveFolderId, createdCase.google_drive_folder_id || undefined)
          if (caseFolderId && !createdCase.google_drive_folder_id) {
            await sql`
              UPDATE cases
              SET google_drive_folder_id = ${caseFolderId}
              WHERE id = ${createdCase.id}
            `
            createdCase.google_drive_folder_id = caseFolderId
          }
        } catch (driveError) {
          console.error("[v0] Failed to create case drive folder:", driveError)
        }
      }

      await sql`
        UPDATE clients
        SET case_count = case_count + 1
        WHERE user_id = ${newUserId}
      `

      const templateStates: string[] = parseJSONField(template.states)

      await Promise.all(
        templateStates.map((state: string, index: number) =>
          sql`
            INSERT INTO case_milestones (case_id, title, order_index)
            VALUES (${createdCase.id}, ${state}, ${index + 1})
          `,
        ),
      )
    }

    await logActivity(user.id, "client_created", `Creaste al cliente ${name}`, createdCase?.id)

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
