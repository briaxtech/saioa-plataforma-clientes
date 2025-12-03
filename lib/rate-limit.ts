import type { NextRequest } from "next/server"

type Counter = { count: number; resetAt: number }

const DEFAULT_WINDOW_MS = 60 * 1000
const rateLimiterStore: Map<string, Counter> =
  (globalThis as any).__rateLimiterStore || new Map<string, Counter>()

if (!(globalThis as any).__rateLimiterStore) {
  ;(globalThis as any).__rateLimiterStore = rateLimiterStore
}

export function getClientIp(request: Pick<Request, "headers"> & Partial<NextRequest>) {
  const forwarded = request.headers.get("x-forwarded-for")
  if (forwarded) return forwarded.split(",")[0].trim()
  return (request as any).ip || "unknown"
}

export function checkRateLimit(options: { key: string; limit: number; windowMs?: number }) {
  const windowMs = options.windowMs ?? DEFAULT_WINDOW_MS
  const now = Date.now()
  const existing = rateLimiterStore.get(options.key)

  if (existing && existing.resetAt > now) {
    if (existing.count >= options.limit) {
      return { ok: false, retryAfter: Math.max(0, existing.resetAt - now) }
    }
    existing.count += 1
    rateLimiterStore.set(options.key, existing)
    return { ok: true, remaining: options.limit - existing.count, resetAt: existing.resetAt }
  }

  rateLimiterStore.set(options.key, { count: 1, resetAt: now + windowMs })
  return { ok: true, remaining: options.limit - 1, resetAt: now + windowMs }
}
