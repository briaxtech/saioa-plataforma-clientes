import { type NextRequest, NextResponse } from "next/server"
import { sql, logActivity } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"
import { ensureCaseDriveFolder, ensureClientDriveFolder } from "@/lib/google-drive-service"

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const clientId = searchParams.get("client_id")

    let query = `
      SELECT 
        c.*,
        client.name as client_name,
        client.email as client_email,
        staff.name as staff_name
      FROM cases c
      LEFT JOIN users client ON c.client_id = client.id
      LEFT JOIN users staff ON c.assigned_staff_id = staff.id
      WHERE 1=1
    `

    const params: any[] = []

    // Filter by user role
    if (user.role === "client") {
      query += ` AND c.client_id = $${params.length + 1}`
      params.push(user.id)
    }

    if (status) {
      query += ` AND c.status = $${params.length + 1}`
      params.push(status)
    }

    if (clientId) {
      query += ` AND c.client_id = $${params.length + 1}`
      params.push(clientId)
    }

    query += " ORDER BY c.created_at DESC"

    const cases = await sql.query(query, params)

    return NextResponse.json({ cases })
  } catch (error) {
    console.error("[v0] Failed to fetch cases:", error)
    return NextResponse.json({ error: "Failed to fetch cases" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || (user.role !== "admin" && user.role !== "staff")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { client_id, case_type, title, description, priority = "medium", filing_date, deadline_date } = body

    // Generate case number
    const caseNumber = `${case_type.toUpperCase().substring(0, 3)}-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9999)).padStart(4, "0")}`

    const result = await sql`
      INSERT INTO cases (
        case_number, client_id, assigned_staff_id, case_type, 
        title, description, priority, filing_date, deadline_date
      )
      VALUES (
        ${caseNumber}, ${client_id}, ${user.id}, ${case_type},
        ${title}, ${description || null}, ${priority}, 
        ${filing_date || null}, ${deadline_date || null}
      )
      RETURNING *
    `

    const newCase = result[0]

    try {
      const clientRecords = await sql`
        SELECT c.id, c.drive_folder_id, u.name
        FROM clients c
        JOIN users u ON c.user_id = u.id
        WHERE c.user_id = ${client_id}
      `

      if (clientRecords.length > 0) {
        let clientFolderId = clientRecords[0].drive_folder_id
        if (!clientFolderId) {
          clientFolderId = await ensureClientDriveFolder(clientRecords[0].name)
          await sql`
            UPDATE clients
            SET drive_folder_id = ${clientFolderId}
            WHERE id = ${clientRecords[0].id}
          `
        }

        if (clientFolderId) {
          const caseFolderId = await ensureCaseDriveFolder(caseNumber, clientFolderId, newCase.google_drive_folder_id || undefined)
          if (caseFolderId && !newCase.google_drive_folder_id) {
            await sql`
              UPDATE cases
              SET google_drive_folder_id = ${caseFolderId}
              WHERE id = ${newCase.id}
            `
            newCase.google_drive_folder_id = caseFolderId
          }
        }
      }
    } catch (driveError) {
      console.error("[v0] Failed to provision Drive folder for case:", driveError)
    }

    // Log activity
    await logActivity(user.id, "case_created", `Created new case ${caseNumber}`, newCase.id)

    return NextResponse.json({ case: newCase }, { status: 201 })
  } catch (error) {
    console.error("[v0] Failed to create case:", error)
    return NextResponse.json({ error: "Failed to create case" }, { status: 500 })
  }
}
