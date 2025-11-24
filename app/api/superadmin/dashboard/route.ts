import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireSuperAdmin } from "@/lib/superadmin-guard"

function toNumber(value: any) {
  if (value === null || value === undefined) return 0
  if (typeof value === "bigint") return Number(value)
  return Number(value)
}

export async function GET(request: NextRequest) {
  const auth = await requireSuperAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
    const [orgCounts] = await sql`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE is_active = true)::int AS active,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days')::int AS new_last_7,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days')::int AS new_last_30
      FROM organizations
    `

    const [userCounts] = await sql`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE role = 'admin')::int AS admins,
        COUNT(*) FILTER (WHERE role = 'staff')::int AS staff,
        COUNT(*) FILTER (WHERE role = 'client')::int AS clients,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days')::int AS new_last_30
      FROM users
    `

    const [caseCounts] = await sql`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE created_at >= date_trunc('day', NOW()))::int AS new_today,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days')::int AS new_last_7,
        COUNT(*) FILTER (WHERE status NOT IN ('completed', 'rejected'))::int AS open_cases,
        COUNT(*) FILTER (WHERE status = 'completed' AND completion_date >= NOW() - INTERVAL '30 days')::int AS completed_last_30
      FROM cases
    `

    const [messageStats] = await sql`
      SELECT
        COUNT(*) FILTER (WHERE created_at >= date_trunc('day', NOW()))::int AS messages_today,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days')::int AS total_last_30,
        COUNT(*) FILTER (WHERE status = 'read' AND created_at >= NOW() - INTERVAL '30 days')::int AS read_last_30
      FROM messages
    `

    const [docStats] = await sql`
      SELECT
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days')::int AS docs_last_7,
        COUNT(*) FILTER (WHERE status = 'pending')::int AS pending_docs,
        COUNT(*) FILTER (WHERE is_required = true AND status = 'pending')::int AS required_pending,
        SUM(file_size) AS total_storage
      FROM documents
    `

    const orgsPerWeek = await sql`
      SELECT to_char(date_trunc('week', created_at), 'YYYY-MM-DD') AS week, COUNT(*)::int AS count
      FROM organizations
      WHERE created_at >= date_trunc('week', NOW()) - INTERVAL '7 weeks'
      GROUP BY week
      ORDER BY week ASC
    `

    const casesPerDay = await sql`
      SELECT to_char(date_trunc('day', created_at), 'YYYY-MM-DD') AS day, COUNT(*)::int AS count
      FROM cases
      WHERE created_at >= date_trunc('day', NOW()) - INTERVAL '29 days'
      GROUP BY day
      ORDER BY day ASC
    `

    const casesByType = await sql`
      SELECT case_type AS type, COUNT(*)::int AS count
      FROM cases
      GROUP BY case_type
      ORDER BY count DESC
    `

    const casesByStatus = await sql`
      SELECT status, COUNT(*)::int AS count
      FROM cases
      GROUP BY status
      ORDER BY count DESC
    `

    const readRateLast30Days =
      Number(messageStats.total_last_30 || 0) > 0
        ? Number((Number(messageStats.read_last_30 || 0) / Number(messageStats.total_last_30 || 1)) * 100).toFixed(1)
        : "0"

    return NextResponse.json({
      organizations: {
        total: Number(orgCounts.total),
        active: Number(orgCounts.active),
        newLast7: Number(orgCounts.new_last_7),
        newLast30: Number(orgCounts.new_last_30),
      },
      users: {
        total: Number(userCounts.total),
        admins: Number(userCounts.admins),
        staff: Number(userCounts.staff),
        clients: Number(userCounts.clients),
        newLast30: Number(userCounts.new_last_30),
      },
      cases: {
        total: Number(caseCounts.total),
        newToday: Number(caseCounts.new_today),
        newLast7: Number(caseCounts.new_last_7),
        open: Number(caseCounts.open_cases),
        completedLast30: Number(caseCounts.completed_last_30),
      },
      messages: {
        today: Number(messageStats.messages_today),
        readRateLast30Days: Number(readRateLast30Days),
        totalLast30: Number(messageStats.total_last_30 || 0),
      },
      documents: {
        last7Days: Number(docStats.docs_last_7),
        pending: Number(docStats.pending_docs),
        requiredPending: Number(docStats.required_pending),
        totalStorageUsed: toNumber(docStats.total_storage),
      },
      charts: {
        orgsPerWeek,
        casesPerDay,
        casesByType,
        casesByStatus,
      },
    })
  } catch (error) {
    console.error("[superadmin/dashboard]", error)
    return NextResponse.json({ error: "No se pudieron cargar las metricas" }, { status: 500 })
  }
}
