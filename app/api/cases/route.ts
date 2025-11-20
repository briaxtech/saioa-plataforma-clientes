import { type NextRequest, NextResponse } from "next/server"
import { sql, logActivity } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

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
      WHERE c.organization_id = $1
    `

    const params: any[] = [user.organization_id]

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

    const cases = await sql.unsafe(query, params)

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
    const {
      client_id,
      case_type,
      case_type_template_id,
      title,
      description,
      priority = "medium",
      filing_date,
      deadline_date,
    } = body

    let resolvedCaseType = case_type
    let templateDocuments: any[] = []
    const clientRows = await sql`
      SELECT *
      FROM clients
      WHERE user_id = ${client_id} AND organization_id = ${user.organization_id}
    `
    if (clientRows.length === 0) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 })
    }

    if (case_type_template_id) {
      const templates = await sql`
        SELECT *
        FROM case_type_templates
        WHERE id = ${case_type_template_id} AND (organization_id = ${user.organization_id} OR organization_id IS NULL)
      `
      if (templates.length === 0) {
        return NextResponse.json({ error: "Case template not found" }, { status: 404 })
      }
      const template = templates[0]
      resolvedCaseType = template.base_case_type || case_type
      if (Array.isArray(template.documents)) {
        templateDocuments = template.documents
      } else if (typeof template.documents === "string") {
        try {
          templateDocuments = JSON.parse(template.documents)
        } catch {
          templateDocuments = []
        }
      }
    }

    // Generate case number
    const caseNumber = `${(resolvedCaseType || "cas").toUpperCase().substring(0, 3)}-${new Date().getFullYear()}-${String(
      Math.floor(Math.random() * 9999),
    ).padStart(4, "0")}`

    const result = await sql`
      INSERT INTO cases (
        organization_id, case_number, client_id, assigned_staff_id, case_type, 
        title, description, priority, filing_date, deadline_date, case_type_template_id
      )
      VALUES (
        ${user.organization_id}, ${caseNumber}, ${client_id}, ${user.id}, ${resolvedCaseType},
        ${title}, ${description || null}, ${priority},
        ${filing_date || null}, ${deadline_date || null}, ${case_type_template_id || null}
      )
      RETURNING *
    `

    const newCase = result[0]

    if (templateDocuments.length > 0) {
      const existingDocs = await sql`
        SELECT LOWER(name) as name
        FROM documents
        WHERE case_id = ${newCase.id}
      `
      const existingNames = new Set(existingDocs.map((doc: any) => doc.name))
      const docsToInsert = templateDocuments
        .map((entry: any) => {
          const docName = typeof entry === "string" ? entry : entry?.name
          if (!docName) return null
          const normalized = docName.trim().toLowerCase()
          if (!normalized || existingNames.has(normalized)) return null
          existingNames.add(normalized)
          const docCategory = typeof entry === "object" ? entry?.category || null : null
          const docDescription =
            typeof entry === "object" ? entry?.description || entry?.notes || entry?.instruction || null : null
          return sql`
            INSERT INTO documents (organization_id, case_id, name, description, category, is_required, status)
            VALUES (${user.organization_id}, ${newCase.id}, ${docName}, ${docDescription}, ${docCategory}, TRUE, 'pending')
          `
        })
        .filter(Boolean)
      await Promise.all(docsToInsert as Promise<any>[])
    }

    // Log activity
    await logActivity(user.organization_id, user.id, "case_created", `Created new case ${caseNumber}`, newCase.id)

    return NextResponse.json({ case: newCase }, { status: 201 })
  } catch (error) {
    console.error("[v0] Failed to create case:", error)
    return NextResponse.json({ error: "Failed to create case" }, { status: 500 })
  }
}
