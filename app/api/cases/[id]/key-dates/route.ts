import { type NextRequest, NextResponse } from "next/server"
import { sql, logActivity } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"
import { upsertCalendarEvent } from "@/lib/google-calendar-service"

type KeyDateRecipient = { email: string; name?: string | null }

async function loadCase(caseId: string | number, organizationId: string) {
  const rows = await sql`
    SELECT
      c.id,
      c.title,
      c.case_number,
      c.client_id,
      c.assigned_staff_id,
      client.name as client_name,
      client.email as client_email
    FROM cases c
    LEFT JOIN users client ON client.id = c.client_id
    WHERE c.id = ${caseId} AND c.organization_id = ${organizationId}
  `
  return rows.at(0)
}

function parseRecipients(payload: any): KeyDateRecipient[] {
  if (!payload) return []
  const raw = Array.isArray(payload) ? payload : []
  return raw
    .map((entry) => {
      if (!entry) return null
      const email = typeof entry.email === "string" ? entry.email.trim() : ""
      if (!email) return null
      const name = typeof entry.name === "string" ? entry.name.trim() : null
      return { email, name }
    })
    .filter(Boolean) as KeyDateRecipient[]
}

function normalizeString(value?: string | null) {
  return value?.trim() ? value.trim() : null
}

function parseDate(value: any) {
  const date = value ? new Date(value) : null
  if (!date || Number.isNaN(date.getTime())) {
    return null
  }
  return date
}

async function attachReminderData(caseId: number, organizationId: string) {
  const reminders = await sql`
    SELECT * FROM case_key_date_reminders
    WHERE case_id = ${caseId} AND organization_id = ${organizationId}
  `
  return reminders.reduce<Record<number, any>>((acc, reminder: any) => {
    const parsedSendTo = reminder.send_to && typeof reminder.send_to === "string" ? JSON.parse(reminder.send_to) : reminder.send_to
    acc[reminder.key_date_id] = { ...reminder, send_to: parsedSendTo || [] }
    return acc
  }, {})
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const { id } = await params
    const caseRow = await loadCase(id, user.organization_id)
    if (!caseRow) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 })
    }
    if (user.role === "client" && caseRow.client_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const keyDates = await sql`
      SELECT *
      FROM case_key_dates
      WHERE case_id = ${caseRow.id} AND organization_id = ${user.organization_id}
      ORDER BY occurs_at ASC
    `
    const reminderMap = await attachReminderData(caseRow.id, user.organization_id)
    const result = keyDates.map((entry: any) => ({
      ...entry,
      notify_emails:
        entry.notify_emails && typeof entry.notify_emails === "string"
          ? JSON.parse(entry.notify_emails)
          : entry.notify_emails || [],
      reminder: reminderMap[entry.id] || null,
    }))
    return NextResponse.json({ key_dates: result })
  } catch (error) {
    console.error("[v0] Failed to fetch key dates:", error)
    return NextResponse.json({ error: "Failed to fetch key dates" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user || (user.role !== "admin" && user.role !== "staff")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const { id } = await params
    const caseRow = await loadCase(id, user.organization_id)
    if (!caseRow) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 })
    }

    const body = await request.json()
    const occursAt = parseDate(body.occurs_at)
    if (!occursAt) {
      return NextResponse.json({ error: "Fecha inválida" }, { status: 400 })
    }
    const title = normalizeString(body.title)
    if (!title) {
      return NextResponse.json({ error: "El título es obligatorio" }, { status: 400 })
    }

    const timezone = normalizeString(body.timezone)
    const notifyRecipients = parseRecipients(body.notify_emails)
    const durationMinutes = Number.isFinite(Number(body.duration_minutes)) ? Math.max(15, Number(body.duration_minutes)) : 60
    const notifyByEmail = Boolean(body.notify_by_email && notifyRecipients.length > 0)
    const remindMinutes =
      notifyByEmail && Number.isFinite(Number(body.remind_minutes_before))
        ? Math.max(5, Number(body.remind_minutes_before))
        : notifyByEmail
          ? 1440
          : null
    const emailSubject = normalizeString(body.email_subject) || `Recordatorio ${title}`
    const emailBody =
      normalizeString(body.email_body) ||
      `Hola,\n\nTe recordamos ${title.toLowerCase()} del expediente ${caseRow.case_number}. Fecha: ${occursAt.toLocaleString("es-ES")}.`
    const syncToCalendar = Boolean(body.sync_to_calendar)

    const createdRows = await sql`
      INSERT INTO case_key_dates (
        organization_id,
        case_id,
        title,
        description,
        type,
        occurs_at,
        timezone,
        duration_minutes,
        location,
        sync_to_calendar,
        notify_by_email,
        notify_emails,
        remind_minutes_before,
        email_subject,
        email_body,
        created_by,
        updated_by
      )
      VALUES (
        ${user.organization_id},
        ${caseRow.id},
        ${title},
        ${normalizeString(body.description)},
        ${normalizeString(body.type)},
        ${occursAt.toISOString()},
        ${timezone},
        ${durationMinutes},
        ${normalizeString(body.location)},
        ${syncToCalendar},
        ${notifyByEmail},
        ${notifyByEmail ? JSON.stringify(notifyRecipients) : null},
        ${remindMinutes},
        ${emailSubject},
        ${emailBody},
        ${user.id},
        ${user.id}
      )
      RETURNING *
    `

    let keyDate = createdRows[0]
    let reminderRecord = null

    if (syncToCalendar) {
      const calendarResponse = await upsertCalendarEvent({
        summary: `[${caseRow.case_number}] ${title}`,
        description: keyDate.description || undefined,
        location: keyDate.location || undefined,
        start: occursAt,
        end: new Date(occursAt.getTime() + durationMinutes * 60000),
        timezone,
        attendees: notifyRecipients.map((recipient) => ({
          email: recipient.email,
          displayName: recipient.name || undefined,
        })),
      })
      if (calendarResponse?.id) {
        const updated = await sql`
          UPDATE case_key_dates
          SET google_calendar_event_id = ${calendarResponse.id},
              google_calendar_html_link = ${calendarResponse.htmlLink},
              sync_to_calendar = TRUE,
              updated_at = NOW(),
              updated_by = ${user.id}
          WHERE id = ${keyDate.id} AND organization_id = ${user.organization_id}
          RETURNING *
        `
        keyDate = updated[0]
      }
    }

    if (notifyByEmail && remindMinutes) {
      const rawSendAt = new Date(occursAt.getTime() - remindMinutes * 60000)
      const sendAt = rawSendAt.getTime() > Date.now() ? rawSendAt : new Date(Date.now() + 60 * 1000)
      const reminderRows = await sql`
        INSERT INTO case_key_date_reminders (organization_id, key_date_id, case_id, send_at, send_to, subject, body)
        VALUES (
          ${user.organization_id},
          ${keyDate.id},
          ${caseRow.id},
          ${sendAt.toISOString()},
          ${JSON.stringify(notifyRecipients)},
          ${emailSubject},
          ${emailBody}
        )
        RETURNING *
      `
      reminderRecord = reminderRows[0]
    }

    await logActivity(user.organization_id, user.id, "case_key_date_created", `Agregó ${title}`, caseRow.id, {
      key_date_id: keyDate.id,
    })

    return NextResponse.json(
      {
        key_date: {
          ...keyDate,
          notify_emails: notifyRecipients,
          reminder: reminderRecord
            ? {
                ...reminderRecord,
                send_to: notifyRecipients,
              }
            : null,
        },
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("[v0] Failed to create key date:", error)
    return NextResponse.json({ error: "Failed to create key date" }, { status: 500 })
  }
}
