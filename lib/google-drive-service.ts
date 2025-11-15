import { createSign } from "crypto"
import { Buffer } from "node:buffer"

const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive"
const TOKEN_AUDIENCE = "https://oauth2.googleapis.com/token"

type CachedToken = {
  token: string
  expiresAt: number
}

let cachedToken: CachedToken | null = null

const base64UrlEncode = (input: string | Buffer) => {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "")
}

const buildServiceAccountJwt = (email: string, privateKey: string) => {
  const now = Math.floor(Date.now() / 1000)
  const header = base64UrlEncode(JSON.stringify({ alg: "RS256", typ: "JWT" }))
  const claims = base64UrlEncode(
    JSON.stringify({
      iss: email,
      scope: DRIVE_SCOPE,
      aud: TOKEN_AUDIENCE,
      exp: now + 3600,
      iat: now,
    }),
  )

  const unsigned = `${header}.${claims}`
  const signer = createSign("RSA-SHA256")
  signer.update(unsigned)
  const signature = signer.sign(privateKey, "base64")
  const signatureUrlSafe = signature.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")

  return `${unsigned}.${signatureUrlSafe}`
}

export async function getServiceAccountAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.token
  }

  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
  const rawPrivateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY

  if (!clientEmail || !rawPrivateKey) {
    throw new Error("Missing Google Drive service account credentials")
  }

  const privateKey = rawPrivateKey.includes("\\n") ? rawPrivateKey.replace(/\\n/g, "\n") : rawPrivateKey
  const assertion = buildServiceAccountJwt(clientEmail, privateKey)

  const response = await fetch(TOKEN_AUDIENCE, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to get Drive token: ${error}`)
  }

  const data = (await response.json()) as { access_token: string; expires_in: number }
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  }

  return data.access_token
}

const driveRequest = async (path: string, options: RequestInit) => {
  const token = await getServiceAccountAccessToken()
  const response = await fetch(`https://www.googleapis.com/drive/v3/${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Drive API error (${path}): ${text}`)
  }

  return response.json()
}

const sanitizeFolderName = (name: string) => {
  const trimmed = name.trim()
  return trimmed.length === 0 ? `Carpeta_${Date.now()}` : trimmed.replace(/[\\/:*?"<>|]/g, "-").slice(0, 80)
}

export async function ensureClientDriveFolder(clientName: string, existingFolderId?: string): Promise<string> {
  if (existingFolderId) {
    return existingFolderId
  }

  const rootFolderId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID
  if (!rootFolderId) {
    throw new Error("Missing GOOGLE_DRIVE_ROOT_FOLDER_ID env variable")
  }

  const payload = await driveRequest("files", {
    method: "POST",
    body: JSON.stringify({
      name: sanitizeFolderName(clientName),
      mimeType: "application/vnd.google-apps.folder",
      parents: [rootFolderId],
    }),
  })

  return payload.id as string
}

export async function ensureCaseDriveFolder(
  caseLabel: string,
  clientFolderId: string,
  existingFolderId?: string,
): Promise<string> {
  if (existingFolderId) {
    return existingFolderId
  }

  const payload = await driveRequest("files", {
    method: "POST",
    body: JSON.stringify({
      name: sanitizeFolderName(caseLabel),
      mimeType: "application/vnd.google-apps.folder",
      parents: [clientFolderId],
    }),
  })

  return payload.id as string
}

export async function uploadFileToDrive(options: {
  buffer: Buffer
  fileName: string
  mimeType: string
  folderId: string
}): Promise<{ fileId: string; webViewLink?: string }> {
  const token = await getServiceAccountAccessToken()
  const metadata = {
    name: sanitizeFolderName(options.fileName),
    parents: [options.folderId],
  }

  const form = new FormData()
  form.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }))
  form.append("file", new Blob([options.buffer], { type: options.mimeType || "application/octet-stream" }))

  const response = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink,webContentLink",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: form,
    },
  )

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Failed to upload file to Drive: ${text}`)
  }

  const data = await response.json()
  return { fileId: data.id as string, webViewLink: data.webViewLink as string | undefined }
}
