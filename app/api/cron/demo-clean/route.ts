import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { deleteCaseDocument } from "@/lib/storage"

const DEMO_ORG_ID = process.env.DEMO_ORG_ID || "org-demo"
const TTL_MINUTES = Number.parseInt(process.env.DEMO_TTL_MINUTES || "30", 10) || 30
const BATCH_LIMIT = 200

function ensureAuthorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET_KEY
  if (!secret) return false
  const header = request.headers.get("x-cron-key")
  return header === secret
}

export async function POST(request: NextRequest) {
  if (!ensureAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const cutoff = TTL_MINUTES

    const oldDocs = await sql`
      SELECT id, storage_path
      FROM documents
      WHERE organization_id = ${DEMO_ORG_ID}
        AND created_at < NOW() - INTERVAL '${cutoff} minutes'
      LIMIT ${BATCH_LIMIT}
    `

    const oldMessages = await sql`
      SELECT id
      FROM messages
      WHERE organization_id = ${DEMO_ORG_ID}
        AND created_at < NOW() - INTERVAL '${cutoff} minutes'
      LIMIT ${BATCH_LIMIT}
    `

    const oldNotifications = await sql`
      SELECT id
      FROM notifications
      WHERE organization_id = ${DEMO_ORG_ID}
        AND created_at < NOW() - INTERVAL '${cutoff} minutes'
      LIMIT ${BATCH_LIMIT}
    `

    for (const doc of oldDocs) {
      await deleteCaseDocument(doc.storage_path)
    }

    if (oldDocs.length > 0) {
      const ids = oldDocs.map((doc: any) => doc.id)
      await sql`DELETE FROM documents WHERE id = ANY(${sql.array(ids, "int4")})`
    }

    if (oldMessages.length > 0) {
      const ids = oldMessages.map((m: any) => m.id)
      await sql`DELETE FROM messages WHERE id = ANY(${sql.array(ids, "int4")})`
    }

    if (oldNotifications.length > 0) {
      const ids = oldNotifications.map((n: any) => n.id)
      await sql`DELETE FROM notifications WHERE id = ANY(${sql.array(ids, "int4")})`
    }

    return NextResponse.json({
      deleted: {
        documents: oldDocs.length,
        messages: oldMessages.length,
        notifications: oldNotifications.length,
      },
    })
  } catch (error) {
    console.error("[demo-clean] Failed to clean demo data", error)
    return NextResponse.json({ error: "Failed to clean demo data" }, { status: 500 })
  }
}
