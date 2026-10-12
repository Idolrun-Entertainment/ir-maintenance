// Self-check for the comment body cap, the production admin allowlist, and
// image magic bytes.
//
// Run: pnpm tsx scripts/check-guards.ts
import assert from "node:assert/strict"

import { parseAdminEmails } from "../src/lib/admin-emails"
import { ValidationError } from "../src/lib/errors"
import { isRasterImage } from "../src/lib/image-bytes"
import { readCappedJson } from "../src/lib/read-capped-json"

const small = new Request("http://local/comments", {
  method: "POST",
  body: JSON.stringify({ name: "A", content: "Hi" }),
})
assert.deepEqual(await readCappedJson(small, 16_384), { name: "A", content: "Hi" })

// Content-Length is a lie. The cap is the bytes actually read.
const huge = new Request("http://local/comments", {
  method: "POST",
  body: "x".repeat(100),
  headers: { "content-length": "1" },
})
await assert.rejects(
  () => readCappedJson(huge, 16),
  (error: unknown) => {
    assert.ok(error instanceof ValidationError)
    assert.equal(error.message, "Comment is too large")
    return true
  },
)

const bad = new Request("http://local/comments", {
  method: "POST",
  body: "not-json",
})
await assert.rejects(
  () => readCappedJson(bad, 100),
  (error: unknown) => {
    assert.ok(error instanceof ValidationError)
    assert.equal(error.message, "Invalid JSON")
    return true
  },
)

assert.deepEqual(parseAdminEmails(undefined, "production"), [])
assert.deepEqual(parseAdminEmails(undefined, "development"), [
  "hello@idolrun.com",
  "dev@idolrun.com",
  "marketing@idolrun.com",
])
assert.deepEqual(
  parseAdminEmails(" Admin@Example.com , dev@idolrun.com ", "production"),
  ["admin@example.com", "dev@idolrun.com"],
)

const jpeg = new Uint8Array(12)
jpeg[0] = 0xff
jpeg[1] = 0xd8
jpeg[2] = 0xff
assert.equal(isRasterImage(jpeg), true)

const png = new Uint8Array(12)
png.set([0x89, 0x50, 0x4e, 0x47], 0)
assert.equal(isRasterImage(png), true)

const webp = new Uint8Array(12)
webp.set([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50])
assert.equal(isRasterImage(webp), true)

assert.equal(isRasterImage(new Uint8Array(12)), false)
assert.equal(isRasterImage(new Uint8Array([0xff, 0xd8])), false)

console.log("guard checks passed")
