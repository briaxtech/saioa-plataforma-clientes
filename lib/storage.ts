import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const documentBucket = process.env.SUPABASE_STORAGE_BUCKET || "case-documents"
const brandingBucket = process.env.SUPABASE_BRANDING_BUCKET || documentBucket
const SIGNED_URL_TTL_SECONDS = Number(process.env.SUPABASE_SIGNED_URL_TTL || 60 * 60) // default 1h

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn(
    "[storage] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Document uploads will fail until the environment is configured.",
  )
}

const supabase =
  supabaseUrl && supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false } })
    : null
const ensuredBuckets = new Set<string>()

const sanitizeFilename = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9.-]+/g, "-")
    .replace(/^-+|-+$/g, "")

async function ensureBucketExists(bucketName: string) {
  if (!supabase || ensuredBuckets.has(bucketName)) return

  const { data, error } = await supabase.storage.getBucket(bucketName)
  if (data) {
    ensuredBuckets.add(bucketName)
    return
  }

  if (error && typeof error.message === "string" && /not found/i.test(error.message)) {
    const { error: createError } = await supabase.storage.createBucket(bucketName, { public: false })
    if (createError) {
      throw createError
    }
    ensuredBuckets.add(bucketName)
    return
  }

  if (error) {
    throw error
  }
}

export async function uploadCaseDocument(options: {
  organizationId: string
  caseId: number | string
  fileName: string
  buffer: Buffer
  contentType?: string
  pathPrefix?: string
  uploaderId?: string
}) {
  if (!supabase) {
    throw new Error("Supabase storage is not configured")
  }

  await ensureBucketExists(documentBucket)

  const prefix = options.pathPrefix ? `${options.pathPrefix}/` : ""
  const uploaderSegment = options.uploaderId ? `${options.uploaderId}/` : ""
  const path = `${prefix}${options.organizationId}/cases/${options.caseId}/${uploaderSegment}${Date.now()}-${sanitizeFilename(options.fileName)}`
  const { error } = await supabase.storage.from(documentBucket).upload(path, options.buffer, {
    contentType: options.contentType || "application/octet-stream",
    upsert: false,
  })

  if (error) {
    throw error
  }

  const { data: signed } = await supabase.storage.from(documentBucket).createSignedUrl(path, SIGNED_URL_TTL_SECONDS)
  return {
    path,
    publicUrl: signed?.signedUrl || null,
    signedUrl: signed?.signedUrl || null,
  }
}

export async function deleteCaseDocument(path?: string | null) {
  if (!supabase || !path) return
  await supabase.storage.from(documentBucket).remove([path])
}

export async function getSignedDocumentUrl(path?: string | null, expiresInSeconds = 3600) {
  if (!supabase || !path) return null
  const { data, error } = await supabase.storage.from(documentBucket).createSignedUrl(path, expiresInSeconds)
  if (error) {
    console.error("[storage] Failed to create signed URL", error)
    return null
  }
  return data.signedUrl
}

export async function uploadOrganizationLogo(options: {
  organizationId: string
  fileName: string
  buffer: Buffer
  contentType?: string
}) {
  if (!supabase) {
    throw new Error("Supabase storage is not configured")
  }

  await ensureBucketExists(brandingBucket)

  const safeName = sanitizeFilename(options.fileName || "logo")
  const path = `${options.organizationId}/branding/${Date.now()}-${safeName}`

  const { error } = await supabase.storage.from(brandingBucket).upload(path, options.buffer, {
    contentType: options.contentType || "image/png",
    upsert: false,
  })

  if (error) {
    throw error
  }

  const { data } = supabase.storage.from(brandingBucket).getPublicUrl(path)
  return {
    path,
    publicUrl: data.publicUrl,
  }
}

export async function deleteOrganizationAsset(path?: string | null) {
  if (!supabase || !path) return
  await supabase.storage.from(brandingBucket).remove([path])
}
