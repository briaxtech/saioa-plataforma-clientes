import { type NextRequest, NextResponse } from "next/server"
import { Buffer } from "node:buffer"
import { getCurrentUser } from "@/lib/auth"
import { sql } from "@/lib/db"
import { getSignedDocumentUrl } from "@/lib/storage"

const downloadDocumentFromUrl = async (url: string) => {
  const response = await fetch(url, { cache: "no-store" })
  if (!response.ok) {
    const text = await response.text().catch(() => "")
    throw new Error(`Document download failed (${response.status}): ${text}`)
  }
  const buffer = Buffer.from(await response.arrayBuffer())
  const mimeType = response.headers.get("content-type") || undefined
  return { buffer, mimeType }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || (user.role !== "admin" && user.role !== "staff")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { prompt, file_name, file_type, file_base64, case_id, document_id } = await request.json()

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "Debes indicar un prompt para la IA." }, { status: 400 })
    }

    let resolvedFileName = file_name
    let resolvedFileType = file_type
    let resolvedFileBase64 = file_base64
    let resolvedCaseId = case_id

    if (document_id) {
      const docId = Number(document_id)
      if (Number.isNaN(docId)) {
        return NextResponse.json({ error: "document_id inválido." }, { status: 400 })
      }

      const documents = await sql`
        SELECT id, name, file_url, storage_path, mime_type, case_id
        FROM documents
        WHERE id = ${docId} AND organization_id = ${user.organization_id}
      `

      if (documents.length === 0) {
        return NextResponse.json({ error: "Documento no encontrado." }, { status: 404 })
      }

      const doc = documents[0]
      if (!doc.file_url && !doc.storage_path) {
        return NextResponse.json({ error: "Este documento no tiene un archivo asociado." }, { status: 400 })
      }

      let fileBuffer: Buffer | null = null
      let detectedMime: string | undefined

      if (doc.storage_path) {
        try {
          const signedUrl = await getSignedDocumentUrl(doc.storage_path)
          if (signedUrl) {
            const file = await downloadDocumentFromUrl(signedUrl)
            fileBuffer = file.buffer
            detectedMime = file.mimeType || detectedMime
          }
        } catch (error) {
          console.error("[ai] Failed to download Supabase file", error)
        }
      }

      if (!fileBuffer && doc.file_url) {
        try {
          const file = await downloadDocumentFromUrl(doc.file_url)
          fileBuffer = file.buffer
          detectedMime = file.mimeType || detectedMime
        } catch (error) {
          console.error("[ai] Failed to download public file", error)
        }
      }

      if (!fileBuffer) {
        return NextResponse.json(
          { error: "No pudimos descargar el archivo desde el almacenamiento de documentos." },
          { status: 502 },
        )
      }

      resolvedFileBase64 = fileBuffer.toString("base64")
      resolvedFileType = doc.mime_type || detectedMime || "application/pdf"
      const normalizedName = doc.name || `documento-${doc.id}`
      resolvedFileName = normalizedName.toLowerCase().endsWith(".pdf") ? normalizedName : `${normalizedName}.pdf`
      resolvedCaseId = doc.case_id ?? resolvedCaseId
    }

    if (!resolvedFileBase64 || !resolvedFileName || !resolvedFileType) {
      return NextResponse.json({ error: "Falta el archivo a analizar." }, { status: 400 })
    }

    const webhookUrl =
      process.env.N8N_DOCUMENT_REVIEW_WEBHOOK_URL || process.env.N8N_WEBHOOK_URL || process.env.N8N_WEBHOOK_URL_DEFAULT

    if (!webhookUrl) {
      return NextResponse.json(
        { error: "Falta configurar la URL del webhook de n8n (N8N_DOCUMENT_REVIEW_WEBHOOK_URL)." },
        { status: 500 },
      )
    }

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
        file_name: resolvedFileName,
        file_type: resolvedFileType,
        file_base64: resolvedFileBase64,
        case_id: resolvedCaseId,
        document_id,
        requested_by: user.id,
        requested_by_name: user.name,
      }),
    })

    if (!response.ok) {
      const errorPayload = await response.text()
      return NextResponse.json(
        { error: "El agente de IA no respondió correctamente.", details: errorPayload },
        { status: 502 },
      )
    }

    const result = await response.json().catch(() => ({}))

    return NextResponse.json({
      result: result?.result || result?.message || "No recibimos detalles del agente.",
      raw: result,
    })
  } catch (error) {
    console.error("[ai] document review error", error)
    return NextResponse.json({ error: "No pudimos analizar el documento." }, { status: 500 })
  }
}
