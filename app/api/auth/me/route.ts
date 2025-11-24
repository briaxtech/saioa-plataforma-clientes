import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { sql } from "@/lib/db"
import type { BrandingSettings } from "@/lib/types"

export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const organizations = await sql`
      SELECT id, name, slug, domain, logo_url, support_email, metadata
      FROM organizations
      WHERE id = ${user.organization_id}
    `

    const organizationRow = organizations[0]
    const metadata = (organizationRow?.metadata as { branding?: BrandingSettings } | null) || {}
    const branding = { ...(metadata.branding || {}) }

    if (!branding.logo_url && organizationRow?.logo_url) {
      branding.logo_url = organizationRow.logo_url
    }

    const organization = organizationRow
      ? {
          id: organizationRow.id,
          name: organizationRow.name,
          slug: organizationRow.slug,
          domain: organizationRow.domain || null,
          logo_url: organizationRow.logo_url || null,
          support_email: organizationRow.support_email || null,
          branding: Object.keys(branding).length ? branding : undefined,
        }
      : null

    return NextResponse.json({ user, organization })
  } catch (error) {
    console.error("[v0] Get user error:", error)
    return NextResponse.json({ error: "Failed to get user" }, { status: 500 })
  }
}
