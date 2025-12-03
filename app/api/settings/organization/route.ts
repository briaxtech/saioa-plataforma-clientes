import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { logActivity, sql } from "@/lib/db"
import { mergeBrandingSettings, sanitizeBrandingPayload } from "@/lib/branding"
import { deleteOrganizationAsset, uploadOrganizationLogo } from "@/lib/storage"
import type { BrandingSettings } from "@/lib/types"

const RESERVED_SLUGS = new Set(["login", "admin", "client", "api", "superadmin", "auth"])

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function mapOrganization(row: any) {
  const metadata = (row?.metadata as { branding?: BrandingSettings } | null) || {}
  const brandingMeta = metadata.branding || {}
  const branding: BrandingSettings = {}

  if (brandingMeta.logo_url) branding.logo_url = brandingMeta.logo_url
  if (brandingMeta.logo_path) branding.logo_path = brandingMeta.logo_path
  if (!branding.logo_url && row?.logo_url) branding.logo_url = row.logo_url

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    domain: row.domain || null,
    logo_url: row.logo_url || null,
    support_email: row.support_email || null,
    branding: Object.keys(branding).length ? branding : undefined,
  }
}

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const rows = await sql`
      SELECT id, name, slug, domain, logo_url, support_email, metadata
      FROM organizations
      WHERE id = ${user.organization_id}
    `

    if (!rows.length) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 })
    }

    return NextResponse.json({ organization: mapOrganization(rows[0]) })
  } catch (error) {
    console.error("[v0] Failed to load organization settings:", error)
    return NextResponse.json({ error: "Failed to load organization settings" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const contentType = request.headers.get("content-type") || ""
    const isMultipart = contentType.includes("multipart/form-data")

    let name: string | undefined
    let support_email: string | undefined
    let logo_url: string | undefined
    let slug: string | undefined
    let brandingInput: any
    let logoFile: File | null = null

    if (isMultipart) {
      const form = await request.formData()
      const getText = (key: string) => {
        const value = form.get(key)
        return typeof value === "string" ? value : undefined
      }

      name = getText("name")
      support_email = getText("support_email")
      logo_url = getText("logo_url")
      slug = getText("slug")

      const brandingRaw = getText("branding")
      if (brandingRaw) {
        try {
          brandingInput = JSON.parse(brandingRaw)
        } catch {
          return NextResponse.json({ error: "branding debe ser JSON valido" }, { status: 400 })
        }
      }

      const maybeFile = form.get("logo_file")
      if (maybeFile instanceof Blob && maybeFile.size > 0) {
        logoFile = maybeFile as File
      }
    } else {
      const body = await request.json().catch(() => ({}))
      name = body.name
      support_email = body.support_email
      logo_url = body.logo_url
      slug = body.slug
      brandingInput = body.branding
    }

    const rows = await sql`
      SELECT id, name, slug, domain, logo_url, support_email, metadata
      FROM organizations
      WHERE id = ${user.organization_id}
    `

    if (!rows.length) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 })
    }

    const current = rows[0]
    const metadata = (current.metadata as { branding?: BrandingSettings } | null) || {}
    const previousLogoPath = metadata.branding?.logo_path || null

    const updates: string[] = []
    const values: any[] = []
    let paramIndex = 1

    const trimmedName = typeof name === "string" ? name.trim() : undefined
    const trimmedSupportEmail = typeof support_email === "string" ? support_email.trim() : undefined
    const trimmedLogo = typeof logo_url === "string" ? logo_url.trim() : undefined
    const trimmedSlug = typeof slug === "string" && slug.trim() ? slugify(slug) : undefined

    if (trimmedName) {
      updates.push(`name = $${paramIndex++}`)
      values.push(trimmedName)
    }

    if (typeof support_email === "string") {
      updates.push(`support_email = $${paramIndex++}`)
      values.push(trimmedSupportEmail || null)
    }

    if (trimmedSlug) {
      if (RESERVED_SLUGS.has(trimmedSlug)) {
        return NextResponse.json({ error: "Slug no disponible" }, { status: 400 })
      }
      const slugConflict = await sql`
        SELECT id FROM organizations WHERE slug = ${trimmedSlug} AND id != ${user.organization_id} LIMIT 1
      `
      if (slugConflict.length > 0) {
        return NextResponse.json({ error: "Ese slug ya esta en uso" }, { status: 409 })
      }
      updates.push(`slug = $${paramIndex++}`)
      values.push(trimmedSlug)
    }

    let uploadedLogo: { path: string; publicUrl: string } | null = null
    let brandingState: BrandingSettings = metadata.branding || {}
    let brandingChanged = false
    const applyBrandingUpdate = (partial: BrandingSettings) => {
      brandingState = mergeBrandingSettings(brandingState, partial)
      brandingChanged = true
    }

    if (logoFile) {
      const buffer = Buffer.from(await logoFile.arrayBuffer())
      uploadedLogo = await uploadOrganizationLogo({
        organizationId: user.organization_id,
        fileName: (logoFile as File).name || "logo.png",
        buffer,
        contentType: logoFile.type || "image/png",
      })
      updates.push(`logo_url = $${paramIndex++}`)
      values.push(uploadedLogo.publicUrl)
      applyBrandingUpdate({ logo_url: uploadedLogo.publicUrl, logo_path: uploadedLogo.path })
    } else if (typeof logo_url === "string") {
      updates.push(`logo_url = $${paramIndex++}`)
      values.push(trimmedLogo || null)
      applyBrandingUpdate({ logo_url: trimmedLogo || null })
    }

    if (brandingInput) {
      const sanitizedBranding = sanitizeBrandingPayload(brandingInput)
      if (sanitizedBranding.logo_url || sanitizedBranding.logo_path) {
        applyBrandingUpdate(sanitizedBranding)
      }
    }

    let mergedMetadata = metadata
    if (brandingChanged) {
      mergedMetadata = { ...metadata, branding: brandingState }
      updates.push(`metadata = $${paramIndex++}`)
      values.push(mergedMetadata)
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 })
    }

    updates.push(`updated_at = NOW()`)

    const updated = await sql.unsafe(
      `
        UPDATE organizations
        SET ${updates.join(", ")}
        WHERE id = $${paramIndex}
        RETURNING id, name, slug, domain, logo_url, support_email, metadata
      `,
      [...values, user.organization_id],
    )

    if (uploadedLogo && previousLogoPath && previousLogoPath !== uploadedLogo.path) {
      await deleteOrganizationAsset(previousLogoPath)
    }

    await logActivity(user.organization_id, user.id, "branding_updated", "Actualizaste la marca del espacio")

    return NextResponse.json({ organization: mapOrganization(updated[0]) })
  } catch (error) {
    console.error("[v0] Failed to update organization settings:", error)
    return NextResponse.json({ error: "Failed to update organization settings" }, { status: 500 })
  }
}
