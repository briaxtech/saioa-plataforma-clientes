import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

function normalizeTemplate(template: any) {
  const parseJSON = (value: any) => {
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

  return {
    ...template,
    documents: parseJSON(template.documents),
    states: parseJSON(template.states),
  }
}

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const caseTypes = await sql`
      SELECT * FROM case_type_templates
      WHERE organization_id = ${user.organization_id} OR organization_id IS NULL
      ORDER BY (organization_id IS NULL) ASC, created_at DESC
    `

    return NextResponse.json({ caseTypes: caseTypes.map(normalizeTemplate) })
  } catch (error) {
    console.error("[v0] Failed to fetch case types:", error)
    return NextResponse.json({ error: "Failed to fetch case types" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || (user.role !== "admin" && user.role !== "staff")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { id, name, description, documents = [], states = [], timeframe, base_case_type = "other" } = body

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    const slug = name.toLowerCase().replace(/\s+/g, "-")
    const templateId = id || `${user.organization_id}-${slug}`

    const result = await sql`
      INSERT INTO case_type_templates (id, organization_id, name, description, documents, states, timeframe, base_case_type)
      VALUES (
        ${templateId},
        ${user.organization_id},
        ${name},
        ${description || null},
        ${JSON.stringify(documents)},
        ${JSON.stringify(states)},
        ${timeframe || null},
        ${base_case_type}
      )
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        documents = EXCLUDED.documents,
        states = EXCLUDED.states,
        timeframe = EXCLUDED.timeframe,
        base_case_type = EXCLUDED.base_case_type,
        organization_id = EXCLUDED.organization_id,
        updated_at = NOW()
      WHERE case_type_templates.organization_id = EXCLUDED.organization_id
      RETURNING *
    `

    return NextResponse.json({ caseType: normalizeTemplate(result[0]) }, { status: 201 })
  } catch (error) {
    console.error("[v0] Failed to upsert case type:", error)
    return NextResponse.json({ error: "Failed to save case type" }, { status: 500 })
  }
}
