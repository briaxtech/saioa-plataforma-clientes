import { neon } from "@neondatabase/serverless"

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set")
}

export const sql = neon(process.env.DATABASE_URL)

// Helper function to log database activities
export async function logActivity(
  userId: string,
  action: string,
  description: string,
  caseId?: number,
  metadata?: Record<string, any>,
) {
  try {
    await sql`
      INSERT INTO activity_logs (user_id, case_id, action, description, metadata)
      VALUES (${userId}, ${caseId || null}, ${action}, ${description}, ${JSON.stringify(metadata || {})})
    `
  } catch (error) {
    console.error("[v0] Failed to log activity:", error)
  }
}

// Helper function to create notifications
export async function createNotification(
  userId: string,
  title: string,
  message: string,
  type?: string,
  caseId?: number,
) {
  try {
    await sql`
      INSERT INTO notifications (user_id, title, message, type, related_case_id)
      VALUES (${userId}, ${title}, ${message}, ${type || "general"}, ${caseId || null})
    `
  } catch (error) {
    console.error("[v0] Failed to create notification:", error)
  }
}
