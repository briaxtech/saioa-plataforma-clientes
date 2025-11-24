const STORAGE_KEY = "superadmin_token"

export function setSuperadminToken(token: string) {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEY, token)
}

export function getSuperadminToken() {
  if (typeof window === "undefined") return null
  return localStorage.getItem(STORAGE_KEY)
}

export function clearSuperadminToken() {
  if (typeof window === "undefined") return
  localStorage.removeItem(STORAGE_KEY)
}

export async function superadminFetch(url: string, init: RequestInit = {}) {
  const token = getSuperadminToken()
  const headers = new Headers(init.headers || {})
  headers.set("Content-Type", "application/json")
  if (token) headers.set("Authorization", `Bearer ${token}`)

  const res = await fetch(url, { ...init, headers })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const message = (data as any)?.error || "Request failed"
    throw new Error(message)
  }
  return data
}
