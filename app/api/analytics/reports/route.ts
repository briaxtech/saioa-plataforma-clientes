import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireRole } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const user = await requireRole(["admin", "staff"])

    const { searchParams } = new URL(request.url)
    const reportType = searchParams.get("type")
    const startDate = searchParams.get("start_date")
    const endDate = searchParams.get("end_date")

    if (!reportType) {
      return NextResponse.json({ error: "Report type is required" }, { status: 400 })
    }

    let data: any

    switch (reportType) {
      case "case_summary":
        {
          const conditions = ["c.organization_id = $1"]
          const params: any[] = [user.organization_id]
          if (startDate) {
            conditions.push(`c.created_at >= $${params.length + 1}::date`)
            params.push(startDate)
          }
          if (endDate) {
            conditions.push(`c.created_at <= $${params.length + 1}::date`)
            params.push(endDate)
          }
          const query = `
            SELECT 
              c.*,
              client.name as client_name,
              client.email as client_email,
              staff.name as staff_name
            FROM cases c
            LEFT JOIN users client ON c.client_id = client.id AND client.organization_id = $1
            LEFT JOIN users staff ON c.assigned_staff_id = staff.id AND staff.organization_id = $1
            WHERE ${conditions.join(" AND ")}
            ORDER BY c.created_at DESC
          `
          data = await sql.unsafe(query, params)
        }
        break

      case "client_summary":
        {
          const query = `
            SELECT 
              cl.*,
              u.name,
              u.email,
              u.phone,
              u.country_of_origin,
              staff.name as staff_name,
              (SELECT COUNT(*) FROM cases WHERE client_id = u.id AND organization_id = $1) as total_cases,
              (SELECT COUNT(*) FROM cases WHERE client_id = u.id AND organization_id = $1 AND status = 'completed') as completed_cases
            FROM clients cl
            JOIN users u ON cl.user_id = u.id AND cl.organization_id = $1
            LEFT JOIN users staff ON cl.assigned_staff_id = staff.id AND staff.organization_id = $1
            WHERE cl.organization_id = $1
            ORDER BY cl.created_at DESC
          `
          data = await sql.unsafe(query, [user.organization_id])
        }
        break

      case "document_summary":
        {
          const conditions = ["d.organization_id = $1"]
          const params: any[] = [user.organization_id]
          if (startDate) {
            conditions.push(`d.created_at >= $${params.length + 1}::date`)
            params.push(startDate)
          }
          if (endDate) {
            conditions.push(`d.created_at <= $${params.length + 1}::date`)
            params.push(endDate)
          }
          const query = `
            SELECT 
              d.*,
              c.case_number,
              client.name as client_name,
              uploader.name as uploader_name
            FROM documents d
            JOIN cases c ON d.case_id = c.id AND c.organization_id = $1
            LEFT JOIN users client ON c.client_id = client.id AND client.organization_id = $1
            LEFT JOIN users uploader ON d.uploaded_by = uploader.id AND uploader.organization_id = $1
            WHERE ${conditions.join(" AND ")}
            ORDER BY d.created_at DESC
          `
          data = await sql.unsafe(query, params)
        }
        break

      case "performance":
        data = await sql`
          SELECT 
            u.id,
            u.name,
            u.email,
            COUNT(DISTINCT c.id) as total_cases,
            COUNT(DISTINCT CASE WHEN c.status = 'completed' THEN c.id END) as completed_cases,
            COUNT(DISTINCT CASE WHEN c.status = 'approved' THEN c.id END) as approved_cases,
            COUNT(DISTINCT CASE WHEN c.deadline_date < NOW() AND c.status NOT IN ('completed', 'approved') THEN c.id END) as overdue_cases,
            AVG(CASE WHEN c.completion_date IS NOT NULL AND c.filing_date IS NOT NULL 
              THEN EXTRACT(DAY FROM (c.completion_date - c.filing_date)) END) as avg_completion_days
          FROM users u
          LEFT JOIN cases c ON c.assigned_staff_id = u.id AND c.organization_id = ${user.organization_id}
          WHERE u.role IN ('admin', 'staff') AND u.organization_id = ${user.organization_id}
          GROUP BY u.id, u.name, u.email
          ORDER BY total_cases DESC
        `
        break

      default:
        return NextResponse.json({ error: "Invalid report type" }, { status: 400 })
    }

    return NextResponse.json({ report: data })
  } catch (error) {
    console.error("[v0] Failed to generate report:", error)
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 })
  }
}
