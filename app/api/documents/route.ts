import { type NextRequest, NextResponse } from "next/server"
import { Buffer } from "node:buffer"
import { sql, logActivity, createNotification } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"
import { uploadCaseDocument, deleteCaseDocument } from "@/lib/storage"

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024 // 10MB safety limit
const ALLOWED_MIME_TYPES = new Set(["application/pdf", "image/jpeg", "image/png"])

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

const parseTemplateList = (value: any): any[] => {
  if (!value) return []
  if (Array.isArray(value)) return value
  if (typeof value === "string") {
    try {
      return JSON.parse(value)
    } catch {
      return []
    }
  }
  return []
}

const ensureTemplateRequirements = async (caseId: number, organizationId: string) => {
  const caseRecords = await sql`
    SELECT id, case_type, case_type_template_id
    FROM cases
    WHERE id = ${caseId} AND organization_id = ${organizationId}
  `

  if (caseRecords.length === 0) {
    return
  }

  const caseData = caseRecords[0]

  let templateDocs: any[] = []
  if (caseData.case_type_template_id) {
    const templates = await sql`
      SELECT documents
      FROM case_type_templates
      WHERE id = ${caseData.case_type_template_id} AND (organization_id = ${organizationId} OR organization_id IS NULL)
    `
    if (templates.length > 0) {
      templateDocs = parseTemplateList(templates[0].documents)
    }
  }

  if (templateDocs.length === 0) {
    const fallbackTemplates = await sql`
      SELECT documents
      FROM case_type_templates
      WHERE base_case_type = ${caseData.case_type} AND (organization_id = ${organizationId} OR organization_id IS NULL)
      ORDER BY created_at ASC
      LIMIT 1
    `
    if (fallbackTemplates.length > 0) {
      templateDocs = parseTemplateList(fallbackTemplates[0].documents)
    }
  }

  if (templateDocs.length === 0) {
    return
  }

  const existingDocs = await sql`
    SELECT LOWER(name) as name
    FROM documents
    WHERE case_id = ${caseId} AND organization_id = ${organizationId}
  `
  const existingNames = new Set(existingDocs.map((doc: any) => doc.name))

  const inserts = templateDocs
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
        VALUES (${organizationId}, ${caseId}, ${docName}, ${docDescription}, ${docCategory}, TRUE, 'pending')
      `
    })
    .filter(Boolean)

  await Promise.all(inserts as Promise<any>[])
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const demoConfig = await getDemoConfig(user.organization_id)

    const { searchParams } = new URL(request.url)
    const caseIdParam = searchParams.get("case_id")
    const status = searchParams.get("status")
    const caseId = caseIdParam ? Number(caseIdParam) : null
    const limitParam = Number.parseInt(searchParams.get("limit") || "50")
    const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 200) : 50

    if (caseId) {
      await ensureTemplateRequirements(caseId, user.organization_id)
    }

    let query = `
      SELECT 
        d.*,
        u.name as uploader_name,
        c.case_number,
        c.client_id,
        client.name as client_name
      FROM documents d
      LEFT JOIN users u ON d.uploaded_by = u.id
      JOIN cases c ON d.case_id = c.id
      LEFT JOIN users client ON c.client_id = client.id
      WHERE d.organization_id = $1
    `

    const params: any[] = [user.organization_id]

    if (demoConfig.isDemo) {
      query += ` AND d.uploaded_by = $${params.length + 1}`
      params.push(user.id)
    } else if (user.role === "client") {
      query += ` AND c.client_id = $${params.length + 1}`
      params.push(user.id)
    }

    if (caseId) {
      query += ` AND d.case_id = $${params.length + 1}`
      params.push(caseId)
    }

    if (status) {
      query += ` AND d.status = $${params.length + 1}`
      params.push(status)
    }

    query += " ORDER BY d.created_at DESC"
    query += ` LIMIT $${params.length + 1}`
    params.push(limit)

    const documents = await sql.unsafe(query, params)

    return NextResponse.json({ documents })
  } catch (error) {
    console.error("Failed to fetch documents:", error)
    return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const demoConfig = await getDemoConfig(user.organization_id)
    const maxUploadBytes = demoConfig.isDemo ? (demoConfig.limits.maxSizeMb ?? 1) * 1024 * 1024 : MAX_UPLOAD_BYTES

    const formData = await request.formData()
    const caseIdValue = formData.get("case_id")
    const file = formData.get("file") as File | null
    const description = formData.get("description")?.toString() || null
    const name = formData.get("name")?.toString()
    const category = formData.get("category")?.toString() || null
    const documentId = formData.get("document_id")?.toString()

    if (!caseIdValue || !file || !name) {
      return NextResponse.json({ error: "Datos incompletos para subir el documento." }, { status: 400 })
    }

    if (file.size > maxUploadBytes) {
      return NextResponse.json(
        { error: `El archivo es demasiado grande (limite ${(maxUploadBytes / 1024 / 1024).toFixed(1)}MB).` },
        { status: 413 },
      )
    }
    if (file.type && !ALLOWED_MIME_TYPES.has(file.type)) {
      return NextResponse.json({ error: "Tipo de archivo no permitido (solo PDF o imagenes)." }, { status: 415 })
    }

    const caseId = Number(caseIdValue)
    if (Number.isNaN(caseId)) {
      return NextResponse.json({ error: "ID de caso invalido" }, { status: 400 })
    }

    const caseRows = await sql`
      SELECT 
        c.*,
        u.name as client_name,
        u.id as client_id,
        staff.id as assigned_staff_id
      FROM cases c
      JOIN users u ON c.client_id = u.id
      LEFT JOIN users staff ON c.assigned_staff_id = staff.id
      WHERE c.id = ${caseId} AND c.organization_id = ${user.organization_id}
    `

    if (caseRows.length === 0) {
      return NextResponse.json({ error: "Caso no encontrado" }, { status: 404 })
    }

    const caseData = caseRows[0]
    if (user.role === "client" && caseData.client_id !== user.id) {
      return NextResponse.json({ error: "No puedes subir documentos a este caso." }, { status: 403 })
    }

    if (demoConfig.isDemo) {
      const dailyCountRows = await sql`
        SELECT COUNT(*)::int as count
        FROM documents
        WHERE organization_id = ${user.organization_id}
          AND uploaded_by = ${user.id}
          AND created_at::date = CURRENT_DATE
      `
      const dailyCount = dailyCountRows[0]?.count || 0
      const limit = demoConfig.limits.uploadsPerDay ?? DEMO_DEFAULTS.uploadsPerDay
      if (dailyCount >= limit) {
        return NextResponse.json(
          { error: `Limite diario alcanzado en modo demo (${limit} archivos). Intenta manana.` },
          { status: 429 },
        )
      }
    }

    const buffer = Buffer.from(await file.arrayBuffer())

    const uploadResult = await uploadCaseDocument({
      organizationId: user.organization_id,
      caseId,
      fileName: name,
      buffer,
      contentType: file.type || "application/octet-stream",
      pathPrefix: demoConfig.isDemo ? "demo" : undefined,
      uploaderId: demoConfig.isDemo ? user.id : undefined,
    })

    const fileUrl = uploadResult.publicUrl
    const storagePath = uploadResult.path
    const statusValue = "submitted"

    let document
    let previousStoragePath: string | null = null

    if (documentId) {
      const existingDocs = await sql`
        SELECT *
        FROM documents
        WHERE id = ${documentId} AND case_id = ${caseId} AND organization_id = ${user.organization_id}
      `

      if (existingDocs.length === 0) {
        return NextResponse.json({ error: "Documento no encontrado" }, { status: 404 })
      }

      const existingDoc = existingDocs[0]
      previousStoragePath = existingDoc.storage_path

      if (user.role === "client" && existingDoc.is_required) {
        const canUploadStatuses = new Set(["pending", "requires_action"])
        if (!canUploadStatuses.has(existingDoc.status)) {
          return NextResponse.json(
            {
              error: "Este documento está en revisión. Esperá a que el equipo lo revise antes de subir una nueva versión.",
            },
            { status: 409 },
          )
        }
      }

      const updateResult = await sql`
        UPDATE documents
        SET
          uploaded_by = ${user.id},
          name = ${name},
          description = COALESCE(${description}, description),
          file_url = ${fileUrl},
          storage_path = ${storagePath},
          file_size = ${file.size},
          mime_type = ${file.type || null},
          status = ${statusValue},
          review_notes = ${user.role === "client" ? null : existingDoc.review_notes},
          updated_at = NOW()
        WHERE id = ${documentId}
        RETURNING *
      `
      document = updateResult[0]
    } else {
      const result = await sql`
        INSERT INTO documents (
          organization_id, case_id, uploaded_by, name, description, file_url, storage_path,
          file_size, mime_type, category, is_required, status
        )
        VALUES (
          ${user.organization_id}, ${caseId}, ${user.id}, ${name}, ${description},
          ${fileUrl}, ${storagePath}, ${file.size}, ${file.type || null}, ${category}, ${false}, ${statusValue}
        )
        RETURNING *
      `
      document = result[0]
    }

    if (previousStoragePath) {
      await deleteCaseDocument(previousStoragePath)
    }

    await logActivity(user.organization_id, user.id, "document_uploaded", `Subiste ${name}`, Number(caseId))

    if (user.role === "client" && caseData.assigned_staff_id) {
      await createNotification(
        user.organization_id,
        caseData.assigned_staff_id,
        "Nuevo documento enviado",
        `${user.name} subió ${name} para el caso ${caseData.case_number}`,
        "document",
        Number(caseId),
      )
    } else if (user.role !== "client") {
      await createNotification(
        user.organization_id,
        caseData.client_id,
        "Documento disponible",
        `Se agregó ${name} a tu expediente ${caseData.case_number}`,
        "document",
        Number(caseId),
      )
    }

    return NextResponse.json({ document }, { status: 201 })
  } catch (error) {
    console.error("Failed to upload document:", error)
    return NextResponse.json({ error: "Failed to upload document" }, { status: 500 })
  }
}
