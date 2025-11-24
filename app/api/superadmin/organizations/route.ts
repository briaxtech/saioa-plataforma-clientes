import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireSuperAdmin } from "@/lib/superadmin-guard"

export async function GET(request: NextRequest) {
  const auth = await requireSuperAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
    const { searchParams } = new URL(request.url)
    const statusFilter = searchParams.get("status")
    const activityFilter = searchParams.get("activity")
    const createdFrom = searchParams.get("createdFrom")
    const createdTo = searchParams.get("createdTo")
    const sort = searchParams.get("sort") || "created_desc"

    const filters = [sql`1=1`]
    if (statusFilter === "active") filters.push(sql`o.is_active = true`)
    if (statusFilter === "inactive") filters.push(sql`o.is_active = false`)
    if (createdFrom) filters.push(sql`o.created_at >= ${new Date(createdFrom)}`)
    if (createdTo) filters.push(sql`o.created_at <= ${new Date(createdTo)}`)
    if (activityFilter === "stale30") {
      filters.push(sql`(al.last_activity_at IS NULL OR al.last_activity_at < NOW() - INTERVAL '30 days')`)
    }

    let orderBy = sql`o.created_at DESC`
    if (sort === "name_asc") orderBy = sql`o.name ASC`
    if (sort === "name_desc") orderBy = sql`o.name DESC`
    if (sort === "created_asc") orderBy = sql`o.created_at ASC`
    if (sort === "activity_desc") orderBy = sql`al.last_activity_at DESC NULLS LAST`
    if (sort === "activity_asc") orderBy = sql`al.last_activity_at ASC NULLS LAST`
    if (sort === "cases_desc") orderBy = sql`COALESCE(ca.case_count, 0) DESC`
    if (sort === "cases_asc") orderBy = sql`COALESCE(ca.case_count, 0) ASC`

    const organizations = await sql`
      SELECT
        o.id,
        o.name,
        o.slug,
        o.domain,
        o.is_active,
        o.created_at,
        COALESCE(al.last_activity_at, o.created_at) AS last_activity_at,
        COALESCE(uc.admin_count, 0) AS admin_count,
        COALESCE(uc.staff_count, 0) AS staff_count,
        COALESCE(cc.client_count, 0) AS client_count,
        COALESCE(ca.case_count, 0) AS case_count
      FROM organizations o
      LEFT JOIN (
        SELECT organization_id,
          COUNT(*) FILTER (WHERE role = 'admin') AS admin_count,
          COUNT(*) FILTER (WHERE role = 'staff') AS staff_count
        FROM users
        GROUP BY organization_id
      ) uc ON uc.organization_id = o.id
      LEFT JOIN (
        SELECT organization_id, COUNT(*) AS client_count
        FROM clients
        GROUP BY organization_id
      ) cc ON cc.organization_id = o.id
      LEFT JOIN (
        SELECT organization_id, COUNT(*) AS case_count
        FROM cases
        GROUP BY organization_id
      ) ca ON ca.organization_id = o.id
      LEFT JOIN (
        SELECT organization_id, MAX(created_at) AS last_activity_at
        FROM activity_logs
        GROUP BY organization_id
      ) al ON al.organization_id = o.id
      WHERE ${sql.join(filters, sql` AND `)}
      ORDER BY ${orderBy}
    `

    return NextResponse.json({ organizations })
  } catch (error) {
    console.error("[superadmin/organizations]", error)
    return NextResponse.json({ error: "No se pudieron cargar organizaciones" }, { status: 500 })
  }
}
