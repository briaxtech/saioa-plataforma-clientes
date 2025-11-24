import { type NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"
import { sql, createNotification, logActivity } from "@/lib/db"

function normalizeRecipients(value: any) {
  if (!value) return []
  const parsed =
    typeof value === "string"
      ? (() => {
          try {
            return JSON.parse(value)
          } catch {
            return []
          }
        })()
      : value
  if (!Array.isArray(parsed)) return []
  return parsed
    .map((entry) => {
      if (!entry || !entry.email) return null
      return {
        email: entry.email,
        name: entry.name,
      }
    })
    .filter(Boolean) as { email: string; name?: string }[]
}

function ensureAuthorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET_KEY
  if (!secret) {
    return false
  }
  const header = request.headers.get("x-cron-key")
  return header === secret
}

function buildHtmlBody(text?: string | null) {
  if (!text) {
    return "<p>Recordatorio automático.</p>"
  }
  const sanitized = text
    .split("\n")
    .map((line) => line.trim())
    .join("<br/>")
  return `<p>${sanitized}</p>`
}

export async function POST(request: NextRequest) {
  try {
    if (!ensureAuthorized(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const resendKey = process.env.RESEND_API_KEY
    const from = process.env.RESEND_FROM_EMAIL
    if (!resendKey || !from) {
      return NextResponse.json({ error: "Email provider not configured" }, { status: 500 })
    }

    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get("organization_id")

    const reminders = await sql`
      SELECT 
        r.*, 
        c.title as key_date_title,
        c.occurs_at,
        cases.case_number,
        cases.assigned_staff_id
      FROM case_key_date_reminders r
      JOIN case_key_dates c ON c.id = r.key_date_id AND c.organization_id = r.organization_id
      JOIN cases ON cases.id = r.case_id AND cases.organization_id = r.organization_id
      WHERE r.status = 'scheduled' AND r.send_at <= NOW() ${organizationId ? sql`AND r.organization_id = ${organizationId}` : sql``}
      ORDER BY r.send_at ASC
      LIMIT 25
    `

    if (reminders.length === 0) {
      return NextResponse.json({ processed: 0 })
    }

    const resend = new Resend(resendKey)
    let processedCount = 0

    for (const reminder of reminders) {
      const recipients = normalizeRecipients(reminder.send_to)
      if (recipients.length === 0) {
        await sql`
          UPDATE case_key_date_reminders
          SET status = 'failed', last_error = 'Sin destinatarios', updated_at = NOW()
          WHERE id = ${reminder.id} AND organization_id = ${reminder.organization_id}
        `
        continue
      }
      const toAddresses = recipients.map((recipient) =>
        recipient.name ? `${recipient.name} <${recipient.email}>` : recipient.email,
      )
      try {
        const emailResponse = await resend.emails.send({
          from,
          to: toAddresses,
          subject: reminder.subject,
          text: reminder.body || undefined,
          html: buildHtmlBody(reminder.body),
        })
        await sql`
          UPDATE case_key_date_reminders
          SET status = 'sent',
              sent_at = NOW(),
              provider_message_id = ${emailResponse.data?.id || null},
              last_error = NULL
          WHERE id = ${reminder.id} AND organization_id = ${reminder.organization_id}
        `
        if (reminder.assigned_staff_id) {
          await createNotification(
            reminder.organization_id,
            reminder.assigned_staff_id,
            `Recordatorio enviado: ${reminder.key_date_title}`,
            `Se envió el recordatorio programado del caso ${reminder.case_number}`,
            "reminder",
            reminder.case_id,
          )
        }
        await logActivity(
          reminder.organization_id,
          reminder.assigned_staff_id || null,
          "case_reminder_sent",
          `Recordatorio ${reminder.subject}`,
          reminder.case_id,
          {
            reminder_id: reminder.id,
          },
        )
        processedCount++
      } catch (error: any) {
        await sql`
          UPDATE case_key_date_reminders
          SET status = 'failed',
              last_error = ${error?.message || "Error enviando recordatorio"},
              updated_at = NOW()
          WHERE id = ${reminder.id} AND organization_id = ${reminder.organization_id}
        `
      }
    }

    return NextResponse.json({ processed: processedCount })
  } catch (error) {
    console.error("[v0] Failed to process reminders:", error)
    return NextResponse.json({ error: "Failed to process reminders" }, { status: 500 })
  }
}
