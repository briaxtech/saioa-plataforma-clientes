const STORAGE_KEY = "superadmin_token"

export function setSuperadminToken(token: string) {
  // Deprecated: token ahora viaja en cookie HttpOnly; limpiamos cualquier copia previa en localStorage.
  clearSuperadminToken()
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

  // Compatibilidad: si existe token legado en localStorage, lo enviamos; el flujo actual depende de cookie HttpOnly.
  if (token) headers.set("Authorization", `Bearer ${token}`)

  const res = await fetch(url, { ...init, headers, credentials: "include" })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const message = (data as any)?.error || "Request failed"
    throw new Error(message)
  }
  return data
}
