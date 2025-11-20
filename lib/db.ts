import postgres from "postgres"

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
  throw new Error("DATABASE_URL environment variable is not set")
}

const sqlInstance = postgres(databaseUrl, {
  ssl: databaseUrl.includes("localhost") ? false : "require",
})

export const sql = sqlInstance
;(sql as any).query = (text: string, params?: any[]) => sql.unsafe(text, params ?? [])

export async function logActivity(
  organizationId: string,
  userId: string | null,
  action: string,
  description: string,
  caseId?: number,
  metadata?: Record<string, any>,
) {
  try {
    await sql`
      INSERT INTO activity_logs (organization_id, user_id, case_id, action, description, metadata)
      VALUES (${organizationId}, ${userId || null}, ${caseId || null}, ${action}, ${description}, ${JSON.stringify(metadata || {})})
    `
  } catch (error) {
    console.error("[v0] Failed to log activity:", error)
  }
}

export async function createNotification(
  organizationId: string,
  userId: string,
  title: string,
  message: string,
  type?: string,
  caseId?: number,
) {
  try {
    await sql`
      INSERT INTO notifications (organization_id, user_id, title, message, type, related_case_id)
      VALUES (${organizationId}, ${userId}, ${title}, ${message}, ${type || "general"}, ${caseId || null})
    `
  } catch (error) {
    console.error("[v0] Failed to create notification:", error)
  }
}
