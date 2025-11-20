import { type NextRequest, NextResponse } from "next/server"
import { sql, logActivity } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"
import { deleteCalendarEvent, upsertCalendarEvent } from "@/lib/google-calendar-service"

type Recipient = { email: string; name?: string | null }

async function loadCase(caseId: string | number, organizationId: string) {
  const rows = await sql`
    SELECT id, case_number, client_id
    FROM cases
    WHERE id = ${caseId} AND organization_id = ${organizationId}
  `
  return rows.at(0)
}

const parseRecipients = (data: any): Recipient[] => {
  if (!data) return []
  const raw = Array.isArray(data) ? data : []
  return raw
    .map((entry) => {
      if (!entry) return null
      const email = typeof entry.email === "string" ? entry.email.trim() : ""
      if (!email) return null
      const name = typeof entry.name === "string" ? entry.name.trim() : null
      return { email, name }
    })
    .filter(Boolean) as Recipient[]
}

const normalizeString = (value?: string | null) => (value?.trim() ? value.trim() : null)

const parseDate = (value: any) => {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; keyDateId: string }> },
) {
  try {
    const user = await getCurrentUser()
    if (!user || (user.role !== "admin" && user.role !== "staff")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id, keyDateId } = await params
    const caseRow = await loadCase(id, user.organization_id)
    if (!caseRow) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 })
    }

    const keyDateRows = await sql`
      SELECT *
      FROM case_key_dates
      WHERE id = ${keyDateId} AND case_id = ${caseRow.id} AND organization_id = ${user.organization_id}
    `
    if (keyDateRows.length === 0) {
      return NextResponse.json({ error: "Key date not found" }, { status: 404 })
    }
    const currentKeyDate = keyDateRows[0]
    const currentRecipients =
      currentKeyDate.notify_emails && typeof currentKeyDate.notify_emails === "string"
        ? JSON.parse(currentKeyDate.notify_emails)
        : currentKeyDate.notify_emails || []

    const reminderRows = await sql`
      SELECT * FROM case_key_date_reminders
      WHERE key_date_id = ${keyDateId} AND organization_id = ${user.organization_id}
    `
    const currentReminder = reminderRows.at(0)

    const body = await request.json()
    const updates: string[] = []
    const values: any[] = []
    let paramIndex = 1

    const occursAt = body.occurs_at ? parseDate(body.occurs_at) : null
    const timezone = body.timezone !== undefined ? normalizeString(body.timezone) : currentKeyDate.timezone
    const durationMinutes =
      body.duration_minutes !== undefined
        ? Math.max(15, Number.isFinite(Number(body.duration_minutes)) ? Number(body.duration_minutes) : 60)
        : currentKeyDate.duration_minutes || 60
    const notifyRecipients =
      body.notify_emails !== undefined ? parseRecipients(body.notify_emails) : (currentRecipients as Recipient[])
    const notifyByEmail =
      body.notify_by_email !== undefined ? Boolean(body.notify_by_email) : Boolean(currentKeyDate.notify_by_email)
    const remindMinutes =
      body.remind_minutes_before !== undefined
        ? Number.isFinite(Number(body.remind_minutes_before))
          ? Math.max(5, Number(body.remind_minutes_before))
          : null
        : currentKeyDate.remind_minutes_before
    const emailSubject =
      body.email_subject !== undefined
        ? normalizeString(body.email_subject)
        : normalizeString(currentKeyDate.email_subject)
    const emailBody =
      body.email_body !== undefined
        ? normalizeString(body.email_body)
        : normalizeString(currentKeyDate.email_body)
    const syncToCalendar =
      body.sync_to_calendar !== undefined ? Boolean(body.sync_to_calendar) : Boolean(currentKeyDate.sync_to_calendar)

    const maybeUpdate = (column: string, value: any) => {
      updates.push(`${column} = $${paramIndex}`)
      values.push(value)
      paramIndex++
    }

    if (occursAt) {
      maybeUpdate("occurs_at", occursAt.toISOString())
    }
    if (body.title !== undefined) {
      maybeUpdate("title", normalizeString(body.title))
    }
    if (body.description !== undefined) {
      maybeUpdate("description", normalizeString(body.description))
    }
    if (body.type !== undefined) {
      maybeUpdate("type", normalizeString(body.type))
    }
    if (body.location !== undefined) {
      maybeUpdate("location", normalizeString(body.location))
    }
    if (body.timezone !== undefined) {
      maybeUpdate("timezone", timezone)
    }
    if (body.duration_minutes !== undefined) {
      maybeUpdate("duration_minutes", durationMinutes)
    }
    if (body.notify_emails !== undefined) {
      maybeUpdate("notify_emails", notifyRecipients.length ? JSON.stringify(notifyRecipients) : null)
    }
    if (body.notify_by_email !== undefined) {
      maybeUpdate("notify_by_email", notifyByEmail && notifyRecipients.length > 0)
    }
    if (body.remind_minutes_before !== undefined) {
      maybeUpdate("remind_minutes_before", remindMinutes)
    }
    if (body.email_subject !== undefined) {
      maybeUpdate("email_subject", emailSubject)
    }
    if (body.email_body !== undefined) {
      maybeUpdate("email_body", emailBody)
    }
    if (body.sync_to_calendar !== undefined) {
      maybeUpdate("sync_to_calendar", syncToCalendar)
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 })
    }
    updates.push(`updated_at = NOW()`)
    updates.push(`updated_by = $${paramIndex}`)
    values.push(user.id)

    const query = `
      UPDATE case_key_dates
      SET ${updates.join(", ")}
      WHERE id = $${paramIndex + 1} AND case_id = $${paramIndex + 2} AND organization_id = $${paramIndex + 3}
      RETURNING *
    `
    values.push(keyDateId, caseRow.id, user.organization_id)
    const updatedRows = await sql.unsafe(query, values)
    const updatedKeyDate = updatedRows[0]

    if (syncToCalendar) {
      const calendarResponse = await upsertCalendarEvent({
        eventId: updatedKeyDate.google_calendar_event_id,
        summary: `[${caseRow.case_number}] ${updatedKeyDate.title}`,
        description: updatedKeyDate.description || undefined,
        location: updatedKeyDate.location || undefined,
        start: occursAt ? occursAt : new Date(updatedKeyDate.occurs_at),
        end: new Date((occursAt ? occursAt : new Date(updatedKeyDate.occurs_at)).getTime() + durationMinutes * 60000),
        timezone: timezone || updatedKeyDate.timezone || undefined,
        attendees: notifyRecipients.map((recipient) => ({
          email: recipient.email,
          displayName: recipient.name || undefined,
        })),
      })
      if (calendarResponse?.id) {
        await sql`
          UPDATE case_key_dates
          SET google_calendar_event_id = ${calendarResponse.id},
              google_calendar_html_link = ${calendarResponse.htmlLink},
              updated_at = NOW()
          WHERE id = ${updatedKeyDate.id}
        `
        updatedKeyDate.google_calendar_event_id = calendarResponse.id
        updatedKeyDate.google_calendar_html_link = calendarResponse.htmlLink
      }
    } else if (!syncToCalendar && updatedKeyDate.google_calendar_event_id) {
      await deleteCalendarEvent(updatedKeyDate.google_calendar_event_id)
      await sql`
        UPDATE case_key_dates
        SET google_calendar_event_id = NULL,
            google_calendar_html_link = NULL,
            updated_at = NOW()
        WHERE id = ${updatedKeyDate.id}
      `
      updatedKeyDate.google_calendar_event_id = null
      updatedKeyDate.google_calendar_html_link = null
    }

    let reminderRecord = currentReminder
    const shouldHaveReminder = notifyByEmail && notifyRecipients.length > 0 && remindMinutes

    if (shouldHaveReminder) {
      const baseDate = occursAt ? occursAt : new Date(updatedKeyDate.occurs_at)
      const rawSendAt = new Date(baseDate.getTime() - (remindMinutes as number) * 60000)
      const sendAt = rawSendAt.getTime() > Date.now() ? rawSendAt : new Date(Date.now() + 60 * 1000)
      if (reminderRecord) {
        const reminderUpdate = `
          UPDATE case_key_date_reminders
          SET send_at = $1,
              send_to = $2,
              subject = $3,
              body = $4,
              status = 'scheduled',
              sent_at = NULL,
              last_error = NULL,
              updated_at = NOW()
          WHERE id = $5 AND organization_id = $6
          RETURNING *
        `
        const nextReminder = await sql.query(reminderUpdate, [
          sendAt.toISOString(),
          JSON.stringify(notifyRecipients),
          emailSubject,
          emailBody,
          reminderRecord.id,
          user.organization_id,
        ])
        reminderRecord = nextReminder[0]
      } else {
        const inserted = await sql`
          INSERT INTO case_key_date_reminders (organization_id, key_date_id, case_id, send_at, send_to, subject, body)
          VALUES (
            ${user.organization_id},
            ${updatedKeyDate.id},
            ${caseRow.id},
            ${sendAt.toISOString()},
            ${JSON.stringify(notifyRecipients)},
            ${emailSubject},
            ${emailBody}
          )
          RETURNING *
        `
        reminderRecord = inserted[0]
      }
    } else if (currentReminder) {
      await sql`
        DELETE FROM case_key_date_reminders
        WHERE id = ${currentReminder.id} AND organization_id = ${user.organization_id}
      `
      reminderRecord = null
    }

    await logActivity(user.organization_id, user.id, "case_key_date_updated", `Actualizó ${updatedKeyDate.title}`, caseRow.id, {
      key_date_id: updatedKeyDate.id,
    })

    return NextResponse.json({
      key_date: {
        ...updatedKeyDate,
        notify_emails: notifyRecipients,
        reminder: reminderRecord
          ? {
              ...reminderRecord,
              send_to: notifyRecipients,
            }
          : null,
      },
    })
  } catch (error) {
    console.error("[v0] Failed to update key date:", error)
    return NextResponse.json({ error: "Failed to update key date" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; keyDateId: string }> },
) {
  try {
    const user = await getCurrentUser()
    if (!user || (user.role !== "admin" && user.role !== "staff")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id, keyDateId } = await params
    const caseRow = await loadCase(id, user.organization_id)
    if (!caseRow) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 })
    }

    const keyDateRows = await sql`
      SELECT * FROM case_key_dates
      WHERE id = ${keyDateId} AND case_id = ${caseRow.id} AND organization_id = ${user.organization_id}
    `
    if (keyDateRows.length === 0) {
      return NextResponse.json({ error: "Key date not found" }, { status: 404 })
    }
    const keyDate = keyDateRows[0]

    await sql`
      DELETE FROM case_key_date_reminders
      WHERE key_date_id = ${keyDateId} AND organization_id = ${user.organization_id}
    `
    if (keyDate.google_calendar_event_id) {
      await deleteCalendarEvent(keyDate.google_calendar_event_id)
    }

    await sql`
      DELETE FROM case_key_dates
      WHERE id = ${keyDateId} AND organization_id = ${user.organization_id}
    `

    await logActivity(user.organization_id, user.id, "case_key_date_deleted", `Eliminó ${keyDate.title}`, caseRow.id, {
      key_date_id: keyDate.id,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Failed to delete key date:", error)
    return NextResponse.json({ error: "Failed to delete key date" }, { status: 500 })
  }
}
