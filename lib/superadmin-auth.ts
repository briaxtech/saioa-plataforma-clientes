const SECRET = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || ""
const encoder = new TextEncoder()
const decoder = new TextDecoder()

function toBase64Url(bytes: Uint8Array) {
  const base64 =
    typeof Buffer !== "undefined"
      ? Buffer.from(bytes).toString("base64")
      : btoa(Array.from(bytes).map((b) => String.fromCharCode(b)).join(""))
  return base64.replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_")
}

function base64url(input: ArrayBuffer | Uint8Array | string) {
  const bytes =
    typeof input === "string"
      ? encoder.encode(input)
      : input instanceof ArrayBuffer
        ? new Uint8Array(input)
        : input
  return toBase64Url(bytes)
}

function base64urlToUint8(base64url: string) {
  let base64 = base64url.replace(/-/g, "+").replace(/_/g, "/")
  const padding = base64.length % 4
  if (padding) base64 += "=".repeat(4 - padding)
  if (typeof Buffer !== "undefined") {
    return new Uint8Array(Buffer.from(base64, "base64"))
  }
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
  return bytes
}

async function hmacSha256Base64Url(data: string) {
  if (!SECRET) throw new Error("Missing AUTH_SECRET/NEXTAUTH_SECRET")
  const webCrypto = typeof crypto !== "undefined" && crypto.subtle ? crypto : null
  if (!webCrypto) throw new Error("WebCrypto not available for HMAC signing")
  const key = await webCrypto.subtle.importKey("raw", encoder.encode(SECRET), { name: "HMAC", hash: "SHA-256" }, false, ["sign"])
  const signature = await webCrypto.subtle.sign("HMAC", key, encoder.encode(data))
  return base64url(new Uint8Array(signature))
}

export async function signSuperToken(payload: Record<string, any>, expiresInSeconds = 60 * 60 * 8) {
  if (!SECRET) throw new Error("Missing AUTH_SECRET/NEXTAUTH_SECRET")

  const header = { alg: "HS256", typ: "JWT" }
  const exp = Math.floor(Date.now() / 1000) + expiresInSeconds
  const fullPayload = { ...payload, exp }

  const headerPart = base64url(JSON.stringify(header))
  const payloadPart = base64url(JSON.stringify(fullPayload))
  const data = `${headerPart}.${payloadPart}`
  const signaturePart = await hmacSha256Base64Url(data)
  return `${data}.${signaturePart}`
}

export async function verifySuperToken(token?: string) {
  if (!token || !SECRET) return null
  const parts = token.split(".")
  if (parts.length !== 3) return null
  const [headerPart, payloadPart, signaturePart] = parts
  const data = `${headerPart}.${payloadPart}`
  const expected = await hmacSha256Base64Url(data)
  if (expected !== signaturePart) return null
  try {
    const decoded = decoder.decode(base64urlToUint8(payloadPart))
    const payload = JSON.parse(decoded)
    if (payload.exp && Date.now() / 1000 > payload.exp) return null
    return payload
  } catch (err) {
    return null
  }
}

export function getBearerToken(request: Request) {
  const auth = request.headers.get("authorization") || request.headers.get("Authorization")
  if (auth) {
    const [type, token] = auth.split(" ")
    if (type?.toLowerCase() === "bearer" && token) return token.trim()
  }
  const cookieToken =
    (request as any)?.cookies?.get?.("superadmin_token")?.value ||
    (request as any)?.cookies?.get?.("superadmin_token")
  if (cookieToken) return (typeof cookieToken === "string" ? cookieToken : `${cookieToken}`).trim() || null
  return null
}
