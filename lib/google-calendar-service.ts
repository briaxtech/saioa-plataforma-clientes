import { google, type calendar_v3 } from "googleapis"

const SCOPES = ["https://www.googleapis.com/auth/calendar"]

let calendarClient: calendar_v3.Calendar | null = null

const calendarId = process.env.GOOGLE_CALENDAR_ID || process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL

const hasCalendarCredentials = Boolean(process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_PRIVATE_KEY && calendarId)

function getCalendarClient() {
  if (!hasCalendarCredentials) {
    return null
  }
  if (calendarClient) {
    return calendarClient
  }
  const privateKey = (process.env.GOOGLE_PRIVATE_KEY || "").replace(/\\n/g, "\n")
  const auth = new google.auth.JWT(process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL, undefined, privateKey, SCOPES)
  calendarClient = google.calendar({ version: "v3", auth })
  return calendarClient
}

type UpsertCalendarEventInput = {
  eventId?: string | null
  summary: string
  description?: string | null
  location?: string | null
  start: Date
  end: Date
  timezone?: string | null
  attendees?: { email: string; displayName?: string | null }[]
  reminders?: { method: "email" | "popup"; minutes: number }[]
}

export async function upsertCalendarEvent(input: UpsertCalendarEventInput) {
  try {
    const calendar = getCalendarClient()
    if (!calendar || !calendarId) {
      return null
    }
    const { eventId, summary, description, location, start, end, timezone, attendees = [], reminders } = input
    const requestBody: calendar_v3.Schema$Event = {
      summary,
      description: description || undefined,
      location: location || undefined,
      start: {
        dateTime: start.toISOString(),
        timeZone: timezone || undefined,
      },
      end: {
        dateTime: end.toISOString(),
        timeZone: timezone || undefined,
      },
      attendees: attendees.length
        ? attendees.map((attendee) => ({
            email: attendee.email,
            displayName: attendee.displayName || undefined,
          }))
        : undefined,
      reminders: reminders?.length
        ? {
            useDefault: false,
            overrides: reminders.map((reminder) => ({
              method: reminder.method,
              minutes: reminder.minutes,
            })),
          }
        : undefined,
    }

    const response = eventId
      ? await calendar.events.patch({
          calendarId,
          eventId,
          requestBody,
          sendUpdates: "all",
        })
      : await calendar.events.insert({
          calendarId,
          requestBody,
          sendUpdates: "all",
        })

    return {
      id: response.data.id || null,
      htmlLink: response.data.htmlLink || null,
    }
  } catch (error) {
    console.error("[calendar] Failed to upsert event", error)
    return null
  }
}

export async function deleteCalendarEvent(eventId?: string | null) {
  try {
    const calendar = getCalendarClient()
    if (!calendar || !calendarId || !eventId) {
      return
    }
    await calendar.events.delete({
      calendarId,
      eventId,
      sendUpdates: "all",
    })
  } catch (error) {
    console.error("[calendar] Failed to delete event", error)
  }
}

export function isCalendarIntegrationEnabled() {
  return hasCalendarCredentials
}
