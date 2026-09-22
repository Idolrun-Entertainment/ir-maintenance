// Self-check for the fixed-window limiter guarding the two unauthenticated
// endpoints (comment create, view increment).
//
// Run: pnpm tsx scripts/check-rate-limit.ts
import assert from "node:assert/strict"

import { rateLimit } from "../src/lib/rate-limit"

// Only the header is read, so a bare object is enough to stand in for NextRequest.
function req(ip?: string) {
  return {
    headers: { get: (name: string) => (name === "x-forwarded-for" ? ip ?? null : null) },
  } as unknown as Parameters<typeof rateLimit>[0]
}

const minute = { limit: 3, windowMs: 60_000 }

// Within the limit, then over it.
const a = req("1.1.1.1")
assert.deepEqual([1, 2, 3, 4, 5].map(() => rateLimit(a, "t1", minute)), [
  true,
  true,
  true,
  false,
  false,
])

// Different IPs get their own windows.
assert.equal(rateLimit(req("2.2.2.2"), "t1", minute), true)

// So do different buckets for the same IP -- this is what keys views per blog.
assert.equal(rateLimit(a, "t2", minute), true)

// A proxy sends a chain; the originating client is the first entry.
assert.equal(rateLimit(req("3.3.3.3, 10.0.0.1"), "t3", { limit: 1, windowMs: 60_000 }), true)
assert.equal(rateLimit(req("3.3.3.3"), "t3", { limit: 1, windowMs: 60_000 }), false)

// A missing header must not merge every caller into one key by accident --
// they share the "unknown" bucket, which is the intended conservative default.
assert.equal(rateLimit(req(undefined), "t4", { limit: 1, windowMs: 60_000 }), true)
assert.equal(rateLimit(req(""), "t4", { limit: 1, windowMs: 60_000 }), false)

// The window expires: a zero-length window always admits the next call.
const b = req("4.4.4.4")
assert.equal(rateLimit(b, "t5", { limit: 1, windowMs: 0 }), true)
assert.equal(rateLimit(b, "t5", { limit: 1, windowMs: 0 }), true)

// The views bucket is a shared abuse ceiling, not a per-blog dedup: every blog
// on the page draws from one window per client.
const c = req("5.5.5.5")
const ceiling = { limit: 2, windowMs: 60_000 }
assert.equal(rateLimit(c, "views", ceiling), true)
assert.equal(rateLimit(c, "views", ceiling), true)
assert.equal(rateLimit(c, "views", ceiling), false)

console.log("rate-limit: all checks passed")
