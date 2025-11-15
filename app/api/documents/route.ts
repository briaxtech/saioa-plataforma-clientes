import { type NextRequest, NextResponse } from "next/server"
import { Buffer } from "node:buffer"
import { sql, logActivity, createNotification } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"
import { ensureCaseDriveFolder, ensureClientDriveFolder, uploadFileToDrive } from "@/lib/google-drive-service"

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const caseId = searchParams.get("case_id")
    const status = searchParams.get("status")

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
    `

    const conditions: string[] = []
    const params: any[] = []

    if (user.role === "client") {
      conditions.push(`c.client_id = $${params.length + 1}`)
      params.push(user.id)
    }

    if (caseId) {
      conditions.push(`d.case_id = $${params.length + 1}`)
      params.push(caseId)
    }

    if (status) {
      conditions.push(`d.status = $${params.length + 1}`)
      params.push(status)
    }

    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ")
    }

    query += " ORDER BY d.created_at DESC"

    const documents = await sql.query(query, params)

    return NextResponse.json({ documents })
  } catch (error) {
    console.error("[v0] Failed to fetch documents:", error)
    return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const caseId = formData.get("case_id") as string
    const documentId = formData.get("document_id") as string | null
    const rawName = (formData.get("name") || formData.get("document_type")) as string | null
    const name = rawName?.trim()
    const description = (formData.get("description") as string) || null
    const category = (formData.get("category") as string) || null
    const file = formData.get("file") as File | null

    if (!caseId || !name || !file) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const cases = await sql`
      SELECT 
        c.*,
        client.id as client_record_id,
        client.drive_folder_id,
        client_user.name as client_name
      FROM cases c
      LEFT JOIN clients client ON client.user_id = c.client_id
      LEFT JOIN users client_user ON client_user.id = c.client_id
      WHERE c.id = ${caseId}
    `

    if (cases.length === 0) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 })
    }

    const caseData = cases[0]

    if (user.role === "client" && caseData.client_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    let clientFolderId = caseData.drive_folder_id
    if (!clientFolderId && caseData.client_record_id) {
      try {
        clientFolderId = await ensureClientDriveFolder(caseData.client_name || "Cliente")
        await sql`
          UPDATE clients
          SET drive_folder_id = ${clientFolderId}
          WHERE id = ${caseData.client_record_id}
        `
      } catch (driveError) {
        console.error("[v0] Failed to ensure client folder:", driveError)
      }
    }

    let caseFolderId = caseData.google_drive_folder_id
    if (clientFolderId && !caseFolderId) {
      try {
        caseFolderId = await ensureCaseDriveFolder(caseData.case_number, clientFolderId)
        await sql`
          UPDATE cases
          SET google_drive_folder_id = ${caseFolderId}
          WHERE id = ${caseData.id}
        `
      } catch (driveError) {
        console.error("[v0] Failed to ensure case folder:", driveError)
      }
    }

    const buffer = Buffer.from(await file.arrayBuffer())

    let driveFileId: string | null = null
    let driveFileUrl: string | null = null
    try {
      if (caseFolderId) {
        const uploaded = await uploadFileToDrive({
          buffer,
          fileName: name,
          mimeType: file.type || "application/octet-stream",
          folderId: caseFolderId,
        })
        driveFileId = uploaded.fileId
        driveFileUrl =
          uploaded.webViewLink || `https://drive.google.com/file/d/${uploaded.fileId}/view?usp=drive_link`
      }
    } catch (driveError) {
      console.error("[v0] Failed to upload to Drive, using fallback URL:", driveError)
    }

    const fallbackUrl = `/uploads/${Date.now()}-${file.name}`
    const fileUrl = driveFileUrl || fallbackUrl
    const status = "submitted"

    let document
    if (documentId) {
      const existingDocs = await sql`
        SELECT * FROM documents WHERE id = ${documentId}
      `

      if (existingDocs.length === 0 || String(existingDocs[0].case_id) !== caseId) {
        return NextResponse.json({ error: "Invalid document reference" }, { status: 404 })
      }

      const updateResult = await sql`
        UPDATE documents
        SET
          uploaded_by = ${user.id},
          name = ${name},
          description = COALESCE(${description}, description),
          file_url = ${fileUrl},
          file_size = ${file.size},
          mime_type = ${file.type || null},
          status = ${status},
          google_drive_file_id = ${driveFileId},
          updated_at = NOW()
        WHERE id = ${documentId}
        RETURNING *
      `
      document = updateResult[0]
    } else {
      const result = await sql`
        INSERT INTO documents (
          case_id, uploaded_by, name, description, file_url,
          file_size, mime_type, category, is_required, status, google_drive_file_id
        )
        VALUES (
          ${caseId}, ${user.id}, ${name}, ${description}, ${fileUrl},
          ${file.size}, ${file.type || null}, ${category}, ${false}, ${status}, ${driveFileId}
        )
        RETURNING *
      `
      document = result[0]
    }

    await logActivity(user.id, "document_uploaded", `Subiste ${name}`, Number(caseId))

    if (user.role === "client" && caseData.assigned_staff_id) {
      await createNotification(
        caseData.assigned_staff_id,
        "Nuevo documento enviado",
        `${user.name} subió ${name} para el caso ${caseData.case_number}`,
        "document",
        Number(caseId),
      )
    } else if (user.role !== "client") {
      await createNotification(
        caseData.client_id,
        "Documento disponible",
        `Se agregó ${name} a tu expediente ${caseData.case_number}`,
        "document",
        Number(caseId),
      )
    }

    return NextResponse.json({ document }, { status: 201 })
  } catch (error) {
    console.error("[v0] Failed to upload document:", error)
    return NextResponse.json({ error: "Failed to upload document" }, { status: 500 })
  }
}
