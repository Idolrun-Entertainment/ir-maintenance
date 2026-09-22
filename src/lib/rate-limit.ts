import type { NextRequest } from "next/server"

/**
 * Fixed-window request counter for the two unauthenticated endpoints
 * (comment create, view increment).
 *
 * ponytail: in-process Map. State is per server instance, so a multi-instance
 * deploy multiplies the effective limit by the instance count -- move the
 * counter to Redis if this ever runs on more than one box.
 *
 * The key is the client IP taken from `x-forwarded-for`, which is only
 * trustworthy because the app sits behind a proxy that overwrites it. Direct
 * origin traffic could forge the header, so this bounds accidental and casual
 * abuse, not a determined attacker.
 */
type Window = { count: number; resetAt: number }

const windows = new Map<string, Window>()

// Bound the map so a stream of unique clients cannot grow it without limit.
const MAX_TRACKED_KEYS = 5_000

function clientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for") ?? ""
  return forwarded.split(",")[0]?.trim() || "unknown"
}

function sweep(now: number) {
  for (const [key, window] of windows) {
    if (now >= window.resetAt) {
      windows.delete(key)
    }
  }
}

/**
 * Records a hit and reports whether it is within the limit. Callers decide what
 * a refusal means: the comment endpoint rejects, the view counter silently
 * skips the increment.
 */
export function rateLimit(
  request: NextRequest,
  bucket: string,
  options: { limit: number; windowMs: number },
): boolean {
  const key = `${bucket}:${clientIp(request)}`
  const now = Date.now()
  const window = windows.get(key)

  if (!window || now >= window.resetAt) {
    if (windows.size >= MAX_TRACKED_KEYS) {
      sweep(now)
    }

    windows.set(key, { count: 1, resetAt: now + options.windowMs })
    return true
  }

  window.count += 1

  return window.count <= options.limit
}
