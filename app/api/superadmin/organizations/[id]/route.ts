import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireSuperAdmin } from "@/lib/superadmin-guard"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireSuperAdmin(request)
  if (auth instanceof NextResponse) return auth

  const organizationId = params.id

  try {
    const orgRows = await sql`
      SELECT id, name, slug, domain, logo_url, is_active, metadata, created_at
      FROM organizations
      WHERE id = ${organizationId}
      LIMIT 1
    `
    const organization = orgRows[0]
    if (!organization) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 })
    }

    const [lastActivity] = await sql`
      SELECT MAX(created_at) AS last_activity_at
      FROM activity_logs
      WHERE organization_id = ${organizationId}
    `

    const [userCounts] = await sql`
      SELECT
        COUNT(*) FILTER (WHERE role = 'admin')::int AS admins,
        COUNT(*) FILTER (WHERE role = 'staff')::int AS staff,
        COUNT(*) FILTER (WHERE role = 'client')::int AS clients
      FROM users
      WHERE organization_id = ${organizationId}
    `

    const [clients] = await sql`
      SELECT COUNT(*)::int AS client_count
      FROM clients
      WHERE organization_id = ${organizationId}
    `

    const [caseCountRow] = await sql`
      SELECT COUNT(*)::int AS case_count
      FROM cases
      WHERE organization_id = ${organizationId}
    `

    const casesByStatus = await sql`
      SELECT status, COUNT(*)::int AS count
      FROM cases
      WHERE organization_id = ${organizationId}
      GROUP BY status
      ORDER BY count DESC
    `

    const casesByLifecycle = await sql`
      SELECT lifecycle_status, COUNT(*)::int AS count
      FROM cases
      WHERE organization_id = ${organizationId}
      GROUP BY lifecycle_status
      ORDER BY count DESC
    `

    const casesByType = await sql`
      SELECT case_type, COUNT(*)::int AS count
      FROM cases
      WHERE organization_id = ${organizationId}
      GROUP BY case_type
      ORDER BY count DESC
    `

    const [openCasesRow] = await sql`
      SELECT COUNT(*)::int AS open_cases
      FROM cases
      WHERE organization_id = ${organizationId}
        AND status NOT IN ('completed', 'rejected')
    `

    const [avgCaseDurationRow] = await sql`
      SELECT AVG(EXTRACT(EPOCH FROM (completion_date - created_at))/86400) AS avg_days
      FROM cases
      WHERE organization_id = ${organizationId}
        AND completion_date IS NOT NULL
    `

    const upcomingDeadlines = await sql`
      SELECT id, title, status, deadline_date, case_type
      FROM cases
      WHERE organization_id = ${organizationId}
        AND deadline_date IS NOT NULL
        AND deadline_date >= NOW()
        AND deadline_date <= NOW() + INTERVAL '30 days'
        AND status NOT IN ('completed', 'rejected')
      ORDER BY deadline_date ASC
      LIMIT 20
    `

    const overdueCases = await sql`
      SELECT id, title, status, deadline_date, case_type
      FROM cases
      WHERE organization_id = ${organizationId}
        AND deadline_date IS NOT NULL
        AND deadline_date < NOW()
        AND status NOT IN ('completed', 'rejected')
      ORDER BY deadline_date ASC
      LIMIT 20
    `

    const [docMetrics] = await sql`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE is_required = true)::int AS required_total,
        COUNT(*) FILTER (WHERE is_required = true AND status = 'pending')::int AS pending_required,
        COUNT(*) FILTER (WHERE status = 'pending')::int AS pending_any,
        COUNT(*) FILTER (WHERE status = 'submitted')::int AS submitted,
        COUNT(*) FILTER (WHERE status = 'approved')::int AS approved,
        COUNT(*) FILTER (WHERE status = 'rejected')::int AS rejected,
        COUNT(*) FILTER (WHERE status = 'requires_action')::int AS requires_action
      FROM documents
      WHERE organization_id = ${organizationId}
    `

    const documentsByStatus = await sql`
      SELECT status, COUNT(*)::int AS count
      FROM documents
      WHERE organization_id = ${organizationId}
      GROUP BY status
    `

    const [avgRequiredPerCaseRow] = await sql`
      SELECT AVG(required_count)::float AS avg_required
      FROM (
        SELECT case_id, COUNT(*) FILTER (WHERE is_required = true) AS required_count
        FROM documents
        WHERE organization_id = ${organizationId}
        GROUP BY case_id
      ) AS agg
    `

    const [messageStats] = await sql`
      SELECT
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days')::int AS last_30,
        COUNT(*) FILTER (WHERE status = 'read' AND created_at >= NOW() - INTERVAL '30 days')::int AS read_last_30
      FROM messages
      WHERE organization_id = ${organizationId}
    `

    const [casesWithoutRecentMessagesCount] = await sql`
      SELECT COUNT(*) AS count
      FROM cases
      WHERE organization_id = ${organizationId}
        AND id NOT IN (
          SELECT DISTINCT case_id
          FROM messages
          WHERE organization_id = ${organizationId}
            AND created_at >= NOW() - INTERVAL '14 days'
        )
    `

    const casesWithoutRecentMessages = await sql`
      SELECT id, title, status, deadline_date
      FROM cases
      WHERE organization_id = ${organizationId}
        AND id NOT IN (
          SELECT DISTINCT case_id
          FROM messages
          WHERE organization_id = ${organizationId}
            AND created_at >= NOW() - INTERVAL '14 days'
        )
      ORDER BY created_at DESC
      LIMIT 20
    `

    const [keyDatesCount] = await sql`
      SELECT COUNT(*)::int AS count
      FROM case_key_dates
      WHERE organization_id = ${organizationId}
        AND occurs_at > NOW()
    `

    const [reminderStats] = await sql`
      SELECT
        COUNT(*) FILTER (WHERE status = 'scheduled')::int AS scheduled,
        COUNT(*) FILTER (WHERE status = 'sent' AND sent_at >= NOW() - INTERVAL '30 days')::int AS sent_last_30,
        COUNT(*) FILTER (WHERE (last_error IS NOT NULL OR status ILIKE 'error%') AND send_at <= NOW())::int AS errors
      FROM case_key_date_reminders
      WHERE organization_id = ${organizationId}
    `

    return NextResponse.json({
      organization: {
        ...organization,
        last_activity_at: lastActivity?.last_activity_at || null,
      },
      summary: {
        admins: Number(userCounts.admins || 0),
        staff: Number(userCounts.staff || 0),
        clients: Number(userCounts.clients || 0),
        clientCount: Number(clients.client_count || 0),
        caseCount: Number(caseCountRow.case_count || 0),
      },
      cases: {
        caseCount: Number(caseCountRow.case_count || 0),
        casesByStatus,
        casesByLifecycle,
        casesByType,
        openCases: Number(openCasesRow.open_cases || 0),
        avgCaseDurationDays: avgCaseDurationRow?.avg_days ? Number(avgCaseDurationRow.avg_days) : null,
        upcomingDeadlines,
        overdueCases,
      },
      documents: {
        totalDocuments: Number(docMetrics.total || 0),
        requiredDocuments: Number(docMetrics.required_total || 0),
        pendingRequiredDocuments: Number(docMetrics.pending_required || 0),
        pendingDocuments: Number(docMetrics.pending_any || 0),
        documentsByStatus,
        averageRequiredPerCase: avgRequiredPerCaseRow?.avg_required ? Number(avgRequiredPerCaseRow.avg_required) : 0,
      },
      messaging: {
        messagesLast30Days: Number(messageStats.last_30 || 0),
        readRateLast30Days:
          Number(messageStats.last_30 || 0) > 0
            ? Number(((Number(messageStats.read_last_30 || 0) / Number(messageStats.last_30 || 1)) * 100).toFixed(1))
            : 0,
        casesWithoutRecentMessagesCount: Number(casesWithoutRecentMessagesCount.count || 0),
        casesWithoutRecentMessages,
      },
      keyDates: {
        activeKeyDates: Number(keyDatesCount.count || 0),
        remindersScheduled: Number(reminderStats.scheduled || 0),
        remindersSentLast30Days: Number(reminderStats.sent_last_30 || 0),
        remindersWithErrors: Number(reminderStats.errors || 0),
      },
    })
  } catch (error) {
    console.error("[superadmin/organizations/id]", error)
    return NextResponse.json({ error: "No se pudieron cargar los detalles" }, { status: 500 })
  }
}
