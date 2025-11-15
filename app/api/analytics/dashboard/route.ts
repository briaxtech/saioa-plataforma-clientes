import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireRole } from "@/lib/auth"

export async function GET() {
  try {
    await requireRole(["admin", "staff"])

    // Get case statistics by status
    const casesByStatus = await sql`
      SELECT 
        status,
        COUNT(*) as count
      FROM cases
      GROUP BY status
    `

    // Get case statistics by type
    const casesByType = await sql`
      SELECT 
        case_type,
        COUNT(*) as count
      FROM cases
      GROUP BY case_type
      ORDER BY count DESC
    `

    // Get monthly case creation trends (last 6 months)
    const monthlyCases = await sql`
      SELECT 
        DATE_TRUNC('month', created_at) as month,
        COUNT(*) as count
      FROM cases
      WHERE created_at >= NOW() - INTERVAL '6 months'
      GROUP BY month
      ORDER BY month
    `

    // Get average case completion time
    const avgCompletionTime = await sql`
      SELECT 
        AVG(EXTRACT(DAY FROM (completion_date - filing_date))) as avg_days
      FROM cases
      WHERE completion_date IS NOT NULL AND filing_date IS NOT NULL
    `

    // Get top performing staff
    const staffPerformance = await sql`
      SELECT 
        u.id,
        u.name,
        COUNT(c.id) as total_cases,
        COUNT(CASE WHEN c.status = 'completed' THEN 1 END) as completed_cases,
        COUNT(CASE WHEN c.status = 'approved' THEN 1 END) as approved_cases
      FROM users u
      LEFT JOIN cases c ON c.assigned_staff_id = u.id
      WHERE u.role IN ('admin', 'staff')
      GROUP BY u.id, u.name
      ORDER BY total_cases DESC
      LIMIT 10
    `

    // Get pending items summary
    const pendingSummary = await sql`
      SELECT 
        (SELECT COUNT(*) FROM documents WHERE status = 'pending') as pending_documents,
        (SELECT COUNT(*) FROM cases WHERE status = 'pending') as pending_cases,
        (SELECT COUNT(*) FROM cases WHERE deadline_date < NOW() AND status NOT IN ('completed', 'approved')) as overdue_cases
    `

    // Recent activity
    const recentActivity = await sql`
      SELECT 
        a.*,
        u.name as user_name,
        c.case_number
      FROM activity_logs a
      LEFT JOIN users u ON a.user_id = u.id
      LEFT JOIN cases c ON a.case_id = c.id
      ORDER BY a.created_at DESC
      LIMIT 10
    `

    return NextResponse.json({
      casesByStatus,
      casesByType,
      monthlyCases,
      avgCompletionTime: avgCompletionTime[0]?.avg_days || 0,
      staffPerformance,
      pendingSummary: pendingSummary[0],
      recentActivity,
    })
  } catch (error) {
    console.error("[v0] Failed to fetch analytics:", error)
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 })
  }
}
